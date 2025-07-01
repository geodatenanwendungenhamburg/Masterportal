import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import OrientationState from "./stateOrientation.js";

const getters = {
    ...generateSimpleGetters(OrientationState)
};

export default getters;
