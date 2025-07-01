<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "@shared/modules/layerSwiper/store/gettersLayerSwiper.js";

export default {
    name: "LayerSwiper",
    props: {
        /**
         * The initial time slider object.
         * @type {Object}
         * @default () => ({})
         */
        initialTimeSliderObject: {
            type: Object,
            default: () => ({keyboardMovement: 10})
        }
    },
    computed: {
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Modules/LayerSwiper", Object.keys(getters))
    },
    watch: {
        /**
         * Watcher for the split direction.
         * Calls the initializeSwiper method when the split direction changes.
         * @returns {void}
         */
        splitDirection () {
            this.initializeSwiper();
        }
    },
    mounted () {
        this.$nextTick(() => {
            this.initializeSwiper();
        });
    },
    methods: {
        ...mapMutations("Modules/LayerSwiper", [
            "setLayerSwiperValueX",
            "setLayerSwiperValueY",
            "setLayerSwiperDomSwiper",
            "setCurrentTimeSliderObject",
            "setLayerSwiperStyleTop",
            "setLayerSwiperStyleLeft"
        ]),
        ...mapActions("Modules/LayerSwiper", ["moveSwiper", "updateMap"]),

        /**
         * Initializes the swiper by setting its position and style based on the split direction.
         * @returns {void}
         */
        initializeSwiper () {
            const mapSize = mapCollection.getMap(this.mode).getSize(),
                target = this.$refs["layerSwiper-button"];

            target.style.top = `${mapSize[1] / 2}px`;
            target.style.left = `${mapSize[0] / 2}px`;

            if (this.splitDirection === "vertical") {
                this.setLayerSwiperValueX(mapSize[0] / 2);
            }
            else {
                this.setLayerSwiperValueY(mapSize[1] / 2);
            }

            target.focus();
            this.setLayerSwiperDomSwiper(target);
            this.setCurrentTimeSliderObject(this.initialTimeSliderObject);
        },

        /**
         * Adds event listeners for pointer movement to move the swiper.
         * @returns {void}
         */
        pointerMovement () {
            window.addEventListener("pointermove", this.moveSwiper);
            window.addEventListener("pointerup", this.pointerMovementStopped);
            window.addEventListener("pointercancel", this.pointerMovementStopped);
        },

        /**
         * Removes event listeners for pointer movement.
         * @returns {void}
         */
        pointerMovementStopped () {
            window.removeEventListener("pointermove", this.moveSwiper);
            window.removeEventListener("pointerup", this.pointerMovementStopped);
            window.removeEventListener("pointercancel", this.pointerMovementStopped);
        }
    }
};
</script>


<template>
    <button
        id="layerSwiper-button"
        ref="layerSwiper-button"
        class="btn"
        :class="splitDirection"
        :title="$t('common:modules.wmsTime.layerSwiper.title')"
        :aria-describedby="$t('common:modules.wmsTime.layerSwiper.description', { amount: initialTimeSliderObject.keyboardMovement })"
        @keydown.left="moveSwiper"
        @keydown.right="moveSwiper"
        @keydown.up="moveSwiper"
        @keydown.down="moveSwiper"
        @pointerdown="pointerMovement"
    />
</template>


<style lang="scss" scoped>


button {
    pointer-events: all;
    position: absolute;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);

    /* prevents scroll effects to avoid mobile pointercancel events */
    touch-action: none;

    /* increase specificity to avoid transparency on :hover,:active,... states */
    &#layerSwiper-button {
        background-color: $light_grey;
    }

    &:before {
        content: "";
        position: absolute;
        background: $light_grey_contrast;
        z-index: -1;
    }

    &.vertical {
        width: 50px;
        height: 30px;
        cursor: ew-resize;

        &:before {
            height: 100dvh;
            width: 4px;

            left: calc(50% - 2px);
            transform: translateY(-50%);
        }
    }

    &.horizontal {
        height: 50px;
        width: 30px;
        cursor: ns-resize;

        &:before {
            height: 4px;
            width: 100dvw;

            transform: translateX(-50%);
            top: calc(50% - 2px);
        }
    }
}
</style>

