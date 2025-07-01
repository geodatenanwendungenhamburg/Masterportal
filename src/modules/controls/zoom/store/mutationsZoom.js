import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateZoom from "./stateZoom.js";

export default {
    ...generateSimpleMutations(stateZoom)
};
