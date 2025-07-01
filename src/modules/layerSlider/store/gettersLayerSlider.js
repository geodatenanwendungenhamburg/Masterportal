
import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerSlider from "./stateLayerSlider";

const getters = {
    ...generateSimpleGetters(stateLayerSlider)
};

export default getters;
