<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../../store/gettersBimViewer";
import mutations from "../../store/mutationsBimViewer";
import ToolFilter from "./ToolFilter.vue";
import ToolMeasurements from "./ToolMeasurements.vue";
import ToolSao from "./ToolSao.vue";
import ToolObjectInfo from "./ToolObjectInfo.vue";
import ToolUpload from "./ToolUpload.vue";
import ToolCameraReset from "./ToolCameraReset.vue";
import ToolSceneFit from "./ToolSceneFit.vue";
import ToolSceneSelector from "./ToolSceneSelector.vue";

export default {
    name: "ToolArea",
    components: {
        ToolSceneSelector,
        ToolSceneFit,
        ToolCameraReset,
        ToolUpload,
        ToolObjectInfo,
        ToolSao,
        ToolMeasurements,
        ToolFilter
    },
    emits: [
        "sceneSelected",
        "toggleSidebarLeft",
        "toggleSidebarRight"
    ],
    data () {
        return {
            sidebarLeftOpen: false,
            sidebarRightOpen: false
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", Object.keys(getters)),
        ...mapGetters(["uiStyle"]),
        toggleRightSidebar: {
            get () {
                return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
            },
            set (value) {
                this.$store.commit("Modules/BimViewer/setToggleRightSidebar", value);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/BimViewer", Object.keys(mutations)),
        onSceneSelected (index) {
            this.$emit("sceneSelected", index);
        },
        toggleSidebarLeft () {
            this.sidebarLeftOpen = !this.sidebarLeftOpen;

            this.$emit("toggleSidebarLeft", this.sidebarLeftOpen);
        },
        toggleSidebarRight () {
            this.toggleRightSidebar = !this.toggleRightSidebar;

            this.$emit("toggleSidebarRight", this.toggleRightSidebar);
        }
    }
};
</script>

<template>
    <div
        id="ToolArea"
        class="ToolArea"
    >
        <div class="buttons">
            <div class="leftSection">
                <button
                    :aria-label="$t('modules.bimViewer.tools.toggleSidebarLeftLabel')"
                    :title="$t('modules.bimViewer.tools.toggleSidebarLeftLabel')"
                    class="btn"
                    :class="[sidebarLeftOpen ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
                    @click="toggleSidebarLeft()"
                >
                    <i class="bi bi-diagram-3" />
                </button>

                <ToolCameraReset />

                <ToolSceneFit />

                <ToolUpload />

                <ToolMeasurements ref="toolMeasurements" />

                <ToolSao />

                <ToolSceneSelector @sceneSelected="onSceneSelected" />

                <ToolFilter ref="toolFilter" />
            </div>

            <div class="rightSection">
                <ToolObjectInfo ref="toolObjectInfo" />

                <button
                    :aria-label="$t('modules.bimViewer.tools.toggleSidebarRightLabel')"
                    :title="$t('modules.bimViewer.tools.toggleSidebarRightLabel')"
                    class="btn"
                    :class="[toggleRightSidebar ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
                    @click="toggleSidebarRight()"
                >
                    <i class="bi bi-layout-sidebar-inset-reverse" />
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
div.ToolArea {
    margin: 0 0 0.5rem 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;

    button i::before {
        line-height: inherit !important;
    }

    div.buttons {
        display: flex;
        justify-content: space-between;
        width: 100%;

        div.leftSection {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        div.rightSection {
            display: flex;
            flex-direction: row;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }

    .btn-primary:hover,
    .bim-btn-highlight,
    .bim-btn-highlight:hover {
        color: #FFF;
        background-color: #004996;
    }
}
</style>
