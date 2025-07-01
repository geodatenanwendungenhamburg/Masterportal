import getters from "./gettersResizeHandle.js";
import mutations from "./mutationsResizeHandle.js";
import state from "./stateResizeHandle.js";
export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
