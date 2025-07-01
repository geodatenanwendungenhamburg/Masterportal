import state from "./stateFullScreen.js";
import getters from "./gettersFullScreen.js";
import mutations from "./mutationsFullScreen.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
