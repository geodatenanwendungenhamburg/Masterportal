import actions from "./actionsRotation.js";
import state from "./stateRotation.js";
import getters from "./gettersRotation.js";
import mutations from "./mutationsRotation.js";
export default {
    namespaced: true,
    state: {...state},
    actions,
    getters,
    mutations
};
