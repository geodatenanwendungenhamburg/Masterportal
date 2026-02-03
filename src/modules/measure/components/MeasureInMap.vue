<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import VectorLayer from "ol/layer/Vector.js";
import {pointerMove} from "ol/events/condition.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import MeasureInMapTooltip from "./MeasureInMapTooltip.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import source from "../js/measureSource.js";
import getStyle from "../js/measureStyle.js";

/**
 * Measurement tool to measure lines and areas in the map.
 * @module modules/MeasureInMap
 * @vue-data {String} deleteIcon - The icon for the delete button.
 */
export default {
    name: "MeasureInMap",
    components: {
        MeasureInMapTooltip,
        FlatButton,
        IconButton
    },
    data () {
        return {
            deleteIcon: "bi-trash",
            measureEdits: ["deleteAll", "delete", "modify", "undo", "redo"],
            measureIcons: {
                delete: "bi-eraser-fill",
                deleteAll: "bi-trash",
                modify: "bi-tools",
                redo: "bi-arrow-right",
                undo: "bi-arrow-left"
            },
            currentSelectInteractions: [],
            currentModifyInteraction: null,
            selectedEditInteraction: null,
            currentSketch: null,
            drawingPointHistory: [],
            mode: "",
            redoFeatures: [],
            undoFeatures: []
        };
    },
    computed: {
        ...mapGetters("Modules/Measure", [
            "featureId",
            "tooltipCoord",
            "interaction",
            "color",
            "source",
            "layer",
            "lines",
            "polygons",
            "geometryValues",
            "lineStringUnits",
            "polygonUnits",
            "selectedGeometry",
            "selectedLineStringUnit",
            "selectedPolygonUnit",
            "currentUnits"
        ]),
        ...mapGetters(["uiStyle"]),
        ...mapGetters("Maps", ["mode"])
    },
    watch: {
        mode () {
            if (this.selectedEditInteraction) {
                return;
            }

            this.removeIncompleteDrawing();
            this.removeDrawInteraction();
            this.createDrawInteraction();
            this.setFocusToFirstControl();
        },
        /**
         * Recreates draw interaction on geometry type update.
         * @returns {void}
         */
        selectedGeometry () {
            this.createDrawInteraction();
        }
    },
    created () {
        this.setLayer(new VectorLayer({
            source,
            id: "measureLayer",
            name: "measureLayer",
            style: getStyle(this.color),
            alwaysOnTop: true
        }));
        this.$store.dispatch("Maps/checkLayer", this.layer).then((layerExists) => {
            if (!layerExists) {
                this.$store.dispatch("Maps/addLayer", this.layer);
            }
        });

    },
    mounted () {
        this.createDrawInteraction();
        this.setFocusToFirstControl();

        this.$watch("interaction", (newInteraction) => {
            if (newInteraction && newInteraction.on) {

                newInteraction.on("drawstart", (evt) => {
                    this.currentSketch = evt.feature;
                    this.drawingPointHistory = [];
                });

                newInteraction.on("drawend", () => {
                    this.currentSketch = null;
                    this.drawingPointHistory = [];
                });
            }
        }, {immediate: true});

        this.source.on("addfeature", event => {
            const isBeingDrawn = event.feature.get("isBeingDrawn");
            const featureId = event.feature.get("featureId");
            const hasFeatureId = featureId !== undefined;

            if (hasFeatureId) {
                return;
            }

            if (isBeingDrawn === false && this.mode === "") {
                this.shiftUndoRedoFeatures(event.feature, "draw", this.mode);
            }
        });

        this.source.on("removefeature", event => {
            const featureId = event.feature.get("featureId");
            const hasFeatureId = featureId !== undefined;

            if (hasFeatureId) {
                return;
            }

            this.shiftUndoRedoFeatures(event.feature, "delete", this.mode);
        });

        this.source.on("clear", () => {
            this.mode = "";
        });
    },
    unmounted () {
        this.removeIncompleteDrawing();
        this.removeDrawInteraction();
        this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));
        if (this.currentModifyInteraction) {
            this.removeInteraction(this.currentModifyInteraction);
        }
    },
    methods: {
        ...mapMutations("Modules/Measure", ["setSelectedGeometry", "setSelectedLineStringUnit", "setSelectedPolygonUnit", "setLayer"]),
        ...mapActions("Modules/Measure", ["deleteFeatures", "createDrawInteraction", "removeIncompleteDrawing", "removeDrawInteraction"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs["measure-tool-geometry-select"] && !this.$refs["measure-tool-geometry-select"].disabled) {
                    this.$refs["measure-tool-geometry-select"].focus();
                }
                else if (this.$refs["measure-tool-unit-select"]) {
                    this.$refs["measure-tool-unit-select"].focus();
                }
            });
        },
        /**
         * removes the last drawing if it has not been completed
         * @return {void}
         */
        removeIncompleteDrawing () {
            const feature = this.lines[this.featureId] || this.polygons[this.featureId];

            if (feature && feature.get("isBeingDrawn")) {
                const layerSource = this.layer.getSource();

                if (layerSource.getFeatures().length > 0) {
                    const actualFeature = layerSource.getFeatures().slice(-1)[0];

                    layerSource.removeFeature(actualFeature);
                }
            }
        },
        isDefaultStyle () {
            return this.uiStyle !== "SIMPLE" && this.uiStyle !== "TABLE";
        },
        is3DMode () {
            return this.mode === "3D";
        },
        setSelectedUnit (value) {
            if (this.selectedGeometry === "LineString") {
                this.setSelectedLineStringUnit(value);
            }
            else {
                this.setSelectedPolygonUnit(value);
            }
        },

        /**
         * Regulate the measure edit interactions.
         * @param {String} measureEdit The current measure edit.
         * @returns {void}
         */
        regulateEditInteraction (measureEdit) {

            const mappingEditInteractions = {
                delete: this.regulateDelete,
                deleteAll: this.regulateDeleteAll,
                modify: this.regulateModify,
                redo: this.regulateRedo,
                undo: this.regulateUndo
            };

            mappingEditInteractions[measureEdit]();
        },

        /**
         * Regulate the measure delete interaction.
         * The previous select interactions are removed from the map and newly created select interactions are added.
         * Clears undo/redo stacks when user deletes individual features.
         * After deleting, returns to draw mode.
         * @returns {void}
         */
        regulateDelete () {
            this.selectedEditInteraction = "delete";
            this.mode = "delete";

            this.undoFeatures = [];
            this.redoFeatures = [];

            this.removeIncompleteDrawing();
            this.removeDrawInteraction();

            this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));

            this.$nextTick(() => {
                this.currentSelectInteractions = this.createSelectInteractions(this.layer);

                const selectInteractionInstance = this.currentSelectInteractions[0];
                const removeHandler = selectInteractionInstance.on("select", (evt) => {
                    if (evt.selected.length > 0) {
                        const selectedFeature = evt.selected[0];
                        const featureId = selectedFeature.ol_uid;

                        this.removeTooltipForFeature(featureId);

                        setTimeout(() => {
                            this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));
                            this.currentSelectInteractions = [];
                            this.selectedEditInteraction = "";
                            this.mode = "";
                            this.createDrawInteraction();
                            selectInteractionInstance.un("select", removeHandler);
                        }, 100);
                    }
                });

                selectInteraction.removeSelectedFeature(selectInteractionInstance, this.source);
                this.currentSelectInteractions.forEach(interaction => this.addInteraction(interaction));
            });
        },

        /**
         * Create the select interactions for deleting features.
         * The first interaction is executed with a singleClick and is needed to delete a feature.
         * The second interaction is only used to highlight the feature on hover/pointermove.
         * @param {ol/layer/Vector} layer The vector layer for measurements.
         * @returns {ol/interaction/Select[]} The select interactions.
         */
        createSelectInteractions (layer) {
            return [
                selectInteraction.createSelectInteraction(layer),
                selectInteraction.createSelectInteraction(layer, pointerMove)
            ];
        },

        /**
         * Regulate the measure delete all (clear) interaction.
         * Clears all measurements and undo/redo stacks - user should redraw.
         * After deleting, restores draw mode.
         * @returns {void}
         */
        regulateDeleteAll () {
            this.mode = "deleteAll";

            this.removeDrawInteraction();

            this.undoFeatures = [];
            this.redoFeatures = [];

            this.deleteFeatures();

            setTimeout(() => {
                this.selectedEditInteraction = "";
                this.mode = "";
                this.createDrawInteraction();
            }, 100);
        },

        /**
         * Regulate the measure modify interaction.
         * The previous modify interaction is removed from the map and newly created modify interaction is added.
         * Measurements are recalculated when features are modified.
         * @returns {void}
         */
        regulateModify () {
            this.selectedEditInteraction = "modify";

            this.removeDrawInteraction();

            if (this.currentModifyInteraction) {
                this.removeInteraction(this.currentModifyInteraction);
            }

            this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);

            this.currentModifyInteraction.on("modifyend", (event) => {
                event.features.forEach(feature => {
                    const featureId = feature.ol_uid;

                    if (this.lines[featureId] || this.polygons[featureId]) {
                        this.$store.commit("Modules/Measure/addFeature", feature);
                    }
                });
            });

            this.addInteraction(this.currentModifyInteraction);
        },

        /**
         * Regulate the measure undo.
         * @returns {void}
         */
        regulateUndo () {
            if (this.currentSketch) {
                this.undoLastPointInSketch();
            }
            else if (this.undoFeatures.length > 0) {
                const lastItem = this.undoFeatures[this.undoFeatures.length - 1];

                if (lastItem.feature && lastItem.mode === "draw" && this.canRemovePointFromFeature(lastItem.feature)) {
                    this.removeLastPointFromFeature(lastItem.feature);
                }
                else {
                    this.redoFeatures = [];
                    this.undoRedoFeatures(this.undoFeatures, "undo", true);
                }
            }

        },

        /**
         * Regulate the measure redo.
         * @returns {void}
         */
        regulateRedo () {
            if (this.redoFeatures.length > 0) {
                const lastItem = this.redoFeatures[this.redoFeatures.length - 1];

                if (lastItem.mode === "addPoint") {
                    this.redoAddPoint(lastItem);
                }
                else {
                    this.undoRedoFeatures(this.redoFeatures, "redo");
                }
            }
        },

        /**
         * Redoes a point addition (adds back a removed point).
         * @param {Object} redoItem The redo item containing feature and point info.
         * @returns {void}
         */
        redoAddPoint (redoItem) {
            const {feature, point, geometryType} = redoItem;
            const geometry = feature.getGeometry();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                coordinates.push(point);
                geometry.setCoordinates(coordinates);

                this.$store.commit("Modules/Measure/setTooltipCoord", point);
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                coordinates.splice(coordinates.length - 1, 0, point);
                geometry.setCoordinates([coordinates]);

                this.$store.commit("Modules/Measure/setTooltipCoord", point);
            }

            this.redoFeatures.pop();

            this.$store.commit("Modules/Measure/addFeature", feature);
        },

        /**
         * Removes the last point from the currently drawn sketch.
         * @returns {void}
         */
        undoLastPointInSketch () {
            if (!this.currentSketch) {
                return;
            }

            const geometry = this.currentSketch.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                if (coordinates.length > 2) {
                    const removedPoint = coordinates.pop();

                    this.drawingPointHistory.push({type: "point", coord: removedPoint});
                    geometry.setCoordinates(coordinates);
                }
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];


                if (coordinates.length > 4) {
                    const removedPoint = coordinates[coordinates.length - 2];

                    this.drawingPointHistory.push({type: "point", coord: removedPoint});
                    coordinates.splice(coordinates.length - 2, 1);
                    geometry.setCoordinates([coordinates]);
                }
            }
        },

        /**
         * Checks if a point can be removed from a completed feature (maintains minimum points).
         * @param {ol/Feature} feature The feature to check.
         * @returns {Boolean} True if a point can be removed.
         */
        canRemovePointFromFeature (feature) {
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                return coordinates.length > 2;
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                return coordinates.length > 4;
            }

            return false;
        },

        /**
         * Removes the last point from a completed feature and updates measurements.
         * @param {ol/Feature} feature The feature to modify.
         * @returns {void}
         */
        removeLastPointFromFeature (feature) {
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                if (coordinates.length > 2) {
                    const removedPoint = coordinates.pop();

                    this.redoFeatures.push({
                        feature: feature,
                        mode: "addPoint",
                        point: removedPoint,
                        geometryType: "LineString"
                    });

                    geometry.setCoordinates(coordinates);

                    const newLastCoord = coordinates[coordinates.length - 1];

                    this.$store.commit("Modules/Measure/setTooltipCoord", newLastCoord);
                    this.$store.commit("Modules/Measure/addFeature", feature);
                }
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];


                if (coordinates.length > 4) {
                    const removedPoint = coordinates[coordinates.length - 2];

                    this.redoFeatures.push({
                        feature: feature,
                        mode: "addPoint",
                        point: removedPoint,
                        geometryType: "Polygon"
                    });

                    coordinates.splice(coordinates.length - 2, 1);
                    geometry.setCoordinates([coordinates]);

                    const newLastCoord = coordinates[coordinates.length - 2];

                    this.$store.commit("Modules/Measure/setTooltipCoord", newLastCoord);
                    this.$store.commit("Modules/Measure/addFeature", feature);
                }
            }
        },

        /**
         * Regulates the undo or redo features,
         * depending on whether the last feature was drawn, deleted or is an array of features (delete all).
         * @param {Array} features The undo or redo features.
         * @param {String} mode The undo or redo mode.
         * @param {Boolean} clearRedo If true, prevents adding the feature to redoFeatures (used when removing a feature completely after point-by-point undo).
         * @returns {void}
         */
        undoRedoFeatures (features, mode, clearRedo = false) {
            if (features.length > 0) {
                const feature = features[features.length - 1];

                this.mode = mode;

                if (this.isDeleteAllMode(feature)) {
                    this.undoRedoDeleteAll(mode, features, this.source);
                }
                else if (feature.mode === "draw") {
                    if (mode === "undo") {
                        const featureId = feature.feature.ol_uid;

                        this.removeTooltipForFeature(featureId);

                        this.redoFeatures = this.redoFeatures.filter(item => item.mode !== "addPoint");

                        this.mode = "deleteFeatureNoRedo";
                        this.source.removeFeature(feature.feature);
                        this.mode = mode;
                    }
                    else if (mode === "redo") {
                        const featureExists = this.source.getFeatures().includes(feature.feature);

                        if (!featureExists) {
                            this.source.addFeature(feature.feature);
                        }
                    }
                }
                else if (feature.mode === "delete") {
                    if (mode === "undo") {
                        const featureExists = this.source.getFeatures().includes(feature.feature);

                        if (!featureExists) {
                            this.source.addFeature(feature.feature);
                        }
                    }
                    else if (mode === "redo") {
                        const featureId = feature.feature.ol_uid;

                        this.removeTooltipForFeature(featureId);

                        this.source.removeFeature(feature.feature);
                    }
                }

                if (mode === "undo" && this.undoFeatures.length > 0) {
                    this.undoFeatures.pop();
                    if (!clearRedo) {
                        this.redoFeatures.push(feature);
                    }
                }
                else if (mode === "redo" && this.redoFeatures.length > 0) {
                    this.redoFeatures.pop();
                    this.undoFeatures.push(feature);
                }

                this.mode = "";
            }
        },

        /**
         * Removes the tooltip/label feature for a given measurement feature.
         * @param {Number} featureId The ol_uid of the measurement feature.
         * @returns {void}
         */
        removeTooltipForFeature (featureId) {
            const previousMode = this.mode;

            this.mode = "removingTooltip";

            const featuresToRemove = [];

            this.source.forEachFeature(f => {
                const tooltipFeatureId = f.get("featureId");

                if (tooltipFeatureId === featureId) {
                    featuresToRemove.push(f);
                }
            });

            featuresToRemove.forEach(f => {
                this.source.removeFeature(f);
            });

            this.mode = previousMode;
        },

        /**
         * Checks if the feature was created by the edit function deleteAll.
         * @param {ol/feature|ol/feature[]} feature The undo or redo feature.
         * @returns {Boolean} The feature is an array of features or not.
         */
        isDeleteAllMode (feature) {
            return Array.isArray(feature);
        },

        /**
         * Regulates the undo redo features, if delete all was used.
         * With undo, the features are restored.
         * With redo, the features are deleted again.
         * @param {String} mode The undo or redo mode.
         * @param {Array} features The undo or redo features.
         * @param {ol/source} vectorSource The vector source.
         * @returns {void}
         */
        undoRedoDeleteAll (mode, features, vectorSource) {
            const featureArray = features.pop();

            this.mode = "deleteAll";

            if (mode === "undo") {
                vectorSource.addFeatures(featureArray);
                this.redoFeatures.push(featureArray);
            }
            else if (mode === "redo") {
                featureArray.forEach(feat => vectorSource.removeFeature(feat));
                this.undoFeatures.push(featureArray);
            }
            this.mode = "";
        },

        /**
         * Changes the position of features in undo and redo feature collections.
         * The shift is determined based on the triggered edit mode.
         * @param {ol/feature} feature The ol feature.
         * @param {String} featureMode Mode of the feature, possible modes are draw or delete.
         * @param {String} editMode Editing mode that was executed.
         * @returns {void}
         */
        shiftUndoRedoFeatures (feature, featureMode, editMode) {
            if (editMode === "deleteFeatureNoRedo") {
                return;
            }

            const undoRedoFeature = {
                feature: feature,
                mode: featureMode
            };

            if (editMode === "undo") {
                this.mode = "";
                this.undoFeatures.pop();
                this.redoFeatures.push(undoRedoFeature);
            }
            else if (editMode === "redo") {
                this.mode = "";
                this.redoFeatures.pop();
                this.undoFeatures.push(undoRedoFeature);
            }
            else if (editMode === "") {
                this.undoFeatures.push(undoRedoFeature);
                this.redoFeatures = [];
            }

        }
    }
};
</script>

<template lang="html">
    <div id="measure">
        <MeasureInMapTooltip />

        <!-- Edit toolbar for undo/redo/modify -->
        <div
            v-if="source?.getFeatures()?.length > 0 || undoFeatures.length > 0 || redoFeatures.length > 0"
            class="mb-3"
        >
            <div class="d-flex">
                <IconButton
                    v-for="measureEdit in measureEdits"
                    :id="'measure-edit-' + measureEdit"
                    :key="measureEdit"
                    :aria="$t('common:modules.measure.edit.' + measureEdit)"
                    :class-array="[
                        'btn-light',
                        'me-3',
                        selectedEditInteraction === measureEdit ? 'active': '',
                        (measureEdit === 'redo' && redoFeatures.length === 0) ||
                            (measureEdit === 'undo' && undoFeatures.length === 0) ||
                            (measureEdit !== 'redo' && measureEdit !== 'undo' && source?.getFeatures()?.length === 0) ? 'disabled' : ''
                    ].filter(c => c)"
                    :interaction="() => regulateEditInteraction(measureEdit)"
                    :icon="measureIcons[measureEdit]"
                />
            </div>
            <hr>
        </div>

        <div class="form-floating mb-3">
            <select
                id="measure-tool-geometry-select"
                ref="measure-tool-geometry-select"
                class="form-select"
                aria-label="..."
                :disabled="is3DMode()"
                :value="selectedGeometry"
                @change="setSelectedGeometry($event.target.value)"
            >
                <option
                    v-for="geometryValue in geometryValues"
                    :key="'measure-tool-geometry-select-' + geometryValue"
                    :value="geometryValue"
                >
                    {{ is3DMode()
                        ? "3D"
                        : $t("common:modules.measure." +
                            (geometryValue === "LineString" ? "stretch" : "area"))
                    }}
                </option>
            </select>
            <label for="measure-tool-geometry-select">
                {{ $t("common:modules.measure.geometry") }}
            </label>
        </div>

        <div class="form-floating">
            <select
                id="measure-tool-unit-select"
                ref="measure-tool-unit-select"
                class="form-select"
                :disabled="is3DMode()"
                aria-label="..."
                :value="selectedGeometry === 'LineString' ? selectedLineStringUnit : selectedPolygonUnit"
                @change="setSelectedUnit($event.target.value)"
            >
                <option
                    v-for="(unit, i) in currentUnits"
                    :key="'measure-tool-unit-select-' + i"
                    :value="i"
                >
                    {{ unit }}
                </option>
            </select>
            <label for="measure-tool-unit-select">
                {{ $t("common:modules.measure.measure") }}
            </label>
        </div>
        <div class="d-flex justify-content-center my-3">
            <FlatButton
                id="measure-delete"
                aria-label="$t('common:modules.measure.deleteMeasurements')"
                :interaction="regulateDeleteAll"
                :text="$t('common:modules.measure.deleteMeasurements')"
                :icon="deleteIcon"
            />
        </div>
        <div
            v-if="isDefaultStyle()"
        >
            <div
                id="accordionFlushExample"
                class="accordion accordion-flush"
            >
                <div class="accordion-item">
                    <h2
                        id="flush-headingOne"
                        class="accordion-header"
                    >
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#flush-collapseOne"
                            aria-expanded="false"
                            aria-controls="flush-collapseOne"
                        >
                            <i class="bi-info-circle-fill me-2" />
                            {{ $t("common:modules.coordToolkit.info") }}
                        </button>
                    </h2>
                    <div
                        id="flush-collapseOne"
                        class="accordion-collapse collapse"
                        aria-labelledby="flush-headingOne"
                        data-bs-parent="#accordionFlushExample"
                    >
                        <div class="accordion-body inaccuracy-list">
                            {{ $t("common:modules.measure.influenceFactors") }}
                            <ul>
                                <li>{{ $t("common:modules.measure.scale") }}</li>
                                <li>{{ $t("common:modules.measure.resolution") }}</li>
                                <li>{{ $t("common:modules.measure.screenResolution") }}</li>
                                <li>{{ $t("common:modules.measure.inputAccuracy") }}</li>
                                <li>{{ $t("common:modules.measure.measureDistance") }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
