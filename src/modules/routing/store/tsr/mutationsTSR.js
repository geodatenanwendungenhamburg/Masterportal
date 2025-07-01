import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import tsrState from "./stateTSR.js";

/**
 * The mutations for the routing tsr.
 * @module modules/routing/store/tsr/mutations
 */
const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(tsrState)
};

export default mutations;
