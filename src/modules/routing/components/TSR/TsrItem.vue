<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import RoutingCoordinateInput from "../RoutingCoordinateInput.vue";
import RoutingSpeedProfileIcon from "../RoutingSpeedProfileIcon.vue";
import RoutingContextMenu from "../RoutingContextMenu.vue";
import * as constantsRouting from "../../store/constantsRouting";
import TsrUpload from "./TsrUpload.vue";
import TsrOutput from "./TsrOutput.vue";
import {Modal} from "bootstrap";

/**
 * TsrItem
 * @module modules/TsrItem
 * @vue-data {*} constantsRouting - The constants routing.
 * @vue-data {Boolean} csvHeaders - Shows if csvHeaders is on or off
 */
export default {
    name: "TsrItem",
    components: {
        IconButton,
        RoutingCoordinateInput,
        RoutingSpeedProfileIcon,
        RoutingContextMenu,
        TsrUpload,
        TsrOutput
    },
    data () {
        return {
            constantsRouting,
            csvHeaders: false
        };
    },
    computed: {
        ...mapGetters("Modules/Routing/TSR",
            ["isInputDisabled",
                "settings",
                "tsrRouteSource",
                "tsrWaypointsLayer",
                "tsrDirections",
                "getTSRSpeedProfiles",
                "waypoints"
            ]
        )
    },

    mounted () {
        this.appendModalToBody();

        if (this.waypoints[0].getCoordinates().length === 0) {
            this.isStartEndInput(0);
        }
    },
    async created () {
        this.initTSR();
    },
    beforeUnmount () {
        this.closeTSR();
        this.removeModalFromBody();
    },
    methods: {
        ...mapMutations("Modules/Routing/TSR", ["setTsrDirections"]),
        ...mapActions("Modules/Routing/TSR",
            ["removeWaypoint",
                "isStartEndInput",
                "addWaypoint",
                "addFeatToSource",
                "findTSR",
                "initTSR",
                "closeTSR"
            ]
        ),

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
        },
        /**
         * Resets the current settings, including waypoints.
         * @returns {void}
         */
        reset () {
            for (let i = this.waypoints.length - 1; i >= 0; i--) {
                this.removeWaypoint({index: this.waypoints[i].index});
            }
            this.tsrRouteSource?.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            this.setTsrDirections(null);
            this.isStartEndInput(0);
        },
        /**
         * Resets only tsr directions
         * @returns {void}
         */
        resetTsrDirections () {
            this.tsrRouteSource?.getFeatures().forEach(feature => feature.getGeometry().setCoordinates([]));
            // remove tsrDirections
            this.setTsrDirections(null);
            // update layer and style to remove waypoint index numbers from map
            this.tsrWaypointsLayer.changed();
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
            document.body.appendChild(this.$refs.uploadModal);
        },
        /**
         * Removes modal from body
         * @returns {void}
         */
        removeModalFromBody () {
            document.body.removeChild(this.$refs.uploadModal);
        }
    }
};
</script>

<template>
    <div
        id="routing-tsr"
    >
        <div v-if="!tsrDirections">
            <RoutingSpeedProfileIcon
                v-for="option in getTSRSpeedProfiles"
                :key="option"
                :interaction="() => changeSpeedProfile(option)"
                :class="['pointer mr-4 ', isInputDisabled ? 'opacity-05' : '']"
                :speed-profile-id="option"
                :fill-color="option === settings.speedProfile ? '#0077ff' : '#000000'"
                :tooltip="$t('common:modules.routing.speedprofiles.' + option)"
            />

            <hr>

            <div>
                <form
                    id="routing-tsr-coordinate-input-form"
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
                        @remove-waypoint="index === 0 ? [removeWaypoint({index: waypoint.index, reload: true}), isStartEndInput(0)]: removeWaypoint({index: waypoint.index, reload: true})"
                        @add-start-end="isStartEndInput(index === 0 ? 0 : 1)"
                        @search-result-selected="isStartEndInput(1)"
                    />
                    <div class="row mb-3 m-1">
                        <button
                            id="add-waypoint"
                            type="button"
                            class="btn btn-light justify-content-left text-start"
                            :title="$t('common:modules.routing.addWaypoint')"
                            @click="isStartEndInput(1); addWaypoint({index: waypoints.length -1}); waypoints[0].getCoordinates().length === 0 ? isStartEndInput(0) : null"
                            @keydown.enter="addWaypoint({index: waypoints.length -1})"
                        >
                            <i class="bi-plus-circle" />
                            {{ $t('common:modules.routing.addWaypoint') }}
                        </button>
                    </div>
                    <RoutingCoordinateInput
                        class="endpoint-input"
                        :count-waypoints="waypoints.length"
                        :waypoint="waypoints[waypoints.length - 1]"
                        @remove-waypoint="removeWaypoint({index: waypoints.length - 1, reload: true})"
                        @add-start-end="isStartEndInput(2)"
                        @search-result-selected="isStartEndInput(0); addFeatToSource(waypoints[waypoints.length -1])"
                    />
                </form>

                <div
                    class="d-flex justify-content-between"
                >
                    <div
                        id="button-up"
                        data-bs-toggle="modal"
                        data-bs-target="#uploadModal"
                        role="button"
                        tabindex="0"
                        @click="isStartEndInput(1)"
                        @keypress="isStartEndInput(1)"
                    >
                        {{ $t('common:modules.routing.tsr.upload.header') }}
                        <IconButton
                            class="d-inline-flex"
                            :aria="$t('common:modules.routing.tsr.upload.header')"
                            :class-array="['btn-light']"
                            :icon="'bi-upload fs-6'"
                            :interaction="() => isStartEndInput(1)"
                        />
                    </div>
                    <div>
                        <IconButton
                            :aria="$t('common:modules.routing.resetSettings')"
                            :class-array="['btn-light']"
                            :icon="'bi-trash fs-6'"
                            :interaction="() => reset()"
                        />
                    </div>
                </div>
            </div>

            <hr>

            <div class="col-12 d-grid gap-2">
                <button
                    class="btn btn-primary"
                    type="button"
                    @click="findTSR()"
                >
                    {{ $t('common:modules.routing.tsr.calculate') }}
                </button>
            </div>
            <hr>
        </div>

        <div
            v-else
            id="routing-tsr-directions"
        >
            <button
                type="button"
                class="btn btn-outline-dark"
                @click="resetTsrDirections()"
            >
                <i class="bi bi-arrow-left" />
                {{ $t('common:modules.routing.tsr.modifyWaypointsTSR') }}
            </button>
            <TsrOutput />
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
                            {{ $t('common:modules.routing.tsr.upload.header') }}
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
                            {{ $t('common:modules.routing.tsr.upload.description') }}
                        </div>
                        <div class="mt-2 mb-2 col-md-12">
                            {{ $t('common:modules.routing.tsr.structure') }}
                            <hr>
                            <div class="form-check form-switch d-flex justify-content-center">
                                <input
                                    id="csvHeaderSwitch"
                                    v-model="csvHeaders"
                                    class="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    aria-checked="csvHeaders"
                                >
                                <label
                                    class="form-check-label"
                                    for="csvHeaderSwitch"
                                >
                                    <b>{{ $t('common:modules.routing.tsr.upload.csvHeaders') }}</b>
                                </label>
                            </div>
                            <hr>
                            <TsrUpload
                                :csv-headers="csvHeaders"
                                @after-file-validation="afterFileValidation()"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <RoutingContextMenu />
</template>


<style lang="scss" scoped>
@import "~variables";

#button-up {
    cursor: pointer;
}

#csvHeaderSwitch {
    margin-right: 10px;
}

#button-help {
    margin-right: 10px;
}
</style>
