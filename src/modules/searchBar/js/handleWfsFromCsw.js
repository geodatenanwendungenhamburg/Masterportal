import axios from "axios";

/**
 * Returns trimmed text content of first element matching localName.
 * @param {Element|Document} root root element or document
 * @param {String} localName local element name to match
 * @returns {String} trimmed text content or empty string
 */
function getFirstTextByLocalName (root, localName) {
    const element = Array.from(root?.getElementsByTagName("*") || [])
        .find(node => node.localName === localName);

    return element?.textContent?.trim() || "";
}

/**
 * Handles WFS layer discovery and metadata for CSW records.
 * Tries GetCapabilities with versions 2.0.0, 1.1.0, 1.0.0 to find feature types.
 * Resolves feature namespace and selects best output format.
 * @param {String} baseUrl WFS base URL
 * @returns {Promise<Object>} Result object with featureTypes, service availability and WFS settings
 */
export default async function handleWfsFromCsw (baseUrl) {
    let featureTypes = [];
    let wfsVersion = "1.1.0";
    let wfsOutputFormat = "XML";
    let serviceUnavailable = false;
    let serviceTitle = "";

    for (const ver of ["2.0.0", "1.1.0", "1.0.0"]) {
        try {
            const capResponse = await axios.get(baseUrl, {
                params: {SERVICE: "WFS", REQUEST: "GetCapabilities", VERSION: ver},
                timeout: 7000
            });
            const capXml = capResponse.request?.responseXML
                || new DOMParser().parseFromString(capResponse.data, "application/xml");

            const rootEl = capXml.documentElement;
            const declaredVersion = rootEl?.getAttribute("version") || ver;
            const serviceEl = Array.from(capXml.getElementsByTagName("*")).find(node => node.localName === "Service"),
                serviceIdentificationEl = Array.from(capXml.getElementsByTagName("*")).find(node => node.localName === "ServiceIdentification");

            serviceTitle = getFirstTextByLocalName(serviceIdentificationEl || capXml, "Title")
                || getFirstTextByLocalName(serviceEl || capXml, "Title")
                || "";

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
            serviceUnavailable = true;
        }
    }

    return {
        featureTypes,
        wfsVersion,
        wfsOutputFormat,
        serviceUnavailable,
        serviceTitle
    };
}
