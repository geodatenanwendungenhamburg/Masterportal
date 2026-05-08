import actions from "./actionsScaleSwitcherTutorial.js";
import mutations from "./mutationsScaleSwitcherTutorial.js";
import getters from "./gettersScaleSwitcherTutorial.js";
import state from "./stateScaleSwitcherTutorial.js";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
