/**
 * Builds and parses CSW GetRecords requests.
 * @module shared/js/api/getCswRecords
 */

const CSW_NAMESPACES = {
    "2.0.2": {
        csw: "http://www.opengis.net/cat/csw/2.0.2",
        ogc: "http://www.opengis.net/ogc",
        cswVersion: "2.0.2",
        constraintVersion: "1.1.0",
        filterPrefix: "ogc",
        anyTextElement: "PropertyName",
        anyTextValue: "AnyText",
        literalElement: "Literal"
    },
    "3.0": {
        csw: "http://www.opengis.net/cat/csw/3.0",
        fes: "http://www.opengis.net/fes/2.0",
        cswVersion: "3.0.0",
        constraintVersion: "2.0.0",
        filterPrefix: "fes",
        anyTextElement: "ValueReference",
        anyTextValue: "anyText",
        literalElement: "Literal"
    }
};

/**
 * Escapes special XML characters in a string.
 * @param {String} value The string to escape.
 * @returns {String} The escaped string.
 */
function escapeXml (value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/[^\x00-\x7F]/g, (char) => `&#x${char.codePointAt(0).toString(16)};`);
}

/**
 * Builds a CSW GetRecords XML body for a full-text (AnyText) search.
 * @param {String} searchInput The search term.
 * @param {Object} [options={}] Options for the request.
 * @param {String} [options.version="2.0.2"] CSW version ("2.0.2" or "3.0").
 * @param {Number} [options.maxRecords=10] Maximum number of records to return.
 * @param {Number} [options.startPosition=1] Start position for pagination (1-based).
 * @param {String} [options.elementSetName="summary"] Element set name ("brief", "summary", or "full").
 * @param {String} [options.typeName="gmd:MD_Metadata"] Type name for the CSW query.
 * @param {String} [options.outputSchema="http://www.isotc211.org/2005/gmd"] Output schema URI.
 * @param {String} [options.wildCard="*"] Wildcard character used in PropertyIsLike literal. Use "*" for GeoNetwork compatibility (avoids Java String.format issues with "%").
 * @returns {String} XML string for the GetRecords POST body.
 */
function buildGetRecordsXml (searchInput, {
    version = "2.0.2",
    maxRecords = 10,
    startPosition = 1,
    elementSetName = "summary",
    typeName = "gmd:MD_Metadata",
    outputSchema = "http://www.isotc211.org/2005/gmd",
    wildCard = "*"
} = {}) {
    const ns = CSW_NAMESPACES[version] || CSW_NAMESPACES["2.0.2"],
        filterPrefix = ns.filterPrefix,
        escapedInput = escapeXml(searchInput),
        literal = `${wildCard}${escapedInput}${wildCard}`;

    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

    xml += `<csw:GetRecords xmlns:csw="${ns.csw}"`;

    if (filterPrefix === "ogc") {
        xml += ` xmlns:ogc="${ns.ogc}"`;
    }
    else {
        xml += ` xmlns:fes="${ns.fes}"`;
    }

    xml += " xmlns:gmd=\"http://www.isotc211.org/2005/gmd\"";
    xml += " service=\"CSW\"";
    xml += ` version="${ns.cswVersion}"`;
    xml += " resultType=\"results\"";
    xml += ` outputSchema="${outputSchema}"`;
    xml += ` maxRecords="${maxRecords}"`;
    xml += ` startPosition="${startPosition}">`;
    xml += `<csw:Query typeNames="${typeName}">`;
    xml += `<csw:ElementSetName>${elementSetName}</csw:ElementSetName>`;
    xml += `<csw:Constraint version="${ns.constraintVersion}">`;
    xml += `<${filterPrefix}:Filter>`;
    xml += `<${filterPrefix}:PropertyIsLike wildCard="${wildCard}" singleChar="_" escapeChar="\\">`;
    xml += `<${filterPrefix}:${ns.anyTextElement}>${ns.anyTextValue}</${filterPrefix}:${ns.anyTextElement}>`;
    xml += `<${filterPrefix}:${ns.literalElement}>${literal}</${filterPrefix}:${ns.literalElement}>`;
    xml += `</${filterPrefix}:PropertyIsLike>`;
    xml += `</${filterPrefix}:Filter>`;
    xml += "</csw:Constraint>";
    xml += "</csw:Query>";
    xml += "</csw:GetRecords>";

    return xml;
}

/**
 * Parses a CSW GetRecords XML response (ISO 19139 / gmd namespace).
 * @param {String} xmlString The XML response string.
 * @returns {Object} Parsed result:
 *   { numberOfRecordsMatched: Number, numberOfRecordsReturned: Number, nextRecord: Number, records: Object[] }
 *   Each record: { fileIdentifier: String, title: String, abstract: String, boundingBox: Object|null }
 *   boundingBox: { west: Number, east: Number, south: Number, north: Number }
 */
function parseGetRecordsResponse (xmlString) {
    const parser = new DOMParser(),
        doc = parser.parseFromString(xmlString, "application/xml"),
        parseError = doc.querySelector("parsererror");

    if (parseError) {
        console.warn("getCswRecords.parseGetRecordsResponse: XML parse error.", parseError.textContent);
        return {numberOfRecordsMatched: 0, numberOfRecordsReturned: 0, nextRecord: 0, records: []};
    }

    const searchResultsEl = doc.getElementsByTagNameNS("*", "SearchResults")[0];

    if (!searchResultsEl) {
        console.warn("getCswRecords.parseGetRecordsResponse: No SearchResults element found in response.");
        return {numberOfRecordsMatched: 0, numberOfRecordsReturned: 0, nextRecord: 0, records: []};
    }

    const numberOfRecordsMatched = parseInt(searchResultsEl.getAttribute("numberOfRecordsMatched") || "0", 10),
        numberOfRecordsReturned = parseInt(searchResultsEl.getAttribute("numberOfRecordsReturned") || "0", 10),
        nextRecord = parseInt(searchResultsEl.getAttribute("nextRecord") || "0", 10),
        gmdNs = "http://www.isotc211.org/2005/gmd",
        mdMetadataElements = doc.getElementsByTagNameNS(gmdNs, "MD_Metadata"),
        records = [];

    for (let i = 0; i < mdMetadataElements.length; i++) {
        records.push(parseRecord(mdMetadataElements[i]));
    }

    return {numberOfRecordsMatched, numberOfRecordsReturned, nextRecord, records};
}

/**
 * Parses a single gmd:MD_Metadata element into a plain object.
 * @param {Element} element The MD_Metadata DOM element.
 * @returns {Object} Parsed record: { fileIdentifier, title, abstract, boundingBox }.
 */
function parseRecord (element) {
    const gmdNs = "http://www.isotc211.org/2005/gmd",
        gcoNs = "http://www.isotc211.org/2005/gco",
        srvNs = "http://www.isotc211.org/2005/srv",
        fileIdentifier = element
            .getElementsByTagNameNS(gmdNs, "fileIdentifier")[0]
            ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0]
            ?.textContent || "",
        identificationInfo = element.getElementsByTagNameNS(gmdNs, "identificationInfo")[0],
        mdIdentification = identificationInfo?.getElementsByTagNameNS(gmdNs, "MD_DataIdentification")[0]
            || identificationInfo?.getElementsByTagNameNS(srvNs, "SV_ServiceIdentification")[0],
        citationEl = mdIdentification
            ?.getElementsByTagNameNS(gmdNs, "citation")[0]
            ?.getElementsByTagNameNS(gmdNs, "CI_Citation")[0],
        title = citationEl
            ?.getElementsByTagNameNS(gmdNs, "title")[0]
            ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0]
            ?.textContent || "",
        abstract = mdIdentification
            ?.getElementsByTagNameNS(gmdNs, "abstract")[0]
            ?.getElementsByTagNameNS(gcoNs, "CharacterString")[0]
            ?.textContent || "",
        boundingBox = parseBoundingBox(mdIdentification, gmdNs, gcoNs);

    return {fileIdentifier, title, abstract, boundingBox};
}

/**
 * Parses the geographic bounding box from a MD_DataIdentification element.
 * @param {Element} identificationEl The identification DOM element.
 * @param {String} gmdNs The gmd namespace URI.
 * @param {String} gcoNs The gco namespace URI.
 * @returns {Object|null} Bounding box { west, east, south, north } or null if not found or invalid.
 */
function parseBoundingBox (identificationEl, gmdNs, gcoNs) {
    if (!identificationEl) {
        return null;
    }

    // EX_GeographicBoundingBox may be inside gmd:extent (MD_DataIdentification)
    // or srv:extent (SV_ServiceIdentification) — search without namespace prefix
    const bboxEl = identificationEl.getElementsByTagNameNS(gmdNs, "EX_GeographicBoundingBox")[0]
        || identificationEl.getElementsByTagNameNS("http://www.isotc211.org/2005/srv", "extent")[0]
            ?.getElementsByTagNameNS(gmdNs, "EX_GeographicBoundingBox")[0];

    if (!bboxEl) {
        return null;
    }

    /**
     * Reads the gco:Decimal value from a child element of the bounding box element.
     * @param {String} tagName The local name of the gmd child element.
     * @returns {Number} The parsed decimal value, or NaN if not found.
     */
    function getDecimal (tagName) {
        const el = bboxEl.getElementsByTagNameNS(gmdNs, tagName)[0];

        return parseFloat(el?.getElementsByTagNameNS(gcoNs, "Decimal")[0]?.textContent || "NaN");
    }

    const west = getDecimal("westBoundLongitude"),
        east = getDecimal("eastBoundLongitude"),
        south = getDecimal("southBoundLatitude"),
        north = getDecimal("northBoundLatitude");

    if ([west, east, south, north].some(Number.isNaN)) {
        return null;
    }

    return {west, east, south, north};
}

export default {
    buildGetRecordsXml,
    parseGetRecordsResponse
};
