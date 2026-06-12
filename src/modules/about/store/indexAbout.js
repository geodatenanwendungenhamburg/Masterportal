import state from "./stateAbout.js";

/**
 * Minimal Vuex module for About.
 * Only provides state so the menu system can read icon/name/description.
 * All logic lives in the Pinia store (aboutStore.js).
 */
export default {
    namespaced: true,
    state: {...state}
};
