// Used by Bitbucket pipeline when addons/addonsConf.json is not present.
// Provides an empty addon modules stub to allow the build to succeed.

const EMPTY_ADDON_MODULES_ID = "\0empty-addon-modules";

/**
 *
 */
export default function emptyAddonModulesPlugin () {
    return {
        name: "empty-addon-modules",
        resolveId (source) {
            if (source === "virtual:addon-modules") {
                return EMPTY_ADDON_MODULES_ID;
            }
            return null;
        },
        load (id) {
            if (id === EMPTY_ADDON_MODULES_ID) {
                return "export default {};";
            }
            return null;
        }
    };
}
