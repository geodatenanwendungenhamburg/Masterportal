import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import shareViewState from "./stateShareView.js";
import stateSearchBar from "../../searchBar/store/stateSearchBar.js";
import layerCollection from "@core/layers/js/layerCollection.js";

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
     * Constructs the shareable URL representing the current application state.
     *
     * - Includes map view, active layers, and menu component configuration.
     * - Converts menu params to string format, safely omitting invalid attributes.
     * - Replaces legacy query parameters (e.g., "layerids", "visibility") with structured equivalents.
     * - Preserves other unrelated query parameters already present in the URL.
     *
     * @param {Object} state state of the app-store.
     * @param {Object} getters shareView store getters.
     * @param {Object} rootState root state.
     * @param {Object} rootGetters root getters.
     * @returns {String} The Url that can be copied by the user.
     */
    url (state, getters, rootState, rootGetters) {
        const layerParams = rootGetters.layerUrlParams.filter(layer => !isDynamicLayer(layer.id)),
            mapParams = rootGetters["Maps/urlParams"],
            menuParams = rootGetters["Menu/urlParams"],
            componentTypes = [shareViewState.type, stateSearchBar.type],
            shareUrl = new URL(location.origin + location.pathname + "?" + mapParams),
            currentMarker = rootState?.Maps?.currentMarker;

        if (rootGetters["Maps/mode"] === "3D") {
            const lastPickedFeatureId = rootGetters["Modules/SearchBar/lastPickedFeatureId"];

            if (lastPickedFeatureId) {
                shareUrl.searchParams.set("HIGHLIGHTED3D", lastPickedFeatureId);
            }
        }

        layerParams.forEach(layerParam => {
            const layerModel = layerCollection.getLayerById(layerParam.id),
                time = layerModel?.getLayerSource?.()?.getParams?.()?.TIME;

            if (time) {
                layerParam.params = {
                    ...layerParam.params,
                    TIME: time
                };
            }
        });
        if (componentTypes.includes(menuParams.main.currentComponent)) {
            menuParams.main.currentComponent = "root";
            delete menuParams.main.attributes;
        }
        if (componentTypes.includes(menuParams.secondary.currentComponent)) {
            menuParams.secondary.currentComponent = "root";
            delete menuParams.secondary.attributes;
        }

        const bufferState = rootState?.Modules?.BufferAnalysis;

        if (
            bufferState?.selectedSourceLayer &&
            bufferState?.selectedTargetLayer &&
            bufferState?.bufferRadius
        ) {
            menuParams.secondary = menuParams.secondary || {};
            menuParams.secondary.currentComponent = "bufferAnalysis";
            menuParams.secondary.attributes = {
                source: bufferState.selectedSourceLayer.id,
                target: bufferState.selectedTargetLayer.id,
                radius: bufferState.bufferRadius,
                result: bufferState.resultType
            };
        }

        areAttributesValid(menuParams.main);
        areAttributesValid(menuParams.secondary);

        shareUrl.searchParams.set("MENU", JSON.stringify(menuParams));
        shareUrl.searchParams.set("LAYERS", JSON.stringify(layerParams));


        if (currentMarker) {
            shareUrl.searchParams.set("MARKER", JSON.stringify(currentMarker));
        }

        // Add existing URL parameters if there are any
        if (location.search) {
            const existingParams = new URLSearchParams(location.search),
                legacyUrlParamsToIgnore = ["map/layerids", "layerids", "visibility", "transparency", "map/mdid"];

            existingParams?.forEach((value, key) => {
                if (
                    !Array.from(shareUrl.searchParams.keys()).some(k => k.toLowerCase() === key.toLowerCase()) &&
                    !legacyUrlParamsToIgnore.includes(key.toLowerCase())
                ) {
                    shareUrl.searchParams.set(key, value);
                }
            });
        }

        return encodeURI(shareUrl.origin + shareUrl.pathname + "?" + Array.from(shareUrl.searchParams).map(searchParam => searchParam[0] + "=" + searchParam[1]).join("&"));
    }
};

/**
 * Tests if a layer is dynamic using the isDynamic attribute.
 * @param {String} layerId ID of the layer.
 * @returns {Boolean} True, if layer is a dynamic layer created in highlightFeaturesByAttribute.js.
 */
function isDynamicLayer (layerId) {
    const layer = layerCollection.getLayerById(layerId);

    return layer?.attributes?.isDynamic === true;
}

export default simpleGetters;
