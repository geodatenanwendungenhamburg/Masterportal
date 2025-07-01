import actions from "./actionsLayerInformation.js";
import mutations from "./mutationsLayerInformation.js";
import getters from "./gettersLayerInformation.js";
import state from "./stateLayerInformation.js";


export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};
