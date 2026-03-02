import stateMeasure from "./stateMeasure.js";
import {calculateLineLengths, calculatePolygonAreas} from "../js/measureCalculation.js";

import {generateSimpleGetters} from "@shared/js/utils/generators.js";

const simpleGetters = {
    ...generateSimpleGetters(stateMeasure),

    /**
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @returns {String[]} options for measurement units
     */
    currentUnits ({selectedGeometry, lineStringUnits, polygonUnits}) {
        return selectedGeometry === "LineString"
            ? lineStringUnits
            : polygonUnits;
    },
    /**
     * Calculates the length of lines.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @return {String[]} calculated display values
     */
    lineLengths ({lines, earthRadius, measurementAccuracy, selectedLineStringUnit, lineStringUnits}, getters, rootState, rootGetters) {
        return calculateLineLengths(
            rootGetters["Maps/projection"].getCode(),
            lines,
            earthRadius,
            measurementAccuracy,
            selectedLineStringUnit,
            "LineString",
            lineStringUnits
        );
    },
    /**
     * Calculates the area of a polygon.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @param {Object} rootState root state
     * @param {Object} rootGetters root getters
     * @return {String[]} calculated display values
     */
    polygonAreas ({polygons, earthRadius, measurementAccuracy, selectedPolygonUnit, polygonUnits}, getters, rootState, rootGetters) {
        return calculatePolygonAreas(
            rootGetters["Maps/projection"].getCode(),
            polygons,
            earthRadius,
            measurementAccuracy,
            selectedPolygonUnit,
            "Polygon",
            polygonUnits
        );
    },

    /**
     * Returns a unified list of all measurements with metadata.
     * @param {Object} state measure store state
     * @param {Object} getters measure store getters
     * @returns {Array<Object>} list of measurements with id, type, feature, displayValue, and customName
     */
    measurementList: ({lines, polygons, customNames}, getters) => {
        const measurements = [];

        Object.keys(lines).forEach(featureId => {
            measurements.push({
                id: featureId,
                type: "LineString",
                feature: lines[featureId],
                displayValue: getters.lineLengths[featureId],
                customName: customNames[featureId] || null
            });
        });

        Object.keys(polygons).forEach(featureId => {
            measurements.push({
                id: featureId,
                type: "Polygon",
                feature: polygons[featureId],
                displayValue: getters.polygonAreas[featureId],
                customName: customNames[featureId] || null
            });
        });

        return measurements;
    },

    urlParams: state => {
        const params = {
            selectedGeometry: state.selectedGeometry,
            selectedLineStringUnit: state.selectedLineStringUnit,
            selectedPolygonUnit: state.selectedPolygonUnit
        };

        return JSON.stringify(params);
    }
};

export default simpleGetters;
