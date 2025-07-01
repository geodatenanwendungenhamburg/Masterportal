import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateOpenConfig from "./stateOpenConfig";

const getters = {
    ...generateSimpleGetters(stateOpenConfig)
};

export default getters;
