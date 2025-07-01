import state from "./stateModeler3D.js";
import actions from "./actionsModeler3D.js";
import getters from "./gettersModeler3D.js";
import mutations from "./mutationsModeler3D.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    actions,
    getters
};
