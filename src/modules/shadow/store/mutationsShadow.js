import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateShadow from "./stateShadow.js";

const mutations = {
    ...generateSimpleMutations(stateShadow)
};

export default mutations;
