import {updateMeasurementTooltip, getRoundedCircleRadius, resetCircleTooltip} from "./drawTooltipHelpers.js";

/**
 * Creates and registers the geometry change listener used for measurement tooltips.
 * @param {String} drawType The current draw type.
 * @param {Object} geometry The geometry instance from the drawstart event.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {Function} translate Translation function.
 * @param {Function} setLineLength Setter for current line length.
 * @param {Function} emitCircleRadius Emitter callback for circle radius updates.
 * @returns {Function} The registered geometry change callback.
 */
export function registerMeasurementChangeListener (drawType, geometry, tooltipElement, translate, setLineLength, emitCircleRadius) {
    /**
     * Forwards geometry change events to tooltip update handling.
     * @returns {void}
     */
    function onGeometryChange () {
        updateMeasurementTooltip(
            drawType,
            geometry,
            tooltipElement,
            translate,
            setLineLength,
            emitCircleRadius
        );
    }

    geometry.on("change", onGeometryChange);

    return onGeometryChange;
}

/**
 * Removes the geometry change listener previously registered for measurements.
 * @param {?Object} geometry The geometry instance to detach from.
 * @param {?Function} onGeometryChange The callback to unregister.
 * @returns {void}
 */
export function unregisterMeasurementChangeListener (geometry, onGeometryChange) {
    if (geometry && onGeometryChange) {
        geometry.un("change", onGeometryChange);
    }
}

/**
 * Checks whether a writeText feature should be discarded because text is empty.
 * @param {String} drawType The current draw type.
 * @param {Object} currentLayout The active layout.
 * @returns {Boolean} True if the feature should be discarded.
 */
export function shouldDiscardEmptyTextFeature (drawType, currentLayout) {
    return drawType === "writeText" && !currentLayout.text?.trim();
}

/**
 * Emits rounded circle radius and resets circle tooltip state after drawend.
 * @param {Object} geometry The geometry from the drawend event.
 * @param {HTMLElement} tooltipElement The tooltip element.
 * @param {ol/Overlay} tooltipOverlay The tooltip overlay.
 * @param {Function} emitCircleRadius Emitter callback for circle radius updates.
 * @returns {void}
 */
export function handleCircleMeasurementDrawEnd (geometry, tooltipElement, tooltipOverlay, emitCircleRadius) {
    const radius = getRoundedCircleRadius(geometry);

    emitCircleRadius(radius);
    resetCircleTooltip(tooltipElement, tooltipOverlay);
}
