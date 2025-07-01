import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateBaselayerSwitcher from "./stateBaselayerSwitcher.js";

const mutations = {
    ...generateSimpleMutations(stateBaselayerSwitcher)
};

export default mutations;
