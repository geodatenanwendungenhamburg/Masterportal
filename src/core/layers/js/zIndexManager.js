import {treeOrder, treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";
import {sortObjects} from "@shared/js/utils/sortObjects.js";

/**
 * Returns the max zIndex of layer configs filtered by parentKey.
 * @param {String} parentKey - The parent key to filter by.
 * @param {Object} rootGetters - Vuex getters with `allLayerConfigsByParentKey`.
 * @returns {Number} The max zIndex, or -1 if none found.
 */
function maxZIndexOfLayerConfigsByParentKey (parentKey, rootGetters) {
    const layerConfigs = rootGetters.allLayerConfigsByParentKey(parentKey).filter(config => Object.prototype.hasOwnProperty.call(config, "zIndex") && typeof config.zIndex === "number");

    if (layerConfigs.length === 0) {
        return -1;
    }
    return Math.max(...layerConfigs.map(conf => conf.zIndex));
}

/**
 * Returns the zIndex for the given layer id. If zIndex already exists at layerConfig, it is returned.
 * Reads the baselayer flag from the layer config automatically.
 * @param {String} id - The layer id.
 * @param {Object} rootGetters - Vuex getters.
 * @returns {Number|null} The zIndex, or null if the layer config is not found.
 */
function determineZIndex (id, rootGetters) {
    const layerConf = rootGetters.layerConfigById(id);

    if (!layerConf) {
        return null;
    }
    if (Object.prototype.hasOwnProperty.call(layerConf, "zIndex") && typeof layerConf.zIndex === "number") {
        return layerConf.zIndex;
    }

    const isBaselayer = Object.prototype.hasOwnProperty.call(layerConf, "baselayer") && layerConf.baselayer,
        parentKey = isBaselayer ? treeBaselayersKey : treeSubjectsKey,
        useGetterFn = typeof rootGetters.maxZIndexOfLayerConfigsByParentKey === "function";
    let maxZIndex = useGetterFn
        ? rootGetters.maxZIndexOfLayerConfigsByParentKey(parentKey)
        : maxZIndexOfLayerConfigsByParentKey(parentKey, rootGetters);

    if (maxZIndex === -1) {
        const fallbackKey = isBaselayer ? treeSubjectsKey : treeBaselayersKey;

        maxZIndex = useGetterFn
            ? rootGetters.maxZIndexOfLayerConfigsByParentKey(fallbackKey)
            : maxZIndexOfLayerConfigsByParentKey(fallbackKey, rootGetters);
    }
    return maxZIndex + 1;
}

/**
 * Returns the zIndex for the given layer. If zIndex already exists at layerConfig, it is returned.
 * @param {String} layerId - The layer id.
 * @param {Boolean} isBaselayer - Whether it is a baselayer.
 * @param {Object} rootGetters - Vuex getters.
 * @returns {Number} The zIndex, or 0 if the layer config is not found.
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

    let maxZIndex = maxZIndexOfLayerConfigsByParentKey(parentKey, rootGetters);

    if (maxZIndex === -1) {
        maxZIndex = isBaselayer
            ? maxZIndexOfLayerConfigsByParentKey(treeSubjectsKey, rootGetters)
            : maxZIndexOfLayerConfigsByParentKey(treeBaselayersKey, rootGetters);
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
    if (visibleBaselayers.length === 1) {
        return visibleBaselayers[0];
    }

    const maxZIndex = Math.max(...visibleBaselayers.map(l => l.zIndex));

    if (isNaN(maxZIndex)) {
        return null;
    }
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

let initialZIndex = 1;

/**
 * Returns the next zIndex and increments the internal counter.
 * @returns {Number} The next zIndex.
 */
function getNextInitialZIndex () {
    return initialZIndex++;
}

/**
 * Resets the initial zIndex counter to 1.
 * @returns {void}
 */
function resetInitialZIndex () {
    initialZIndex = 1;
}

export default {
    maxZIndexOfLayerConfigsByParentKey,
    determineZIndex,
    getZIndexForLayer,
    getTopBaselayer,
    updateLayerConfigZIndex,
    updateAllZIndexes,
    getNextInitialZIndex,
    resetInitialZIndex
};
