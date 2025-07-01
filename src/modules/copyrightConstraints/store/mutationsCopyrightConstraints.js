import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import state from "./stateCopyrightConstraints.js";

const mutations = {
    ...generateSimpleMutations(state)
};

export default mutations;
