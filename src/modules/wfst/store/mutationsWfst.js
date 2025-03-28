import {generateSimpleMutations} from "../../../shared/js/utils/generators";
import initialState from "./stateWfst";

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
    }
};

export default mutations;
