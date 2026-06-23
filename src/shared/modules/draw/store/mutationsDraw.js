import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateDraw from "./stateDraw.js";

/**
 * The mutations for the shared draw module.
 * @module shared/modules/draw/store/mutationsDraw
 */
export default {
    ...generateSimpleMutations(stateDraw),

    /**
     * Sets whether the draw type buttons are disabled.
     * @param {Object} state store state.
     * @param {Boolean} value The new value.
     * @returns {void}
     */
    setButtonsDisabled (state, value) {
        state.buttonsDisabled = value;
    }
};
