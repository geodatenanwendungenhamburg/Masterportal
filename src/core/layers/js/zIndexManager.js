import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants";

const zIndexMap = new Map();
let baseZIndex = 0,
    overlayZIndex = 1000;

/**
 * Setzt den zIndex für einen Layer.
 * @param {Object} layer - Der Layer, für den der zIndex gesetzt werden soll.
 * @param {string} type - Der Typ des Layers ("base" oder "overlay").
 */
function setZIndex (layer, type = "overlay") {
    const zIndex = type === "base" ? baseZIndex++ : overlayZIndex++;

    layer.setZIndex(zIndex);
    zIndexMap.set(layer, zIndex);
}

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
 * Aktualisiert den zIndex eines Layers.
 * @param {Object} layer - Der Layer, dessen zIndex aktualisiert werden soll.
 * @param {number} newZIndex - Der neue zIndex-Wert.
 */
function updateZIndex (layer, newZIndex) {
    layer.setZIndex(newZIndex);
    zIndexMap.set(layer, newZIndex);
}

/**
 * Gibt alle Layer und ihre zIndex-Werte aus (für Debugging).
 */
function logZIndexes () {
    console.warn("Aktuelle zIndex-Werte:", Array.from(zIndexMap.entries()));
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

export default {
    setZIndex,
    getZIndexForLayer,
    updateZIndex,
    logZIndexes,
    getTopBaselayer
};
