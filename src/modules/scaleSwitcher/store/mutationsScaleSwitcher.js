import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateScaleSwitcher from "./stateScaleSwitcher.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateScaleSwitcher)

    // NOTE overwrite mutations here if you need a special behaviour in a mutation
};

export default mutations;
