import {generateSimpleGetters} from "../../../shared/js/utils/generators";
import shareViewState from "./stateShareView";
import stateSearchBar from "../../searchBar/store/stateSearchBar";
import layerSelectionState from "../../layerSelection/store/stateLayerSelection";

/**
 * Checks if the attributes can be converted to a string. if not, an error message is displayed and the attributes are removed from the params.
 * @param {Object} menu The menu params.
 * @returns {void}
 */
function areAttributesValid (menu) {
    try {
        JSON.stringify(menu.attributes);
    }
    catch (error) {
        delete menu.attributes;
        console.error(`Parsing the attributes of the module: ${menu.currentComponent} into a string failed. The attributes were removed due to the following error message: ${error}`);
    }
}

const simpleGetters = {
    ...generateSimpleGetters(shareViewState),

    /**
     * @param {Object} state state of the app-store.
     * @param {Object} getters shareView store getters.
     * @param {Object} rootState root state.
     * @param {Object} rootGetters root getters.
     * @returns {String} The Url that can be copied by the user.
     */
    url (state, getters, rootState, rootGetters) {
        const layerParams = rootGetters.layerUrlParams,
            mapParams = rootGetters["Maps/urlParams"],
            menuParams = rootGetters["Menu/urlParams"],
            componentTypes = [shareViewState.type, layerSelectionState.type, stateSearchBar.type, "borisComponent"],
            shareUrl = new URL(location.origin + location.pathname + "?" + mapParams);

        if (componentTypes.includes(menuParams.main.currentComponent)) {
            menuParams.main.currentComponent = "root";
            delete menuParams.main.attributes;
        }
        if (componentTypes.includes(menuParams.secondary.currentComponent)) {
            menuParams.secondary.currentComponent = "root";
            delete menuParams.secondary.attributes;
        }

        areAttributesValid(menuParams.main);
        areAttributesValid(menuParams.secondary);

        shareUrl.searchParams.set("MENU", JSON.stringify(menuParams));
        shareUrl.searchParams.set("LAYERS", JSON.stringify(layerParams));

        // Add existing URL parameters if there are any
        if (location.search) {
            const existingParams = new URLSearchParams(location.search);

            existingParams?.forEach((value, key) => {
                if (!Array.from(shareUrl.searchParams.keys()).some(k => k.toLowerCase() === key.toLowerCase())) {
                    shareUrl.searchParams.set(key, value);
                }
            });
        }

        return shareUrl.origin + shareUrl.pathname + "?" + Array.from(shareUrl.searchParams).map(searchParam => searchParam[0] + "=" + searchParam[1]).join("&");
    }
};

export default simpleGetters;
