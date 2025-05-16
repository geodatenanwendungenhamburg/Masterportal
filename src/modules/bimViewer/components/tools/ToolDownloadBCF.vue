<script>
import {mapGetters} from "vuex";

export default {
    name: "ToolDownloadBCF",
    computed: {
        ...mapGetters("Modules/BimViewer", [
            "sceneConfigSelected"
        ]),
        ...mapGetters("Modules/BimViewer/ToolObjectInfo", [
            "pickedObjectId"
        ])
    },
    methods: {
        async downloadBCF () {
            if (this.pickedObjectId) {
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: i18next.t("modules.bimViewer.tools.downloadBCFErrorObjectPicked")
                }, {root: true});

                return;
            }

            const
                json = await this.$store.dispatch("Modules/BimViewer/getBCFViewpointJson"),
                datePrefix = new Date().toISOString().slice(0, 10);

            this.forceFileDownload(
                `${datePrefix}_${this.createSafeFilename(this.sceneConfigSelected.name)}.bcf`,
                json
            );
        },
        createSafeFilename (input) {
            return input
                // Unicode Normalization Form - NFKD "Compatibility Decomposition"
                .normalize("NFKD")
                // Remove umlauts (diacritics)
                .replace(/[\u0300-\u036f]/g, "")
                // Replace any sequence of non-alphanumerics
                .replace(/[^a-z0-9]+/gi, "_")
                // Trim leading/trailing underscores
                .replace(/^_+|_+$/g, "");
        },
        forceFileDownload (fileName, data) {
            const
                link = document.createElement("a"),
                blobUrl = new Blob([data]);

            link.href = window.URL.createObjectURL(blobUrl);
            link.setAttribute("download", fileName);

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
        }
    }
};
</script>

<template>
    <div class="ToolDownloadBCF">
        <button
            class="btn btn-primary"
            :title="$t('modules.bimViewer.tools.downloadBCF')"
            @click="downloadBCF()"
        >
            <i class="bi bi-save-fill" />
        </button>
    </div>
</template>
