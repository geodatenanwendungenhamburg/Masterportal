import actions from "./actionsMaps.js";
import getters from "./gettersMaps.js";
import mutations from "./mutationsMaps.js";
import state from "./stateMaps.js";

export default {
    namespaced: true,
    actions,
    getters,
    mutations,
    state: {...state}
};
