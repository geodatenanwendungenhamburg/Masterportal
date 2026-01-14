import {treeOrder, treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import {sortObjects} from "@shared/js/utils/sortObjects.js";

/**
 * Gibt den aktuellen zIndex eines Layers zurück.
 * @param {Object} layer - Der Layer, dessen zIndex abgefragt werden soll.
 * @returns {number|null} Der zIndex des Layers oder null, wenn er nicht existiert.
 */
function getZIndexForLayer (layerId, isBaselayer, rootGetters) {
    const layer = rootGetters.layerConfigById(layerId),
        parentKey = isBaselayer ? treeBaselayersKey : treeSubjectsKey;

    if (!layer) {
        return 0;
    }

    if (Object.prototype.hasOwnProperty.call(layer, "zIndex") && typeof layer.zIndex === "number") {
        return layer.zIndex;
    }

    let maxZIndex = rootGetters.maxZIndexOfLayerConfigsByParentKey(parentKey);

    if (maxZIndex === -1) {
        maxZIndex = isBaselayer
            ? rootGetters.maxZIndexOfLayerConfigsByParentKey(treeSubjectsKey)
            : rootGetters.maxZIndexOfLayerConfigsByParentKey(treeBaselayersKey);
    }

    return maxZIndex + 1;
}

/**
 * Bestimmt den obersten Basemap-Layer anhand des höchsten zIndex.
 *
 * @param {Object[]} visibleBaselayers - Array von sichtbaren Basemap-Layer-Configs.
 * @param {string} visibleBaselayers[].id - Die ID des Layers.
 * @param {number} visibleBaselayers[].zIndex - Der zIndex des Layers.
 * @returns {Object|null} Der oberste LayerConfig oder null, wenn keine Basemaps vorhanden sind.
 */
function getTopBaselayer (visibleBaselayers) {
    if (!visibleBaselayers || visibleBaselayers.length === 0) {
        return null;
    }

    const maxZIndex = Math.max(...visibleBaselayers.map(l => l.zIndex));

    return visibleBaselayers.find(l => l.zIndex === maxZIndex) || null;
}

/**
     * Updates the zindex of the layer configs by increasing the zindex of the layer configs
     * that have a zindex greater than the max zindex by 1.
     * @param {Object} context the vue context
     * @param {Object} payload the payload
     * @param {Object} payload.layerContainer The layer container of layer configs.
     * @param {Object} payload.maxZIndex The max zIndex of the layer configs.
     * @returns {void}
     */
function updateLayerConfigZIndex (context, {layerContainer, maxZIndex}) {
    sortObjects(layerContainer, "zIndex");

    layerContainer.forEach(layerConf => {
        if (layerConf.zIndex > maxZIndex) {
            layerConf.zIndex = layerConf.zIndex + 1;
        }
    });
}

/**
     * Updates the zIndexes of all layerConfigs shown in tree, starts with 0.
     * @param {Object} context the vue context
     * @param {Object} context.getters the getters
     * @returns {void}
     */
function updateAllZIndexes ({getters}) {
    let startZIndex = 1;

    treeOrder.forEach(parentKey => {
        const configsByParentKey = getters.allLayerConfigsByParentKey(parentKey).filter(config => Object.prototype.hasOwnProperty.call(config, "zIndex") && typeof config.zIndex === "number");

        sortObjects(configsByParentKey, "zIndex");
        configsByParentKey.forEach(layerConf => {
            layerConf.zIndex = startZIndex++;
        });
    });
}

export default {
    getZIndexForLayer,
    getTopBaselayer,
    updateLayerConfigZIndex,
    updateAllZIndexes
};
