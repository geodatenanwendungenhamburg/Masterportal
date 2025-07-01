import actions from "./actionsPrint.js";
import mutations from "./mutationsPrint.js";
import getters from "./gettersPrint.js";
import state from "./statePrint.js";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
