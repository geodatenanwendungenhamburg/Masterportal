import state from "./stateButton3d.js";
import getters from "./gettersButton3d.js";
import mutations from "./mutationsButton3d.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
