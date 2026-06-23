import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateDraw from "./stateDraw.js";

/**
 * The getters for the shared draw module.
 * @module shared/modules/draw/store/gettersDraw
 */
export default {
    ...generateSimpleGetters(stateDraw)
};
