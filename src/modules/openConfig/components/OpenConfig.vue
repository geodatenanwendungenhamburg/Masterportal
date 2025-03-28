<script>
import {mapActions, mapGetters} from "vuex";
import FileUpload from "../../../shared/modules/inputs/components/FileUpload.vue";
/**
 * Module to load a config.json to runtime.
 * @module modules/OpenConfig
 */
export default {
    name: "OpenConfig",
    components: {
        FileUpload
    },
    computed: {
        ...mapGetters("Modules/OpenConfig", ["icon"])
    },
    mounted () {
        this.$nextTick(() => {
            this.setFocusToFirstControl();
        });
    },
    methods: {
        ...mapActions("Modules/OpenConfig", ["processConfigJsonOnload"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                const fileUploadComponent = this.$refs["file-upload"];

                if (fileUploadComponent && fileUploadComponent.$refs["upload-input-file"]) {
                    fileUploadComponent.$refs["upload-input-file"].focus();
                }
            });
        },

        /**
         * Loads the config.json file
         * @param {Event} event The file input event.
         * @returns {void}
         */

        loadFile (event) {
            const targetFile = event.target.files[0];

            if (targetFile?.type === "application/json") {
                const reader = new FileReader();

                reader.onload = (evt) => {
                    this.processConfigJsonOnload(evt);
                    this.addSingleAlert({
                        category: "success",
                        content: this.$t("common:modules.openConfig.loadFileSuccess", {targetFileName: targetFile?.name})
                    });
                };
                reader.readAsText(event.target.files[0]);
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: this.$t("common:modules.openConfig.loadFileFailed", {targetFileName: targetFile?.name, targetFileFormat: targetFile?.name.split(".")[1]})
                });
            }
        },
        /**
         * Handles the drop event
         * @param {Event} event The drop event.
         * @returns {void}
         */
        handleDrop (event) {
            event.preventDefault();
            const targetFile = event.dataTransfer.files[0];

            if (targetFile && targetFile.type === "application/json") {
                const reader = new FileReader();

                reader.onload = (evt) => {
                    this.processConfigJsonOnload(evt);
                    this.addSingleAlert({
                        category: "success",
                        content: this.$t("common:modules.openConfig.loadFileSuccess", {targetFileName: targetFile.name})
                    });
                };

                reader.onerror = () => {
                    this.addSingleAlert({
                        category: "error",
                        content: this.$t("common:modules.openConfig.loadFileFailed", {targetFileName: targetFile.name})
                    });
                };

                reader.readAsText(targetFile);
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: this.$t("common:modules.openConfig.loadFileFailed", {targetFileName: targetFile?.name, targetFileFormat: targetFile?.name.split(".")[1]})
                });
            }
        }
    }
};
</script>

<template lang="html">
    <div id="open-config">
        <p class="mb-4">
            {{ $t("common:modules.openConfig.explanation") }}
        </p>
        <div
            id="open-config-input-button"
            class="row d-flex mb-1"
        >
            <FileUpload
                id="file-upload"
                ref="file-upload"
                :keydown="setFocusToFirstControl"
                :change="loadFile"
                :drop="handleDrop"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    p {
        color: $black;
        font-size: $font-size-base
    }

    input[type="file"] {
        display: none;
    }

    .btn-transparent{
        background-color: transparent;
        border: none;
    }

</style>
