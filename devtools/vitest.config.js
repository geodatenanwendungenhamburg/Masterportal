import {defineConfig} from "vitest/config";
import Vue from "@vitejs/plugin-vue";
import commonConfig from "./vite.config.js";
import {nodePolyfills} from "vite-plugin-node-polyfills";


const viteConfig = defineConfig({
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
        pool: 'forks',
            poolOptions: {
            forks: {
                execArgv: [
                '--cpu-prof',
                '--cpu-prof-dir=test-runner-profile',
                '--heap-prof',
                '--heap-prof-dir=test-runner-profile'
                ],

                // To generate a single profile
                singleFork: true,
            },
        },
        reporters: "default",
        // reporters: "html",
        globals: true,
        environment: "jsdom",
        css:false,
        // include:['src/**/*.spec.js'],
        // include:['**/VerkehrsstaerkenTheme.spec.js'], //test runs sucessfully
        // include:['addons/vpiDashboard/**/*.spec.js'], //test runs sucessfully
        // include:['addons/**/*.spec.js'],
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