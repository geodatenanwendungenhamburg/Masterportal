import getters from "./gettersAddonNamePascalCase.js";
import state from "./stateAddonNamePascalCase.js";
import actions from "./actionsAddonNamePascalCase.js";
import mutations from "./mutationsAddonNamePascalCase.js";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

