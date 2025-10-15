import "regenerator-runtime/runtime";

import "./assets/css/bootstrap.scss";
import "./assets/css/style.css";

import {createApp} from "vue";
import App from "./App.vue";
import store from "./app-store";
import "bootstrap/js/dist/offcanvas";

import remoteInterface from "./plugins/remoteInterface";
import utilsLogin from "../src/modules/login/js/utilsLogin";
import globalUrlParams from "../src/core/urlParams/js/globalUrlParams";
import {initiateVueI18Next, initLanguage} from "./plugins/i18next";

import {initiateMatomo} from "./plugins/matomo";


let app;
const configPath = globalUrlParams.getConfigJsPath() === null ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1) + "config.js" : globalUrlParams.getConfigJsPath(),
    loadConfigJs = new Promise((resolve, reject) => {
        const script = document.createElement("script");

        document.body.appendChild(script);
        script.onload = resolve;
        script.onerror = reject;
        script.async = true;
        script.src = configPath;
    });


// Wait until config.js is loaded
loadConfigJs.then(() => {
    app = createApp(App);

    if (utilsLogin.handleLoginParameters()) {
        window.close();
        return;
    }

    // Load remoteInterface
    if (Object.prototype.hasOwnProperty.call(Config, "remoteInterface")) {
        app.use(remoteInterface, Config.remoteInterface);
    }

    initiateVueI18Next(app);
    app.use(store);
    store.$app = app;

    if (Config.matomo) {
        initiateMatomo(app);
    }


    initLanguage(Config.portalLanguage)
        .then(() => {
            app.mount("#masterportal-root");
        });
});

export default app;
