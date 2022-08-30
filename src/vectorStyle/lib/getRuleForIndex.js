import {checkProperties} from "../lib/valueOperations";
/**
 * Returning all rules that fit to the feature. Array could be empty.
 * @param {object} styleObject the styleObject with style information
 * @param {ol/feature} feature the feature to check
 * @returns {object[]} return all rules that fit to the feature
 */
export function getRulesForFeature (styleObject, feature) {
    return styleObject.rules.filter(rule => checkProperties(feature, rule));
}
/**
 * Returns the first rule that satisfies the index of the multi geometry.
 * The "sequence" must be an integer with defined min and max values representing the index range.
 * @param   {object[]} rules all rules the satisfy conditions.properties.
 * @param   {integer} index the simple geometries index
 * @returns {object|undefined} the proper rule
 */
export function getIndexedRule (rules, index) {
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
export function getRuleForIndex (rules, index) {
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