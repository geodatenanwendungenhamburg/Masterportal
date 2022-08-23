import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
import {returnColor} from "../../lib/colorConvertions";

/**
* Creates pointStyle as circle.
* all features get same circle.
* @param {Object} attributes - The attributes from the circle
* @param {Boolean} isClustered - true if features are clustered
* @returns {ol/style} - The created style.
*/
export function createCircleStyle (attributes, isClustered) {
    const radius = isClustered ? parseFloat(attributes.clusterCircleRadius, 10) : parseFloat(attributes.circleRadius, 10),
        fillcolor = isClustered ? returnColor(attributes.clusterCircleFillColor, "rgb") : returnColor(attributes.circleFillColor, "rgb"),
        strokecolor = isClustered ? returnColor(attributes.clusterCircleStrokeColor, "rgb") : returnColor(attributes.circleStrokeColor, "rgb"),
        strokewidth = isClustered ? parseFloat(attributes.clusterCircleStrokeWidth, 10) : parseFloat(attributes.circleStrokeWidth, 10);

    return new Style({
        image: new CircleStyle({
            radius: radius,
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