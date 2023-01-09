import StyleClass from "../style";
import {Style, Fill, Stroke} from "ol/style.js";
import defaultStyle from "../defaultStyles";
import {drawHatch} from "./polygonStyleHatch";
import {returnColor} from "../../lib/colorConvertions";

class PolygonStyle extends StyleClass {
    /**
     * @description Class to create ol.style.Style
     * @constructor
     * @class PolygonStyle
     * @extends StyleClass
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
        const polygonFillColor = this.attributes.polygonFillColor,
            polygonFillHatch = this.attributes.polygonFillHatch;

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
            fill: new Fill({color:
                polygonFillHatch
                    ? this.getPolygonFillHatch(polygonFillHatch)
                        .getContext("2d")
                        .fillStyle
                    : polygonFillColor
            })
        });
    }

    /**
     * Generates a polygon fill pattern.
     * @param {object} params parameters as defined in style.json.md#Polygon.polygonFillHatch
     * @returns {HTMLCanvasElement} contains polygon fill pattern
     */
    getPolygonFillHatch ({
        pattern = "diagonal",
        size = 30,
        lineWidth = 10,
        backgroundColor = [0, 0, 0, 1],
        patternColor = [255, 255, 255, 1]
    }) {
        const canvas = document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        context.fillStyle = `rgba(${backgroundColor.join(",")})`;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.lineWidth = lineWidth;
        context.strokeStyle = `rgba(${patternColor.join(",")})`;

        drawHatch(context, size, pattern);

        context.fillStyle = context.createPattern(canvas, "repeat");

        return canvas;
    }

    getPolygonFillHatchLegendDataUrl (style) {
        const originalCanvas = this.getPolygonFillHatch(style.polygonFillHatch),
            strokeColor = returnColor(style.polygonStrokeColor, "hex"),
            strokeWidth = parseInt(style.polygonStrokeWidth, 10),
            strokeOpacity = style.polygonStrokeColor[3].toString() || 0,
            legendCanvas = document.createElement("canvas"),
            legendContext = legendCanvas.getContext("2d"),
            halfStroke = strokeWidth / 2,
            doubleStroke = strokeWidth * 2;

        legendCanvas.width = originalCanvas.width + doubleStroke;
        legendCanvas.height = originalCanvas.height + doubleStroke;

        legendContext.drawImage(originalCanvas,
            strokeWidth,
            strokeWidth);

        legendContext.lineCap = "round";
        legendContext.lineJoin = "round";
        legendContext.strokeStyle = strokeColor;
        legendContext.lineWidth = strokeWidth;
        legendContext.globalAlpha = strokeOpacity;

        legendContext.strokeRect(halfStroke,
            halfStroke,
            legendCanvas.width - strokeWidth,
            legendCanvas.height - strokeWidth);

        return legendCanvas.toDataURL();
    }
}

export default PolygonStyle;
