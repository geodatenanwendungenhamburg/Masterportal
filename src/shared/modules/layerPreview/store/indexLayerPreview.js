import getters from "./gettersLayerPreview.js";
import mutations from "./mutationsLayerPreview.js";
import actions from "./actionsLayerPreview.js";
import state from "./stateLayerPreview.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
