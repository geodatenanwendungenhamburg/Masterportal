<script>
import {mapGetters} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

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
            exportFormat: null
        };
    },
    computed: {
        ...mapGetters("Modules/ExportItem", [
            "exportFileName"
        ])
    },
    watch: {
        features () {
            console.warn("HE", this.features);
        }
    },
    mounted () {
        console.warn("Hey, features:", this.features);
    },
    unmounted () {
        this.fileName = "";
    },
    methods: {
        onFormatChange () {
            // Errorhandling used to be in the convertFeatures directly, now needs to happen here, i.e. allGeometryTypesNotSupported, notSupportedAlert, siehe actionsDownload function convertFeatures in draw_old
            console.warn("Format Changed");
            this.exportFormat = this.format;
        },

        startDownload () {
            console.warn("Download started with the following features", this.features);
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

<style lang="scss" scoped>
@import "~variables";


</style>
