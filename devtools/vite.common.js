import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { resolve } from 'path'

// import fs from "fs";
// import htmlPurge from "vite-plugin-html-purgecss";

const rootPath = path.resolve(__dirname, "../"),
    // addonBasePath = path.resolve(rootPath, "addons"),
    // addonConfigPath = path.resolve(addonBasePath, "addonsConf.json"),
    entryPoints = {masterportal: path.resolve(rootPath, "src/main.js")};
    // addonsRelPaths = {},
    // vueAddonsRelPaths = {};

// let addonEntryPoints = {};

// if (fs.existsSync(addonConfigPath)) {
//     addonEntryPoints = JSON.parse(fs.readFileSync(addonConfigPath, "utf-8"));
// }
// else {
//     console.warn(`NOTICE: ${addonConfigPath} not found. Skipping all addons.`);
// }


// for (const addonName in addonEntryPoints) {
//     let isVueAddon = false,
//         addonPath = addonName,
//         entryPointFileName = "";

//     if (typeof addonEntryPoints[addonName] === "string") {
//         entryPointFileName = addonEntryPoints[addonName];
//     }

//     if (typeof addonEntryPoints[addonName] === "object" && addonEntryPoints[addonName].type) {
//         isVueAddon = true;
//         entryPointFileName = addonEntryPoints[addonName].entryPoint || "index.js";
//         addonPath = addonEntryPoints[addonName].path || addonPath;
//     }

//     const addonCombinedRelpath = `${addonPath}/${entryPointFileName}`;

//     // if (!fs.existsSync(path.resolve(addonBasePath, addonCombinedRelpath))) {
//     //     throw new Error(`ERROR: FILE DOES NOT EXIST "${path.resolve(addonBasePath, addonCombinedRelpath)}"\nABORTED...`);
//     // }

//     if (isVueAddon) {
//         vueAddonsRelPaths[addonName] = {entry: addonCombinedRelpath, ...addonEntryPoints[addonName]};
//     }
//     else {
//         addonsRelPaths[addonName] = addonCombinedRelpath;
//     }
// }

// Debugging logs
console.log("Root Path:", rootPath);
console.log("Resolved Alias for @:", path.resolve(rootPath, "src"));
console.log("Resolved Alias for mixins:", path.resolve(rootPath, "src/assets/css/mixins.scss"));
console.log("Resolved Alias for variables:", path.resolve(rootPath, "src/assets/css/variables.scss"));
console.log("Build Output Directory:", path.resolve(__dirname, "../build/"));
console.log("Entry Points:", entryPoints);
console.log("Excluded Dependencies:", [
    "resolve/test",
    "ssf",
    "xlsx",
    "cfb",
    "codepage",
    "crc-32",
    "frac",
    "printj"
]);
console.log("ESBuild Exclusions:", [".git", "addons/.git"]);

export default defineConfig({
    root: resolve(__dirname, '../'),
    resolve: {
        alias: {
            "@": path.resolve(rootPath, "src"),
            "mixins": path.resolve(rootPath, "src/assets/css/mixins.scss"),
            "variables": path.resolve(rootPath, "src/assets/css/variables.scss")
        }
    },
    // plugins: [vue(), htmlPurge()],
    plugins: [vue()],
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: "@use \"@/assets/css/mixins.scss\"; @use \"@/assets/css/variables.scss\";"
            }
        }
    },
    build: {
        // outDir: path.resolve(__dirname, "../build/"),
        rollupOptions: {
            // input: entryPoints,
            input: {
                master: resolve(__dirname, '../portal/master/index.html'),
                basic: resolve(__dirname, '../portal/basic/index.html'),
            }
            
            // output: {
            //     entryFileNames: "js/[name].js",
            //     chunkFileNames: 'js/[name].js',
            //     // assetFileNames: "css/[name].[ext]",
            //     publicPath: "../../build/"
            // }
        },
        outDir: 'dist',
        emptyOutDir: true
    },
    optimizeDeps: {
        exclude: [
            "resolve/test",
            "ssf",
            "xlsx",
            "cfb",
            "codepage",
            "crc-32",
            "frac",
            "printj"
        ]
    },
    esbuild: {
        exclude: [".git", "addons/.git"]
    },
    define: {
        // ADDONS: JSON.stringify(addonsRelPaths),
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false
        // VUE_ADDONS: JSON.stringify(vueAddonsRelPaths)
    }
});
