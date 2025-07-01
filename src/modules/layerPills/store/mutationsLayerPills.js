import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLayerPills from "./stateLayerPills";

const mutations = {
    ...generateSimpleMutations(stateLayerPills)
};

export default mutations;
