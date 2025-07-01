import actions from "./actionsLayerClusterToggler.js";
import state from "./stateLayerClusterToggler.js";
import getters from "./gettersLayerClusterToggler.js";
import mutations from "./mutationsLayerClusterToggler.js";

export default {
    namespaced: true,
    state: {...state},
    actions,
    mutations,
    getters
};
