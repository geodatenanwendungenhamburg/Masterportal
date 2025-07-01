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

export default {
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
    // addStartEndPoint defines whether a waypoint,
    // startpoint or endpoint is to be added.
    // 0 - startpoint
    // 1 - waypoint
    // 2 - endpoint
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
