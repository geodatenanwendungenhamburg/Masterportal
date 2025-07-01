import {Stroke, Style} from "ol/style.js";
import stateRouting from "@modules/routing/store/stateRouting.js";

/**
 * Creates direction route style function
 * @param {ol/Feature} feature for the current style
 * @returns {ol/Style} style function
 */
function createtsrRouteStyle () {
    const styleSetting = stateRouting.tsrSettings.styleRoute ? stateRouting.tsrSettings.styleRoute : stateRouting.tsr.settings.styleRoute;

    return [
        new Style({
            stroke: new Stroke({
                color: [...styleSetting.fillColor, 1.0],
                width: styleSetting.width
            })
        })
    ];
}
export default {
    createtsrRouteStyle
};
