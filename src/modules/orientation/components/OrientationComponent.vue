<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import layerFactory from "@core/layers/js/layerFactory.js";
import mutations from "../store/mutationsOrientation.js";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil
} from "../utils/accuracyLayer.js";
import {getVectorFeaturesInCircle as getVectorFeaturesInCircleUtil} from "../utils/poiFeatureSearch.js";
import {createCustomPositionMarker, removeCustomPositionMarker} from "../utils/customPositionMarker.js";
import {extractEventCoordinates} from "@shared/js/utils/extractEventCoordinates.js";
import OrientationComponentLayerMessage from "./OrientationComponentLayerMessage.vue";
import OrientationComponentChoice from "./OrientationComponentChoice.vue";
import OrientationComponentTrackLocation from "./OrientationComponentTrackLocation.vue";
import OrientationComponentMapSelection from "./OrientationComponentMapSelection.vue";
import OrientationComponentResults from "./OrientationComponentResults.vue";

/**
* Router component for orientation module.
 * Manages user location workflow: choose mode → location selection → view nearby features.
 * Persists custom position marker overlay through component mount/unmount via Vuex store.
 * @module modules/OrientationComponent
 * @vue-computed {Array} poiDistancesLocal - Distances for feature search (from config or defaults [500, 1000, 2000]).
 * @vue-computed {Boolean} hasValidVectorLayer - Whether visible layers include vector types for feature search.
 * @vue-computed {Boolean} showCustomPositionMarker - Signal to show/hide custom position marker overlay.
 */
export default {
    name: "OrientationComponent",
    components: {
        OrientationComponentLayerMessage,
        OrientationComponentChoice,
        OrientationComponentTrackLocation,
        OrientationComponentMapSelection,
        OrientationComponentResults
    },
    computed: {
        ...mapGetters("Modules/Orientation", [
            "geolocation",
            "onlyFilteredFeatures",
            "poiDistances",
            "currentPositionModeEnabled",
            "showAccuracy",
            "currentPage",
            "selectedMode",
            "receivedPosition",
            "accuracyFeature",
            "customPositionMarker"
        ]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters(["visibleLayerConfigs"]),
        poiDistancesLocal () {
            return this.poiDistances === true ? [500, 1000, 2000] : this.poiDistances;
        },
        hasValidVectorLayer () {
            const vectorTypes = layerFactory.getVectorLayerTypes();

            return this.visibleLayerConfigs?.some(layer => vectorTypes.includes(layer.typ?.toUpperCase()));
        },
        showCustomPositionMarker () {
            return Boolean(this.receivedPosition) && this.currentPage === "results" && this.selectedMode === "customPosition" && this.hasValidVectorLayer;
        }
    },
    watch: {
        showCustomPositionMarker: {
            immediate: true,
            handler (showCustomPositionMarker) {
                if (showCustomPositionMarker && !this.customPositionMarker) {
                    this.setCustomPositionMarker(createCustomPositionMarker(this.receivedPosition));
                }
                else if (!showCustomPositionMarker && this.customPositionMarker) {
                    this.removeCustomPositionMarker();
                }
            }
        }
    },
    beforeUnmount () {
        if (this.accuracyFeature) {
            clearAccuracyGeometryUtil({
                accuracyFeature: this.accuracyFeature,
                geolocation: this.geolocation,
                listener: this.onAccuracyGeometryChange
            });
        }
        this.removeCustomPositionMarker();
    },
    methods: {
        ...mapMutations("Modules/Orientation", Object.keys(mutations)),
        ...mapActions("Maps", ["zoomToCoordinates", "zoomToExtent"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        onAccuracyGeometryChange () {
            updateAccuracyGeometryUtil({
                accuracyFeature: this.accuracyFeature,
                geolocation: this.geolocation,
                projectionCode: this.projection.getCode(),
                showAccuracy: this.showAccuracy
            });
        },

        /**
         * getting the vector feature within the distance
         * @param {Array} layerConfigs layer configs to inspect
         * @param  {Number} distance the search range
         * @param  {Array} centerPosition the center position
         * @return {ol/feature} Array of ol.features list
         */
        getVectorFeaturesInCircle (layerConfigs, distance, centerPosition) {
            return getVectorFeaturesInCircleUtil({
                layerConfigs,
                distance,
                centerPosition,
                onlyFilteredFeatures: this.onlyFilteredFeatures
            });
        },

        /**
        * Handle mode selection from Choice component
        * @param {String} mode - Selected mode: "currentPosition" or "customPosition"
        * @returns {void}
        */
        onModeSelected (mode) {
            this.removeCustomPositionMarker();
            this.setSelectedMode(mode);
            this.setCurrentPage("location");
        },

        /**
        * Go back to choice page
        * @returns {void}
        */
        backToChoice () {
            this.removeCustomPositionMarker();
            this.setCurrentPage("choice");
            this.setSelectedMode(null);
        },

        /**
        * Handle position received from TrackLocation or MapSelection
        * @param {Object} data - Position data from location or selection component
        * @returns {void}
        */
        onPositionReceived (data) {
            this.setReceivedPosition(data.position);
            this.setCurrentPage("results");
        },

        /**
         * Handle feature selection from Results component
         * @param {ol/Feature} feature - Selected feature
         * @returns {void}
         */
        onFeatureSelected (feature) {
            const extent = feature.getGeometry().getExtent(),
                  coordinate = extractEventCoordinates(extent),
                  resolutions = mapCollection.getMapView("2D").getResolutions(),
                  index = resolutions.indexOf(0.2645831904584105) === -1 ? resolutions.length : resolutions.indexOf(0.2645831904584105);

            this.zoomToExtent({extent: coordinate, options: {maxZoom: index}});
            this.$store.dispatch("Maps/removePointMarker");
            this.setCurrentPositionModeEnabled(true);
        },

        /**
         * Remove custom position marker from map
         * @returns {void}
         */
        removeCustomPositionMarker () {
            if (this.customPositionMarker) {
                removeCustomPositionMarker(this.customPositionMarker);
                this.setCustomPositionMarker(null);
            }
        }

    }


};
</script>

<template>
    <div
        class="orientation-module"
    >
        <OrientationComponentLayerMessage v-if="!hasValidVectorLayer" />
        <OrientationComponentChoice
            v-if="currentPage === 'choice' && hasValidVectorLayer"
            @next="onModeSelected"
        />
        <OrientationComponentTrackLocation
            v-else-if="currentPage === 'location' && hasValidVectorLayer && selectedMode === 'currentPosition'"
            :poi-mode="selectedMode"
            @position-received="onPositionReceived"
            @error="backToChoice"
        />
        <OrientationComponentMapSelection
            v-else-if="currentPage === 'location' && hasValidVectorLayer && selectedMode === 'customPosition'"
            :poi-mode="selectedMode"
            @position-received="onPositionReceived"
            @error="backToChoice"
        />
        <OrientationComponentResults
            v-else-if="currentPage === 'results' && hasValidVectorLayer"
            :position="receivedPosition"
            :poi-distances="poiDistancesLocal"
            :get-features-in-circle="getVectorFeaturesInCircle"
            :selected-mode="selectedMode"
            @feature-selected="onFeatureSelected"
            @back-to-choice="backToChoice"
            @zoom-to-location="onModeSelected('currentPosition')"
            @select-map-point="onModeSelected('customPosition')"
        />
    </div>
</template>

<style lang="scss" scoped>

    .orientationButtons {
        >.toggleButtonPressed {
            background-color: $dark_blue;
            color: $white;
        }
    }
    .geolocation_marker {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: $dark_blue;
        padding: 1px;
        border-radius: 50%;
        font-size: 1.4rem;
    }
    .geolocation_marker_direction {
        display: inline-block;
        color: $dark_blue;
        font-size: 1rem;
        line-height: 1;
        padding-bottom: 0.7rem;
        pointer-events: none;
    }
    .geolocation_marker_direction_anchor {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -102%) rotate(var(--marker-heading-angle, 0deg));
        transform-origin: 50% 100%;
        pointer-events: none;
    }
</style>
