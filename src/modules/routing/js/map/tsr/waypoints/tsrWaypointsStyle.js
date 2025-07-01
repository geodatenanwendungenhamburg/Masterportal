import {Circle, Fill, Stroke, Style, Text} from "ol/style.js";
import stateRouting from "@modules/routing/store/stateRouting.js";
import stateTSR from "@modules/routing/store/tsr/stateTSR.js";
/**
 * Creates TSR waypoint style
 * @param {ol/Feature} feature for the current style
 * @returns {ol/Style} style
 */
export default function createtsrWaypointStyle (feature) {
    const styleSetting = stateRouting.tsrSettings.styleWaypoint ? stateRouting.tsrSettings.styleWaypoint : stateRouting.tsr.settings.styleWaypoint,
        routingId = feature.get("routingId");
    let stroke,
        fill,
        text;

    if (routingId === 0) {
        stroke = new Stroke({
            color: [244, 34, 37, 1.0],
            width: styleSetting.lineWidth
        });
        fill = new Fill({
            color: [244, 34, 37, styleSetting.opacity]
        });
        text = i18next.t("common:modules.routing.startIndex");
    }
    else if (routingId === stateRouting.TSR.waypoints.length - 1) {
        stroke = new Stroke({
            color: [51, 164, 71, 1.0],
            width: styleSetting.lineWidth
        });
        fill = new Fill({
            color: [51, 164, 71, styleSetting.opacity]
        });
        text = i18next.t("common:modules.routing.endIndex");
    }
    else {
        stroke = new Stroke({
            color: [0, 119, 182, 1.0],
            width: styleSetting.lineWidth
        });
        fill = new Fill({
            color: [0, 119, 182, styleSetting.opacity]
        });
        text = stateTSR.tsrDirections ? String(routingId) : "";
    }

    return new Style({
        image: new Circle({
            radius: styleSetting.radius,
            stroke: stroke,
            fill: fill
        }),
        text: routingId === undefined
            ? null
            : new Text({
                textAlign: "center",
                textBaseline: "middle",
                text: text,
                fill: new Fill({
                    color: styleSetting.textFillColor
                }),
                stroke: new Stroke({
                    color: styleSetting.textLineColor,
                    width: styleSetting.textLineWidth
                })
            })
    });
}
