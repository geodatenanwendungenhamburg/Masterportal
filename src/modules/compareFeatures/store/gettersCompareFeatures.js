import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import compareFeaturesState from "./stateCompareFeatures.js";

const getters = {
    ...generateSimpleGetters(compareFeaturesState),
    /**
     * Checks if a feature is selected.
     * @param {Object} state - the state.
     * @param {Object} featureId - feature id.
     * @param {Object} layerId - layer id.
     * @returns {void}
     */
    isFeatureSelected: state => ({featureId, layerId}) => {
        if (Object.prototype.hasOwnProperty.call(state.layerFeatures, layerId)) {
            for (const feature of state.layerFeatures[layerId]) {
                if (feature.featureId === featureId) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * Gets the currently available layers.
     * @param {Object} state - the state.
     * @returns {void}
     */
    selectableLayers: state => {
        const layers = [];

        Object.keys(state.layerFeatures).forEach((key) => {
            if (state.layerFeatures[key][0]) {
                layers.push(state.layerFeatures[key][0]);
            }
        });
        return layers;
    }
};

export default getters;
