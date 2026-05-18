import detectServiceType from "./detectServiceType.js";
import handleWmsFromCsw from "./handleWmsFromCsw.js";
import handleWfsFromCsw from "./handleWfsFromCsw.js";
import buildServiceLayerEntries from "./buildServiceLayerEntries.js";

/**
 * Resolves service specific config for one parsed CSW online resource.
 * @param {Object} parsedResource Parsed resource returned by parseCswOnlineResource.
 * @param {String} parsedResource.protocol Resource protocol.
 * @param {String} parsedResource.url Resource URL.
 * @param {String} parsedResource.layerName Layer name from metadata.
 * @param {String} parsedResource.urlLayerParam LAYERS query param from URL.
 * @param {String} parsedResource.baseUrl Service base URL.
 * @returns {Promise<Object>} Resolved service configuration.
 */
export default async function resolveCswServiceConfig (parsedResource) {
    const {protocol, url, layerName, urlLayerParam, baseUrl} = parsedResource,
        typ = detectServiceType(protocol, url),
        technicalLayerName = layerName && !layerName.includes(" ") ? layerName : "";
    let effectiveLayerName = technicalLayerName || urlLayerParam,
        wfsVersion = "1.1.0",
        wfsOutputFormat = "XML",
        wfsFeatureNS = "",
        serviceUnavailable = false,
        serviceTitle = "",
        discoveredLayerEntries = [];

    if (!typ) {
        return {
            typ,
            baseUrl,
            effectiveLayerName,
            wfsVersion,
            wfsOutputFormat,
            wfsFeatureNS,
            serviceUnavailable,
            serviceTitle,
            discoveredLayerEntries
        };
    }

    if (typ === "WMS" && !effectiveLayerName) {
        const wmsConfig = await handleWmsFromCsw(baseUrl);

        serviceUnavailable = wmsConfig.serviceUnavailable;
        serviceTitle = wmsConfig.serviceTitle || "";

        if (wmsConfig.layersAdded) {
            discoveredLayerEntries = buildServiceLayerEntries("WMS", wmsConfig.layerNames || []);
        }
    }
    else if (typ === "WFS") {
        const wfsConfig = await handleWfsFromCsw(baseUrl),
            featureTypes = wfsConfig.featureTypes || [];

        serviceUnavailable = wfsConfig.serviceUnavailable;
        serviceTitle = wfsConfig.serviceTitle || "";
        wfsVersion = wfsConfig.wfsVersion;
        wfsOutputFormat = wfsConfig.wfsOutputFormat;

        if (!effectiveLayerName) {
            discoveredLayerEntries = buildServiceLayerEntries("WFS", featureTypes);
        }
        else {
            const match = featureTypes.find(entry => entry.name === effectiveLayerName) || featureTypes[0];

            effectiveLayerName = match?.name || effectiveLayerName;
            wfsFeatureNS = match?.featureNS || wfsFeatureNS;
        }
    }

    return {
        typ,
        baseUrl,
        effectiveLayerName,
        wfsVersion,
        wfsOutputFormat,
        wfsFeatureNS,
        serviceUnavailable,
        serviceTitle,
        discoveredLayerEntries
    };
}
