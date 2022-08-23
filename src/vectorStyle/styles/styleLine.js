import StyleClass from "./style";
import {Style, Stroke} from "ol/style.js";
import defaultStyle from "../defaultStyle";

class LineStringStyle extends StyleClass {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class LineStringStyle
     * @extends StyleClass
     * @memberof VectorStyle.Style
     */
    constructor () {
        super();
        this.attributes = {...defaultStyle.line};
    }

    /**
     * This function initializes the Linestring Object by setting or overwriting some attributes.
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
     * @returns {ol/style/Style} - The created style.
     */
    getStyle () {
        return new Style({
            stroke: new Stroke({
                lineCap: this.attributes.lineStrokeCap,
                lineJoin: this.attributes.lineStrokeJoin,
                lineDash: this.attributes.lineStrokeDash,
                lineDashOffset: this.attributes.lineStrokeDashOffset,
                miterLimit: this.attributes.lineStrokeMiterLimit,
                color: this.attributes.lineStrokeColor,
                width: this.attributes.lineStrokeWidth
            })
        });
    }
}

export default LineStringStyle;
