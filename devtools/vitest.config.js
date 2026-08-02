import {defineConfig, mergeConfig} from "vitest/config";
import viteConfig from "./vite.config.js";
import {nodePolyfills} from "vite-plugin-node-polyfills";

const addonsConf = {
    exampleSearch: {
        entry: "searchInterfaces/exampleSearch/index.js",
        type: "searchInterface",
        path: "searchInterfaces/exampleSearch"
    },
    exampleControl: {
        entry: "controls/exampleControl/index.js",
        path: "controls/exampleControl",
        type: "control"
    },
    dataTable: {
        entry: "gfiThemes/dataTable/index.js",
        path: "gfiThemes/dataTable",
        type: "gfiTheme"
    },
    exampleVueComponent: {type: "vueComponent"},
    populationRequest: {entry: "populationRequest/index.js", type: "tool"},
    cesium3dTilesInspector: {entry: "cesium3dTilesInspector/index.js", type: "javascript"}
};

export default defineConfig(mode => mergeConfig(
    viteConfig(mode),
    defineConfig({
        plugins: [
            nodePolyfills({
                exclude: ["fs"]
            })
        ],
        css: false,
        test: {
            reporters: [
                ["tree", {summary: true}]
            ],
            // reporters: ["default", "html"],
            allowOnly: true,
            pool: "threads",
            globals: true,
            environment: "jsdom",
            css: false,
            /**
             * Setting isolate: false disables test isolation, which means all tests in a file share the same environment and global state.
             * This can cause side effects and make tests fail if they depend on a clean state.
             */
            isolate: false,
            fileParallelism: true,
            hookTimeout: 5000, // reduce from 20000 to 5000 ms
            include: [
                "src/**/*.spec.js",
                "addons/**/*.spec.js"
            ],
            exclude: [
                // an G31: https://lgv-hamburg.atlassian.net/browse/G31DEV1-3566
                "**/FilterGeneral.spec.js",
                "**/Barchart.spec.js",
                "**/Piechart.spec.js",
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
        },
        define: {
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            VUE_ADDONS: JSON.stringify(addonsConf),
            MASTERPORTAL_BASE_PATH: JSON.stringify("/")
        }
    })
));
