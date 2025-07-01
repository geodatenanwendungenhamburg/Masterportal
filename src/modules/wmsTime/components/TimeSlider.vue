<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import isMobile from "@shared/js/utils/isMobile.js";
import SliderDualRange from "@shared/modules/slider/components/SliderDualRange.vue";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";

/**
 * TimeSlider component: The timeslider wor wms-time layers.
 * @module src/modules/wmsTime/components/TimeSlider
 * @vue-prop {String} layerId The layer id of the current wms-time layer.
 * @vue-data {Boolean} playing - The play button is started.
 * @vue-data {Number} playbackHandle - The playback interval.
 * @vue-data {Number} sliderValue - The slider value.
 * @vue-data {Number} sliderValueEnd - The end value of the slider, if dualrangSlider is configured.
 */

export default {
    name: "TimeSlider",
    components: {
        FlatButton,
        IconButton,
        SpinnerItem,
        SliderDualRange,
        SliderItem
    },
    props: {
        layerId: {
            type: String,
            default: ""
        }
    },
    data () {
        return {
            playing: false,
            playbackHandle: null,
            sliderValue: 0,
            sliderValueEnd: 1
        };
    },
    computed: {
        ...mapGetters("Modules/WmsTime", ["defaultValue", "defaultValueEnd", "dualRangeSlider", "minWidth", "staticDimensions", "timeRange", "timeSlider"]),
        ...mapGetters("Modules/LayerSwiper", {
            layerSwiperActive: "active"
        }),
        ...mapGetters("Modules/CompareMaps", {
            compareMapsActive: "active"
        }),
        sliderOptionCount () {
            return this.timeRange.length - 1;
        },
        selectedTime () {
            return this.timeRange[this.sliderValue];
        },
        selectedTimeEnd () {
            return this.timeRange[this.sliderValueEnd];
        },
        isMobile () {
            return isMobile();
        }
    },
    watch: {
        compareMapsActive (newValue) {
            if (newValue) {
                this.timeSlider.active = false;
            }
        },
        defaultValue () {
            this.sliderValue = this.timeRange.indexOf(this.defaultValue);
            this.sliderValueEnd = this.calculateSliderValueEnd();
            // FIXME: temporary solution for updating time slider
            this.$forceUpdate();
        },
        sliderValue () {
            this.updateSliderValue();
        },
        sliderValueEnd () {
            this.updateSliderValue();
        }
    },
    created () {
        if (Array.isArray(this.timeRange) && this.timeRange.length > 0) {
            this.sliderValue = this.timeRange.indexOf(this.defaultValue);
            this.sliderValueEnd = this.calculateSliderValueEnd();
        }
    },
    methods: {
        ...mapActions("Modules/LayerSwiper", ["updateMap"]),
        ...mapActions("Modules/WmsTime", ["toggleSwiper"]),
        ...mapMutations("Modules/WmsTime", ["setTimeSliderPlaying", "setTimeSliderDefaultValue"]),

        /**
         * Update the slider value.
         * @param {Event} event The slider event.
         * @returns {void}
         */
        updateSlider (event) {
            if (this.$refs.timeSliderInput.$refs.sliderValue !== event.target) {
                return;
            }
            this.sliderValue = Number(event.target.value);
        },

        /**
         * Update the slider values (start and end).
         * @returns {void}
         */
        updateSliderDualRange () {
            let min = parseInt(this.$refs.timeSliderInputs.$refs.sliderValueStart.value, 10),
                max = parseInt(this.$refs.timeSliderInputs.$refs.sliderValueEnd.value, 10);

            if (min > max) {
                [min, max] = [max, min];
            }

            this.sliderValue = min;
            this.sliderValueEnd = max;
        },

        /**
         * Controls the animation of the slider.
         * @returns {void}
         */
        animate () {
            const index = this.nextIndex(this.dualRangeSlider ? this.sliderValueEnd : this.sliderValue);

            if (index === this.sliderOptionCount) {
                this.playing = false;
                this.setTimeSliderPlaying(this.playing);
            }

            if (index === this.timeRange.length) {
                this.clearPlayback();
            }
            else {
                this.sliderValue = this.nextIndex(this.sliderValue);
                if (this.dualRangeSlider) {
                    this.sliderValueEnd = this.nextIndex(this.sliderValueEnd);
                }
            }
        },

        /**
         * Clears the playback interval.
         * @returns {void}
         */
        clearPlayback () {
            clearInterval(this.playbackHandle);
            this.playbackHandle = null;
        },

        /**
         * Increase or decrease the slider value.
         * @param {Number} sliderValue The slider value to be in- or decrease.
         * @param {Boolean} [forward=true] Next index forward or previous.
         * @returns {Number} The next slider value.
         */
        nextIndex (sliderValue, forward = true) {
            return sliderValue + (forward ? 1 : -1);
        },

        /**
         * Starts the slider movement.
         * @param {Boolean} forward Next index forward or previous.
         * @returns {void}
         */
        moveOne (forward) {
            this.sliderValue = this.nextIndex(this.sliderValue, forward);

            if (this.dualRangeSlider) {
                this.sliderValueEnd = this.nextIndex(this.sliderValueEnd, forward);
            }
        },

        /**
         * Starts playback of the slider.
         * @returns {void}
         */
        play () {
            this.playing = !this.playing;

            if (this.sliderValue === this.timeRange.length - 1) {
                this.sliderValue = 0;
            }
            else if (this.dualRangeSlider && this.sliderValueEnd === this.timeRange.length - 1) {
                this.sliderValueEnd = this.sliderValueEnd - this.sliderValue;
                this.sliderValue = 0;
            }

            // This is true whenever any of the two players is being used.
            this.setTimeSliderPlaying(this.playing);

            if (this.playing) {
                this.playbackHandle = setInterval(this.animate, this.timeSlider.playbackDelay * 1000);
            }
            else {
                this.clearPlayback();
            }
        },

        /**
         * Calculates the end value of the dual range slider
         * @returns {Number} The slider end value.
         */
        calculateSliderValueEnd () {
            if (this.defaultValueEnd !== null) {
                return this.timeRange.indexOf(this.defaultValueEnd);
            }
            else if (this.sliderValue === 0) {
                return 1;
            }
            else if (this.sliderValue === this.sliderOptionCount) {
                return this.sliderValue - 1;
            }

            return this.sliderValue + 1;
        },

        /**
         * Updates the slider values.
         * @returns {void}
         */
        updateSliderValue () {
            if (!this.timeRange[this.sliderValue]) {
                this.sliderValue = this.timeRange.indexOf(this.defaultValue);
                if (this.sliderValue < 0) {
                    this.sliderValue = 0;
                }
                this.sliderValueEnd = this.calculateSliderValueEnd();
            }

            if (this.sliderOptionCount === this.sliderValue) {
                this.playing = false;
            }

            const layer = layerCollection.getLayerById(this.layerId),
                targetTime = this.timeRange[this.sliderValue],
                targetTimeEnd = this.dualRangeSlider ? this.timeRange[this.sliderValueEnd] : null;

            if (layer) {
                layer.updateTime(this.layerId, targetTime, targetTimeEnd, this.staticDimensions);
                if (this.layerSwiperActive) {
                    this.updateMap();
                }
            }
        }
    }
};
</script>

<template>
    <div class="timeSlider-wrapper centered-box-wrapper">
        <SpinnerItem
            v-if="!layerId"
        />
        <div
            class="timeSlider-control-row"
        >
            <div
                v-if="!isMobile"
                class="timeSlider-innerWrapper"
            >
                <FlatButton
                    :id="'timeSlider-activate-layerSwiper-' + layerId"
                    :aria-label="$t('common:modules.wmsTime.timeSlider.buttons')"
                    :interaction="() => toggleSwiper(layerId)"
                    :text="$t(!isMobile && layerSwiperActive ? 'common:modules.wmsTime.timeSlider.buttons.deactivateLayerSwiper' : 'common:modules.wmsTime.timeSlider.buttons.layerSwiper')"
                />
            </div>
            <div class="timeSlider-innerWrapper-interactions">
                <IconButton
                    :id="'timeSlider-button-backward-' + layerId"
                    :aria="$t('common:modules.wmsTime.timeSlider.buttons.backward')"
                    :icon="'bi-skip-start-fill'"
                    :disabled="nextIndex(false) === -1"
                    :interaction="() => moveOne(false)"
                    :class-array="['btn-secondary']"
                    class="mb-3"
                />
                <IconButton
                    :id="'timeSlider-button-play-' + layerId"
                    :aria="$t('common:modules.wmsTime.timeSlider.buttons.play')"
                    :icon-array="[playing ? 'bi-pause-fill' : 'bi-play-fill']"
                    :interaction="() => play()"
                    :class-array="['btn-secondary']"
                    class="mb-3"
                />
                <IconButton
                    :id="'timeSlider-button-forward-' + layerId"
                    :aria="$t('common:modules.wmsTime.timeSlider.buttons.forward')"
                    :icon="'bi-skip-end-fill'"
                    :disabled="nextIndex() === timeRange.length"
                    :interaction="() => moveOne(true)"
                    :class-array="['btn-secondary']"
                    class="mb-3"
                />
            </div>
        </div>
        <SliderDualRange
            v-if="dualRangeSlider"
            :id="'timeSlider-input-range-' + layerId"
            ref="timeSliderInputs"
            :aria="$t('common:modules.wmsTime.timeSlider.inputRangeLabel')"
            :label="selectedTime + ' / ' + selectedTimeEnd"
            :values="[sliderValue, sliderValueEnd]"
            :min="0"
            :max="sliderOptionCount"
            :step="1"
            :interaction="event => updateSliderDualRange(event)"
        />
        <SliderItem
            v-else
            :id="'timeSlider-input-range-' + layerId"
            ref="timeSliderInput"
            :aria="$t('common:modules.wmsTime.timeSlider.inputRangeLabel')"
            :class-array="['timeSlider-input-range-label-input']"
            :label="selectedTime"
            :value="sliderValue"
            :min="0"
            :max="sliderOptionCount"
            :step="1"
            :interaction="event => updateSlider(event)"
        />
    </div>
</template>

<style lang="scss" scoped>


.disabled {
    pointer-events: none;
    opacity: 0.4;
}

.spinner {
    width: 50px;
    height: 50px;
    margin-top: -25px;
    margin-left: -25px;
    left: 50%;
    top: 50%;
    position: absolute;
    background: rgba(0, 0, 0, 0);
}
.roundBtn {
    padding-top: .4rem;
}

.timeSlider-wrapper {
    $base-margin: 0.25em;
    $bigger-margin: calc(#{$base-margin} * 3);

    position: absolute;
    bottom: 2em;
    left: 50%;
    z-index: 3;

    display: flex;
    flex-direction: column;
    background: white;
    box-shadow: $tool_box_shadow;
    pointer-events: all;
    .timeSlider-control-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 1rem 0 0 0;
    }

    .timeSlider-innerWrapper {
        display: flex;
        justify-content: flex-start;
        // No margin on bottom
        margin: $bigger-margin;
    }

    .timeSlider-input-range-label-input {
        flex-direction: column;
        padding: 0 0.75rem;
        width: 100%;
    }

    .timeSlider-innerWrapper-interactions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: $bigger-margin;

    }
}
@include media-breakpoint-down(md) {
    .timeSlider-wrapper {
        .timeSlider-innerWrapper-interactions {
            margin: 0.5em auto;
                button {
                    width: 2.25rem;
                    height: 2.25rem;
                    font-size: calc(2.25rem - 0.35 * 2.25rem);
                }
            }
    }
}
</style>
