import getters from "./gettersLayerSlider.js";
import mutations from "./mutationsLayerSlider.js";
import actions from "./actionsLayerSlider.js";
import state from "./stateLayerSlider.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
