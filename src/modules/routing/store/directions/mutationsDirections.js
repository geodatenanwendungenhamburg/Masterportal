import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import directionsState from "./stateDirections.js";

/**
 * The mutations for the routing directions.
 * @module modules/routing/store/directions/mutations
 */
const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(directionsState),

    /**
     * set values for HGV restriction parameters.
     * @param {Object} state state
     * @param {String} name name of HGV parameter
     * @param {Number} value value of HGV parameter
     */
    setRoutingRestrictionIsValid: (state, {name, value}) => {
        state.routingRestrictionIsValid[name] = value;
    }
};

export default mutations;
