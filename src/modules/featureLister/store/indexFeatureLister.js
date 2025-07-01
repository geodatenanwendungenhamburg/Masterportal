import actions from "./actionsFeatureLister.js";
import mutations from "./mutationsFeatureLister.js";
import getters from "./gettersFeatureLister.js";
import state from "./stateFeatureLister.js";


export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
