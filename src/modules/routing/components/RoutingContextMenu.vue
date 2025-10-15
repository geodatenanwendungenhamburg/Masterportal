<script>
import {mapActions, mapGetters} from "vuex";
import Overlay from "ol/Overlay.js";
import Select from "ol/interaction/Select.js";
import Circle from "ol/geom/Circle";
import Feature from "ol/Feature";
import directionsWaypointsStyle from "../js/map/directions/waypoints/directionsWaypointsStyle";
import tsrWaypointsStyle from "../js/map/tsr/waypoints/tsrWaypointsStyle";
import directionsAvoidPointStyle from "../js/map/directions/avoid/directionsAvoidPointStyle";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {Modal, Popover} from "bootstrap";
import {toRaw} from "vue";

/**
 * RoutingContextMenu
 * @module modules/RoutingContextMenu
 * @vue-data {Object} map - the map.
 * @vue-data {Object} overlay - the Overlay Object.
 * @vue-data {Object} selectPointInteraction - creates right click interaction with waypoint layer
 * @vue-data {Object} contextMenu - context Menu
 * @vue-data {Array} coordinates - coordinates for overlay position.
 * @vue-data {Object} selectedFeature - selected feature.
 *
 * @vue-computed {String} waypointsDirections - waypoints of Directions
 * @vue-computed {String} directionsWaypointsLayer - waypoints layer of Directions
 * @vue-computed {String} settings - settings.
 */
export default {
    name: "RoutingContextMenu",
    components: {InputText, FlatButton},

    data () {
        return {
            map: null,
            overlay: null,
            selectPointInteraction: null,
            selectAvoidInteraction: null,
            contextMenu: null,
            coordinates: null,
            selectedFeature: null,
            avoidRadius: 0
        };
    },
    computed: {
        ...mapGetters("Modules/Routing", ["activeRoutingToolOption"]),
        ...mapGetters("Modules/Routing/Directions", {
            waypointsDirections: "waypoints"
        }),
        ...mapGetters("Modules/Routing/Directions", [
            "directionsWaypointsLayer",
            "directionsAvoidLayer",
            "directionsAvoidSource",
            "directionsAvoidPointLayer",
            "directionsAvoidPointSource",
            "mapInteractionMode",
            "settings"
        ]),
        ...mapGetters("Modules/Routing/TSR", {
            waypointsTSR: "waypoints"
        }),
        ...mapGetters("Modules/Routing/TSR", ["tsrWaypointsLayer", "tsrRouteLayer"]),
        /**
         * Check if radius of barrier point is valid.
         * @return {Boolean} true if radius is valid.
         */
        isRadiusValid () {
            return this.avoidRadius !== "" && this.avoidRadius <= this.settings.maxAvoidRadius && this.avoidRadius >= 0;
        },
        /**
         * Checks if current map mode is "AVOID_POINTS"
         * @returns {Boolean} true if mode is "AVOID_POINTS"
         */
        isMapInteractionModeAvoidPointsEdit () {
            return this.mapInteractionMode === "AVOID_POINTS";
        }
    },
    watch: {
        /**
         * Update state with new value when radius is changed and check
         * if new value is within valid range.
         * @returns {void}
         */
        avoidRadius () {
            this.settings.avoidRadius = this.avoidRadius;
            this.isRadiusValid && this.isMapInteractionModeAvoidPointsEdit ? this.createDirectionsAvoidPointDrawInteraction() : this.removeDirectionsAvoidDrawInteraction();
        }
    },
    mounted () {
        this.appendModalToBody();

        this.map = mapCollection.getMap("2D");
        this.overlay = new Overlay({
            id: "context-menu",
            element: this.$refs["ref-context-menu"]
        });

        this.map.addOverlay(this.overlay);

        this.createRightClickWaypoint();
        this.createRightClickAvoidPoint();

        this.selectAvoidInteraction = new Select({
            layers: [toRaw(this.directionsAvoidLayer), toRaw(this.directionsAvoidPointLayer)],
            style: directionsAvoidPointStyle,
            condition: e => e.originalEvent.buttons === 2
        });

        this.selectAvoidInteraction.on("select", event => {
            if (event.selected.length > 0) {
                this.selectedFeature = {
                    type: "avoid",
                    feature: event.selected[0]
                };
            }
            else {
                this.selectedFeature = null;
            }
        });

        this.map.addInteraction(this.selectAvoidInteraction);

        this.map.getViewport().addEventListener("contextmenu", this.setContextMenu);
    },
    beforeUnmount () {
        this.removeModalFromBody();
    },
    unmounted () {
        this.map.removeOverlay(this.map.getOverlayById("context-menu"));
        this.map.getViewport().removeEventListener("contextmenu", this.setContextMenu);
        this.map.removeInteraction(toRaw(this.selectPointInteraction));
        this.map.removeInteraction(toRaw(this.selectAvoidInteraction));
        document.body.removeEventListener("click", this.closeContextMenu);
    },
    methods: {
        ...mapActions("Modules/Routing", [
            "fetchTextByCoordinates",
            "transformCoordinatesLocalToWgs84Projection",
            "transformCoordinatesWgs84ToLocalProjection"
        ]),
        ...mapActions("Modules/Routing/Directions", {
            addWaypointDirections: "addWaypoint",
            removeWaypointDirections: "removeWaypoint"
        }),
        ...mapActions("Modules/Routing/Directions", [
            "findDirections",
            "createDirectionsAvoidPointDrawInteraction",
            "removeDirectionsAvoidDrawInteraction"
        ]),
        ...mapActions("Modules/Routing/TSR", {
            addWaypointTSR: "addWaypoint",
            removeWaypointTSR: "removeWaypoint"
        }),
        ...mapActions("Modules/Routing/TSR", ["isStartEndInput"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Appends modal to body in order to place modal correctly
         * @returns {void}
         */
        appendModalToBody () {
            const modal = this.$refs["ref-avoidPointModal"];

            if (modal) {
                document.body.appendChild(modal);
            }
        },
        /**
         * Removes modal from body
         * @returns {void}
         */
        removeModalFromBody () {
            const modal = this.$refs["ref-avoidPointModal"];

            if (modal) {
                document.body.removeChild(modal);
            }
        },
        /**
         * Sets new context menu after right clicking in map
         * @param {Event} event event
         * @returns {void}
         */
        setContextMenu (event) {
            event.preventDefault();
            if (this.activeRoutingToolOption === "DIRECTIONS"
                && (this.mapInteractionMode !== "AVOID_POINTS" && this.mapInteractionMode !== "AVOID_AREAS" && this.mapInteractionMode !== "DELETE_AVOID_AREAS")
                || (this.activeRoutingToolOption === "TSR" && this.tsrRouteLayer.getSource().getFeatures()[0].getGeometry().getCoordinates().length === 0)) {

                this.coordinates = this.map.getEventCoordinate(event);
                this.overlay.setPosition(this.coordinates);

                this.contextMenu = Popover.getInstance(this.overlay.getElement());

                if (!this.contextMenu) {
                    this.contextMenu = new Popover(this.overlay.getElement(), {
                        animation: false,
                        container: this.overlay.getElement(),
                        html: true,
                        placement: "top",
                        trigger: "focus",
                        content: this.selectedFeature
                            ? this.$refs["ref-context-menu-content-featureclick"].innerHTML
                            : this.$refs["ref-context-menu-content-mapclick"].innerHTML,
                        title: this.$refs["ref-context-menu-title"].innerHTML,
                        customClass: "routing-popover"
                    });
                }
                else {
                    this.contextMenu.setContent({
                        content: this.selectedFeature
                            ? this.$refs["ref-context-menu-content-featureclick"].innerHTML
                            : this.$refs["ref-context-menu-content-mapclick"].innerHTML,
                        title: this.$refs["ref-context-menu-title"].innerHTML
                    });
                }
                this.contextMenu.show();
                this.addEventListenerContextMenu();

                document.body.addEventListener("click", this.closeContextMenu);
            }
        },
        /**
         * Closes already existing context menu if clicked outside
         * @param {Event} event event
         * @returns {void}
         */
        closeContextMenu (event) {
            if (this.contextMenu && document.querySelector(".routing-popover")) {
                const dimension = document.querySelector(".routing-popover").getBoundingClientRect();
                let clickedOutside = true;

                if (event.x >= dimension.left && event.x <= dimension.right) {
                    if (event.y >= dimension.top && event.y <= dimension.bottom) {
                        clickedOutside = false;
                    }
                }
                if (clickedOutside) {
                    this.contextMenu.dispose();
                    this.contextMenu = null;
                    document.body.removeEventListener("click", this.closeContextMenu);
                }
            }
        },
        /**
         * Add event listeners for closing the context menu.
         * @returns {void}
         */
        addEventListenerContextMenu () {
            if (document.querySelector(".routing-popover .popover-header")) {
                document.querySelector(".routing-popover .popover-header").classList.add("routing-popover-header");
            }
            if (document.querySelector(".routing-popover .popover-body")) {
                document.querySelector(".routing-popover .popover-body").classList.add("routing-popover-body");
            }
            if (document.getElementsByClassName("routing-popover-header")[0].getElementsByClassName("routing-close-context-menu")[0]) {
                document.getElementsByClassName("routing-popover-header")[0].getElementsByClassName("routing-close-context-menu")[0].addEventListener("click", () => {
                    this.contextMenu.dispose();
                    this.contextMenu = null;
                });
            }
            if (document.getElementsByClassName("routing-popover-body")[0].getElementsByClassName("list-group")[0]) {
                document.getElementsByClassName("routing-popover-body")[0].getElementsByClassName("list-group")[0].addEventListener("click", this.initAction);
            }
        },
        /**
         * Handle directions event.
         * @param {Event} event event
         * @param {Array} localCoords Coordinates in local projection
         * @param {Object} geoSearchResult Geocoder result
         * @returns {void}
         */
        handleDirectionsEvent (event, localCoords, geoSearchResult) {
            const action = event.target.id,
                point = this.selectedFeature && this.waypointsDirections.find((element) => element.feature.ol_uid === this.selectedFeature.feature.ol_uid),
                emptyWaypoint = this.waypointsDirections.slice(1, this.waypointsDirections.length - 1).find((waypoint) => waypoint.coordinates.length === 0);

            switch (action) {
                case "add-startpoint":
                    this.waypointsDirections[0].setCoordinates(localCoords);
                    if (geoSearchResult) {
                        this.waypointsDirections[0].setDisplayName(geoSearchResult.getDisplayName());
                    }
                    this.findDirections();
                    break;
                case "add-waypoint":
                    if (emptyWaypoint) {
                        this.waypointsDirections[emptyWaypoint.index].setCoordinates(localCoords);
                        geoSearchResult && this.waypointsDirections[emptyWaypoint.index].setDisplayName(geoSearchResult.getDisplayName());
                    }
                    else {
                        this.addWaypointDirections({index: this.waypointsDirections.length - 1,
                            coordinates: localCoords,
                            displayName: geoSearchResult ? geoSearchResult.getDisplayName() : ""
                        });
                    }
                    this.findDirections();
                    break;
                case "add-endpoint":
                    this.waypointsDirections[this.waypointsDirections.length - 1].setCoordinates(localCoords);
                    geoSearchResult && this.waypointsDirections[this.waypointsDirections.length - 1].setDisplayName(geoSearchResult.getDisplayName());
                    this.findDirections();
                    break;
                case "add-avoidpoint":
                    this.avoidRadius = this.settings.avoidRadius;
                    new Modal(document.querySelector("#avoidPointModal")).show();
                    break;
                case "remove-point":
                    this.removeWaypointDirections({index: point.index, reload: true});
                    break;
                case "remove-avoid":
                    if (this.selectedFeature.feature.getGeometry().getType() === "Circle") {
                        this.directionsAvoidPointSource.removeFeature(this.selectedFeature.feature);
                    }

                    else {
                        this.directionsAvoidSource.removeFeature(this.selectedFeature.feature);
                    }
                    this.findDirections();
                    break;
                default: console.warn("Action type to handle directions event is invalid.");
            }
        },

        /**
         * Handle TSR Event.
         * @param {Event} event event
         * @param {Array} localCoords Coordinates in local projection
         * @param {Object} geoSearchResult Geocoder result
         * @returns {void}
         */
        handleTSREvent (event, localCoords, geoSearchResult) {
            const action = event.target.id,
                point = this.selectedFeature && this.waypointsTSR.find((element) => element.feature.ol_uid === this.selectedFeature.feature.ol_uid),
                emptyWaypoint = this.waypointsTSR.slice(1, this.waypointsTSR.length - 1).find((waypoint) => waypoint.displayName === undefined);

            switch (action) {
                case "add-startpoint":
                    this.waypointsTSR[0].setCoordinates(localCoords);
                    geoSearchResult && this.waypointsTSR[0].setDisplayName(geoSearchResult.getDisplayName());
                    break;
                case "add-endpoint":
                    this.removeWaypointTSR({index: this.waypointsTSR.length - 1});
                    this.waypointsTSR[this.waypointsTSR.length - 1].setCoordinates(localCoords);
                    geoSearchResult ? this.waypointsTSR[this.waypointsTSR.length - 1].setDisplayName(geoSearchResult.getDisplayName()) : this.waypointsTSR[this.waypointsTSR.length - 1].setDisplayName("");
                    break;
                case "add-waypoint":
                    this.isStartEndInput(1);
                    if (emptyWaypoint) {
                        this.waypointsTSR[emptyWaypoint.index].setCoordinates(localCoords);
                        geoSearchResult && this.waypointsTSR[emptyWaypoint.index].setDisplayName(geoSearchResult.getDisplayName());
                    }
                    else {
                        this.addWaypointTSR({index: this.waypointsTSR.length - 1,
                            coordinates: localCoords,
                            displayName: geoSearchResult ? geoSearchResult.getDisplayName() : ""
                        });
                    }
                    break;
                case "remove-point":
                    this.removeWaypointTSR({index: point.index});
                    break;
                default: console.warn("Action type to handle directions event is invalid.");
            }
        },


        /**
         * Initiates the selected action and closes context menu
         * @param {Event} event event
         * @returns {void}
         */
        async initAction (event) {

            try {
                const geoSearchResult = await this.fetchTextByCoordinates({
                        coordinates: await this.transformCoordinatesLocalToWgs84Projection(toRaw(this.coordinates))
                    }),
                    localCoords = toRaw(this.coordinates);

                if (this.activeRoutingToolOption === "DIRECTIONS") {
                    this.handleDirectionsEvent(event, localCoords, geoSearchResult);
                }
                else if (this.activeRoutingToolOption === "TSR") {
                    this.handleTSREvent(event, localCoords, geoSearchResult);
                }
            }
            catch (err) {
                this.addSingleAlert({
                    category: this.$t("common:modules.alerting.categories.error"),
                    content: this.$t("common:modules.routing.directions.batchProcessing.errorContextMenuSetPoint")
                });
            }

            this.contextMenu.dispose();
            this.contextMenu = null;
        },
        /**
         * Shows 'add waypoint' option if condition is met
         * @returns {Boolean} true if TSR is active or start- and endpoint are set
         */
        showAddwaypointOption () {
            if (this.activeRoutingToolOption === "DIRECTIONS") {
                return this.waypointsDirections[0]?.coordinates.length > 0 && this.waypointsDirections[this.waypointsDirections.length - 1]?.coordinates.length > 0;
            }
            return true;
        },
        /**
         * Add avoid point to layer source and close modal
         * @returns {void}
         */
        addAvoidPoint () {
            const avoidPoint = new Feature({
                    geometry: new Circle(this.coordinates)
                }),
                modal = Modal.getInstance(this.$refs["ref-avoidPointModal"]);

            avoidPoint.getGeometry().setRadius(this.avoidRadius > 0 ? this.avoidRadius * 1000 : 5);

            this.directionsAvoidPointSource.addFeature(avoidPoint);

            modal.hide();

            this.findDirections();
        },
        /**
         * Create right click interaction with waypoint layer in order to get point.
         * @returns {void}
         */
        createRightClickWaypoint () {
            this.selectPointInteraction = new Select({
                layers: this.activeRoutingToolOption === "DIRECTIONS" ? [toRaw(this.directionsWaypointsLayer)] : [toRaw(this.tsrWaypointsLayer)],
                style: this.activeRoutingToolOption === "DIRECTIONS" ? directionsWaypointsStyle : tsrWaypointsStyle,
                condition: e => e.originalEvent.buttons === 2
            });

            this.selectPointInteraction.on("select", event => {
                if (event.selected.length > 0) {
                    this.selectedFeature = {
                        type: "point",
                        feature: event.selected[0]
                    };
                }
                else {
                    this.selectedFeature = null;
                }
            });

            this.map.addInteraction(this.selectPointInteraction);
        },
        /**
         * Create right click interaction with avoid layers in order to get avoid feature.
         * @returns {void}
         */
        createRightClickAvoidPoint () {
            this.selectAvoidInteraction = new Select({
                layers: [toRaw(this.directionsAvoidLayer), toRaw(this.directionsAvoidPointLayer)],
                style: directionsAvoidPointStyle,
                condition: e => e.originalEvent.buttons === 2
            });

            this.selectAvoidInteraction.on("select", event => {
                if (event.selected.length > 0) {
                    this.selectedFeature = {
                        type: "avoid",
                        feature: event.selected[0]
                    };
                }
                else {
                    this.selectedFeature = null;
                }
            });

            this.map.addInteraction(this.selectAvoidInteraction);
        }

    }
};
</script>

<template>
    <div
        id="context-menu"
        ref="ref-context-menu"
    >
        <div
            id="context-menu-title"
            ref="ref-context-menu-title"
        >
            <div class="d-flex justify-content-between">
                <span>{{ $t('common:modules.routing.contextMenu.header') }}</span>
                <span class="routing-close-context-menu">
                    <i class="bi bi-x-circle" />
                </span>
            </div>
        </div>

        <div
            id="context-menu-content-mapclick"
            ref="ref-context-menu-content-mapclick"
            class="context-menu-content"
        >
            <ul class="list-group list-group-flush">
                <li
                    id="add-startpoint"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.addStartpoint') }}
                </li>
                <li
                    v-if="showAddwaypointOption()"
                    id="add-waypoint"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.addWaypoint') }}
                </li>
                <li
                    id="add-endpoint"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.addEndpoint') }}
                </li>
                <li
                    v-if="activeRoutingToolOption === 'DIRECTIONS'"
                    id="add-avoidpoint"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.addAvoidPoint') }}
                </li>
            </ul>
        </div>
        <div
            id="context-menu-content-featureclick"
            ref="ref-context-menu-content-featureclick"
            class="context-menu-content"
        >
            <ul class="list-group list-group-flush">
                <li
                    v-if="selectedFeature && selectedFeature.type ==='point'"
                    id="remove-point"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.removePoint') }}
                </li>
                <li
                    v-if="selectedFeature && selectedFeature.type ==='avoid'"
                    id="remove-avoid"
                    class="list-group-item list-group-item-action"
                >
                    {{ $t('common:modules.routing.contextMenu.removeAvoidPoint') }}
                </li>
            </ul>
        </div>
    </div>

    <div
        id="avoidPointModal"
        ref="ref-avoidPointModal"
        class="modal"
        tabindex="-1"
        aria-labelledby="avoidPointModalLabel"
    >
        <div
            class="modal-dialog modal-dialog-centered"
        >
            <div class="modal-content">
                <div class="modal-header">
                    <h1
                        id="avoidPointModalLabel"
                        class="modal-title fs-5"
                    >
                        <b>
                            {{ $t('common:modules.routing.contextMenu.avoidPointModalTitle') }}
                        </b>
                    </h1>
                    <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                    />
                </div>
                <div class="modal-body">
                    <div class="input-group mb-3">
                        <div class="form-floating mb-3 w-100 mt-3">
                            <InputText
                                :id="'avoidRadius'"
                                v-model="avoidRadius"
                                type="number"
                                :class-obj="['form-control' + (isRadiusValid ? ' is-valid': ' is-invalid')]"
                                class="w-100"
                                :aria-describedby="`avoidPointRadius-input-help`"
                                :label="$t('common:modules.routing.directions.avoidAreas.avoidPointRadius')"
                                :placeholder="$t('common:modules.routing.directions.avoidAreas.avoidPointRadiusOutOfRangeKm')"
                                :min="0"
                                :step="0.1"
                                :max="12"
                                :error-message="$t('common:modules.routing.directions.avoidAreas.avoidPointRadiusOutOfRangeKm')"
                            />
                        </div>
                        <div class="form-floating mb-3">
                            <select
                                id="draw-avoidPoint-settings"
                                class="form-select"
                                disabled
                            >
                                <option>
                                    {{ $t('common:modules.routing.directions.avoidAreas.avoidPointRadiusUnitKm') }}
                                </option>
                            </select>
                            <label for="draw-circle-settings">
                                {{ $t("common:shared.modules.draw.drawSettingsCircle.unit") }}
                            </label>
                        </div>
                    </div>
                    <div
                        class="d-flex justify-content-center"
                    >
                        <FlatButton
                            id="btn-add-avoidpoint"
                            :class="{disabled: !isRadiusValid}"
                            :aria-label="$t('common:modules.routing.settings.submit')"
                            :text="$t('common:modules.routing.settings.submit')"
                            :interaction="($event) => addAvoidPoint()"
                            role="button"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

#context-menu-title, .context-menu-content {
    display: none;
}

.modal-dialog {
    width: 300px;
}

#draw-avoidPoint-settings {
  background-image: none;
}
</style>

<style lang="scss">
@import "~variables";

.routing-popover {
    width: 200px;
}

.routing-popover-header .routing-close-context-menu {
    cursor: pointer;
}

.routing-popover-header {
    background: $secondary;
    color: $white;
}

.routing-popover-body {
    padding: 10px 0px;
}

.routing-popover-body .list-group {
    cursor: pointer
}


</style>
