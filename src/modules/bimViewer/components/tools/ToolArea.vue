<script>
import {mapGetters, mapMutations} from "vuex";
import ToolFilter from "./ToolFilter.vue";
import ToolMeasurements from "./ToolMeasurements.vue";
import ToolSao from "./ToolSao.vue";
import ToolObjectInfo from "./ToolObjectInfo.vue";
import ToolUpload from "./ToolUpload.vue";
import ToolSceneReset from "./ToolSceneReset.vue";
import ToolSceneFit from "./ToolSceneFit.vue";
import ToolSceneSelector from "./ToolSceneSelector.vue";
import ToolDownloadBCFViewpointJson from "./ToolDownloadBCFViewpointJson.vue";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolArea",
    components: {
        ToolDownloadBCFViewpointJson,
        ToolSceneSelector,
        ToolSceneFit,
        ToolSceneReset,
        ToolUpload,
        ToolObjectInfo,
        ToolSao,
        ToolMeasurements,
        ToolFilter,
        IconButton
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
        ...mapGetters("Modules/BimViewer", [
            "toggleRightSidebar",
            "sceneConfigs"
        ]),
        toggleRightSidebarProxy: {
            get () {
                return this.toggleRightSidebar;
            },
            set (value) {
                this.setToggleRightSidebar(value);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/BimViewer", [
            "setToggleRightSidebar"
        ]),
        onSceneSelected (index) {
            this.$emit("sceneSelected", index);
        },
        toggleSidebarLeft () {
            this.sidebarLeftOpen = !this.sidebarLeftOpen;

            this.$emit("toggleSidebarLeft", this.sidebarLeftOpen);
        },
        toggleSidebarRight () {
            this.toggleRightSidebarProxy = !this.toggleRightSidebarProxy;

            this.$emit("toggleSidebarRight", this.toggleRightSidebarProxy);
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
                <IconButton
                    :class-array="[
                        'btn-primary',
                        sidebarLeftOpen ? 'bim-btn-highlight' : ''
                    ]"
                    :aria="$t('modules.bimViewer.tools.toggleSidebarLeftLabel')"
                    :title="$t('modules.bimViewer.tools.toggleSidebarLeftLabel')"
                    icon="bi-diagram-3"
                    :interaction="() => toggleSidebarLeft()"
                    @keydown.enter="toggleSidebarLeft"
                />

                <ToolSceneSelector @sceneSelected="onSceneSelected" />

                <ToolUpload />

                <ToolSceneReset />

                <ToolSceneFit />

                <ToolDownloadBCFViewpointJson />

                <ToolMeasurements ref="toolMeasurements" />

                <ToolSao />

                <ToolFilter ref="toolFilter" />
            </div>

            <div class="rightSection">
                <ToolObjectInfo ref="toolObjectInfo" />

                <IconButton
                    :aria="$t('modules.bimViewer.tools.toggleSidebarRightLabel')"
                    :title="$t('modules.bimViewer.tools.toggleSidebarRightLabel')"
                    :class-array="[toggleRightSidebar ? 'btn-primary bim-btn-highlight' : 'btn-primary']"
                    icon="bi-layout-sidebar-inset-reverse"
                    :interaction="() => toggleSidebarRight()"
                    @keydown.enter="toggleSidebarRight"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ToolArea {
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
                gap: 0.2rem;
            }

            div.rightSection {
                display: flex;
                flex-direction: row;
                gap: 0.2rem;
                align-items: flex-start;
            }
        }

        .btn-primary:hover,
        .bim-btn-highlight,
        .bim-btn-highlight:hover {
            color: $white;
            background-color: $secondary;
        }

        .btn {
            i {
                font-size: 1rem;
            }
        }
    }
}
</style>
