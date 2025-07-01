import actions from "./actionsControls.js";
import getters from "./gettersControls.js";
import mutations from "./mutationsControls.js";
import state from "./stateControls.js";

import BackForward from "../backForward/store/indexBackForward.js";
import Button3d from "../button3d/store/indexButton3d.js";
import Freeze from "../freeze/store/indexFreeze.js";
import FullScreen from "../fullScreen/store/indexFullScreen.js";
import Orientation from "../orientation/store/indexOrientation.js";
import Rotation from "../rotation/store/indexRotation.js";
import StartModule from "../startModule/store/indexStartModule.js";
import TiltView from "../tiltView/store/indexTiltView.js";
import TotalView from "../totalView/store/indexTotalView.js";
import Zoom from "../zoom/store/indexZoom.js";

/**
 * controls-Module is required to be able to nest controls
 * in the store as ["controls", controlName].
 * Also holds information on control components and allows
 * addons to register themselves via mutation.
 */
export default {
    namespaced: true,
    modules: {
        BackForward,
        Button3d,
        Freeze,
        FullScreen,
        Orientation,
        Rotation,
        StartModule,
        TiltView,
        TotalView,
        Zoom
    },
    actions,
    getters,
    mutations,
    state
};
