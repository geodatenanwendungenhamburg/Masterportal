import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import scaleSwitcherStateTutorial from "./stateScaleSwitcherTutorial.js";

const getters = {
    ...generateSimpleGetters(scaleSwitcherStateTutorial)
};

export default getters;
