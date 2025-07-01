<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import isMobile from "@shared/js/utils/isMobile.js";

export default {
    name: "TimeSlider",
    components: {
        FlatButton,
        IconButton,
        SpinnerItem
    },
    props: {
        layerId: {
            type: String,
            default: ""
        }
    },
    data: () => ({playing: false, playbackHandle: null, sliderValue: 0}),
    computed: {
        ...mapGetters("Modules/WmsTime", ["defaultValue", "minWidth", "timeRange", "timeSlider", "staticDimensions"]),
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
            // FIXME: temporary solution for updating time slider
            this.$forceUpdate();
        },
        sliderValue () {
            if (!this.timeRange[this.sliderValue]) {
                this.sliderValue = this.timeRange.indexOf(this.defaultValue);
                if (this.sliderValue < 0) {
                    this.sliderValue = 0;
                }
            }

            if (this.sliderOptionCount === this.sliderValue) {
                this.playing = false;
            }

            const layer = layerCollection.getLayerById(this.layerId),
                targetTime = this.timeRange[this.sliderValue];

            if (layer) {
                layer.updateTime(this.layerId, targetTime, this.staticDimensions);
                if (this.layerSwiperActive) {
                    this.updateMap();
                }
            }
        }
    },
    created () {
        this.sliderValue = this.timeRange.indexOf(this.defaultValue);
    },
    methods: {
        ...mapActions("Modules/LayerSwiper", ["updateMap"]),
        ...mapActions("Modules/WmsTime", ["toggleSwiper"]),
        ...mapMutations("Modules/WmsTime", ["setTimeSliderPlaying", "setTimeSliderDefaultValue"]),
        updateSlider (event) {
            if (this.$refs.timeSliderInput !== event.target) {
                return;
            }
            this.sliderValue = Number(event.target.value);
        },
        animate () {
            const index = this.nextIndex();

            if (index === this.sliderOptionCount) {
                this.playing = false;
                this.setTimeSliderPlaying(this.playing);
            }

            if (index === this.timeRange.length) {
                this.clearPlayback();
            }
            else {
                this.sliderValue = index;
            }
        },
        clearPlayback () {
            clearInterval(this.playbackHandle);
            this.playbackHandle = null;
        },
        nextIndex (forward = true) {
            return this.sliderValue + (forward ? 1 : -1);
        },
        moveOne (forward) {
            this.sliderValue = this.nextIndex(forward);
        },
        play () {
            this.playing = !this.playing;

            if (this.sliderValue === this.timeRange.length - 1) {
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
                />
                <IconButton
                    :id="'timeSlider-button-play-' + layerId"
                    :aria="$t('common:modules.wmsTime.timeSlider.buttons.play')"
                    :icon-array="[playing ? 'bi-pause-fill' : 'bi-play-fill']"
                    :interaction="() => play()"
                    :class-array="['btn-secondary']"
                />
                <IconButton
                    :id="'timeSlider-button-forward-' + layerId"
                    :aria="$t('common:modules.wmsTime.timeSlider.buttons.forward')"
                    :icon="'bi-skip-end-fill'"
                    :disabled="nextIndex() === timeRange.length"
                    :interaction="() => moveOne(true)"
                    :class-array="['btn-secondary']"
                />
            </div>
        </div>
        <label
            :id="`timeSlider-input-range-${layerId}-label`"
            :for="'timeSlider-input-range-' + layerId"
            class="timeSlider-input-range-label"
        >
            <input
                :id="'timeSlider-input-range-' + layerId"
                ref="timeSliderInput"
                type="range"
                class="timeSlider-input-range-label-input form-range"
                :value="sliderValue"
                :min="0"
                :max="sliderOptionCount"
                :step="1"
                :aria-label="$t('common:modules.wmsTime.timeSlider.inputRangeLabel')"
                @input="updateSlider($event)"
            >
            {{ selectedTime }}
        </label>
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
    }

    .timeSlider-innerWrapper {
        display: flex;
        justify-content: flex-start;
        // No margin on bottom
        margin: $bigger-margin;
    }

    .timeSlider-input-range-label {
        margin: $bigger-margin;
    }

    .timeSlider-input-range-label-input {
        display: block;
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
        .timeSlider-input-range-label {
            margin: 0 calc(0.25em * 3) 0;
        }
    }
}
</style>
