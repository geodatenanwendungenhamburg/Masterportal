<script>
import {mapGetters, mapActions} from "vuex";
import * as constants from "../store/constantsRouting.js";
import {GeoJSON, GPX} from "ol/format.js";
import convertFeaturesToKml from "@shared/js/utils/convertFeaturesToKml.js";
import directionsRouteStyle from "../js/map/directions/route/directionsRouteStyle.js";
import tsrRouteStyle from "../js/map/tsr/route/tsrRouteStyle.js";
import Feature from "ol/Feature.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

/**
 * RoutingDownload
 * @module modules/routing/components/RoutingDownload
 * @vue-prop {Boolean} hideGpx - Shows if GPW format is hidden.
 * @vue-data {*} constants - The constants.
 * @vue-computed {Boolean} isDisabled - Shows if download button should be disabled.
 * @vue-computed {String[]} downloadFormatOptions - The format options.
 */
export default {
    name: "RoutingDownload",
    components: {
        FlatButton,
        InputText
    },
    props: {
        hideGpx: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            constants
        };
    },
    computed: {
        ...mapGetters("Modules/Routing", ["download", "activeRoutingToolOption"]),
        ...mapGetters("Modules/Routing/Directions", ["directionsRouteSource"]),
        ...mapGetters("Modules/Routing/Isochrones", ["isochronesAreaSource"]),
        ...mapGetters("Modules/Routing/TSR", ["tsrRouteSource", "waypoints", "settings"]),

        /**
         * Checks if the download button should be disabled.
         * @returns {Boolean} true if no file name was entered.
         */
        isDisabled () {
            return !this.download?.fileName?.length;
        },
        /**
         * Computed value for the format options to hide the GPX format
         * @returns {String[]} download format options
         */
        downloadFormatOptions () {
            let downloadFormatOptions = [];

            if (["DIRECTIONS", "ISOCHRONES"].includes(this.activeRoutingToolOption)) {
                downloadFormatOptions = constants.downloadFormatOptions;
            }
            else if (this.activeRoutingToolOption === "TSR") {
                downloadFormatOptions = constants.downloadFormatOptionsTSR;
            }

            if (this.hideGpx) {
                downloadFormatOptions = downloadFormatOptions.filter(d => d !== "GPX");
            }

            return downloadFormatOptions;
        }
    },
    methods: {
        ...mapActions("Modules/Routing", ["transformCoordinatesLocalToWgs84Projection"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Retrieves the features from openlayers source to be downloaded
         * @returns {module:ol/Feature[]} openlayers features
         */
        getDownloadFeatures () {
            if (this.activeRoutingToolOption === "DIRECTIONS") {
                return [this.directionsRouteSource.getFeatures().find(feature => !feature.get("isHighlight"))];
            }
            else if (this.activeRoutingToolOption === "TSR") {
                return [this.tsrRouteSource.getFeatures().find(feature => !feature.get("isHighlight"))];
            }

            return this.isochronesAreaSource.getFeatures();
        },
        /**
         * Retrieves the features and styles them for export with default route style
         * @param {module:ol/Feature[]} features which are to be converted.
         * @returns {module:ol/Feature[]} openlayers features
         */
        styleFeatures (features) {
            const clonedFeatures = [];
            let routeStyle = null;

            for (const feature of features) {
                const clonedFeature = feature.clone();

                if (["DIRECTIONS", "ISOCHRONES"].includes(this.activeRoutingToolOption)) {
                    routeStyle = directionsRouteStyle.createDirectionsRouteStyle(feature);

                    if (routeStyle[1]) {
                        clonedFeature.setStyle(routeStyle[1]);
                    }
                }
                else if (this.activeRoutingToolOption === "TSR") {
                    routeStyle = tsrRouteStyle.createtsrRouteStyle(feature);

                    if (routeStyle[0]) {
                        clonedFeature.setStyle(routeStyle[0]);
                    }
                }
                clonedFeatures.push(clonedFeature);
            }

            return clonedFeatures;
        },
        /**
         * Converts the features from OpenLayers Features to features in the chosen format.
         * @param {module:ol/Feature[]} features which are to be converted.
         * @param {module:ol/format} format Format in which the features should be saved.
         * @returns {String} The features written in the chosen format as a String.
         */
        async convertFeatures (features, format) {
            if (!(format instanceof GeoJSON) && !(format instanceof GPX) || !Array.isArray(features)) {
                return "";
            }
            const convertedFeatures = [];

            for (const feature of features) {
                if (!(feature instanceof Feature)) {
                    continue;
                }
                const clone = feature.clone(),
                    geometry = clone.getGeometry(),
                    type = geometry.getType(),
                    coords = geometry.getCoordinates();

                let coordinates = [];

                if (type === "Point") {
                    coordinates = await this.transformCoordinatesLocalToWgs84Projection(coords);
                }
                else if (type === "LineString") {
                    coordinates = await Promise.all(coords.map(coord => this.transformCoordinatesLocalToWgs84Projection(coord)));
                }
                else if (type === "Polygon") {
                    for (const coord of coords) {
                        coordinates.push(await Promise.all(coord.map(c => this.transformCoordinatesLocalToWgs84Projection(c))));
                    }
                }
                geometry.setCoordinates(coordinates);
                convertedFeatures.push(clone);
            }
            return format.writeFeatures(convertedFeatures);
        },
        /**
         * Get current profile name according to selected language
         * @returns {String} profile name
         */
        getProfileName () {
            switch (this.settings.speedProfile) {
                case "CAR":
                    return i18next.t("common:modules.routing.speedprofiles.CAR");
                case "HGV":
                    return i18next.t("common:modules.routing.speedprofiles.HGV");
                case "CYCLING":
                    return i18next.t("common:modules.routing.speedprofiles.CYCLING");
                case "FOOT":
                    return i18next.t("common:modules.routing.speedprofiles.FOOT");
                case "WHEELCHAIR":
                    return i18next.t("common:modules.routing.speedprofiles.WHEELCHAIR");
                default:
                    return "";
            }
        },
        /**
         * Converts tsr result to csv format string
         * @returns {String} csv string of tsr result
         */
        async convertTSRResultToCsv () {
            let csvString = "",
                coords = [],
                pos = "";
            const lines = [];

            if (this.activeRoutingToolOption === "TSR") {
                lines.push(i18next.t("common:modules.routing.tsr.downloadCsv.header"));

                // round trip
                if (this.waypoints[0].coordinates.every((coord, idx) => coord === this.waypoints[this.waypoints.length - 1].coordinates[idx])) {
                    lines.push(i18next.t("common:modules.routing.tsr.downloadCsv.descriptionRoundTrip", {
                        start: this.waypoints[0].getDisplayName()
                    }));
                }
                // no round trip
                else {
                    lines.push(i18next.t("common:modules.routing.tsr.downloadCsv.descriptionNoRoundTrip", {
                        start: this.waypoints[0].getDisplayName(),
                        end: this.waypoints[this.waypoints.length - 1].getDisplayName()
                    }));
                }

                lines.push(i18next.t("common:modules.routing.tsr.downloadCsv.optimalOrder", {
                    profile: this.getProfileName()
                }));

                for (const [idx, waypoint] of this.waypoints.entries()) {
                    coords = await this.transformCoordinatesLocalToWgs84Projection(waypoint.getCoordinates());
                    if (idx === 0) {
                        pos = i18next.t("common:modules.routing.startIndex");
                    }
                    else if (idx === this.waypoints.length - 1) {
                        pos = i18next.t("common:modules.routing.endIndex");
                    }
                    else {
                        pos = idx;
                    }

                    lines.push(i18next.t("common:modules.routing.tsr.downloadCsv.waypoint", {
                        pos: pos,
                        displayName: waypoint.getDisplayName(),
                        lon: coords[0].toFixed(6),
                        lat: coords[1].toFixed(6)
                    }));
                }
                csvString = lines.join("\n");
            }
            return csvString;
        },
        /**
         * Converts the features to be downloaded into the desired download format
         * @param {module:ol/Feature[]} features to be converted
         * @returns {String} string to be downloaded
         */
        async getDownloadStringInFormat (features) {
            switch (this.download?.format) {
                case "GEOJSON":
                    return this.convertFeatures(features, new GeoJSON());
                case "GPX":
                    return this.convertFeatures(features, new GPX());
                case "KML":
                    return convertFeaturesToKml(features);
                case "CSV":
                    return this.convertTSRResultToCsv();
                default:
                    return undefined;
            }
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
         * Creates the filename with the extension if not provided in the uploaded file
         * @returns {Object} containing file name and information about validation
         */
        getFileName () {
            if (typeof this.download?.fileName !== "string" || typeof this.download?.format !== "string") {
                return "unknown";
            }
            const format = this.download.format.toLowerCase(),
                fileName = this.download.fileName.endsWith(`.${format}`) ? this.download.fileName : `${this.download.fileName}.${format}`,
                // validate file name without file suffix
                validation = this.validateFileName(fileName.slice(0, -Math.abs(format.length + 1)));

            return {
                name: fileName,
                isValid: validation.isValid,
                errorMsg: validation.errorMsg
            };
        },
        /**
         * Executed by the user when clicking the download button.
         * Retrieves the features, converts them and provides them to the browser to download.
         * @returns {void}
         */
        async downloadResult () {
            if (this.isDisabled) {
                return;
            }
            const downloadString = await this.getDownloadStringInFormat(this.styleFeatures(this.getDownloadFeatures())),
                fileName = this.getFileName();

            if (fileName.isValid) {
                if (typeof navigator.msSaveOrOpenBlob === "function") {
                    window.navigator.msSaveOrOpenBlob(new Blob([downloadString], {
                        type: "text/plain;charset=utf-8"
                    }), fileName.name);
                }
                else {
                    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(downloadString)}`,
                        a = document.createElement("a");

                    a.href = url;
                    a.download = fileName.name;
                    a.style.visibility = "hidden";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: fileName.errorMsg,
                    title: this.$t("common:modules.routing.download.error.header")
                });
            }
        }
    }
};
</script>

<template>
    <div
        id="routing-download"
        class="form-group-sm"
    >
        <h6>{{ $t('common:modules.routing.download.header') }}</h6>

        <div class="d-flex mb-2">
            <label
                for="routing-DownloadFormatOptions"
                class="col-md-4 col-form-label d-flex align-self-center"
            >{{ $t('common:modules.routing.download.format') }}</label>

            <div class="col-md-8">
                <select
                    id="routing-DownloadFormatOptions"
                    class="form-select form-select-sm"
                    @change="download.format = $event.target.value"
                >
                    <option
                        v-for="option in downloadFormatOptions"
                        :id="option"
                        :key="'routing-DownloadFormatOptions-' + option"
                        :value="option"
                        :selected="option === download.format"
                    >
                        {{ option }}
                    </option>
                </select>
            </div>
        </div>

        <div class="d-flex mb-2">
            <label
                for="routing-download-filename"
                class="col-md-4 col-form-label d-flex align-self-center"
            >{{ $t('common:modules.routing.download.filename') }}</label>

            <div class="col-md-8">
                <InputText
                    id="routing-download-filename"
                    v-model="download.fileName"
                    :label="$t('common:modules.routing.download.filename')"
                    :placeholder="$t('common:modules.routing.download.filename')"
                />
            </div>
        </div>

        <div class="form-group form-group-sm">
            <div class="d-flex justify-content-center mt-3">
                <FlatButton
                    id="downloadBtn"
                    :aria-label="$t('common:modules.routing.download.saveResult')"
                    :interaction="($event) => downloadResult()"
                    :text="$t('common:modules.routing.download.saveResult')"
                    :icon="'bi-save'"
                    :class="{disabled: isDisabled}"
                    role="button"
                />
            </div>
        </div>
    </div>
</template>
