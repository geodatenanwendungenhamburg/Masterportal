import getters from "./gettersLayerSwiper.js";
import mutations from "./mutationsLayerSwiper.js";
import actions from "./actionsLayerSwiper.js";
import state from "./stateLayerSwiper.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
