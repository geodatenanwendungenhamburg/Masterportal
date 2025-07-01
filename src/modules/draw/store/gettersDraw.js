import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateDraw from "./stateDraw.js";

/**
 * The getters for the draw module.
 * @module modules/draw/store/gettersDraw
 */
export default {
    ...generateSimpleGetters(stateDraw)
};
