import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateFreeze from "./stateFreeze.js";

export default {
    ...generateSimpleGetters(stateFreeze)
};
