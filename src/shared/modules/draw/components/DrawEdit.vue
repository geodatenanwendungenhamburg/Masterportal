<script>
import {pointerMove} from "ol/events/condition.js";
import {Fill, Style, Text} from "ol/style.js";
import {convertColor} from "@shared/js/utils/convertColor.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import LayoutFrame from "@shared/modules/layoutFrame/components/LayoutFrame.vue";
import {mapActions, mapMutations} from "vuex";
import {markRaw} from "vue";
import undoRedoFeatures, {isDeleteAllMode} from "../js/undoRedoFeatures.js";
import IconButton from "../../buttons/components/IconButton.vue";
import ExportItem from "@shared/modules/exportItem/components/ExportItem.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import DrawEditAttributes from "./DrawEditAttributes.vue";

/**
 * Shared component that provides buttons to edit drawn features.
 * @module shared/modules/draw/DrawEdit
 * @vue-prop {String[]} [drawEdits=["deleteAll", "delete", "edit", "undo", "redo"] - The draw edits.
 * @vue-prop {Object} [drawIcons={delete: "bi-eraser-fill", deleteAll: "bi-trash", modify: "bi-tools", redo: "bi-arrow-right", undo: "bi-arrow-left"}] - The icons for edit buttons.
 * @vue-prop {ol/layer/Vector} layer - The vector layer for drawings.
 * @vue-prop {String} [selectedInteraction="draw"] - The selected interaction.
 * @vue-prop {Function} [setSelectedInteraction=null] - Setter for selected interaction.
 * @vue-data {ol/interaction/Select} - The current select interactions.
 * @vue-data {ol/interaction/Modify} - The current modify interaction.
 * @vue-data {Object} - The mapping object for edit interactions.
 * @vue-data {String} - The current mode.
 * @vue-data {ol/feature[]} - Contains the redo features.
 * @vue-data {ol/feature[]} - Contains the undo features.
 */
export default {
    name: "DrawEdit",
    components: {
        DrawEditAttributes,
        IconButton,
        LayoutFrame,
        ExportItem,
        InputText,
        SliderItem
    },
    props: {
        drawEdits: {
            type: Array,
            default () {
                return ["deleteAll", "delete", "edit", "undo", "redo", "editAttributes", "hide", "download"];
            }
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
            buttonsDisabled: false,
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
            exportData: null,
            localDrawIcons: {...this.drawIcons},
            drawLayerVisible: true,
            originalGeometry: null,
            redoing: false,
            pendingInnerCircleFeature: null,
            selectedTextFeature: null,
            editText: "",
            editFontSize: 16,
            editFont: "Arial",
            textClickHandler: null,
            editFillColor: "#000000",
            editFillTransparency: 0,
            activeEditKey: ""
        };
    },
    computed: {
        source () {
            return this.layer?.getSource();
        },
        features () {
            return this.source?.getFeatures() ?? [];
        }
    },
    watch: {
        selectedInteraction (selectedInteraction) {
            if (!this.drawEdits.includes(selectedInteraction)) {
                this.showFrame = false;
            }
            if (selectedInteraction !== "delete" && selectedInteraction !== "modify") {
                this.currentSelectInteractions.forEach(currentSelectInteraction => this.removeInteraction(currentSelectInteraction));
                this.currentSelectInteractions = [];
            }
            if (selectedInteraction !== "modify") {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
                if (this.textClickHandler) {
                    mapCollection.getMap("2D").un("singleclick", this.textClickHandler);
                    this.textClickHandler = null;
                    this.selectedTextFeature = null;
                }
            }
        },
        layer (layer) {
            if (layer !== null) {
                this.source.on("addfeature", event => {
                    if (!this.redoing) {
                        const attrs = event.feature.get("masterportal_attributes");

                        if (!attrs?.fromDrawTool) {
                            this.pendingInnerCircleFeature = markRaw(event.feature);
                            return;
                        }

                        if (this.pendingInnerCircleFeature !== null && attrs?.drawState?.circleOuterRadius !== undefined) {
                            this.nonReactiveUndoFeatures.push({
                                features: [this.pendingInnerCircleFeature, markRaw(event.feature)],
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
                                feature: markRaw(event.feature),
                                mode: "draw"
                            });
                        }
                        this.nonReactiveRedoFeatures = markRaw([]);
                    }
                });

                this.source.on("removefeature", event => {
                    if (!this.redoing) {
                        this.nonReactiveUndoFeatures.push({
                            feature: markRaw(event.feature),
                            mode: "delete"
                        });
                    }
                });

                this.source.on("clear", () => {
                    this.mode = "";
                });
            }
        }
    },
    unmounted () {
        this.currentSelectInteractions.forEach(currentSelectInteraction => this.removeInteraction(currentSelectInteraction));
        if (this.currentModifyInteraction) {
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction.dispose();
            this.currentModifyInteraction = null;
        }
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations(["setButtonsDisabled"]),
        undoRedoFeatures,
        isDeleteAllMode,
        convertColor,

        /**
         * Regulate the draw edit interactions.
         * @param {String} drawEdit The current draw edit.
         * @param {Object} event The event that triggered the interaction
         * @returns {void}
         */
        regulateEditInteraction (drawEdit, event) {
            this.showFrame = false;
            const iconRect = event.target.getBoundingClientRect();

            this.iconPosition = iconRect.left + iconRect.width / 2 - 23;
            this.mappingEditInteractions[drawEdit]();
        },

        /**
         * Regulate the draw edit delete interaction.
         * The previous select interactions are removed from the map and newly created select interactions are added.
         * @returns {void}
         */
        regulateDelete () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("delete");
            }

            this.currentSelectInteractions.forEach(currentSelectInteraction => this.removeInteraction(currentSelectInteraction));
            this.currentSelectInteractions = this.createSelectInteractions(this.layer);
            selectInteraction.removeSelectedFeature(this.currentSelectInteractions[0], this.source);
            this.currentSelectInteractions.forEach(currentSelectInteraction => this.addInteraction(currentSelectInteraction));
        },

        /**
         * Create the select interactions for delte features.
         * The first interaction is executed with a singleClick and is needed to delete a feature.
         * The second interaction is only used to highlight the feature on hover/pointermove.
         * @param {ol/layer/Vector} layer The vector layer for drawings.
         * @returns {ol/interaction/Select[]} The select interactions.
         */
        createSelectInteractions (layer) {
            return [
                selectInteraction.createSelectInteraction(layer),
                selectInteraction.createSelectInteraction(layer, pointerMove)
            ];
        },

        /**
         * Regulate the draw edit delete all (clear) interaction.
         * Disables the Layer watchers while running so that the push to nonReactiveUndoFeatures contains all features deleted and they don't get added multiple times.
         * If delete all was executed, all deleted features will be stored as array in nonReactiveUndoFeatures and nonReactiveRedoFeatures respectively.
         * @returns {void}
         */
        regulateDeleteAll () {
            this.redoing = true;
            this.mode = "deleteAll";

            this.nonReactiveUndoFeatures.push(this.source.getFeatures());
            this.source.clear();
            this.redoing = false;
        },

        /**
         * Regulate the draw edit modify interaction.
         * Sets up Watchers for ModifyEnd and ModifyStart to track the modifications for undo/redo.
         * The previous modify interaction is removed from the map and newly created modify interaction is added.
         * @returns {void}
         */
        regulateModify () {
            if (typeof this.setSelectedInteraction === "function") {
                console.warn("HE, regulateModify");
                this.setSelectedInteraction("modify");
            }
            this.removeInteraction(this.currentModifyInteraction);
            this.selectedTextFeature = null;
            const map = mapCollection.getMap("2D");

            this.textClickHandler = (event) => {
                let found = false;

                map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
                    if (layer === this.layer && feature.get("drawType") === "writeText") {
                        const fillColor = feature.get("textFillColor") || [0, 0, 0, 1];

                        this.selectedTextFeature = feature;
                        this.editText = feature.get("textContent") ?? "";
                        this.editFontSize = feature.get("textFontSize") ?? 16;
                        this.editFont = feature.get("textFont") ?? "Arial";
                        this.editFillColor = convertColor(fillColor.slice(0, 3), "hex");
                        this.editFillTransparency = Math.round((1 - (fillColor[3] ?? 1)) * 100);
                        found = true;
                        return true;
                    }
                    return false;
                }, {hitTolerance: 10});
                if (!found) {
                    this.selectedTextFeature = null;
                }
            };
            map.on("singleclick", this.textClickHandler);

            this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source,
                {
                    onModifyEnd: (event) => {
                        event.features.forEach(feature => {
                            console.warn("On Modify End");
                            const originalGeometry = this.originalGeometry,
                                modifiedGeometry = feature.getGeometry().clone();

                            this.nonReactiveUndoFeatures.push({
                                feature: markRaw(feature),
                                mode: "modify",
                                originalGeometry: markRaw(originalGeometry),
                                modifiedGeometry: markRaw(modifiedGeometry)
                            });
                            this.registerFeatures();
                        });
                        this.nonReactiveRedoFeatures = markRaw([]);
                    },
                    onModifyStart: (event) => {
                        console.warn("On Modify Start");
                        event.features.forEach(feature => {
                            this.originalGeometry = feature.getGeometry().clone();
                        });
                    }
                }
            );
            this.addInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction.setActive(true);
            console.warn("YOOO", this.currentModifyInteraction);
            this.showFrame = true;
        },

        /**
         * Regulate the draw edit undo.
         * @returns {void}
         */
        regulateUndo () {
            this.redoing = true;
            this.undoRedoFeatures(this.nonReactiveUndoFeatures, this.nonReactiveRedoFeatures, "undo", this.source);
            this.redoing = false;
        },

        /**
         * Regulate the draw edit redo.
         * @returns {void}
         */
        regulateRedo () {
            this.redoing = true;
            this.undoRedoFeatures(this.nonReactiveRedoFeatures, this.nonReactiveUndoFeatures, "redo", this.source);
            this.redoing = false;
        },

        /**
         * Regulates the undo redo features, if delete all was used.
         * A distinction is made between undo and redo.
         * With undo, the features are restored.
         * With redo, the features are deleted again.
         * @param {String} mode The undo or redo mode.
         * @param {ol/feature[]} features The undo or redo features.
         * @param {ol/source} source The vector layer.
         * @returns {void}
         */
        undoRedoDeleteAll (mode, features, source) {
            const featureArray = features.pop();

            this.mode = "deleteAll";

            if (mode === "undo") {
                source.addFeatures(featureArray);
                this.nonReactiveRedoFeatures.push(featureArray);
            }
            else if (mode === "redo") {
                featureArray.forEach(feat => source.removeFeature(feat));
                this.nonReactiveUndoFeatures.push(featureArray);
            }
            this.mode = "";
        },

        /**
         * Regulates the editing of attributes for features and opens the corresponding layoutFrame.
         * @returns {void}
         */
        regulateEditAttributes () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("editAttributes");
            }
            this.showFrame = true;
        },

        /**
         * Regulates Hide Function.
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
         * Enables the download interface.
         * @returns {void}
         */
        regulateDownload () {
            if (typeof this.setSelectedInteraction === "function") {
                this.setSelectedInteraction("download");
            }
            this.showFrame = true;
        },

        /**
         * Registers the features of the drawLayer to the data object features.
         * @returns {void}
         */
        registerFeatures () {
            this.features = [...mapCollection.getMap("2D").getLayers().getArray().find(availableLayer => availableLayer.get("id") === "importDrawLayer").getSource().getFeatures()];
        },

        /**
         * Toggles visibility of drawLayer.
         * @returns {void}
         */
        toggleDrawLayerVisibility () {
            const drawLayer = this.layer;

            if (drawLayer) {
                const isVisible = drawLayer.getVisible();

                this.localDrawIcons.hide = this.localDrawIcons.hide === "bi-eye" ? "bi-eye-slash" : "bi-eye";

                this.$store.commit("Modules/Draw/setButtonsDisabled", isVisible);
                this.drawLayerVisible = !isVisible;
                drawLayer.setVisible(!isVisible);
            }
        },
        applyTextEdit () {
            const feature = this.selectedTextFeature,
                alpha = 1 - (this.editFillTransparency / 100),
                colorArray = [...convertColor(this.editFillColor, "rgb"), alpha];

            if (!feature) {
                return;
            }
            const newStyle = new Style({
                text: new Text({
                    text: this.editText,
                    font: `${this.editFontSize}px ${this.editFont}`,
                    fill: new Fill({color: colorArray})
                })
            });

            feature.set("textFillColor", colorArray);
            feature.set("textContent", this.editText);
            feature.set("textFontSize", this.editFontSize);
            feature.set("textFont", this.editFont);
            feature.setStyle(newStyle);
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
                v-for="drawEdit in drawEdits"
                :id="'draw-edit-' + drawEdit"
                :key="drawEdit"
                :aria="$t('common:shared.modules.draw.drawEdit.' + drawEdit)"
                :class-array="[
                    'btn-light',
                    'me-3',
                    selectedInteraction === drawEdit ? 'active': '',
                    drawEdit === 'redo' && nonReactiveRedoFeatures.length === 0 ? 'disabled' : '',
                    drawEdit === 'undo' && nonReactiveUndoFeatures.length === 0 ? 'disabled' : '',
                    drawEdit !== 'redo' && drawEdit !== 'undo' && source?.getFeatures()?.length === 0 ? 'disabled' : '',
                    drawEdit !== 'hide' && !drawLayerVisible ? 'disabled': ''
                ]"
                :interaction="(event) => regulateEditInteraction(drawEdit, event)"
                :icon="localDrawIcons[drawEdit]"
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
                <div
                    v-if="selectedTextFeature"
                    class="mt-4"
                >
                    <InputText
                        id="draw-text-edit"
                        v-model="editText"
                        label="Text"
                        placeholder="Text eingeben"
                        type="text"
                    />
                    <select
                        v-model="editFontSize"
                        class="form-select mb-2"
                    >
                        <option
                            v-for="s in [10,12,14,16,18,20,24,28,32,36,40,48]"
                            :key="s"
                            :value="s"
                        >
                            {{ s }} px
                        </option>
                    </select>
                    <select
                        v-model="editFont"
                        class="form-select mb-2"
                    >
                        <option
                            v-for="f in ['Arial', 'Times New Roman', 'Calibri']"
                            :key="f"
                            :value="f"
                        >
                            {{ f }}
                        </option>
                    </select>
                    <div class="draw-layout-buttons d-flex flex-row align-items-center mb-2">
                        <div class="button-container text-center">
                            <button
                                id="draw-edit-fill-color"
                                class="btn btn-secondary"
                            >
                                <i
                                    class="bi-paint-bucket"
                                    role="img"
                                />
                                <span
                                    class="color-preview"
                                    :style="{ backgroundColor: editFillColor }"
                                />
                                <input
                                    type="color"
                                    class="color-input-overlay"
                                    :value="editFillColor"
                                    @input="event => editFillColor = event.target.value"
                                >
                            </button>
                            <span class="text-center btn-label">
                                {{ $t("common:shared.modules.draw.drawLayout.fillColor") }}
                            </span>
                        </div>
                        <div class="button-container text-center">
                            <button
                                id="draw-edit-fill-transparency"
                                :class="['btn', 'btn-secondary', activeEditKey === 'fillTransparency' ? 'active' : '']"
                                @click="activeEditKey = activeEditKey === 'fillTransparency' ? '' : 'fillTransparency'"
                            >
                                <i
                                    class="bi-droplet-half"
                                    role="img"
                                />
                                <span class="btn-value">{{ editFillTransparency + '%' }}</span>
                            </button>
                            <span class="text-center btn-label">
                                {{ $t("common:shared.modules.draw.drawLayout.fillTransparency") }}
                            </span>
                        </div>
                    </div>
                    <div
                        v-if="activeEditKey === 'fillTransparency'"
                        class="d-flex mb-2"
                    >
                        <SliderItem
                            id="slider-edit-fill-transparency"
                            :aria="`${editFillTransparency}%`"
                            :label="`${editFillTransparency}%`"
                            min="0"
                            max="100"
                            :value="editFillTransparency.toString()"
                            :step="1"
                            :interaction="event => editFillTransparency = parseInt(event.target.value)"
                        />
                    </div>
                    <button
                        class="btn btn-primary"
                        @click="applyTextEdit"
                    >
                        {{ $t("common:shared.modules.draw.drawEdit.textAccept") }}
                    </button>
                </div>
                <p v-else>
                    {{ $t("common:shared.modules.draw.drawEdit.chooseFeature") }}
                </p>
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

.draw-layout-buttons {
    flex-wrap: wrap;
}

.button-container {
    margin-right: 8px;
    margin-bottom: 4px;
}

.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.draw-layout-buttons .btn {
    width: 3.65rem;
    height: 3.65rem;
    position: relative;
    text-align: center;
    font-size: 1.143rem;
    border-radius: 50%;
}

</style>
