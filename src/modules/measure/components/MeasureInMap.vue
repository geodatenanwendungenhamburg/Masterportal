<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import VectorLayer from "ol/layer/Vector.js";
import Collection from "ol/Collection.js";
import {Modify} from "ol/interaction.js";
import {pointerMove} from "ol/events/condition.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import MeasureInMapTooltip from "./MeasureInMapTooltip.vue";
import MeasureList from "./MeasureList.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
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
        MeasureList,
        FlatButton
    },
    data () {
        return {
            deleteIcon: "bi-trash",
            measureEdits: ["delete", "modify", "undo", "redo"],
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
            featureHistories: {},
            currentlyModifyingFeatureId: null
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
            "currentUnits",
            "measurementList"
        ]),
        ...mapGetters(["uiStyle"]),
        ...mapGetters("Maps", ["mode"]),

        /**
         * Enriches measurement list with per-feature undo/redo state
         * @returns {Array} Measurement list with canUndo/canRedo properties
         */
        enrichedMeasurementList () {
            return this.measurementList.map(measurement => {
                const featureId = measurement.id;
                const normalizedId = this.normalizeFeatureId(featureId);
                const history = this.featureHistories[normalizedId];

                return {
                    ...measurement,
                    canUndo: history ? history.undo.length > 0 : false,
                    canRedo: history ? history.redo.length > 0 : false
                };
            });
        }
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
        },
        /**
         * Ensures all measurements have a history entry
         * @returns {void}
         */
        measurementList: {
            handler (newList) {
                newList.forEach(measurement => {
                    const featureId = measurement.id;
                    const normalizedId = this.normalizeFeatureId(featureId);

                    if (!this.featureHistories[normalizedId]) {
                        this.featureHistories[normalizedId] = {
                            undo: [],
                            redo: []
                        };
                    }
                });
            },
            immediate: true
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

                newInteraction.on("drawend", (evt) => {
                    const featureId = evt.feature.ol_uid;
                    const geometry = evt.feature.getGeometry();
                    const geometryType = geometry.getType();
                    const history = this.getFeatureHistory(featureId);

                    let coordinates;

                    if (geometryType === "LineString") {
                        coordinates = geometry.getCoordinates();
                    }
                    else if (geometryType === "Polygon") {
                        coordinates = geometry.getCoordinates()[0].slice(0, -1);
                    }

                    if (coordinates && coordinates.length > 2) {
                        for (let i = 2; i < coordinates.length; i++) {
                            history.undo.push({
                                mode: "addPoint",
                                timestamp: Date.now(),
                                data: {
                                    point: coordinates[i],
                                    pointIndex: i,
                                    geometryType: geometryType
                                }
                            });
                        }
                    }

                    history.redo = [];

                    this.currentSketch = null;
                    this.drawingPointHistory = [];
                });
            }
        }, {immediate: true});
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
         * Normalizes feature ID to Number type for consistent handling
         * @param {String|Number} id - The feature ID to normalize
         * @returns {Number} Normalized feature ID as Number
         */
        normalizeFeatureId (id) {
            return typeof id === "string" ? parseInt(id, 10) : id;
        },

        /**
         * Gets or creates history object for a feature
         * @param {String|Number} featureId - ol_uid of feature
         * @returns {Object} {undo: [], redo: []}
         */
        getFeatureHistory (featureId) {
            const normalizedId = this.normalizeFeatureId(featureId);

            if (!this.featureHistories[normalizedId]) {
                this.featureHistories[normalizedId] = {
                    undo: [],
                    redo: []
                };
            }
            return this.featureHistories[normalizedId];
        },

        /**
         * Adds an undo entry for a specific feature
         * @param {String|Number} featureId - The feature ID
         * @param {Object} historyEntry - The history entry to add
         * @returns {void}
         */
        addUndoForFeature (featureId, historyEntry) {
            const history = this.getFeatureHistory(featureId);

            history.undo.push(historyEntry);
            history.redo = [];
        },

        /**
         * Checks if feature can undo
         * @param {String|Number} featureId - The feature ID
         * @returns {Boolean} True if undo is available
         */
        canUndoFeature (featureId) {
            const normalizedId = this.normalizeFeatureId(featureId);
            const history = this.featureHistories[normalizedId];

            return history && history.undo.length > 0;
        },

        /**
         * Checks if feature can redo
         * @param {String|Number} featureId - The feature ID
         * @returns {Boolean} True if redo is available
         */
        canRedoFeature (featureId) {
            const normalizedId = this.normalizeFeatureId(featureId);
            const history = this.featureHistories[normalizedId];

            return history && history.redo.length > 0;
        },

        /**
         * Cleans up history when feature is deleted
         * @param {String|Number} featureId - The feature ID
         * @returns {void}
         */
        deleteFeatureHistory (featureId) {
            const normalizedId = this.normalizeFeatureId(featureId);

            delete this.featureHistories[normalizedId];
        },

        /**
         * Gets a feature by its ID
         * @param {String} featureId - The ol_uid of the feature
         * @returns {ol/Feature|undefined} The feature or undefined
         */
        getFeatureById (featureId) {
            const allFeatures = this.source.getFeatures();
            const normalizedId = this.normalizeFeatureId(featureId);

            return allFeatures.find(f => this.normalizeFeatureId(f.ol_uid) === normalizedId);
        },

        /**
         * Updates the tooltip position for a specific feature
         * @param {ol/Feature} feature - The feature whose tooltip to update
         * @returns {void}
         */
        updateTooltipPositionForFeature (feature) {
            const featureId = feature.ol_uid;
            const normalizedFeatureId = this.normalizeFeatureId(featureId);
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();
            let newCoord = null;

            if (geometryType === "LineString") {
                newCoord = geometry.getLastCoordinate();
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                newCoord = coordinates[coordinates.length - 2];
            }

            if (!newCoord) {
                return;
            }

            this.source.forEachFeature(f => {
                const tooltipFeatureId = f.get("featureId");

                if (tooltipFeatureId && this.normalizeFeatureId(tooltipFeatureId) === normalizedFeatureId) {
                    const tooltipGeometry = f.getGeometry();

                    if (tooltipGeometry && tooltipGeometry.getType() === "Point") {
                        tooltipGeometry.setCoordinates(newCoord);
                    }
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
                        this.deleteFeatureHistory(featureId);

                        this.$nextTick(() => {
                            this.$nextTick(() => {
                                this.currentSelectInteractions.forEach(interaction => this.removeInteraction(interaction));
                                this.currentSelectInteractions = [];
                                this.selectedEditInteraction = "";
                                this.createDrawInteraction();
                                selectInteractionInstance.un("select", removeHandler);
                            });
                        });
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
            this.removeDrawInteraction();
            this.featureHistories = {};
            this.deleteFeatures();

            this.$nextTick(() => {
                this.$nextTick(() => {
                    this.selectedEditInteraction = "";
                    this.createDrawInteraction();
                });
            });
        },

        /**
         * Regulate the measure modify interaction.
         * The previous modify interaction is removed from the map and newly created modify interaction is added.
         * Measurements are recalculated when features are modified.
         * Coordinate changes are tracked in per-feature history.
         * @param {String} [featureId] - Optional feature ID to modify only that specific feature
         * @returns {void}
         */
        regulateModify (featureId = null) {
            this.selectedEditInteraction = "modify";
            this.currentlyModifyingFeatureId = featureId;
            this.removeDrawInteraction();

            if (this.currentModifyInteraction) {
                this.removeInteraction(this.currentModifyInteraction);
            }

            if (featureId) {
                const normalizedId = parseInt(featureId, 10);
                const allFeatures = this.source.getFeatures();
                const feature = allFeatures.find(f => {
                    const isTooltipFeature = f.get("featureId") !== undefined;

                    return !isTooltipFeature && parseInt(f.ol_uid, 10) === normalizedId;
                });

                if (feature) {
                    const featureCollection = new Collection([feature]);

                    this.currentModifyInteraction = new Modify({
                        features: featureCollection
                    });
                }
                else {
                    console.warn("Feature not found for modification:", featureId);
                    return;
                }
            }
            else {
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
            }

            this.currentModifyInteraction.on("modifystart", (event) => {
                event.features.forEach(feature => {
                    const geometry = feature.getGeometry();
                    const geometryType = geometry.getType();
                    let coords;

                    if (geometryType === "LineString") {
                        coords = geometry.getCoordinates();
                    }
                    else if (geometryType === "Polygon") {
                        coords = geometry.getCoordinates()[0];
                    }

                    feature.set("_beforeModifyCoords", JSON.parse(JSON.stringify(coords)));
                });
            });

            this.currentModifyInteraction.on("modifyend", (event) => {
                event.features.forEach(feature => {
                    const modifiedFeatureId = feature.ol_uid;
                    const geometry = feature.getGeometry();
                    const geometryType = geometry.getType();
                    const beforeCoords = feature.get("_beforeModifyCoords");
                    let afterCoords;

                    if (geometryType === "LineString") {
                        afterCoords = geometry.getCoordinates();
                    }
                    else if (geometryType === "Polygon") {
                        afterCoords = geometry.getCoordinates()[0];
                    }

                    this.addUndoForFeature(modifiedFeatureId, {
                        mode: "modifyCoordinates",
                        timestamp: Date.now(),
                        data: {
                            previousCoordinates: beforeCoords,
                            newCoordinates: JSON.parse(JSON.stringify(afterCoords)),
                            geometryType: geometryType
                        }
                    });

                    feature.unset("_beforeModifyCoords");

                    if (this.lines[modifiedFeatureId] || this.polygons[modifiedFeatureId]) {
                        this.$store.commit("Modules/Measure/addFeature", feature);
                    }
                });
            });

            this.addInteraction(this.currentModifyInteraction);
        },

        /**
         * Regulate the measure undo for a specific feature.
         * @param {String} featureId - The feature ID to undo
         * @returns {void}
         */
        regulateUndo (featureId) {
            if (this.currentSketch && this.currentSketch.ol_uid === parseInt(featureId, 10)) {
                this.undoLastPointInSketch();
                return;
            }

            const history = this.getFeatureHistory(featureId);

            if (history.undo.length === 0) {
                return;
            }

            const feature = this.getFeatureById(featureId);

            if (!feature) {
                return;
            }

            const historyEntry = history.undo.pop();

            if (historyEntry.mode === "addPoint") {
                this.undoAddPoint(feature, historyEntry);
            }
            else if (historyEntry.mode === "modifyCoordinates") {
                this.undoModifyCoordinates(feature, historyEntry);
            }

            history.redo.push(historyEntry);
        },

        /**
         * Regulate the measure redo for a specific feature.
         * @param {String} featureId - The feature ID to redo
         * @returns {void}
         */
        regulateRedo (featureId) {
            const history = this.getFeatureHistory(featureId);

            if (history.redo.length === 0) {
                return;
            }

            const feature = this.getFeatureById(featureId);

            if (!feature) {
                return;
            }

            const historyEntry = history.redo.pop();

            if (historyEntry.mode === "addPoint") {
                this.redoAddPoint(feature, historyEntry);
            }
            else if (historyEntry.mode === "modifyCoordinates") {
                this.redoModifyCoordinates(feature, historyEntry);
            }

            history.undo.push(historyEntry);
        },

        /**
         * Redoes a point addition (adds back a removed point).
         * @param {ol/Feature} feature - The feature to modify
         * @param {Object} historyEntry - The history entry containing point info
         * @returns {void}
         */
        redoAddPoint (feature, historyEntry) {
            const {point, geometryType} = historyEntry.data;
            const geometry = feature.getGeometry();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                coordinates.push(point);
                geometry.setCoordinates(coordinates);
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                coordinates.splice(coordinates.length - 1, 0, point);
                geometry.setCoordinates([coordinates]);
            }

            this.$store.commit("Modules/Measure/addFeature", feature);
            this.updateTooltipPositionForFeature(feature);
        },

        /**
         * Undoes a point addition (removes the point).
         * @param {ol/Feature} feature - The feature to modify
         * @param {Object} historyEntry - The history entry containing point info
         * @returns {void}
         */
        undoAddPoint (feature, historyEntry) {
            const {geometryType} = historyEntry.data;
            const geometry = feature.getGeometry();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                if (coordinates.length > 2) {
                    coordinates.pop();
                    geometry.setCoordinates(coordinates);
                }
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                if (coordinates.length > 4) {
                    coordinates.splice(coordinates.length - 2, 1);
                    geometry.setCoordinates([coordinates]);
                }
            }

            this.$store.commit("Modules/Measure/addFeature", feature);
            this.updateTooltipPositionForFeature(feature);
        },

        /**
         * Undoes a coordinate modification (restores previous coordinates).
         * @param {ol/Feature} feature - The feature to modify
         * @param {Object} historyEntry - The history entry containing coordinate info
         * @returns {void}
         */
        undoModifyCoordinates (feature, historyEntry) {
            const {previousCoordinates, geometryType} = historyEntry.data;
            const geometry = feature.getGeometry();

            if (geometryType === "LineString") {
                geometry.setCoordinates(previousCoordinates);
            }
            else if (geometryType === "Polygon") {
                geometry.setCoordinates([previousCoordinates]);
            }

            this.$store.commit("Modules/Measure/addFeature", feature);
            this.updateTooltipPositionForFeature(feature);
        },

        /**
         * Redoes a coordinate modification (applies new coordinates).
         * @param {ol/Feature} feature - The feature to modify
         * @param {Object} historyEntry - The history entry containing coordinate info
         * @returns {void}
         */
        redoModifyCoordinates (feature, historyEntry) {
            const {newCoordinates, geometryType} = historyEntry.data;
            const geometry = feature.getGeometry();

            if (geometryType === "LineString") {
                geometry.setCoordinates(newCoordinates);
            }
            else if (geometryType === "Polygon") {
                geometry.setCoordinates([newCoordinates]);
            }

            this.$store.commit("Modules/Measure/addFeature", feature);
            this.updateTooltipPositionForFeature(feature);
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
         * Records the action in per-feature history.
         * @param {ol/Feature} feature The feature to modify.
         * @returns {void}
         */
        removeLastPointFromFeature (feature) {
            const featureId = feature.ol_uid;
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                if (coordinates.length > 2) {
                    const removedPoint = coordinates.pop();

                    this.addUndoForFeature(featureId, {
                        mode: "addPoint",
                        timestamp: Date.now(),
                        data: {
                            point: removedPoint,
                            pointIndex: coordinates.length,
                            geometryType: "LineString"
                        }
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

                    this.addUndoForFeature(featureId, {
                        mode: "addPoint",
                        timestamp: Date.now(),
                        data: {
                            point: removedPoint,
                            pointIndex: coordinates.length - 2,
                            geometryType: "Polygon"
                        }
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
         * Removes the tooltip/label feature for a given measurement feature.
         * @param {Number} featureId The ol_uid of the measurement feature.
         * @returns {void}
         */
        removeTooltipForFeature (featureId) {
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
        },

        /**
         * Handles modify measurement event from MeasureList.
         * Toggles modify mode for a specific feature.
         * If the feature is already being modified, exits modify mode and returns to draw mode.
         * @param {String} featureId - The feature ID to modify
         * @returns {void}
         */
        handleModifyMeasurement (featureId) {
            const normalizedFeatureId = typeof featureId === "string" ? parseInt(featureId, 10) : featureId;
            const currentlyModifyingId = this.currentlyModifyingFeatureId ?
                parseInt(this.currentlyModifyingFeatureId, 10) : null;

            if (this.selectedEditInteraction === "modify" && currentlyModifyingId === normalizedFeatureId) {
                this.handleUnhighlightFeature(featureId);

                if (this.currentModifyInteraction) {
                    this.removeInteraction(this.currentModifyInteraction);
                    this.currentModifyInteraction = null;
                }

                this.selectedEditInteraction = "";
                this.currentlyModifyingFeatureId = null;
                this.createDrawInteraction();
            }
            else {
                this.selectedEditInteraction = "modify";
                this.regulateModify(featureId);
            }
        },

        /**
         * Handles delete measurement event from MeasureList.
         * Deletes a specific feature from the map.
         * After deleting, restores draw mode if in modify mode.
         * @param {String} featureId - The feature ID to delete
         * @returns {void}
         */
        handleDeleteMeasurement (featureId) {
            const normalizedId = this.normalizeFeatureId(featureId);
            const allFeatures = this.source.getFeatures();
            const feature = allFeatures.find(f => this.normalizeFeatureId(f.ol_uid) === normalizedId);

            if (feature) {
                this.removeTooltipForFeature(featureId);
                this.source.removeFeature(feature);
                this.$store.commit("Modules/Measure/removeFeature", feature.ol_uid);
                this.deleteFeatureHistory(featureId);

                // If in modify mode, restore draw interaction after deletion
                if (this.selectedEditInteraction === "modify") {
                    if (this.currentModifyInteraction) {
                        this.removeInteraction(this.currentModifyInteraction);
                        this.currentModifyInteraction = null;
                    }
                    this.selectedEditInteraction = "";
                    this.currentlyModifyingFeatureId = null;
                    this.createDrawInteraction();
                }
            }
        },

        /**
         * Handles highlight feature event from MeasureList.
         * Highlights a feature on the map when hovering over list item.
         * @param {String} featureId - The feature ID to highlight
         * @returns {void}
         */
        handleHighlightFeature (featureId) {
            const normalizedId = parseInt(featureId, 10);
            const allFeatures = this.source.getFeatures();
            const feature = allFeatures.find(f => {
                const isTooltipFeature = f.get("featureId") !== undefined;

                return !isTooltipFeature && parseInt(f.ol_uid, 10) === normalizedId;
            });

            if (feature) {
                if (!feature.get("_isHighlighted")) {
                    feature.set("_originalStyle", feature.getStyle());
                    feature.set("_isHighlighted", true);
                }
                const highlightColor = [0, 89, 255, 1]; // Blue

                feature.setStyle(getStyle(highlightColor));
            }
        },

        /**
         * Handles unhighlight feature event from MeasureList.
         * Removes highlight from a feature on the map.
         * @param {String} featureId - The feature ID to unhighlight
         * @returns {void}
         */
        handleUnhighlightFeature (featureId) {
            const normalizedId = parseInt(featureId, 10);
            const allFeatures = this.source.getFeatures();
            const feature = allFeatures.find(f => {
                const isTooltipFeature = f.get("featureId") !== undefined;

                return !isTooltipFeature && parseInt(f.ol_uid, 10) === normalizedId;
            });

            if (feature && feature.get("_isHighlighted")) {
                const originalStyle = feature.get("_originalStyle");

                if (originalStyle) {
                    feature.setStyle(originalStyle);
                }
                else {
                    feature.setStyle(getStyle(this.color));
                }

                feature.unset("_originalStyle");
                feature.unset("_isHighlighted");
            }
        }
    }
};
</script>

<template lang="html">
    <div id="measure">
        <MeasureInMapTooltip />

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

        <MeasureList
            :measurement-list="enrichedMeasurementList"
            :selected-feature-id="featureId"
            :currently-modifying-feature-id="currentlyModifyingFeatureId"
            @modify-measurement="handleModifyMeasurement"
            @delete-measurement="handleDeleteMeasurement"
            @undo-action="regulateUndo"
            @redo-action="regulateRedo"
            @highlight-feature="handleHighlightFeature"
            @unhighlight-feature="handleUnhighlightFeature"
        />

        <div class="d-flex justify-content-center my-3">
            <FlatButton
                id="measure-delete"
                aria-label="$t('common:modules.measure.deleteMeasurements')"
                :interaction="regulateDeleteAll"
                :text="$t('common:modules.measure.deleteMeasurements')"
                :icon="deleteIcon"
                :disabled="source?.getFeatures()?.length === 0"
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


</style>
