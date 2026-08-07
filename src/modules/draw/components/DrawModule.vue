<script>
import {markRaw, nextTick} from "vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import VectorSource from "ol/source/Vector.js";
import layerCollection from "@core/layers/js/layerCollection.js";

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
        ...mapGetters("Modules/Draw", [
            "buttonsDisabled"
        ]),
        ...mapGetters("Modules/Draw", [
            "circleOptions",
            "currentLayout",
            "currentLayoutOuterCircle",
            "drawEdits",
            "drawIcons",
            "drawSymbolSettings",
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
    watch: {
        selectedDrawTypeMain (newVal) {
            if (newVal === "geometries" || newVal === "symbols") {
                nextTick(() => {
                    const subDrawTypes = newVal === "geometries"
                        ? this.$refs.geometriesDrawTypes
                        : this.$refs.symbolsDrawTypes;

                    subDrawTypes?.focus();
                });
            }
            else if (newVal === "pen" || newVal === "writeText") {
                nextTick(() => {
                    this.focusSecondPanel();
                });
            }
        },
        selectedDrawType (newVal) {
            if (["line", "box", "circle", "polygon", "doubleCircle", "square", "iconPoint"].includes(newVal)) {
                nextTick(() => {
                    this.focusSecondPanel();
                });
            }
        }
    },
    mounted () {
        this.applyLegacyDrawSymbolSettings();
        this.initializeDrawLayer();

        const existingLayer = layerCollection.getLayerById("importDrawLayer");

        if (existingLayer) {
            this.layer = markRaw(existingLayer.layer);
            this.source = markRaw(this.layer.getSource());
        }
    },
    methods: {
        ...mapActions("Modules/Draw", [
            "initializeDrawLayer"
        ]),
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
        /**
         * Applies legacy draw_old symbol settings from config to the new layout model.
         * @returns {void}
         */
        applyLegacyDrawSymbolSettings () {
            if (!this.drawSymbolSettings || typeof this.drawSymbolSettings !== "object") {
                return;
            }

            const legacyColor = this.drawSymbolSettings.color,
                  hasColor = Array.isArray(legacyColor) && legacyColor.length >= 3,
                  hasAlphaInColor = Array.isArray(legacyColor) && legacyColor.length > 3 && typeof legacyColor[3] === "number";

            if (!hasColor && !hasAlphaInColor) {
                return;
            }

            const nextLayout = {};

            if (hasColor) {
                nextLayout.fillColor = legacyColor.slice(0, 3);
            }

            if (hasAlphaInColor) {
                const normalizedOpacity = Math.max(0, Math.min(1, legacyColor[3]));

                nextLayout.fillTransparency = Math.round((1 - normalizedOpacity) * 100);
            }

            this.setCurrentLayout(nextLayout);
        },
        /**
         * Moves focus to the first focusable element in the second settings panel (DrawLayout / DrawSettingsCircle).
         * For circle types, focuses DrawSettingsCircle; otherwise focuses DrawLayout.
         * @returns {void}
         */
        focusSecondPanel () {
            if ((this.selectedDrawType === "circle" || this.selectedDrawType === "doubleCircle") && this.$refs.circleSettings) {
                this.$refs.circleSettings.focus();
            }
            else if (this.$refs.drawLayout) {
                this.$refs.drawLayout.focus();
            }
        },
        /**
         * Calculates the horizontal pixel offset of a triangle indicator relative to its container.
         * @param {String} selectedDrawTypeMain The main draw type category (e.g. "geometries", "symbols", "pen", "writeText").
         * @param {String} selectedDrawType The specific draw type (e.g. "line", "circle").
         * @param {String} triangleId Which triangle to position — "first" or "second".
         * @returns {Number} The horizontal offset in pixels, or 0 if the button cannot be resolved.
         */
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
                        ref="geometriesDrawTypes"
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
                        ref="symbolsDrawTypes"
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
                    ['line', 'box', 'circle', 'polygon', 'doubleCircle', 'square', 'iconPoint'].includes(selectedDrawType)
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
                    ref="circleSettings"
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
                    ref="drawLayout"
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
