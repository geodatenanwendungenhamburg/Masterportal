
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import filterState from "./stateFilter.js";

const getters = {
    ...generateSimpleGetters(filterState),

    /**
     * Returns the current state of the filter
     * @param {Object} state state of this tool
     * @param {Object} fileSpecs The url to dwonloadfile and name
     * @returns {void}
     */
    urlParams: state => {
        return state.urlParams;
    }
};

export default getters;
