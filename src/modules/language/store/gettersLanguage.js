import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import state from "./stateLanguage.js";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
