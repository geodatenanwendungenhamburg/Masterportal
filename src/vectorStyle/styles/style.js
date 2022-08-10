import {getValueFromObjectByPath} from "../../lib/getValueFromObjectByPath";

class StyleModel {
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
                "styleObject": styleObject.attributes,
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

    /**
     * Returns input color to destinated color.
     * possible values for dest are "rgb" and "hex".
     * color has to come as hex (e.g. "#ffffff" || "#fff") or as array (e.g [255,255,255,0]) or as String ("[255,255,255,0]")
     * @param {Number[]|String} color The color to return.
     * @param {String} dest Destination color type.
     * @returns {String|Number[]} - The converted color.
     */
    returnColor (color, dest) {
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
            newColor = this.hexToRgb(newColor);
        }
        else if (src === "rgb" && dest === "hex") {
            newColor = this.rgbToHex(newColor[0], newColor[1], newColor[2]);
        }

        newColor = dest === "rgb" ? this.normalizeRgbColor(newColor) : newColor;

        return newColor;
    }

    /**
     * Converts hex value to rgbarray.
     * @param {String} hex Color as hex string.
     * @returns {Number[]} - Color als rgb array.
     */
    hexToRgb (hex) {
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
     * Converts rgb to hex.
     * @param {Number} r Red value.
     * @param {Number} g Green Value.
     * @param {Number} b Blue value.
     * @returns {String} - Hex color string.
     */
    rgbToHex (r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    /**
     * Makes sure that one rgb color always consists of four values
     * @param {Number[]} newColor Color in rgb
     * @return {Number[]} normColor
     */
    normalizeRgbColor (newColor) {
        const defaultArray = [1, 1, 1, 1];

        return newColor.concat(defaultArray).slice(0, 4);
    }

    /**
     * Converts number to hex string.
     * @param {Number} c Color value as number.
     * @returns {String} - Converted color number as hex string.
     */
    componentToHex (c) {
        const hex = Number(c).toString(16);

        return hex.length === 1 ? "0" + hex : hex;
    }
}

export default StyleModel;
