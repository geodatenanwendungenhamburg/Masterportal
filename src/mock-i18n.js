// Dummy file to define $t temporarily to bypass the translation issue in Vue 3
// Must be removed once proper translations are integrated
/**
 *
 */
export function installMockI18n (app) {
    app.config.globalProperties.$t = (key) => key;
    app.provide("$t", (key) => key);
    window.i18next = {
        t: (key) => key,
        changeLanguage: () => Promise.resolve()
    };
}
