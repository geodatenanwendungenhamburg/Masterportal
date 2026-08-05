import drawInteraction from "@masterportal/masterportalapi/src/maps/interactions/drawInteraction.js";
import {createTooltipOverlay} from "./createTooltipOverlay.js";
import Style from "ol/style/Style.js";
import Icon from "ol/style/Icon.js";

/**
 * Creates the runtime objects needed for a draw interaction.
 * @param {String} drawType The current draw type.
 * @param {ol/source/Vector} source The vector source for drawings.
 * @param {Object[]} iconList The configured draw symbols.
 * @returns {Object} The interaction context.
 */
export function createDrawInteractionContext (drawType, source, iconList) {
    const currentDrawInteraction = drawInteraction.createDrawInteraction(drawType, source, iconList, Config.wfsImgPath);

    return {
        currentDrawInteraction,
        map: mapCollection.getMap("2D"),
        symbol: iconList.find(val => val.id === drawType),
        ...createTooltipOverlay()
    };
}

/**
 * Resets the tooltip DOM element before it is reused.
 * @param {HTMLDivElement} tooltipElement The tooltip element.
 * @returns {void}
 */
export function initializeTooltipElement (tooltipElement) {
    tooltipElement.innerHTML = "";
    tooltipElement.style.display = "none";
}

/**
 * Registers the tooltip overlay on the map and keeps it aligned with the pointer.
 * @param {ol/Map} map The active map instance.
 * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
 * @returns {Object} The OpenLayers listener key.
 */
export function registerPointerMoveTooltip (map, tooltipOverlay) {
    map.addOverlay(tooltipOverlay);

    return map.on("pointermove", (event) => {
        if (event.dragging) {
            return;
        }

        tooltipOverlay.setPosition(event.coordinate);
    });
}

/**
 * Checks whether the draw type should show measurement tooltips.
 * @param {String} drawType The current draw type.
 * @returns {Boolean} True if the draw type is a measurement geometry.
 */
export function isMeasurementDrawType (drawType) {
    return ["circle", "box", "line", "polygon", "square"].includes(drawType);
}

/**
 * Checks whether the draw type uses the static circle interaction setup.
 * @param {String} drawType The current draw type.
 * @returns {Boolean} True if the draw type is circle-based.
 */
export function isStaticCircleDrawType (drawType) {
    return drawType === "circle" || drawType === "doubleCircle";
}

/**
 * Applies the configured image symbol style to the drawn feature.
 * @param {ol/Feature} feature The drawn feature.
 * @param {Object} symbol The symbol matching the draw type.
 * @returns {void}
 */
export function applyImageSymbolStyle (feature, symbol) {
    const iconSrc = symbol.value.startsWith("/")
        ? symbol.value
        : `${Config.wfsImgPath}${symbol.value}`;

    feature.setStyle(new Style({
        image: new Icon({
            src: iconSrc,
            scale: symbol.scale || 1,
            anchor: [0.5, 1]
        })
    }));
}

/**
 * Removes the next added feature from the source.
 * @param {ol/source/Vector} source The vector source for drawings.
 * @returns {void}
 */
export function discardNextDrawnFeature (source) {
    source.once("addfeature", (event) => {
        source.removeFeature(event.feature);
    });
}
