import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./stateAddonNamePascalCase.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
