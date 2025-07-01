import state from "./stateTiltView.js";
import getters from "./gettersTiltView.js";
import mutations from "./mutationsTiltView.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
