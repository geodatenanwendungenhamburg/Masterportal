import {RegularShape, Fill, Stroke, Style} from "ol/style.js";
import {returnColor} from "../../lib/colorConvertions";
import {getRotationValue} from "../point/stylePointIcon";

/**
     * Creates RegularShape Style.
     * all features get same shape styöe.
     * @param {Object} attributes - The attributes from the circle
     * @returns {ol/style} - The created RegularShape style.
     */
export function createRegularShapeStyle (attributes) {
    const radius = parseFloat(attributes.rsRadius, 10),
        radius2 = parseFloat(attributes.rsRadius2, 10),
        points = parseFloat(attributes.rsPoints, 10),
        angle = parseFloat(attributes.rsAngle, 10),
        rotation = getRotationValue(attributes.rotation),
        scale = attributes.rsScale,
        fillcolor = returnColor(attributes.rsFillColor, "rgb"),
        strokecolor = returnColor(attributes.rsStrokeColor, "rgb"),
        strokewidth = parseFloat(attributes.rsStrokeWidth, 10);

    return new Style({
        image: new RegularShape({
            radius: radius,
            radius2: radius2,
            points: points,
            scale: scale,
            rotation: rotation,
            angle: angle,
            fill: new Fill({
                color: fillcolor
            }),
            stroke: new Stroke({
                color: strokecolor,
                width: strokewidth
            })
        })
    });
}