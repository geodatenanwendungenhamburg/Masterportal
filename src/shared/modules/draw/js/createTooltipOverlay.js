import Overlay from "ol/Overlay.js";

/**
 * Creates a tooltip overlay for displaying dynamic information on the map.
 * The tooltip is represented as a `div` element and can be positioned relative to the mouse pointer.
 *
 * @returns {Object} An object containing:
 *   - {import("ol/Overlay").default} tooltipOverlay - The OpenLayers overlay instance for the tooltip.
 *   - {HTMLDivElement} tooltipElement - The HTML `div` element used as the tooltip.
 */
export function createTooltipOverlay () {
    const tooltipElement = document.createElement("div");

    tooltipElement.className = "draw-tooltip";
    tooltipElement.style.position = "absolute";
    tooltipElement.style.pointerEvents = "none";

    const tooltipOverlay = new Overlay({
        element: tooltipElement,
        offset: [15, 15],
        positioning: "center-left"
    });

    return {tooltipOverlay, tooltipElement};
}
