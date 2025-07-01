// import "regenerator-runtime/runtime";

// import "./assets/css/bootstrap.scss";
// import "./assets/css/style.css";

// import {createApp} from "vue";
// import App from "./App.vue";
// import store from "./app-store/index.js";
// import "bootstrap/js/dist/offcanvas";

// import remoteInterface from "./plugins/remoteInterface.js";
// import utilsLogin from "./modules/login/js/utilsLogin.js";
// import globalUrlParams from "./core/urlParams/js/globalUrlParams.js";
// import {initiateVueI18Next, initLanguage} from "./plugins/i18next.js";

// import {initiateMatomo} from "./plugins/matomo.js";


// let app;
// const configPath = globalUrlParams.getConfigJsPath() === null ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1) + "config.js" : globalUrlParams.getConfigJsPath(),
//     loadConfigJs = new Promise((resolve, reject) => {
//         const script = document.createElement("script");

//         document.body.appendChild(script);
//         script.onload = resolve;
//         script.onerror = reject;
//         script.async = true;
//         script.src = configPath;
//     });


// // Wait until config.js is loaded
// loadConfigJs.then(() => {
//     app = createApp(App);

//     if (utilsLogin.handleLoginParameters()) {
//         window.close();
//         return;
//     }

//     // Load remoteInterface
//     if (Object.prototype.hasOwnProperty.call(Config, "remoteInterface")) {
//         app.use(remoteInterface, Config.remoteInterface);
//     }

//     initiateVueI18Next(app);
//     app.use(store);
//     store.$app = app;

//     if (Config.matomo) {
//         initiateMatomo(app);
//     }


//     initLanguage(Config.portalLanguage)
//         .then(() => {
//             app.mount("#masterportal-root");
//         });
// });

// export default app;
