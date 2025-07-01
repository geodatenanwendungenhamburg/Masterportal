import {RoutingWaypoint} from "../../js/classes/routing-waypoint.js";

import isochronesPointSource from "../../js/map/isochrones/point/isochronesPointSource.js";
import isochronesPointLayer from "../../js/map/isochrones/point/isochronesPointLayer.js";
import isochronesPointDrawInteraction from "../../js/map/isochrones/point/isochronesPointDraw.js";
import isochronesPointModifyInteraction from "../../js/map/isochrones/point/isochronesPointModify.js";
import isochronesPointSnapInteraction from "../../js/map/isochrones/point/isochronesPointSnap.js";

import isochronesAreaSource from "../../js/map/isochrones/area/isochronesAreaSource.js";
import isochronesAreaLayer from "../../js/map/isochrones/area/isochronesAreaLayer.js";

import stateRouting from "../stateRouting.js";

export default {
    isochronesPointSource,
    isochronesPointLayer,
    isochronesPointDrawInteraction,
    isochronesPointModifyInteraction,
    isochronesPointSnapInteraction,
    isochronesAreaSource,
    isochronesAreaLayer,
    mapListenerAdded: false,
    waypoint: new RoutingWaypoint({
        index: 0,
        source: isochronesPointSource
    }),
    isochronesRestrictionsInputData: {
        length: 10.0,
        width: 2.4,
        height: 2.8,
        weight: 18,
        axleload: 6,
        hazmat: false
    },
    // Routing Isochrones Result
    routingIsochrones: null,
    isLoadingIsochrones: false,
    routingAvoidFeaturesOptions: [],

    settings: stateRouting.isochronesSettings
};
