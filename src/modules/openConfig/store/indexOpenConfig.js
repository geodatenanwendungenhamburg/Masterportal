import actions from "./actionsOpenConfig.js";
import mutations from "./mutationsOpenConfig.js";
import getters from "./gettersOpenConfig.js";
import state from "./stateOpenConfig.js";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
