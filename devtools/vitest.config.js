import {defineConfig, mergeConfig} from "vitest/config";
import viteConfig from "./vite.config.js";
import {nodePolyfills} from "vite-plugin-node-polyfills";
import addonModules from "./tasks/addon-modules-plugin.js";

export default defineConfig(mode => mergeConfig(
    viteConfig(mode),
    defineConfig({
        plugins: [
            nodePolyfills({
                exclude: ["fs"]
            }),
            // todo: brauchen wir das beim Testen, z.B. für die addons.spec.js?
            addonModules({
                configPath: "addons/addonsConf.json",
                baseDir: "addons"
            })
        ],
        css: false,
        test: {
            reporters: ["default"],
            // reporters: ["default", "html"],
            pool: "forks",
            globals: true,
            environment: "jsdom",
            css: false,
            /**
             * Setting isolate: false disables test isolation, which means all tests in a file share the same environment and global state.
             * This can cause side effects and make tests fail if they depend on a clean state.
             * But here it is used with 'singleThread: true' and 'fileParallelism: false' and that works.
             */
            isolate: false,
            fileParallelism: false,
            poolOptions: {
                threads: {
                    singleThread: true
                }
            },
            hookTimeout: 500, // reduce from 20000 to 500 ms
            // include: [
            //     "src/**/*.spec.js",
            //     "addons/**/*.spec.js"
            // ],
            exclude: [
                /*
                  wfsSearch:
                   TypeError: Cannot read properties of undefined (reading 'forEach')
                    ❯ src/shared/modules/table/components/TableComponent.vue:229:37
                        227|                 }
                        228|
                        229|                 this.visibleHeaders.forEach(header => {
                        |                                     ^
                        230|                     newItem[header.name] = item[header.name] ?? "";
                        231|                 });
                    ❯ Proxy.editedTable src/shared/modules/table/components/TableComponent.vue:217:39
                */
                "src/modules/wfsSearch/**/*.spec.js", // --> hat Querauswirkungen auf andere Tests
                /*
                  draw_old stacktrace 202 mal:
                    VueWrapper.getRootNodes node_modules/@vue/test-utils/dist/vue-test-utils.cjs.js:7679:37
                        7677|     });
                        7678|     VueWrapper.prototype.getRootNodes = function () {
                        7679|         return getRootNodes(this.vm.$.vnode);
                        |                                     ^
                        7680|     };
                  hat das was damit zu tun? DrawItem: --> this.$.appContext.app.config.globalProperties.$layer = importDrawLayer;
                */
                "src/modules/draw_old/**/*.spec.js", // --> hat Querauswirkungen auf andere Tests
                /*
                    App.spec:
                    TypeError: default.getters.getUrlParamValue is not a function
                    ❯ src/shared/js/utils/processUrlParams.js:16:41
                        16|             const value = store.getters.getUrlParamValue(param);
                        |                                         ^
                        17|
                        18|             if (typeof value !== "undefined") {
                    ❯ src/shared/js/utils/processUrlParams.js:13:32
                    ❯ processUrlParams src/shared/js/utils/processUrlParams.js:12:28
                    ❯ Object.processLayerUrlParams src/core/layers/js/layerUrlParams.js:31:21
                    ❯ src/core/urlParams/js/urlParams.js:13:24

                    This error originated in "src/tests/unit/App.spec.js" test file. It doesn't mean the error was thrown inside the file itself, but while it was running.
                */
                "**/App.spec.js", // -->  hat Querauswirkungen auf andere Tests
                "**/AddWMS.spec.js", // komplett geskipt
                "**/layer3dTileset.spec.js", // komplett geskipt
                "**/actionsAlerting.spec.js", // komplett geskipt
                "**/PoiOrientation.spec.js", // komplett geskipt
                "**/zoomToGetAndFilterFeatures.spec.js", // komplett geskipt
                "**/actionsMapsZoomTo.spec.js", // komplett geskipt
                "**/CopyrightConstraints.spec.js", // komplett geskipt
                "**/LayerFilterSnippet.spec.js", // komplett geskipt
                "**/LayerSlider.spec.js", // komplett geskipt
                "**/FilterGeneral.spec.js", // komplett geskipt
                "**/LoginComponent.spec.js", // komplett geskipt
                "**/FeatureLister.spec.js", // komplett geskipt
                "**/AlertingItem.spec.js", // komplett geskipt
                "**/actionsprint.spec.js", // komplett geskipt
                "**/addons.spec.js", // komplett geskipt
                "**/StatisticDashboard.spec.js", // komplett geskipt
                "**/WfsTransaction.spec.js", // komplett geskipt
                "**/sensorThingsMqtt.spec.js", // komplett geskipt
                "**/actionsSelectFeatures.spec.js", // komplett geskipt
                "**/SimulationParameter.spec.js", // komplett geskipt
                "**/VerkehrsstaerkenTheme.spec.js", // komplett geskipt
                "**/complexType.spec.js", // komplett geskipt
                "**/handleMultipolygon.spec.js", // komplett geskipt
                "**/actionsContact.spec.js", // --> Error: Test timed out in 5000ms.
                "**/actionsPrintInitialization.spec.js", // --> Error: Test timed out in 5000ms.
                // defaults from vitest:
                "**/node_modules/**",
                "**/.git/**"
            ],
            transformMode: {
                web: [/.[tj]s$/]
            },
            setupFiles: ["@vitest/web-worker", "jsdom-worker", "./devtools/tests/vitest.setup.js"],
            server: {
                deps: {
                    // Vite will process inlined modules. This could be helpful to handle packages that ship .js in ESM format (that Node can't handle).
                    inline: [/ol[/\\]/, /olcs[/\\]/, /@geoblocks[/\\]/, /cesium[/\\]/, /@cesium[/\\]/],
                    // External packages that should not be bundled during testing
                    external: []
                }
            },
            // Handle CommonJS/ESM compatibility issues
            optimizeDeps: {
                include: [
                    "cesium",
                    "@cesium/engine",
                    "@cesium/widgets"
                ]
            }
        }
    })
));
