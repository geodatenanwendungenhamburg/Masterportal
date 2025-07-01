import actions from "./actionsAbout.js";
import mutations from "./mutationsAbout.js";
import getters from "./gettersAbout.js";
import state from "./stateAbout.js";


export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};
