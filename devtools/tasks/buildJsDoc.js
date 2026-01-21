import {exec} from "child-process-promise";
import path from "path";
import fs from "fs-extra";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url),
    __dirname = path.dirname(__filename),
    pathToJsDocCmd = path.resolve(__dirname, "../../node_modules/.bin/jsdoc");

fs.removeSync("jsdoc");
console.warn("===========\nNOTICE: In case JSDOC throws an error with only the file name but not the full file path, you may modify its lib code like this:\n\n1: Go to /masterportal/node_modules/jsdoc/lib/jsdoc/tag/validator.js:9\n\n2: Modify this:\nfunction buildMessage(tagName, {filename, lineno, comment}, desc) {let result = `The @${tagName} tag ${desc}. File: ${filename}, line: ${lineno}`;\n\n...into this:\nfunction buildMessage(tagName, {filename, lineno, comment, path}, desc) {let result = `The @${tagName} tag ${desc}. FILEPATH: ${path}/${filename}:${lineno}`;\n===========\n");
exec(pathToJsDocCmd + " -c ./devtools/jsdoc/jsdoc-config.json");

process.on("unhandledRejection", function (error) {
    throw new Error(error);
});

