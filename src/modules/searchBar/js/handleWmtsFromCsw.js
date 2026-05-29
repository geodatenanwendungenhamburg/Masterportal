import axios from "axios";
import {WMTSCapabilities} from "ol/format.js";
import mapCollection from "@core/maps/js/mapCollection.js";

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
 * Checks whether a WMTS tile matrix set's CRS can be used by OpenLayers.
 * Considers the current map projection and the OL built-ins EPSG:4326 and EPSG:3857 as usable.
 * @param {Object} link TileMatrixSetLink from WMTS capabilities.
 * @param {Object[]} tileMatrixSets WMTS tile matrix set definitions.
 * @returns {Boolean} True if the CRS is usable by OL.
 */
function isCrsUsable (link, tileMatrixSets) {
    const tileMatrixSet = tileMatrixSets.find(ts => ts?.Identifier === link?.TileMatrixSet);
    const crs = tileMatrixSet?.SupportedCRS;

    if (!crs) {
        return false;
    }

    const mapProjectionCode = mapCollection.getMapView("2D")?.getProjection()?.getCode() || "";

    return matchesProjectionCode(crs, mapProjectionCode)
        || matchesProjectionCode(crs, "EPSG:4326")
        || matchesProjectionCode(crs, "EPSG:3857");
}

/**
 * Selects the best WMTS tile matrix set for the current projection.
 * Prefers a match for the current map projection, then falls back to any
 * tile matrix set whose CRS is registered in OpenLayers (so that OL can
 * actually create a working tile source). Returns an empty string when no
 * usable tile matrix set is found, which causes the caller to let the
 * masterportalapi fall back to its own EPSG:3857 default.
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
        const tileMatrixSet = tileMatrixSets.find(ts => ts?.Identifier === link?.TileMatrixSet);

        return matchesProjectionCode(tileMatrixSet?.SupportedCRS, projectionCode);
    });

    if (matchingLink && isCrsUsable(matchingLink, tileMatrixSets)) {
        return matchingLink.TileMatrixSet;
    }

    const candidates = matchingLink
        ? [matchingLink, ...matrixSetLinks.filter(l => l !== matchingLink)]
        : matrixSetLinks;

    const usableLink = candidates.find(link => isCrsUsable(link, tileMatrixSets));

    const preferredLink = candidates.find(link => {
        const ts = tileMatrixSets.find(t => t?.Identifier === link?.TileMatrixSet);

        return matchesProjectionCode(ts?.SupportedCRS, "EPSG:3857");
    }) || usableLink;

    return preferredLink?.TileMatrixSet || "";
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
 * @returns {Object} Result state with discovered layer names and service title.
 */
export default async function handleWmtsFromCsw (baseUrl) {
    const capabilitiesUrl = buildWmtsCapabilitiesUrl(baseUrl),
        projectionCode = mapCollection.getMapView("2D")?.getProjection()?.getCode() || "";

    try {
        const capResponse = await axios.get(capabilitiesUrl, {timeout: 7000});

        const parser = new WMTSCapabilities();
        const capability = parser.read(capResponse.data);

        const serviceTitle = capability?.ServiceIdentification?.Title || "",
            tileMatrixSets = capability?.Contents?.TileMatrixSet || [],
            layers = capability?.Contents?.Layer || [],
            layerTitleEntries = collectWmtsLayers(layers, tileMatrixSets, projectionCode);

        const result = {
            layersAdded: layerTitleEntries.length > 0,
            serviceUnavailable: false,
            serviceTitle,
            layerNames: layerTitleEntries.map(entry => entry.name),
            layerTitleEntries,
            capabilitiesUrl
        };

        return result;
    }
    catch (capError) {
        console.error("handleWmtsFromCsw: WMTS GetCapabilities failed, layers will be empty.", capError);
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
