<script>
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolSao",
    components: {
        IconButton
    },
    computed: {
        /**
         * @return {bool|null} Status null=not available, false=Off or true=On
         */
        modeSaoStatus () {
            return this.$store.getters["Modules/BimViewer/ToolSao/saoStatus"];
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
        setSaoSettings (options) {
            this.$store.dispatch("Modules/BimViewer/ToolSao/setSaoSettings", options);
        }
    }
};
</script>

<template>
    <div class="ToolSao">
        <IconButton
            :disabled="modeSaoNotSupported"
            :aria="modeSaoNotSupported ? '' : modeSaoAriaLabel"
            :title="modeSaoAriaLabel"
            :class="[modeSaoStatus === true ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
            :icon="modeSaoStatus ? 'bi-lightbulb' : 'bi-lightbulb-off'"
            :interaction="() => setSaoSettings({enabled: !modeSaoStatus})"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

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
</style>
