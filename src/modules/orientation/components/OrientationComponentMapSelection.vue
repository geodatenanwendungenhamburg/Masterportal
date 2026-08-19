<script>
import {markRaw} from "vue";
import {mapActions} from "vuex";
import Overlay from "ol/Overlay.js";

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
            mapClickListenerKey: "orientationMapSelection",
            pointerMoveListenerKey: "orientationMapSelectionPointerMove",
            flagMarker: markRaw(new Overlay({
                positioning: "center-center",
                stopEvent: false
            }))
        };
    },
    mounted () {
        this.addFlagElement();
        this.registerMapClickListener();
        this.registerPointerMoveListener();
    },
    beforeUnmount () {
        this.unregisterMapClickListener();
        this.unregisterPointerMoveListener();
    },
    methods: {
        ...mapActions("Maps", ["registerListener", "unregisterListener"]),

        /**
         * Add flag element to overlay
         * @returns {void}
         */
        addFlagElement () {
            this.flagMarker.setElement(document.querySelector("#orientation-flag-marker"));
            const map = mapCollection.getMap("2D");

            map.addOverlay(this.flagMarker);
        },

        /**
         * Remove flag overlay from map
         * @returns {void}
         */
        removeFlagOverlay () {
            const map = mapCollection.getMap("2D");

            map.removeOverlay(this.flagMarker);
        },

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
         * Register pointer move listener to track cursor
         * @returns {void}
         */
        registerPointerMoveListener () {
            this.registerListener({
                type: "pointermove",
                listener: this.onPointerMove,
                keyForBoundFunctions: this.pointerMoveListenerKey
            });
        },

        /**
         * Unregister pointer move listener
         * @returns {void}
         */
        unregisterPointerMoveListener () {
            this.unregisterListener({
                type: "pointermove",
                listener: this.onPointerMove,
                keyForBoundFunctions: this.pointerMoveListenerKey
            });
        },

        /**
         * Handle pointer move event and update flag position
         * @param {Object} evt Pointer move event with coordinate property
         * @returns {void}
         */
        onPointerMove (evt) {
            this.flagMarker.setPosition(evt.coordinate);
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
            this.unregisterPointerMoveListener();
        }
    }
};
</script>

<template>
    <div class="orientation-map-selection">
        <p class="selection-instruction">
            {{ $t("common:modules.orientation.choosePointOnMapText") }}
        </p>
        <span
            id="orientation-flag-marker"
            class="orientation-flag-marker"
        >
            <i class="bi-flag" />
        </span>
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
}

.orientation-flag-marker {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: $dark_blue;
    font-size: 1.5rem;
    pointer-events: none;
}
</style>
