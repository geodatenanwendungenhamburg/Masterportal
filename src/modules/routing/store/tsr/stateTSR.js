import tsrWaypointsSource from "../../js/map/tsr/waypoints/tsrWaypointsSource.js";
import tsrWaypointsLayer from "../../js/map/tsr/waypoints/tsrWaypointsLayer.js";
import tsrWaypointsModifyInteraction from "../../js/map/tsr/waypoints/tsrWaypointsModify.js";
import tsrWaypointsSnapInteraction from "../../js/map/tsr/waypoints/tsrWaypointsSnap.js";
import tsrWaypointsDrawInteraction from "../../js/map/tsr/waypoints/tsrWaypointsDraw.js";

import tsrRouteSource from "../../js/map/tsr/route/tsrRouteSource.js";
import tsrRouteLayer from "../../js/map/tsr/route/tsrRouteLayer.js";

import tsrElevationSource from "../../js/map/tsr/elevation/tsrElevationSource.js";
import tsrElevationLayer from "../../js/map/tsr/elevation/tsrElevationLayer.js";

import stateRouting from "../stateRouting.js";

/**
 * State of tsr
 * @module modules/routing/store/tsr/state
 *
 * @property {Object} tsrWaypointsSource The source of the tsr waypoints.
 * @property {Object} tsrWaypointsLayer The layer of the tsr waypoints.
 * @property {Object} tsrRouteSource The source of the tsr route.
 * @property {Object} tsrRouteLayer The layer of the tsr route.
 * @property {Object} tsrElevationSource The source of the tsr elevation hover point.
 * @property {Object} tsrElevationLayer The layer of the tsr elevation hover pont.
 * @property {Object} tsrWaypointsModifyInteraction The modify interaction of the tsr waypoints.
 * @property {Object} tsrWaypointsSnapInteraction The snap interaction of the tsr waypoints.
 * @property {Object} tsrWaypointsDrawInteraction The draw interaction of the tsr waypoints.
 * @property {Object[]} waypoints The tsr waypoints.
 * @property {Object} addStartEndPoint Defines whether a waypoint, startpoint or endpoint is to be added -> -1: default, no input field selected; >= 0: index of waypoint with input field selected
 * @property {Object[]} tsrDirections The result of the tsr calculation.
 * @property {Boolean} mapListenerAdded Determines whether or not map listener is added.
 * @property {Boolean} isLoadingDirections Determines whether or not tsr directions are currently calculated.
 * @property {String} mapInteractionMode The currently active map interaction mode.
 * @property {Object} settings The routing tsr directions parameters.
*/
const state = {
    // Map State
    tsrWaypointsSource,
    tsrWaypointsLayer,

    tsrRouteSource,
    tsrRouteLayer,

    tsrElevationSource,
    tsrElevationLayer,

    // Draw Parameters
    tsrWaypointsModifyInteraction,
    tsrWaypointsSnapInteraction,
    tsrWaypointsDrawInteraction,

    // tsr Parameters
    waypoints: [],
    addStartEndPoint: 1,
    // Routing tsr Result
    tsrDirections: null,
    tsrDistance: "",
    tsrDuration: "",
    mapListenerAdded: false,
    isLoadingDirections: false,
    mapInteractionMode: "WAYPOINTS",
    settings: stateRouting.tsrSettings
};

export default state;
