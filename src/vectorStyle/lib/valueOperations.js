import {mapAttributes, isObjectPath} from "../../lib/attributeMapper";

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
export function checkProperties (feature, rule) {
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