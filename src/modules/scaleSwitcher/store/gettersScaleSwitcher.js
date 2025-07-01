import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import scaleSwitcherState from "./stateScaleSwitcher.js";

const getters = {
    ...generateSimpleGetters(scaleSwitcherState)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
