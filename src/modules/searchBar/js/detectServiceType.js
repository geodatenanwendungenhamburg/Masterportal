/**
 * Detects service type from protocol and URL hints.
 * @param {String} protocol The protocol string from metadata.
 * @param {String} url The distribution URL from metadata.
 * @returns {String|null} The detected service type or null.
 */
export default function detectServiceType (protocol, url) {
    const serviceDefinitions = {
        WMS: {
            protocols: [
                "OGC:WMS",
                "WWW:LINK-1.0-http--ogc-wms",
                "OGC Web Map Service",
                "serviceType/ogc/wms"
            ],
            urlHints: ["SERVICE=WMS", "/WMS", "_WMS", "WMS_"]
        },
        WFS: {
            protocols: [
                "OGC:WFS",
                "WWW:LINK-1.0-http--ogc-wfs",
                "OGC Web Feature Service",
                "serviceType/ogc/wfs"
            ],
            urlHints: ["SERVICE=WFS", "/WFS", "_WFS", "WFS_"]
        }
    };

    const normalizedProtocol = protocol?.toUpperCase() || "",
        normalizedUrl = url?.toUpperCase() || "";

    for (const [serviceType, definition] of Object.entries(serviceDefinitions)) {
        if (definition.protocols.some(entry => normalizedProtocol.includes(entry.toUpperCase()))) {
            return serviceType;
        }

        if (definition.urlHints.some(entry => normalizedUrl.includes(entry.toUpperCase()))) {
            return serviceType;
        }
    }

    return null;
}
