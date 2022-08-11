import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
import {returnColor} from "../../createStyle";

/**
* Creates circleClusterStyle.
* all clustered features get same circle.
* @param {Object} attributes - The attributes from the circle cluster
* @returns {ol/style} - The created style.
*/
export function createCircleClusterStyle (attributes) {
    const radius = parseFloat(attributes.clusterCircleRadius, 10),
        fillcolor = returnColor(attributes.clusterCircleFillColor, "rgb"),
        strokecolor = returnColor(attributes.clusterCircleStrokeColor, "rgb"),
        strokewidth = parseFloat(attributes.clusterCircleStrokeWidth, 10);

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

/**
* Creates circlePointStyle.
* all features get same circle.
* @param {Object} attributes - The attributes from the circle
* @returns {ol/style} - The created style.
*/
export function createCirclePointStyle (attributes) {
    const radius = parseFloat(attributes.circleRadius, 10),
        fillcolor = returnColor(attributes.circleFillColor, "rgb"),
        strokecolor = returnColor(attributes.circleStrokeColor, "rgb"),
        strokewidth = parseFloat(attributes.circleStrokeWidth, 10);

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