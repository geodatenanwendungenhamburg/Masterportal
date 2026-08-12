<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import layerFactory from "@core/layers/js/layerFactory.js";
import mutations from "../store/mutationsOrientation.js";
import Geolocation from "ol/Geolocation.js";
import proj4 from "proj4";
import * as Proj from "ol/proj.js";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil
} from "../utils/accuracyLayer.js";
import {getVectorFeaturesInCircle as getVectorFeaturesInCircleUtil} from "../utils/poiFeatureSearch.js";
import {
    getMarkerDirectionStyle,
    resolveHeading
} from "../utils/directionMarker.js";
import OrientationComponentLayerMessage from "./OrientationComponentLayerMessage.vue";
import OrientationComponentChoice from "./OrientationComponentChoice.vue";
import OrientationComponentLocation from "./OrientationComponentLocation.vue";
/* import OrientationComponentResults from "./OrientationComponentResults.vue"; */

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
        OrientationComponentLocation
        /* OrientationComponentResults*/
    },
    data () {
        return {
            currentPage: "choice",
            selectedMode: null
        };
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
            "zoomMode"

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
        clearAccuracyGeometryUtil({
            accuracyFeature: this.accuracyFeature,
            geolocation: this.geolocation,
            listener: this.onAccuracyGeometryChange
        });
        this.removeOverlay();
    },
    methods: {
        ...mapMutations("Modules/Orientation", Object.keys(mutations)),
        ...mapActions("Maps", ["zoomToCoordinates"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        onAccuracyGeometryChange () {
            updateAccuracyGeometryUtil({
                accuracyFeature: this.accuracyFeature,
                geolocation: this.geolocation,
                projectionCode: this.projection.getCode(),
                showAccuracy: this.showAccuracy
            });
        },

        setIsGeoLocationPossible () {
            this.isGeoLocationPossible = window.location.protocol === "https:" || ["localhost", "127.0.0.1"].indexOf(window.location.hostname);
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
         * Setting the marker on the position
         * @param {Object} position the position object from openlayer
         * @returns {void}
         */
        positionMarker (position) {
            try {
                this.marker.setPosition(position);
            }
            catch (e) {
                console.error("wasn't able to set marker");
            }
        },

        /**
         * Zoom to the center
         * @param {Object} position the position object from openlayer
         * @returns {void}
         */
        zoomAndCenter (position) {
            this.zoomToCoordinates({center: position, zoom: 6});
        },

        /**
         * Setting the current map on the position
         * @returns {void}
         */
        positioning () {
            const position = this.geolocation.getPosition(),
                  firstGeolocation = this.firstGeolocation,
                  zoomMode = this.zoomMode,
                  centerPosition = proj4(proj4("EPSG:4326"), proj4(this.projection.getCode()), position),
                  resolvedHeading = resolveHeading(this.geolocation.getHeading());

            if (Number.isFinite(resolvedHeading)) {
                this.heading = resolvedHeading;
            }
            this.previousPosition = Array.isArray(position) ? [...position] : null;

            // setting the center position
            this.setPosition(centerPosition);

            // screen navigation
            if (zoomMode === "once") {
                if (firstGeolocation === true) {
                    this.positionMarker(centerPosition);
                    this.zoomAndCenter(centerPosition);
                    this.firstGeolocation = false;
                }
                else {
                    this.positionMarker(centerPosition);
                }
            }
            else if (zoomMode === "always") {
                this.positionMarker(centerPosition);
                this.zoomAndCenter(centerPosition);
                this.firstGeolocation = false;
            }
            else {
                console.error("The configured zoomMode: " + zoomMode + " does not exist. Please use the params 'once' or 'always'!");
            }

            this.onAccuracyGeometryChange();

            this.$store.dispatch("Maps/removePointMarker");
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
            this.selectedMode = mode;
            this.currentPage = "location";
        },

        /**
        * Go back to choice page
        * @returns {void}
        */
        backToChoice () {
            this.currentPage = "choice";
            this.selectedMode = null;
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
        <OrientationComponentLocation
            v-else-if="currentPage === 'location' && hasValidVectorLayer"
            :poi-mode="selectedMode"
            @position-received="onPositionReceived"
            @error="backToChoice"
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
