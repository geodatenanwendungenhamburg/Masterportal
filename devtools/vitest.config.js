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
        css: false, // von inka
        fileParallelism: 8, // todo inka: hat das Auswirkungen?
        /**
         * Setting isolate: false disables test isolation, which means all tests in a file share the same environment and global state.
         * This can cause side effects and make tests fail if they depend on a clean state.
         * But here it is used with 'singleThread: true' and that works.
         */
        isolate: false,
        poolOptions: {
            threads: {
                singleThread: true
            }
        },
        hookTimeout: 500, // von inka: reduce from 20000 to 500 ms
        include: [
            "**/*.spec.js"
            // 'src/core/layers/**/*.spec.js',
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
