import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateResizeHandle from "./stateResizeHandle";

const mutations = {
    /**
    * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     * ../../../src/shared/js/utils/generators
     */
    ...generateSimpleMutations(stateResizeHandle)
};

export default mutations;
