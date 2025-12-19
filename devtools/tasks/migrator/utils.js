import {readdir, mkdir, copyFile} from "fs/promises";
import path from "path";
import {replacementsInConfigJson} from "./configuration.js";
import {replaceInFileSync} from "replace-in-file";
import {PORTALCONFIG_OLD} from "./constants.js";

/**
 * Removes all attributes from tool config found in 'toRemoveFromTools'.
 * @param {Object} toRemoveFromTools attributes to remove from tools by type
 * @param {Object} tool tool config, must contain 'type'
 * @returns {void}
 */
function removeAttributesFromTools (toRemoveFromTools, tool) {
    toRemoveFromTools.all.forEach(attribute => {
        delete tool[attribute];
    });
    if (toRemoveFromTools[tool.type]) {
        toRemoveFromTools[tool.type].forEach(attribute => {
            delete tool[attribute];
        });
    }
}

/**
 * Copies src directory to dest directory.
 * @param {String} src the source path of the portal
 * @param {String} dest the destination path to store the portal
 * @returns {void}
 */
async function copyDir (src, dest) {
    await mkdir(dest, {recursive: true});
    const entries = await readdir(src, {withFileTypes: true});

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name),
            destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        }
        else {
            await copyFile(srcPath, destPath);
        }
    }
}

/**
 * Replaces strings in file.
 * @param {Object} file the file to replace in
 * @returns {void}
 */
function replaceInFile (file) {
    Object.entries(replacementsInConfigJson).forEach(([key, value]) => {
        // to replace all(!) occurrences of key in file, use regex with g flag
        const regex = new RegExp(key, "g");

        replaceInFileSync({
            files: file,
            from: regex,
            to: value
        });
    });
}

/**
 * Returns the tool config with the given name.
 * @param {Object} data content of v2 config.json
 * @param {String} name of the tool to search for
 * @returns {Object} the tool config with the given name
 */
function getToolFromOldConfig (data, name) {
    const tools = data[PORTALCONFIG_OLD].menu.tools?.children;
    let oldToolConfig = null;

    if (tools) {
        Object.entries(tools).forEach(([toolName, toolConfig]) => {
            if (toolName === name) {
                oldToolConfig = toolConfig;
            }
        });
    }
    return oldToolConfig;
}

/**
 * If 'translate#' is contained in name, the name is deleted.
 * @param {Object} toolConfig config of a tool
 * @returns {void}
 */
function deleteTranslateInName (toolConfig) {
    if (toolConfig.name?.includes("translate#")) {
        delete toolConfig.name;
    }
}

/**
 * Layer Ids with suffix are migrated.
 * @param {Array} layers to inspect
 * @returns {void}
 */
function migrateIdWithSuffix (layers) {
    layers?.forEach(layer => {
        if (typeof layer.id === "object" && !Array.isArray(layer.id)) {
            const idCopy = {...layer.id};

            layer.id = idCopy.layerId + "." + idCopy.suffix;
        }
        else if (Array.isArray(layer.id)) {
            layer.id = layer.id.map(id => {
                return id;
            });
        }
    });
}


export {
    copyDir,
    deleteTranslateInName,
    getToolFromOldConfig,
    migrateIdWithSuffix,
    removeAttributesFromTools,
    replaceInFile
};
