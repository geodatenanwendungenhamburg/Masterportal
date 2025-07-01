<script>
import {mapGetters} from "vuex";

/**
 * SliderItem: A component for handling an input slider to let the user adjust some value (i.e. transparency of a layer).
 * @module shared/modules/slider/SliderItem
 * @vue-prop {String} aria - is used for accessibility, e.g. screenreaders take this string to describe the element to visually impaired users.
 * @vue-prop {String} id - can be used to give a distinct id to the slider-element.
 * @vue-prop {String} label - can be provided for a right-hand label to the slider - i.e. the transparency percentage as a numerical value.
 * @vue-prop {String} list - can be used to provide anchor points along the slider, i.e. "0,25,50" will give anchor points at each multiple of 25 along the slider.
 * @vue-prop {String|Number} min - can be used to set a minimal value for the slider. If no value is given 0 is the minimum.
 * @vue-prop {String|Number} max - can be used to set a maximum value for the slider. If no value is given 100 is the maximum.
 * @vue-prop {String|Number} step - can be used to define steps by which the slider can be moved, i.e. "10" will let the slider only take values that are multiples of 10.
 * @vue-prop {String|Number} value - is the current value of the slider.
 * @vue-prop {Boolean} disabled - can be used to disable any input to the slider.
 * @vue-prop {Function} interaction - can be used to define a function to be executed on each user interaction with the slider.
 * @vue-prop {[String]} classArray - is used to provide additional classes to the encapsulating div of the slider.
 * @vue-prop {Boolean} showMarkers - can be set to true to display additional markers on start, end and every 10% between them along the slider, but only if the slider width allows for that.
 * @vue-prop {String|Number} maxMarkers - can be used to display more or less markers as indicated by showMarkers. It defaults to 11 to show one marker every 10% of the sliders width.
 */
export default {
    name: "SliderItem",
    props: {
        aria: {
            type: String,
            required: true
        },
        id: {
            type: String,
            default: "shared-slider",
            required: false
        },
        label: {
            type: String,
            default: null,
            required: false
        },
        list: {
            type: String,
            default: null,
            required: false
        },
        min: {
            type: [String, Number],
            default: null,
            required: false
        },
        max: {
            type: [String, Number],
            default: null,
            required: false
        },
        step: {
            type: Number,
            default: null,
            required: false
        },
        value: {
            type: [String, Number],
            default: "0",
            required: false
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },
        interaction: {
            type: Function,
            default: () => {
                return true;
            },
            required: false
        },
        classArray: {
            type: Array,
            required: false,
            default: null
        },
        showMarkers: {
            type: Boolean,
            required: false,
            default: false
        },
        maxMarkers: {
            type: Number,
            required: false,
            default: 11
        }
    },
    data () {
        return {
            menuType: null
        };
    },
    computed: {
        ...mapGetters("Modules/ResizeHandle", ["mainMenuWidth", "secondaryMenuWidth"]),
        /**
         * Generates marker values based on slider range and dynamic marker count.
         * @returns {Array} An array of marker values to be displayed under the slider.
         */
        markers () {
            if (!this.showMarkers || Number(this.min) >= Number(this.max) || this.maxMarkers < 2) {
                return [];
            }

            const min = Number(this.min),
                max = Number(this.max),
                range = max - min,
                rawStepSize = range / (this.maxMarkers - 1),
                roundedStep = Math.pow(10, Math.floor(Math.log10(rawStepSize))),
                finalStep = Math.ceil(rawStepSize / roundedStep) * roundedStep,
                markers = new Set();

            for (let marker = min; marker <= max; marker += finalStep) {
                let roundedMarker = marker;

                if (marker !== min) {
                    roundedMarker = Math.round(marker);

                    if (finalStep >= 10) {
                        roundedMarker = Math.round(marker / 10) * 10;
                    }
                }

                markers.add(roundedMarker);

                if (markers.size >= this.maxMarkers) {
                    break;
                }
            }

            markers.add(Math.round(max));

            return Array.from(markers).sort((a, b) => a - b);
        },

        /**
         * Determines whether markers should be shown.
         * Considers the showMarkers prop and menu width.
         * @returns {Boolean} True if markers should be displayed, false otherwise.
         */
        shouldShowMarkers  () {
            const fontSize = 14,
                charWidthMultiplier = 1.1,
                charWidth = fontSize * charWidthMultiplier,
                maxMarkerLength = Math.max(...this.markers.map(marker => String(marker).length)),
                markerWidth = Math.max(50, charWidth * maxMarkerLength),

                totalWidth = this.markers.length * markerWidth,
                menuWidth = this.menuType === "mainMenu" ? this.mainMenuWidth : this.secondaryMenuWidth;

            return this.showMarkers && menuWidth > totalWidth;
        }
    },
    mounted () {
        const parentMenu = this.$el.closest(".mp-menu");

        if (parentMenu) {
            if (parentMenu.classList.contains("mp-mainMenu")) {
                this.menuType = "mainMenu";
            }
            else if (parentMenu.classList.contains("mp-secondaryMenu")) {
                this.menuType = "secondaryMenu";
            }
        }
    }
};
</script>

<template>
    <div
        class="slider-item d-flex"
        :class="classArray"
    >
        <div class="input-item">
            <!-- Slider -->
            <div class="input">
                <input
                    :id="id"
                    ref="sliderValue"
                    type="range"
                    class="slider"
                    :class="{'form-range': shouldShowMarkers}"
                    :list="list"
                    :value="value"
                    :aria-label="aria"
                    :min="min"
                    :max="max"
                    :step="step"
                    :disabled="disabled"
                    @input="interaction"
                >

                <div
                    v-if="shouldShowMarkers && markers.length > 0"
                    class="slider-dots"
                >
                    <span
                        v-for="(marker, index) in markers"
                        :key="'dot-' + index"
                        class="dot"
                        :style="{ left: `${((marker - min) / (max - min)) * 100}%` }"
                    />
                </div>
            </div>

            <div
                v-if="shouldShowMarkers && markers.length > 0"
                class="d-flex justify-content-between markers"
            >
                <span
                    v-for="(marker, index) in markers"
                    :key="index"
                    class="marker"
                    :class="{ active: marker === value }"
                    :style="{ left: `${((marker - min) / (max - min)) * 100}%` }"
                >{{ marker }}</span>
            </div>
        </div>
        <label
            v-if="label"
            :for="id"
            class="label"
        >
            {{ label }}
        </label>
    </div>
</template>

<style lang="scss" scoped>
.slider-item {
    width: 100%;
    align-items: center;
    gap: 1em;

    .input-item {
        width: 100%;
        position: relative;

        &:has(.markers) ~ label{
            min-width: 35px;
            text-align: right;
        }

        .input {
            position: relative;
            display: flex;
            justify-content: stretch;
            accent-color:  $secondary;

            input {
                flex: 1;
                position: relative;
                overflow: hidden;
                width: 100%;

                &::-webkit-slider-thumb {
                    border-radius: 42px;
                    background: $secondary;
                    cursor: pointer;
                }

                &::-moz-range-thumb {
                    background: $secondary;
                    cursor: pointer;
                }

                &::-ms-thumb {
                    background: $secondary;
                }

                &::-moz-range-track {
                    background: $light_grey;
                }
                &::-moz-range-progress {
                    background: $secondary;
                }

                &.form-range::-moz-range-progress {
                    background-color: transparent;
                }
            }

            .slider-dots {
                position: absolute;
                width: calc(100% - 16px);
                top: calc(50% - 1px);
                left: 50%;
                height: 4px;
                pointer-events: none;
                transform: translate(-50%, -50%);
                z-index: 2;

                .dot {
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    background-color: $secondary;
                    border-radius: 50%;
                    transform: translateX(-50%);
                }
            }
        }
    }

    .label {
        align-self: normal;
    }

    .markers {
        margin-right: 1rem;
        padding-bottom: 1.5rem;
        position: relative;

        .marker {
            position: absolute;
            display: block;
            width: 0;
            &.active {
                font-weight: 700;
            }
            &:last-child {
                width: auto;
            }
        }
    }
}
</style>
