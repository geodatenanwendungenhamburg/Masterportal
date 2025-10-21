<script>
import ExportButtonCSV from "@shared/modules/buttons/components/ExportButtonCSV.vue";
import ExportButtonGeoJSON from "@shared/modules/buttons/components/ExportButtonGeoJSON.vue";
import openlayerFunctions from "../utils/openlayerFunctions.js";
import isObject from "@shared/js/utils/isObject.js";
import {GeoJSON} from "ol/format.js";
import Feature from "ol/Feature.js";

/**
* Snippet Download
* @module modules/SnippetDownload
* @vue-prop {Array} filteredItems - The lost of filtered items.
* @vue-prop {String} layerId - The layer id.
*
* @vue-data {Boolean} enableFileDownload - Shows if file download is enabled.
* @vue-data {Array} formats - List of availabe formats.
* @vue-data {String} selectedFormat - The selected format.
* @vue-data {String} filename - The chosen filename.
* @vue-data {String} json - The json data for the geoJSON export.
*/
export default {
    name: "SnippetDownload",
    components: {
        ExportButtonCSV,
        ExportButtonGeoJSON
    },
    props: {
        outOfZoom: {
            type: Boolean,
            required: false,
            default: false
        },
        filteredItems: {
            type: Array,
            required: true
        },
        layerId: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            enableFileDownload: false,
            formats: ["CSV", "GeoJSON"],
            selectedFormat: "",
            filename: "",
            json: ""
        };
    },
    methods: {
        /**
         * Sets the download selected format.
         * @param {String} format of the file to download
         * @returns {void}
         */
        setDownloadSelectedFormat (format) {
            this.selectedFormat = format;
            this.enableDownloadBtn();
        },

        /**
         * Enables download button and set json if the selected format is GeoJSON and filteredItems has at least one element.
         * @returns {void}
         */
        enableDownloadBtn () {
            if (this.filename !== "" &&
                this.selectedFormat !== "" &&
                this.selectedFormat !== "none" &&
                Array.isArray(this.filteredItems) &&
                this.filteredItems.length > 0) {
                if (this.selectedFormat === "GeoJSON" && this.filteredItems[0] instanceof Feature === true) {
                    const parser = new GeoJSON({
                        dataProjection: "EPSG:4326",
                        featureProjection: mapCollection.getMapView("2D").getProjection().getCode()
                    });

                    this.json = parser.writeFeatures(this.filteredItems);
                }
                this.enableFileDownload = true;
            }
            else {
                this.enableFileDownload = false;
            }
        },
        /**
         * Download handler for csv export.
         * @param {Function} onsuccess The function to hand over the data.
         * @returns {void}
         */
        getDownloadHandler (onsuccess) {
            const result = [],
                features = this.filteredItems,
                model = openlayerFunctions.getLayerByLayerId(this.layerId),
                gfiAttributes = typeof model?.get === "function" && isObject(model.get("gfiAttributes")) ? model.get("gfiAttributes") : {};

            if (!Array.isArray(features)) {
                onsuccess([]);
                return;
            }
            features.forEach(item => {
                if (!isObject(item) || typeof item.getProperties !== "function" || !isObject(item.getProperties())) {
                    return;
                }
                const properties = {},
                    geometryName = typeof item.getGeometryName === "function" ? item.getGeometryName() : false;

                Object.entries(item.getProperties()).forEach(([attrName, value]) => {
                    if (attrName === geometryName) {
                        return;
                    }
                    else if (Object.prototype.hasOwnProperty.call(gfiAttributes, attrName)) {
                        properties[gfiAttributes[attrName]] = value;
                        return;
                    }
                    properties[attrName] = value;
                });

                if (typeof item?.getGeometry === "function" &&
                    item.getGeometry().getType() === "Point" &&
                    typeof item.getGeometry().getCoordinates()[0] !== "undefined" &&
                    typeof item.getGeometry().getCoordinates()[1] !== "undefined") {
                    const map = mapCollection.getMap("2D"),
                        view = typeof map?.getView === "function" ? map.getView() : undefined,
                        projection = typeof view?.getProjection === "function" ? view.getProjection() : undefined,
                        code = typeof projection?.getCode === "function" ? projection.getCode() + " | " : "";

                    properties["Koordinaten-System"] = code + item.getGeometry().getCoordinates()[0] + " | " + item.getGeometry().getCoordinates()[1];
                }
                result.push(properties);
            });
            onsuccess(result);
        }
    }
};
</script>

<template>
    <form
        id="tool-filter-download"
        :class="['form-horizontal', 'mt-3', outOfZoom ? 'disabledClass': '']"
        role="form"
    >
        <h6>
            {{ $t("common:modules.filter.download.label") }}
        </h6>
        <div class="form-group row">
            <div class="form-floating col-md-6">
                <input
                    id="tool-filter-download-filename"
                    v-model="filename"
                    class="form-control"
                    type="text"
                    :placeholder="$t('common:modules.filter.download.filename')"
                    @keyup="enableDownloadBtn"
                >
                <label
                    for="tool-filter-download-filename"
                    class="form-label ms-2"
                >
                    {{ $t('common:modules.filter.download.filename') }}
                </label>
            </div>
            <div class="form-floating col-md-6">
                <select
                    id="tool-filter-download-format"
                    class="form-select form-select-sm"
                    @change="setDownloadSelectedFormat($event.target.value)"
                >
                    <option value="none">
                        {{ $t("common:modules.filter.download.format") }}
                    </option>
                    <option
                        v-for="format in formats"
                        :key="'tool-filter-download-format-' + format"
                        :value="format"
                        :selected="format === selectedFormat"
                    >
                        {{ format }}
                    </option>
                </select>
                <label
                    for="tool-filter-download-format"
                    class="form-label ms-2"
                >
                    {{ $t("common:modules.filter.download.format") }}
                </label>
            </div>
        </div>
        <div class="form-group row ">
            <div class="col-md-12 mt-3">
                <div
                    v-if="selectedFormat==='GeoJSON'"
                    class="d-flex justify-content-center"
                >
                    <ExportButtonGeoJSON
                        class="py-2 px-3 rounded-pill"
                        :disabled="!enableFileDownload"
                        :title="$t('common:modules.filter.download.labelBtn')"
                        :data="json"
                        :filename="filename"
                        postfix-format=""
                    />
                </div>
                <div
                    v-else
                    class="d-flex justify-content-center"
                >
                    <ExportButtonCSV
                        class="py-2 px-3 rounded-pill"
                        :disabled="!enableFileDownload"
                        :url="false"
                        :filename="filename"
                        :handler="getDownloadHandler"
                        :use-semicolon="true"
                        :title="$t('common:modules.filter.download.labelBtn')"
                        postfix-format=""
                    />
                </div>
            </div>
        </div>
    </form>
</template>

<style lang="scss" scoped>


form {

    &.disabledClass {
        color: #9B9A9A;
        .form-control, .form-select {
            color: #9B9A9A;
            &::placeholder {
                color: #9B9A9A;
            }
        }
        button {
            background-color: #D9D9D9;
        }
    }
}

</style>
