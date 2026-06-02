<script>
import {mapGetters} from "vuex";
import exportItem from "@masterportal/masterportalapi/src/shared/exportItem.js";
import kmlfunctions from "@masterportal/masterportalapi/src/shared/kmlExport.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {GeoJSON, GPX} from "ol/format.js";

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
            required: true,
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
        ...mapGetters("Modules/ExportItem", [
            "exportFileName"
        ]),
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
        onFormatChange (event) {
            this.exportFormat = event.target.value;
        },

        async startDownload () {
            if (!this.exportFormat || this.hasUnsupportedPolygonsForGPX) {
                return;
            }

            const handler = this.downloadStrategies[this.exportFormat.toUpperCase()];

            if (handler) {
                await handler();
            }
        },

        async handleGeoJSONDownload () {
            const reversedFeatures = [...this.features].reverse();

            console.warn("Handling GeoJSON download...", reversedFeatures);
            let dataString = await exportItem.prepareFeatures(reversedFeatures, this.projectionCode);

            // Group all geo-circle features by their center coordinate
            const circleGroups = {};

            dataString.forEach((feature, idx) => {
                const attrs = feature.get("masterportal_attributes");

                if (attrs?.isGeoCircle) {
                    const center = attrs.geoCircleCenter;

                    if (!circleGroups[center]) {
                        circleGroups[center] = [];
                    }
                    circleGroups[center].push(idx);
                }
            });

            const geoFields = ["isGeoCircle", "geoCircleCenter", "geoCircleRadius"];

            for (const indices of Object.values(circleGroups)) {
                // A double circle is exactly 2 features sharing the same center
                if (indices.length !== 2) {
                    continue;
                }

                const [idx1, idx2] = indices;
                const attrs1 = dataString[idx1].get("masterportal_attributes");
                const attrs2 = dataString[idx2].get("masterportal_attributes");

                // outerColorContour presence confirms this is a doubleCircle, not two unrelated single circles
                const styledAttrs = attrs1.fromDrawTool ? attrs1 : attrs2;

                if (!styledAttrs.drawState?.outerColorContour) {
                    continue;
                }

                const sourceDrawState = styledAttrs.drawState;
                const baseStyleAttrs = Object.fromEntries(
                    Object.entries(styledAttrs).filter(([k]) => !geoFields.includes(k))
                );
                const geoAttrs1 = Object.fromEntries(Object.entries(attrs1).filter(([k]) => geoFields.includes(k)));
                const geoAttrs2 = Object.fromEntries(Object.entries(attrs2).filter(([k]) => geoFields.includes(k)));

                const outerDrawState = {
                    ...sourceDrawState,
                    colorContour: sourceDrawState.outerColorContour,
                    color: sourceDrawState.outerColorFill,
                    circleRadius: sourceDrawState.circleOuterRadius
                };

                delete outerDrawState.outerColorContour;
                delete outerDrawState.outerColorFill;

                const innerDrawState = {...sourceDrawState};

                delete innerDrawState.outerColorContour;
                delete innerDrawState.outerColorFill;

                if (geoAttrs1.geoCircleRadius > geoAttrs2.geoCircleRadius) {
                    dataString[idx1].set("masterportal_attributes", {...baseStyleAttrs, drawState: outerDrawState, ...geoAttrs1});
                    dataString[idx2].set("masterportal_attributes", {...baseStyleAttrs, drawState: innerDrawState, ...geoAttrs2});
                }
                else {
                    dataString[idx1].set("masterportal_attributes", {...baseStyleAttrs, drawState: innerDrawState, ...geoAttrs1});
                    dataString[idx2].set("masterportal_attributes", {...baseStyleAttrs, drawState: outerDrawState, ...geoAttrs2});
                }
            }

            dataString = await exportItem.convertFeatures(dataString, new GeoJSON(), this.projectionCode);
            this.triggerFileDownload(dataString, `${this.fileName}.geojson`);
        },

        async handleGPXDownload () {
            const preparedFeatures = await exportItem.prepareFeatures(this.features),
                dataString = await exportItem.convertFeatures(preparedFeatures, new GPX(), this.projectionCode);

            this.triggerFileDownload(dataString, `${this.fileName}.gpx`);
        },

        async handleKMLDownload () {
            const reversedFeatures = [...this.features].reverse();
            let dataString = kmlfunctions.transformGeometries(reversedFeatures);

            dataString = kmlfunctions.setKmlAttributes(dataString);
            const projection = this.projectionCode;

            dataString = await kmlfunctions.convertFeaturesToKml(dataString, projection);
            this.triggerFileDownload(dataString, `${this.fileName}.kml`);
        },

        async handleCSVDownload () {
            let dataString = await exportItem.setCsvAttributes(this.features, this.projectionCode);

            dataString = Array.isArray(dataString) ? convertJsonToCsv(dataString.map(feature => feature.get("csv_attributes")), false, true) : "";

            this.triggerFileDownload(dataString, `${this.fileName}.csv`);
        },

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
        <p class="bold">
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
                    aria-label="label42"
                    @change="(event) => onFormatChange(event)"
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
                    {{ $t(filenameLabel) }}
                </label>
                <p
                    v-if="hasUnsupportedPolygonsForGPX"
                    class="text-danger mt-1 mb-0"
                >
                    {{ $t("common:shared.modules.draw.download.geometryTypeNotSupported") }}
                </p>
                <p
                    v-if="hasSymbolsForGPX && !hasUnsupportedPolygonsForGPX"
                    class="mt-1 mb-0"
                    style="color: #856404;"
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
                        :class="{disabled: fileName.length === 0 || exportFormat === null || hasUnsupportedPolygonsForGPX}"
                        role="button"
                    />
                </div>
            </div>
        </form>
    </div>
</template>
