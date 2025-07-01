import state from "./stateWfst.js";
import actions from "./actionsWfst.js";
import getters from "./gettersWfst.js";
import mutations from "./mutationsWfst.js";

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
