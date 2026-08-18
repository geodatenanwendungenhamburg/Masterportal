/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable n/no-process-env */
/* eslint-disable func-style */
import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import glob from "fast-glob";
import fs from "fs";
import {nodePolyfills} from "vite-plugin-node-polyfills";
import cp from "vite-plugin-cp";
import htmlExtFallback from "./tasks/html-ext-fallback-plugin.js";
import {directoryListing} from "./tasks/directory-listing-plugin.js";
import addonModules from "./tasks/addon-modules-plugin.js";
import emptyAddonModulesPlugin from "./tasks/empty-addon-modules-plugin.js";
// import { analyzer } from "vite-bundle-analyzer";// Do not delete, comment in for analyzing bundle content and before install: npm install vite-bundle-analyzer --save-dev
import vmShimPlugin from "./tasks/vm-shim-plugin.js";

import getMastercodeVersionFolderName from "./tasks/getMastercodeVersionFolderName.mjs";
import zipPack from "vite-plugin-zip-pack";
import {HttpsProxyAgent} from "https-proxy-agent";

const {vueAddons} = await collectAddons(),
    examplesOnly = process.env.EXAMPLES_ONLY === "true",
    portalFolderName = process.env.PORTAL_FOLDER || "portal",
    rootPath = path.resolve(__dirname, "../"),
    httpsConfig = {
        cert: fs.existsSync("devtools/certificate/localhost.pem")
            ? fs.readFileSync("devtools/certificate/localhost.pem")
            : undefined,
        key: fs.existsSync("devtools/certificate/localhost.key")
            ? fs.readFileSync("devtools/certificate/localhost.key")
            : undefined
    },
    addonConfigPath = path.resolve(rootPath, "addons/addonsConf.json"),
    hasAddonConfig = fs.existsSync(addonConfigPath),
    localMasterportalApiPath = path.resolve(rootPath, "../masterportalapi"),
    useLocalMasterportalApi = process.env.VITE_LOCAL_MASTERPORTALAPI === "true",
    mastercodeVersionFolderName = process.env.MASTERCODE_VERSION_FOLDER || getMastercodeVersionFolderName(),
    isWin = process.platform === "win32",
    // eslint-disable-next-line no-nested-ternary
    slash = (p) => typeof p === "string" ? isWin ? p.replace(/\\/g, "/") : p : String(p || ""),
    FORCE_HTTPS = process.env.VITE_FORCE_HTTPS === "true";

let portalEntries = glob.sync(`${portalFolderName}/**/index.html`, {cwd: rootPath}).map(file => {
        const portalName = file.split("/").at(-2); // foldernames of portals

        return [`portal-${portalName}`, path.resolve(rootPath, file)];
    }),
    examplesZipName = "",
    proxyConfig = {};
const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY,
    proxyAgent = proxyServer ? new HttpsProxyAgent(proxyServer) : undefined;

if (examplesOnly) {
    portalEntries = portalEntries.filter(([name]) => name === "portal-basic");
    examplesZipName = mastercodeVersionFolderName.indexOf("git_last_commit_at") === -1 ? `examples-${mastercodeVersionFolderName.replaceAll("_", ".")}.zip` : `examples-${mastercodeVersionFolderName}.zip`;
}
if (fs.existsSync("./devtools/proxyconf.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf.json", "utf-8"));
}
else if (fs.existsSync("./devtools/proxyconf_example.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf_example.json", "utf-8"));
}

export default defineConfig(({mode}) => {
    const isProd = mode === "production",
        buildBase = isProd ? `mastercode/${mastercodeVersionFolderName}` : "",
        runtimeBase = isProd ? `../mastercode/${mastercodeVersionFolderName}` : "/";

    console.log("mode", mode);
    console.log("runtimeBase:", runtimeBase);
    console.log("buildBase:", buildBase);
    if (isProd) {
        console.log("portals folder ", portalFolderName);
        console.log("portalEntries", Object.fromEntries(portalEntries));
    }

    return {
        root: rootPath,
        base: "/",
        logLevel: "info",
        // see https://vite.dev/guide/build#advanced-base-options
        // build option used to control how asset URLs are written in generated files,  it is useful when output is deployed in a non-standard folder structure
        experimental: {
            renderBuiltUrl () {
                return {relative: true};
            }
        },

        resolve: {
            alias: {
                "@": path.resolve(rootPath, "src"),
                "mixins": path.resolve(rootPath, "src/assets/css/mixins.scss"),
                "variables": path.resolve(rootPath, "src/assets/css/variables.scss"),
                "ol": path.resolve(rootPath, "node_modules/ol"),
                "proj4": path.resolve(rootPath, "node_modules/proj4"),
                "@appstore": path.resolve(rootPath, "src/app-store"),
                "@shared": path.resolve(rootPath, "src/shared"),
                "@core": path.resolve(rootPath, "src/core"),
                "@modules": path.resolve(rootPath, "src/modules"),
                "@plugins": path.resolve(rootPath, "src/plugins"),
                "@devtools": path.resolve(rootPath, "devtools"),
                ...useLocalMasterportalApi
                    ? {
                        "@masterportal/masterportalapi": localMasterportalApiPath
                    }
                    : {}
            },
            dedupe: ["jsts", "ol", "proj4"]
        },

        plugins: [
            vmShimPlugin(),
            vue(),
            nodePolyfills({
                exclude: ["fs", "vm"]
            }),
            htmlExtFallback({
                rootDir: __dirname
            }),
            directoryListing,
            // Disable addons for examples build to avoid heavy dependencies
            examplesOnly || !hasAddonConfig
                ? emptyAddonModulesPlugin()
                : addonModules({
                    configPath: addonConfigPath,
                    baseDir: path.resolve(rootPath, "addons")
                }),
            {
                name: "remove-crossorigin",
                apply: "build",
                transformIndexHtml (html) {
                    return html.replaceAll(" crossorigin", "");
                }
            },
            {
                name: "fix-index-paths-for-portals",
                apply: "build",
                transformIndexHtml: {
                    order: "post",
                    handler (html) {
                        return html
                            .replace(
                                /src="\/mastercode\/([^"]+)\/js\/([^"]+)"/g,
                                "src=\"../mastercode/$1/js/$2\""
                            )
                            .replace(
                                /href="\/mastercode\/([^"]+)\/css\/([^"]+)"/g,
                                "href=\"../mastercode/$1/css/$2\""
                            );
                    }
                }
            },
            !examplesOnly && {
                ...cp({
                    hook: "writeBundle",
                    targets: [
                        {
                            src: `./${portalFolderName}`,
                            dest: "dist",
                            copyOptions: {
                                filter: (src) => !src.endsWith("/index.html")
                            }
                        },
                        {src: `./dist/${portalFolderName}`, dest: "dist"}
                    ]
                }),
                apply: "build"
            },
            {
                ...cp({
                    hook: "writeBundle",
                    targets: [
                        {src: "./src/assets/img", dest: `dist/mastercode/${mastercodeVersionFolderName}/img`},
                        {src: "./locales", dest: `dist/mastercode/${mastercodeVersionFolderName}/locales`}
                    ]
                }),
                apply: "build"
            },
            examplesOnly && {
                ...cp({
                    hook: "writeBundle",
                    targets: [
                        {src: "./dist/portal/basic/index.html", dest: `dist/examples_${mastercodeVersionFolderName}/basic`},

                        {
                            src: "./portal/basic",
                            dest: `dist/examples_${mastercodeVersionFolderName}/basic`,
                            copyOptions: {
                                filter: (src) => {
                                    const p = slash(src);

                                    return !p.endsWith("/index.html");
                                }
                            }
                        },
                        {
                            src: "./dist/mastercode",
                            dest: `dist/examples_${mastercodeVersionFolderName}/mastercode`
                        },
                        {
                            src: "./src/assets/img",
                            dest: `dist/examples_${mastercodeVersionFolderName}/mastercode/${mastercodeVersionFolderName}/img`
                        },
                        {
                            src: "./locales",
                            dest: `dist/examples_${mastercodeVersionFolderName}/mastercode/${mastercodeVersionFolderName}/locales`
                        }
                    ]
                }),
                apply: "build"
            },
            examplesOnly && {
                ...zipPack({
                    inDir: `dist/examples_${mastercodeVersionFolderName}`,
                    outDir: "dist",
                    outFileName: examplesZipName,
                    pathPrefix: ""
                }),
                name: "zip-pack-versioned",
                apply: "build"
            },
            examplesOnly && {
                ...zipPack({
                    inDir: `dist/examples_${mastercodeVersionFolderName}`,
                    outDir: "dist",
                    outFileName: "examples.zip",
                    pathPrefix: ""
                }),
                name: "zip-pack-examples",
                apply: "build"
            }
            // ,analyzer() //Do not delete, comment in for analyzing bundle content  - start 'npm run buildPortal', results on http://localhost:8888
        ].filter(Boolean),

        css: {
            devSourcemap: false,
            preprocessorOptions: {
                scss: {
                    additionalData: "@import \"@/assets/css/global.scss\";"
                }
            }
        },
        server: {
            port: 9001,
            https: FORCE_HTTPS || (httpsConfig.cert && httpsConfig.key) ? httpsConfig || true : false,
            hmr: {
                protocol: "wss",
                host: "localhost",
                port: 9001
            },
            fs: {
                strict: false,
                allow: [
                    path.resolve(rootPath, "src"),
                    path.resolve(rootPath, "addons"),
                    // todo vite: verallgemeinern! mit ${portalFolderName} oder brauchen wir das denn?
                    path.resolve(rootPath, "portal/master"),
                    path.resolve(rootPath, "../masterportalapi")
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
                            rewrite: somePath => somePath.replace(new RegExp(`^${key}`), ""),
                            secure: false,
                            ...config.agent !== undefined && proxyAgent ? {agent: proxyAgent} : {}
                        }
                    ];

                    return proxyEntry;
                })
            )
        },

        build: {
            assetsDir: "js",
            sourcemap: false,
            cssCodeSplit: true,
            cssMinify: "esbuild",
            chunkSizeWarningLimit: 5000,
            rollupOptions: {
                input: Object.fromEntries(portalEntries),
                output: {
                    assetFileNames: (entry) => {
                        const name = String(entry?.name || ""),
                            extType = name.split(".").at(1),
                            isCss = (/css/i).test(extType);

                        if (isProd && examplesOnly && isCss && name.includes("portal-basic")) {
                            return `${buildBase}/css/masterportal.[ext]`;
                        }

                        let folderName = "js";

                        if (isCss) {
                            folderName = "css";
                        }
                        return `${buildBase}/${folderName}/[name].[ext]`;
                    },
                    entryFileNames: (entry) => {
                        if (entry.name && entry.name.startsWith("addon-")) {
                            return `${buildBase}/addons/${entry.name.substring(6)}.js`;
                        }

                        if (isProd && examplesOnly && entry.name === "portal-basic") {
                            return `${buildBase}/js/masterportal.js`;
                        }

                        return `${buildBase}/js/[name].js`;
                    },
                    chunkFileNames: `${buildBase}/js/[name].js`,
                    // "$initial" only matches statically reachable modules, so addons and other dynamic imports stay lazy.
                    codeSplitting: {
                        groups: [
                            {
                                name: "vendor",
                                test: /[\\/]node_modules[\\/]/,
                                tags: ["$initial"],
                                priority: 10
                            },
                            {
                                name: "masterportal",
                                tags: ["$initial"],
                                priority: 0
                            }
                        ]
                    }
                },
                external (id) {
                    const pid = slash(id);

                    if (pid.includes("/node_modules/")) {
                        return false;
                    }
                    // todo vite: sind die notwendig?
                    if (pid.endsWith("/rollup.config.js")) {
                        return true;
                    }
                    if (pid.endsWith("/bin.js") && pid.includes("/node_modules/")) {
                        return true;
                    }
                    if ((/^rollup-plugin-terser($|\/)/).test(pid)) {
                        return true;
                    }
                    return false;
                }
            }
        },
        define: {
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            VUE_ADDONS: JSON.stringify(vueAddons),
            MASTERPORTAL_BASE_PATH: JSON.stringify(runtimeBase),
            MASTERPORTAL_ASSETS_PATH: JSON.stringify(
                isProd
                    ? `/mastercode/${mastercodeVersionFolderName}/img`
                    : "/src/assets/img"
            )
        },

        optimizeDeps: {
            allowNodeBuiltins: true,
            include: [
                "vue",
                "vuex",
                "olcs",
                "bootstrap",
                "axios",
                "ol-mapbox-style"
            ],
            exclude: [
                "sinon",
                "chai",
                "@turf/turf", // used for addons
                "@turf/boolean-point-in-polygon", // used for addons
                "d3-geo", // used for addons
                "point-in-polygon-hao", // used for addons
                "rollup-plugin-terser", // used for addons
                "polyclip-ts"// used for addons
            ]
        }
    };
});

/**
 * Collects addons from 'addonsConf.json'.
 * @returns {Object} both Vue and plain addons to mimic Webpack's DefinePlugin(ADDONS, VUE_ADDONS).
 */
async function collectAddons () {
    const rootPath = path.resolve(__dirname, "../"),
        addonBasePath = path.resolve(rootPath, "addons"),
        addonConfigPath = path.resolve(addonBasePath, "addonsConf.json"),
        vueAddons = {};

    if (!fs.existsSync(addonConfigPath)) {
        console.warn("NOTICE: " + addonConfigPath + " not found. Skipping all addons.");
        return {vueAddons};
    }

    const data = fs.readFileSync(addonConfigPath, "utf8"),
        addonEntryPoints = JSON.parse(data);
    let addonCombinedRelpath;

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

        addonCombinedRelpath = [addonPath, entryPointFileName].join("/");
        if (!fs.existsSync(path.resolve(addonBasePath, addonCombinedRelpath))) {
            console.error("############\n------------");
            throw new Error(`ERROR: FILE DOES NOT EXIST "${path.resolve(addonBasePath, addonCombinedRelpath)}"\nABORTED...`);
        }

        if (isVueAddon) {
            vueAddons[addonName] = Object.assign({"entry": addonCombinedRelpath}, addonEntryPoints[addonName]);
        }
        else {
            console.warn("Detected addon, that does not follow the rules for addons:", addonName);
            console.warn("rules: its configuration value is an object and with at least a key named \"type\"");
        }
    }
    console.info("provided addons:", JSON.stringify(Object.keys(vueAddons)) + "\n");
    return {vueAddons};
}
