import {defineStore} from "pinia";
import state from "./stateAbout.js";
import actions from "./actionsAbout.js";

/**
 * Pinia store for the About module.
 * @module modules/About/store
 */
export const useAboutStore = defineStore("Modules/About", {
    state: () => ({...state}),
    actions
});
