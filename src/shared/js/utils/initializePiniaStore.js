/**
 * Applies module configuration values to known Pinia store state properties.
 *
 * @param {Object} store The Pinia store instance.
 * @param {Object} config The module configuration.
 * @param {String[]} [excludedKeys=["type"]] State keys that must not be overwritten.
 * @returns {void}
 */
export default function initializePiniaStore (store, config, excludedKeys = ["type"]) {
    if (!store || !config || typeof config !== "object") {
        return;
    }

    const stateKeys = new Set(Object.keys(store.$state)),
        patch = {};

    Object.entries(config).forEach(([key, value]) => {
        if (stateKeys.has(key) && !excludedKeys.includes(key)) {
            patch[key] = value;
        }
    });

    store.$patch(patch);
}
