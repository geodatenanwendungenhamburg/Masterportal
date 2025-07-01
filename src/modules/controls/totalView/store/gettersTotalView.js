import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateTotalView from "./stateTotalView.js";

export default {
    ...generateSimpleGetters(stateTotalView)
};
