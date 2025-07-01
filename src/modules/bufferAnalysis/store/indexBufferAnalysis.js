import actions from "./actionsBufferAnalysis.js";
import mutations from "./mutationsBufferAnalysis.js";
import getters from "./gettersBufferAnalysis.js";
import state from "./stateBufferAnalysis.js";


export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
