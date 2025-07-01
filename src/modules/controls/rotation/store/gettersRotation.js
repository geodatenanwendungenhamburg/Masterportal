import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateRotation from "./stateRotation.js";

/**
 * The getters for the control rotation.
 * @module modules/controls/rotation/store/gettersRotation
 */
export default {
    ...generateSimpleGetters(stateRotation)
};
