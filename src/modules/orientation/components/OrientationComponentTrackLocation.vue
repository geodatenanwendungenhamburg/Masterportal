<script>
import {markRaw} from "vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import Geolocation from "ol/Geolocation.js";
import Overlay from "ol/Overlay.js";
import * as Proj from "ol/proj.js";
import proj4 from "proj4";
import {
    clearAccuracyGeometry as clearAccuracyGeometryUtil,
    createAccuracyFeature,
    initAccuracyLayer as initAccuracyLayerUtil,
    updateAccuracyGeometry as updateAccuracyGeometryUtil
} from "../utils/accuracyLayer.js";
import {
    getMarkerDirectionStyle,
    resolveHeading
} from "../utils/directionMarker.js";

/**
 * Handles geolocation tracking and marker display for orientation module.
 * Manages positioning, accuracy circle, and zoom behavior.
 * @module modules/Orientation/OrientationComponentLocation
 * @vue-prop {String} poiMode - Location mode: "currentPosition" or "customPosition"
 * @vue-emit {position-received} Emits when position is updated
 * @vue-emit {error} Emits when geolocation error occurs
 */
export default {
    name: "OrientationComponentTrackLocation",
    props: {
        poiMode: {
            type: String,
            required: true,
            validator: value => ["currentPosition", "customPosition"].includes(value)
        }
    },
    emits: ["position-received", "error"],
    data () {
        return {
            firstGeolocation: true,
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
        ...mapGetters("Modules/Orientation", [
            "geolocation",
            "iconGeolocationMarker",
            "iconDirectionArrow",
            "iFrameGeolocationEnabled",
            "showAccuracy",
            "showDirection",
            "zoomMode"
        ]),
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Menu", ["menuSide"]),
        markerDirectionStyle () {
            return getMarkerDirectionStyle(this.showDirection, this.heading);
        }
    },
    created () {
        this.setIsGeoLocationPossible();
    },
    mounted () {
        this.resetCurrentMouseMapInteractionsComponent(this.menuSide);
        this.setIsGeoLocationPossible();
        this.addElement();
        if (this.poiMode === "currentPosition") {
            this.track();
        }
    },
    methods: {
        ...mapMutations("Modules/Orientation", ["setGeolocation", "setPosition"]),
        ...mapActions("Maps", ["zoomToCoordinates"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Menu", ["resetCurrentMouseMapInteractionsComponent"]),

        /**
         * Add overlay element for marker
         * @returns {void}
         */
        addElement () {
            this.marker.setElement(document.querySelector("#geolocation_marker"));
        },

        /**
         * Check if geolocation is possible (HTTPS or localhost)
         * @returns {void}
         */
        setIsGeoLocationPossible () {
            this.isGeoLocationPossible = window.location.protocol === "https:" || ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
        },

        /**
         * Check if tracking can start
         * @returns {Boolean} Whether tracking can start
         */
        canStartTracking () {
            const inIframe = window.self !== window.top,
                  iFrameGeolocationEnabled = this.iFrameGeolocationEnabled === true;

            if (inIframe && !iFrameGeolocationEnabled) {
                this.addSingleAlert({
                    category: "error",
                    content: `<strong>${this.$t("common:modules.orientation.iFrameGeolocationError")}</strong>`
                });
                return false;
            }
            if (this.isGeolocationDenied !== false) {
                this.onError();
                return false;
            }
            return true;
        },

        /**
         * Ensure geolocation instance exists
         * @returns {Geolocation} The geolocation instance
         */
        ensureGeolocationInstance () {
            if (this.geolocation === null) {
                const geolocation = markRaw(new Geolocation({
                    tracking: false,
                    projection: Proj.get("EPSG:4326"),
                    trackingOptions: {enableHighAccuracy: true}
                }));

                this.setGeolocation(geolocation);
                return geolocation;
            }
            return this.geolocation;
        },

        /**
         * Start tracking geolocation
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
         * Bind geolocation event listeners
         * @param {Geolocation} geolocation
         * @returns {void}
         */
        bindGeolocationListeners (geolocation) {
            if (this.showAccuracy) {
                geolocation.on("change:accuracyGeometry", this.onAccuracyGeometryChange);
            }
            geolocation.on("change", this.positioning);
            geolocation.on("error", this.onError);
        },

        /**
         * Unbind geolocation event listeners
         * @param {Geolocation} geolocation
         * @returns {void}
         */
        unbindGeolocationListeners (geolocation) {
            geolocation.un("change", this.positioning);
            geolocation.un("error", this.onError);
            geolocation.un("change:accuracyGeometry", this.onAccuracyGeometryChange);
        },

        /**
         * Show marker overlay on map
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

        /**
         * Start tracking session
         * @param {Geolocation} geolocation
         * @returns {void}
         */
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

        /**
         * Stop tracking session
         * @param {Geolocation} geolocation
         * @returns {void}
         */
        stopTrackingSession (geolocation) {
            geolocation.setTracking(false);
            this.unbindGeolocationListeners(geolocation);
            this.heading = null;
            this.previousPosition = null;
        },

        /**
         * Stop tracking geolocation
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

            this.tracking = false;
        },

        /**
         * Handle geolocation error
         * @returns {void}
         */
        onError () {
            this.addSingleAlert({
                category: "error",
                content: `<strong>${this.$t("common:modules.orientation.geolocationDeniedText")}</strong>`
            });
            this.isGeolocationDenied = true;
            this.$emit("error");
        },

        /**
         * Update accuracy circle
         * @returns {void}
         */
        onAccuracyGeometryChange () {
            updateAccuracyGeometryUtil({
                accuracyFeature: this.accuracyFeature,
                geolocation: this.geolocation,
                projectionCode: this.projection.getCode(),
                showAccuracy: this.showAccuracy
            });
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

            this.$emit("position-received", {position: centerPosition, heading: this.heading, mode: "currentPosition"});
        }
    }
};
</script>

<template>
    <div class="orientation-location">
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
    </div>
</template>

<style lang="scss" scoped>
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
