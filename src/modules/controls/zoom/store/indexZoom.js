import state from "./stateZoom.js";
import getters from "./gettersZoom.js";
import mutations from "./mutationsZoom.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
