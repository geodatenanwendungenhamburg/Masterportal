import state from "./stateTotalView.js";
import getters from "./gettersTotalView.js";
import mutations from "./mutationsTotalView.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    mutations
};
