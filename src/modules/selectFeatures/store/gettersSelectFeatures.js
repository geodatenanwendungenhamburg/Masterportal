
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./stateSelectFeatures.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
