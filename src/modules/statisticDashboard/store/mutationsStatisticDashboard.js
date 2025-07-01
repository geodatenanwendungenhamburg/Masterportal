import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateStatisticDashboard.js";

const mutations = {
    ...generateSimpleMutations(initialState)
};

export default mutations;
