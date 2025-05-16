<script>
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolUpload",
    components: {
        IconButton
    },
    methods: {
        uploadFile (event) {
            const
                file = event.target.files[0] || null,
                fileNameSplit = file.name.split("."),
                fileExtension = fileNameSplit.length > 0 ? fileNameSplit[fileNameSplit.length - 1].toLowerCase() : "";

            if (!["ifc", "xkt", "gltf", "bcf"].includes(fileExtension)) {
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: i18next.t("modules.bimViewer.tools.uploadFormatError", {fileExtension: fileExtension})
                }, {root: true});

                return;
            }

            if (file) {
                if (fileExtension === "bcf") {
                    this.$store.dispatch("Modules/BimViewer/loadBCF", {
                        url: file
                    });
                }
                else {
                    this.$store.dispatch("Modules/BimViewer/loadModel", {
                        url: file,
                        visible: true,
                        type: fileExtension
                    }).then((theModel) => {
                        theModel.on("loaded", () => {
                            this.$store.dispatch("Modules/BimViewer/ToolSceneFit/fit");
                        });
                    });
                }
            }

            // Clear input value. Required to trigger change event again, if the same file is uploaded twice.
            event.target.value = "";
        }
    }
};
</script>

<template>
    <form class="ToolUpload">
        <IconButton
            :aria="$t('modules.bimViewer.tools.uploadFormat')"
            :title="$t('modules.bimViewer.tools.uploadFormat')"
            class="btn-primary"
            icon="bi-file-earmark-plus"
            :interaction="() => $refs.uploadButton.click()"
        />

        <input
            id="uploadButton"
            ref="uploadButton"
            type="file"
            accept=".ifc,.xkt,.gltf,.bcf"
            @change="uploadFile"
        >
    </form>
</template>

<style lang="scss">
@import "~variables";

form.ToolUpload {
    input[type="file"] {
        display: none;
    }

    i::before {
        line-height: inherit !important;
    }

    .btn-primary:hover {
        color: $white;
        background-color: $secondary;
    }
}
</style>
