import path from "node:path";

const runtimeAssetName = "rolldown-runtime.js",
    runtimeGlobalName = "__MASTERPORTAL_ROLLDOWN_RUNTIME__";

/**
 * Inlines Rolldown's helper runtime into the main bundle.
 * @returns {Object} the created plugin
 */
export default function inlineRolldownRuntime () {
    /**
     * Replaces runtime imports with references to the global runtime object.
     * @param {String} code Chunk source code.
     * @returns {String} Updated chunk source code.
     */
    function replaceRuntimeImport (code) {
        return code.replace(
            /import\s*\{([^}]+)\}\s*from\s*["']\.\/?rolldown-runtime\.js["'];?/g,
            (match, imports) => imports.split(",").map(entry => {
                const [exported, local] = entry.trim().split(/\s+as\s+/);

                return `const ${local || exported} = globalThis.${runtimeGlobalName}.${exported};`;
            }).join("\n")
        );
    }

    /**
     * Creates a global runtime object from the emitted runtime module.
     * @param {String} code Runtime module source.
     * @returns {String} Runtime initialization source.
     */
    function createRuntimeInitializer (code) {
        const exportMatch = code.match(/export\s*\{([^}]+)\};?\s*$/);

        if (!exportMatch) {
            throw new Error("Could not find Rolldown runtime exports");
        }

        const exportsObject = exportMatch[1].split(",").map(entry => {
            const [local, exported] = entry.trim().split(/\s+as\s+/);

            return `${JSON.stringify(exported || local)}: ${local}`;
        }).join(",");

        return [
            `globalThis.${runtimeGlobalName} = (() => {`,
            code.replace(exportMatch[0], `return {${exportsObject}};`),
            "})();",
            ""
        ].join("\n");
    }

    return {
        name: "vite-plugin-inline-rolldown-runtime",
        apply: "build",
        enforce: "post",
        transformIndexHtml: {
            order: "post",
            handler (html) {
                return html.replace(
                    /[ \t]*<script[^>]+src="[^"]*rolldown-runtime\.js"[^>]*><\/script>\r?\n?/g,
                    ""
                );
            }
        },
        generateBundle (options, bundle) {
            const runtimeKey = Object.keys(bundle).find(key => path.posix.basename(key) === runtimeAssetName),
                runtime = runtimeKey ? bundle[runtimeKey] : undefined,
                mainChunk = Object.values(bundle).find(file => file.type === "chunk" && path.posix.basename(file.fileName) === "masterportal.js");

            if (!mainChunk) {
                const chunkNames = Object.values(bundle).filter(file => file.type === "chunk").map(file => file.fileName);

                throw new Error(`Could not locate masterportal.js. Available chunks: ${chunkNames.join(", ")}`);
            }

            // Rolldown does not always extract a separate runtime chunk (e.g. single-entry builds inline it directly); nothing to do then.
            if (!runtime || runtime.type !== "chunk") {
                return;
            }

            for (const file of Object.values(bundle)) {
                if (file.type === "chunk") {
                    file.code = replaceRuntimeImport(file.code);
                }
            }

            mainChunk.code = createRuntimeInitializer(runtime.code) + mainChunk.code;
            delete bundle[runtime.fileName];
        }
    };
}
