import getters from "./gettersResizeHandle";
import mutations from "./mutationsResizeHandle";
import state from "./stateResizeHandle";
export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
