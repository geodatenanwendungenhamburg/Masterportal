<script>
export default {
    name: "ToolSao",
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
        <button
            :disabled="modeSaoNotSupported"
            :aria-disabled="modeSaoNotSupported"
            :aria-label="modeSaoAriaLabel"
            :title="modeSaoAriaLabel"
            class="btn btn-primary"
            :class="{'bim-btn-highlight': modeSaoStatus}"
            @click="setSaoSettings({enabled: !modeSaoStatus})"
        >
            <i :class="[modeSaoStatus ? 'bi bi-lightbulb' : 'bi bi-lightbulb-off']" />
        </button>
    </div>
</template>

<style lang="scss">
div.ToolSao {
    button:disabled {
        background-color: #fff;
    }
}
</style>
