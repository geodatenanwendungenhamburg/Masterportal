/**
 * loads vuetify from the path specified in the config.js
 * Unlike webpack, vite does not allow dynamic imports with fully dynamic paths.
 * Therefore, vuetify setup must be made from `addons/${Config.vuetifyFolder}/plugins/vuetify/index.js`
 * Thus custom themes and parameters can be set portal specifically
 * Returns undefined if vuetify is not configured in the config
 * @returns {module:Vuetify | undefined} the vuetify instance to use or undefined
 */
export async function instantiateVuetify () {
    if (typeof Config.vuetifyFolder !== "string") {
        console.error("Vuetify: Plugin folder name must be provided. Please check your config.js");
        return undefined;
    }

    try {
        const vuetify = await import(
            `../../addons/${Config.vuetifyFolder}/plugins/vuetify/index.js`
        );

        return vuetify.default;
    }
    catch (e) {
        console.error(`Vuetify cannot be loaded from file ${Config.vuetifyFolder}. Please check the file name set in the portal's config.js and try again.`, e);
        return undefined;
    }
}
