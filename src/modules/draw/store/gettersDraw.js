import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateDraw from "./stateDraw.js";

/**
 * The getters for the draw module.
 * @module modules/draw/store/gettersDraw
 */
export default {
    ...generateSimpleGetters(stateDraw),

    /**
     * Gets the preselected download format from the "download" config object.
     * @param {Object} state - The draw store state.
     * @returns {String|null} The preselected download format.
     */
    preSelectedDownloadFormat: (state) => state.download?.preSelectedFormat ?? null
};
