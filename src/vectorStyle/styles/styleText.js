import StyleModel from "./style";
import {Text, Fill, Stroke} from "ol/style.js";
import {mapAttributes} from "../../lib/attributeMapper";
import defaultStyle from "../defaultStyle";

class TextStyleModel extends StyleModel {
    constructor () {
        super();
        this.attributes = {...defaultStyle.text};
    }
    /**
     * @description Class to create ol.style/Text
     * @class TextStyleModel
     * @extends StyleModel
     * @memberof VectorStyle.Style
     * @constructs
     * @property {ol/feature} feature Feature to be styled.
     * @property {object} styles styling properties to overwrite defaults
     * @property {Boolean} isClustered Flag to show if feature is clustered.
     */

    initialize (feature, styles, isClustered) {
        this.setFeature(feature);
        this.setIsClustered(isClustered);
        this.overwriteStyling(styles);
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
            })
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
            })
        });
    }
}

export default TextStyleModel;
