import getters from "./gettersCompareMaps.js";
import mutations from "./mutationsCompareMaps.js";
import actions from "./actionsCompareMaps.js";
import state from "./stateCompareMaps.js";

export default {
    namespaced: true,
    state: state,
    mutations,
    actions,
    getters
};
