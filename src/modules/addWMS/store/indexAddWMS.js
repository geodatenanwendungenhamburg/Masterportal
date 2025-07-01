import getters from "./gettersAddWMS.js";
import mutations from "./mutationsAddWMS.js";
import state from "./stateAddWMS.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
