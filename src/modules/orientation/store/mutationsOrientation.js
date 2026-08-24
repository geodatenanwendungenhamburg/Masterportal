import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import OrientationState from "./stateOrientation.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => tate[key] = payload}
     * will be returned.
     */
    ...generateSimpleMutations(OrientationState),

    /**
    * Sets the custom position marker overlay reference
    * @param {Object} state the state
    * @param {Object|null} overlay the overlay object or null to clear
    * @returns {void}
    */
    setCustomPositionMarker (state, overlay) {
        state.customPositionMarker = overlay;
    }
};

export default mutations;
