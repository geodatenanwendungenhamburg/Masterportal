import layerCollection from "@core/layers/js/layerCollection.js";
import {resetRenderListeners} from "@shared/js/utils/resetRenderListeners.js";

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
    activateSwiper ({state, commit, rootGetters}) {
        const firstLayer = layerCollection.getLayers().find(layer => layer.get("id") === state.selectedLayer1Id),
            secondLayer = layerCollection.getLayers().find(layer => layer.get("id") === state.selectedLayer2Id);

        updateLayerId(firstLayer, false, rootGetters["Modules/WmsTime/layerAppendix"]);
        updateLayerId(secondLayer, true, rootGetters["Modules/WmsTime/layerAppendix"]);

        commit("Modules/LayerSwiper/setActive", true, {root: true});
        commit("Modules/LayerSwiper/setSourceLayerId", state.selectedLayer1Id, {root: true});
        commit("Modules/LayerSwiper/setTargetLayerId", state.selectedLayer2Id, {root: true});
    },
    /**
     * Deactivates the layer swiper for comparing maps.
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.commit - The Vuex commit function.
     * @returns {void}
     */
    deactivateSwiper ({state, commit, dispatch}) {
        dispatch("resetLayer", state.selectedLayer1Id);
        dispatch("resetLayer", state.selectedLayer2Id);

        commit("Modules/LayerSwiper/setActive", false, {root: true});
        commit("Modules/LayerSwiper/setSourceLayerId", "", {root: true});
        commit("Modules/LayerSwiper/setTargetLayerId", "", {root: true});
    },
    /**
     * Resets a layer to its pre-selected state.
     * @param {Object} context - The Vuex context object.
     * @param {Object} context.rootGetters - The Vuex rootGetters object.
     * @returns {void}
     */
    resetLayer ({rootGetters}, layerId) {
        if (!layerId) {
            return;
        }

        const layerToReset = layerCollection.getLayerById(layerId);

        updateLayerId(layerToReset, false, rootGetters["Modules/WmsTime/layerAppendix"]);
        resetRenderListeners(layerToReset);
    }
};

/**
 * Updates the layerId of the given layer by adding or removing a given appendix.
 * @param {Object?} layer - The layer to update.
 * @returns {void}
 */
function updateLayerId (layer, shouldAppend, appendix) {
    if (!layer) {
        return;
    }

    const layerId = layer.getLayer().values_.id;

    if (shouldAppend && !layerId.endsWith(appendix)) {
        layer.getLayer().values_.id = layerId + appendix;
    }
    else if (!shouldAppend && layerId.endsWith(appendix)) {
        layer.getLayer().values_.id = layerId.replace(appendix, "");
    }
}
