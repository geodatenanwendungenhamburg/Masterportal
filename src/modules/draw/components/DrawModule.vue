<script>
import {mapGetters, mapMutations} from "vuex";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import DrawEdit from "@shared/modules/draw/components/DrawEdit.vue";
import DrawLayout from "@shared/modules/draw/components/DrawLayout.vue";
import DrawSettingsCircle from "@shared/modules/draw/components/DrawSettingsCircle.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import LayoutFrame from "@shared/modules/layoutFrame/components/LayoutFrame.vue";

/**
 * Modules to make drawings.
 * @module modules/draw/components/DrawModule
 * @vue-data {ol/layer/Vector} layer - The vector layer for drawings.
 * @vue-data {ol/source/Vector} source - The vector source for drawings.
 */
export default {
    name: "DrawModule",
    components: {
        DrawEdit,
        DrawLayout,
        DrawSettingsCircle,
        DrawTypes,
        LayoutFrame
    },
    data () {
        return {
            layer: null,
            source: new VectorSource()
        };
    },
    computed: {
        ...mapGetters("Modules/Draw", [
            "circleOptions",
            "currentLayout",
            "currentLayoutOuterCircle",
            "drawEdits",
            "drawIcons",
            "drawTypesGeometrie",
            "drawTypesMain",
            "drawTypesSymbols",
            "name",
            "selectedDrawType",
            "selectedDrawTypeMain",
            "selectedInteraction",
            "strokeRange",
            "units"
        ]),
        ...mapGetters("Menu", [
            "currentComponentName",
            "mainExpanded",
            "secondaryExpanded"
        ])
    },
    mounted () {
        const drawLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => layer.get("id") === "importDrawLayer");

        if (typeof drawLayer === "undefined") {
            this.layer = new VectorLayer({
                id: "importDrawLayer",
                name: "importDrawLayer",
                source: this.source,
                zIndex: 99999999999 // alwaysOnTop am Layer?! OL Layer vs unsere Layer
            });

            mapCollection.getMap("2D").addLayer(this.layer);
        }
        else {
            this.layer = drawLayer;
            this.source = drawLayer.getSource();
        }
    },
    methods: {
        ...mapMutations("Modules/Draw", [
            "setCircleOptions",
            "setCurrentLayout",
            "setCurrentLayoutOuterCircle",
            "setSelectedDrawType",
            "setSelectedDrawTypeMain",
            "setSelectedInteraction"
        ]),
        getTrianglePosition (selectedDrawTypeMain, selectedDrawType, triangleId) {
            let buttonId;

            if (triangleId === "first" && (selectedDrawTypeMain === "geometries" || selectedDrawTypeMain === "symbols")) {
                buttonId = "draw-" + selectedDrawTypeMain;
            }
            else if (triangleId === "second" && (selectedDrawTypeMain === "pen" || selectedDrawTypeMain === "writeText")) {
                buttonId = "draw-" + selectedDrawTypeMain;
            }

            if (triangleId === "second" && (selectedDrawTypeMain === "geometries" || selectedDrawTypeMain === "symbols") && selectedDrawType !== "") {
                buttonId = "draw-" + selectedDrawType;
            }

            if (!buttonId) {
                console.error("buttonId is undefined or null.");
                return 0;
            }

            const buttonElement = document.getElementById(buttonId),
                buttonPosition = buttonElement ? buttonElement.getBoundingClientRect() : 0,
                buttonPositionRight = buttonPosition.right,
                buttonPositionLeft = buttonPosition.left;

            return buttonPositionLeft + (buttonPositionRight - buttonPositionLeft) / 2 - 23;
        }
    }
};
</script>

<template lang="html">
    <div
        id="modules-draw-module"
        class="d-flex flex-column drawtypes-container"
    >
        <div
            id="draw-edit"
        >
            <DrawEdit
                :draw-edits="drawEdits"
                :draw-icons="drawIcons"
                :layer="layer"
                :selected-interaction="selectedInteraction"
                :set-selected-interaction="setSelectedInteraction"
            />
        </div>
        <div
            id="draw-types"
            class="mb-2"
        >
            <div
                id="main-drawtypes-container"
                class="d-flex mb-2 drawtypes-container"
            >
                <DrawTypes
                    :circle-options="circleOptions"
                    :current-layout="currentLayout"
                    :current-layout-outer-circle="currentLayoutOuterCircle"
                    :draw-icons="drawIcons"
                    :draw-types="drawTypesMain"
                    :selected-draw-type="selectedDrawType"
                    :selected-draw-type-main="selectedDrawTypeMain"
                    :selected-interaction="selectedInteraction"
                    :set-selected-draw-type="setSelectedDrawType"
                    :set-selected-draw-type-main="setSelectedDrawTypeMain"
                    :set-selected-interaction="setSelectedInteraction"
                    :source="source"
                    :should-emit-events="false"
                    :text-labels="true"
                    :draw-layout="true"
                />
            </div>
            <LayoutFrame
                v-if="selectedDrawTypeMain === 'geometries' || selectedDrawTypeMain === 'symbols'"
                triangle
                :triangle-position="getTrianglePosition(selectedDrawTypeMain, selectedDrawType, 'first')"
                border-color="#D6E3FF"
                fill="#fff"
            >
                <div
                    class="d-flex mb-2 selected-drawtypes-container"
                >
                    <DrawTypes
                        v-if="selectedDrawTypeMain === 'geometries'"
                        class="mt-4"
                        :circle-options="circleOptions"
                        :current-layout="currentLayout"
                        :current-layout-outer-circle="currentLayoutOuterCircle"
                        :draw-icons="drawIcons"
                        :draw-types="drawTypesGeometrie"
                        :selected-draw-type="selectedDrawType"
                        :set-selected-draw-type="setSelectedDrawType"
                        :source="source"
                        :should-emit-events="false"
                        :text-labels="true"
                        :draw-layout="true"
                    />
                    <DrawTypes
                        v-else-if="selectedDrawTypeMain === 'symbols'"
                        class="mt-4"
                        :current-layout="currentLayout"
                        :draw-icons="drawIcons"
                        :draw-types="drawTypesSymbols"
                        :selected-draw-type="selectedDrawType"
                        :set-selected-draw-type="setSelectedDrawType"
                        :source="source"
                        :should-emit-events="false"
                        :text-labels="true"
                        :draw-layout="true"
                    />
                </div>
            </LayoutFrame>
        </div>
        <LayoutFrame
            v-if="
                selectedDrawTypeMain === 'pen' ||
                    selectedDrawTypeMain === 'writeText' ||
                    ['line', 'box', 'circle', 'polygon', 'doubleCircle', 'point', 'square'].includes(selectedDrawType)
            "
            triangle
            :triangle-position="getTrianglePosition(selectedDrawTypeMain, selectedDrawType, 'second')"
            border-color="#D6E3FF"
            fill="#fff"
            class="mb-2"
        >
            <div>
                <DrawSettingsCircle
                    v-if="selectedDrawType === 'circle' || selectedDrawType === 'doubleCircle'"
                    :circle-options="circleOptions"
                    :selected-draw-type="selectedDrawType"
                    :set-circle-options="setCircleOptions"
                    :units="units"
                />
            </div>
            <div
                id="draw-layouts"
                class="mb-2"
            >
                <DrawLayout
                    v-if="selectedDrawType !== ''"
                    :current-layout="currentLayout"
                    :selected-draw-type="selectedDrawType"
                    :set-current-layout="setCurrentLayout"
                    :stroke-range="strokeRange"
                />
                <DrawLayout
                    v-if="selectedDrawType === 'doubleCircle'"
                    class="mt-4"
                    :circle-type="'outerCircle'"
                    :current-layout="currentLayoutOuterCircle"
                    :selected-draw-type="selectedDrawType"
                    :set-current-layout="setCurrentLayoutOuterCircle"
                    :stroke-range="strokeRange"
                />
            </div>
        </LayoutFrame>
    </div>
</template>

<style lang="scss" scoped>

.drawtypes-container {
    align-items: left;
}

.selected-drawtypes-container {
    display: flex;
    flex-wrap: wrap;
    margin-top: 1rem;
    width: auto;
    overflow-x: scroll;
    > div {
        width: 5rem;
    }
}

#draw-layouts {
    margin-left: 0.2rem;
    margin-top: 0.5rem;
}

#main-drawtypes-container {
    margin-left: 0.65rem;
}

#draw-types :deep(.btn-wrapper) {
    width: 5rem;
    align-items: center;
}

#draw-types :deep(.btn) {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.6rem;
}

</style>
