<script>
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolObjectInfo",
    components: {
        IconButton
    },
    computed: {
        xeokitViewer () {
            return this.$store.getters["Modules/BimViewer/xeokitViewer"];
        },
        modeObjectInfoActive: {
            get () {
                return Boolean(this.$store.getters["Modules/BimViewer/ToolObjectInfo/modeObjectInfoActive"]
                    || this.$store.getters["Modules/BimViewer/ToolObjectInfo/pickedObjectId"]);
            },
            set (value) {
                this.$store.commit("Modules/BimViewer/ToolObjectInfo/setModeObjectInfoActive", value);

                if (!value) {
                    this.$store.dispatch("Modules/BimViewer/ToolObjectInfo/reset");
                }
            }
        },
        ariaLabel () {
            return this.$t("modules.bimViewer.tools.objectInfoAriaLabel");
        }
    },
    watch: {
        xeokitViewer () {
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
        <IconButton
            :aria="ariaLabel"
            :title="ariaLabel"
            :class="[modeObjectInfoActive ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
            icon="bi-info-circle"
            :interaction="() => setActive()"
        />
    </div>
</template>


<style lang="scss">
@import "~variables";

div.ToolObjectInfo {
    .btn-primary:hover,
    .bim-btn-highlight,
    .bim-btn-highlight:hover {
        color: $white;
        background-color: $secondary;
    }
}
</style>

