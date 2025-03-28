<script>
import {mapGetters} from "vuex";

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
@import "~variables";
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
                }

                &::-moz-range-thumb {
                    background: $secondary;
                }

                &::-ms-thumb {
                    background: $secondary;
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

    label {
        align-self: baseline;
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
