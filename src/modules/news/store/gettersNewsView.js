import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateNewsView from "./stateNewsView";

const getters = {
    ...generateSimpleGetters(stateNewsView)
};

export default getters;
