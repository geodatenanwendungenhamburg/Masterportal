import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateIsochrones from "./stateIsochrones.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateIsochrones)
};

export default mutations;
