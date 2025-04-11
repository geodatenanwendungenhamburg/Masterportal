<script>
export default {
    name: "ToolObjectInfo",
    computed: {
        xeokitIfcViewer () {
            return this.$store.getters["Modules/BimViewer/xeokitIfcViewer"];
        },
        modeObjectInfoActive: {
            get () {
                return this.$store.getters["Modules/BimViewer/ToolObjectInfo/modeObjectInfoActive"];
            },
            set (value) {
                this.$store.commit("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", value);
            }
        },
        ariaLabel () {
            return this.$t("modules.bimViewer.tools.objectInfoAriaLabel");
        }
    },
    watch: {
        xeokitIfcViewer () {
            this.$store.dispatch("Modules/BimViewer/ToolObjectInfo/initialize");
        }
    },
    methods: {
        setActive () {
            this.modeObjectInfoActive = !this.modeObjectInfoActive;

            if (this.modeObjectInfoActive === true) {
                this.$parent.$refs.toolMeasurements.setActive(false);
            }
            else {
                this.$store.dispatch("Modules/BimViewer/ToolObjectInfo/reset");
            }
        }
    }
};
</script>

<template>
    <div class="ToolObjectInfo">
        <button
            :aria-label="ariaLabel"
            :title="ariaLabel"
            class="btn"
            :class="[modeObjectInfoActive === true ? 'bim-btn-highlight' : 'btn-primary']"
            @click="setActive()"
        >
            <i class="bi bi-info-circle" />
        </button>
    </div>
</template>

<style lang="scss">
div.ToolObjectInfo {
}
</style>
