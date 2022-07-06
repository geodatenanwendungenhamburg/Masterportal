import {getValueFromObjectByPath} from "../../lib/getValueFromObjectByPath";

class StyleModel {
    constructor(feature, style, isClustered) {
        this.feature = feature;
        this.style = style;
        this.isClustered = isClustered;
        this.attributes = {}
    }

    /*
    * setter for feature
    * @param {ol/feature} value feature
    * @returns {void}
    */
    setFeature (value) {
        this.feature = value;
    }

    /*
    * setter for isClustered
    * @param {Boolean} value isClustered
    * @returns {void}
    */
    setIsClustered (value) {
        this.isClustered = value;
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
};

export default StyleModel;
