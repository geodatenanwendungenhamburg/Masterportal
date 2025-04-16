<script>
export default {
    name: "ToolUpload",
    methods: {
        uploadFile (event) {
            const file = event.target.files[0] || null,
                fileNameSplit = file.name.split("."),
                fileExtension = fileNameSplit.length > 0 ? fileNameSplit[fileNameSplit.length - 1].toLowerCase() : "";

            if (!["ifc", "xkt", "gltf"].includes(fileExtension)) {
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: i18next.t("modules.bimViewer.tools.uploadFormatError", {fileExtension: fileExtension})
                }, {root: true});

                return;
            }

            if (file) {
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

            // Clear input value. Required to trigger change event again, if the same file is uploaded twice.
            event.target.value = "";
        },
        clickUploadButton (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.$refs.uploadButton.click();
            }
        }
    }
};
</script>

<template>
    <form class="ToolUpload">
        <label
            role="button"
            class="btn btn-primary"
            for="uploadButton"
            tabindex="0"
            :title="$t('modules.bimViewer.tools.uploadFormat')"
            @keydown="clickUploadButton"
        >
            <i class="bi bi-box-arrow-in-down" />
        </label>

        <input
            id="uploadButton"
            ref="uploadButton"
            type="file"
            accept=".ifc,.xkt,.gltf"
            @change="uploadFile"
        >
    </form>
</template>

<style lang="scss">
form.ToolUpload {
    input[type="file"] {
        display: none;
    }

    i::before {
        line-height: inherit !important;
    }
}
</style>
