import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateMouseHover from "./stateMouseHover";

const getters = {
    ...generateSimpleGetters(stateMouseHover)
};

export default getters;
