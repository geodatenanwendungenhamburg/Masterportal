/**
 * Updates the tooltip content for the current measurement geometry.
 * @param {String} drawType The current draw type.
 * @param {Object} geometry The geometry being drawn.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {Function} translate The translation callback.
 * @param {Function} setLineLength Stores the current line length.
 * @param {Function} emitCircleRadius Emits the current rounded circle radius.
 * @returns {void}
 */
export function updateMeasurementTooltip (drawType, geometry, tooltipElement, translate, setLineLength, emitCircleRadius) {
    if (drawType === "circle") {
        updateCircleTooltip(geometry, tooltipElement, translate, emitCircleRadius);
    }
    if (drawType === "box" || drawType === "polygon" || drawType === "square") {
        updateAreaTooltip(drawType, geometry, tooltipElement, translate);
    }
    if (drawType === "line") {
        updateLineTooltip(geometry, tooltipElement, translate, setLineLength);
    }
}

/**
 * Updates the tooltip for circle measurements and emits the radius.
 * @param {Object} geometry The geometry being drawn.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {Function} translate The translation callback.
 * @param {Function} emitCircleRadius Emits the current rounded circle radius.
 * @returns {void}
 */
function updateCircleTooltip (geometry, tooltipElement, translate, emitCircleRadius) {
    const radius = getRoundedCircleRadius(geometry),
        formattedRadius = radius.toLocaleString("de-DE");

    tooltipElement.innerHTML = `${translate("common:shared.modules.draw.drawSettingsCircle.radii.radius")}: ${formattedRadius}m`;
    emitCircleRadius(radius);
}

/**
 * Updates the tooltip for box, polygon, and square measurements.
 * @param {String} drawType The current draw type.
 * @param {Object} geometry The geometry being drawn.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {Function} translate The translation callback.
 * @returns {void}
 */
function updateAreaTooltip (drawType, geometry, tooltipElement, translate) {
    const coordinates = geometry.getCoordinates()[0],
        width = Math.abs(coordinates[1][0] - coordinates[0][0]),
        height = Math.abs(coordinates[2][1] - coordinates[1][1]),
        area = Math.round(geometry.getArea()),
        formattedWidth = Math.round(width).toLocaleString("de-DE"),
        formattedHeight = Math.round(height).toLocaleString("de-DE"),
        formattedArea = area.toLocaleString("de-DE");

    if (drawType === "box" || drawType === "square") {
        tooltipElement.innerHTML = `${translate("common:shared.modules.draw.drawLayout.area")}: ${formattedArea}m²<br>${translate("common:shared.modules.draw.drawLayout.width")}: ${formattedWidth}m<br>${translate("common:shared.modules.draw.drawLayout.height")}: ${formattedHeight}m`;
    }
    else {
        tooltipElement.innerHTML = `${translate("common:shared.modules.draw.drawLayout.area")}: ${formattedArea}m²`;
    }
}

/**
 * Updates the tooltip for line measurements and stores the current length.
 * @param {Object} geometry The geometry being drawn.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {Function} translate The translation callback.
 * @param {Function} setLineLength Stores the current line length.
 * @returns {void}
 */
function updateLineTooltip (geometry, tooltipElement, translate, setLineLength) {
    const length = Math.round(geometry.getLength());

    setLineLength(length);
    tooltipElement.innerHTML = `${translate("common:shared.modules.draw.drawLayout.length")}: ${length}m`;
}

/**
 * Returns the rounded radius for a circle geometry.
 * @param {Object} geometry The geometry being drawn.
 * @returns {Number} The rounded circle radius.
 */
export function getRoundedCircleRadius (geometry) {
    return Math.round(geometry.getRadius());
}

/**
 * Clears the circle tooltip overlay after drawing finished.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
 * @returns {void}
 */
export function resetCircleTooltip (tooltipElement, tooltipOverlay) {
    tooltipElement.innerHTML = "";
    tooltipOverlay.setPosition(undefined);
}
