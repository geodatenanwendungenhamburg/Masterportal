import getters from "./gettersSearchBar.js";
import mutations from "./mutationsSearchBar.js";
import actions from "./actions/actionsSearchBar.js";
import state from "./stateSearchBar.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
