import state from "./stateCopyrightConstraints.js";
import getters from "./gettersCopyrightConstraints.js";
import mutations from "./mutationsCopyrightConstraints.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
