import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateStartModule from "./stateStartModule.js";

export default {
    ...generateSimpleGetters(stateStartModule)
};
