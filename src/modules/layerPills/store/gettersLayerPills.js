import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLayerPills from "./stateLayerPills";

const getters = {
    ...generateSimpleGetters(stateLayerPills)
};

export default getters;
