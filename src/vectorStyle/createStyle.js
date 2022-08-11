import {Style} from "ol/style.js";
import PointStyle from "./styles/point/stylePoint";
import TextStyle from "./styles/styleText";
import PolygonStyle from "./styles/polygon/stylePolygon";
import {drawHatch} from "./styles/polygon/polygonStyleHatch";
import LinestringStyle from "./styles/styleLine";
import CesiumStyle from "./styles/styleCesium";
import {mapAttributes, isObjectPath} from "../lib/attributeMapper";
import axios from "axios";
import getProxyUrl from "../../lib/getProxyUrl";

const legendsOfAllStyles = [],
    alreadyCapturedLegends = [],
    desiredLegends = [];

/**
 * get value without comma and into number format
 * @param   {string|number} value the parameter
 * @returns {number} the parsed value
 */
function getValueWithoutComma (value) {
    if (typeof value === "string" && value.indexOf(",") > -1) {
        return parseFloat(value.replace(",", "."));
    }

    return value;
}

/**
 * Returns the reference value. If necessary it loops through the feature properties object structure.
 * @param   {object} featureProperties properties of the feature
 * @param   {string} value attribute value or object path to check
 * @returns {void} attribute property can be of any type
 */
function getReferenceValue (featureProperties, value) {
    const valueIsObjectPath = isObjectPath(value);
    let referenceValue = value;

    // sets the real feature property value in case referenceValue is an object path
    if (valueIsObjectPath) {
        referenceValue = mapAttributes(featureProperties, referenceValue, false);
    }

    // sets the real feature property values also for min-max-arrays in case its values are object pathes.
    if (Array.isArray(referenceValue)) {
        referenceValue.forEach((element, index, arr) => {
            if (isObjectPath(element)) {
                arr[index] = mapAttributes(featureProperties, element, false);
            }
        });
    }

    return referenceValue;
}

/**
 * Compares values according to its type.
 * @param   {string|number} featureValue value to compare
 * @param   {string|number|array} referenceValue value to compare
 * @returns {Boolean} true if values equal or in range
 */
function compareValues (featureValue, referenceValue) {
    let value = featureValue;

    // plain value compare for strings
    if (typeof featureValue === "string" && typeof referenceValue === "string") {
        if (featureValue === referenceValue) {
            return true;
        }
    }

    // plain value compare for boolean
    if (typeof featureValue === "boolean" && typeof referenceValue === "boolean") {
        if (featureValue === referenceValue) {
            return true;
        }
    }

    // plain value compare trying to parse featureValue to float
    else if (typeof referenceValue === "number") {
        value = parseFloat(value);

        if (!isNaN(featureValue) && value === parseFloat(referenceValue)) {
            return true;
        }
    }
    // compare value in range
    else if (Array.isArray(referenceValue) && referenceValue.every(element => typeof element === "number" || element === null) && (referenceValue.length === 2 || referenceValue.length === 4)) {
        value = parseFloat(getValueWithoutComma(value));
        if (!isNaN(getValueWithoutComma(featureValue))) {
            // value in absolute range of numbers [minValue, maxValue]
            if (referenceValue.length === 2) {
                // do nothing
            }
            // value in relative range of numbers [minValue, maxValue, relMin, relMax]
            else if (referenceValue.length === 4) {
                value = 1 / (parseFloat(referenceValue[3], 10) - parseFloat(referenceValue[2], 10)) * (value - parseFloat(referenceValue[2], 10));
            }
            if (referenceValue[0] === null && referenceValue[1] === null) {
                // everything is in a range of [null, null]
                return true;
            }
            else if (referenceValue[0] === null) {
                // if a range [null, x] is given, x should not be included
                return value < parseFloat(referenceValue[1]);
            }
            else if (referenceValue[1] === null) {
                // if a range [x, null] is given, x should be included
                return value >= parseFloat(referenceValue[0]);
            }

            // if a range [x, y] is given, x should be included but y should not be included
            return value >= parseFloat(referenceValue[0]) && value < parseFloat(referenceValue[1]);
        }
    }
    return false;
}

/**
 * Checks one feature against one property returning true if property satisfies condition.
 * if clustering is activated, the parameter featureProperties has an array of feautures. only the first feature
 * from the array is relevant at point, because only individual features are styled here.
 * The styling of clustered features happens in another function.
 * @param   {object} featureProperties properties of the feature that has to be checked
 * @param   {string} key attribute name or object path to check
 * @param   {string|number|array} value attribute value or object path to check
 * @returns {Boolean} true if property is satisfied. Otherwhile returns false.
 */
function checkProperty (featureProperties, key, value) {
    let featureProperty = featureProperties;

    // if they are clustered features, then the first one is taken from the array
    if (typeof featureProperties === "object" && Object.prototype.hasOwnProperty.call(featureProperties, "features")) {
        if (Array.isArray(featureProperties.features) && featureProperties.features.length > 0) {
            featureProperty = featureProperties.features[0].getProperties();
        }
    }

    const featureValue = mapAttributes(featureProperty, key, false),
        referenceValue = getReferenceValue(featureProperty, value);

    if ((typeof featureValue === "boolean" || typeof featureValue === "string" || typeof featureValue === "number") && (typeof referenceValue === "boolean" || typeof referenceValue === "string" || typeof referenceValue === "number" ||
        (Array.isArray(referenceValue) && referenceValue.every(element => typeof element === "number" || element === null) &&
            (referenceValue.length === 2 || referenceValue.length === 4)))) {
        return compareValues(featureValue, referenceValue);
    }

    return false;
}

/**
 * Loops one feature through all properties returning true if all properties are satisfied.
 * Returns also true if rule has no "conditions" to check.
 * @param   {ol/feature} feature to check
 * @param {object} rule the rule to check
 * @returns {Boolean} true if all properties are satisfied
 */
function checkProperties (feature, rule) {
    if (rule?.conditions?.properties) {
        const featureProperties = feature.getProperties(),
            properties = rule.conditions.properties;
        let key,
            i;

        if (Array.isArray(properties)) {
            for (i in properties) {
                const value = properties[i].value;

                key = properties[i].attrName;

                if (checkProperty(featureProperties, key, value)) {
                    return false;
                }
            }
        }
        else {
            for (key in properties) {
                const value = properties[key];

                if (!checkProperty(featureProperties, key, value)) {
                    return false;
                }
            }
        }

        return true;
    }

    return true;
}

/**
 * Returning all rules that fit to the feature. Array could be empty.
 * @param {object} styleObject the styleObject with style information
 * @param {ol/feature} feature the feature to check
 * @returns {object[]} return all rules that fit to the feature
 */
function getRulesForFeature (styleObject, feature) {
    return styleObject.rules.filter(rule => checkProperties(feature, rule));
}
/**
 * Returns true if feature contains some kind of MultiGeometry
 * @param   {string}  geometryType     the geometry type to check
 * @returns {Boolean} is geometrytype a multiGeometry
 */
function isMultiGeometry (geometryType) {
    return geometryType === "MultiPoint" || geometryType === "MultiLineString" || geometryType === "MultiPolygon" || geometryType === "GeometryCollection" || geometryType === "Cesium";
}

/**
 * Returns the style for simple (non-multi) geometry types
 * @param   {string}  geometryType GeometryType
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object}  rule       styling rules to check.
 * @param   {Boolean} isClustered  Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style}    style is always returned
 */
function getSimpleGeometryStyle (geometryType, feature, rule, isClustered, wfsImgPathFromConfig) {
    const style = rule?.style;
    let styleObject;

    // if (style && Object.prototype.hasOwnProperty.call(style, "labelField")) {
    //     console.log("hat er label?");
    //     set("labelField", style.labelField);
    // }
    if (geometryType === "Point") {
        styleObject = new PointStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered, wfsImgPathFromConfig);
        styleObject.addLegendInfo("Point", styleObject, rule);
        return styleObject;
    }
    else if (geometryType === "LineString") {
        styleObject = new LinestringStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered);
        styleObject.addLegendInfo("LineString", styleObject, rule);
        return styleObject;
    }
    else if (geometryType === "LinearRing") {
        console.warn("Geometry type not implemented: " + geometryType);
        return new Style();
    }
    else if (geometryType === "Polygon") {
        styleObject = new PolygonStyle(feature, style, isClustered);
        styleObject.initialize(feature, style, isClustered);
        styleObject.addLegendInfo("Polygon", styleObject, rule);
        return styleObject;
    }
    else if (geometryType === "Cesium") {
        styleObject = new CesiumStyle(rule);
        styleObject.initialize(rule);
        styleObject.addLegendInfo("Cesium", styleObject, rule);
        return styleObject;
    }
    else if (geometryType === "Circle") {
        console.warn("Geometry type not implemented: " + geometryType);
        return new Style();
    }

    console.warn("Geometry type not implemented: " + geometryType);
    return new Style();
}

/**
 * Returns the first rule that satisfies the index of the multi geometry.
 * The "sequence" must be an integer with defined min and max values representing the index range.
 * @param   {object[]} rules all rules the satisfy conditions.properties.
 * @param   {integer} index the simple geometries index
 * @returns {object|undefined} the proper rule
 */
function getIndexedRule (rules, index) {
    return rules.find(rule => {
        const sequence = rule.conditions?.sequence ? rule.conditions.sequence : null,
            isSequenceValid = sequence && Array.isArray(sequence) && sequence.every(element => typeof element === "number") && sequence.length === 2 && sequence[1] >= sequence[0],
            minValue = isSequenceValid ? sequence[0] : -1,
            maxValue = isSequenceValid ? sequence[1] : -1;

        return index >= minValue && index <= maxValue;
    });
}

/**
 * Returns the best rule for the indexed feature giving precedence to the index position.
 * Otherwhile returns the rule with conditions but without a sequence definition.
 * Fallback is a rule without conditions.
 * That means also: A rule with fitting properties but without fitting sequence is never used for any multi geometry.
 * @param   {object[]} rules the rules to check
 * @param   {integer} index the index position of geometry in the multi geometry
 * @returns {object|null} the rule or null if no rule match the conditions
 */
function getRuleForIndex (rules, index) {
    const indexedRule = getIndexedRule(rules, index),
        propertiesRule = rules.find(rule => {
            return rule?.conditions && !Object.prototype.hasOwnProperty.call(rule.conditions, "sequence");
        }),
        fallbackRule = rules.find(rule => {
            return !rule?.conditions;
        });

    if (indexedRule) {
        return indexedRule;
    }
    else if (propertiesRule) {
        return propertiesRule;
    }
    else if (fallbackRule) {
        return fallbackRule;
    }

    return null;
}

/**
 * Returns an array of simple geometry styles.
 * @param   {string}  geometryType GeometryType
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object[]}  rules       styling rules to check.
 * @param   {Boolean} isClustered  Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style[]}    style array of simple geometry styles is always returned
 */
function getMultiGeometryStyle (geometryType, feature, rules, isClustered, wfsImgPathFromConfig) {
    const olStyle = [];
    let geometries = [];

    if (typeof feature === "object") {
        if (geometryType === "MultiPoint") {
            geometries = feature.getGeometry().getPoints();
        }
        else if (geometryType === "MultiLineString") {
            geometries = feature.getGeometry().getLineStrings();
        }
        else if (geometryType === "MultiPolygon") {
            geometries = feature.getGeometry().getPolygons();
        }
        else if (geometryType === "GeometryCollection") {
            geometries = feature.getGeometry().getGeometries();
        }

        geometries.forEach((geometry, index) => {
            const geometryTypeSimpleGeom = geometry.getType(),
                rule = rules ? getRuleForIndex(rules, index) : undefined,
                simpleStyle = getSimpleGeometryStyle(geometryTypeSimpleGeom, feature, rule, isClustered, wfsImgPathFromConfig);

            // For simplicity reasons we do not support multi encasulated multi geometries but ignore them.
            if (isMultiGeometry(geometryTypeSimpleGeom)) {
                console.warn("Multi encapsulated multiGeometries are not supported.");
            }
            else if (!simpleStyle.styleMultiGeomOnlyWithRule || rule) {
                olStyle.push(simpleStyle);
            }
        });
    }
    else if (geometryType === "Cesium") {
        rules.forEach(rule => {
            const simpleStyle = getSimpleGeometryStyle(geometryType, feature, rule, isClustered, wfsImgPathFromConfig);

            olStyle.push(simpleStyle);
        });
    }
    else {
        const simpleStyle = getSimpleGeometryStyle(geometryType, feature, rules, isClustered, wfsImgPathFromConfig);

        simpleStyle.getStyle().setGeometry(geometryType);
        olStyle.push(simpleStyle);
    }
    return olStyle;
}

/**
 * Returns the style for the geometry object
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object[]}  rules       styling rules to check. Array can be empty.
 * @param   {Boolean} isClustered Flag to show if feature is clustered.
 * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
 * @returns {ol/style/Style}    style is always returned
 */
export function getGeometryStyle (feature, rules, isClustered, wfsImgPathFromConfig) {
    const geometryType = feature ? feature.getGeometry().getType() : "Cesium";

    // For simple geometries the first styling rule is used.
    // That algorithm implements an OR statement between multiple valid conditions giving precedence to its order in the style.json.
    if (!isMultiGeometry(geometryType) && Object.prototype.hasOwnProperty.call(rules, 0) && Object.prototype.hasOwnProperty.call(rules[0], "style")) {
        return getSimpleGeometryStyle(geometryType, feature, rules[0], isClustered, wfsImgPathFromConfig);
    }
    // MultiGeometries must be checked against all rules because there might be a "sequence" in the condition.
    else if (isMultiGeometry(geometryType) && rules.length > 0 && rules.every(element => element?.style)) {
        return getMultiGeometryStyle(geometryType, feature, rules, isClustered, wfsImgPathFromConfig);
    }

    // fall back to default styles as configured in geomType specific styles, if no rule is matched
    console.warn("No valid styling rule found. Falling back to defaults");
    return isMultiGeometry(geometryType)
        ? getMultiGeometryStyle(geometryType, feature, undefined, isClustered, wfsImgPathFromConfig)
        : getSimpleGeometryStyle(geometryType, feature, undefined, isClustered, wfsImgPathFromConfig);
}

/**
 * Returns the style to label the object
 * @param   {ol/feature}  feature     the ol/feature to style
 * @param   {object}  style       styling rule from style.json
 * @param   {Boolean} isClustered Flag to show if feature is clustered.
 * @returns {ol/style/Text}    style is always returned
 */
function getLabelStyle (feature, style, isClustered) {
    const styleObject = new TextStyle(feature, style, isClustered);

    styleObject.initialize(feature, style, isClustered);
    return styleObject.getStyle();
}

/**
 * Function is called from layer models for each feature.
 * @param   {String}  found legendInfo of feature
 * @param   {ol/feature}  legendInformation legendInformation for the layer
 * @returns {ol/style/Style} style used in layer model
 */
function getLegendsFromStyle (found, legendInformation) {
    if (found && !found.legendInformation.find(element => element.label === legendInformation.label)) {
        found.legendInformation.push(legendInformation);
    }
    if (!desiredLegends.includes(found)) {
        desiredLegends.push(found);
    }
}

/**
     * Function is called from layer models for each feature.
     * @param   {String}  styleObject     id of the style
     * @param   {ol/feature}  feature     the feature to style
     * @param   {Boolean} isClustered is feature clustered
     * @param   {String} wfsImgPathFromConfig path to wfsImg from Config
     * @returns {ol/style/Style} style used in layer model
     */
export function createStyle (styleObject, feature, isClustered, wfsImgPathFromConfig) {
    const rules = getRulesForFeature(styleObject, feature),
        // Takes first rule in array for labeling so that is giving precedence to the order in the style.json
        style = Array.isArray(rules) && rules.length > 0 ? rules[0].style : null,
        hasLabelField = style?.labelField,
        geometryStyle = getGeometryStyle(feature, rules, isClustered, wfsImgPathFromConfig),
        legendInformation = Array.isArray(geometryStyle) ? geometryStyle[0].legendInfos[0] : geometryStyle.legendInfos[0],
        styleObjectGeometry = Array.isArray(geometryStyle) ? geometryStyle[0].getStyle() : geometryStyle.getStyle();

    if (!legendsOfAllStyles.find(element => element.id === styleObject.styleId)) {
        legendsOfAllStyles.push({id: styleObject.styleId, legendInformation: []});
    }
    else if (styleObject.styleId === "default") {
        const defaultLegends = legendsOfAllStyles.find(element => element.id === styleObject.styleId);

        if (!defaultLegends.legendInformation.find(element => element.id === legendInformation.id)) {
            defaultLegends.legendInformation.push(legendInformation);
        }
    }

    if (rules && !alreadyCapturedLegends.includes(rules[0].style.imageName)) {
        const found = legendsOfAllStyles.find(element => element.id === styleObject.styleId);

        getLegendsFromStyle(found, legendInformation);
        alreadyCapturedLegends.push(rules[0].style.imageName);
    }
    else {
        const found = legendsOfAllStyles.find(element => element.id === styleObject.styleId);

        getLegendsFromStyle(found, legendInformation);
        alreadyCapturedLegends.push(styleObject.styleId);
    }
    // label style is optional and depends on some fields
    if (isClustered || hasLabelField) {
        if (Array.isArray(styleObjectGeometry)) {
            styleObjectGeometry[0].setText(getLabelStyle(feature, style, isClustered));
        }
        else {
            styleObjectGeometry.setText(getLabelStyle(feature, style, isClustered));
        }
    }
    return styleObjectGeometry;
}

export function returnLegends () {
    return desiredLegends;
}

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
 * Creates the style objects for the layer
 * @param   {string[]} geometryType Array of geometry types
 * @returns {void}
 */
function createLegendInfo (geometryType) {
    const rules = this.get("rules");
    // eslint-disable-next-line no-unused-vars
    let styleObject,
        simpleGeom;

    geometryType.forEach(geom => rules.forEach(rule => {
        if (geom === "MultiSurface") {
            simpleGeom = "Polygon";
            styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
        }
        else if (geom.includes("Multi")) {
            simpleGeom = geom.replace("Multi", "");
            styleObject = getMultiGeometryStyle(simpleGeom, "", rule, false);
        }
        else {
            simpleGeom = geom;
            styleObject = getSimpleGeometryStyle(simpleGeom, "", rule, false);
        }
        // TODO: Was passiert hiermit? addLegendInfo(simpleGeom, styleObject, rule);
    }));
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
    /**
    * @deprecated in the next major-release!
    * useProxy
    * getProxyUrl()
    */
    let url = useProxy ? getProxyUrl(wfsURL) + "?" : wfsURL + "?";

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

/**
     * Makes sure that one rgb color always consists of four values
     * @param {Number[]} newColor Color in rgb
     * @return {Number[]} normColor
     */
function normalizeRgbColor (newColor) {
    const defaultArray = [1, 1, 1, 1];

    return newColor.concat(defaultArray).slice(0, 4);
}

/**
     * Converts hex value to rgbarray.
     * @param {String} hex Color as hex string.
     * @returns {Number[]} - Color als rgb array.
     */
function hexToRgb (hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        hexReplace = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });
    let result;

    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    result = result.exec(hexReplace);

    return result ? [parseFloat(result[1], 16), parseFloat(result[2], 16), parseFloat(result[3], 16)] : null;
}

/**
     * Converts number to hex string.
     * @param {Number} c Color value as number.
     * @returns {String} - Converted color number as hex string.
     */
function componentToHex (c) {
    const hex = Number(c).toString(16);

    return hex.length === 1 ? "0" + hex : hex;
}
/**
     * Converts rgb to hex.
     * @param {Number} r Red value.
     * @param {Number} g Green Value.
     * @param {Number} b Blue value.
     * @returns {String} - Hex color string.
     */
function rgbToHex (r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
     * Returns input color to destinated color.
     * possible values for dest are "rgb" and "hex".
     * color has to come as hex (e.g. "#ffffff" || "#fff") or as array (e.g [255,255,255,0]) or as String ("[255,255,255,0]")
     * @param {Number[]|String} color The color to return.
     * @param {String} dest Destination color type.
     * @returns {String|Number[]} - The converted color.
     */
export function returnColor (color, dest) {
    let src,
        newColor = color,
        pArray = [];

    if (Array.isArray(newColor)) {
        src = "rgb";
    }
    else if (typeof newColor === "string" && newColor.indexOf("#") === 0) {
        src = "hex";
    }
    else if (typeof newColor === "string" && newColor.indexOf("#") === -1) {
        src = "rgb";

        pArray = newColor.replace("[", "").replace("]", "").replace(/ /g, "").split(",");
        newColor = [
            pArray[0], pArray[1], pArray[2], pArray[3]
        ];
    }

    if (src === "hex" && dest === "rgb") {
        newColor = hexToRgb(newColor);
    }
    else if (src === "rgb" && dest === "hex") {
        newColor = rgbToHex(newColor[0], newColor[1], newColor[2]);
    }

    newColor = dest === "rgb" ? normalizeRgbColor(newColor) : newColor;

    return newColor;
}

/**
     * Generates a polygon fill pattern.
     * @param {object} params parameters as defined in style.json.md#Polygon.polygonFillHatch
     * @returns {HTMLCanvasElement} contains polygon fill pattern
     */
function getPolygonFillHatch ({
    pattern = "diagonal",
    size = 30,
    lineWidth = 10,
    backgroundColor = [0, 0, 0, 1],
    patternColor = [255, 255, 255, 1]
}) {
    const canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

    canvas.width = size;
    canvas.height = size;

    context.fillStyle = `rgba(${backgroundColor.join(",")})`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = lineWidth;
    context.strokeStyle = `rgba(${patternColor.join(",")})`;

    drawHatch(context, size, pattern);

    context.fillStyle = context.createPattern(canvas, "repeat");

    return canvas;
}

export function getPolygonFillHatchLegendDataUrl (style) {
    const originalCanvas = getPolygonFillHatch(style.polygonFillHatch),
        strokeColor = returnColor(style.polygonStrokeColor, "hex"),
        strokeWidth = parseInt(style.polygonStrokeWidth, 10),
        strokeOpacity = style.polygonStrokeColor[3].toString() || 0,
        legendCanvas = document.createElement("canvas"),
        legendContext = legendCanvas.getContext("2d"),
        halfStroke = strokeWidth / 2,
        doubleStroke = strokeWidth * 2;

    legendCanvas.width = originalCanvas.width + doubleStroke;
    legendCanvas.height = originalCanvas.height + doubleStroke;

    legendContext.drawImage(originalCanvas,
        strokeWidth,
        strokeWidth);

    legendContext.lineCap = "round";
    legendContext.lineJoin = "round";
    legendContext.strokeStyle = strokeColor;
    legendContext.lineWidth = strokeWidth;
    legendContext.globalAlpha = strokeOpacity;

    legendContext.strokeRect(halfStroke,
        halfStroke,
        legendCanvas.width - strokeWidth,
        legendCanvas.height - strokeWidth);

    return legendCanvas.toDataURL();
}
