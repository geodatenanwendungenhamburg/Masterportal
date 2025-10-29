import fs from "node:fs";
import path from "node:path";

/**
 * Plugin to provide addons from addonConf.json.
 * @author Michael van Engelshoven, Innoq, Oktober 2025
 * @param {Object} opts Options for the plugin.
 * @param {String} [opts.jsonPath] Path to the addonsConf.json file, which contains add-on configurations.
 * @param {String} [opts.configPath] Alternative name for jsonPath; used internally like jsonPath.
 * @param {String} [opts.baseDir="addons/"] Base directory relative to the Vite root (CWD) that contains the add-on folders.
 * @param {String} [opts.virtualId="virtual:addons-modules"] Virtual module ID under which the generated module is available.
 * @returns {Object} the created plugin
 */
export default function addonsFromJson (opts) {
    const configPath = opts.configPath || opts.jsonPath,
        baseDir = opts.baseDir ?? "addons/",
        virtualId = opts.virtualId ?? "virtual:addon-modules",
        resolvedVirtualId = "\0" + virtualId; // Rollup-Konvention

    /**
     * Reads the configuration from the JSON file
     * @returns {Array} Array of [id, config] entries
     */
    function readConfig () {
        const raw = fs.readFileSync(configPath, "utf-8"),
            data = JSON.parse(raw);

        return Object.entries(data);
    }

    /**
     * Generates the module code for the virtual module
     * @returns {string} The generated module code
     */
    function makeModuleCode () {
        const entries = readConfig(),
            // From JSON → absolute, project-relative paths (Vite root = CWD)
            items = entries.map(([id, addonConfig]) => {
                let addonPath;

                // If path exists, use it, otherwise use the addon-id.
                if (typeof addonConfig === "object" && addonConfig.path) {
                    addonPath = addonConfig.path;
                }
                else {
                    addonPath = id;
                }

                // Create the full path to index.js
                const abs = path.posix.join(
                    "/",
                    baseDir.replace(/\\/g, "/"),
                    addonPath.replace(/\\/g, "/"),
                    "index.js"
                ); // '/addons/path/to/addon/index.js'

                return {id, abs, config: addonConfig};
            }),
            // Virtual module with EXACT dynamic imports
            // -> Only these files will be bundled.
            lines = [];

        lines.push("export default {");
        for (const {id, abs} of items) {
            // Key is the addon-id, Value is a function that imports the module
            lines.push(
                "  " + JSON.stringify(id) + ": () => import(" + JSON.stringify(abs) + "),"
            );
        }
        lines.push("};");

        return lines.join("\n");
    }

    return {
        name: "vite-plugin-addon-modules",
        resolveId (id) {
            if (id === virtualId) {
                return resolvedVirtualId;
            }
            return null;
        },
        load (id) {
            if (id === resolvedVirtualId) {
                return makeModuleCode();
            }
            return null;
        },
        // HMR: Rebuild the JSON virtual module when changes are made
        handleHotUpdate (ctx) {
            const changed = ctx.file
                .replace(/\\/g, "/")
                .endsWith(configPath.replace(/\\/g, "/"));

            if (changed) {
                // Disable the virtual module so that it is regenerated.
                const mod = ctx.server.moduleGraph.getModuleById(resolvedVirtualId);

                if (mod) {
                    ctx.server.moduleGraph.invalidateModule(mod);
                }
                // Optional: Full reload, if you need it
                return [mod].filter(Boolean);
            }
            return [];
        }
    };
}
