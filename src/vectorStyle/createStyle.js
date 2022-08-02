import {Style} from "ol/style.js";
import PointStyle from "./styles/point/stylePoint";
import TextStyle from "./styles/styleText";
import PolygonStyle from "./styles/stylePolygon";
import LinestringStyle from "./styles/styleLine";
import CesiumStyle from "./styles/styleCesium";
import {mapAttributes, isObjectPath} from "../lib/attributeMapper";

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
    //     this.set("labelField", style.labelField);
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
function getGeometryStyle (feature, rules, isClustered, wfsImgPathFromConfig) {
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
        styleObjectGeometry = Array.isArray(geometryStyle) ? geometryStyle[0].getStyle() : geometryStyle.getStyle();

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
