import {useAboutStore} from "../about/store/aboutStore.js";
import {useCopyrightConstraintsStore} from "../copyrightConstraints/store/copyrightConstraintsStore.js";
import {useLayerInformationStore} from "../layerInformation/store/layerInformationStore.js";
import {useOrientationStore} from "../orientation/store/orientationStore.js";

/**
 * Registry of modules that have been migrated from Vuex to Pinia.
 *
 * The menu framework uses this registry to discover Pinia-based modules by
 * their config `type` and to access their store (for menu metadata such as
 * name/icon/description, and for merging config.json values into the store).
 *
 * Key: the module `type` as used in config.json (e.g. "about").
 * Value: the Pinia store composable returned by `defineStore`.
 *
 * @module modules/piniaModules
 */
const piniaModuleStores = {
    about: useAboutStore,
    copyrightConstraints: useCopyrightConstraintsStore,
    layerInformation: useLayerInformationStore,
    orientation: useOrientationStore
};

/**
 * Returns the Pinia store composable for a given module type, if the module
 * has been migrated to Pinia.
 * @param {String} type The module type from config.json (e.g. "about").
 * @returns {Function|undefined} The Pinia store composable or undefined.
 */
export function getPiniaModuleStore (type) {
    return piniaModuleStores[type];
}

/**
 * Checks whether a module of the given type is managed by Pinia.
 * @param {String} type The module type from config.json (e.g. "about").
 * @returns {Boolean} True if the module is a Pinia module.
 */
export function isPiniaModule (type) {
    return Object.prototype.hasOwnProperty.call(piniaModuleStores, type);
}

export default piniaModuleStores;
