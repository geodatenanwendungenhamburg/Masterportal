<script>
import {convertColor} from "@shared/js/utils/convertColor.js";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

/**
 * Shared component that provides buttons for setting the layout of drawings.
 * @module shared/modules/draw/DrawLayout
 * @vue-prop {String} [circleType="innerCircle"] - The circle type "innerCircle" or "outerCircle".
 * @vue-prop {Object} currentLayout - The current layout for the styling.
 * @vue-prop {String} selectedDrawType - The selected draw type.
 * @vue-prop {Function} setCurrentLayout - Setter for current layout.
 * @vue-prop {Number[]} [strokeRange=[1, 32]] - The stroke range in the unit pixel.
 * @vue-prop {Boolean} [hasExtrudedHeight=false] - Whether the layout includes extruded height.
 * @vue-data {String} activeLayoutKey - The currently activated layout.
 * @vue-data {Object} mappingLayout - The mapping object for layout.
 */
export default {
    name: "DrawLayout",
    components: {
        SliderItem,
        InputText
    },
    props: {
        circleType: {
            type: String,
            default () {
                return "innerCircle";
            }
        },
        currentLayout: {
            type: Object,
            required: true
        },
        selectedDrawType: {
            type: String,
            required: true
        },
        setCurrentLayout: {
            type: Function,
            required: true
        },
        strokeRange: {
            type: Array,
            default () {
                return [1, 32];
            }
        },
        hasExtrudedHeight: {
            type: Boolean,
            default: false
        }
    },
    data () {
        const mappingLayout = {
            fillColor: {
                drawTypes: ["box", "circle", "doubleCircle", "point", "polygon", "rectangle", "writeText", "square"],
                icon: "bi-paint-bucket"
            },
            strokeColor: {
                drawTypes: ["box", "circle", "doubleCircle", "line", "pen", "point", "polygon", "rectangle", "square"],
                icon: "bi-pencil-fill"
            },
            strokeWidth: {
                drawTypes: ["box", "circle", "doubleCircle", "line", "pen", "point", "polygon", "rectangle", "square"],
                icon: "bi-border-width"
            },
            fillTransparency: {
                drawTypes: ["box", "circle", "doubleCircle", "point", "polygon", "rectangle", "writeText", "pen", "line", "square"],
                icon: "bi-droplet-half"
            }
        };

        if (this.hasExtrudedHeight) {
            mappingLayout.extrudedHeight = {
                drawTypes: ["polygon", "rectangle"],
                icon: "bi-box-arrow-up"
            };
        }

        return {
            activeLayoutKey: "",
            mappingLayout,
            trianglePosition: null,
            drawTypesMain: ["pen", "writeText", "geometries", "symbols"]
        };
    },
    computed: {
        /**
         * Return the mapping layout filtered by selected draw type.
         * @returns {Object} The mapping layout for selected draw type.
         */
        mappingLayoutBySelectedDrawType () {
            const filteredMappingLayout = {};

            Object.keys(this.mappingLayout).forEach(layout => {
                if (this.mappingLayout[layout]?.drawTypes?.includes(this.selectedDrawType)) {
                    filteredMappingLayout[layout] = this.mappingLayout[layout];
                }
            });

            return filteredMappingLayout;
        }
    },
    watch: {
        selectedDrawType () {
            this.activeLayoutKey = "";
            if (this.drawTypesMain.includes(this.selectedDrawType)) {
                this.updateTrianglePosition(this.selectedDrawType);
            }
        }
    },
    methods: {
        convertColor,

        /**
         * Sets the active layoutKey.
         * @param {String} layoutKey The key of layout element.
         * @returns {void}
         */
        setActiveLayoutKey (layoutKey) {
            this.activeLayoutKey = layoutKey;
        },

        /**
         * Updates the triangle position to point to the active button.
         * @param {String} layoutKey The key of the active layout element.
         * @returns {void}
         */
        updateTrianglePosition (type) {
            const containerElement = document.getElementById("main-drawtypes-container"),
                buttonId = `draw-${type}`,
                buttonElement = document.getElementById(buttonId);

            if (buttonElement && containerElement) {
                const buttonRect = buttonElement.getBoundingClientRect(),
                    containerRect = containerElement.getBoundingClientRect();

                this.trianglePosition = buttonRect.x + buttonRect.width / 2 - containerRect.x;
            }
        },

        /**
         * Update the current layout.
         * @param {String} layoutKey The key of layout element.
         * @param {String} value The value to be set.
         * @returns {void}
         */
        updateCurrentLayout (layoutKey, value) {
            let normalizedValue;

            if (layoutKey === "fillColor" || layoutKey === "strokeColor") {
                normalizedValue = convertColor(value, "rgb");
            }
            else if (layoutKey === "text" || layoutKey === "font") {
                normalizedValue = value;
            }
            else if (layoutKey === "fontSize") {
                normalizedValue = parseInt(value, 10);
            }
            else {
                normalizedValue = parseFloat(value);
            }

            this.setCurrentLayout({[layoutKey]: normalizedValue});
            this.$emit("update-current-layout", {[layoutKey]: normalizedValue});
        }
    }
};
</script>

<template>
    <div class="d-flex flex-column">
        <h5
            v-if="selectedDrawType === 'doubleCircle'"
            :for="'draw-layout-buttons-' + circleType"
            class="mb-2"
        >
            {{ $t("common:shared.modules.draw.drawLayout." + circleType) }}
        </h5>
        <div
            v-if="selectedDrawType === 'writeText'"
            class="write-text-container mt-4"
        >
            <div class="form-floating mb-3">
                <InputText
                    :id="selectedDrawType"
                    :label="$t('common:shared.modules.draw.drawTypes.writeText')"
                    :placeholder="$t('common:shared.modules.draw.drawTypes.writeText')"
                    :model-value="currentLayout.text"
                    @update:modelValue="val => updateCurrentLayout('text', val)"
                />
            </div>
            <div class="form-floating mb-3">
                <select
                    id="font-size-select"
                    class="form-select"
                    :value="currentLayout.fontSize"
                    @change="event => updateCurrentLayout('fontSize', event.target.value)"
                >
                    <option
                        v-for="size in [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]"
                        :key="size"
                        :value="size"
                    >
                        {{ size }}px
                    </option>
                </select>
                <label for="font-size-select">
                    {{ $t('common:shared.modules.draw.writeTextOptions.fontSize') }}
                </label>
            </div>
            <div class="form-floating mb-3">
                <select
                    id="font-select"
                    class="form-select"
                    :value="currentLayout.font"
                    @change="event => updateCurrentLayout('font', event.target.value)"
                >
                    <option
                        v-for="font in ['Arial', 'Times New Roman', 'Calibri']"
                        :key="font"
                        :value="font"
                    >
                        {{ font }}
                    </option>
                </select>
                <label for="font-select">
                    {{ $t('common:shared.modules.draw.writeTextOptions.font') }}
                </label>
            </div>
        </div>
        <div
            :id="'draw-layout-buttons-' + circleType"
            class="draw-layout-buttons d-flex flex-row align-items-center"
        >
            <div
                v-for="layoutKey in Object.keys(mappingLayoutBySelectedDrawType)"
                :key="layoutKey"
                class="button-container text-center"
            >
                <button
                    :id="'draw-layout-' + circleType + '-' + layoutKey"
                    :key="layoutKey"
                    :class="[
                        'btn',
                        'btn-primary',
                        activeLayoutKey === layoutKey ? 'active' : ''
                    ]"
                    @click="setActiveLayoutKey(layoutKey)"
                >
                    <i
                        :class="mappingLayout[layoutKey].icon"
                        role="img"
                    />
                    <span
                        v-if="layoutKey === 'fillColor' || layoutKey === 'strokeColor'"
                        class="color-preview"
                        :style="{ backgroundColor: convertColor(currentLayout[layoutKey], 'hex') }"
                    />
                    <span
                        v-else-if="layoutKey === 'fillTransparency'"
                        class="btn-value"
                    >
                        {{ currentLayout[layoutKey] + '%' }}
                    </span>

                    <span
                        v-else-if="layoutKey === 'strokeWidth'"
                        class="btn-value"
                    >
                        {{ currentLayout[layoutKey] + 'px' }}
                    </span>

                    <span
                        v-else-if="layoutKey === 'extrudedHeight' && hasExtrudedHeight"
                        class="btn-value"
                    >
                        {{ currentLayout[layoutKey] + 'm' }}
                    </span>
                    <input
                        v-if="layoutKey === 'fillColor' || layoutKey === 'strokeColor'"
                        type="color"
                        class="color-input-overlay"
                        :value="convertColor(currentLayout[layoutKey], 'hex')"
                        @input="event => updateCurrentLayout(layoutKey, event.target.value)"
                    >
                </button>
                <span
                    class="text-center btn-label"
                >
                    {{ $t(`common:shared.modules.draw.drawLayout.${layoutKey}`) }}
                </span>
            </div>
        </div>
        <div
            v-if="activeLayoutKey === 'strokeWidth'"
            class="d-flex mt-4"
        >
            <SliderItem
                :id="'slider-stroke-width-' + circleType"
                :aria="`${currentLayout.strokeWidth}px`"
                :label="`${currentLayout.strokeWidth}px`"
                :min="strokeRange[0].toString()"
                :max="strokeRange[1].toString()"
                :value="currentLayout.strokeWidth.toString()"
                :step="1"
                :interaction="event => updateCurrentLayout('strokeWidth', event.target.value)"
            />
        </div>
        <div
            v-else-if="activeLayoutKey === 'fillTransparency'"
            class="d-flex mt-4"
        >
            <SliderItem
                :id="'slider-fill-transparency-' + circleType"
                :aria="`${currentLayout.fillTransparency}%`"
                :label="`${currentLayout.fillTransparency}%`"
                :min="'0'"
                :max="'100'"
                :value="currentLayout.fillTransparency.toString()"
                :step="1"
                :interaction="event => updateCurrentLayout('fillTransparency', event.target.value)"
            />
        </div>
        <div
            v-else-if="activeLayoutKey === 'extrudedHeight' && hasExtrudedHeight"
            class="d-flex mt-4"
        >
            <SliderItem
                :id="'slider-extruded-height-' + circleType"
                :aria="`${currentLayout.extrudedHeight}m`"
                :label="`${currentLayout.extrudedHeight}m`"
                :min="'0'"
                :max="'100'"
                :value="currentLayout.extrudedHeight.toString()"
                :step="1"
                :interaction="event => updateCurrentLayout('extrudedHeight', event.target.value)"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.btn-label {
    display: block;
    font-size: 0.8rem;
}

.btn-value {
    font-size: 0.75rem;
    width: 100%;
    display: block;
}

.color-preview {
    display: block;
    width: 1.8rem;
    height: 0.6rem;
    border-radius: 4px;
}

.color-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
}

.btn {
    width: 3.65rem;
    height: 3.65rem;
    position: relative;
    text-align: center;
    top: auto;
    font-size: 1.143rem;
    border-radius: 50%;
    border: solid $white 1px;
    > label {
        position: absolute;
        cursor: pointer;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        line-height: 0.5rem;

        > input:hover{
            color: $white;
        }

        input[type="color"] {
            height: 0.5rem;
            width: 1.8rem;
            margin-top: .3rem;
        }

        span {
            font-size: $font_size_sm;
            padding-top: .3rem;
            width: 3rem;
            text-align: center;
            padding-top: 0.3rem;
        }
    }
}

.btn.active {
    > label {
        > input {
            color: $white;
        }
    }
}

input {
    cursor: pointer;
    border: none;
}

.button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 5rem;
    height: 7rem;
}
</style>
