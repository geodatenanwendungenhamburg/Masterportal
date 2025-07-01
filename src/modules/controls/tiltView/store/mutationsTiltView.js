import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateTiltView from "./stateTiltView.js";

export default {
    ...generateSimpleMutations(stateTiltView)
};
