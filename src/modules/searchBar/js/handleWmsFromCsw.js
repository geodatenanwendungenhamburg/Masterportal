import axios from "axios";
import {WMSCapabilities} from "ol/format.js";

/**
 * Recursively collects all named layers from WMS capability layer tree.
 * Handles nested hierarchies by traversing all Layer children and filtering those with Name.
 * @param {Object} layer WMS layer object from parsed capability
 * @param {Object[]} accumulator Accumulator for recursion
 * @returns {Object[]} All named layers found at any depth
 */
function collectNamedLayers (layer, accumulator = []) {
    if (!layer) {
        return accumulator;
    }

    if (layer.Name) {
        accumulator.push({
            name: layer.Name,
            title: layer.Title
        });
    }

    if (Array.isArray(layer.Layer)) {
        layer.Layer.forEach(childLayer => {
            collectNamedLayers(childLayer, accumulator);
        });
    }
    else if (layer.Layer && typeof layer.Layer === "object") {
        collectNamedLayers(layer.Layer, accumulator);
    }

    return accumulator;
}

/**
 * Handles WMS layer discovery for CSW records.
 * Fetches GetCapabilities and extracts service title plus layer names.
 * @param {String} baseUrl WMS base URL
 * @returns {Object} Result state with discovered layer names and service title
 */
export default async function handleWmsFromCsw (baseUrl) {
    try {
        const capResponse = await axios.get(baseUrl, {
            params: {SERVICE: "WMS", REQUEST: "GetCapabilities"},
            timeout: 7000
        });

        const parser = new WMSCapabilities();
        const capability = parser.read(capResponse.data);

        const serviceTitle = capability?.Service?.Title || "";
        const rootLayer = capability?.Capability?.Layer;

        // Recursively collect all named layers from the tree
        const layerTitleEntries = collectNamedLayers(rootLayer);

        return {
            layersAdded: layerTitleEntries.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: layerTitleEntries.map(entry => entry.name),
            layerTitleEntries // [{name, title}]
        };
    }
    catch (capError) {
        console.warn("handleWmsFromCsw: WMS GetCapabilities failed, layers will be empty.", capError);
        return {layersAdded: false, serviceUnavailable: true, serviceTitle: "", layerNames: []};
    }
}
