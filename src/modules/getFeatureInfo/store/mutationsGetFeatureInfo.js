import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateGetFeatureInfo from "./stateGetFeatureInfo";

/**
 * The mutations for the getFeatureInfo.
 * @module modules/getFeatureInfo/store/mutationsGetFeatureInfo
 */
export default {
    ...generateSimpleMutations(stateGetFeatureInfo),

    /**
     * Removes a feature from the `gfiFeatures` array based on the provided `layerId`.
     * This mutation finds the feature by its `layerId` and removes it from the array.
     *
     * @param {Object} state - The state object from Vuex.
     * @param {String} layerId - The `layerId` of the feature to remove.
     * @returns {void}
     */
    removeGfiFeatureByLayerId (state, layerId) {
        state.gfiFeatures.splice(state.gfiFeatures.findIndex(gfiFeature => gfiFeature.getLayerId() === layerId), 1);
    },

    /**
     * Sets the `globeEventHandler` in the state, ensuring that it is only set if it
     * is different from the current one.
     *
     * @param {Object} state - The state object from Vuex.
     * @param {Cesium.ScreenSpaceEventHandler} globeEventHandler - The new globe event handler to be set.
     * @returns {void}
     */
    setGlobeEventHandlerCheck (state, globeEventHandler) {
        if (state.globeEventHandler !== globeEventHandler) {
            state.globeEventHandler = globeEventHandler;
        }
    },

    /**
     * Destroys the `globeEventHandler` in the state if it exists, and then sets it to `null`.
     * This mutation is useful for cleaning up event listeners.
     *
     * @param {Object} state - The state object from Vuex.
     * @returns {void}
     */
    destroyGlobeEventHandler (state) {
        if (state.globeEventHandler) {
            state.globeEventHandler.destroy();
            state.globeEventHandler = null;
        }
    }
};
