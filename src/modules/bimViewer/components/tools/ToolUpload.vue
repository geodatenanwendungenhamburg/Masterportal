<script>
import {mapActions} from "vuex";

import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolUpload",
    components: {
        IconButton
    },
    methods: {
        ...mapActions({
            addSingleAlert: "Alerting/addSingleAlert",
            loadBCF: "Modules/BimViewer/loadBCF",
            loadModel: "Modules/BimViewer/loadModel",
            fitScene: "Modules/BimViewer/ToolSceneFit/fit"
        }),
        async uploadFile (event) {
            const file = event.target.files[0] || null,
                fileNameSplit = file ? file.name.split(".") : [],
                fileExtension = fileNameSplit.length > 0 ? fileNameSplit[fileNameSplit.length - 1].toLowerCase() : "";

            if (!["ifc", "xkt", "gltf", "bcfvjson"].includes(fileExtension)) {
                this.addSingleAlert({
                    category: "error",
                    content: i18next.t("modules.bimViewer.tools.uploadFormatError", {fileExtension: fileExtension})
                }, {root: true});

                event.target.value = "";
                return;
            }

            if (file) {
                if (fileExtension === "bcfvjson") {
                    this.loadBCF({url: file});
                }
                else {
                    this.loadModel({
                        url: file,
                        visible: true,
                        type: fileExtension
                    }).then((theModel) => {
                        if (theModel && typeof theModel.on === "function") {
                            theModel.on("loaded", () => {
                                this.fitScene();
                            });
                        }
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
            class-array="btn-primary"
            icon="bi-file-earmark-plus"
            :interaction="() => $refs.uploadButton.click()"
        />

        <input
            id="uploadButton"
            ref="uploadButton"
            type="file"
            accept=".ifc,.xkt,.gltf,.bcfvjson"
            @change="uploadFile"
        >
    </form>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
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
}
</style>
