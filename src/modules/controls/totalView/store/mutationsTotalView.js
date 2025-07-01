import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateTotalView from "./stateTotalView.js";

export default {
    ...generateSimpleMutations(stateTotalView)
};
