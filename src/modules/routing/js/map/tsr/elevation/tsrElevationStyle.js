import {Circle, Fill, Stroke, Style} from "ol/style.js";
import stateRouting from "@modules/routing/store/stateRouting.js";

/**
 * Creates TSR elevation style
 * @returns {ol/Style} style
 */
export default function createTSRElevationStyle () {
    return new Style({
        image: new Circle({
            radius: 6,
            stroke: new Stroke({
                color: stateRouting.tsrSettings.styleElevationProfile.elevationPointLineColor,
                width: 3
            }),
            fill: new Fill({
                color: stateRouting.tsrSettings.styleElevationProfile.elevationPointFillColor
            })
        })
    });
}
