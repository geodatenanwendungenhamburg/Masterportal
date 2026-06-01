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
 * Returns all descendant elements matching a localName across namespaces.
 * @param {Element|Document} root root element or document
 * @param {String} localName local element name to match
 * @returns {Element[]} matching elements
 */
function getElementsByLocalName (root, localName) {
    return Array.from(root?.getElementsByTagName("*") || [])
        .filter(node => node.localName === localName);
}

/**
 * Extracts advertised GetFeature output formats from WFS capabilities across namespace variants.
 * @param {Element|Document} capXml capabilities XML document
 * @returns {String[]} advertised output formats
 */
function getWfsOutputFormats (capXml) {
    const operationNodes = getElementsByLocalName(capXml, "Operation"),
        getFeatureOperations = operationNodes.filter(operationNode => operationNode.getAttribute("name")?.toLowerCase() === "getfeature"
        );

    const outputFormatNodes = [];

    getFeatureOperations.forEach(operationNode => {
        const parameterNodes = getElementsByLocalName(operationNode, "Parameter")
            .filter(parameterNode => parameterNode.getAttribute("name")?.toLowerCase() === "outputformat");

        parameterNodes.forEach(parameterNode => {
            outputFormatNodes.push(...getElementsByLocalName(parameterNode, "Format"));
            outputFormatNodes.push(...getElementsByLocalName(parameterNode, "Value"));
        });
    });

    if (outputFormatNodes.length > 0) {
        return outputFormatNodes
            .map(node => node.textContent?.trim())
            .filter(Boolean);
    }

    return getElementsByLocalName(capXml, "Format")
        .map(node => node.textContent?.trim())
        .filter(Boolean);
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
    let featureTypeTitles = [];

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

            const detectedFeatureTypes = getElementsByLocalName(capXml, "FeatureType")
                .map(ft => {
                    const nameEl = Array.from(ft.children).find(c => c.localName === "Name");
                    const titleEl = Array.from(ft.children).find(c => c.localName === "Title");

                    if (!nameEl?.textContent?.trim()) {
                        return null;
                    }

                    const fullName = nameEl.textContent.trim();
                    const colonIdx = fullName.indexOf(":"),
                        prefix = colonIdx !== -1 ? fullName.slice(0, colonIdx) : "",
                        featureNS = prefix ? nameEl.lookupNamespaceURI(prefix) || "" : "";
                    const title = titleEl?.textContent?.trim() || "";

                    return {name: fullName, featureNS, title};
                })
                .filter(Boolean)
                .filter((entry, index, arr) => arr.findIndex(other => other.name === entry.name) === index);

            if (detectedFeatureTypes.length > 0) {
                featureTypeTitles = detectedFeatureTypes.map(ft => ({name: ft.name, title: ft.title}));
                featureTypes = detectedFeatureTypes;
                wfsVersion = declaredVersion;

                const formats = getWfsOutputFormats(capXml);
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
        serviceTitle,
        featureTypeTitles
    };
}
