import {getValueFromObjectByPath} from "../../lib/getValueFromObjectByPath";

class StyleClass {
    /**
     * @param {ol/feature} feature Feature to be styled.
     * @param {object} style styling properties to overwrite defaults
     * @param {Boolean} isClustered Flag to show if feature is clustered.
     * @constructor
     */
    constructor (feature, style, isClustered) {
        this.feature = feature;
        this.style = style;
        this.isClustered = isClustered;
        this.attributes = {};
        this.legendInfos = [];
        this.styleMultiGeomOnlyWithRule = false;
    }

    /**
     * setter for feature
     * @param {ol/feature} value the feature to set
     * @returns {void}
     */
    setFeature (value) {
        this.feature = value;
    }

    /**
     * Setter for style.
     * @param {object} value the style to set
     * @returns {void}
     */
    setStyle (value) {
        this.style = value;
    }

    /*
     * setter for styles
     * @param {object} styles styles
     * @returns {void}
     */
    overwriteStyling (styles) {
        // check if styles object is defined
        // if not, use defaults instead
        if (styles) {
            Object.keys(styles).forEach(element => {
                const value = styles[element];

                this.attributes[element] = value;
            });
        }
    }

    /**
     * setter for isClustered
     * @param {Boolean} value isClustered
     * @returns {void}
     */
    setIsClustered (value) {
        this.isClustered = value;
    }

    /**
     * returns the legend info
     * @returns {object[]} legend objects
     */
    getLegendInfos () {
        return this.legendInfos;
    }

    /**
     * Returns an id created from geometryType and conditions using encodeURIComponent.
     * @param   {string} geometryType features geometry type
     * @param   {object} rule         a rule description
     * @returns {string} id
     */
    createLegendId (geometryType, rule) {
        const properties = rule?.conditions ? rule.conditions : null;

        return encodeURIComponent(geometryType + JSON.stringify(properties));
    }

    /**
     * Returns the label or null examining some attributes. Giving precedence to "legendValue". Otherwhile creates a string out of rules conditions.
     * @param   {Object} rule conditions
     * @param   {vectorStyle/style} styleObject a vector style needed in
     * @returns {String | null} label for styleObject
     */
    createLegendLabel (rule, styleObject) {
        if (styleObject?.attributes?.legendValue) {
            return styleObject.attributes.legendValue.toString();
        }
        else if (rule?.conditions) {
            let label = "";

            if (rule.conditions?.properties) {
                label = Object.values(rule.conditions.properties).join(", ");
            }

            if (rule.conditions?.sequence
                && Array.isArray(rule.conditions.sequence)
                && rule.conditions.sequence.every(element => typeof element === "number")
                && rule.conditions.sequence.length === 2
                && rule.conditions.sequence[1] >= rule.conditions.sequence[0]) {
                label = label + " (" + rule.conditions.sequence.join("-") + ")";
            }

            return label;
        }

        return null;
    }

    /**
     * Adds a unique legendInfo for each id to vectorStyle model to be used for legend descriptions.
     * @param {string} geometryType features geometry type needed in legend model
     * @param {vectorStyle/style} styleObject  a vector style needed in
     * @param {Object} rule conditions
     * @returns {void}
     */
    addLegendInfo (geometryType, styleObject, rule) {
        const {legendInfos} = styleObject,
            id = this.createLegendId(geometryType, rule),
            hasLegendInfo = legendInfos.some(legend => {
                return legend.id === id;
            });

        if (!hasLegendInfo) {
            this.legendInfos.push({
                "id": id,
                "geometryType": geometryType,
                "styleObject": styleObject.attributes.type === "NOMINAL" ? styleObject : styleObject.attributes,
                "label": this.createLegendLabel(rule, styleObject)
            });
        }
    }

    /**
     * Returns the value of the given field. Also considers that the field can be an object path.
     * @param {Object} featureProperties Feature properties.
     * @param {String} field Field to get value.
     * @returns {*} - Value from given field.
     */
    prepareField (featureProperties, field) {
        const isPath = field.startsWith("@");
        let value = field;

        if (isPath) {
            value = getValueFromObjectByPath(featureProperties, value);
            if (typeof value === "undefined") {
                value = "undefined";
            }
        }
        else {
            value = Object.prototype.hasOwnProperty.call(featureProperties, field) ? featureProperties[field] : "undefined";
        }
        return value;
    }
}

export default StyleClass;
