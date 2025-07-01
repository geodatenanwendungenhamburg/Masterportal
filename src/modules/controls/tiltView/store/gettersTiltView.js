import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateTiltView from "./stateTiltView.js";

export default {
    ...generateSimpleGetters(stateTiltView)
};
