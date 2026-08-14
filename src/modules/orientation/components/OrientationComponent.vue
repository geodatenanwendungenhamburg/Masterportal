<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import layerFactory from "@core/layers/js/layerFactory.js";
import mutations from "../store/mutationsOrientation.js";
import Geolocation from "ol/Geolocation.js";
import proj4 from "proj4";
import * as Proj from "ol/proj.js";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil,
    removeAccuracyLayer as removeAccuracyLayerUtil
} from "../utils/accuracyLayer.js";
import {getVectorFeaturesInCircle as getVectorFeaturesInCircleUtil} from "../utils/poiFeatureSearch.js";
import {
    getMarkerDirectionStyle
} from "../utils/directionMarker.js";
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
            "iconGeolocate",
            "iconGeolocatePOI",
            "iconGeolocationMarker",
            "iconDirectionArrow",
            "iFrameGeolocationEnabled",
            "onlyFilteredFeatures",
            "poiDistances",
            "poiMode",
            "poiModeCurrentPositionEnabled",
            "showAccuracy",
            "showDirection",
            "showPoi",
            "showPoiChoice",
            "showPoiIcon",
            "zoomMode",
            "currentPage",
            "selectedMode",
            "receivedPosition",
            "accuracyFeature",
            "accuracyLayer"
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
        this.removeOverlay();
    },
    methods: {
        ...mapMutations("Modules/Orientation", Object.keys(mutations)),
        ...mapMutations("Modules/Orientation", [
            "setCurrentPage",
            "setSelectedMode",
            "setReceivedPosition",
            "setAccuracyFeature",
            "setAccuracyLayer"
        ]),
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
         * Change the style of button
         * @returns {void}
         */
        trackingChanged () {
            if (this.tracking) {
                document.querySelector("#geolocate").className += " toggleButtonPressed";
            }
            else {
                if (this.geolocation !== null) {
                    this.untrack();
                }
                document.querySelector("#geolocate").classList.remove("toggleButtonPressed");
            }
        },

        /**
         * Getting the current postion or untrack the position
         * @returns {void}
         */
        getOrientation () {
            if (!this.tracking) {
                this.track();
            }
            else if (this.geolocation !== null) {
                this.untrack();
            }
        },

        /**
         * with deactivated localization the button is disabled and poi button is hidden
         * @returns {void}
         */
        toggleBackground () {
            const geolocateIcon = document.getElementById("geolocate");

            if (this.isGeolocationDenied) {
                geolocateIcon.style.backgroundColor = "grey";
            }
            else {
                geolocateIcon.style.backgroundColor = "#E10019";
            }
        },

        /**
         * Show Poi window
         * @returns {void}
         */
        getPOI () {
            document.querySelector("#geolocatePOI").className += " toggleButtonPressed";
            this.setShowPoiChoice(true);
        },

        /**
         * Tracking the poi
         * @returns {void}
         */
        trackPOI () {
            let geolocation = null;

            this.removeOverlay();

            if (this.poiModeCurrentPositionEnabled) {
                this.$store.dispatch("Maps/removePointMarker");
                this.showMarkerOverlay();
                document.querySelector("#geolocate").className += " toggleButtonPressed";
                if (this.geolocation === null) {
                    geolocation = new Geolocation({tracking: true, enableHighAccuracy: true, projection: Proj.get("EPSG:4326")});
                    this.setGeolocation(geolocation);
                }
                else {
                    geolocation = this.geolocation;
                    this.setPosition(null);
                    this.showPoiWindow();
                }
                geolocation.on("change", this.showPoiWindow);
                geolocation.on("error", this.onPOIError);
            }
            else {
                this.untrack();
                document.querySelector("#geolocate").classList.remove("toggleButtonPressed");
            }
        },

        /**
         * Untracking the poi
         * @returns {void}
         */
        untrackPOI () {
            const geolocation = this.geolocation;

            if (this.poiModeCurrentPositionEnabled) {
                geolocation.un("change", this.showPoiWindow);
                geolocation.un("error", this.onPOIError);
            }
            else {
                this.removeOverlay();
            }
            this.setShowPoi(false);
        },

        /**
         * Showing poi window
         * @returns {void}
         */
        showPoiWindow () {
            if (!this.position) {
                const geolocation = this.geolocation,
                      position = geolocation.getPosition(),
                      centerPosition = proj4(proj4("EPSG:4326"), proj4(this.projection.getCode()), position);

                // setting the center position
                this.setPosition(centerPosition);
                this.positioning();
            }
            this.setShowPoi(true);
        },

        /**
         * Showing error message by opening poi window
         * @param {Object} evt error event
         * @returns {void}
         */
        onPOIError () {
            this.addSingleAlert({
                category: "error",
                content: `<strong>${this.$t("common:modules.orientation.trackingDeniedText")}</strong>`
            });

            if (this.geolocation !== null) {
                this.untrack();
            }
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
            this.setSelectedMode(mode);
            this.setCurrentPage("location");
        },

        /**
        * Go back to choice page
        * @returns {void}
        */
        backToChoice () {
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
            this.setPoiMode("currentPosition");
            this.setCurrentPositionEnabled(true);
        },
        /**
         * Remove overlay from map
         * @returns {void}
         */
        removeOverlay () {
            const map = mapCollection.getMap("2D");

            map.removeOverlay(this.marker);
            removeAccuracyLayerUtil({
                accuracyLayer: this.accuracyLayer,
                map
            });
            this.accuracyLayer = null;
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
            @feature-selected="onFeatureSelected"
            @back-to-choice="backToChoice"
            @zoom-to-start="onModeSelected('currentPosition')"
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
