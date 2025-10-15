import directionsWaypointsSource from "../../js/map/directions/waypoints/directionsWaypointsSource";
import directionsWaypointsLayer from "../../js/map/directions/waypoints/directionsWaypointsLayer";
import directionsWaypointsModifyInteraction from "../../js/map/directions/waypoints/directionsWaypointsModify";
import directionsWaypointsSnapInteraction from "../../js/map/directions/waypoints/directionsWaypointsSnap";
import directionsWaypointsDrawInteraction from "../../js/map/directions/waypoints/directionsWaypointsDraw";

import directionsRouteSource from "../../js/map/directions/route/directionsRouteSource";
import directionsRouteLayer from "../../js/map/directions/route/directionsRouteLayer";
import directionsRouteModifyInteraction from "../../js/map/directions/route/directionsRouteModify";
import directionsRouteSnapInteraction from "../../js/map/directions/route/directionsRouteSnap";

import directionsAvoidSource from "../../js/map/directions/avoid/directionsAvoidSource";
import directionsAvoidLayer from "../../js/map/directions/avoid/directionsAvoidLayer";
import directionsAvoidModifyInteraction from "../../js/map/directions/avoid/directionsAvoidModify";
import directionsAvoidSnapInteraction from "../../js/map/directions/avoid/directionsAvoidSnap";
import directionsAvoidDrawInteraction from "../../js/map/directions/avoid/directionsAvoidDraw";
import directionsAvoidSelectInteraction from "../../js/map/directions/avoid/directionsAvoidSelect";

import directionsAvoidPointSource from "../../js/map/directions/avoid/directionsAvoidPointSource";
import directionsAvoidPointLayer from "../../js/map/directions/avoid/directionsAvoidPointLayer";

import directionsAvoidPointDrawInteraction from "../../js/map/directions/avoid/directionsAvoidPointDraw";
import directionsAvoidPointTranslateInteraction from "../../js/map/directions/avoid/directionsAvoidPointTranslate";
import directionsAvoidPointSelectInteraction from "../../js/map/directions/avoid/directionsAvoidPointSelect";


import directionsElevationSource from "../../js/map/directions/elevation/directionsElevationSource";
import directionsElevationLayer from "../../js/map/directions/elevation/directionsElevationLayer";

import stateRouting from "../stateRouting";

/**
 * State of routing directions
 * @module modules/routing/store/directions/state
 *
 * @property {Object} directionsWaypointsSource The source of the directions waypoints.
 * @property {Object} directionsWaypointsLayer The layer of the directions waypoints.
 * @property {Object} directionsRouteSource The source of the directions route.
 * @property {Object} directionsRouteLayer The layer of the directions route.
 * @property {Object} directionsAvoidSource The source of the directions avoid polygons.
 * @property {Object} directionsAvoidLayer The layer of the directions avoid polygons.
 * @property {Object} directionsAvoidPointSource The source of the directions avoid points.
 * @property {Object} directionsAvoidPointLayer The layer of the directions avoid points.
 * @property {Object} directionsElevationSource The source of the directions elevation hover point.
 * @property {Object} directionsElevationLayer The layer of the directions elevation hover pont.
 * @property {Object} directionsWaypointsModifyInteraction The modify interaction of the directions waypoints.
 * @property {Object} directionsWaypointsSnapInteraction The snap interaction of the directions waypoints.
 * @property {Object} directionsWaypointsDrawInteraction The draw interaction of the directions waypoints.
 * @property {Object} directionsRouteModifyInteraction The modify interaction of the directions route.
 * @property {Object} directionsRouteSnapInteraction The snap interaction of the directions route.
 * @property {Object} directionsAvoidModifyInteraction The modify interaction of the directions avoid polygons.
 * @property {Object} directionsAvoidSnapInteraction The snap interaction of the directions avoid polygons.
 * @property {Object} directionsAvoidDrawInteraction The draw interaction of the directions avoid polygons.
 * @property {Object} directionsAvoidSelectInteraction The select interaction of the directions avoid polygons.
 * @property {Object} directionsAvoidPointDrawInteraction The draw interaction of the directions avoid points.
 * @property {Object} directionsAvoidPointTranslateInteraction The translate interaction of the directions avoid points.
 * @property {Object} directionsAvoidPointSelectInteraction The select interaction of the directions avoid points.
 * @property {Object[]} waypoints The directions waypoints.
 * @property {Boolean} isAwaitingRouteModifyEnd Determines whether or not route modify interaction has been finished.
 * @property {String[]} routingAvoidFeaturesOptions The selected avoid feature options.
 * @property {Object} routingRestrictionsInputData The values of the HGV parameters sent to the ORS.
 * @property {Object} routingRestrictionIsValid Determines whether or not the HGV parameters are valid.
 * @property {Object} addStartEndPoint Defines whether a waypoint, startpoint or endpoint is to be added -> -1: default, no input field selected; >= 0: index of waypoint with input field selected
 * @property {Boolean} keepRoutes Determines whether or not to keep route after leaving directions menu.
 * @property {Object[]} routingDirections The result of the directions calculation.
 * @property {Boolean} mapListenerAdded Determines whether or not map listener is added.
 * @property {Boolean} isLoadingDirections Determines whether or not directions are currently calculated.
 * @property {String} mapInteractionMode The currently active map interaction mode.
 * @property {Object} settings The routing directions parameters.
*/
const state = {
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
    routingRestrictionIsValid: {
        length: true,
        width: true,
        height: true,
        weight: true,
        axleload: true
    },
    addStartEndPoint: -1,
    keepRoutes: true,
    routingDirections: null,
    mapListenerAdded: false,
    isLoadingDirections: false,
    mapInteractionMode: "WAYPOINTS",
    settings: stateRouting.directionsSettings
};

export default state;

