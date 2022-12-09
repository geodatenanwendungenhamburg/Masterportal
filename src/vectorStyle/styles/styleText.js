import StyleClass from "./style";
import {Text, Fill, Stroke} from "ol/style.js";
import {mapAttributes} from "../../lib/attributeMapper";
import {prepareValue, isObjectPath} from "../../lib/attributeMapper";
import defaultStyle from "../defaultStyle";

class TextStyle extends StyleClass {
    /**
     * @description Class to create ol.style/Text
     * @class TextStyle
     * @constructor
     * @extends StyleClass
     * @memberof VectorStyle.Style
     */
    constructor () {
        super();
        this.attributes = {...defaultStyle.text};
    }

    /**
    * This function initializes the styleText Object by setting or overwriting some attributes.
    * @param {ol/feature} feature Feature to be styled.
    * @param {object} styles styling properties to overwrite defaults
    * @param {Boolean} isClustered Flag to show if feature is clustered.
    * @returns {void}
    */
    initialize (feature, styles, isClustered) {
        this.setFeature(feature);
        this.setIsClustered(isClustered);
        this.overwriteStyling(styles);
        this.setStyle(this.getStyle());
    }

    /**
    * This function returns a style for each feature.
    * @returns {ol/style} - The created style.
    */
    getStyle () {
        const isClustered = this.isClustered,
            feature = this.feature,
            labelField = this.labelField;

        if (isClustered && feature.get("features")?.length > 1 && this.attributes.clusterTextType !== "none") {
            return this.createClusteredTextStyle();
        }
        else if (labelField) {
            return this.createLabeledTextStyle();
        }

        return new Text();
    }

    /**
     * Returns the rotation value and its corresponding value according to style.json.
     * @param {Object} rotation - The rotation object from the style.json
     * @param {Object} featureValues - The values object from the feature
     * @returns {number} - The rotation value in degrees or radiants.
     */
    getRotationValue (rotation, featureValues) {
        if (typeof rotation === "object") {
            const {value, isDegree} = rotation;

            if (isObjectPath(value) && featureValues !== undefined) {
                const rotationValueFromService = parseInt(prepareValue(featureValues, value), 10);

                return isDegree ? rotationValueFromService * Math.PI / 180 : rotationValueFromService;
            }
            return isDegree ? parseInt(value, 10) * Math.PI / 180 : parseInt(value, 10);
        }
        return 0;
    }

    /**
    * Creates text style for clustered features. The text attribute is set according to "clusterTextType".
    * "clusterTextType" === "counter" sets the number of clustered features.
    * "clusterTextType" === "text" sets the value of "clusterText" or "undefined".
    * @returns {ol/style/Text} - The created style.
    */
    createClusteredTextStyle () {
        const feature = this.feature;
        let text;

        if (this.attributes.clusterTextType === "counter") {
            text = feature.get("features").length.toString();
        }
        else if (this.attributes.clusterTextType === "text" && typeof this.attributes.clusterText === "string") {
            text = this.attributes.clusterText;
        }
        else {
            text = "undefined";
        }

        return new Text({
            text: text,
            textAlign: this.attributes.clusterTextAlign,
            offsetX: this.attributes.clusterTextOffsetX,
            offsetY: this.attributes.clusterTextOffsetY,
            font: this.attributes.clusterTextFont,
            scale: this.attributes.clusterTextScale,
            fill: new Fill({
                color: this.attributes.clusterTextFillColor
            }),
            stroke: new Stroke({
                color: this.attributes.clusterTextStrokeColor,
                width: this.attributes.clusterTextStrokeWidth
            }),
            rotation: this.getRotationValue(this.attributes.rotation, feature.getProperties())
        });
    }

    /**
    * Creates text style for simple features. The text attribute is set using "labelField".
    * @returns {ol/style/Text} - The created style.
    */
    createLabeledTextStyle () {
        const feature = this.feature,
            featureProperties = feature.getProperties(),
            textSuffix = this.attributes.textSuffix;
        let text = mapAttributes(featureProperties, this.attributes.labelField, false);

        if (textSuffix !== "") {
            text = text + " " + textSuffix;
        }
        return new Text({
            text: text.toString(),
            textAlign: this.attributes.textAlign,
            offsetX: this.attributes.textOffsetX,
            offsetY: this.attributes.textOffsetY,
            font: this.attributes.textFont,
            scale: this.attributes.textScale,
            fill: new Fill({
                color: this.attributes.textFillColor
            }),
            stroke: new Stroke({
                color: this.attributes.textStrokeColor,
                width: this.attributes.textStrokeWidth
            }),
            rotation: this.getRotationValue(this.attributes.rotation, featureProperties)
        });
    }
}

export default TextStyle;
