<script>
export default {
    name: "ToolObjectInfo",
    computed: {
        xeokitIfcViewer () {
            return this.$store.getters["Modules/BimViewer/xeokitIfcViewer"];
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
            :class="[modeObjectInfoActive === true ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
            @click="setActive()"
        >
            <i class="bi bi-info-circle" />
        </button>
    </div>
</template>
