import axios from "axios";

/**
 * Handles WFS layer discovery and metadata for CSW records.
 * Tries GetCapabilities with versions 2.0.0, 1.1.0, 1.0.0 to find first feature type.
 * Resolves feature namespace and selects best output format.
 * @param {String} baseUrl WFS base URL
 * @returns {Promise<Object|null>} Object with {effectiveLayerName, wfsVersion, wfsOutputFormat, wfsFeatureNS} or null if failed
 */
export default async function handleWfsFromCsw (baseUrl) {
    let effectiveLayerName = null;
    let wfsVersion = "1.1.0";
    let wfsOutputFormat = "XML";
    let wfsFeatureNS = "";

    for (const ver of ["2.0.0", "1.1.0", "1.0.0"]) {
        try {
            const capResponse = await axios.get(baseUrl, {
                params: {SERVICE: "WFS", REQUEST: "GetCapabilities", VERSION: ver}
            });
            const capXml = capResponse.request?.responseXML
                || new DOMParser().parseFromString(capResponse.data, "application/xml");

            // Read declared version from root element attribute
            const rootEl = capXml.documentElement;
            const declaredVersion = rootEl?.getAttribute("version") || ver;

            // Collect first FeatureType — name may carry a namespace prefix
            // e.g. <Name xmlns:plu="http://...">plu:OfficialDocumentation</Name>
            const firstFt = Array.from(capXml.getElementsByTagName("FeatureType"))
                .find(ft => {
                    const nameEl2 = Array.from(ft.children).find(c => c.localName === "Name");

                    return nameEl2?.textContent?.trim().length > 0;
                });

            if (firstFt) {
                const nameEl2 = Array.from(firstFt.children).find(c => c.localName === "Name");
                const fullName = nameEl2.textContent.trim();

                effectiveLayerName = fullName;
                wfsVersion = declaredVersion;

                // Resolve featureNS from the namespace prefix on the Name element.
                // e.g. <Name xmlns:plu="http://inspire.ec.europa.eu/schemas/plu/4.0">plu:OfficialDocumentation</Name>
                // → prefix="plu", featureNS="http://inspire.ec.europa.eu/schemas/plu/4.0"
                const colonIdx = fullName.indexOf(":");

                if (colonIdx !== -1) {
                    const prefix = fullName.slice(0, colonIdx),
                        resolvedNs = nameEl2.lookupNamespaceURI(prefix);

                    wfsFeatureNS = resolvedNs || wfsFeatureNS;
                }

                // Detect the best supported output format
                const formats = Array.from(capXml.getElementsByTagName("Format"))
                    .map(f => f.textContent?.trim())
                    .filter(Boolean);
                const preferredFormats = [
                    "application/gml+xml; version=3.2",
                    "text/xml; subtype=gml/3.2.1",
                    "text/xml; subtype=gml/3.1.1",
                    "GML32",
                    "GML3",
                    "GML2",
                    "XML"
                ];

                wfsOutputFormat = preferredFormats.find(f => formats.some(cf => cf.toLowerCase() === f.toLowerCase()))
                    || formats[0]
                    || wfsOutputFormat;
                break;
            }
        }
        catch (capError) {
            // Try next version
        }
    }

    return effectiveLayerName ? {effectiveLayerName, wfsVersion, wfsOutputFormat, wfsFeatureNS} : null;
}
