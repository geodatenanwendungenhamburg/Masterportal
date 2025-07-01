import getters from "./gettersGraphicalSelect.js";
import mutations from "./mutationsGraphicalSelect.js";
import actions from "./actionsGraphicalSelect.js";
import state from "./stateGraphicalSelect.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
