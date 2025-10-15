<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import LightButton from "@shared/modules/buttons/components/LightButton.vue";
import RoutingExportAvoidAreas from "../RoutingExportAvoidAreas.vue";
import RoutingImportAvoidAreas from "../RoutingImportAvoidAreas.vue";
import RoutingCoordinateInput from "../RoutingCoordinateInput.vue";
import RoutingDistanceDisplay from "../RoutingDistanceDisplay.vue";
import RoutingDurationDisplay from "../RoutingDurationDisplay.vue";
import DirectionsItemBatchProcessing from "./DirectionsItemBatchProcessing.vue";
import RoutingBatchProcessingCheckbox from "../RoutingBatchProcessingCheckbox.vue";
import RoutingDownload from "../RoutingDownload.vue";
import RoutingSpeedProfileIcon from "../RoutingSpeedProfileIcon.vue";
import RoutingAvoidFeatures from "../RoutingAvoidFeatures.vue";
import RoutingRestrictionsInput from "../RoutingRestrictionsInput.vue";
import RoutingElevationProfile from "../RoutingElevationProfile.vue";
import RoutingContextMenu from "../RoutingContextMenu.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import * as constants from "../../store/directions/constantsDirections";
import * as constantsRouting from "../../store/constantsRouting";
import {Modal} from "bootstrap";

/**
 * DirectionsItem
 * @module modules/routing/components/Directions/DirectionsItem
 * @vue-data {*} constants - The constants direction.
 * @vue-data {*} constantsRouting - The constants routing.
 * @vue-data {*} defaultpreference - default preference.
 * @vue-data {*} avoidRadius - Radius of avoid points.
 * @vue-computed {Boolean} isMapInteractionModeAvoidAreasEdit - Shows if current map mode is "AVOID_AREAS".
 * @vue-computed {Boolean} isMapInteractionModeAvoidPointsEdit - Shows if current map mode is "AVOID_POINTS".
 * @vue-computed {Boolean} isMapInteractionModeAvoidAreasDelete - Shows if current map mode is "DELETE_AVOID_AREAS".
 */
export default {
    name: "DirectionsItem",
    components: {
        IconButton,
        RoutingExportAvoidAreas,
        RoutingImportAvoidAreas,
        RoutingCoordinateInput,
        RoutingDistanceDisplay,
        RoutingDurationDisplay,
        RoutingDownload,
        DirectionsItemBatchProcessing,
        RoutingBatchProcessingCheckbox,
        RoutingAvoidFeatures: RoutingAvoidFeatures,
        RoutingSpeedProfileIcon,
        RoutingRestrictionsInput,
        RoutingElevationProfile,
        LightButton,
        RoutingContextMenu,
        InputText
    },
    data () {
        return {
            constants,
            constantsRouting,
            defaultPreference: null,
            avoidRadius: 0,
            showAvoidAreaButtons: false
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/Directions", [
            "directionsRouteSource",
            "directionsAvoidSource",
            "directionsAvoidPointSource",
            "directionsWaypointsSource",
            "isInputDisabled",
            "mapInteractionMode",
            "routingAvoidFeaturesOptions",
            "routingRestrictionsInputData",
            "routingDirections",
            "settings",
            "waypoints",
            "keepRoutes"
        ]),
        ...mapGetters("Modules/Routing", ["directionsSettings"]),
        /**
         * Checks if current map mode is "AVOID_AREAS"
         * @returns {Boolean} true if mode is "AVOID_AREAS"
         */
        isMapInteractionModeAvoidAreasEdit () {
            return this.mapInteractionMode === "AVOID_AREAS";
        },
        /**
         * Checks if current map mode is "AVOID_POINTS"
         * @returns {Boolean} true if mode is "AVOID_POINTS"
         */
        isMapInteractionModeAvoidPointsEdit () {
            return this.mapInteractionMode === "AVOID_POINTS";
        },
        /**
         * Checks if current map mode is "DELETE_AVOID_AREAS"
         * @returns {Boolean} true if mode is "DELETE_AVOID_AREAS"
         */
        isMapInteractionModeAvoidAreasDelete () {
            return this.mapInteractionMode === "DELETE_AVOID_AREAS";
        },
        /**
         * Check if radius of barrier point is valid.
         * @return {Boolean} true if radius is valid.
         */
        isRadiusValid () {
            return this.avoidRadius !== "" && this.avoidRadius <= this.settings.maxAvoidRadius && this.avoidRadius >= 0;
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
            this.isRadiusValid ? this.createDirectionsAvoidPointDrawInteraction() : this.removeDirectionsAvoidDrawInteraction();
        }
    },
    created () {
        this.initDirections();
        this.defaultPreference = this.directionsSettings?.preference;
    },
    beforeUnmount () {
        this.closeDirections();
        this.removeModalFromBody();
    },
    mounted () {
        this.appendModalToBody();
        this.setMapInteractionMode("WAYPOINTS");
        this.createInteractionFromMapInteractionMode();
        this.avoidRadius = this.settings.avoidRadius;
    },
    methods: {
        ...mapMutations("Modules/Routing/Directions", [
            "setRoutingDirections",
            "setMapInteractionMode",
            "setKeepRoutes",
            "setRoutingAvoidFeaturesOptions"
        ]),
        ...mapActions("Modules/Routing/Directions", [
            "findDirections",
            "unHighlightRoute",
            "highlightRoute",
            "zoomToRoute",
            "initDirections",
            "createInteractionFromMapInteractionMode",
            "closeDirections",
            "addWaypoint",
            "removeWaypoint",
            "moveWaypointDown",
            "moveWaypointUp",
            "isStartEndInput",
            "createDirectionsAvoidPointDrawInteraction",
            "removeDirectionsAvoidDrawInteraction"
        ]),

        /**
         * Changes the current speed profile and requests directions after
         * @param {String} speedProfileId from constantsRouting
         * @returns {void}
         */
        changeSpeedProfile (speedProfileId) {
            if (this.isInputDisabled) {
                return;
            }
            this.settings.speedProfile = speedProfileId;
            this.findDirections();
        },
        /**
         * Changes the current preference and requests directions after
         * @param {String} preferenceId from constantsDirections
         * @returns {void}
         */
        changePreference (preferenceId) {
            this.settings.preference = preferenceId;
            this.findDirections();
        },
        /**
         * Toggles the current map mode between "AVOID_AREAS" and "WAYPOINTS"
         * @returns {void}
         */
        changeMapInteractionModeAvoidAreasEdit () {
            const avoidAreasMode = this.mapInteractionMode === "AVOID_AREAS";

            this.setMapInteractionMode(avoidAreasMode ? "WAYPOINTS" : "AVOID_AREAS");
            this.createInteractionFromMapInteractionMode();
        },
        /**
         * Toggles the current map mode between "AVOID_POINTS" and "WAYPOINTS"
         * @returns {void}
         */
        changeMapInteractionModeAvoidPointsEdit () {
            const avoidPointsMode = this.mapInteractionMode === "AVOID_POINTS";

            this.setMapInteractionMode(avoidPointsMode ? "WAYPOINTS" : "AVOID_POINTS");
            this.avoidRadius = avoidPointsMode ? this.avoidRadius : this.settings.avoidRadius;
            this.createInteractionFromMapInteractionMode();
            this.isRadiusValid && this.mapInteractionMode === "AVOID_POINTS" ? this.createDirectionsAvoidPointDrawInteraction() : this.removeDirectionsAvoidDrawInteraction();
        },
        /**
         * Toggles the current map mode between "DELETE_AVOID_AREAS" and "WAYPOINTS"
         * @returns {void}
         */
        changeMapInteractionModeAvoidAreasDelete () {
            const avoidAreasMode = this.mapInteractionMode === "DELETE_AVOID_AREAS";

            this.setMapInteractionMode(avoidAreasMode ? "WAYPOINTS" : "DELETE_AVOID_AREAS");
            this.createInteractionFromMapInteractionMode();
        },
        /**
         * Reset mapInteractionMode to "Waypoints".
         * @returns {void}
         */
        resetMapInteractionMode () {
            this.setMapInteractionMode("WAYPOINTS");
            this.createInteractionFromMapInteractionMode();
        },
        /**
         * Resets the current settings, including waypoints and avoid areas.
         * @returns {void}
         */
        reset () {
            for (let i = this.waypoints.length - 1; i >= 0; i--) {
                this.removeWaypoint({index: this.waypoints[i].index});
            }
            this.directionsRouteSource.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            this.directionsWaypointsSource?.getFeatures().forEach(feature => this.directionsWaypointsSource.removeFeature(feature));
            this.setRoutingDirections(null);
            this.directionsAvoidSource.clear();
            this.directionsAvoidPointSource.clear();

            if (this.settings.speedProfile === "HGV") {
                this.routingRestrictionsInputData.length = 10.0;
                this.routingRestrictionsInputData.width = 2.4;
                this.routingRestrictionsInputData.height = 2.8;
                this.routingRestrictionsInputData.weight = 18;
                this.routingRestrictionsInputData.axleload = 6;
                this.routingRestrictionsInputData.hazmat = false;
            }
            this.avoidRadius = this.settings.defaultAvoidRadius;

            this.setRoutingAvoidFeaturesOptions([]);
            this.settings.preference = this.defaultPreference;
        },
        /**
         * Adds a new option to avoid when requesting directions afterwards
         * @param {String} optionId from constantsRouting
         * @returns {void}
         */
        onAddAvoidOption (optionId) {
            this.routingAvoidFeaturesOptions.push(optionId);
            this.findDirections();
        },
        /**
         * Removes an option to avoid when requesting directions afterwards
         * @param {String} optionId from constantsRouting
         * @returns {void}
         */
        onRemoveAvoidOption (optionId) {
            const index = this.routingAvoidFeaturesOptions.findIndex(
                (opt) => opt === optionId
            );

            this.routingAvoidFeaturesOptions.splice(index, 1);
            this.findDirections();
        },
        /**
         * Changes the setting to display batch processing
         * @param {Boolean} input new value
         * @returns {void}
         */
        onBatchProcessingCheckboxInput (input) {
            this.directionsSettings.batchProcessing.active = input;
        },
        /**
         * Called after file validation of upload
         * @returns {void}
         */
        afterFileValidation () {
            const modalElement = this.$refs.uploadModal,
                modal = Modal.getInstance(modalElement);

            modal.hide();
        },
        /**
         * Appends modal to body in order to place modal correctly
         * @returns {void}
         */
        appendModalToBody () {
            const uploadModal = this.$refs.uploadModal;

            if (uploadModal) {
                document.body.appendChild(uploadModal);
            }
        },
        /**
         * Removes modal from body
         * @returns {void}
         */
        removeModalFromBody () {
            const uploadModal = this.$refs.uploadModal;

            if (uploadModal) {
                document.body.removeChild(uploadModal);
            }
        },
        /**
         * set Avoid Radius
         * @returns {void}
         */
        setAvoidRadius () {
            this.settings.avoidRadius = this.avoidRadius;
        }
    }
};
</script>

<template>
    <div id="routing-directions">
        <RoutingSpeedProfileIcon
            v-for="option in constantsRouting.speedProfileOptions"
            :key="option"
            :interaction="() => changeSpeedProfile(option)"
            :class="['pointer mr-4 ', isInputDisabled ? 'opacity-05' : '']"
            :speed-profile-id="option"
            :fill-color="option === settings.speedProfile ? '#0077ff' : '#000000'"
            :tooltip="$t('common:modules.routing.speedprofiles.' + option)"
        />

        <hr>
        <input
            id="routing-delete-routes-input"
            type="checkbox"
            :checked="keepRoutes"
            @change="setKeepRoutes($event.target.checked)"
        >
        <span class="ms-2">{{ $t('common:modules.routing.directions.keepRoutesAfterClose') }}</span>

        <hr>
        <template v-if="directionsSettings.batchProcessing.enabled">
            <RoutingBatchProcessingCheckbox
                :batch-processing="directionsSettings.batchProcessing"
                @input="onBatchProcessingCheckboxInput($event)"
            />

            <hr>
        </template>

        <template v-if="directionsSettings.batchProcessing.enabled && directionsSettings.batchProcessing.active">
            <DirectionsItemBatchProcessing :settings="settings" />
        </template>
        <template v-else>
            <form
                id="routing-directions-coordinate-input-form"
                class="form-horizontal"
                role="form"
            >
                <div
                    class="helptext mb-3"
                >
                    <span>{{ $t('common:modules.routing.coordinateInputHelp') }}</span>
                </div>
                <RoutingCoordinateInput
                    v-for="(waypoint, index) in waypoints.slice(0, waypoints.length - 1)"
                    :key="index"
                    :class="index === 0 ? 'startpoint-input' : 'waypoint-input'"
                    :count-waypoints="waypoints.length"
                    :waypoint="waypoint"
                    @move-waypoint-up="moveWaypointUp(waypoint.index)"
                    @move-waypoint-down="moveWaypointDown(waypoint.index)"
                    @remove-waypoint="removeWaypoint({index: waypoint.index, reload: true})"
                    @remove-avoid-interaction="resetMapInteractionMode()"
                    @add-start-end="isStartEndInput(index)"
                    @search-result-selected="isStartEndInput(-1); findDirections()"
                />
                <div class="row mb-3 m-1">
                    <button
                        id="add-waypoint"
                        type="button"
                        class="btn btn-light justify-content-left text-start"
                        :title="$t('common:modules.routing.addWaypoint')"
                        @click="isStartEndInput(-1); addWaypoint({index: waypoints.length - 1})"
                    >
                        <i class="bi-plus-circle" />
                        {{ $t('common:modules.routing.addWaypoint') }}
                    </button>
                </div>
                <RoutingCoordinateInput
                    v-for="(waypoint, index) in waypoints.slice(waypoints.length - 1, waypoints.length)"
                    :key="index"
                    :class="'endpoint-input'"
                    :count-waypoints="waypoints.length"
                    :waypoint="waypoint"
                    @move-waypoint-up="moveWaypointUp(waypoints.length - 1)"
                    @remove-waypoint="removeWaypoint({index: waypoints.length - 1, reload: true})"
                    @remove-avoid-interaction="resetMapInteractionMode()"
                    @add-start-end="isStartEndInput(waypoints.length - 1)"
                    @search-result-selected="isStartEndInput(-1); findDirections()"
                />
            </form>

            <hr>
            <div
                id="routing-avoid-features"
                class="d-flex flex-column"
            >
                <button
                    class="d-flex btn-dropdown"
                    @click="showAvoidAreaButtons = !showAvoidAreaButtons, resetMapInteractionMode()"
                    @keydown.enter="showAvoidAreaButtons = !showAvoidAreaButtons , resetMapInteractionMode()"
                >
                    <i
                        :class="showAvoidAreaButtons? 'bi-chevron-down' : 'bi-chevron-right'"
                    />
                    <b class="mx-2">{{ $t('common:modules.routing.directions.restrictedAreas') }}</b>
                </button>
                <div
                    v-if="showAvoidAreaButtons"
                    class="mt-2"
                >
                    <div class="d-flex justify-content-between">
                        <!-- avoid area -->
                        <div class="btn-grouping d-flex flex-column align-items-center justify-content-center">
                            <IconButton
                                id="addAvoidAreaBtn"
                                class="mx-2"
                                :aria="$t('common:modules.routing.directions.editRestrictedAreas')"
                                :icon="'bi-bounding-box-circles fs-7'"
                                :class-array="[isMapInteractionModeAvoidAreasEdit ? 'btn-primary' : 'btn-light']"
                                @click="changeMapInteractionModeAvoidAreasEdit()"
                                @keydown.enter="changeMapInteractionModeAvoidAreasEdit()"
                            />
                            <label
                                id="addAvoidArea"
                                for="addAvoidAreasBtn"
                                class="btn-description"
                            >{{ $t('common:modules.routing.directions.avoidAreas.avoidArea') }}</label>
                        </div>

                        <!-- Avoid Points -->
                        <div class="btn-grouping d-flex flex-column align-items-center justify-content-center">
                            <IconButton
                                id="addAvoidPointBtn"
                                class="mx-2"
                                :aria="$t('common:modules.routing.directions.editRestrictedPoints')"
                                :icon="'bi-record-circle fs-7'"
                                :class-array="[isMapInteractionModeAvoidPointsEdit ? 'btn-primary' : 'btn-light']"
                                @click="changeMapInteractionModeAvoidPointsEdit()"
                                @keydown.enter="changeMapInteractionModeAvoidPointsEdit()"
                            />
                            <label
                                id="addAvoidPoint"
                                for="addAvoidPointBtn"
                                class="btn-description"
                            >{{ $t('common:modules.routing.directions.avoidAreas.avoidPoint') }}
                            </label>
                        </div>

                        <!-- delete avoid area -->
                        <div class="btn-grouping d-flex flex-column align-items-center justify-content-center">
                            <IconButton
                                id="deleteAvoidAreaBtn"
                                class="mx-2"
                                :aria="$t('common:modules.routing.directions.deleteRestrictedAreas')"
                                :icon="'bi-x-square fs-7'"
                                :class-array="[isMapInteractionModeAvoidAreasDelete ? 'btn-primary' : 'btn-light']"
                                @click="changeMapInteractionModeAvoidAreasDelete()"
                                @keydown.enter="changeMapInteractionModeAvoidAreasDelete()"
                            />
                            <label
                                id="deleteAvoidArea"
                                for="deleteAvoidAreaBtn"
                                class="btn-description"
                            >{{ $t('common:modules.routing.directions.avoidAreas.delete') }}
                            </label>
                        </div>
                        <!-- export avoid area -->
                        <div class="btn-grouping d-flex flex-column align-items-center justify-content-center">
                            <IconButton
                                id="exportAvoidAreasBtn"
                                class="mx-2"
                                :aria="$t('common:modules.routing.exportAvoidAreas.tooltip')"
                                :class-array="['btn-light']"
                                :icon="'bi-file-earmark-arrow-down fs-7'"
                                data-bs-toggle="modal"
                                data-bs-target="#exportAvoidAreasModal"
                            />
                            <RoutingExportAvoidAreas />
                            <label
                                id="exportAvoidAreas"
                                for="exportAvoidAreasBtn"
                                class="btn-description"
                            >{{ $t('common:modules.routing.directions.avoidAreas.export') }}</label>
                        </div>
                        <!-- import avoid areas -->
                        <div class="btn-grouping d-flex flex-column align-items-center justify-content-center">
                            <IconButton
                                id="importAvoidAreasBtn"
                                class="mx-2"
                                :aria="$t('common:modules.routing.importAvoidAreas.tooltip')"
                                :class-array="['btn-light']"
                                :icon="'bi-upload fs-7'"
                                data-bs-toggle="modal"
                                data-bs-target="#uploadModal"
                            />
                            <label
                                id="importAvoidAreas"
                                for="importAvoidAreasBtn"
                                class="btn-description"
                            >{{ $t('common:modules.routing.directions.avoidAreas.import') }}</label>
                        </div>
                    </div>
                </div>
                <div v-if="isMapInteractionModeAvoidPointsEdit">
                    <div
                        class="d-flex flex-row mb-3"
                    >
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
                                :max="12"
                                :step="0.1"
                                :error-message="$t('common:modules.routing.directions.avoidAreas.avoidPointRadiusOutOfRangeKm')"
                            />
                        </div>
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

                <!-- Modal -->
                <div
                    id="uploadModal"
                    ref="uploadModal"
                    class="modal fade"
                    tabindex="-1"
                    aria-labelledby="uploadModalLabel"
                    aria-hidden="true"
                >
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h1
                                    id="uploadModalLabel"
                                    class="modal-title fs-5"
                                >
                                    {{ $t('common:modules.routing.importAvoidAreas.header') }}
                                    <a
                                        href="#"
                                        :aria-label="$t('common:modules.routing.importAvoidAreas.help')"
                                    />
                                </h1>
                                <button
                                    type="button"
                                    class="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                />
                            </div>
                            <div class="modal-body">
                                <div class="mt-2 col-md-12">
                                    {{ $t('common:modules.routing.importAvoidAreas.description') }}
                                </div>
                                <div class="mt-2 mb-2 col-md-12">
                                    {{ $t('common:modules.routing.importAvoidAreas.structure') }}
                                    <hr>
                                    <RoutingImportAvoidAreas
                                        @after-file-validation="afterFileValidation()"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <hr>

        <label
            for="routing-directions-preference"
            class="routing-directions-preference-label"
        >
            {{ $t("common:modules.routing.directions.preferenceLabel") }}
        </label>
        <select
            id="routing-directions-preference"
            class="form-select form-select-sm"
            @change="changePreference($event.target.value)"
        >
            <option
                v-for="option in constants.preferenceOptions"
                :id="option"
                :key="'routing-directions-preference-' + option"
                :value="option"
                :selected="option === settings.preference"
                :disabled="isInputDisabled"
            >
                {{ $t('common:modules.routing.directions.preference.' + option) }}
            </option>
        </select>

        <hr>

        <div v-if="settings.speedProfile === 'HGV'">
            <RoutingRestrictionsInput />
        </div>

        <RoutingAvoidFeatures
            :settings="settings"
            :active-avoid-features-options="routingAvoidFeaturesOptions"
            :disabled="isInputDisabled"
            @add-avoid-option="onAddAvoidOption($event)"
            @remove-avoid-option="onRemoveAvoidOption($event)"
        />

        <template v-if="!(directionsSettings.batchProcessing.enabled && directionsSettings.batchProcessing.active)">
            <hr>

            <div
                v-if="routingDirections"
                id="routing-directions-result-directions"
            >
                <div
                    class="d-flex justify-content-between"
                >
                    <RoutingSpeedProfileIcon
                        :speed-profile-id="settings.speedProfile"
                        fill-color="#000000"
                        :tooltip="$t('common:modules.routing.speedprofiles.' + settings.speedProfile)"
                        :class="['none-pointer-events ']"
                    />
                    <RoutingDurationDisplay :duration="routingDirections.duration" />
                    <RoutingDistanceDisplay :distance="routingDirections.distance" />
                </div>

                <hr class="mb-0">

                <template
                    v-for="(segment, segmentIndex) of routingDirections.segments"
                    :key="'segment_header_' + segmentIndex"
                >
                    <button
                        class="d-flex step pl-2 py-4 btn-directions"
                        @mouseover="highlightRoute({fromWaypointIndex: segmentIndex, toWaypointIndex: segmentIndex + 1})"
                        @focus="highlightRoute({fromWaypointIndex: segmentIndex, toWaypointIndex: segmentIndex + 1})"
                        @mouseout="unHighlightRoute()"
                        @blur="unHighlightRoute()"
                    >
                        <span
                            role="button"
                            tabindex="0"
                            class="d-flex btn-icon"
                            @click="segment.displayDetails = !segment.displayDetails"
                            @keydown.enter="segment.displayDetails = !segment.displayDetails"
                        >
                            <span>{{ segmentIndex === 0 ? 'A' : segmentIndex }}</span>

                            <b>
                                <span v-if="segment.displayDetails">
                                    <i class="bi-chevron-down" />
                                </span>
                                <span v-else>
                                    <i class="bi-chevron-right" />
                                </span>
                            </b>
                        </span>

                        <span
                            role="button"
                            tabindex="0"
                            class="d-flex flex-column ms-2 w-100 btn-directions"
                            @click="zoomToRoute({fromWaypointIndex: segmentIndex, toWaypointIndex: segmentIndex + 1})"
                            @keydown.enter="zoomToRoute({fromWaypointIndex: segmentIndex, toWaypointIndex: segmentIndex + 1})"
                        >
                            <b>{{ waypoints[segmentIndex].getDisplayName() }}</b>
                            <div
                                class="d-flex justify-content-between"
                            >
                                <RoutingDurationDisplay :duration="segment.duration" />
                                <RoutingDistanceDisplay :distance="segment.distance" />
                            </div>
                        </span>
                    </button>

                    <hr
                        class="m-0"
                    >

                    <div
                        v-if="segment.displayDetails"
                    >
                        <template
                            v-for="(step, stepIndex) of segment.steps"
                            :key="stepIndex"
                        >
                            <button
                                v-if="stepIndex !== segment.steps.length - 1"
                                v-bind="step"
                                class="ms-4 d-flex flex-column btn-directions"
                                @mouseover="highlightRoute({coordsIndex: step.getWaypoints()})"
                                @focus="highlightRoute({coordsIndex: step.getWaypoints()})"
                                @mouseout="unHighlightRoute()"
                                @blur="unHighlightRoute()"
                                @click="zoomToRoute({coordsIndex: step.getWaypoints()})"
                                @keydown.enter="zoomToRoute({coordsIndex: step.getWaypoints()})"
                            >
                                <div class="ms-0 d-flex flex-column pl-2 py-4 step">
                                    <span>{{ step.instruction }}</span>
                                    <div
                                        class="d-flex justify-content-between"
                                    >
                                        <RoutingDurationDisplay :duration="step.duration" />
                                        <RoutingDistanceDisplay :distance="step.distance" />
                                    </div>
                                </div>
                                <hr class="w-100 m-0">
                            </button>
                        </template>
                    </div>
                </template>

                <button
                    class="d-flex step pl-2 py-4 btn-directions"
                    @mouseover="highlightRoute({
                        coordsIndex: [
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() - 1,
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() + 1
                        ]
                    })"
                    @focus="highlightRoute({
                        coordsIndex: [
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() - 1,
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() + 1
                        ]
                    })"
                    @mouseout="unHighlightRoute()"
                    @blur="unHighlightRoute()"
                    @click="zoomToRoute({
                        coordsIndex: [
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() - 1,
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() + 1
                        ]
                    })"
                    @keydown.enter="zoomToRoute({
                        coordsIndex: [
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() - 1,
                            waypoints[waypoints.length - 1].getIndexDirectionsLineString() + 1
                        ]
                    })"
                >
                    <span>B</span>
                    <b class="ms-2">{{ waypoints[waypoints.length - 1].getDisplayName() }}</b>
                </button>

                <hr>

                <div v-if="directionsSettings.elevation && routingDirections">
                    <RoutingElevationProfile />
                    <hr>
                </div>


                <RoutingDownload />
            </div>
        </template>
        <div class="d-flex justify-content-between mt-2">
            <span
                class="pointer col-8"
                :title="$t(('common:modules.routing.resetSettings'))"
            >
                <LightButton
                    id="button-reset"
                    :class-array="['btn-light']"
                    :icon="'bi-trash fs-6'"
                    :interaction="() => reset()"
                    :text="$t('common:modules.routing.resetSettings')"
                />
            </span>
        </div>
    </div>
    <RoutingContextMenu />
</template>

<style lang="scss" scoped>
@import "~variables";

.test {
    background-color: yellow;
}
.btn-icon {
    background-color: $white;
    border: none;
}

.btn-dropdown {
    background-color: $white;
    border: none;
    width: 100%;
    justify-content: flex-start;
    padding: 5px 0;
}

.btn-directions {
    border: none;
    padding-left: 0px;
    margin-left: 0px;
    background-color: $white;
}

.btn-directions:focus-visible {
    outline: none;
    border-left: 2px solid rgb(255, 44, 0);
}

.btn-directions:active {
    border: none;
}

#routing-directions {
  min-width: 350px;
}
.helptext {
    max-width: calc(350px - 3rem);
}
.pointer {
  cursor: pointer;
}
.step {
    border-left: 2px solid transparent;
}
.step:hover {
    border-left: 2px solid rgb(255, 44, 0);
}
.opacity-05 {
    opacity: 0.5;
}
.routing-directions-preference-label {
    padding: 0 0 5px 0;
}
.none-pointer-events {
    pointer-events: none;
}

.form-control {
    width: 5.5rem;
}

.radius-unit {
    padding-left: 0.5rem;
    margin-top: 5px;
}
.avoidPoint {
    display: flex;
    flex-direction: row;
}
#button-reset{
    min-width: 100%;
}
.invalid-feedback {
    max-width: fit-content;
}
#draw-avoidPoint-settings {
  background-image: none;
}
</style>
