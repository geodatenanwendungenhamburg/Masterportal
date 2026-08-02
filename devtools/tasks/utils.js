import path from "path";
import fs from "fs-extra";

/**
 * walking over the files
 * @param {String} dir name of the directory
 * @returns {void}
 */
function walk (dir) {
    return fs.readdirSync(dir).flatMap(file => {
        const full = path.join(dir, file);

        return fs.statSync(full).isDirectory()
            ? walk(full)
            : full;
    });
}

export {
    walk
};


