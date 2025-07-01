import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateRotation from "./stateRotation.js";

/**
 * The mutations for the control rotation.
 * @module modules/controls/rotation/store/mutationsRotation
 */
export default {
    ...generateSimpleMutations(stateRotation)
};
