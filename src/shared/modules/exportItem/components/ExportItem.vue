<script>
import {mapGetters} from "vuex";
import exportItem from "@masterportal/masterportalapi/src/shared/exportItem.js";
import kmlfunctions from "@masterportal/masterportalapi/src/shared/kmlExport.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import mapCollection from "@core/maps/js/mapCollection.js";
import {GeoJSON, GPX} from "ol/format.js";

export default {
    name: "ExportItem",
    components: {FlatButton, InputText},
    props: {
        headline: {
            type: String,
            required: false,
            default: "common:modules.draw_old.button.download"
        },
        formatlabel: {
            type: String,
            required: false,
            default: "common:modules.draw_old.download.format"
        },
        pleaseChoose: {
            type: String,
            required: false,
            default: "common:modules.draw_old.download.pleaseChoose"
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
            default: "common:modules.draw_old.download.filename"
        },
        filenameInputLabel: {
            type: String,
            required: false,
            default: "common:modules.draw_old.download.enterFilename"
        },
        exportButtonText: {
            type: String,
            required: false,
            default: "common:modules.draw_old.button.saveDrawing"
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
        ...mapGetters("Maps", ["projectionCode"])
    },
    watch: {
        features () {
            console.warn("HE", this.features);
        }
    },
    unmounted () {
        this.fileName = "";
    },
    methods: {
        onFormatChange (event) {
            // Errorhandling used to be in the convertFeatures directly, now needs to happen here, i.e. allGeometryTypesNotSupported, notSupportedAlert, siehe actionsDownload function convertFeatures in draw_old
            console.warn("Format Changed", event);
            console.warn("features in onFormatChange", this.features.length);
            console.warn("features in onFormatChange", this.features);
            this.exportFormat = event.target.value;
        },

        async startDownload () {

            try {
                if (!this.exportFormat) {
                    console.warn("No export format selected.");
                    return;
                }

                const handler = this.downloadStrategies[this.exportFormat.toUpperCase()];

                if (handler) {
                    await handler();
                }
                else {
                    console.error(`No handler defined for format: ${this.exportFormat}`);
                }
            }
            catch (error) {
                console.error("Error in startDownload:", error);
            }

            console.warn("exportItem", exportItem);
            console.warn("Download started with the following features", this.features);
        },

        async handleGeoJSONDownload () {
            const reversedFeatures = [...this.features].reverse();

            console.warn("Handling GeoJSON download...", reversedFeatures);
            const map = mapCollection.getMap("2D");
            let dataString = await exportItem.prepareFeatures(reversedFeatures, map);

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
            console.warn("GeoJSON result: ", dataString);
            this.triggerFileDownload(dataString, `${this.fileName}.geojson`);
        },

        async handleGPXDownload () {
            console.warn("Handling GPX download...");
            const map = mapCollection.getMap("2D");
            let dataString = await exportItem.prepareFeatures(this.features, map);

            dataString = await exportItem.convertFeatures(this.features, new GPX(), this.projectionCode);

            console.warn("GPX result: ", dataString);
            this.triggerFileDownload(dataString, `${this.fileName}.gpx`);
        },

        async handleKMLDownload () {
            const reversedFeatures = [...this.features].reverse();
            let dataString = kmlfunctions.transformGeometries(reversedFeatures);

            dataString = kmlfunctions.setKmlAttributes(dataString);
            const projection = this.projectionCode;

            console.warn("features after setKMLAttributes:", dataString);

            dataString = await kmlfunctions.convertFeaturesToKml(dataString, projection);
            console.warn("features after convertFeaturesToKML:", dataString);

            console.warn("KML result: ", dataString);
            this.triggerFileDownload(dataString, `${this.fileName}.kml`);
        },

        async handleCSVDownload () {
            console.warn("Handling CSV download...");
            const dataString = await exportItem.convertFeaturesToCsv(this.features);

            console.warn("CSV result: ", dataString);
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
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-12 d-flex justify-content-center pt-3">
                    <FlatButton
                        id="downloadBtn"
                        :aria-label="$t('common:modules.draw_old.button.saveDrawing')"
                        :interaction="() => startDownload()"
                        :text="$t(exportButtonText)"
                        :icon="'bi-save'"
                        :class="{disabled: fileName.length === 0 || exportFormat === null }"
                        role="button"
                    />
                </div>
            </div>
        </form>
    </div>
</template>
