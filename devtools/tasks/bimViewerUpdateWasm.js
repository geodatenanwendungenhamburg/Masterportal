const
    fs = require("fs-extra"),
    path = require("path"),
    inquirer = require("inquirer"),
    {styleText} = require("node:util"),
    inquirerQuestions = [
        {
            type: "input",
            name: "portalPath",
            message: "Path to a portal with configured BimViewer module, starting from \"[...]/masterportal/\":",
            default: "portal/bim"
        }
    ],
    taskConfiguration = {
        nodeWebIfcPackageName: "web-ifc",
        nodeWebIfcPackageWasmFiles: [
            "web-ifc-mt.wasm",
            "web-ifc.wasm"
        ],
        wasmUrl: "wasm"
    };

inquirer.prompt(inquirerQuestions).then(function (answer) {
    const
        masterportalPath = path.resolve(__dirname, "../../"),
        portalPath = `${masterportalPath}/${answer.portalPath}`,
        nodePackageWebIfcPath = `${masterportalPath}/node_modules/${taskConfiguration.nodeWebIfcPackageName}`;

    // Portal folder exists?
    if (!fs.existsSync(portalPath)) {
        process.stdout.write(`\n${styleText(["red"], "Error:")} Portal path "${portalPath}" does not exist.\n\n`);

        return;
    }

    // Nodejs package folder exists?
    if (!fs.existsSync(nodePackageWebIfcPath)) {
        process.stdout.write(`\n${styleText(["red"], "Error:")} Node module "${taskConfiguration.nodeWebIfcPackageName}" is missing. Please run \`npm install\`\n\n`);

        return;
    }

    // Invalid portal, no config
    if (!fs.existsSync(`${portalPath}/config.json`)) {
        process.stdout.write(`\n${styleText(["red"], "Error:")} Invalid portal — missing config.json at "${portalPath}"\n\n`);

        return;
    }

    // Load config.json
    const
        configJson = require(`${portalPath}/config.json`),
        allSections = [
            configJson.portalConfig.mainMenu?.sections || [],
            configJson.portalConfig.secondaryMenu?.sections || []
        ],
        bimViewerConfig = allSections
            .flatMap(sections => sections.flat())
            .find(item => item.type === "bimViewer");

    // bimViewer found in config.json?
    if (!bimViewerConfig) {
        process.stdout.write(`\n${styleText(["red"], "Error:")} Portal "${portalPath}/config.json" has no configured bimViewer module!\n\n`);

        return;
    }

    // Find wasm configuration
    // eslint-disable-next-line one-var
    const
        wasmUrl = bimViewerConfig.wasmUrl || taskConfiguration.wasmUrl,
        wasmUrlIsRelative = !(/^(https?:)?\/\//i).test(wasmUrl);

    // Relative wasm path?
    if (!wasmUrlIsRelative) {
        process.stdout.write(`\n${styleText(["red"], "Skipping:")} wasmUrl points to an external URL. Please copy files manually!\n\n`);

        return;
    }

    const
        packageJson = require(`${masterportalPath}/package-lock.json`),
        packageVersion = packageJson.packages[""].dependencies["web-ifc"];

    process.stdout.write("\n");

    // Start copy process
    taskConfiguration.nodeWebIfcPackageWasmFiles.forEach((file) => {
        const
            sourceFile = `${masterportalPath}/node_modules/${taskConfiguration.nodeWebIfcPackageName}/${file}`,
            destinationFolder = path.resolve(portalPath, wasmUrl),
            sourceFileBasename = path.basename(file),
            destinationFile = path.join(destinationFolder, sourceFileBasename);

        // Copy files
        try {
            fs.copySync(sourceFile, destinationFile);
            process.stdout.write(`- Copied ${file} >> ${destinationFile}\n`);
        }
        catch (error) {
            console.error(error);
        }
    });

    // Write version.txt
    try {
        const
            versionFilePath = path.join(path.resolve(portalPath, wasmUrl), "wasm-version.md"),
            versionText = `# WebAssembly files for the BimViewer module

> This file is auto-generated. Do not edit manually!

The following WebAssembly files are required to use the BimViewer module:

${taskConfiguration.nodeWebIfcPackageWasmFiles.map(file => `- \`${file}\``).join("\n")}

These files are part of the \`web-ifc\` npm package and must be accessible via a web server.

### Update Instructions

To update the WebAssembly files in your portal, run:

\`\`\`bash
npm run bimviewer-update-wasm
\`\`\`

This will automatically copy the files to the specified portal and generate this wasm-version.md file.

### Current web-ifc Version

- Package: \`web-ifc v${packageVersion}\`
- [View GitHub Releases](https://github.com/ThatOpen/engine_web-ifc/releases/)
            `;

        fs.writeFileSync(versionFilePath, versionText);

        process.stdout.write(`\nGenerated version info: ${versionFilePath}\n`);

        process.stdout.write(`\n${styleText(["green"], "Finished successfully")} \n\n`);
    }
    catch (error) {
        console.error(error);
    }
});
