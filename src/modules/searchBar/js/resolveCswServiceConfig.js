import detectServiceType from "./detectServiceType.js";
import handleWmsFromCsw from "./handleWmsFromCsw.js";
import handleWmtsFromCsw from "./handleWmtsFromCsw.js";
import handleWfsFromCsw from "./handleWfsFromCsw.js";
import handleOafFromCsw from "./handleOafFromCsw.js";
import buildServiceLayerEntries from "./buildServiceLayerEntries.js";

/**
 * Normalizes OAF URLs from CSW records.
 * CSW links often point to /collections/{id} or /collections/{id}/items instead of API root.
 * @param {String} urlOrBaseUrl Parsed resource URL or base URL.
 * @returns {{baseUrl: String, collection: String}} Normalized API base URL and detected collection name.
 */
function normalizeOafUrl (urlOrBaseUrl = "") {
    try {
        const parsedUrl = new URL(urlOrBaseUrl);
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const collectionsIndex = pathSegments.findIndex(segment => segment.toLowerCase() === "collections");
        let collection = "";

        if (collectionsIndex !== -1 && pathSegments.length > collectionsIndex + 1) {
            collection = decodeURIComponent(pathSegments[collectionsIndex + 1]);
            parsedUrl.pathname = `/${pathSegments.slice(0, collectionsIndex).join("/")}`;
        }

        // Keep host/path only; OAF requests should not inherit query from CSW distribution URL.
        parsedUrl.search = "";
        parsedUrl.hash = "";

        return {
            baseUrl: parsedUrl.toString().replace(/\/$/, ""),
            collection
        };
    }
    catch (error) {
        return {
            baseUrl: urlOrBaseUrl,
            collection: ""
        };
    }
}

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

    const {protocol, url, layerName, urlLayerParam, baseUrl} = parsedResource;
    const typ = detectServiceType(protocol, url);
    let effectiveBaseUrl = baseUrl;
    const technicalLayerName = layerName && !layerName.includes(" ") ? layerName : "";
    let effectiveLayerName = technicalLayerName || urlLayerParam;
    let wfsVersion = "1.1.0";
    let wfsOutputFormat = "XML";
    let wfsFeatureNS = "";
    let wmtsCapabilitiesUrl = "";
    let wmtsFormat = "";
    let wmtsTileMatrixSet = "";
    let serviceUnavailable = false;
    let serviceTitle = "";
    let discoveredLayerEntries = [];

    if (!typ) {
        return {
            typ,
            baseUrl: effectiveBaseUrl,
            effectiveLayerName,
            wfsVersion,
            wfsOutputFormat,
            wfsFeatureNS,
            wmtsCapabilitiesUrl,
            wmtsFormat,
            wmtsTileMatrixSet,
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
    else if (typ === "WMTS") {
        const wmtsConfig = await handleWmtsFromCsw(baseUrl),
            layers = wmtsConfig.layerTitleEntries || [];

        serviceUnavailable = wmtsConfig.serviceUnavailable;
        serviceTitle = wmtsConfig.serviceTitle || "";
        wmtsCapabilitiesUrl = wmtsConfig.capabilitiesUrl || "";

        if (!effectiveLayerName) {
            discoveredLayerEntries = buildServiceLayerEntries("WMTS", layers);
        }
        else {
            const match = layers.find(entry => entry.name === effectiveLayerName) || layers[0];

            effectiveLayerName = match?.name || effectiveLayerName;
            wmtsFormat = match?.format || "";
            wmtsTileMatrixSet = match?.tileMatrixSet || "";
        }
    }
    else if (typ === "OAF") {
        const normalizedOafUrl = normalizeOafUrl(url || baseUrl);

        effectiveBaseUrl = normalizedOafUrl.baseUrl || baseUrl;
        if (!effectiveLayerName && normalizedOafUrl.collection) {
            effectiveLayerName = normalizedOafUrl.collection;
        }

        const oafConfig = await handleOafFromCsw(effectiveBaseUrl);

        serviceUnavailable = oafConfig.serviceUnavailable;
        serviceTitle = oafConfig.serviceTitle || "";

        if (oafConfig.layersAdded) {
            // Use layerTitleEntries: [{name, title}]
            discoveredLayerEntries = buildServiceLayerEntries("OAF", oafConfig.layerTitleEntries || []);
        }
    }

    return {
        typ,
        baseUrl: effectiveBaseUrl,
        effectiveLayerName,
        wfsVersion,
        wfsOutputFormat,
        wfsFeatureNS,
        wmtsCapabilitiesUrl,
        wmtsFormat,
        wmtsTileMatrixSet,
        serviceUnavailable,
        serviceTitle,
        discoveredLayerEntries
    };
}
