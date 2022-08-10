import StyleModel from "./style";
import {Style, Fill, Stroke} from "ol/style.js";
import defaultStyle from "../defaultStyle";

class PolygonStyleModel extends StyleModel {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class PolygonStyleModel
     * @extends StyleModel
     * @memberof VectorStyle.Style
     */
    constructor () {
        super();
        this.attributes = {...defaultStyle.polygon};
    }

    /**
     * This function initializes the stylePolygon Object by setting or overwriting some attributes.
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
        return new Style({
            stroke: new Stroke({
                lineCap: this.attributes.polygonStrokeCap,
                lineJoin: this.attributes.polygonStrokeJoin,
                lineDash: this.attributes.polygonStrokeDash,
                lineDashOffset: this.attributes.polygonStrokeDashOffset,
                miterLimit: this.attributes.polygonStrokeMiterLimit,
                color: this.attributes.polygonStrokeColor,
                width: this.attributes.polygonStrokeWidth
            }),
            fill: new Fill({
                color: this.attributes.polygonFillColor
            })
        });
    }
}

export default PolygonStyleModel;
