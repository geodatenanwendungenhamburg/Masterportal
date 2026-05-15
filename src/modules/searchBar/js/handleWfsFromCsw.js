import axios from "axios";

/**
 * Handles WFS layer discovery and metadata for CSW records.
 * Tries GetCapabilities with versions 2.0.0, 1.1.0, 1.0.0 to find feature types.
 * Resolves feature namespace and selects best output format.
 * @param {String} baseUrl WFS base URL
 * @returns {Promise<Object|null>} Object with {featureTypes, wfsVersion, wfsOutputFormat} or null if failed
 */
export default async function handleWfsFromCsw (baseUrl) {
    let featureTypes = [];
    let wfsVersion = "1.1.0";
    let wfsOutputFormat = "XML";

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

            // Collect FeatureTypes — names may carry namespace prefixes
            const detectedFeatureTypes = Array.from(capXml.getElementsByTagName("FeatureType"))
                .map(ft => {
                    const nameEl = Array.from(ft.children).find(c => c.localName === "Name");

                    if (!nameEl?.textContent?.trim()) {
                        return null;
                    }

                    const fullName = nameEl.textContent.trim();
                    const colonIdx = fullName.indexOf(":"),
                        prefix = colonIdx !== -1 ? fullName.slice(0, colonIdx) : "",
                        featureNS = prefix ? nameEl.lookupNamespaceURI(prefix) || "" : "";

                    return {name: fullName, featureNS};
                })
                .filter(Boolean)
                .filter((entry, index, arr) => arr.findIndex(other => other.name === entry.name) === index);

            if (detectedFeatureTypes.length > 0) {
                featureTypes = detectedFeatureTypes;
                wfsVersion = declaredVersion;

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

    return featureTypes.length > 0 ? {featureTypes, wfsVersion, wfsOutputFormat} : null;
}
