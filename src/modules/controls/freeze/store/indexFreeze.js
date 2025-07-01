import state from "./stateFreeze.js";
import getters from "./gettersFreeze.js";
import mutations from "./mutationsFreeze.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
