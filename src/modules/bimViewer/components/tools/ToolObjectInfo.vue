<script>
import {mapGetters, mapMutations, mapActions} from "vuex";

import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolObjectInfo",
    components: {
        IconButton
    },
    computed: {
        ...mapGetters("Modules/BimViewer", ["xeokitViewer"]),
        ...mapGetters("Modules/BimViewer/ToolObjectInfo", [
            "modeObjectInfoActive",
            "pickedObjectId"
        ]),
        modeObjectInfoActiveProxy: {
            get () {
                return Boolean(this.modeObjectInfoActive || this.pickedObjectId);
            },
            set (value) {
                this.setModeObjectInfoActive(value);

                if (!value) {
                    this.reset();
                }
            }
        },
        ariaLabel () {
            return this.$t("modules.bimViewer.tools.objectInfoAriaLabel");
        }
    },
    watch: {
        xeokitViewer () {
            this.initialize();
        }
    },
    methods: {
        ...mapMutations("Modules/BimViewer/ToolObjectInfo", ["setModeObjectInfoActive"]),
        ...mapActions("Modules/BimViewer/ToolObjectInfo", ["reset", "initialize"]),
        setActive () {
            this.modeObjectInfoActiveProxy = !this.modeObjectInfoActiveProxy;

            if (this.modeObjectInfoActiveProxy === true) {
                this.$parent.$refs.toolMeasurements.setActive(false);
            }
            else {
                this.reset();
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

#bim-viewer {
    div.ToolObjectInfo {
        .btn-primary:hover,
        .bim-btn-highlight,
        .bim-btn-highlight:hover {
            color: $white;
            background-color: $secondary;
        }
    }
}
</style>

