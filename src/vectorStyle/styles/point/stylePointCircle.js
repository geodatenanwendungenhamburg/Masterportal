import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
/**
    * Creates circleClusterStyle.
    * all clustered features get same circle.
    * @returns {ol/style} - The created style.
    */
export function createCircleClusterStyle () {
    const radius = parseFloat(this.get("clusterCircleRadius"), 10),
        fillcolor = this.returnColor(this.get("clusterCircleFillColor"), "rgb"),
        strokecolor = this.returnColor(this.get("clusterCircleStrokeColor"), "rgb"),
        strokewidth = parseFloat(this.get("clusterCircleStrokeWidth"), 10);

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
    * @returns {ol/style} - The created style.
    */
export function createCirclePointStyle () {
    const radius = parseFloat(this.attributes.circleRadius, 10),
        fillcolor = this.returnColor(this.attributes.circleFillColor, "rgb"),
        strokecolor = this.returnColor(this.attributes.circleStrokeColor, "rgb"),
        strokewidth = parseFloat(this.attributes.circleStrokeWidth, 10);

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