import state from "./stateAlerting.js";
import mutations from "./mutationsAlerting.js";
import getters from "./gettersAlerting.js";
import actions from "./actionsAlerting.js";

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
