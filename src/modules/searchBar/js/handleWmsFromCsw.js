import axios from "axios";
import collectWmsLayerNames from "./collectWmsLayerNames.js";

/**
 * Handles WMS layer discovery and addition for CSW records.
 * Fetches GetCapabilities, extracts layer names, and dispatches each as separate map layer.
 * @param {String} baseUrl WMS base URL
 * @param {Function} dispatch Vuex dispatch function
 * @param {String} fileIdentifier CSW file identifier (metadata UUID)
 * @param {String} recordTitle CSW record title
 * @param {String} cswUrl CSW endpoint URL
 * @param {Number} resourceIndex Index of the online resource
 * @returns {Boolean} True if layers were found and added, false otherwise
 */
export default async function handleWmsFromCsw (baseUrl, dispatch, fileIdentifier, recordTitle, cswUrl, resourceIndex) {
    try {
        const capResponse = await axios.get(baseUrl, {
            params: {SERVICE: "WMS", REQUEST: "GetCapabilities"}
        });
        const capXml = capResponse.request?.responseXML
            || new DOMParser().parseFromString(capResponse.data, "application/xml");

        const rootLayer = Array.from(capXml.getElementsByTagName("Layer"))[0];
        const allNames = rootLayer ? collectWmsLayerNames(rootLayer) : [];

        if (allNames.length > 0) {
            for (const [index, singleLayerName] of allNames.entries()) {
                const layerId = `csw-${fileIdentifier}-${resourceIndex}-${singleLayerName}`;
                const layerSource = {
                    id: layerId,
                    name: recordTitle ? `${recordTitle} - ${singleLayerName}` : singleLayerName || fileIdentifier,
                    url: baseUrl,
                    typ: "WMS",
                    metaID: fileIdentifier,
                    cswUrl: cswUrl,
                    layers: singleLayerName
                };

                dispatch("addLayerToTopicTree", {
                    layerId,
                    source: layerSource,
                    showInLayerTree: true,
                    visibility: index === 0
                });
            }
            return true;
        }
    }
    catch (capError) {
        console.warn("handleWmsFromCsw: WMS GetCapabilities failed, layers will be empty.", capError);
    }
    return false;
}
