import {createStore} from "vuex";

import getters from "./getters.js";
import mutations from "./mutations.js";
import state from "./state.js";
import actions from "./actions.js";

import Alerting from "@modules/alerting/store/indexAlerting.js";
import Controls from "@modules/controls/controls-store/indexControls.js";
import Maps from "@core/maps/store/indexMaps.js";
import Menu from "@modules/menu/menu-store/indexMenu.js";
import Modules from "@modules/modules-store/indexModules.js";

const store = createStore({
    state,
    getters,
    mutations,
    actions,
    modules: {
        Alerting,
        Controls,
        Maps,
        Menu,
        Modules
    }
});

export default store;
