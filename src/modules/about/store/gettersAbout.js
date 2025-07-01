import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateAbout from "./stateAbout.js";

const getters = {
    ...generateSimpleGetters(stateAbout)
};

export default getters;
