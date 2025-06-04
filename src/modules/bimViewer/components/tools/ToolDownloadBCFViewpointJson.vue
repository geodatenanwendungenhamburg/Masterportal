<script>
import {mapGetters, mapActions} from "vuex";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolDownloadBCFViewpointJson",
    components: {
        IconButton
    },
    computed: {
        ...mapGetters({
            sceneConfigSelected: "Modules/BimViewer/sceneConfigSelected",
            pickedObjectId: "Modules/BimViewer/ToolObjectInfo/pickedObjectId"
        })
    },
    methods: {
        ...mapActions({
            addSingleAlert: "Alerting/addSingleAlert",
            getBCFViewpointJson: "Modules/BimViewer/getBCFViewpointJson"
        }),
        async downloadBCFViewpointJson () {
            if (this.pickedObjectId) {
                this.addSingleAlert({
                    category: "error",
                    content: i18next.t("modules.bimViewer.tools.downloadBCFViewpointJson.errorObjectPicked")
                }, {root: true});

                return;
            }

            const
                json = await this.getBCFViewpointJson(),
                // Creates a date string in format YYYY-mm-dd
                datePrefix = new Date().toISOString().slice(0, 10);

            this.forceFileDownload(
                `${datePrefix}_${this.createSafeFilename(this.sceneConfigSelected.name)}.bcfvjson`,
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
    <div class="ToolDownloadBCFViewpointJson">
        <IconButton
            :aria="$t('modules.bimViewer.tools.downloadBCFViewpointJson.buttonTitle')"
            :title="$t('modules.bimViewer.tools.downloadBCFViewpointJson.buttonTitle')"
            :class-array="['btn-primary']"
            icon="bi-save-fill"
            :interaction="() => downloadBCFViewpointJson()"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ToolDownloadBCFViewpointJson {
        .btn-primary:hover {
            color: $white;
            background-color: $secondary;
        }
    }
}
</style>
