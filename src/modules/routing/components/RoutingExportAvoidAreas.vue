<script>
import {mapGetters, mapActions} from "vuex";
import {Modal} from "bootstrap";
import GeoJSON from "ol/format/GeoJSON.js";
import convertFeaturesToKml from "../../../shared/js/utils/convertFeaturesToKml.js";

/**
 * RoutingExportAvoidAreas
 * @module modules/RoutingExportAvoidAreas
 * @vue-data {Object} avoidPolygons - Stores the polygons to avoid in routing as a GeoJSON MultiPolygon.
 * @vue-data {String} exportType - Selected export format, either "geojson" or "kml".
 * @vue-data {String} filename - The name of the file to be downloaded.
 *
 * @vue-computed {Object} directionsSettings - Retrieves the directions settings from Vuex.
 */
export default {
    name: "RoutingExportAvoidAreas",
    data () {
        return {
            avoidPolygons: {type: "MultiPolygon", coordinates: []},
            exportType: "geojson",
            filename: ""
        };
    },
    computed: {
        ...mapGetters("Modules/Routing", ["directionsSettings"])
    },
    mounted () {
        this.appendModalToBody();
    },
    methods: {
        ...mapActions("Modules/Routing/Directions", ["getAvoidPolygonsWgs84"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Appends modal to body in order to place modal correctly
         * @returns {void}
         */
        appendModalToBody () {
            const exportModal = this.$refs.exportAvoidAreasModal;

            if (exportModal) {
                document.body.appendChild(exportModal);
            }
        },

        /**
         * Submits the download request, depending on the selected export type (GeoJSON or KML).
         * Hides the modal after processing.
         * @returns {void}
         */
        async submitDownload () {
            const modalElement = this.$refs.exportAvoidAreasModal,
                modal = Modal.getInstance(modalElement);

            this.avoidPolygons = await this.getAvoidPolygonsWgs84();

            if (this.exportType === "geojson") {
                this.downloadGeoJSON();
            }
            else if (this.exportType === "kml") {
                this.downloadKML();
            }

            modal.hide();
        },

        /**
         * Validates file name according to file extension
         * @param {String} fileName to validate
         * @param {String} format of the file
         * @returns {Object} containing information about validation
         */
        validateFileName (fileName) {
            let errorMsg = "";

            // check file name length
            if (fileName.length > 40) {
                errorMsg = this.$t("common:modules.routing.download.error.fileNameTooLong");
                return {errorMsg: errorMsg, isValid: false};
            }

            // check for white space
            if ((/\s/).test(fileName)) {
                errorMsg = this.$t("common:modules.routing.download.error.fileNameContainsWhiteSpace");
                return {errorMsg: errorMsg, isValid: false};
            }

            // check character validity
            if (!(/^[A-Za-z0-9_-]*$/).test(fileName)) {
                errorMsg = this.$t("common:modules.routing.download.error.fileNameContainsInvalidChars");
                return {errorMsg: errorMsg, isValid: false};
            }

            return {errorMsg: errorMsg, isValid: true};

        },

        /**
         * Checks if avoid polygons are available
         * @param {MultiPolygon} avoidPolygons to check
         * @returns {Object} containing information about availability check
         */
        hasAvoidPolygons (avoidPolygons) {
            let errorMsg = "";

            if (avoidPolygons.coordinates.length === 0) {
                errorMsg = this.$t("common:modules.routing.exportAvoidAreas.error.noAvoidArea");
                return {errorMsg: errorMsg, isAvailable: false};
            }

            return {errorMsg: errorMsg, isAvailable: true};
        },

        /**
         * Downloads the avoid polygons in GeoJSON format.
         * Validates the filename and checks polygon size  before proceeding.
         * @returns {void}
         */
        downloadGeoJSON () {
            const format = new GeoJSON(),
                features = format.readFeatures(this.avoidPolygons),
                geojsonStr = format.writeFeatures(features),
                validation = this.validateFileName(this.filename),
                polygonAvailable = this.hasAvoidPolygons(this.avoidPolygons);

            if (validation.isValid) {
                if (polygonAvailable.isAvailable) {
                    this.downloadFile(geojsonStr, `${this.filename}.geojson`);
                }
                else {
                    this.addSingleAlert({
                        category: "error",
                        content: polygonAvailable.errorMsg,
                        title: this.$t("common:modules.routing.exportAvoidAreas.error.header")
                    });
                }
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: validation.errorMsg,
                    title: this.$t("common:modules.routing.download.error.header")
                });
            }
        },
        /**
         * Downloads the avoid polygons in KML format.
         * Validates the filename and checks polygon size before proceeding, and handles potential errors during KML conversion.
         * @returns {void}
         */
        async downloadKML () {
            const format = new GeoJSON(),
                features = format.readFeatures(this.avoidPolygons),
                validation = this.validateFileName(this.filename),
                polygonAvailable = this.hasAvoidPolygons(this.avoidPolygons);

            if (validation.isValid) {
                if (polygonAvailable.isAvailable) {
                    try {
                        const kmlStr = await convertFeaturesToKml(features);

                        this.downloadFile(kmlStr, `${this.filename}.kml`);
                    }
                    catch (error) {
                        this.addSingleAlert({
                            category: "error",
                            content: this.$t("common:modules.routing.download.error.kmlConversionFailed"),
                            title: this.$t("common:modules.routing.download.error.header")
                        });
                        console.error("KML Conversion Error:", error);
                    }
                }
                else {
                    this.addSingleAlert({
                        category: "error",
                        content: polygonAvailable.errorMsg,
                        title: this.$t("common:modules.routing.exportAvoidAreas.error.header")
                    });
                }
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: validation.errorMsg,
                    title: this.$t("common:modules.routing.download.error.header")
                });
            }
        },

        /**
         * Initiates the download of a file with the given content and filename.
         * It creates a Blob object and triggers a download via a temporary anchor element.
         * @param {String} content - The content of the file
         * @param {String} filename - The name of the file to be saved
         * @returns {void}
         */
        downloadFile (content, filename) {
            const blob = new Blob([content], {type: "text/plain;charset=utf-8"});

            if (typeof navigator.msSaveOrOpenBlob === "function") {
                window.navigator.msSaveOrOpenBlob(blob, filename);
            }
            else {
                const url = URL.createObjectURL(blob),
                    a = document.createElement("a");

                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
    }
};
</script>

<template>
    <!-- Modal -->
    <div
        id="exportAvoidAreasModal"
        ref="exportAvoidAreasModal"
        class="modal"
        tabindex="-1"
        aria-labelledby="exportAvoidAreasModalLabel"
    >
        <div
            class="modal-dialog modal-dialog-centered"
        >
            <div class="modal-content">
                <div class="modal-header">
                    <h1
                        id="exportAvoidAreasModalLabel"
                        class="modal-title fs-5"
                    >
                        <b>
                            {{ $t('common:modules.routing.exportAvoidAreas.header') }}
                        </b>
                    </h1>
                    <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                    />
                </div>
                <div class="modal-body">
                    <div class="export-avoid-menu">
                        <b>
                            {{ $t('common:modules.routing.exportAvoidAreas.format') }}
                        </b>
                        <div class="export-avoid-radio">
                            <input
                                id="geojson"
                                v-model="exportType"
                                type="radio"
                                name="exportType"
                                value="geojson"
                                :checked="true"
                            >
                            <label
                                for="geojson"
                            >
                                GeoJSON
                            </label>
                            <input
                                id="kml"
                                v-model="exportType"
                                type="radio"
                                name="exportType"
                                value="kml"
                            >
                            <label
                                for="kml"
                            >
                                KML
                            </label>
                        </div>
                    </div>
                    <div class="d-flex mb-2">
                        <label
                            for="routing-download-filename"
                            class="col-md-4 col-form-label d-flex align-self-center"
                        ><b>
                            {{ $t('common:modules.routing.exportAvoidAreas.filename') }}
                        </b></label>

                        <div class="col-md-8">
                            <input
                                id="routing-download-filename"
                                v-model="filename"
                                type="text"
                                class="form-control"
                                :placeholder="$t('common:modules.routing.exportAvoidAreas.filenamePlaceholder')"
                                @keyup.enter="filename ? submitDownload() : _"
                            >
                        </div>
                    </div>
                    <hr>
                    <div class="download-submit">
                        <button
                            id="btn-submit"
                            class="btn btn-primary"
                            type="submit"
                            :disabled="!filename"
                            @click="submitDownload()"
                        >
                            <i class="bi bi-download" />
                            {{ $t('common:modules.routing.exportAvoidAreas.download') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style>
.hidden {
    display: none;
}
.export-avoid-menu {
    display: flex;
    justify-content: space-between;
}
.export-avoid-radio input {
    margin-left: 20px;
    margin-right: 5px;
}
.download-submit {
    text-align: center;
}
</style>
