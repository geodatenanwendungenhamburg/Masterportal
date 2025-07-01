import state from "./stateFileImport.js";
import actions from "./actionsFileImport.js";
import getters from "./gettersFileImport.js";
import mutations from "./mutationsFileImport.js";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
