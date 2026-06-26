import "@/assets/css/bootstrap-custom.scss";
import "@/assets/css/masterportal.css";

import "regenerator-runtime/runtime";
import {initiateVueI18Next, initLanguage} from "./plugins/i18next.js";
import globalUrlParams from "../src/core/urlParams/js/globalUrlParams.js";
import {createApp} from "vue";
import {createPinia} from "pinia";
import App from "./App.vue";
import bsTooltipDirective from "./directives/bs-tooltip.js";
import store from "./app-store/index.js";
import remoteInterface from "./plugins/remoteInterface.js";
import utilsLogin from "../src/modules/login/js/utilsLogin.js";

import {instantiateVuetify} from "./plugins/vuetify.js";


let app;

window.__appMounted = window.__appMounted || false;
const isDev = import.meta.env.MODE === "development",
    // URL parameters (window.location.search) appended to the masterportal request are also appended to the path to the Config.js, used by addons
    configPath = globalUrlParams.getConfigJsPath() === null ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1) + "config.js" + window.location.search : globalUrlParams.getConfigJsPath(),
    loadConfigJs = new Promise((resolve, reject) => {
        const script = document.createElement("script");

        document.body.appendChild(script);
        script.onload = resolve;
        script.onerror = reject;
        script.async = true;
        script.src = configPath;
    });

loadConfigJs.then(() => {

    // Reload protection in dev mode only – prevents double mounting
    if (isDev && window.__appMounted) {
        window.location.reload();
        return;
    }

    app = createApp(App);

    if (utilsLogin.handleLoginParameters()) {
        window.close();
        return;
    }

    // Load remoteInterface
    if (Object.prototype.hasOwnProperty.call(Config, "remoteInterface")) {
        app.use(remoteInterface, Config.remoteInterface);
    }

    app.directive("bs-tooltip", bsTooltipDirective);

    const pinia = createPinia();

    app.use(pinia);
    app.use(store);
    store.$app = app;

    window.trackMatomo = window.trackMatomo || undefined;
    if (Config.matomo) {
        import("./plugins/matomo.js")
            .then(m => {
                m.initiateMatomo(app);
                window.trackMatomo = m.trackMatomo;
            })
            .catch(() => {
                console.warn("Matomo blocked. Using fallback empty function.");
            });
    }

    if (Config.vuetifyFolder) {
        instantiateVuetify().then(vuetify => {
            if (vuetify) {
                app.use(vuetify);
            }
        });
    }

    initLanguage(Config.portalLanguage || {}, Config.portalLocales)
        .then(() => {
            initiateVueI18Next(app);
            app.mount("#masterportal-root");
            window.__appMounted = true;
        });
});

// Move all external CSS stylesheets to the end of <head> to ensure precedence over Vite styles
(function ensureAllCssLinksLast () {
    const links = Array.from(
        document.querySelectorAll("link[rel=\"stylesheet\"]")
    );

    links.forEach(link => {
        document.head.appendChild(link);
    });
})();

// Force reload on any HMR update
if (import.meta.hot) {
    import.meta.hot.on("vite:beforeUpdate", () => {
        location.reload();
    });
}

export default app;
