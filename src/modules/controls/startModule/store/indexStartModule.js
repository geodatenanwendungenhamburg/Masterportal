import actions from "./actionsStartModule.js";
import state from "./stateStartModule.js";
import getters from "./gettersStartModule.js";
import mutations from "./mutationsStartModule.js";

export default {
    namespaced: true,
    actions,
    state: {...state},
    getters,
    mutations
};
