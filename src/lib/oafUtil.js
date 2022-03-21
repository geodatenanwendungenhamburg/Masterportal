
/**
 * Parsing the responseString from OAF with wfs standard format if the output format is xml
 * @param {String} responseString the response from OAF in xml or Geojson format
 * @param {String} outputFormat the output Format
 * @returns {String} The output in standard format.
 */
function getParsedResponse (responseString, outputFormat) {
    if (outputFormat !== "xml") {
        return responseString;
    }

    const xmlDoc = new DOMParser().parseFromString(responseString, "text/xml"),
        sfCollectionElement = xmlDoc.getElementsByTagName("sf:FeatureCollection"),
        sfMemberElement = xmlDoc.getElementsByTagName("sf:featureMember");

    let parsedString = "",
        wfsCollectionElement;

    if (sfCollectionElement.length) {
        parsedString = document.implementation.createDocument("http://www.opengis.net/wfs", "wfs:FeatureCollection", null);
        wfsCollectionElement = parsedString.getElementsByTagName("wfs:FeatureCollection")[0];

        wfsCollectionElement.setAttribute("xmlns:gml", "http://www.opengis.net/gml");
        wfsCollectionElement.setAttribute("timeStamp", new Date(Date.now()).toISOString());

        for (let i = 0; i < sfCollectionElement[0].attributes.length; i++) {
            const attributeVal = sfCollectionElement[0].attributes[i];

            if (attributeVal.nodeName !== "xmlns:sf") {
                wfsCollectionElement.setAttribute(attributeVal.nodeName, attributeVal.nodeValue);
            }
        }
    }

    if (sfMemberElement.length) {
        Array.prototype.forEach.call(sfMemberElement, member => {
            const wfsMemberElement = parsedString.createElement("gml:featureMember");

            for (let i = 0; i < member.childNodes.length; i++) {
                const childNodeName = member.childNodes[i].nodeName,
                    wfsMemberChildElement = member.getElementsByTagName(childNodeName)[0];

                if (wfsMemberChildElement instanceof Element || wfsMemberChildElement instanceof HTMLDocument) {
                    wfsMemberElement.appendChild(wfsMemberChildElement);
                }
            }

            wfsCollectionElement.appendChild(wfsMemberElement);
        });
    }

    if (parsedString !== "") {
        parsedString = new XMLSerializer().serializeToString(parsedString).replace(new RegExp("http://www.opengis.net/gml/3.2", "g"), "http://www.opengis.net/gml");
    }

    return parsedString;
}

/**
 * Getting the output format json or xml, the default is json.
 * @param {String} format the output format from rawlayer
 * @returns {String} The output format.
 */
function getOutputFormat (format) {
    if (format === "xml") {
        return format;
    }
    return "json";
}
/**
 * Parsing the params object in to string for url
 * @param {Object} params the paramters in object
 * @returns {String} The url parameters in string format
 */
function getParamsUrl (params) {
    if (!params || typeof params !== "object" || params.constructor !== Object || !Object.keys(params).length) {
        return "";
    }

    let paramsUrl = "";

    Object.entries(params).forEach(([key, value]) => {
        paramsUrl += "&" + key + "=" + value;
    });

    return paramsUrl;
}

export {
    getParsedResponse,
    getOutputFormat,
    getParamsUrl
};
