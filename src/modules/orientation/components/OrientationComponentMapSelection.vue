<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import {createFlagOverlay} from "../utils/flagOverlay.js";

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
            pointerMoveListenerKey: "orientationMapSelectionPointerMove"
        };
    },
    computed: {
        ...mapGetters("Modules/Orientation", ["menuSide", "flagOverlay"])
    },
    mounted () {
        this.changeCurrentMouseMapInteractionsComponent({type: "orientation", side: this.menuSide});
        this.addFlagElement();
        this.registerMapClickListener();
        this.registerPointerMoveListener();
    },
    beforeUnmount () {
        this.unregisterMapClickListener();
        this.unregisterPointerMoveListener();
        this.resetCurrentMouseMapInteractionsComponent(this.menuSide);
    },
    methods: {
        ...mapActions("Maps", ["registerListener", "unregisterListener"]),
        ...mapActions("Menu", ["changeCurrentMouseMapInteractionsComponent", "resetCurrentMouseMapInteractionsComponent"]),
        ...mapMutations("Modules/Orientation", ["setFlagOverlay"]),

        /**
         * Create the flag overlay at the current map center, unless one already
         * exists (e.g. a previously placed flag that should stay in place).
         * @returns {void}
         */
        addFlagElement () {
            if (this.flagOverlay) {
                return;
            }
            const center = mapCollection.getMapView("2D").getCenter();

            this.setFlagOverlay(createFlagOverlay(center));
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
            this.flagOverlay.setPosition(evt.coordinate);
        },

        /**
         * Handle map click event and emit selected position
         * @param {Object} evt Map click event with coordinate property
         * @returns {void}
         */
        onMapClick (evt) {
            this.flagOverlay.setPosition(evt.coordinate);
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
</style>
