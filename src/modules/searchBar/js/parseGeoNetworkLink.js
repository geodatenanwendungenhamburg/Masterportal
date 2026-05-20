import detectServiceType from "./detectServiceType.js";

/**
 * Converts a single GeoNetwork Elasticsearch `link` object into the same
 * `parsedResource` shape that `parseCswOnlineResource` returns, so the
 * existing `resolveCswServiceConfig` pipeline can be reused without changes.
 *
 * Returns `null` when the link does not represent a WMS or WFS service.
 *
 * @param {Object} link GeoNetwork ES link object.
 * @param {String} link.protocol Link protocol string (e.g. "OGC:WMS").
 * @param {String} [link.url] Link URL (GeoNetwork 3 style).
 * @param {Object} [link.urlObject] Link URL object (GeoNetwork 4 style).
 * @param {String} [link.urlObject.default] The URL from GeoNetwork 4 ES response.
 * @param {String} [link.name] Optional layer / feature-type name.
 * @returns {Object|null} parsedResource-shaped object or null.
 */
export default function parseGeoNetworkLink (link) {
    if (!link) {
        return null;
    }

    const url = link.url || link.urlObject?.default || "";

    if (!url) {
        return null;
    }

    const protocol = link.protocol || "",
        typ = detectServiceType(protocol, url);

    if (!typ) {
        return null;
    }

    const urlQuery = url.includes("?") ? url.split("?")[1] : "",
        urlParams = new URLSearchParams(urlQuery),
        urlLayerParam = urlParams.get("LAYERS") || urlParams.get("layers") || urlParams.get("Layers") || "",
        baseUrl = url.split("?")[0],
        layerName = link.name || "";

    return {
        protocol,
        url,
        layerName,
        urlLayerParam,
        baseUrl
    };
}
