import state from "./stateShadow.js";
import getters from "./gettersShadow.js";
import mutations from "./mutationsShadow.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
