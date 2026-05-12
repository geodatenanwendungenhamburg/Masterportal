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
        // CI_OnlineResource/name is sometimes a human-readable label rather than a technical
        // layer identifier. Reject it when it contains whitespace, parentheses, or matches
        // a known OGC operation name (e.g. "(GetCapabilities)" — InGrid/metaver pattern).
        OGC_OPERATIONS = ["getcapabilities", "getmap", "getfeature", "gettile", "getlegendgraphic", "getfeatureinfo"],
        technicalLayerName = layerName
            && !layerName.includes(" ")
            && !layerName.includes("(")
            && !layerName.includes(")")
            && !OGC_OPERATIONS.includes(layerName.toLowerCase())
            ? layerName : "";
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
            // Use layerTitleEntries: [{name, title}]
            discoveredLayerEntries = buildServiceLayerEntries("WMS", wmsConfig.layerTitleEntries || []);
        }
    }
    else if (typ === "WFS") {
        const wfsConfig = await handleWfsFromCsw(baseUrl),
            featureTypes = wfsConfig.featureTypes || [];

        serviceUnavailable = wfsConfig.serviceUnavailable;
        serviceTitle = wfsConfig.serviceTitle || "";
        wfsVersion = wfsConfig.wfsVersion;
        wfsOutputFormat = wfsConfig.wfsOutputFormat;

        // Try to get titles for WFS featureTypes if available
        let featureTypesWithTitles = featureTypes;

        if (wfsConfig.featureTypeTitles && Array.isArray(wfsConfig.featureTypeTitles)) {
            // Merge titles by name

            featureTypesWithTitles = featureTypes.map(ft => {

                const titleObj = wfsConfig.featureTypeTitles.find(t => t.name === ft.name);

                return titleObj ? {...ft, title: titleObj.title} : ft;
            });
        }

        if (!effectiveLayerName) {
            discoveredLayerEntries = buildServiceLayerEntries("WFS", featureTypesWithTitles);
        }
        else {
            const match = featureTypesWithTitles.find(entry => entry.name === effectiveLayerName) || featureTypesWithTitles[0];

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
