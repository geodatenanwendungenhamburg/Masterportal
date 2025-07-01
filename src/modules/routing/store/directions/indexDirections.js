import mutations from "./mutationsDirections.js";
import actions from "./actionsDirections.js";
import getters from "./gettersDirections.js";
import state from "./stateDirections.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
