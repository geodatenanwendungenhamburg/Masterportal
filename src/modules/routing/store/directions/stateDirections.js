import directionsWaypointsSource from "../../js/map/directions/waypoints/directionsWaypointsSource.js";
import directionsWaypointsLayer from "../../js/map/directions/waypoints/directionsWaypointsLayer.js";
import directionsWaypointsModifyInteraction from "../../js/map/directions/waypoints/directionsWaypointsModify.js";
import directionsWaypointsSnapInteraction from "../../js/map/directions/waypoints/directionsWaypointsSnap.js";
import directionsWaypointsDrawInteraction from "../../js/map/directions/waypoints/directionsWaypointsDraw.js";

import directionsRouteSource from "../../js/map/directions/route/directionsRouteSource.js";
import directionsRouteLayer from "../../js/map/directions/route/directionsRouteLayer.js";
import directionsRouteModifyInteraction from "../../js/map/directions/route/directionsRouteModify.js";
import directionsRouteSnapInteraction from "../../js/map/directions/route/directionsRouteSnap.js";

import directionsAvoidSource from "../../js/map/directions/avoid/directionsAvoidSource.js";
import directionsAvoidLayer from "../../js/map/directions/avoid/directionsAvoidLayer.js";
import directionsAvoidModifyInteraction from "../../js/map/directions/avoid/directionsAvoidModify.js";
import directionsAvoidSnapInteraction from "../../js/map/directions/avoid/directionsAvoidSnap.js";
import directionsAvoidDrawInteraction from "../../js/map/directions/avoid/directionsAvoidDraw.js";
import directionsAvoidSelectInteraction from "../../js/map/directions/avoid/directionsAvoidSelect.js";

import directionsAvoidPointSource from "../../js/map/directions/avoid/directionsAvoidPointSource.js";
import directionsAvoidPointLayer from "../../js/map/directions/avoid/directionsAvoidPointLayer.js";

import directionsAvoidPointDrawInteraction from "../../js/map/directions/avoid/directionsAvoidPointDraw.js";
import directionsAvoidPointTranslateInteraction from "../../js/map/directions/avoid/directionsAvoidPointTranslate.js";
import directionsAvoidPointSelectInteraction from "../../js/map/directions/avoid/directionsAvoidPointSelect.js";


import directionsElevationSource from "../../js/map/directions/elevation/directionsElevationSource.js";
import directionsElevationLayer from "../../js/map/directions/elevation/directionsElevationLayer.js";

import stateRouting from "../stateRouting.js";

export default {
    // Map State
    directionsWaypointsSource,
    directionsWaypointsLayer,

    directionsRouteSource,
    directionsRouteLayer,

    directionsAvoidSource,
    directionsAvoidLayer,

    directionsAvoidPointSource,
    directionsAvoidPointLayer,

    directionsElevationSource,
    directionsElevationLayer,

    // Draw Parameter
    directionsWaypointsModifyInteraction,
    directionsWaypointsSnapInteraction,
    directionsWaypointsDrawInteraction,

    directionsRouteModifyInteraction,
    directionsRouteSnapInteraction,

    directionsAvoidModifyInteraction,
    directionsAvoidSnapInteraction,
    directionsAvoidDrawInteraction,
    directionsAvoidSelectInteraction,

    directionsAvoidPointDrawInteraction,
    directionsAvoidPointTranslateInteraction,
    directionsAvoidPointSelectInteraction,

    // Directions Parameter
    waypoints: [],
    isAwaitingRouteModifyEnd: false,
    routingAvoidFeaturesOptions: [],
    routingRestrictionsInputData: {
        length: 10.0,
        width: 2.4,
        height: 2.8,
        weight: 18,
        axleload: 6,
        hazmat: false
    },
    // addStartEndPoint defines whether a waypoint,
    // startpoint or endpoint is to be added.
    // -1: default, no input field selected
    // >= 0: index of waypoint with input field selected
    addStartEndPoint: -1,
    keepRoutes: true,
    // Routing Directions Result
    routingDirections: null,
    mapListenerAdded: false,
    isLoadingDirections: false,
    mapInteractionMode: "WAYPOINTS",
    settings: stateRouting.directionsSettings
};
