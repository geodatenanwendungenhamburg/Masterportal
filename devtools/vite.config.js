import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";
import {nodePolyfills} from "vite-plugin-node-polyfills";
import dynamicImport from "vite-plugin-dynamic-import";
import htmlExtFallback from "./html-ext-fallback.js";


const rootPath = path.resolve(__dirname, "../"),
    entryPoints = htmlExtFallback({rootDir: rootPath}),
    httpsConfig = {
        cert: fs.existsSync("devtools/certificate/localhost.pem")
            ? fs.readFileSync("devtools/certificate/localhost.pem")
            : undefined,
        key: fs.existsSync("devtools/certificate/localhost.key")
            ? fs.readFileSync("devtools/certificate/localhost.key")
            : undefined
    };


let proxyConfig = {},
    addonsRelPaths = await collectAddons();

if (fs.existsSync("./devtools/proxyconf.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf.json", "utf-8"));
}
else if (fs.existsSync("./devtools/proxyconf_example.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf_example.json", "utf-8"));
}

export default defineConfig({
    root: rootPath,
    logLevel: "info",
    base: "/",
    resolve: {
        alias: {
            "@": path.resolve(rootPath, "src"),
            "mixins": path.resolve(rootPath, "src/assets/css/mixins.scss"),
            "variables": path.resolve(rootPath, "src/assets/css/variables.scss"),
            "olcs": path.resolve(rootPath, "node_modules/olcs"),
            "@appstore": path.resolve(rootPath, "src/app-store"),
            "@shared": path.resolve(rootPath, "src/shared"),
            "@core": path.resolve(rootPath, "src/core"),
            "@modules": path.resolve(rootPath, "src/modules"),
            "@plugins": path.resolve(rootPath, "src/plugins"),
            "@devtools": path.resolve(rootPath, "devtools")

        }
    },
    plugins:
    [
        vue(),
        nodePolyfills({
            exclude: [
                "fs" // Excludes the polyfill for `fs` and `node:fs`.
            ]
        }),
        dynamicImport(), // used for dynamic import of addons in src\plugins\addons.js
        htmlExtFallback({
            rootDir: __dirname
        }),
        {
            name: "directory-listing",
            configureServer (server) {
                server.middlewares.use((req, res, next) => {
                    if (!req.url) {
                        next();
                        return;
                    }
                    const requestedPath = path.join(process.cwd(), req.url);

                    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
                        const files = fs.readdirSync(requestedPath);

                        let html = `
                        <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        margin: 20px;
                                    }
                                    h1 {
                                        text-align: center;
                                    }
                                    .file-list {
                                        display: grid;
                                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                                        gap: 10px;
                                        list-style-type: none;
                                        padding: 0;
                                    }
                                    .file-list li {
                                        text-align: center;
                                        padding: 10px;
                                        border: 1px solid #ccc;
                                        border-radius: 5px;
                                        background-color: #f9f9f9;
                                    }
                                    .file-list li a {
                                        text-decoration: none;
                                        color: #333;
                                    }
                                    .file-list li a:hover {
                                        color: #007BFF;
                                    }
                                </style>
                            </head>
                            <body>
                                <h1>Directory Listing</h1>
                                <ul class="file-list">
                    `;

                        files
                            .filter((file) => !file.startsWith("."))
                            .forEach((file) => {
                                const filePath = path.join(req.url, file, "/");

                                html += `<li><a href="${filePath}">${file}</a></li>`;
                            });
                        html += "</ul></body></html>";

                        res.setHeader("Content-Type", "text/html");
                        res.end(html);
                        return;
                    }

                    next();
                });
            }
        }
    ],
    css: {
        devSourcemap: false, // Disable CSS source maps in development for faster build and reload times
        preprocessorOptions: {
            scss: {
                additionalData: "@import \"@/assets/css/global.scss\";"
            }
        }
    },
    esbuild: {
        exclude: [
            ".git",
            "addons/.git"
        ]
    },
    server: {
        port: 9001,
        https: httpsConfig.cert && httpsConfig.key ? httpsConfig : false,
        fs: {
            strict: false,
            allow: [
                path.resolve(rootPath, "src"),
                path.resolve(rootPath, "portal/master")
            ]
        },
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        proxy: Object.fromEntries(
            Object.entries(proxyConfig).map(([key, config]) => {
                const proxyEntry = [
                    key,
                    {
                        target: config.target,
                        changeOrigin: true,
                        rewrite: somePath => {
                            const rewrittenPath = somePath.replace(new RegExp(`^${key}`), "");

                            return rewrittenPath;
                        },
                        secure: false
                    }
                ];

                return proxyEntry;
            })
        )
    },
    build: {
        sourcemap: false,
        outDir: path.resolve(__dirname, "../dist/"),
        // input: entryPoints,
        assetsDir: "js",
        cssCodeSplit: true,
        rollupOptions: {
            // input: entryPoints,
            output: {
                entryFileNames: "js/[name].js",
                chunkFileNames: "js/[name].js",
                assetFileNames: "css/[name].[ext]"
                // format: "es" ? brint das was?
            }
        }
    },
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        VUE_ADDONS: JSON.stringify(addonsRelPaths)
    },
    optimizeDeps: {
        allowNodeBuiltins: true,
        include: [
            "vue",
            "vuex",
            "olcs",
            "bootstrap",
            "axios"
        ],
        exclude: [
            "@turf/turf", // used for addons
            "@turf/helpers", // used for addons
            "@turf/boolean-point-in-polygon", // used for addons
            // add other @turf/* packages we use
            "d3-geo", // used for addons
            "point-in-polygon-hao", // used for addons
            "rollup-plugin-terser", // used for addons
            "polyclip-ts"// used for addons
        ]
    }
});

/**
 * Collects addons from 'addonsConf.json'.
 * @returns {Object} configured addons
 */
async function collectAddons () {
    const rootPath = path.resolve(__dirname, "../"),
        addonBasePath = path.resolve(rootPath, "addons"),
        addonConfigPath = path.resolve(addonBasePath, "addonsConf.json"),
        addonsRelPaths = {};

    if (!fs.existsSync(addonConfigPath)) {
        console.warn("NOTICE: " + addonConfigPath + " not found. Skipping all addons.");
    }
    else {
        const data = fs.readFileSync(addonConfigPath, "utf8"),
            addonEntryPoints = JSON.parse(data);

        for (const addonName in addonEntryPoints) {
            let isVueAddon = false,
                addonPath = addonName,
                entryPointFileName = "";

            if (typeof addonEntryPoints[addonName] === "string") {
                entryPointFileName = addonEntryPoints[addonName];
            }

            // An addon is recognized as Vue-Addon, if:
            // - its configuration value is an object
            // - with at least a key named "type"
            if (typeof addonEntryPoints[addonName] === "object" && addonEntryPoints[addonName].type !== undefined) {
                isVueAddon = true;

                if (typeof addonEntryPoints[addonName].entryPoint === "string") {
                    entryPointFileName = addonEntryPoints[addonName].entryPoint;
                }
                else {
                    entryPointFileName = "index.js";
                }

                if (typeof addonEntryPoints[addonName].path === "string") {
                    addonPath = addonEntryPoints[addonName].path;
                }
            }

            const addonCombinedRelpath = [addonPath, entryPointFileName].join("/");

            // Now check if file exists
            if (!fs.existsSync(path.resolve(addonBasePath, addonCombinedRelpath))) {
                console.error("############\n------------");
                throw new Error("ERROR: FILE DOES NOT EXIST \"" + path.resolve(addonBasePath, addonCombinedRelpath) + "\"\nABORTED...");
            }

            if (isVueAddon) {
                addonsRelPaths[addonName] = Object.assign({
                    "entry": addonCombinedRelpath
                }, addonEntryPoints[addonName]);
            }
        }
        console.info("provided addons:", Object.keys(addonsRelPaths));
        return addonsRelPaths;
    }
}
