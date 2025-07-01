import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import compareMapsState from "./stateCompareMaps.js";

/**
 * The getters for compareMaps.
 * @module modules/compareMaps/store/gettersCompareMaps
 */
export default {
    ...generateSimpleGetters(compareMapsState)
};
