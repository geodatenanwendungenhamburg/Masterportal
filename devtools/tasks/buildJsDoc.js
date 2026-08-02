import {exec} from "child-process-promise";
import path from "path";
import fs from "fs-extra";
import {fileURLToPath} from "url";
import {walk} from "./utils.js";

const __filename = fileURLToPath(import.meta.url),
    __dirname = path.dirname(__filename),
    pathToJsDocCmd = path.resolve(__dirname, "../../node_modules/.bin/jsdoc");

fs.removeSync("jsdoc");
console.warn("===========\nNOTICE: In case JSDOC throws an error with only the file name but not the full file path, you may modify its lib code like this:\n\n1: Go to /masterportal/node_modules/jsdoc/lib/jsdoc/tag/validator.js:9\n\n2: Modify this:\nfunction buildMessage(tagName, {filename, lineno, comment}, desc) {let result = `The @${tagName} tag ${desc}. File: ${filename}, line: ${lineno}`;\n\n...into this:\nfunction buildMessage(tagName, {filename, lineno, comment, path}, desc) {let result = `The @${tagName} tag ${desc}. FILEPATH: ${path}/${filename}:${lineno}`;\n===========\n");

console.warn("Running JSDoc...");

/**
 * Building JsDocs
 */
async function build () {
    try {
        await exec(
            `${pathToJsDocCmd} -c ./devtools/jsdoc/jsdoc-config.json`
        );

        cleanupJsDocHtml("./jsdoc");

        console.warn("JSDoc created. You can find the generated documentation in the 'jsdoc' folder.");
    }
    catch (err) {
        throw new Error(err);
    }
}


/**
 * Workaround for Docdash + jsdoc-vuejs.
 *
 * jsdoc-vuejs injects generated Vue documentation into the
 * description field. Docdash renders the description twice,
 * causing duplicated Vue sections and malformed HTML that
 * breaks page layout.
 *
 * This cleanup removes the duplicated description block and
 * malformed tags after JSDoc generation.
 */
function cleanupJsDocHtml (dir) {
    const files = walk(dir).filter(file => file.endsWith(".html"));

    for (const file of files) {
        let html = fs.readFileSync(file, "utf8");

        html = html
            .replaceAll("</div></div></p>", "")
            .replaceAll("<div class=\"container-overview\"><div><p>", "");
        html = html.replace(
            /<dt class="tag-description">Description:<\/dt>\s*<dd class="tag-description">([\s\S]*?)<\/dd>/g,
            (match) => {
                return match.includes("data-jsdoc-vuejs") ? "" : match;
            }
        );
        fs.writeFileSync(file, html);
    }
}

build();

process.on("unhandledRejection", function (error) {
    throw new Error(error);
});

