import layerCollection from "../../../core/layers/js/layerCollection";

/**
 * The actions for the CompareMaps.
 * @module modules/compareMaps/store/actionsCompareMaps
 */
export default {
    /**
     * Activates the layer swiper for comparing maps.
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.commit - The Vuex commit function.
     * @returns {void}
     */
    activateSwiper ({state, commit}) {
        const firstLayer = layerCollection.getLayers().find(layer => layer.get("id") === state.selectedLayer1Id),
            secondLayer = layerCollection.getLayers().find(layer => layer.get("id") === state.selectedLayer2Id),
            appendix = "_secondLayer";

        updateLayerId(firstLayer, false, appendix);
        updateLayerId(secondLayer, true, appendix);

        commit("Modules/LayerSwiper/setActive", true, {root: true});
        commit("Modules/LayerSwiper/setLayerSwiperSourceLayer", firstLayer, {root: true});
        commit("Modules/LayerSwiper/setLayerSwiperTargetLayer", secondLayer, {root: true});
    }
};

/**
 * Updates the layerId of the given layer by adding or removing a given appendix.
 * @param {Object} layer - The layer to update.
 */
function updateLayerId (layer, shouldAppend, appendix) {
    const layerId = layer.getLayer().values_.id;

    if (shouldAppend && !layerId.endsWith(appendix)) {
        layer.getLayer().values_.id = layerId + appendix;
    }
    else if (!shouldAppend && layerId.endsWith(appendix)) {
        layer.getLayer().values_.id = layerId.replace(appendix, "");
    }
}
