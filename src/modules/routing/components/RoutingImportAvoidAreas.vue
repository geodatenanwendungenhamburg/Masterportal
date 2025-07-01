<script>
import {mapGetters, mapActions} from "vuex";
import GeoJSON from "ol/format/GeoJSON.js";
import KML from "ol/format/KML.js";
import Feature from "ol/Feature.js";
import Polygon from "ol/geom/Polygon.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import {Modal} from "bootstrap";
import FileUpload from "../../../shared/modules/inputs/components/FileUpload.vue";

/**
 * RoutingImportAvoidAreas
 * @module modules/RoutingImportAvoidAreas
 * @vue-data {Object} avoidPolygons - Stores the polygons to avoid in routing as a GeoJSON MultiPolygon.
 * @vue-data {String} filename - The name of the file being processed for import.
 * @vue-data {Boolean} dzIsDropHovering - Indicates whether the drop zone is in a hover state.
 * @vue-data {String} maxFeatures - Maximum number of features allowed for import.
 * @vue-data {String} maxArea - Maximum area allowed for a polygon during import.
 * @vue-data {String} maxSideLength - Maximum side length allowed for polygons during import.
 * @vue-data {Boolean} dataIsValid - Validation flag to determine if the imported data is valid.
 *
 * @vue-computed {Object} directionsSettings - Retrieves the direction settings from Vuex.
 * @vue-computed {String} dropZoneAdditionalClass - Returns an additional class for the drop zone if a file is being dragged over it.
 */

export default {
    name: "RoutingImportAvoidAreas",
    components: {
        FileUpload
    },
    emits: ["afterFileValidation"],
    data () {
        return {
            avoidPolygons: {type: "MultiPolygon", coordinates: []},
            filename: "",
            dzIsDropHovering: false,
            maxFeatures: "",
            maxArea: "",
            maxSideLength: "",
            dataIsValid: true
        };
    },
    computed: {
        ...mapGetters("Modules/Routing", ["directionsSettings"])
    },
    mounted () {
        this.setRestrictions();
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/Routing/Directions", ["displayImportedAvoidAreas"]),
        ...mapActions("Modules/Routing", ["transformCoordinatesWgs84ToLocalProjection"]),

        /**
         * Appends modal to body in order to place modal correctly
         * @returns {void}
         */
        appendModalToBody () {
            const importModal = document.getElementById("fileUpload");

            if (importModal) {
                document.body.appendChild(importModal);
            }
        },
        /**
         * Sets restrictions for maximum area, side length, and feature count
         * based on the direction settings
         * @returns {void}
         */
        setRestrictions () {
            this.maxArea = this.directionsSettings.avoidAreaOptions.maxArea;
            this.maxSideLength = this.directionsSettings.avoidAreaOptions.maxSideLength;
            this.maxFeatures = this.directionsSettings.avoidAreaOptions.maxFeatures;
        },
        /**
         * Opens file input
         * @returns {void}
         */
        startFileInput () {
            this.$refs.fileInputLabel.click();
        },
        /**
         * Called when user uploads a file to process
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onInputChange (e) {
            if (e.target.files) {
                this.addFiles(e.target.files);
                e.target.value = null;
            }
        },
        /**
         * Called when files are added by the user to process
         * loading animation is shown while processing and an error is shown to the user if something happens while processing
         * @param {File[]} files to process
         * @returns {void}
         */
        addFiles (files) {
            const file = files[0],
                reader = new FileReader();

            this.dataIsValid = true;

            reader.onload = (event) => {
                const content = event.target.result;

                if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
                    this.parseGeoJSON(content);
                }
                else if (file.name.endsWith(".kml")) {
                    this.parseKML(content);
                }
                else {
                    this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.formatError"));
                }
            };

            reader.readAsText(file);
            this.$emit("afterFileValidation");
        },
        /**
         * Parses and validates GeoJSON content
         * @param {string} content - The GeoJSON file content
         * @returns {void}
         */
        parseGeoJSON (content) {
            try {
                const format = new GeoJSON(),
                    features = format.readFeatures(content);

                this.checkPolygonFormat(features);
                if (this.dataIsValid) {
                    this.validateAndExtractPolygons(features);
                }
                this.addSingleAlert({
                    category: "success",
                    content: this.$t("common:modules.routing.importAvoidAreas.uploadSuccess"),
                    title: this.$t("common:modules.routing.importAvoidAreas.uploadSuccessTitle")
                });
            }
            catch (error) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.parseError", {type: "GeoJSON"}));
            }
        },
        /**
         * Parses and validates KML content
         * @param {string} content - The KML file content
         * @returns {void}
         */
        parseKML (content) {
            try {
                const format = new KML(),
                    features = format.readFeatures(content);

                this.checkPolygonFormat(features);
                if (this.dataIsValid) {
                    this.validateAndExtractPolygons(features);
                }
            }
            catch (error) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.parseError", {type: "KML"}));
            }
        },
        /**
         * Validates and extracts the polygons from the parsed features.
         * Transforms coordinates to the local projection.
         * @param {Feature[]} features - Array of parsed features
         * @returns {void}
         */
        async validateAndExtractPolygons (features) {
            const multiPolygonCoordinates = [],
                featureCount = features.length;

            for (const feature of features) {
                const geometry = feature.getGeometry ? feature.getGeometry() : feature.geometry;

                if (geometry instanceof Polygon || geometry.type === "Polygon") {
                    const coordinates = geometry.getCoordinates ? geometry.getCoordinates() : geometry.coordinates;

                    this.checkPolygonCount(featureCount);
                    this.checkClosedPolygon(coordinates);

                    multiPolygonCoordinates.push(coordinates);
                }
                else if (geometry instanceof MultiPolygon || geometry.type === "MultiPolygon") {
                    const coordinates = geometry.getCoordinates ? geometry.getCoordinates() : geometry.coordinates;

                    this.checkPolygonCount(coordinates.length);
                    this.checkClosedPolygon(coordinates[0]);

                    coordinates.forEach((polygon) => {
                        multiPolygonCoordinates.push(polygon);
                    });
                }
            }

            if (this.dataIsValid) {
                this.avoidPolygons = {
                    type: "MultiPolygon",
                    coordinates: multiPolygonCoordinates
                };

                for (const avoidPolygon of this.avoidPolygons.coordinates) {
                    const transformedAvoidPolygon = await this.transformAvoidPolygon(avoidPolygon),
                        polygonFeature = this.createFeature(transformedAvoidPolygon);

                    this.checkPolygonSize(transformedAvoidPolygon);
                    this.checkPolygonSideLength(transformedAvoidPolygon[0]);

                    if (this.dataIsValid) {
                        this.displayImportedAvoidAreas(polygonFeature);
                    }
                }

                this.hideModalAfterValidation();
            }
            this.dataIsValid = true;
        },

        /**
         * Transforms WGS84 coordinates to local projection.
         * @param {Array} coordinate - The WGS84 coordinate
         * @returns {Array} - Transformed local coordinate
         */
        async transformPolygonToLocalProjection (coordinate) {
            const localCoordinate = await this.transformCoordinatesWgs84ToLocalProjection(coordinate);

            return localCoordinate;
        },
        /**
         * Transforms the avoid polygon coordinates to the local projection
         * @param {Array} avoidPolygon - Polygon coordinates to transform
         * @returns {Array} - Transformed polygon coordinates
         */
        async transformAvoidPolygon (avoidPolygon) {
            const transformedAvoidPolygon = await Promise.all(
                avoidPolygon[0].map(coordinate => this.transformPolygonToLocalProjection(coordinate))
            );

            return [transformedAvoidPolygon];
        },
        /**
         * Checks if the given features are valid polygons or multi-polygons.
         * If not, it marks the data as invalid and displays an error message.
         * @param {Array} features - Array of features to validate
         * @returns {void}
         */
        checkPolygonFormat (features) {
            features.forEach((feature) => {
                const geometry = feature.getGeometry ? feature.getGeometry() : feature.geometry;

                if (!(geometry instanceof Polygon || geometry instanceof MultiPolygon || geometry.type === "Polygon" || geometry.type === "MultiPolygon")) {
                    this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.polygonFormatError"));
                }
            });
        },
        /**
         * Checks if the number of features exceeds the allowed limit or is zero.
         * If the count is invalid, it marks the data as invalid and shows an error message.
         * @param {number} featureCount - The number of features
         * @returns {void}
         */
        checkPolygonCount (featureCount) {
            if (featureCount > this.maxFeatures) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.tooManyFeatures", {maxFeatures: this.maxFeatures}));
            }
            else if (featureCount === 0) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.noAvoidArea"));
            }
        },
        /**
         * Checks if the first and last coordinates of a polygon are the same.
         * Ensures that the polygon is properly closed.
         * @param {Array} polygonCoordinates - The polygon coordinates to check
         * @returns {void}
         */
        checkClosedPolygon (polygonCoordinates) {
            if (polygonCoordinates.length < 1) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.polygonEmpty"));
            }
            else if (polygonCoordinates[0].length <= 2) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.polygonNotEnoughPoints"));
            }
            else {
                const firstCoordinate = polygonCoordinates[0][0],
                    lastCoordinate = polygonCoordinates[0][polygonCoordinates[0].length - 1];


                if (!(firstCoordinate[0] === lastCoordinate[0] && firstCoordinate[1] === lastCoordinate[1])) {
                    this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.polygonNotClosed"));
                }
            }
        },
        /**
         * Checks if the area of the transformed polygon exceeds the maximum allowed area.
         * If the area is too large, it marks the data as invalid and displays an error message.
         * @param {Array} transformedAvoidArea - The transformed polygon coordinates
         * @returns {void}
         */
        checkPolygonSize (transformedAvoidArea) {
            const polygon = new Polygon(transformedAvoidArea),
                area = polygon.getArea(),
                maxArea = this.maxArea * 1000;

            if (area > maxArea) {
                this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.areaTooBig", {area: (area / 1000000).toFixed(2), maxArea: (maxArea / 1000000).toFixed(2)}));
            }
        },
        /**
         * Checks if any side of the transformed polygon exceeds the maximum allowed side length.
         * If a side is too long, it marks the data as invalid and shows an error message.
         * @param {Array} transformedAvoidArea - The transformed polygon coordinates
         * @returns {void}
         */
        checkPolygonSideLength (transformedAvoidArea) {
            const maxSideLength = this.maxSideLength * 1000;

            for (let i = 0; i < transformedAvoidArea.length - 1; i++) {
                const point1 = transformedAvoidArea[i],
                    point2 = transformedAvoidArea[i + 1],
                    distance = Math.sqrt(
                        Math.pow(point2[0] - point1[0], 2) +
            Math.pow(point2[1] - point1[1], 2)
                    );

                if (distance > maxSideLength) {
                    this.addValidationErrorAlert(this.$t("common:modules.routing.importAvoidAreas.error.sideTooLong", {maxSideLength: (maxSideLength / 1000).toFixed(2), distance: (distance / 1000).toFixed(2)}));
                    return;
                }
            }
        },
        /**
         * Creates a feature object from the transformed polygon coordinates.
         * @param {Array} transformedAvoidArea - The transformed polygon coordinates
         * @returns {Feature} - The created feature with the polygon geometry
         */
        createFeature (transformedAvoidArea) {
            const polygon = new Polygon(transformedAvoidArea),

                feature = new Feature({
                    geometry: polygon
                });

            return feature;
        },
        /**
         * Hides the modal after validation.
         * @returns {void}
         */
        hideModalAfterValidation () {
            const modalElement = document.getElementById("fileUpload");

            if (modalElement) {
                const modal = Modal.getInstance(modalElement);

                if (modal) {
                    modal.hide();
                }
            }
        },
        /**
         * Adds alert for validation error.
         * @param {String} errorMessage error message
         * @returns {void}
         */
        addValidationErrorAlert (errorMessage) {
            this.dataIsValid = false;
            this.hideModalAfterValidation();
            this.addSingleAlert({
                category: "error",
                content: errorMessage,
                title: this.$t("common:modules.routing.importAvoidAreas.error.header")
            });
        },
        onDrop (e) {
            if (e.dataTransfer.files !== undefined) {
                this.addFiles(e.dataTransfer.files);
            }
        }

    }
};
</script>


<template>
    <div class="justify-content-center">
        <FileUpload
            :id="'fileUpload'"
            :keydown="(e) => triggerClickOnFileInput(e)"
            :change="(e) => onInputChange(e)"
            :drop="(e) => onDrop(e)"
        />
    </div>

    <label
        ref="fileInputLabel"
        class="d-none mt-2 mb-2 col-md-12"
    >
        <input
            ref="fileInput"
            type="file"
            accept=".geojson, .kml"
            @change="onInputChange($event)"
        >

    </label>
</template>


<style lang="scss" scoped>

.drop-area-fake {
    background-color: $white;
    border-radius: 12px;
    border: 2px dashed $accent_disabled;
    padding:24px;
    transition: background 0.25s, border-color 0.25s;
    min-width: 80%;

    &.dzReady {
        background-color:$accent_hover;
        border-color:transparent;
        p.caption {
            color: $white;
        }
    }

    p.caption {
        margin:0;
        text-align:center;
        transition: color 0.35s;
        font-family: $font_family_accent;
        font-size: $font-size-lg;
        color: $accent_disabled;
    }
}

.drop-area {
    position:absolute;
    top:0;
    left:0;
    right:0;
    bottom:0;
    z-index:10;
}

.vh-center-outer-wrapper {
    top:0;
    left:0;
    right:0;
    bottom:0;
    text-align:center;
    position:relative;
    &:before {
        content:'';
        display:inline-block;
        height:100%;
        vertical-align:middle;
        margin-right:-0.25rem;
    }
}

.vh-center-inner-wrapper {
    text-align:left;
    display:inline-block;
    vertical-align:middle;
    position:relative;
}

.divider {
  display: flex;
  align-items: center;
}

.divider::before, .divider::after {
  content: '';
  height: 1px;
  background-color: silver;
  flex-grow: 1;
  margin: 20px;
}

.startpoint-input :deep(label) {
    border: 1px rgb(244, 34, 37) solid;
    border-radius: 5px;
}

.waypoint-input :deep(label) {
    border: 1px rgb(0, 119, 182) solid;
    border-radius: 5px;
}

.endpoint-input :deep(label) {
    border: 1px rgb(51, 164, 71) solid;
    border-radius: 5px;
}

#button-up {
    cursor: pointer;
}

#csvHeaderSwitch {
    margin-right: 10px;
}

#button-help {
    margin-right: 10px;
}
</style>
