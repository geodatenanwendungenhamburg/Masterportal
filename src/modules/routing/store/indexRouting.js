import mutations from "./mutationsRouting.js";
import actions from "./actionsRouting.js";
import getters from "./gettersRouting.js";
import state from "./stateRouting.js";

import Directions from "./directions/indexDirections.js";
import Isochrones from "./isochrones/indexIsochrones.js";
import TSR from "./tsr/indexTSR.js";

export default {
    namespaced: true,
    modules: {
        Directions,
        Isochrones,
        TSR
    },
    state,
    mutations,
    actions,
    getters
};
