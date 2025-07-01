import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateSearchBar from "./stateSearchBar.js";

/**
 * The getters for the searchBar.
 * @module modules/searchBar/store/getterssearchBar
 */
export default {
    ...generateSimpleGetters(stateSearchBar),

    /**
     * Determines if any search interface instance is currently in the "running" state.
     *
     * @param {Object} state - The Vuex module state.
     * @param {Array<Object>} state.searchInterfaceInstances - Array of search interface instance objects.
     * @param {string} state.searchInterfaceInstances[].searchState - The current state of the search (e.g., "running", "finished").
     * @returns {boolean} `true` if at least one instance is in the "running" state; otherwise, `false`.
     */
    searchIsLoading: state => {
        return state.searchInterfaceInstances?.some(i => i.searchState === "running") || false;
    }
};

