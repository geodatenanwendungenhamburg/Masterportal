import {exec} from "child_process";
import readline from "readline";
import fs from "fs";

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    question = "Path to the folder containing portals starting from \"[...]/masterportal/\", default is \"portal\":";

rl.question(question, (folder) => {
    if (folder.trim() === "") {
        folder = "portal";
        console.log("\nUsing default:", folder);
    }
    else {
        if (!fs.existsSync(`./${folder}`)) {
            console.log(`folder "${folder}" does not exist, please enter an existing folder!`);
            rl.close();
            process.exit(1);
        }
        console.log("\nUsing folder:", folder);
    }
    const command = `cross-env PORTAL_FOLDER=${folder} vite build --config devtools/vite.config.js && rm -rf dist/${folder}`;

    console.log("\n🚀 Starting build...\n", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Build failed: ${error.message}`);
            rl.close();
            process.exit(1);
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }

        console.log(stdout);
        console.log("\n✅ Build completed successfully!");
        rl.close();
    });

});
