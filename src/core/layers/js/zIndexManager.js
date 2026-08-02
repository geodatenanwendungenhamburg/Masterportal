import {sortObjects} from "@shared/js/utils/sortObjects.js";
import {treeBaselayersKey, treeSubjectsKey, treeOrder} from "@shared/js/utils/constants.js";

const alwaysOnTop = 9999999;

/**
 * Returns true if the given config has a numeric zIndex property.
 * @param {Object} config a layer config
 * @returns {Boolean} true if config has a numeric zIndex
 */
function hasNumericZIndex (config) {
    return Object.prototype.hasOwnProperty.call(config, "zIndex") && typeof config.zIndex === "number";
}

/**
 * Returns the max zIndex of layer configs by parentKey.
 * @param {Object} state state of the app-store.
 * @param {Object} getters getters of the app-store.
 * @param {String} parentKey key of the parent
 * @returns {Number} the max zIndex
 */
function maxZIndexOfLayerConfigsByParentKey (state, getters) {
    return function (parentKey) {
        let maxZIndex = -1;
        const layerConfigs = getters.allLayerConfigsByParentKey(parentKey).filter(config => hasNumericZIndex(config));

        if (layerConfigs.length > 0) {
            maxZIndex = Math.max(...layerConfigs.map(conf => conf.zIndex));
        }
        return maxZIndex;
    };
}

/**
 * Returns the zIndex for the given layerConfig. If zIndex already exists at layerConfig, it is returned.
 * @param {Object} state state of the app-store.
 * @param {Object} getters getters of the app-store.
 * @param {String} id id of the layer
 * @returns {Number|null} the zIndex for the given layerConfig or null if layerConfig is not available
 */
function determineZIndex (state, getters) {
    return function (id) {
        const layerConf = getters.layerConfigById(id);

        if (layerConf) {
            if (hasNumericZIndex(layerConf)) {
                return layerConf.zIndex;
            }
            let maxZIndex = -1;
            const isBaselayer = Object.prototype.hasOwnProperty.call(layerConf, "baselayer") && layerConf.baselayer,
                parentKey = isBaselayer ? treeBaselayersKey : treeSubjectsKey;

            maxZIndex = getters.maxZIndexOfLayerConfigsByParentKey(parentKey);
            if (maxZIndex === -1) {
                if (isBaselayer) {
                    maxZIndex = getters.maxZIndexOfLayerConfigsByParentKey(treeSubjectsKey);
                }
                else {
                    maxZIndex = getters.maxZIndexOfLayerConfigsByParentKey(treeBaselayersKey);
                }
            }

            return maxZIndex + 1;
        }
        return null;
    };
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
        const configsByParentKey = getters.allLayerConfigsByParentKey(parentKey).filter(hasNumericZIndex);

        sortObjects(configsByParentKey, "zIndex");
        configsByParentKey.forEach(layerConf => {
            layerConf.zIndex = startZIndex++;
        });
    });
}

let zIndex = 1;

/**
 * Returns the current zIndex and increments it afterwards.
 * @returns {Number} the current zIndex
 */
function incrementZIndex () {
    return zIndex++;
}

/**
 * Resets the zIndex to 1.
 * @returns {void}
 */
function resetZIndex () {
    zIndex = 1;
}

/**
 * Returns the layer config with the highest zIndex from a list.
 * @param {Array} layers list of layer configs
 * @returns {Object|null} the layer with the highest zIndex, or null if the list is empty
 */
function getLayerWithMaxZIndex (layers) {
    if (!layers || layers.length === 0) {
        return null;
    }
    const maxZIndex = Math.max(...layers.map(l => l.zIndex));

    return layers.find(l => l.zIndex === maxZIndex) ?? null;
}

/**
 * Determines the max zIndex from configsByParentKey, falling back to layerContainer if empty.
 * @param {Array} layerContainer all layer configs with numeric zIndex
 * @param {Array} configsByParentKey layer configs scoped to the relevant parent, with numeric zIndex
 * @returns {Number} the max zIndex (-Infinity if both arrays are empty)
 */
function getMaxZIndexFromConfigs (layerContainer, configsByParentKey) {
    const source = configsByParentKey.length > 0 ? configsByParentKey : layerContainer;

    return source.length > 0 ? Math.max(...source.map(conf => conf.zIndex)) : -Infinity;
}

/**
 * Determines the max zIndex for a given parentKey by resolving the relevant layer configs
 * from state/getters, filtering for numeric zIndex values, and delegating to getMaxZIndexFromConfigs.
 * @param {Object} state state of the app-store
 * @param {Object} getters getters of the app-store
 * @param {String} parentKey key of the parent folder or tree section
 * @returns {Number} the max zIndex (-Infinity if no configs found)
 */
function getMaxZIndexForParentKey (state, getters, parentKey) {
    const layerContainer = getters.allLayerConfigs.filter(hasNumericZIndex);
    let configsByParentKey = [];

    if (state.layerConfig[parentKey]) {
        configsByParentKey = getters.allLayerConfigsByParentKey(parentKey).filter(hasNumericZIndex);
    }
    else {
        configsByParentKey = getters.visibleSubjectDataLayerConfigs.filter(hasNumericZIndex);
    }

    return getMaxZIndexFromConfigs(layerContainer, configsByParentKey);
}

/**
 * sorts the visible layer list by zIndex from layer
 * layers without zIndex keep their original relative order
 * @param {array} visibleLayerList with visible layer
 * @returns {array} the sorted visible layer list
 */
function sortVisibleLayerListByZindexBeforePrint (visibleLayerList) {
    return [...visibleLayerList]
        .map((layer, index) => ({
            layer,
            index,
            zIndex: typeof layer?.getZIndex === "function" ? layer.getZIndex() : undefined
        }))
        .sort((a, b) => {
            const aHasZIndex = a.zIndex !== undefined;
            const bHasZIndex = b.zIndex !== undefined;

            if (aHasZIndex && bHasZIndex && a.zIndex !== b.zIndex) {
                return a.zIndex - b.zIndex;
            }
            return a.index - b.index;
        })
        .map(item => item.layer);
}

export default {
    alwaysOnTop,
    hasNumericZIndex,
    maxZIndexOfLayerConfigsByParentKey,
    determineZIndex,
    updateLayerConfigZIndex,
    updateAllZIndexes,
    incrementZIndex,
    resetZIndex,
    sortVisibleLayerListByZindexBeforePrint,
    getLayerWithMaxZIndex,
    getMaxZIndexFromConfigs,
    getMaxZIndexForParentKey
};

