import getters from "./gettersExportItem";
import mutations from "./mutationsExportItem";
import actions from "./actionsExportItem";
import state from "./stateExportItem";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters,
    actions
};
