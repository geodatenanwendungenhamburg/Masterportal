import {RoutingWaypoint} from "../../js/classes/routing-waypoint";

import isochronesPointSource from "../../js/map/isochrones/point/isochronesPointSource";
import isochronesPointLayer from "../../js/map/isochrones/point/isochronesPointLayer";
import isochronesPointDrawInteraction from "../../js/map/isochrones/point/isochronesPointDraw";
import isochronesPointModifyInteraction from "../../js/map/isochrones/point/isochronesPointModify";
import isochronesPointSnapInteraction from "../../js/map/isochrones/point/isochronesPointSnap";

import isochronesAreaSource from "../../js/map/isochrones/area/isochronesAreaSource";
import isochronesAreaLayer from "../../js/map/isochrones/area/isochronesAreaLayer";

import stateRouting from "../stateRouting";

/**
 * State of routing isochrones
 * @module modules/routing/store/isochrones/state
 *
 * @property {Object} isochronesPointSource The source of the isochrones starting point.
 * @property {Object} isochronesPointLayer The layer of the isochrones starting point.
 * @property {Object} isochronesPointDrawInteraction The draw interaction of the isochrones starting point.
 * @property {Object} isochronesPointModifyInteraction The modify interaction of the isochrones starting point.
 * @property {Object} isochronesPointSnapInteraction The snap interaction of the isochrones starting point.
 * @property {Object} isochronesAreaSource The source of the isochrones areas.
 * @property {Object} isochronesAreaLayer The layerof the isochrones areas.
 * @property {Boolean} mapListenerAdded Determines whether or not map listener is added.
 * @property {Object} waypoint The starting point of the isochrones.
 * @property {Object} isochronesRestrictionsInputData The values of the HGV parameters sent to the ORS.
 * @property {Object} isochronesRestrictionIsValid Determines whether or not the HGV parameters are valid.
 * @property {Object} routingIsochrones The result of the isochrones calculation.
 * @property {Boolean} isLoadingIsochrones Determines whether or not isochrones are currently calculated.
 * @property {String[]} routingAvoidFeaturesOptions The selected avoid feature options.
 * @property {Object} settings The routing isochrones parameters.
*/
const state = {
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
    isochronesRestrictionIsValid: {
        length: true,
        width: true,
        height: true,
        weight: true,
        axleload: true
    },
    routingIsochrones: null,
    isLoadingIsochrones: false,
    routingAvoidFeaturesOptions: [],
    settings: stateRouting.isochronesSettings
};

export default state;

