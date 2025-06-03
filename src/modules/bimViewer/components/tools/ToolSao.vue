<script>
import {mapGetters, mapActions} from "vuex";

import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolSao",
    components: {
        IconButton
    },
    computed: {
        ...mapGetters("Modules/BimViewer/ToolSao", ["saoStatus"]),
        modeSaoStatus () {
            return this.saoStatus;
        },
        modeSaoNotSupported () {
            return this.modeSaoStatus === null;
        },
        modeSaoAriaLabel () {
            if (this.modeSaoNotSupported) {
                return this.$t("modules.bimViewer.tools.saoAriaLabelNotSupported");
            }
            else if (this.modeSaoStatus === true) {
                return this.$t("modules.bimViewer.tools.saoAriaLabelOn");
            }

            return this.$t("modules.bimViewer.tools.saoAriaLabelOff");
        }
    },
    methods: {
        ...mapActions("Modules/BimViewer/ToolSao", ["setSaoSettings"])
    }
};
</script>

<template>
    <div class="ToolSao">
        <IconButton
            :disabled="modeSaoNotSupported"
            :aria="modeSaoNotSupported ? '' : modeSaoAriaLabel"
            :title="modeSaoAriaLabel"
            :class-array="[modeSaoStatus === true ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
            :icon="modeSaoStatus ? 'bi-lightbulb' : 'bi-lightbulb-off'"
            :interaction="() => setSaoSettings({enabled: !modeSaoStatus})"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ToolSao {
        button:disabled {
            background-color: $white;
        }

        .btn-primary:hover,
        .bim-btn-highlight,
        .bim-btn-highlight:hover {
            color: $white;
            background-color: $secondary;
        }
    }
}
</style>
