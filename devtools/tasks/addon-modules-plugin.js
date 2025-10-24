// vite.config.ts
import fs from "node:fs";
import path from "node:path";

/**
 * @param {object} opts Optionen für das Plugin.
 * @param {string} [opts.jsonPath] Pfad zur addonsConf.json Datei, die Addon-Konfigurationen enthält.
 * @param {string} [opts.configPath] Alternative Bezeichnung für jsonPath; wird intern wie jsonPath verwendet.
 * @param {string} [opts.baseDir="addons/"] Basisverzeichnis relativ zum Vite-Root (CWD), das die Addon-Ordner enthält.
 * @param {string} [opts.virtualId="virtual:addons-modules"] Virtuelle Modul-ID, unter der das generierte Modul verfügbar ist.
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
            // Aus JSON → absolute, projektrelative Pfade (Vite-Root = CWD)
            items = entries.map(([id, addonConfig]) => {
                let addonPath;

                // Wenn path vorhanden ist, verwende diesen, sonst die addon-id
                if (typeof addonConfig === "object" && addonConfig.path) {
                    addonPath = addonConfig.path;
                }
                else {
                    addonPath = id;
                }

                // Erstelle den vollständigen Pfad zur index.js
                const abs = path.posix.join(
                    "/",
                    baseDir.replace(/\\/g, "/"),
                    addonPath.replace(/\\/g, "/"),
                    "index.js"
                ); // '/addons/path/to/addon/index.js'

                return {id, abs, config: addonConfig};
            }),
            // Virtuelles Modul mit EXAKTEN Dynamik-Imports
            // -> Nur diese Dateien werden gebündelt.
            lines = [];

        lines.push("export default {");
        for (const {id, abs} of items) {
            // Key ist die addon-id, Value ist eine Funktion die das Modul importiert
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
        // HMR: Bei Änderungen an der JSON virtuelles Modul neu bauen
        handleHotUpdate (ctx) {
            const changed = ctx.file
                .replace(/\\/g, "/")
                .endsWith(configPath.replace(/\\/g, "/"));

            if (changed) {
                // invalidiere das virtuelle Modul, damit es neu generiert wird
                const mod = ctx.server.moduleGraph.getModuleById(resolvedVirtualId);

                if (mod) {
                    ctx.server.moduleGraph.invalidateModule(mod);
                }
                // optional: Full Reload, falls du darauf angewiesen bist
                return [mod].filter(Boolean);
            }
            return [];
        }
    };
}
