import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateShadow from "./stateShadow.js";

const getters = {
    ...generateSimpleGetters(stateShadow)
};

export default getters;
