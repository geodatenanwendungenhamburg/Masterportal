import axios from "axios";
import collectWmsLayerNames from "./collectWmsLayerNames.js";

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
        const capXml = capResponse.request?.responseXML
            || new DOMParser().parseFromString(capResponse.data, "application/xml");

        const rootLayer = Array.from(capXml.getElementsByTagName("Layer"))[0],
            serviceTitle = capXml.getElementsByTagName("Service")[0]
                ?.getElementsByTagName("Title")[0]
                ?.textContent?.trim()
                || rootLayer?.getElementsByTagName("Title")[0]?.textContent?.trim()
                || "";
        const allNames = rootLayer ? collectWmsLayerNames(rootLayer) : [];

        return {
            layersAdded: allNames.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: allNames
        };
    }
    catch (capError) {
        console.warn("handleWmsFromCsw: WMS GetCapabilities failed, layers will be empty.", capError);
        return {layersAdded: false, serviceUnavailable: true, serviceTitle: "", layerNames: []};
    }
}
