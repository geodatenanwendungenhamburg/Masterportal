import getters from "./gettersSelectFeatures.js";
import mutations from "./mutationsSelectFeatures.js";
import actions from "./actionsSelectFeatures.js";
import state from "./stateSelectFeatures.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
