import state from "./stateGetFeatureInfo.js";
import getters from "./gettersGetFeatureInfo.js";
import mutations from "./mutationsGetFeatureInfo.js";
import actions from "./actionsGetFeatureInfo.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations,
    actions
};
