import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateZoom from "./stateZoom.js";

export default {
    ...generateSimpleGetters(stateZoom)
};
