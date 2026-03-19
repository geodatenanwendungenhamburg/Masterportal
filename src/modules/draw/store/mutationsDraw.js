import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateDraw from "./stateDraw.js";

/**
 * The mutations for the draw module.
 * @module modules/draw/store/mutationsDraw
 */
export default {
    ...generateSimpleMutations(stateDraw),

    /**
     * Sets the circle options.
     * @param {Object} state store state.
     * @param {Object} options The options for the circle.
     * @param {Number} options.innerRadius The inner radius of the circle.
     * @param {Boolean} options.interactive The interactive of the circle.
     * @param {Number} options.outerRadius The outer radius of the circle.
     * @param {String} options.unit The unit of the circle.
     * @returns {void}
     */
    setCircleOptions (state, options) {
        state.circleOptions = {
            ...state.circleOptions,
            ...options
        };
    },

    /**
     * Sets the current layout options.
     * @param {Object} state store state.
     * @param {Object} options The options for the current layout.
     * @param {Array} options.fillColor The fill color of the layout.
     * @param {Number} options.fillTransparency The fill transparency of the layout.
     * @param {Array} options.strokeColor The stroke color of the layout.
     * @param {Number} options.strokeWidth The stroke width of the layout.
     * @returns {void}
     */
    setCurrentLayout (state, options) {
        state.currentLayout = {
            ...state.currentLayout,
            ...options
        };
    },

    /**
     * Sets the current layout outer circle options.
     * @param {Object} state store state.
     * @param {Object} options The options for the current layout outer circle.
     * @param {Array} options.fillColor The fill color of the outer circle.
     * @param {Number} options.fillTransparency The fill transparency of the outer circle.
     * @param {Array} options.strokeColor The stroke color of the outer circle.
     * @param {Number} options.strokeWidth The stroke width of the outer circle.
     * @returns {void}
     */
    setCurrentLayoutOuterCircle (state, options) {
        state.currentLayoutOuterCircle = {
            ...state.currentLayoutOuterCircle,
            ...options
        };
    },

    /**
     * Fill the draw type symbols with a symbolList from the config, if present.
     * @param {Object} state store state.
     * @param {String} id The ID of the draw type symbol to add.
     * @returns {void}
     */
    addDrawTypeSymbol (state, id) {
        if (!state.drawTypesSymbols.includes(id)) {
            state.drawTypesSymbols = [...state.drawTypesSymbols, id];
        }
    },

    /**
     * Updates whether buttons should be disabled.
     * @param {Object} state store state.
     * @param {Boolean} value The new value for `buttonsDisabled`.
     * @returns {void}
     */
    setButtonsDisabled (state, value) {
        state.buttonsDisabled = value;
    },

    /**
     * Increments the idCounter used for styleId and zIndex of drawn features.
     * @param {Object} state store state.
     * @param {Number} value the value to increment by - usually 1.
     */
    incrementIdCounter (state, value) {
        state.idCounter += value;
    },

    /**
     * Sets the length of the most recently drawn line, to be used in preparation for an export of drawings.
     * @param {Object} state store state.
     * @param {Number} value the line length.
     */
    setLineLength(state, value) {
        state.currentLayout.lineLength = value;
    }
};
