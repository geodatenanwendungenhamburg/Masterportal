import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateButton3d from "./stateButton3d.js";

export default {
    ...generateSimpleGetters(stateButton3d)
};
