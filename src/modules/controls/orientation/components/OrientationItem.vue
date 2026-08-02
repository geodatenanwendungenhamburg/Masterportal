<script>
import {markRaw} from "vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsOrientation.js";
import ControlIcon from "../../components/ControlIcon.vue";
import PoiChoice from "./poi/PoiChoice.vue";
import PoiOrientation from "./poi/PoiOrientation.vue";
import Geolocation from "ol/Geolocation.js";
import Overlay from "ol/Overlay.js";
import proj4 from "proj4";
import * as Proj from "ol/proj.js";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    createAccuracyFeature,
    initAccuracyLayer as initAccuracyLayerUtil,
    removeAccuracyLayer as removeAccuracyLayerUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil
} from "../utils/accuracyLayer.js";
import {getVectorFeaturesInCircle as getVectorFeaturesInCircleUtil} from "../utils/poiFeatureSearch.js";
import {
    getMarkerDirectionStyle,
    resolveHeading
} from "../utils/directionMarker.js";

/**
 * Orientation control that allows the user to locate themselves on the map.
 * @module modules/controls/OrientationItem
 * @vue-data {Boolean} firstGeolocation - Shows if it is the first time locating.
 * @vue-data {Object} marker - Overlay with marker.
 * @vue-data {Boolean} tracking - Shows if the tracking is on.
 * @vue-data {Boolean} isGeolocationDenied - Shows if geolocation is denied.
 * @vue-data {Boolean} isGeolocationPossible - Shows if geolocation is possible.
 * @vue-computed {Array} poiDistancesLocal - An array of local distances.
 */
export default {
    name: "OrientationItem",
    components: {
        ControlIcon,
        PoiChoice,
        PoiOrientation
    },
    data () {
        return {
            firstGeolocation: true, // flag to check if it's the first time
            marker: markRaw(new Overlay({
                positioning: "center-center",
                stopEvent: false
            })),
            tracking: false,
            isGeolocationDenied: false,
            isGeoLocationPossible: false,
            heading: null,
            previousPosition: null,
            accuracyFeature: createAccuracyFeature(),
            accuracyLayer: null
        };
    },
    computed: {
        ...mapGetters("Controls/Orientation", [
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
            "showDirection",
            "showPoi",
            "showPoiChoice",
            "showPoiIcon",
            "zoomMode",
            "showAccuracy"
        ]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters(["visibleLayerConfigs"]),
        poiDistancesLocal () {
            return this.poiDistances === true ? [500, 1000, 2000] : this.poiDistances;
        },
        markerDirectionStyle () {
            return getMarkerDirectionStyle(this.showDirection, this.heading);
        }
    },
    watch: {
        tracking () {
            this.trackingChanged();
            this.checkWFS();
        },
        isGeolocationDenied () {
            this.toggleBackground();
            this.checkWFS();
        },
        position () {
            if (!this.poiModeCurrentPositionEnabled && this.showPoiIcon) {
                this.showPoiWindow();
            }
        },
        visibleLayerConfigs: {
            handler () {
                this.checkWFS();
            },
            deep: true
        }
    },
    created () {
        this.setIsGeoLocationPossible();
    },
    mounted () {
        this.addElement();
        this.checkWFS();
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
        ...mapMutations("Controls/Orientation", Object.keys(mutations)),
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
         * add overlay for marker
         * @returns {void}
         */
        addElement: function () {
            this.marker.setElement(document.querySelector("#geolocation_marker"));
        },

        canStartTracking () {
            const inIframe = window.self !== window.top,
                  iFrameGeolocationEnabled = this.iFrameGeolocationEnabled === true;

            if (inIframe && !iFrameGeolocationEnabled) {
                this.addSingleAlert({
                    category: "error",
                    content: `<strong>${this.$t("common:modules.controls.orientation.iFrameGeolocationError")}`
                });
                return false;
            }
            if (this.isGeolocationDenied !== false) {
                this.onError();
                return false;
            }
            return true;
        },

        ensureGeolocationInstance () {
            if (this.geolocation === null) {
                const geolocation = markRaw(new Geolocation({tracking: false, projection: Proj.get("EPSG:4326"), trackingOptions: {enableHighAccuracy: true}}));

                this.setGeolocation(geolocation);
                return geolocation;
            }
            return this.geolocation;
        },

        unbindGeolocationListeners (geolocation) {
            geolocation.un("change", this.positioning);
            geolocation.un("error", this.onError, this);
            geolocation.un("change:accuracyGeometry", this.onAccuracyGeometryChange);
        },

        /**
         * Shows marker overlay and accuracy layer on map.
         * @returns {void}
         */
        showMarkerOverlay () {
            const map = mapCollection.getMap("2D");

            map.addOverlay(this.marker);
            if (this.showAccuracy) {
                const {accuracyLayer} = initAccuracyLayerUtil({
                    accuracyFeature: this.accuracyFeature,
                    accuracyLayer: this.accuracyLayer,
                    map
                });

                this.accuracyLayer = accuracyLayer;
                this.onAccuracyGeometryChange();
            }
        },

        bindGeolocationListeners (geolocation) {
            if (this.showAccuracy) {
                geolocation.on("change:accuracyGeometry", this.onAccuracyGeometryChange);
            }

            geolocation.on("change", this.positioning);
            geolocation.on("error", this.onError, this);
        },

        startTrackingSession (geolocation) {
            geolocation.setTracking(true);

            if (geolocation.getPosition()) {
                this.positioning();
            }
            if (this.showAccuracy) {
                this.onAccuracyGeometryChange();
            }
            this.tracking = true;
        },

        stopTrackingSession (geolocation) {
            geolocation.setTracking(false); // for FireFox - cannot handle geolocation.un(...)
            this.unbindGeolocationListeners(geolocation);
            this.heading = null;
            this.previousPosition = null;
        },

        /**
         * Tracking the geo position
         * @returns {void}
         */
        track () {
            if (!this.canStartTracking()) {
                return;
            }

            const geolocation = this.ensureGeolocationInstance();

            this.showMarkerOverlay();
            this.unbindGeolocationListeners(geolocation);
            this.bindGeolocationListeners(geolocation);
            this.startTrackingSession(geolocation);
        },

        /**
         * Untracking the geo position
         * @returns {void}
         */
        untrack () {
            const geolocation = this.geolocation;

            if (!geolocation) {
                this.tracking = false;
                return;
            }

            this.stopTrackingSession(geolocation);
            if (this.tracking === false || this.firstGeolocation === false) {
                this.removeOverlay();
            }
            clearAccuracyGeometryUtil({
                accuracyFeature: this.accuracyFeature,
                geolocation,
                listener: this.onAccuracyGeometryChange
            });
            this.unbindGeolocationListeners(geolocation);

            this.tracking = false;
        },

        /**
         * Show error information and untack if there are errors by trcking the position
         * @returns {void}
         */
        onError () {
            this.addSingleAlert({
                category: "error",
                content: `<strong>${this.$t("common:modules.controls.orientation.geolocationDeniedText")}</strong>`
            });
            this.isGeolocationDenied = true;
            if (this.geolocation !== null) {
                this.untrack();
            }
        },

        /**
         * Removing the overlay of marker from map
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
        },

        /**
         * To decide show or not to show Poi
         * @returns {void}
         */
        checkWFS () {
            const visibleWFSModels = [];

            this.visibleLayerConfigs?.forEach(layer => {
                if (layer.typ === "WFS") {
                    visibleWFSModels.push(layer);
                }
            });

            if (this.poiDistancesLocal.length > 0) {
                if (!visibleWFSModels.length) {
                    this.setShowPoiIcon(false);
                    this.$store.dispatch("Maps/removePointMarker");
                }
                else {
                    this.setShowPoiIcon(true);
                }
            }
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
                content: `<strong>${this.$t("common:modules.controls.orientation.trackingDeniedText")}</strong>`
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
        }
    }

};
</script>

<template>
    <div class="orientationButtons">
        <span
            id="geolocation_marker"
            class="geolocation_marker"
        >
            <span
                v-if="showDirection && Number.isFinite(heading)"
                class="geolocation_marker_direction_anchor"
                :style="markerDirectionStyle"
            >
                <i
                    :class="iconDirectionArrow + ' geolocation_marker_direction'"
                />
            </span>
            <i :class="iconGeolocationMarker" />
        </span>
        <ControlIcon
            id="geolocate"
            :title="$t('common:modules.controls.orientation.titleGeolocate')"
            :icon-name="iconGeolocate"
            :on-click="getOrientation"
        />
        <ControlIcon
            v-if="showPoiIcon"
            id="geolocatePOI"
            :icon-name="iconGeolocatePOI"
            :title="$t('common:modules.controls.orientation.titleGeolocatePOI')"
            :on-click="getPOI"
        />
        <PoiChoice
            v-if="showPoiChoice"
            id="geolocatePoiChoice"
            @track="trackPOI"
        />
        <PoiOrientation
            v-if="showPoi"
            :poi-distances="poiDistancesLocal"
            :get-features-in-circle="getVectorFeaturesInCircle"
            @hide="untrackPOI"
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
