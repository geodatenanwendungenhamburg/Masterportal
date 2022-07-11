import StyleModel from "./style";
import {Style, Stroke} from "ol/style.js";
import defaultStyle from "../defaultStyle";

class LinestringStyleModel extends StyleModel {
    constructor () {
        super();
        this.attributes = {...defaultStyle.line};
    }

    initialize (feature, styles, isClustered) {
        this.setFeature(feature);
        this.setIsClustered(isClustered);
        this.overwriteStyling(styles);
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

export default LinestringStyleModel;
