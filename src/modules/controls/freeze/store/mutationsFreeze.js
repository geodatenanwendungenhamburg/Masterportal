import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateFreeze from "./stateFreeze.js";

export default {
    ...generateSimpleMutations(stateFreeze)
};
