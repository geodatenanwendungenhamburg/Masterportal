<script>
/**
 * SliderDualRange: A component for handling a dual range input slider that allows the user to adjust two values (e.g., two time points).
 * @module shared/modules/slider/SliderDualRange
 * @vue-prop {String} aria - is used for accessibility, e.g. screenreaders take this string to describe the element to visually impaired users.
 * @vue-prop {String} id - can be used to give a distinct id to the slider-element.
 * @vue-prop {String} label - can be provided for a right-hand label to the slider
 * @vue-prop {String|Number} min - can be used to set a minimal value for the slider. If no value is given 0 is the minimum.
 * @vue-prop {String|Number} max - can be used to set a maximum value for the slider. If no value is given 100 is the maximum.
 * @vue-prop {String|Number} step - can be used to define steps by which the slider can be moved, i.e. "10" will let the slider only take values that are multiples of 10.
 * @vue-prop {String|Number} values - are the current two values of the slider.
 * @vue-prop {Boolean} disabled - can be used to disable any input to the slider.
 * @vue-prop {Function} interaction - can be used to define a function to be executed on each user interaction with the slider.
 * @vue-prop {[String]} classArray - is used to provide additional classes to the encapsulating div of the slider.
 */

export default {
    name: "SliderDualRange",
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
        values: {
            type: Array,
            default: () => [0, 1],
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
        }
    },
    watch: {
        /**
         * Updates the slider range layout, if the values have changed.
         * @returns {void}
         */
        values () {
            this.updateSliderRangeLayout();
        }
    },
    mounted () {
        this.updateSliderRangeLayout();
    },
    methods: {
        /**
         * Update the slider range layout.
         * @param {Event} event The input event.
         * @param {String} slider The slider start or end.
         * @returns {void}
         */
        updateSliderRangeLayout (event, slider) {
            const container = this.$refs.sliderDualRange;
            let min = slider === "start" ? event.target.value : this.values[0],
                max = slider === "end" ? event.target.value : this.values[1];

            if (min > max) {
                [min, max] = [max, min];
            }

            if (container) {
                const percentMin = (min / this.max) * container.offsetWidth,
                    percentMax = (max / this.max) * container.offsetWidth;

                this.$refs.sliderRange.style.left = percentMin + "px";
                this.$refs.sliderRange.style.width = (percentMax - percentMin) + "px";
            }
        }
    }
};

</script>

<template>
    <div
        ref="sliderDualRange"
        class="slider-dual-range d-flex flex-column"
    >
        <div
            clas="slider-items"
        >
            <div
                class="slider-track"
            />
            <div
                id="slider-range"
                ref="sliderRange"
                class="slider-range"
            />
            <div
                id="range-slider"
                class="range-slider"
            >
                <input
                    :id="id + '-start'"
                    ref="sliderValueStart"
                    type="range"
                    class="slider slider-start"
                    :class="classArray"
                    :value="values[0]"
                    :aria-label="aria"
                    :min="min"
                    :max="max"
                    :step="step"
                    :disabled="disabled"
                    @input="(event) => updateSliderRangeLayout(event, 'start')"
                    @mouseup="interaction"
                >
                <input
                    :id="id + '-end'"
                    ref="sliderValueEnd"
                    type="range"
                    class="slider slider-end"
                    :class="classArray"
                    :value="values[1]"
                    :aria-label="aria"
                    :min="min"
                    :max="max"
                    :step="step"
                    :disabled="disabled"
                    @input="(event) => updateSliderRangeLayout(event, 'end')"
                    @mouseup="interaction"
                >
            </div>
        </div>
        <div
            v-if="label"
            class="labels"
        >
            <span>
                {{ label }}
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.slider-dual-range {
    position: relative;
    height: 1rem;
    margin: 1rem 1rem 3.5rem 1rem;

    .slider-track {
        position: absolute;
        top: 50%;
        left: 0;
        height: 0.5rem;
        width: 100%;
        background: $light_grey;
        z-index: 1;
        border-radius: 1rem;
        box-shadow: 0 0 2px $light_grey;
        transform: translateY(-50%);
    }

    .slider-range {
        position: absolute;
        top: 50%;
        height: 0.5rem;
        background: $secondary;
        z-index: 2;
        border-radius: 2px;
        transform: translateY(-50%);
    }

    .range-slider {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 3;
        pointer-events: none;
    }

    .range-slider input[type="range"] {
        width: 100%;
        height: 1rem;
        background: none;
        position: absolute;
        left: 0;
        top: 0;
        margin: 0;
        pointer-events: auto;
        -webkit-appearance: none;
        appearance: none;
    }

    .range-slider input[type="range"]::-webkit-slider-runnable-track {
        height: 0.286rem;
        background: transparent;
    }

    .range-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 1.286rem;
        height: 1.286rem;
        border-radius: 50%;
        background: $secondary;
        border: 2px solid #fff;
        box-shadow: 0 0 2px $light_grey;
        cursor: pointer;
        margin-top: -7px;
        position: relative;
        z-index: 10;
    }

    .range-slider input[type="range"]:focus::-webkit-slider-thumb {
      outline: 2px solid #42a5f5;
    }

    .range-slider input[type="range"]::-moz-range-thumb {
        width: 1.286rem;
        height: 1.286rem;
        border-radius: 50%;
        background: $secondary;
        border: 2px solid $white;
        box-shadow: 0 0 2px $light_grey;
        cursor: pointer;
    }

    .range-slider input[type="range"]::-moz-range-track {
        height: 0.286rem;
        background: transparent;
    }

    .labels {
        display: flex;
        justify-content: space-between;
        margin: 2rem 0;
    }
}

</style>
