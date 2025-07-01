import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateOpenConfig from "./stateOpenConfig";

const mutations = {
    ...generateSimpleMutations(stateOpenConfig)
};

export default mutations;
