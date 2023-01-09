import StyleClass from "./style";
import defaultStyle from "./defaultStyles";
class CesiumStyle extends StyleClass {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class CesiumStyleMode
     * @extends StyleClass
     * @memberof VectorStyle.Style
     */
    constructor () {
        super();
        this.attributes = {...defaultStyle.point};
        this.conditions = [];
    }

    /**
     * This function initializes the Linestring Object by setting or overwriting some attributes.
     * @param {ol/feature} rule styling rule of the feature.
     * @returns {void}
     */
    initialize (rule) {
        this.overwriteStyling(rule.style);
        this.setConditions(rule.conditions);
        this.setStyle(this.getStyle());
    }

    /**
     * This function returns a style for each feature.
     * @returns {ol/style} - The created style.
     */
    getStyle () {
        return this.createCondition(this.get("conditions"), this.get("style"));
    }

    /**
     * Creates the cesium tile style conditions.
     * @param {Object} conditions Condition.
     * @param {Object} style Style.
     * @returns {*} - Condition for cesium 3d tile style.
     */
    createCondition (conditions, style) {
        const {color} = style,
            condition = [];
        let ruleCondition;

        if (conditions && Object.keys(conditions).length > 0) {
            Object.keys(conditions).forEach(key => {
                const value = conditions[key];

                condition.push([key, value]);
            });
            ruleCondition = [this.createCesiumConditionForRule(condition), color];
        }
        else {
            ruleCondition = ["true", color];
        }
        return ruleCondition;
    }

    /**
     * Creates a cesium condition.
     * @param {*} conditions Conditions.
     * @returns {String[]} - Cesium condition for rule.
     */
    createCesiumConditionForRule (conditions) {
        let cesiumCondition = [],
            singleCondition = "";

        conditions.forEach(condition => {
            const cesiumKey = "${" + condition[0] + "}";
            let value = condition[1],
                minValue,
                maxValue;

            if (Array.isArray(value)) {
                minValue = value[0];
                maxValue = value[1];
                singleCondition = "(" + cesiumKey + " > " + minValue + " && " + cesiumKey + " <= " + maxValue + ")";
            }
            else {
                if (typeof value === "string") {
                    value = "'" + value + "'";
                }
                singleCondition = "(" + cesiumKey + " === " + value + ")";
            }

            cesiumCondition.push(singleCondition);
        });

        cesiumCondition = "(" + cesiumCondition.join(" && ") + ")";

        return cesiumCondition;
    }

    /**
     * Setter for attribute "conditions"
     * @param {*} conditions conditions
     * @returns {void}
     */
    setConditions (conditions) {
        this.attributes.conditions = conditions;
    }
}

export default CesiumStyle;
