import store from "@appstore/index.js";
import processUrlParams from "@shared/js/utils/processUrlParams.js";

const searchBarUrlParams = {
        QUERY: setQueryToSearchInput
    },
    legacySearchBarUrlParams = {
        "SEARCH/QUERY": setQueryToSearchInput
    };

/**
 * Process the searchBar url params.
 * @returns {void}
 */
function processSearchBarUrlParams () {
    processUrlParams(searchBarUrlParams, legacySearchBarUrlParams);
}

/**
 * Sets the query to searchInput in the searchBar.
 * @param {Object} params The found params.
 * @returns {void}
 */
function setQueryToSearchInput (params) {
    const value = params.QUERY ? params.QUERY : params["SEARCH/QUERY"],
        normalizedQuery = value?.toLowerCase().trim();

    store.commit("Modules/SearchBar/setSearchInput", value);
    store.dispatch("Modules/SearchBar/startSearch", value);

    store.watch((state, getters) => getters["Modules/SearchBar/searchResults"], results => {
        if (results) {
            results.forEach(result => {
                const coordinates = result?.events?.onClick?.zoomToResult?.coordinates,
                    resultName = result?.name?.toLowerCase().trim(),
                    isElastic = result?.searchInterfaceId?.includes("elastic");

                if (coordinates && resultName === normalizedQuery && isElastic) {
                    const numberCoordinates = coordinates.map(coordinate => parseFloat(coordinate, 10));

                    if (store.getters.styleListLoaded) {
                        store.dispatch("Maps/zoomToCoordinates", {center: numberCoordinates, zoom: store.getters["Modules/SearchBar/zoomLevel"]});
                        store.dispatch("Maps/placingPointMarker", numberCoordinates);
                    }
                    else {
                        store.watch((state, getters) => getters.styleListLoaded, val => {
                            if (val) {
                                store.dispatch("Maps/zoomToCoordinates", {center: numberCoordinates, zoom: store.getters["Modules/SearchBar/zoomLevel"]});
                                store.dispatch("Maps/placingPointMarker", numberCoordinates);
                            }
                        });
                    }
                }
            });
        }
    }, {deep: true});
}

export default {
    processSearchBarUrlParams,
    setQueryToSearchInput
};
