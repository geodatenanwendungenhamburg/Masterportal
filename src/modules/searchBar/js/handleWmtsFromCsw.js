import axios from "axios";
import {WMTSCapabilities} from "ol/format.js";

/**
 * Checks whether a WMTS supported CRS matches the current map projection.
 * @param {String} supportedCrs CRS string from WMTS capabilities.
 * @param {String} projectionCode Projection code like EPSG:25832.
 * @returns {Boolean} True if both describe the same projection.
 */
function matchesProjectionCode (supportedCrs, projectionCode) {
    if (!supportedCrs || !projectionCode) {
        return false;
    }

    const normalizedSupportedCrs = supportedCrs.toUpperCase().replaceAll("::", ":"),
        normalizedProjectionCode = projectionCode.toUpperCase();

    return normalizedSupportedCrs.endsWith(normalizedProjectionCode);
}

/**
 * Selects the best WMTS tile matrix set for the current projection.
 * @param {Object} layer WMTS layer definition from capabilities.
 * @param {Object[]} tileMatrixSets WMTS tile matrix set definitions.
 * @param {String} projectionCode Current map projection code.
 * @returns {String} Best matching tile matrix set identifier.
 */
function findBestTileMatrixSet (layer, tileMatrixSets = [], projectionCode = "") {
    const matrixSetLinks = Array.isArray(layer?.TileMatrixSetLink) ? layer.TileMatrixSetLink : [];

    if (matrixSetLinks.length === 0) {
        return "";
    }

    const matchingLink = matrixSetLinks.find(link => {
        const matchingTileMatrixSet = tileMatrixSets.find(tileMatrixSet => tileMatrixSet?.Identifier === link?.TileMatrixSet);

        return matchesProjectionCode(matchingTileMatrixSet?.SupportedCRS, projectionCode);
    });

    return matchingLink?.TileMatrixSet || matrixSetLinks[0]?.TileMatrixSet || "";
}

/**
 * Selects the preferred WMTS image format for tile requests.
 * @param {Object} layer WMTS layer definition from capabilities.
 * @returns {String} Preferred image format.
 */
function findPreferredFormat (layer) {
    const tileResource = Array.isArray(layer?.ResourceURL)
            ? layer.ResourceURL.find(resource => resource?.resourceType === "tile" && resource?.format)
            : null,
        supportedFormats = Array.isArray(layer?.Format) ? layer.Format : [];

    return tileResource?.format || supportedFormats[0] || "";
}

/**
 * Builds a stable WMTS GetCapabilities URL from a base URL.
 * @param {String} baseUrl WMTS base URL.
 * @returns {String} URL including SERVICE=WMTS and REQUEST=GetCapabilities.
 */
function buildWmtsCapabilitiesUrl (baseUrl) {
    const defaultCapabilitiesUrl = `${baseUrl}?SERVICE=WMTS&REQUEST=GetCapabilities`;

    try {
        const parsedUrl = new URL(baseUrl);

        parsedUrl.searchParams.set("SERVICE", "WMTS");
        parsedUrl.searchParams.set("REQUEST", "GetCapabilities");

        return parsedUrl.toString();
    }
    catch (error) {
        return defaultCapabilitiesUrl;
    }
}

/**
 * Collects all named layers from WMTS capabilities content.
 * @param {Object[]} layers WMTS capabilities layer array.
 * @param {Object[]} tileMatrixSets WMTS tile matrix set array.
 * @param {String} projectionCode Current map projection code.
 * @returns {Object[]} Layer entries containing identifier and title.
 */
function collectWmtsLayers (layers = [], tileMatrixSets = [], projectionCode = "") {
    if (!Array.isArray(layers)) {
        return [];
    }

    return layers
        .filter(layer => layer?.Identifier)
        .map(layer => ({
            name: layer.Identifier,
            title: layer.Title || layer.Identifier,
            format: findPreferredFormat(layer),
            tileMatrixSet: findBestTileMatrixSet(layer, tileMatrixSets, projectionCode)
        }));
}

/**
 * Handles WMTS layer discovery for CSW records.
 * Fetches GetCapabilities and extracts service title plus layer identifiers.
 * @param {String} baseUrl WMTS base URL.
 * @param {String} [projectionCode=""] Current map projection code.
 * @returns {Object} Result state with discovered layer names and service title.
 */
export default async function handleWmtsFromCsw (baseUrl, projectionCode = "") {
    const capabilitiesUrl = buildWmtsCapabilitiesUrl(baseUrl);

    try {
        const capResponse = await axios.get(baseUrl, {
            params: {SERVICE: "WMTS", REQUEST: "GetCapabilities"},
            timeout: 7000
        });

        const parser = new WMTSCapabilities();
        const capability = parser.read(capResponse.data);

        const serviceTitle = capability?.ServiceIdentification?.Title || "",
            tileMatrixSets = capability?.Contents?.TileMatrixSet || [],
            layerTitleEntries = collectWmtsLayers(capability?.Contents?.Layer || [], tileMatrixSets, projectionCode);

        return {
            layersAdded: layerTitleEntries.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: layerTitleEntries.map(entry => entry.name),
            layerTitleEntries,
            capabilitiesUrl
        };
    }
    catch (capError) {
        console.warn("handleWmtsFromCsw: WMTS GetCapabilities failed, layers will be empty.", capError);
        return {
            layersAdded: false,
            serviceUnavailable: true,
            serviceTitle: "",
            layerNames: [],
            layerTitleEntries: [],
            capabilitiesUrl
        };
    }
}
