import mutations from "./mutationsTSR.js";
import actions from "./actionsTSR.js";
import getters from "./gettersTSR.js";
import state from "./stateTSR.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
