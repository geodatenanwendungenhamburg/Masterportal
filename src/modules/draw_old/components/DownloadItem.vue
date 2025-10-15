<script>
import {mapActions, mapGetters} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

/**
 * Draw Download Item
 * @module modules/DownloadItem
 */
export default {
    name: "DownloadItem",
    components: {FlatButton, InputText},
    computed: {
        ...mapGetters("Modules/Draw_old", [
            "dataString",
            "features",
            "fileName",
            "fileUrl",
            "download",
            "formats",
            "selectedFeature",
            "preSelectedFormat",
            "selectedFormat",
            "disableFileDownload"
        ])
    },
    watch: {
        "download.fileName" () {
            this.prepareDownload();
        }
    },
    methods: {
        ...mapActions("Modules/Draw_old", [
            "setDownloadSelectedFormat",
            "setDownloadFeatures",
            "setDownloadFileName",
            "fileDownloaded",
            "validateFileName",
            "prepareDownload"
        ]),
        startDownload (button, downloadUrl) {
            this.validateFileName().then(validName => {
                const link = document.createElement("a");

                link.href = downloadUrl;
                link.download = validName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.fileDownloaded();
            });
        },
        onFormatChange (event) {
            this.setDownloadSelectedFormat(event.target.value);
        }
    }
};
</script>

<template>
    <div>
        <hr>
        <p class="bold">
            {{ $t("common:modules.draw_old.button.download") }}
        </p>
        <form
            id="tool-draw-download"
            class="form-horizontal"
            role="form"
            @submit.prevent
        >
            <div class="form-group form-group-sm row">
                <label
                    class="col-md-5 col-form-label"
                    for="tool-draw-download-format"
                >
                    {{ $t("common:modules.draw_old.download.format") }}
                </label>
                <div class="col-md-7">
                    <select
                        id="tool-draw-download-format"
                        class="form-select form-select-sm"
                        @change="onFormatChange"
                    >
                        <option value="none">
                            {{ $t("common:modules.draw_old.download.pleaseChoose") }}
                        </option>
                        <option
                            v-for="format in download.formats"
                            :key="'tool-draw-download-format-' + format"
                            :value="format"
                            :selected="format === download.preSelectedFormat"
                        >
                            {{ format }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="form-group form-group-sm row">
                <label
                    class="col-md-5 col-form-label"
                    for="tool-draw-download-filename"
                >
                    {{ $t("common:modules.draw_old.download.filename") }}
                </label>
                <div class="col-md-7">
                    <InputText
                        id="tool-draw-download-filename"
                        v-model="download.fileName"
                        :class-obj="['form-control-sm']"
                        :placeholder="$t('common:modules.draw_old.download.enterFilename')"
                        :label="$t('common:modules.draw_old.download.filename')"
                    />
                </div>
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-12 d-flex justify-content-center pt-3">
                    <FlatButton
                        id="downloadBtn"
                        :aria-label="$t('common:modules.draw_old.button.saveDrawing')"
                        :interaction="($event) => startDownload($event.target, download.fileUrl, download.fileName)"
                        :text="$t('common:modules.draw_old.button.saveDrawing')"
                        :icon="'bi-save'"
                        :class="{disabled: disableFileDownload}"
                        role="button"
                    />
                </div>
            </div>
        </form>
    </div>
</template>
