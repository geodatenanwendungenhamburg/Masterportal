/**
 * Detects service type from protocol and URL hints.
 * @param {String} protocol The protocol string from metadata.
 * @param {String} url The distribution URL from metadata.
 * @returns {String|null} The detected service type or null.
 */
export default function detectServiceType (protocol, url) {
    const serviceDefinitions = {
        WMS: {
            protocols: ["OGC:WMS", "WWW:LINK-1.0-http--ogc-wms"],
            urlHints: ["SERVICE=WMS", "/WMS"]
        },
        WFS: {
            protocols: ["OGC:WFS", "WWW:LINK-1.0-http--ogc-wfs"],
            urlHints: ["SERVICE=WFS", "/WFS"]
        }
    };

    const normalizedProtocol = protocol?.toUpperCase() || "",
        normalizedUrl = url?.toUpperCase() || "";

    for (const [serviceType, definition] of Object.entries(serviceDefinitions)) {
        if (definition.protocols.some(entry => normalizedProtocol.includes(entry.toUpperCase()))) {
            return serviceType;
        }

        if (!normalizedProtocol && definition.urlHints.some(entry => normalizedUrl.includes(entry.toUpperCase()))) {
            return serviceType;
        }
    }

    return null;
}
