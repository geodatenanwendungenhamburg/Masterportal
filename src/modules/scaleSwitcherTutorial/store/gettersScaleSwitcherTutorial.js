import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import scaleSwitcherStateTutorial from "./stateScaleSwitcherTutorial.js";

const getters = {
    ...generateSimpleGetters(scaleSwitcherStateTutorial)

    // NOTE overwrite getters here if you need a special behaviour in a getter
};

export default getters;
