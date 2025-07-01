import state from "./stateLayerTree.js";
import actions from "./actionsLayerTree.js";
import getters from "./gettersLayerTree.js";
import mutations from "./mutationsLayerTree.js";

export default {
    namespaced: true,
    state,
    actions,
    getters,
    mutations
};
