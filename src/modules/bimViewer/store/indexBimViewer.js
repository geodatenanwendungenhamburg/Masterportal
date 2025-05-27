import getters from "./gettersBimViewer";
import mutations from "./mutationsBimViewer";
import actions from "./actionsBimViewer";
import state from "./stateBimViewer";

// Module imports
import ToolSceneReset from "./ToolSceneReset";
import ToolMeasurements from "./ToolMeasurements";
import ToolFilter from "./ToolFilter";
import ToolSceneFit from "./ToolSceneFit";
import ToolObjectInfo from "./ToolObjectInfo";
import ToolSao from "./ToolSao";

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
    modules: {
        ToolSceneReset,
        ToolMeasurements,
        ToolFilter,
        ToolSceneFit,
        ToolObjectInfo,
        ToolSao
    }
};
