import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateFullScreen from "./stateFullScreen.js";

export default {
    ...generateSimpleMutations(stateFullScreen)
};
