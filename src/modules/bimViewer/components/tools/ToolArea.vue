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
import ToolRightSidebar from "./ToolRightSidebar.vue";

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
        ToolFilter,
        ToolRightSidebar
    },
    computed: {
        ...mapGetters("Modules/BimViewer", Object.keys(getters)),
        ...mapGetters(["uiStyle"]),
        toggleRightSidebar: {
            get () {
                return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
            }
        }
    },
    methods: {
        ...mapMutations("Modules/BimViewer", Object.keys(mutations)),
        onSceneSelected (index) {
            this.$emit("sceneSelected", index);
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
            <ToolCameraReset />

            <ToolSceneFit />

            <ToolUpload />

            <ToolObjectInfo ref="toolObjectInfo" />

            <ToolMeasurements ref="toolMeasurements" />

            <ToolSao />

            <ToolSceneSelector @sceneSelected="onSceneSelected" />

            <ToolFilter ref="toolFilter" />
        </div>

        <ToolRightSidebar />
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
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .btn-primary:hover,
    .bim-btn-highlight,
    .bim-btn-highlight:hover {
        color: #FFF;
        background-color: #004996;
    }
}
</style>
