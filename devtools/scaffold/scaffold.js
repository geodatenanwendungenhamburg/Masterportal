/* eslint-disable */

/**
 * Scaffold tool for Masterportal addons.
 *
 * Usage: node scaffold.js <AddonName>

 * Example: node scaffold.js MyAwesomeAddon
 */

const fs = require("fs");
const path = require("path");

function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter, idx) => (idx ? "-" : "") + letter.toLowerCase());
}

function toKebabCase(str) {
    return str.replace(/[A-Z]/g, (letter, idx) => (idx ? "-" : "") + letter.toLowerCase());
}

function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function toPascalCase(str) {
    return str
        .replace(/[-_]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

function toTitleCase (str) {
    return str
        .replace(/[-_]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

function replacePlaceholders(content, addonName) {
    const snake = toSnakeCase(addonName);
    const camel = toCamelCase(addonName);
    const pascal = toPascalCase(addonName);
    const kebab = toKebabCase(addonName);
    const title = toTitleCase(addonName);

    return content
        .replace(/placeholder-addon-name-snake-case/g, snake)
        .replace(/addonNameCamelCase/g, camel)
        .replace(/AddonNamePascalCase/g, pascal)
        .replace(/addonNameKebabCase/g, kebab)
        .replace(/addonNameTitleCase/g, title);
}

function copyAndReplace(params) {
    const { src, dest, addonName, filesIncluded } = params;

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const newItem = item
            .replace(/placeholder-addon-name-snake-case/g, toSnakeCase(addonName))
            .replace(/addonNameCamelCase/g, toCamelCase(addonName))
            .replace(/AddonNamePascalCase/g, toPascalCase(addonName));
        const destPath = path.join(dest, newItem);

        if (fs.statSync(srcPath).isDirectory()) {
            copyAndReplace({ src: srcPath, dest: destPath, addonName, filesIncluded });
        }
        else {
            const ext = path.extname(item);

            let content = fs.readFileSync(srcPath, "utf8");
            let replaced = content;

            if (filesIncluded.includes(ext)) {
                replaced = replacePlaceholders(content, addonName);
            }

            fs.writeFileSync(destPath, replaced, "utf8");
        }
    });
}

function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error("Usage: node scaffold.js <AddonName>");
        process.exit(1);
    }

    const settingsPath = path.join(__dirname, "blueprints", "addon", "scaffold-settings.js");

    let filesIncluded = [".vue", ".js", ".md"];

    if (fs.existsSync(settingsPath)) {
        const scaffoldSettings = require(settingsPath);
        filesIncluded = (scaffoldSettings.default && scaffoldSettings.default.filesIncluded) || scaffoldSettings.filesIncluded || filesIncluded;
    }

    const rawInput = args[0];
    const addonName = toPascalCase(rawInput);

    const blueprintRoot = path.join(__dirname, "blueprints/addon", "addonNameCamelCase");
    const targetRoot = path.join(__dirname, "../../dist_scaffold/addons/", toCamelCase(addonName));

    if (!fs.existsSync(blueprintRoot)) {
        console.error("Blueprint not found:", blueprintRoot);
        process.exit(1);
    }

    copyAndReplace({ src: blueprintRoot, dest: targetRoot, addonName, filesIncluded });
    console.log(`Scaffold created at\n\n${targetRoot}\n`);

}

if (require.main === module) {
    main();
}