import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateExportItem from "./stateExportItem";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateExportItem)
};

export default mutations;
