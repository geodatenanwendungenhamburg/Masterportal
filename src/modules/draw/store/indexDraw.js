import actions from "./actionsDraw.js";
import mutations from "./mutationsDraw.js";
import getters from "./gettersDraw.js";
import state from "./stateDraw.js";


export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
