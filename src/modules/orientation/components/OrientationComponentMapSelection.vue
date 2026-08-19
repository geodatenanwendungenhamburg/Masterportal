<script>
import {mapActions} from "vuex";

/**
 * Map selection component for orientation module.
 * Allows user to click on the map to select a point of interest location.
 * @module modules/Orientation/OrientationComponentMapSelection
 * @vue-emit {position-received} Emits selected coordinate when map is clicked
 */
export default {
    name: "OrientationComponentMapSelection",
    emits: ["position-received"],
    data () {
        return {
            mapClickListenerKey: "orientationMapSelection"
        };
    },
    mounted () {
        this.registerMapClickListener();
    },
    beforeUnmount () {
        this.unregisterMapClickListener();
    },
    methods: {
        ...mapActions("Maps", ["registerListener", "unregisterListener"]),

        /**
         * Register map click listener to capture user selection
         * @returns {void}
         */
        registerMapClickListener () {
            this.registerListener({
                type: "click",
                listener: this.onMapClick,
                keyForBoundFunctions: this.mapClickListenerKey
            });
        },

        /**
         * Unregister map click listener
         * @returns {void}
         */
        unregisterMapClickListener () {
            this.unregisterListener({
                type: "click",
                listener: this.onMapClick,
                keyForBoundFunctions: this.mapClickListenerKey
            });
        },

        /**
         * Handle map click event and emit selected position
         * @param {Object} evt Map click event with coordinate property
         * @returns {void}
         */
        onMapClick (evt) {
            this.$emit("position-received", {
                position: evt.coordinate,
                mode: "customPosition"
            });

            this.unregisterMapClickListener();
        }
    }
};
</script>

<template>
    <div class="orientation-map-selection">
        <p class="selection-instruction">
            {{ $t("common:modules.orientation.selectPointOnMap") }}
        </p>
        <i class="bi-cursor" />
    </div>
</template>

<style lang="scss" scoped>
.orientation-map-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;

    .selection-instruction {
        font-size: 1.125rem;
        font-weight: 500;
        color: $dark_grey;
        margin: 0;
    }

    i {
        font-size: 3rem;
        color: $dark_blue;
    }
}
</style>
