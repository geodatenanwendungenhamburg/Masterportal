import getters from "./gettersFilter.js";
import mutations from "./mutationsFilter.js";
import actions from "./actionsFilter.js";
import state from "./stateFilter.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
