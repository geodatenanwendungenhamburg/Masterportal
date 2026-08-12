import Overlay from "ol/Overlay.js";

/**
 * Creates a tooltip overlay for displaying dynamic information on the map.
 * The tooltip is represented as a `div` element and can be positioned relative to the mouse pointer.
 *
 * @param {Object} [tooltipStyle={}] Optional inline style map for the tooltip element.
 *
 * @returns {{tooltipOverlay: Overlay, tooltipElement: HTMLDivElement}} An object containing:
 *   - {Overlay} tooltipOverlay - The OpenLayers overlay instance for the tooltip.
 *   - {HTMLDivElement} tooltipElement - The HTML `div` element used as the tooltip.
 */
export function createTooltipOverlay (tooltipStyle = {}) {
    const tooltipElement = document.createElement("div");

    tooltipElement.className = "draw-tooltip";

    if (tooltipStyle && typeof tooltipStyle === "object") {
        Object.keys(tooltipStyle).forEach(key => {
            tooltipElement.style[key] = tooltipStyle[key];
        });
    }

    tooltipElement.style.position = "absolute";
    tooltipElement.style.pointerEvents = "none";

    const tooltipOverlay = new Overlay({
        element: tooltipElement,
        offset: [15, 15],
        positioning: "center-left"
    });

    return {tooltipOverlay, tooltipElement};
}
