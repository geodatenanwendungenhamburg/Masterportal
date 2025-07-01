import getters from "./gettersBackForward.js";
import mutations from "./mutationsBackForward.js";
import state from "./stateBackForward.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
