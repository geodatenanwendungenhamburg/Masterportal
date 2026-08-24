<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import layerFactory from "@core/layers/js/layerFactory.js";
import mutations from "../store/mutationsOrientation.js";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil
} from "../utils/accuracyLayer.js";
import {getVectorFeaturesInCircle as getVectorFeaturesInCircleUtil} from "../utils/poiFeatureSearch.js";
import {
    getMarkerDirectionStyle
} from "../utils/directionMarker.js";
import {createFlagOverlay, removeFlagOverlay} from "../utils/flagOverlay.js";
import {extractEventCoordinates} from "@shared/js/utils/extractEventCoordinates.js";
import OrientationComponentLayerMessage from "./OrientationComponentLayerMessage.vue";
import OrientationComponentChoice from "./OrientationComponentChoice.vue";
import OrientationComponentTrackLocation from "./OrientationComponentTrackLocation.vue";
import OrientationComponentMapSelection from "./OrientationComponentMapSelection.vue";
import OrientationComponentResults from "./OrientationComponentResults.vue";

/**
 * Orientation control that allows the user to locate themselves on the map.
 * @module modules/OrientationComponent
 * @vue-data {Boolean} firstGeolocation - Shows if it is the first time locating.
 * @vue-data {Object} marker - Overlay with marker.
 * @vue-data {Boolean} tracking - Shows if the tracking is on.
 * @vue-data {Boolean} isGeolocationDenied - Shows if geolocation is denied.
 * @vue-data {Boolean} isGeolocationPossible - Shows if geolocation is possible.
 * @vue-computed {Array} poiDistancesLocal - An array of local distances.
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
            "iconGeolocatePOI",
            "iconGeolocationMarker",
            "iconDirectionArrow",
            "iFrameGeolocationEnabled",
            "onlyFilteredFeatures",
            "poiDistances",
            "poiModeCurrentPositionEnabled",
            "showAccuracy",
            "showDirection",
            "showPoi",
            "zoomMode",
            "currentPage",
            "selectedMode",
            "receivedPosition",
            "accuracyFeature",
            "accuracyLayer",
            "flagOverlay"
        ]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters(["visibleLayerConfigs"]),
        poiDistancesLocal () {
            return this.poiDistances === true ? [500, 1000, 2000] : this.poiDistances;
        },
        markerDirectionStyle () {
            return getMarkerDirectionStyle(this.showDirection, this.heading);
        },
        hasValidVectorLayer () {
            const vectorTypes = layerFactory.getVectorLayerTypes();

            return this.visibleLayerConfigs?.some(layer => vectorTypes.includes(layer.typ?.toUpperCase()));
        },
        showFlag () {
            return Boolean(this.receivedPosition) && this.currentPage === "results" && this.selectedMode === "customPosition" && this.hasValidVectorLayer;
        }
    },
    watch: {
        showFlag: {
            immediate: true,
            handler (showFlag) {
                if (showFlag && !this.flagOverlay) {
                    this.setFlagOverlay(createFlagOverlay(this.receivedPosition));
                }
                else if (!showFlag && this.flagOverlay) {
                    this.removeFlagElement();
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
        this.removeFlagElement();
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
            this.removeFlagElement();
            this.setSelectedMode(mode);
            this.setCurrentPage("location");
        },

        /**
        * Go back to choice page
        * @returns {void}
        */
        backToChoice () {
            this.removeFlagElement();
            this.setCurrentPage("choice");
            this.setSelectedMode(null);
        },
        /**
    * Handle position received from TrackLocation or MapSelection
    * @param {Object} data - Position data from location component
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
            this.setCurrentPositionEnabled(true);
        },

        /**
         * Remove flag overlay from map
         * @returns {void}
         */
        removeFlagElement () {
            if (this.flagOverlay) {
                removeFlagOverlay(this.flagOverlay);
                this.setFlagOverlay(null);
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
