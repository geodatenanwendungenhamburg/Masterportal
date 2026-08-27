import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import OrientationState from "./stateOrientation.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => tate[key] = payload}
     * will be returned.
     */
    ...generateSimpleMutations(OrientationState)
};

export default mutations;
