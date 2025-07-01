import actions from "./actionsScaleSwitcher.js";
import mutations from "./mutationsScaleSwitcher.js";
import getters from "./gettersScaleSwitcher.js";
import state from "./stateScaleSwitcher.js";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
