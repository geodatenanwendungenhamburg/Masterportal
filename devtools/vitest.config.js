/* eslint-disable */
import {defineConfig, mergeConfig} from "vitest/config";
import Vue from "@vitejs/plugin-vue";
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
            // todo: brauchen wir das beim Testen?
            addonModules({
                configPath: "addons/addonsConf.json",
                baseDir: "addons"
            })
        ],
        css: false,
        test: {
            reporters: ["default", "html"],
            pool: "threads", // von inka //--> performance, https://vitest.dev/guide/improving-performance.html
            globals: true,
            environment: "jsdom",
            css: false, // von inka
            fileParallelism: false, // von inka
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
                // "**/modules/**/*.spec.js"
            // 'src/core/layers/**/*.spec.js',
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
