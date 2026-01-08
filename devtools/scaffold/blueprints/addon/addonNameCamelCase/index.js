import component from "./components/AddonNamePascalCase.vue";
import store from "./store/index.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component,
    store,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
