import layerTypes from "./layerTypes";
import store from "@appstore";

const layerCollection = [];

/**
 * Adds a layer to the layerCollection.
 * @param {Layer} layer The layer.
 * @returns {void}
 */
function addLayer (layer) {
    layerCollection.push(layer);

    if (layerTypes.getLayerTypes2d().includes(layer.get("typ")?.toUpperCase())) {
        store.dispatch("Maps/addLayer", layer.getLayer());
    }
}

/**
 * Removes a layer from the layerCollection and map.
 * @param {Layer} layerId The layer Id.
 * @returns {void}
 */
function removeLayerById (layerId) {
    const removeLayer = getLayerById(layerId);

    if (layerTypes.getLayerTypes2d().includes(removeLayer.get("typ")?.toUpperCase())) {
        mapCollection.getMap("2D")?.removeLayer(removeLayer.layer);
    }
    for (let i = 0; i < layerCollection.length; i++) {
        if (layerCollection[i].attributes?.id === layerId) {
            layerCollection.splice(i, 1);
        }
    }
}

/**
 * Removes all entries from the collection and remove all layers from maps.
 * @returns {void}
 */
function clear () {
    layerCollection.forEach(layer => {
        if (layerTypes.getLayerTypes2d().includes(layer.get("typ")?.toUpperCase())) {
            const olLayer = layer.getLayer();

            olLayer.setVisible(false);
            mapCollection.getMap("2D")?.removeLayer(olLayer);
        }
        else if (layerTypes.getLayerTypes3d().includes(layer.get("typ")?.toUpperCase())) {
            layer.setVisible(false, mapCollection.getMap("3D"), layer.attributes);
        }
    });

    while (layerCollection.length > 0) {
        layerCollection.pop();
    }
}

/**
 * Gets the layerCollection
 * @returns {Layer[]} The layer collection.
 */
function getLayers () {
    return layerCollection;
}

/**
 * Returns an layer by id of the layer collection.
 * @param {String} id The layer id.
 * @returns {Layer|undefined} The layer or undefined if layer not exits.
 */
function getLayerById (id) {
    return layerCollection.find(layer => layer.attributes.id === id);
}

/**
 * Returns an layer by id of the layer collection.
 * @param {String} id The layer id.
 * @returns {Layer} The layer.
 */
function getOlLayers () {
    const olLayers = [];

    layerCollection.forEach(layer => {
        if (layer.getLayer().get("visible")) {
            olLayers.push(layer.getLayer());
        }
    });

    return olLayers;
}

export default {
    addLayer,
    removeLayerById,
    clear,
    getLayers,
    getLayerById,
    getOlLayers
};
