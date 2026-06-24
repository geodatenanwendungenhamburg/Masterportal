<script>
import {mapGetters} from "vuex";
import exportItem from "@masterportal/masterportalapi/src/shared/exportItem.js";
import kmlfunctions from "@masterportal/masterportalapi/src/shared/kmlExport.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {processDoubleCircleFeatures} from "../js/processDoubleCircleFeatures.js";
import {GeoJSON, GPX} from "ol/format.js";

/**
 * @displayName ExportItem
 * @description Shared component to export drawn features in various formats (KML, GeoJSON, GPX, CSV).
 */
export default {
    name: "ExportItem",
    components: {FlatButton, InputText},
    props: {
        headline: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.headline"
        },
        formatlabel: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.format"
        },
        pleaseChoose: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.pleaseChoose"
        },
        formats: {
            type: Array,
            required: true,
            validator: (value) => {
                const allowedFormats = ["KML", "GEOJSON", "GPX", "CSV"];

                return value.every(format => allowedFormats.includes(format.toUpperCase()));
            }
        },
        preSelectedFormat: {
            type: String,
            required: false,
            default: null,
            validator: (value) => {
                const allowedFormats = ["KML", "GEOJSON", "GPX", "CSV"];

                return allowedFormats.includes(value.toUpperCase());
            }
        },
        filenameLabel: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.filename"
        },
        filenameInputLabel: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.enterFilename"
        },
        exportButtonText: {
            type: String,
            required: false,
            default: "common:shared.modules.draw.download.saveDrawing"
        },
        features: {
            type: Array,
            required: false,
            default: () => {
                return [];
            }
        }
    },
    data () {
        return {
            fileName: "",
            exportFormat: null,
            downloadStrategies: {
                GEOJSON: this.handleGeoJSONDownload,
                KML: this.handleKMLDownload,
                CSV: this.handleCSVDownload,
                GPX: this.handleGPXDownload
            }
        };
    },
    computed: {
        ...mapGetters("Maps", ["projectionCode"]),
        hasUnsupportedPolygonsForGPX () {
            return this.exportFormat === "GPX" &&
                this.features.some(f => {
                    const type = f.getGeometry()?.getType();

                    return type === "Polygon" || type === "MultiPolygon" || type === "Circle";
                });
        },
        hasSymbolsForGPX () {
            return this.exportFormat === "GPX" &&
                this.features.some(f => {
                    const drawState = f.get("masterportal_attributes")?.drawState;

                    return drawState?.drawType?.id === "drawSymbol" || drawState?.symbol;
                });
        }
    },
    unmounted () {
        this.fileName = "";
    },
    methods: {
        /**
         * Updates the selected export format when the user changes the dropdown.
         * @param {Event} event - The change event from the format select element.
         * @returns {void}
         */
        onFormatChange (event) {
            this.exportFormat = event.target.value;
        },

        /**
         * Triggers the download for the currently selected export format.
         * Aborts if no format is selected or if unsupported polygon types are present for GPX.
         * @returns {void}
         */
        async startDownload () {
            if (!this.exportFormat || this.hasUnsupportedPolygonsForGPX) {
                return;
            }

            const handler = this.downloadStrategies[this.exportFormat.toUpperCase()];

            if (handler) {
                await handler();
            }
        },

        /**
         * Prepares and exports features as a GeoJSON file.
         * Processes double-circle features before conversion.
         * @returns {void}
         */
        async handleGeoJSONDownload () {
            const reversedFeatures = [...this.features].reverse();
            let preparedFeatures = await exportItem.prepareFeatures(reversedFeatures, this.projectionCode);

            preparedFeatures = processDoubleCircleFeatures(preparedFeatures);

            const dataString = await exportItem.convertFeatures(preparedFeatures, new GeoJSON(), this.projectionCode);

            this.triggerFileDownload(dataString, `${this.fileName}.geojson`);
        },

        /**
         * Prepares and exports features as a GPX file.
         * @returns {void}
         */
        async handleGPXDownload () {
            const preparedFeatures = await exportItem.prepareFeatures(this.features),
                dataString = await exportItem.convertFeatures(preparedFeatures, new GPX(), this.projectionCode);

            this.triggerFileDownload(dataString, `${this.fileName}.gpx`);
        },

        /**
         * Prepares and exports features as a KML file.
         * Transforms geometries and sets KML-specific attributes before conversion.
         * @returns {void}
         */
        async handleKMLDownload () {
            const reversedFeatures = [...this.features].reverse();
            let dataString = kmlfunctions.transformGeometries(reversedFeatures);

            dataString = kmlfunctions.setKmlAttributes(dataString);
            const projection = this.projectionCode;

            dataString = await kmlfunctions.convertFeaturesToKml(dataString, projection);
            this.triggerFileDownload(dataString, `${this.fileName}.kml`);
        },

        /**
         * Prepares and exports features as a CSV file.
         * @returns {void}
         */
        async handleCSVDownload () {
            let dataString = await exportItem.setCsvAttributes(this.features, this.projectionCode);

            dataString = Array.isArray(dataString) ? convertJsonToCsv(dataString.map(feature => feature.get("csv_attributes")), false, true) : "";

            this.triggerFileDownload(dataString, `${this.fileName}.csv`);
        },

        /**
         * Creates a Blob from the given data and triggers a browser file download.
         * @param {String} data - The file content to download.
         * @param {String} fileName - The name for the downloaded file including extension.
         * @returns {void}
         */
        triggerFileDownload (data, fileName) {
            const blob = new Blob([data], {type: "application/octet-stream"}),
                link = document.createElement("a");

            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    }
};
</script>

<template>
    <div>
        <p class="fw-bold">
            {{ $t(headline) }}
        </p>
        <form
            id="tool-draw-download"
            class="form-floating"
            role="form"
            @submit.prevent
        >
            <div class="form-floating">
                <InputText
                    id="tool-draw-download-filename"
                    v-model="fileName"
                    :class-obj="['form-control-sm']"
                    :placeholder="$t(filenameInputLabel)"
                    :label="$t(filenameLabel)"
                />
            </div>
            <div class="form-floating">
                <select
                    id="tool-draw-download-format"
                    class="form-select"
                    :aria-label="$t(formatlabel)"
                    @change="onFormatChange"
                >
                    <option value="none">
                        {{ $t(pleaseChoose) }}
                    </option>
                    <option
                        v-for="format in formats"
                        :key="'tool-draw-download-format-' + format"
                        :value="format"
                        :selected="format === preSelectedFormat"
                    >
                        {{ format }}
                    </option>
                </select>
                <label for="tool-draw-download-format">
                    {{ $t(formatlabel) }}
                </label>
                <p
                    v-if="hasUnsupportedPolygonsForGPX"
                    class="text-danger mt-1 mb-0"
                >
                    {{ $t("common:shared.modules.draw.download.geometryTypeNotSupported") }}
                </p>
                <p
                    v-if="hasSymbolsForGPX && !hasUnsupportedPolygonsForGPX"
                    class="text-warning mt-1 mb-0"
                >
                    {{ $t("common:shared.modules.draw.download.symbolsNotFullySupportedGPX") }}
                </p>
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-12 d-flex justify-content-center pt-3">
                    <FlatButton
                        id="downloadBtn"
                        :aria-label="$t('common:shared.modules.draw.download.saveDrawing')"
                        :interaction="() => startDownload()"
                        :text="$t(exportButtonText)"
                        :icon="'bi-save'"
                        :class="{disabled: fileName.length === 0 || exportFormat === null || hasUnsupportedPolygonsForGPX || exportFormat === 'none'}"
                        role="button"
                    />
                </div>
            </div>
        </form>
    </div>
</template>
