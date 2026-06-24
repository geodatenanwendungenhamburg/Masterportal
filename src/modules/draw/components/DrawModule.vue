<script>
import {markRaw} from "vue";
import {mapGetters, mapMutations} from "vuex";
import VectorSource from "ol/source/Vector.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";

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
            source: markRaw(new VectorSource())
        };
    },
    computed: {
        ...mapGetters("Modules/DrawShared", [
            "buttonsDisabled"
        ]),
        ...mapGetters("Modules/Draw", [
            "circleOptions",
            "currentLayout",
            "currentLayoutOuterCircle",
            "drawEdits",
            "drawIcons",
            "drawTypesGeometrie",
            "drawTypesMain",
            "drawTypesSymbols",
            "iconList",
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
        const drawLayerId = "importDrawLayer";
        let existingLayer = layerCollection.getLayerById(drawLayerId);

        if (!existingLayer) {
            existingLayer = layerFactory.createLayer({
                id: drawLayerId,
                name: drawLayerId,
                typ: "VECTORBASE",
                type: "layer",
                visibility: true,
                showInLayerTree: true,
                alwaysOnTop: true,
                isDynamic: true
            }, "2D");

            if (existingLayer) {
                existingLayer.layer.setZIndex(9999999);
                layerCollection.addLayer(existingLayer);

                this.$store.dispatch("addLayerToLayerConfig", {
                    layerConfig: {
                        id: drawLayerId,
                        name: drawLayerId,
                        typ: "VECTORBASE",
                        type: "layer",
                        visibility: true,
                        showInLayerTree: true,
                        isDynamic: true
                    },
                    parentKey: treeSubjectsKey
                });
            }
        }

        if (existingLayer) {
            this.layer = markRaw(existingLayer.layer);
            this.source = markRaw(this.layer.getSource());
        }
    },
    methods: {
        ...mapMutations("Modules/Draw", [
            "addDrawTypeSymbol",
            "incrementIdCounter",
            "setCircleOptions",
            "setCurrentLayout",
            "setCurrentLayoutOuterCircle",
            "setLineLength",
            "setSelectedDrawType",
            "setSelectedDrawTypeMain",
            "setSelectedInteraction",
            "setSelectedSymbol"
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
                containerElement = document.getElementById("main-drawtypes-container"),
                buttonPosition = buttonElement ? buttonElement.getBoundingClientRect() : {left: 0, right: 0},
                containerPosition = containerElement ? containerElement.getBoundingClientRect() : {left: 0};

            return buttonPosition.left + (buttonPosition.right - buttonPosition.left) / 2 - containerPosition.left + 6;
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
                    :add-draw-type-symbol="addDrawTypeSymbol"
                    :buttons-disabled="buttonsDisabled"
                    :circle-options="circleOptions"
                    :current-layout="currentLayout"
                    :current-layout-outer-circle="currentLayoutOuterCircle"
                    :draw-icons="drawIcons"
                    :draw-types="drawTypesMain"
                    :draw-types-geometrie="drawTypesGeometrie"
                    :draw-types-main="drawTypesMain"
                    :draw-types-symbols="drawTypesSymbols"
                    :icon-list="iconList"
                    :increment-id-counter="incrementIdCounter"
                    :selected-draw-type="selectedDrawType"
                    :selected-draw-type-main="selectedDrawTypeMain"
                    :selected-interaction="selectedInteraction"
                    :set-line-length="setLineLength"
                    :set-selected-draw-type="setSelectedDrawType"
                    :set-selected-draw-type-main="setSelectedDrawTypeMain"
                    :set-selected-interaction="setSelectedInteraction"
                    :set-selected-symbol="setSelectedSymbol"
                    :source="source"
                    :should-emit-events="false"
                    :text-labels="true"
                    :draw-layout="true"
                    button-variant="btn-secondary"
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
                        :add-draw-type-symbol="addDrawTypeSymbol"
                        :buttons-disabled="buttonsDisabled"
                        :circle-options="circleOptions"
                        :current-layout="currentLayout"
                        :current-layout-outer-circle="currentLayoutOuterCircle"
                        :draw-icons="drawIcons"
                        :draw-types="drawTypesGeometrie"
                        :draw-types-geometrie="drawTypesGeometrie"
                        :draw-types-main="drawTypesMain"
                        :draw-types-symbols="drawTypesSymbols"
                        :icon-list="iconList"
                        :increment-id-counter="incrementIdCounter"
                        :selected-draw-type="selectedDrawType"
                        :set-line-length="setLineLength"
                        :set-selected-draw-type="setSelectedDrawType"
                        :set-selected-symbol="setSelectedSymbol"
                        :source="source"
                        :should-emit-events="false"
                        :text-labels="true"
                        :draw-layout="true"
                        button-variant="btn-secondary"
                    />
                    <DrawTypes
                        v-else-if="selectedDrawTypeMain === 'symbols'"
                        class="mt-4"
                        :add-draw-type-symbol="addDrawTypeSymbol"
                        :buttons-disabled="buttonsDisabled"
                        :current-layout="currentLayout"
                        :draw-icons="drawIcons"
                        :draw-types="drawTypesSymbols"
                        :draw-types-geometrie="drawTypesGeometrie"
                        :draw-types-main="drawTypesMain"
                        :draw-types-symbols="drawTypesSymbols"
                        :icon-list="iconList"
                        :increment-id-counter="incrementIdCounter"
                        :selected-draw-type="selectedDrawType"
                        :set-line-length="setLineLength"
                        :set-selected-draw-type="setSelectedDrawType"
                        :set-selected-symbol="setSelectedSymbol"
                        :source="source"
                        :should-emit-events="false"
                        :text-labels="true"
                        :draw-layout="true"
                        button-variant="btn-secondary"
                    />
                </div>
            </LayoutFrame>
        </div>
        <LayoutFrame
            v-if="
                selectedDrawTypeMain === 'pen' ||
                    selectedDrawTypeMain === 'writeText' ||
                    ['line', 'box', 'circle', 'polygon', 'doubleCircle', 'square'].includes(selectedDrawType)
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
                    button-variant="btn-secondary"
                />
                <DrawLayout
                    v-if="selectedDrawType === 'doubleCircle'"
                    class="mt-4"
                    :circle-type="'outerCircle'"
                    :current-layout="currentLayoutOuterCircle"
                    :selected-draw-type="selectedDrawType"
                    :set-current-layout="setCurrentLayoutOuterCircle"
                    :stroke-range="strokeRange"
                    button-variant="btn-secondary"
                />
            </div>
        </LayoutFrame>
    </div>
</template>

<style lang="scss" scoped>

.drawtypes-container {
    align-items: left;
}

#modules-draw-module {
    overflow-x: hidden;
    overflow-y: auto;
}

.selected-drawtypes-container {
    display: flex;
    flex-wrap: wrap;
    margin-top: 1rem;
    width: auto;
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
