<script>
import {mapActions} from "vuex";
import {mapState} from "pinia";
import {createCustomPositionMarker} from "../utils/customPositionMarker.js";
import {useOrientationStore} from "../store/orientationStore.js";

/**
 * Map selection component for orientation module.
 * Allows user to click on the map to select a point of interest location.
 * @module modules/Orientation/OrientationComponentMapSelection
 * @vue-emit {position-received} Emits selected coordinate when map is clicked
 */
export default {
    name: "OrientationComponentMapSelection",
    emits: ["position-received"],
    setup () {
        const store = useOrientationStore();

        return {store};
    },
    data () {
        return {
            mapClickListenerKey: "orientationMapSelection",
            pointerMoveListenerKey: "orientationMapSelectionPointerMove"
        };
    },
    computed: {
        ...mapState(useOrientationStore, ["menuSide", "customPositionMarker"])
    },
    mounted () {
        this.changeCurrentMouseMapInteractionsComponent({type: "orientation", side: this.menuSide});
        this.addCustomPositionMarker();
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

        /**
         * Create the custom position marker at the current map center, unless one already
         * exists (e.g. a previously placed marker that should stay in place).
         * @returns {void}
         */
        addCustomPositionMarker () {
            if (this.customPositionMarker) {
                return;
            }
            const center = mapCollection.getMapView("2D").getCenter();

            this.store.customPositionMarker = createCustomPositionMarker(center);
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
         * Handle pointer move event and update custom position marker position
         * @param {Object} evt Pointer move event with coordinate property
         * @returns {void}
         */
        onPointerMove (evt) {
            this.customPositionMarker.setPosition(evt.coordinate);
        },

        /**
         * Handle map click event and emit selected position
         * @param {Object} evt Map click event with coordinate property
         * @returns {void}
         */
        onMapClick (evt) {
            this.customPositionMarker.setPosition(evt.coordinate);
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
