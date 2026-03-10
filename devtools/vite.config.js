/* eslint-disable */
// 24.10.2025:
// the changes from Innoq are integrated here
// see https://github.com/micha149/lgv-masterportal/compare/vite-dev...build-setup-enhancements
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import glob from "fast-glob";
import fs from "fs";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cp from "vite-plugin-cp";
import htmlExtFallback from "./tasks/html-ext-fallback-plugin.js";
import { directoryListing } from "./tasks/directory-listing-plugin.js";
import addonModules from "./tasks/addon-modules-plugin.js";
import getMastercodeVersionFolderName from "./tasks/getMastercodeVersionFolderName.mjs";
import zipPack from "vite-plugin-zip-pack";

// Shim for the Node.js "vm" module to avoid Vite build warnings/errors.
// Some dependencies reference "vm", which is not available in the browser.
// This replaces the module with an empty stub, as it is not used at runtime.
const VM_SHIM_ID = "\0vm-shim";
function vmShimPlugin() {
  return {
    name: "vm-shim",
    enforce: "pre",
    resolveId(source) {
      if (source === "vm") return VM_SHIM_ID;
      return null;
    },
    load(id) {
      if (id !== VM_SHIM_ID) return null;
      return "export default {};";
    }
  };
};

let proxyConfig = {},
    { vueAddons } = await collectAddons(),
    base;
const examplesOnly = process.env.EXAMPLES_ONLY === "true",
    portalFolderName = process.env.PORTAL_FOLDER || "portal",
    rootPath = path.resolve(__dirname, "../"),
    httpsConfig = {
        cert: fs.existsSync("devtools/certificate/localhost.pem")
            ? fs.readFileSync("devtools/certificate/localhost.pem")
            : undefined,
        key: fs.existsSync("devtools/certificate/localhost.key")
            ? fs.readFileSync("devtools/certificate/localhost.key")
            : undefined
    };

let portalEntries = glob.sync(`${portalFolderName}/**/index.html`, { cwd: rootPath }).map(file => {
    const portalName = file.split("/").at(-2); // foldernames of portals
    return [`portal-${portalName}`, path.resolve(rootPath, file)];
});

if (examplesOnly) {
    portalEntries = portalEntries.filter(([name]) => name === "portal-basic");
}

const mastercodeVersionFolderName = process.env.MASTERCODE_VERSION_FOLDER || getMastercodeVersionFolderName(),
    isWin = process.platform === "win32",
    slash = (p) => typeof p === "string" ? isWin ? p.replace(/\\/g, "/") : p : String(p || "");

if (fs.existsSync("./devtools/proxyconf.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf.json", "utf-8"));
}
else if (fs.existsSync("./devtools/proxyconf_example.json")) {
    proxyConfig = JSON.parse(fs.readFileSync("./devtools/proxyconf_example.json", "utf-8"));
}
const FORCE_HTTPS = process.env.VITE_FORCE_HTTPS === "true";

export default defineConfig(({ mode }) => {
    const isProd = mode === "production";

    base = isProd
        ? `mastercode/${mastercodeVersionFolderName}`
        : "/";

    console.log("mode", mode);
    console.log("base:", base);
    if (isProd) {
        console.log("portals folder ", portalFolderName);
        console.log("portalEntries", Object.fromEntries(portalEntries));
    }

    return {
        root: rootPath,
        logLevel: "info",

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
            addonModules({
                configPath: "addons/addonsConf.json",
                baseDir: "addons"
            }),
            {
                name: "remove-crossorigin",
                apply: "build",
                transformIndexHtml(html) {
                    return html.replaceAll(" crossorigin", "");
                }
            },
            isProd && examplesOnly && {
                name: "fix-index-for-examples",
                transformIndexHtml(html) {
                    return html
                        .replace(
                            /src="\/mastercode\/([^"]+)\/js\/[^"]+"/,
                            'src="/mastercode/$1/js/masterportal.js"'
                        )
                        .replace(
                            /href="\/mastercode\/([^"]+)\/css\/[^"]+"/,
                            'href="/mastercode/$1/css/masterportal.css"'
                        );
                }
            },

            isProd && !examplesOnly && cp({
                // copy all besides modified index.html files
                targets: [
                    {
                        src: `./${portalFolderName}`,
                        dest: "dist",
                        copyOptions: {
                            filter: (src) => !src.endsWith("/index.html")
                        }
                    },
                    // copy modified index.html files
                    { src: `./dist/${portalFolderName}`, dest: "dist" }
                ]
            }),

            isProd && cp({
                targets: [
                    { src: "./src/assets/img", dest: `dist/mastercode/${mastercodeVersionFolderName}/img` },
                    { src: "./locales", dest: `dist/mastercode/${mastercodeVersionFolderName}/locales` }
                ]
            }),

            isProd && examplesOnly && cp({
                targets: [
                    { src: "./dist/portal/basic/index.html", dest: `dist/examples_${mastercodeVersionFolderName}/basic` },

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
                        src: `./dist/mastercode/${mastercodeVersionFolderName}`,
                        dest: `dist/examples_${mastercodeVersionFolderName}/mastercode/${mastercodeVersionFolderName}`
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

            isProd && examplesOnly && zipPack({
                inDir: `dist/examples_${mastercodeVersionFolderName}`,
                outDir: "dist",
                outFileName: `examples-${mastercodeVersionFolderName}.zip`,
                pathPrefix: ""
            })
        ],

        css: {
            devSourcemap: false,
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
                            rewrite: somePath => somePath.replace(new RegExp(`^${key}`), ""),
                            secure: false
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
            chunkSizeWarningLimit: 5000,
            rollupOptions: {
                input: Object.fromEntries(portalEntries),
                output: {
                    assetFileNames: (entry) => {
                        const name = String(entry?.name || ""),
                              extType = name.split(".").at(1),
                              isCss = /css/i.test(extType);

                        if (isProd && examplesOnly && isCss && name.includes("portal-basic")) {
                            return `${base}/css/masterportal.[ext]`;
                        }

                        let folderName = "js";
                        if (isCss) {
                            folderName = "css";
                        }
                        return `${base}/${folderName}/[name].[ext]`;
                    },
                    entryFileNames: (entry) => {
                        if (entry.name && entry.name.startsWith("addon-")) {
                            return `${base}/addons/${entry.name.substring(6)}.js`;
                        }

                        if (isProd && examplesOnly && entry.name === "portal-basic") {
                            return `${base}/js/masterportal.js`;
                        }

                        return `${base}/js/[name].js`;
                    },
                    chunkFileNames: `${base}/js/[name].js`
                },
                external(id) {
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
            MASTERPORTAL_BASE_PATH: JSON.stringify(
                isProd
                    ? `/${base}`
                    : "/"
            )
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
 * @returns both Vue and plain addons to mimic Webpack's DefinePlugin(ADDONS, VUE_ADDONS).
 */
async function collectAddons() {
    const rootPath = path.resolve(__dirname, "../"),
        addonBasePath = path.resolve(rootPath, "addons"),
        addonConfigPath = path.resolve(addonBasePath, "addonsConf.json"),
        vueAddons = {};

    if (!fs.existsSync(addonConfigPath)) {
        console.warn("NOTICE: " + addonConfigPath + " not found. Skipping all addons.");
        return { vueAddons };
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
            vueAddons[addonName] = Object.assign({ "entry": addonCombinedRelpath }, addonEntryPoints[addonName]);
        }
        else {
            console.warn("Detected addon, that does not follow the rules for addons:", addonName);
            console.warn("rules: its configuration value is an object and with at least a key named \"type\"");
        }
    }
    console.info("provided addons:", JSON.stringify(Object.keys(vueAddons)) + "\n");
    return { vueAddons };
}
