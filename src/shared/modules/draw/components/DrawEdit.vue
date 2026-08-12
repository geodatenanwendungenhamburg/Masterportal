<script>
import LayoutFrame from "@shared/modules/layoutFrame/components/LayoutFrame.vue";
import {mapActions, mapMutations} from "vuex";
import {markRaw} from "vue";
import {
    createSelectInteractions,
    setupDeleteInteraction,
    setupModifyInteraction,
    deleteAllFeatures,
    performUndo,
    performRedo,
    handleDeleteAll,
    toggleLayerVisibility,
    isDeleteAllMode
} from "../js/editInteractions.js";
import IconButton from "../../buttons/components/IconButton.vue";
import ExportItem from "@shared/modules/exportItem/components/ExportItem.vue";
import DrawEditAttributes from "./DrawEditAttributes.vue";
import DrawEditStyle from "./DrawEditStyle.vue";

const EXCLUDED_ATTRIBUTE_KEYS = new Set([
    "geometry",
    "masterportal_attributes",
    "source",
    "drawType",
    "textContent",
    "textFontSize",
    "textFont",
    "textFillColor"
]);

/**
 * Shared component that provides buttons to edit drawn features.
 * @module shared/modules/draw/DrawEdit
 * @vue-prop {String[]} [drawEdits=["deleteAll", "delete", "edit", "undo", "redo", "editAttributes", "hide", "download"]] - The available edit actions.
 * @vue-prop {Boolean} [showEditAttributesControl=true] - If false, removes only the "editAttributes" action from the toolbar.
 * @vue-prop {Object} drawIcons - The icons for edit buttons, keyed by action name.
 * @vue-prop {ol/layer/Vector} layer - The vector layer for drawings.
 * @vue-prop {String} [selectedInteraction="draw"] - The currently selected interaction mode.
 * @vue-prop {Function(string): void} [setSelectedInteraction=null] - Setter for the selected interaction mode.
 * @vue-data {ol/interaction/Select[]} currentSelectInteractions - The active select interactions.
 * @vue-data {ol/interaction/Modify|null} currentModifyInteraction - The active modify interaction.
 * @vue-data {Object[]} nonReactiveUndoFeatures - The undo feature stack (non-reactive for performance).
 * @vue-data {Object[]} nonReactiveRedoFeatures - The redo feature stack (non-reactive for performance).
 * @vue-data {Number} undoCount - Reactive count of undo entries for UI binding.
 * @vue-data {Number} redoCount - Reactive count of redo entries for UI binding.
 */
export default {
    name: "DrawEdit",
    components: {
        DrawEditAttributes,
        DrawEditStyle,
        IconButton,
        LayoutFrame,
        ExportItem
    },
    props: {
        drawEdits: {
            type: Array,
            default () {
                return ["deleteAll", "delete", "edit", "undo", "redo", "editAttributes", "hide", "download"];
            }
        },
        showEditAttributesControl: {
            type: Boolean,
            default: true
        },
        drawIcons: {
            type: Object,
            default () {
                return {
                    delete: "bi-eraser-fill",
                    deleteAll: "bi-trash",
                    modify: "bi-tools",
                    redo: "bi-arrow-right",
                    undo: "bi-arrow-left",
                    editAttributes: "bi-window-split",
                    hide: "bi-eye",
                    download: "bi-cloud-download"
                };
            }
        },
        layer: {
            type: Object || null,
            required: false,
            default: null
        },
        selectedInteraction: {
            type: String,
            default () {
                return "draw";
            }
        },
        setSelectedInteraction: {
            type: Function,
            default () {
                return null;
            }
        }
    },
    data () {
        return {
            currentSelectInteractions: [],
            currentModifyInteraction: null,
            mappingEditInteractions: {
                delete: this.regulateDelete,
                deleteAll: this.regulateDeleteAll,
                modify: this.regulateModify,
                redo: this.regulateRedo,
                undo: this.regulateUndo,
                editAttributes: this.regulateEditAttributes,
                hide: this.regulateHide,
                download: this.regulateDownload
            },
            mode: "",
            nonReactiveUndoFeatures: markRaw([]),
            nonReactiveRedoFeatures: markRaw([]),
            showFrame: false,
            iconPosition: 0,
            availableFormats: ["KML", "GEOJSON", "GPX", "CSV"],
            localDrawIcons: {...this.drawIcons},
            drawLayerVisible: true,
            redoing: false,
            pendingInnerCircleFeature: null,
            selectedEditFeature: null,
            featureClickHandler: null,
            modifyTooltipOverlay: null,
            modifyInteractionCleanup: null,
            sourceAddFeatureHandler: null,
            sourceRemoveFeatureHandler: null,
            sourceClearHandler: null,
            featureCounter: 1,
            undoCount: 0,
            redoCount: 0
        };
    },
    computed: {
        /**
         * Returns the 2D map instance.
         * @returns {module:ol/Map|undefined} The 2D map instance.
         */
        map2D () {
            return mapCollection.getMap("2D");
        },
        /**
         * Returns the vector source from the layer.
         * @returns {ol/source/Vector|undefined} The vector source.
         */
        source () {
            return this.layer?.getSource();
        },
        /**
         * Returns the features from the source.
         * @returns {ol/Feature[]} The features array.
         */
        features () {
            return this.source?.getFeatures() ?? [];
        },
        /**
         * Returns draw edit actions that should be rendered in the toolbar.
         * @returns {String[]} The visible draw edit actions.
         */
        visibleDrawEdits () {
            if (!Array.isArray(this.drawEdits)) {
                return [];
            }

            if (!this.showEditAttributesControl) {
                return this.drawEdits.filter(drawEdit => drawEdit !== "editAttributes");
            }

            return this.drawEdits;
        }
    },
    watch: {
        /**
         * Cleans up interactions when the selected interaction changes.
         * Closes the frame for non-edit interactions, removes select interactions
         * unless in delete/modify mode, and tears down the modify interaction
         * (including the text click handler) when leaving modify mode.
         * @param {String} selectedInteraction The new interaction mode.
         * @returns {void}
         */
        selectedInteraction (selectedInteraction) {
            if (!this.visibleDrawEdits.includes(selectedInteraction)) {
                this.showFrame = false;
            }
            if (selectedInteraction !== "delete" && selectedInteraction !== "modify") {
                this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));
                this.currentSelectInteractions = [];
            }
            if (selectedInteraction !== "modify") {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
                this.cleanupModifyInteractionArtifacts();
                this.selectedEditFeature = null;
            }
        },
        /**
         * Registers source event listeners once the layer becomes available.
         * @param {ol/layer/Vector} layer The vector layer for drawings.
         * @returns {void}
         */
        source (newSource, oldSource) {
            if (newSource === oldSource) {
                return;
            }
            this.unregisterSourceListeners(oldSource);
            this.registerSourceListeners(newSource);
        }
    },
    mounted () {
        this.registerSourceListeners(this.source);
    },
    unmounted () {
        this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));
        if (this.currentModifyInteraction) {
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
        }
        this.cleanupModifyInteractionArtifacts();
        this.unregisterSourceListeners();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/Draw", ["setButtonsDisabled"]),
        isDeleteAllMode,
        createSelectInteractions,

        /**
         * Registers event listeners on the vector source for tracking feature additions and removals.
         * @returns {void}
         */
        registerSourceListeners (source = this.source) {
            if (!source || this.sourceAddFeatureHandler || this.sourceRemoveFeatureHandler || this.sourceClearHandler) {
                return;
            }

            this.sourceAddFeatureHandler = (event) => {
                if (!this.redoing) {
                    this.handleFeatureAdded(event.feature);
                }
            };

            this.sourceRemoveFeatureHandler = (event) => {
                if (!this.redoing) {
                    this.nonReactiveUndoFeatures.push({
                        feature: markRaw(event.feature),
                        mode: "delete"
                    });
                    this.syncUndoRedoCounts();
                }
            };

            this.sourceClearHandler = () => {
                this.mode = "";
            };

            source.on("addfeature", this.sourceAddFeatureHandler);
            source.on("removefeature", this.sourceRemoveFeatureHandler);
            source.on("clear", this.sourceClearHandler);
        },

        /**
         * Removes event listeners from the vector source.
         * @param {ol/source/Vector} [source=this.source] Source to remove listeners from.
         * @returns {void}
         */
        unregisterSourceListeners (source = this.source) {
            if (!source) {
                return;
            }
            if (this.sourceAddFeatureHandler) {
                source.un("addfeature", this.sourceAddFeatureHandler);
                this.sourceAddFeatureHandler = null;
            }
            if (this.sourceRemoveFeatureHandler) {
                source.un("removefeature", this.sourceRemoveFeatureHandler);
                this.sourceRemoveFeatureHandler = null;
            }
            if (this.sourceClearHandler) {
                source.un("clear", this.sourceClearHandler);
                this.sourceClearHandler = null;
            }
        },

        /**
         * Cleans up map listeners and overlays created for modify interaction.
         * @returns {void}
         */
        cleanupModifyInteractionArtifacts () {
            if (typeof this.modifyInteractionCleanup === "function") {
                this.modifyInteractionCleanup();
                this.modifyInteractionCleanup = null;
            }
            else {
                if (this.modifyTooltipOverlay) {
                    this.map2D?.removeOverlay(this.modifyTooltipOverlay);
                }
                if (this.featureClickHandler) {
                    this.map2D?.un("singleclick", this.featureClickHandler);
                }
            }

            this.modifyTooltipOverlay = null;
            this.featureClickHandler = null;
        },

        /**
         * Handles a feature being added to the source, managing the undo stack
         * and grouping related circle features.
         * @param {ol/Feature} feature The added feature.
         * @returns {void}
         */
        handleFeatureAdded (feature) {
            this.syncKnownAttributeKeysToFeature(feature);

            const attrs = feature.get("masterportal_attributes");

            if (!attrs?.fromDrawTool) {
                if (!attrs) {
                    // Feature with no masterportal_attributes = inner circle of a double circle,
                    // added by the draw API before handleDrawEvent runs on the outer circle.
                    // Store it and wait for the outer circle to arrive.
                    this.pendingInnerCircleFeature = markRaw(feature);
                    return;
                }
                // Imported or otherwise non-draw-tool feature: flush any pending inner first.
                if (this.pendingInnerCircleFeature !== null) {
                    this.nonReactiveUndoFeatures.push({
                        feature: this.pendingInnerCircleFeature,
                        mode: "draw"
                    });
                    this.pendingInnerCircleFeature = null;
                }
                this.nonReactiveUndoFeatures.push({
                    feature: markRaw(feature),
                    mode: "draw"
                });
                this.syncUndoRedoCounts();
                return;
            }

            if (this.pendingInnerCircleFeature !== null && attrs?.drawState?.circleOuterRadius !== undefined) {
                // Fix the inner circle's live OL style zIndex so it renders above the outer ring.
                const outerZIndex = attrs.drawState.zIndex ?? 0;
                const innerStyle = this.pendingInnerCircleFeature.getStyle();

                if (innerStyle) {
                    innerStyle.setZIndex(outerZIndex + 1);
                    this.pendingInnerCircleFeature.setStyle(innerStyle);
                }
                this.nonReactiveUndoFeatures.push({
                    features: [this.pendingInnerCircleFeature, markRaw(feature)],
                    mode: "drawGroup"
                });
                this.pendingInnerCircleFeature = null;
            }
            else {
                if (this.pendingInnerCircleFeature !== null) {
                    this.nonReactiveUndoFeatures.push({
                        feature: this.pendingInnerCircleFeature,
                        mode: "draw"
                    });
                    this.pendingInnerCircleFeature = null;
                }
                this.nonReactiveUndoFeatures.push({
                    feature: markRaw(feature),
                    mode: "draw"
                });
            }
            this.nonReactiveRedoFeatures = markRaw([]);
            this.featureCounter++;
            this.syncUndoRedoCounts();
        },

        /**
         * Returns user-facing attribute keys currently known in the source.
         * @param {ol/Feature} [excludedFeature] Optional feature to exclude from key discovery.
         * @returns {String[]} Known attribute keys.
         */
        getKnownAttributeKeys (excludedFeature = undefined) {
            const keys = new Set();

            this.features.forEach(existingFeature => {
                if (existingFeature === excludedFeature) {
                    return;
                }
                Object.keys(existingFeature.getProperties()).forEach(key => {
                    if (!EXCLUDED_ATTRIBUTE_KEYS.has(key)) {
                        keys.add(key);
                    }
                });
            });

            return Array.from(keys);
        },

        /**
         * Syncs all known attribute keys to a newly added feature.
         * Missing keys are added with empty values.
         * @param {ol/Feature} feature Newly added feature.
         * @returns {void}
         */
        syncKnownAttributeKeysToFeature (feature) {
            if (!feature) {
                return;
            }

            const knownKeys = this.getKnownAttributeKeys(feature);
            const properties = feature.getProperties();

            knownKeys.forEach(key => {
                if (!Object.prototype.hasOwnProperty.call(properties, key)) {
                    feature.set(key, "");
                }
            });
        },

        /**
         * Dispatches to the appropriate edit interaction handler.
         * @param {String} drawEdit The current draw edit action name.
         * @param {Object} event The DOM event that triggered the interaction.
         * @returns {void}
         */
        regulateEditInteraction (drawEdit, event) {
            this.showFrame = false;
            const buttonWrapperElement = event.target.closest("button")?.parentElement || event.target,
                  containerElement = this.$el.querySelector(".draw-edit-container"),
                  wrapperRect = buttonWrapperElement.getBoundingClientRect(),
                  containerRect = containerElement ? containerElement.getBoundingClientRect() : {left: 0};

            this.iconPosition = wrapperRect.left + wrapperRect.width / 2 - containerRect.left;
            this.mappingEditInteractions[drawEdit]();
        },

        /**
         * Synchronizes the reactive undo/redo counts from the non-reactive stacks.
         * @returns {void}
         */
        syncUndoRedoCounts () {
            this.undoCount = this.nonReactiveUndoFeatures.length;
            this.redoCount = this.nonReactiveRedoFeatures.length;
        },

        /**
         * Activates the delete interaction for removing individual features.
         * @returns {void}
         */
        regulateDelete () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("delete");
            }

            this.currentSelectInteractions = setupDeleteInteraction({
                currentSelectInteractions: this.currentSelectInteractions,
                layer: this.layer,
                source: this.source,
                addInteraction: this.addInteraction,
                removeInteraction: this.removeInteraction
            });
        },

        /**
         * Clears all features from the source and records the operation for undo.
         * @returns {void}
         */
        regulateDeleteAll () {
            this.redoing = true;
            this.mode = "deleteAll";
            deleteAllFeatures(this.source, this.nonReactiveUndoFeatures);
            this.syncUndoRedoCounts();
            this.redoing = false;
        },

        /**
         * Activates the modify interaction for editing feature geometries and text.
         * @returns {void}
         */
        regulateModify () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("modify");
            }
            this.selectedEditFeature = null;
            this.cleanupModifyInteractionArtifacts();

            const result = setupModifyInteraction({
                currentModifyInteraction: this.currentModifyInteraction,
                source: this.source,
                layer: this.layer,
                undoFeatures: this.nonReactiveUndoFeatures,
                redoFeatures: this.nonReactiveRedoFeatures,
                addInteraction: this.addInteraction,
                removeInteraction: this.removeInteraction,
                onFeatureSelected: (feature) => {
                    this.selectedEditFeature = feature;
                },
                onModifyEnd: () => {
                    this.nonReactiveRedoFeatures = markRaw([]);
                    this.syncUndoRedoCounts();
                }
            });

            this.currentModifyInteraction = result.modifyInteraction;
            this.featureClickHandler = result.featureClickHandler;
            this.modifyTooltipOverlay = result.tooltipOverlay;
            this.modifyInteractionCleanup = result.cleanupModifyArtifacts;
            this.showFrame = true;
        },

        /**
         * Performs an undo operation.
         * @returns {void}
         */
        regulateUndo () {
            this.redoing = true;
            performUndo(this.nonReactiveUndoFeatures, this.nonReactiveRedoFeatures, this.source, this.undoRedoDeleteAll);
            this.syncUndoRedoCounts();
            this.redoing = false;
        },

        /**
         * Performs a redo operation.
         * @returns {void}
         */
        regulateRedo () {
            this.redoing = true;
            performRedo(this.nonReactiveRedoFeatures, this.nonReactiveUndoFeatures, this.source, this.undoRedoDeleteAll);
            this.syncUndoRedoCounts();
            this.redoing = false;
        },

        /**
         * Handles undo/redo when a deleteAll operation is on the stack.
         * Undo restores all features; redo removes them again.
         * @param {String} mode "undo" or "redo".
         * @param {Array} features The features stack containing the deleteAll entry.
         * @param {ol/source/Vector} source The vector source.
         * @returns {void}
         */
        undoRedoDeleteAll (mode, features, source) {
            this.mode = "deleteAll";
            handleDeleteAll(mode, features, source, this.nonReactiveUndoFeatures, this.nonReactiveRedoFeatures);
            this.mode = "";
            this.syncUndoRedoCounts();
        },

        /**
         * Opens the attribute editing frame.
         * @returns {void}
         */
        regulateEditAttributes () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("editAttributes");
            }
            this.showFrame = true;
        },

        /**
         * Toggles the draw layer visibility and updates the hide icon.
         * @returns {void}
         */
        regulateHide () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("hide");
            }
            if (!this.drawLayerVisible) {
                this.setSelectedInteraction("");
            }
            this.toggleDrawLayerVisibility();
        },

        /**
         * Opens the download/export frame.
         * @returns {void}
         */
        regulateDownload () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("download");
            }
            this.showFrame = true;
        },

        /**
         * Toggles visibility of the draw layer and updates related state.
         * @returns {void}
         */
        toggleDrawLayerVisibility () {
            if (!this.layer) {
                return;
            }

            const isVisible = this.layer.getVisible();

            this.localDrawIcons.hide = isVisible ? "bi-eye-slash" : "bi-eye";
            this.setButtonsDisabled(isVisible);
            this.drawLayerVisible = toggleLayerVisibility(this.layer);
        }
    }
};
</script>

<template>
    <div
        class="mb-4"
    >
        <div class="d-flex draw-edit-container">
            <IconButton
                v-for="drawEdit in visibleDrawEdits"
                :id="'draw-edit-' + drawEdit"
                :key="drawEdit"
                :aria="$t('common:shared.modules.draw.drawEdit.' + drawEdit)"
                :class-array="[
                    'btn-light',
                    'me-3',
                    selectedInteraction === drawEdit ? 'active': '',
                    drawEdit === 'redo' && redoCount === 0 ? 'disabled' : '',
                    drawEdit === 'undo' && undoCount === 0 ? 'disabled' : '',
                    drawEdit !== 'redo' && drawEdit !== 'undo' && source?.getFeatures()?.length === 0 ? 'disabled' : '',
                    drawEdit !== 'hide' && !drawLayerVisible ? 'disabled': ''
                ]"
                :interaction="(event) => regulateEditInteraction(drawEdit, event)"
                :icon="localDrawIcons[drawEdit]"
                :disabled="(drawEdit === 'redo' && redoCount === 0) || (drawEdit === 'undo' && undoCount === 0) || (drawEdit !== 'redo' && drawEdit !== 'undo' && source?.getFeatures()?.length === 0) || (drawEdit !== 'hide' && !drawLayerVisible)"
            />
        </div>
        <LayoutFrame
            v-if="showFrame"
            border-color="#D6E3FF"
            fill="#fff"
            triangle
            :triangle-position="iconPosition"
        >
            <ExportItem
                v-if="selectedInteraction === 'download'"
                :formats="availableFormats"
                :features="features"
            />
            <div v-if="selectedInteraction === 'modify'">
                <DrawEditStyle :selected-feature="selectedEditFeature" />
            </div>
            <DrawEditAttributes
                v-if="selectedInteraction === 'editAttributes'"
                :layer="layer"
            />
        </LayoutFrame>
        <hr>
    </div>
</template>

<style lang="scss" scoped>

.draw-edit-container {
    flex-wrap: wrap;
    > div {
        width: 35px;
        margin-bottom: 5px;
        margin-right: 5px;
    }
}

</style>
