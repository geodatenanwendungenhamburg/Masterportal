<script>
export default {
    name: "ToolUpload",
    methods: {
        uploadIfcFile (event) {
            const file = event.target.files[0] || null;

            if (file) {
                this.$store.dispatch("Modules/BimViewer/loadIfcModel", {
                    url: URL.createObjectURL(file),
                    visible: true
                }).then((ifcModel) => {
                    ifcModel.on("loaded", () => {
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
            :title="$t('modules.bimViewer.tools.uploadIfc')"
            @keydown="clickUploadButton"
        >
            <i class="bi bi-box-arrow-in-down" />
        </label>

        <input
            id="uploadButton"
            ref="uploadButton"
            type="file"
            accept=".ifc"
            @change="uploadIfcFile"
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
