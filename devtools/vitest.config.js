import {mergeConfig} from "vitest/config";
import Vue from "@vitejs/plugin-vue";
import commonConfig from "./vite.config.js";
import {nodePolyfills} from "vite-plugin-node-polyfills";


const viteConfig = mergeConfig({
    ...commonConfig,
    plugins: [
        Vue(),
        nodePolyfills({
            exclude: [
                "fs" // Excludes the polyfill for `fs` and `node:fs`.
            ]
        })
    ],
    css: false,
    test: {
        reporters: ["default", "html"],
        // reporters: "default",
        pool: "threads", // von inka //--> performance, https://vitest.dev/guide/improving-performance.html
        globals: true,
        environment: "jsdom",
        css:false,// von inka
        include:[
            // 'src/app-store/**/*.spec.js',
            // 'src/core/**/*.spec.js',
            //modules
            'src/modules/about/**/*.spec.js',
            'src/modules/addWMS/**/*.spec.js',
            'src/modules/alerting/**/*.spec.js',
            'src/modules/baselayerSwitcher/**/*.spec.js',
            'src/modules/bufferAnalysis/**/*.spec.js',
            'src/modules/compareFeatures/**/*.spec.js',
            'src/modules/compareMaps/**/*.spec.js',
            'src/modules/contact/**/*.spec.js',
            'src/modules/controls/**/*.spec.js',
            'src/modules/coordToolkit/**/*.spec.js',
            // 'src/modules/controls/freeze/**/*.spec.js',
        ],
        transformMode: {
            web: [/.[tj]s$/]
        },
        setupFiles: ["@vitest/web-worker", "jsdom-worker", "vitest.setup.js"],
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
});

export default viteConfig;
