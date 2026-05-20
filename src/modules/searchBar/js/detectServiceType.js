/**
 * Detects service type from protocol and URL hints.
 * @param {String} protocol The protocol string from metadata.
 * @param {String} url The distribution URL from metadata.
 * @returns {String|null} "WMS", "WFS", or null.
 */
export default function detectServiceType (protocol, url) {
    const WMS_PROTOCOLS = ["OGC:WMS", "WWW:LINK-1.0-http--ogc-wms", "OGC Web Map Service", "serviceType/ogc/wms"],
        WFS_PROTOCOLS = ["OGC:WFS", "WWW:LINK-1.0-http--ogc-wfs", "OGC Web Feature Service", "serviceType/ogc/wfs"],
        normalizedProtocol = protocol?.toUpperCase() || "",
        normalizedUrl = url?.toUpperCase() || "";

    if (WMS_PROTOCOLS.some(p => normalizedProtocol.includes(p.toUpperCase()))) {
        return "WMS";
    }
    if (WFS_PROTOCOLS.some(p => normalizedProtocol.includes(p.toUpperCase()))) {
        return "WFS";
    }

    if (!protocol) {
        if (normalizedUrl.includes("SERVICE=WMS") || normalizedUrl.includes("/WMS") || normalizedUrl.includes("_WMS") || normalizedUrl.includes("WMS_")) {
            return "WMS";
        }
        if (normalizedUrl.includes("SERVICE=WFS") || normalizedUrl.includes("/WFS") || normalizedUrl.includes("_WFS") || normalizedUrl.includes("WFS_")) {
            return "WFS";
        }
    }

    return null;
}
