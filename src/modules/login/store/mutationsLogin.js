import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import initialState from "./stateLogin.js";

/**
 * The mutations for the Login.
 * @module modules/login/store/mutationsLogin
 */
const mutations = {
    ...generateSimpleMutations(initialState)
};

export default mutations;
