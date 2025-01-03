/**
 * Contains global actions of the search bar.
 * @module modules/searchBar/store/actions/actionsSearchBar
 */
import actionsSearchBarResultList from "./actionsSearchBarResultList";
import actionsSearchBarSearchInterfaces from "./actionsSearchBarSearchInterfaces";
import actionsSearchBarSearchResult from "./actionsSearchBarSearchResult";
import SearchInterface from "../../searchInterfaces/searchInterface";

export default {
    ...actionsSearchBarResultList,
    ...actionsSearchBarSearchInterfaces,
    ...actionsSearchBarSearchResult,

    /**
     * Overwrite default values in search interface.
     * @param {Object} param.state the state
     * @returns {void}
     */
    overwriteDefaultValues: ({state}) => {
        SearchInterface.prototype.timeout = state.timeout;
    },
    /**
     * Handles the switch from the single result view to the search overview and updates the menu navigation values.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} side the menu side of the search
     * @returns {void}
     */
    startLayerSelectionSearch: ({dispatch, commit}, side) => {
        const typeLayerSelection = {type: "layerSelection", props: {name: "common:modules.layerSelection.addSubject"}},
            typeLayerSelectionSearchResults = {type: "layerSelection", props: {name: "common:modules.searchBar.searchResultList"}};

        commit("setShowAllResults", true);
        dispatch("Menu/clickedMenuElement", {
            name: "common:modules.searchBar.searchResultList",
            side: side,
            type: "searchBar"
        }, {root: true});
        commit("Menu/setCurrentComponent", {type: "layerSelection", side: side, props: []}, {root: true});
        commit("Menu/setCurrentComponentPropsName", {side: side, name: "common:modules.searchBar.searchResults"}, {root: true});
        commit("Menu/setNavigationHistoryBySide", {side: side, newHistory: [{type: "root", props: []}, typeLayerSelection, typeLayerSelectionSearchResults]}, {root: true});
    },
    /**
     * Checks for addlayer search configuration (instance and topic)
     * @param {Object} param.commit the commit
     * @param {Object} param.rootGetters the rootGetters
     * @param {Object} param.rootState the rootState
     * @returns {void}
     */
    checkLayerSelectionSearchConfig: ({commit, rootGetters, rootState}) => {
        const searchBar = rootState.portalConfig?.tree?.addLayerButton?.searchBar;

        if (rootGetters.showLayerAddButton === true && searchBar && searchBar?.active !== undefined) {
            if (searchBar.searchInterfaceInstances) {
                const searchInterfaceInstances = [];

                searchBar.searchInterfaceInstances.forEach(searchInterfaceInstance => {
                    if (searchInterfaceInstance.searchCategory) {
                        searchInterfaceInstances.push(searchInterfaceInstance);
                    }
                });
                commit("setShowAllResultsSearchInterfaceInstances", searchInterfaceInstances);
            }
            /**
             * @deprecated in the next major-release!
             * showAllResultsSearchInterfaceInstance
             * showAllResultsSearchCategory
             */
            else if (searchBar.searchInterfaceInstanceId || searchBar.searchCategory) {
                if (searchBar.searchCategory && searchBar?.searchInterfaceInstanceId) {
                    const instance = {
                        "id": searchBar.searchInterfaceInstanceId,
                        "searchCategory": searchBar.searchCategory
                    };

                    commit("setShowAllResultsSearchInterfaceInstances", [instance]);
                }
                else {
                    console.warn("Please check the searchBar configuration at tree.addLayerButton");
                }
            }
            if (typeof searchBar.active === "boolean") {
                commit("setAddLayerButtonSearchActive", searchBar.active);
            }
        }
        else {
            commit("setAddLayerButtonSearchActive", false);
        }
    }
};
