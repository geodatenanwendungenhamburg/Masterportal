import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateBaselayerSwitcher from "./stateBaselayerSwitcher.js";

const getters = {
    ...generateSimpleGetters(stateBaselayerSwitcher)
};

export default getters;
