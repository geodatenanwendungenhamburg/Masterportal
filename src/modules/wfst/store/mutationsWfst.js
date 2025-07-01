import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateWfst.js";

const mutations = {
    ...generateSimpleMutations(initialState),
    /**
     * Gets select interaction status
     * @param {Object} Payload Mutation payload
     * @param {Object} Payload.featureProperties Property  of the features
     * @param {String} Payload.key key name
     * @param {(String|Number|Object)} Payload.value value
     * @returns {O} Interaction Button status
     */
    setFeatureProperty ({featureProperties}, {key, value, valid, required}) {
        featureProperties.find(property => property.key === key).value = value;
        featureProperties.find(property => property.key === key).valid = valid;
        featureProperties.find(property => property.key === key).required = required;
    },
    /**
     * Updates the value of a specific property for all features in the batch.
     *
     * @param {Object} context the Vuex context
     * @param {Array<Array<Object>>} context.featurePropertiesBatch an array of feature property arrays
     * @param {Object} payload the payload containing the key and value to update
     * @param {string} payload.key the key of the property to update
     * @param {(String|Number|Object)} payload.value the new value to set for the specified property
     * @returns {void}
     */
    setFeaturesBatchProperty ({featurePropertiesBatch}, {key, value}) {
        featurePropertiesBatch.forEach(featureProperties => {
            featureProperties.find(property => property.key === key).value = value;
        });
    },
    /**
     * Adds a processed MultiPolygon.
     *
     * @param {Object} context the Vuex context
     * @param {Array<Array<Object>>} context.processedMultiPolygons an array of all processed MultiPolygons
     * @param {Object} value The feature to be added to the processedMultiPolygon Array
     * @returns {void}
     */
    addProcessedMultiPolygon ({processedMultiPolygons}, value) {
        processedMultiPolygons.add(value);
    },
    /**
     * Sets the void Modal visible
     *
     * @param {Object} state the Vuex state
     * @param {*} payload the payload of the modal
     */
    setShowVoidModal (state, payload) {
        state.showVoidModal = true; // Ensure the modal is displayed
        state.voidModalCallback = payload; // Store the callbacks and modal data
    },
    /**
     * Removes the void Modal
     *
     * @param {Object} state the Vuex state
     * @param {*} payload the payload of the modal
     */
    setHideVoidModal (state) {
        state.showVoidModal = false;
        state.voidModalCallback = null;
    }
};

export default mutations;
