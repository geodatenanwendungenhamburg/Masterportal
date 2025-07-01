import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateAbout from "./stateAbout.js";

const mutations = {
    ...generateSimpleMutations(stateAbout)

};

export default mutations;
