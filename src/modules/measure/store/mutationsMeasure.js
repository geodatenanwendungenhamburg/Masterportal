import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateMeasure from "./stateMeasure.js";

const mutations = {
    ...generateSimpleMutations(stateMeasure),
    /**
     * Adds a feature depending on the currently selected geometry style to either
     * the lines or the polygons object by key. Features cannot be added multiple
     * times by design. To trigger an update regarding the feature, re-add it.
     * @param {Object} state vuex state
     * @param {module:ol/Feature} payload feature to add
     * @returns {void}
     */
    addFeature (state, payload) {
        const key = state.selectedGeometry === "LineString" ? "lines" : "polygons";

        state[key] = {
            ...state[key],
            [payload.ol_uid]: payload
        };
    },
    /**
     * Removes a feature from both lines and polygons objects.
     * @param {Object} state vuex state
     * @param {String|Number} featureId - The ol_uid of the feature to remove
     * @returns {void}
     */
    removeFeature (state, featureId) {
        const normalizedId = String(featureId);

        if (state.lines[normalizedId]) {
            const newLines = {...state.lines};

            delete newLines[normalizedId];
            state.lines = newLines;
        }

        if (state.polygons[normalizedId]) {
            const newPolygons = {...state.polygons};

            delete newPolygons[normalizedId];
            state.polygons = newPolygons;
        }

        if (state.customNames[normalizedId]) {
            const newCustomNames = {...state.customNames};

            delete newCustomNames[normalizedId];
            state.customNames = newCustomNames;
        }
    },
    /**
     * Sets a custom name for a measurement feature.
     * @param {Object} state vuex state
     * @param {Object} payload - {featureId: String, name: String}
     * @returns {void}
     */
    setCustomName (state, payload) {
        const normalizedId = String(payload.featureId);

        state.customNames = {
            ...state.customNames,
            [normalizedId]: payload.name
        };
    },
    /**
     * Removes a custom name for a measurement feature.
     * @param {Object} state vuex state
     * @param {String|Number} featureId - The ol_uid of the feature
     * @returns {void}
     */
    removeCustomName (state, featureId) {
        const normalizedId = String(featureId);

        if (state.customNames[normalizedId]) {
            const newCustomNames = {...state.customNames};

            delete newCustomNames[normalizedId];
            state.customNames = newCustomNames;
        }
    },
    /**
     * Adds an unlisten function to the unlisteners array.
     * @param {Object} state vuex state
     * @param {function} payload added unlisten function
     * @returns {void}
     */
    addUnlistener (state, payload) {
        state.unlisteners = [...state.unlisteners, payload];
    }
};

export default mutations;
