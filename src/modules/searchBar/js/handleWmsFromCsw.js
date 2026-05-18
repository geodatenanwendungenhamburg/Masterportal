import axios from "axios";
import {WMSCapabilities} from "ol/format.js";

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
        const layers = capability?.Capability?.Layer?.Layer || [];

        const layerTitleEntries = layers.map(layer => ({
            name: layer.Name,
            title: layer.Title
        }));

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
