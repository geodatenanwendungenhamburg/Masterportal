import axios from "axios";
import {createLegendInfo} from "./createLegendInfo";

/**
 * Parses the xml with another structure to get the subelements from the layer
 * @param   {string} xml response xml
 * @param   {string} featureType wfs feature type from layer without namespace
 * @returns {object[]} subElements of the xml element
 */
function getSubelementsFromXMLOtherStructure (xml, featureType) {
    const elements = xml ? Array.from(xml.getElementsByTagName("element")) : [];
    let subElements = [];

    elements.forEach(element => {
        if (element.getAttribute("name") === featureType) {
            const sibling = element.nextElementSibling;

            if (sibling && sibling.tagName === "complexType" && sibling.hasAttribute("name")) {
                subElements = Array.from(sibling.getElementsByTagName("element"));
            }
        }
    });
    return subElements;
}

/**
 * Parses the xml to get the subelements from the layer
 * @param   {string} xml response xml
 * @param   {string} featureType wfs feature type from layer. Namespace is taken into account.
 * @returns {object[]} subElements of the xml element
 */
function getSubelementsFromXML (xml, featureType) {
    const elements = xml ? Array.from(xml.getElementsByTagName("element")) : [];
    let subElements = [],
        featureTypeWithoutNamespace = featureType;

    if (featureType && featureType.indexOf(":") > -1) {
        featureTypeWithoutNamespace = featureType.substr(featureType.indexOf(":") + 1, featureType.length);
    }

    elements.forEach(element => {
        if (element.getAttribute("name") === featureTypeWithoutNamespace) {
            subElements = Array.from(element.getElementsByTagName("element"));
        }
    });
    if (subElements.length === 0) {
        subElements = getSubelementsFromXMLOtherStructure(xml, featureTypeWithoutNamespace);
    }
    return subElements;
}

/**
 * Parses the geometry types from the subelements
 * @param   {Object[]} [subElements=[]] xml subelements
 * @param   {String[] | String} [styleGeometryType=null] The configured geometry type of the layer
 * @returns {String[]} geometry types of the layer
 */
function getTypeAttributesFromSubelements (subElements = [], styleGeometryType = null) {
    const geometryType = [];

    subElements.forEach(elements => {
        const typeAttribute = elements.getAttribute("type");
        let geomType = styleGeometryType;

        if (typeAttribute && typeAttribute.includes("gml")) {
            geomType = styleGeometryType || typeAttribute.split("gml:")[1].replace("PropertyType", "");
            if (geomType === "Geometry") {
                geometryType.push("Point");
                geometryType.push("Polygon");
                geometryType.push("LineString");
            }
            else if (Array.isArray(geomType)) {
                geomType.forEach(singleGeomType => geometryType.push(singleGeomType));
            }
            else {
                geometryType.push(geomType);
            }
        }
    });
    return geometryType;
}
/**
* Requests the DescribeFeatureType of the wfs layer and starts the function to parse the xml and creates the legend info
* @param   {string} wfsURL url from layer
* @param   {string} version wfs version from layer
* @param   {string} featureType wfs feature type from layer
* @param   {string[] | string} styleGeometryType The configured geometry type of the layer
* @param   {Boolean} useProxy Attribute to request the URL via a reverse proxy
* @param {function} [callback] - called with services after loaded; called with false and error on error
* @returns {void}
*/
export function getGeometryTypeFromWFS (wfsURL, version, featureType, styleGeometryType, useProxy, callback) {
    const params = {
        "SERVICE": "WFS",
        "VERSION": version,
        "REQUEST": "DescribeFeatureType"
    };
    let url = wfsURL + "?";

    Object.keys(params).forEach(key => {
        url += key + "=" + params[key] + "&";
    });
    url = url.slice(0, -1);


    axios({
        method: "get",
        url: url,
        // headers: {"Content-Type'": "text/xml"},
        responseType: "document"
    }).then(response => {
        const subElements = getSubelementsFromXML(response.data, featureType),
            geometryTypes = getTypeAttributesFromSubelements(subElements, styleGeometryType);

        createLegendInfo(geometryTypes);
    }).catch(error => {
        console.warn("The fetch of the data failed with the following error message: " + error);
        return callback(error);
    });
}

/**
 * Requests the DescribeFeatureType of the secured wfs layer and starts the function to parse the xml and creates the legend info
 * @param   {string} wfsURL url from layer
 * @param   {string} version wfs version from layer
 * @param   {string} featureType wfs feature type from layer
 * @param   {string[] | string} styleGeometryType The configured geometry type of the layer
 * @param {function} [callback] - called with services after loaded; called with false and error on error
 * @returns {void}
 */
export function getGeometryTypeFromSecuredWFS (wfsURL, version, featureType, styleGeometryType, callback) {
    const params = {
        "SERVICE": "WFS",
        "VERSION": version,
        "REQUEST": "DescribeFeatureType"
    };
    let url = wfsURL + "?";

    Object.keys(params).forEach(key => {
        url += key + "=" + params[key] + "&";
    });
    url = url.slice(0, -1);

    axios({
        method: "GET",
        url: url,
        withCredentials: true,
        responseType: "text"
    })
        .then(responseAsString => new window.DOMParser().parseFromString(responseAsString, "text/xml"))
        .then(responseXML => {
            const subElements = getSubelementsFromXML(responseXML, featureType),
                geometryTypes = getTypeAttributesFromSubelements(subElements, styleGeometryType);

            createLegendInfo(geometryTypes);
        })
        .catch(error => {
            console.warn("The fetch of the data failed with the following error message: " + error);
            return callback(error);
        });
}

/**
 * Requests the geometry type of the OAF collection and creates the legend info
 * @param   {string} oafURL url from layer
 * @param   {String} collection the collection name to fetch geometry type for
 * @param {function} [callback] - called with services after loaded; called with false and error on error
 * @returns {void}
 */
export function getGeometryTypeFromOAF (oafURL, collection, callback) {
/**
 * @deprecated in the next major-release!
 * useProxy
 * getProxyUrl()
 */
    const url = oafURL + "/collections/" + collection + "/items?limit=1";

    axios({
        method: "get",
        url: url,
        headers: {
            accept: "application/geo+json"
        }
    }).then(response => {
        const geometryType = response.data?.features[0]?.geometry?.type;

        if (geometryType) {
            createLegendInfo([geometryType]);
        }
    }).catch(error => {
        console.warn("The fetch of the data failed with the following error message: " + error);
        return callback(error);
    });
}