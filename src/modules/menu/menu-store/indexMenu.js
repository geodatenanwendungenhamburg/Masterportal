import actions from "./actionsMenu.js";
import getters from "./gettersMenu.js";
import mutations from "./mutationsMenu.js";
import state from "./stateMenu.js";

export default {
    namespaced: true,
    actions,
    getters,
    mutations,
    state: {...state}
};
