import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import tsrState from "./stateTSR.js";
import * as constantsRouting from "../constantsRouting.js";

/**
 * The getters for the routing tsr.
 * @module modules/routing/store/tsr/getters
 */
const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     * @param {object} state state to generate getters for
     * @returns {object.<string, function>} object of getters
     */
    ...generateSimpleGetters(tsrState),
    /**
     * Gets all valid coordinates from the given waypoints.
     * @param {Object} params with waypoints
     * @param {RoutingWaypoint[]} [params.waypoints] waypoints from tsrState
     * @returns {Array<{Number, Number}>} coordinate array
     */
    tsrCoordinates ({waypoints}) {
        return waypoints
            .map(waypoint => waypoint.getCoordinates())
            .filter(coords => coords.length === 2);
    },

    /**
     * Checks if input is disabled.
     * @param {Object} params from stateDirections
     * @param {Boolean} [params.isLoadingDirections] if the directions are currently loaded
     * @returns {Boolean} true if input is disabled
     */
    isInputDisabled ({isLoadingDirections}) {
        return isLoadingDirections;
    },

    /**
     * Returns available speed profiles for TSR
     * @returns {String[]} displayed routing profiles
     */
    getTSRSpeedProfiles () {
        return constantsRouting.speedProfileOptions.filter(profile => !["WHEELCHAIR"].includes(profile));
    }
};

export default getters;
