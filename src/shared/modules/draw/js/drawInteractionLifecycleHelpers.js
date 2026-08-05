import {unByKey} from "ol/Observable.js";

/**
 * Unregisters drawstart and drawend listener keys and resets them.
 * @param {?Object} drawStartKey The drawstart listener key.
 * @param {?Object} drawEndKey The drawend listener key.
 * @returns {{drawStartKey: null, drawEndKey: null}} Cleared listener key state.
 */
export function clearDrawInteractionListenerKeys (drawStartKey, drawEndKey) {
    if (drawStartKey) {
        unByKey(drawStartKey);
    }
    if (drawEndKey) {
        unByKey(drawEndKey);
    }

    return {
        drawStartKey: null,
        drawEndKey: null
    };
}

/**
 * Unregisters a geometry change listener and resets measurement listener state.
 * @param {?Object} activeMeasurementGeometry The geometry currently tracked for measurement updates.
 * @param {?Function} onGeometryChange The geometry change callback.
 * @param {Function} unregisterMeasurementChangeListener Function to detach the geometry listener.
 * @returns {{activeMeasurementGeometry: null, onGeometryChange: null}} Cleared measurement listener state.
 */
export function clearMeasurementListenerState (activeMeasurementGeometry, onGeometryChange, unregisterMeasurementChangeListener) {
    unregisterMeasurementChangeListener(activeMeasurementGeometry, onGeometryChange);

    return {
        activeMeasurementGeometry: null,
        onGeometryChange: null
    };
}

/**
 * Removes pointer-move listener and tooltip overlay from the map and resets related state.
 * @param {?Object} pointerMoveKey The pointer-move listener key.
 * @param {?Object} tooltipOverlay The tooltip overlay instance.
 * @returns {{pointerMoveKey: null, tooltipOverlay: null}} Cleared pointer/overlay state.
 */
export function clearPointerListenerAndOverlay (pointerMoveKey, tooltipOverlay) {
    if (pointerMoveKey) {
        unByKey(pointerMoveKey);
    }

    if (tooltipOverlay) {
        const mapInstance = mapCollection.getMap("2D");

        if (mapInstance) {
            mapInstance.removeOverlay(tooltipOverlay);
        }
    }

    return {
        pointerMoveKey: null,
        tooltipOverlay: null
    };
}