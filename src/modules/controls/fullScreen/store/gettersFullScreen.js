import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateFullScreen from "./stateFullScreen.js";

export default {
    ...generateSimpleGetters(stateFullScreen)
};
