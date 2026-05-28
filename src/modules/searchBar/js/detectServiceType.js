/**
 * Detects service type from protocol and URL hints.
 * @param {String} protocol The protocol string from metadata.
 * @param {String} url The distribution URL from metadata.
 * @returns {String|null} The detected service type or null.
 */
export default function detectServiceType (protocol, url) {
    const normalizedProtocol = protocol || "",
        normalizedUrl = url || "";

    const serviceMatchers = {
        OAF: {
            protocol: /(OGC:API[:-]?FEATURES|OGC:OAF|SERVICE\s*TYPE\/OGC\/(?:OAF|API-FEATURES)|WWW:LINK-1\.0-HTTP--OGC-(?:OAF|API-FEATURES)|OGC\s+API\s*-?\s*FEATURES)/i,
            // strict URL hints, avoid generic /api
            url: /(?:[?&]SERVICE=OAF\b|\/OGC\/FEATURES\b|\/COLLECTIONS(?:\/|$)|\/ITEMS(?:\/|$)|\/OAF(?:\/|$)|[_-]OAF[_-]?)/i
        },
        WMS: {
            protocol: /(OGC:WMS|WWW:LINK-1\.0-HTTP--OGC-WMS|OGC\s+WEB\s+MAP\s+SERVICE|SERVICE\s*TYPE\/OGC\/WMS)/i,
            url: /(?:[?&]SERVICE=WMS\b|\/WMS(?:\/|$)|[_-]WMS|WMS[_-])/i
        },
        WFS: {
            protocol: /(OGC:WFS|WWW:LINK-1\.0-HTTP--OGC-WFS|OGC\s+WEB\s+FEATURE\s+SERVICE|SERVICE\s*TYPE\/OGC\/WFS)/i,
            url: /(?:[?&]SERVICE=WFS\b|\/WFS(?:\/|$)|[_-]WFS|WFS[_-])/i
        },
        WMTS: {
            protocol: /(OGC:WMTS|WWW:LINK-1\.0-HTTP--OGC-WMTS|OGC\s+WEB\s+MAP\s+TILE\s+SERVICE|SERVICE\s*TYPE\/OGC\/WMTS|SERVICETYPE\/OGC\/WMTS)/i,
            url: /(?:[?&]SERVICE=WMTS(?:&|$)|\/WMTS(?:\/|$|\?|_)|[-_]WMTS(?:[-_]|$)|\/1\.0\.0\/WMTSCAPABILITIES\.XML(?:\?|$))/i
        }
    };

    let protocolMatch = null,
        urlMatch = null;

    for (const [serviceType, matcher] of Object.entries(serviceMatchers)) {
        if (!protocolMatch && matcher.protocol.test(normalizedProtocol)) {
            protocolMatch = serviceType;
        }

        if (!urlMatch && matcher.url.test(normalizedUrl)) {
            urlMatch = serviceType;
        }
    }

    if (protocolMatch && urlMatch) {
        if (protocolMatch === urlMatch) {
            return protocolMatch;
        }

        // URL is usually more explicit for WMTS/OAF endpoints when protocol metadata is generic or wrong.
        if (urlMatch === "WMTS" || urlMatch === "OAF") {
            return urlMatch;
        }

        return protocolMatch;
    }

    return protocolMatch || urlMatch;
}
