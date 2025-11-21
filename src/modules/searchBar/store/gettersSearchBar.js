import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateSearchBar from "./stateSearchBar.js";

/**
 * The getters for the searchBar.
 * @module modules/searchBar/store/getterssearchBar
 */
export default {
    ...generateSimpleGetters(stateSearchBar)
};

