import getters from "./gettersCoordToolkit.js";
import mutations from "./mutationsCoordToolkit.js";
import actions from "./actionsCoordToolkit.js";
import state from "./stateCoordToolkit.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
