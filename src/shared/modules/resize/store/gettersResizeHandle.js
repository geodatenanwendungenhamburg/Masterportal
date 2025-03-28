import {generateSimpleGetters} from "../../../js/utils/generators";
import stateResizeHandle from "./stateResizeHandle";
const getters = {
    /**
     * Creates from every state-key a getter.
     * * @param {Object} state The local Vuex state.
     * @returns {Object} An object with getters corresponding to each state property.
     */
    ...generateSimpleGetters(stateResizeHandle)
};

export default getters;
