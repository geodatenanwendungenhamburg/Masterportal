/* eslint-disable no-console */
import readline from "readline";
import migrator from "./migrateConfigFiles.js";

const infoMessage = "The paths to the portal or folder with portals must start from \"[...]/masterportal/\")!",
    sourceMessage = "source path to the portal or folder with portals to migrate",
    destMessage = "destination path to store the migrated portal(s)",
    questionsArr = [
        {name: "sourcePath", message: sourceMessage + ":\n", default: "portal/master"},
        {name: "destPath", message: destMessage + ":\n", default: "portal/destination"}
    ],
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

let sourcePath = null,
    destPath = null,
    usagePrinted = false;

/**
 * Asks the questions in console.
 * @param {Array} questions the questions
 * @param {Object} callback the callback
 * @returns {Object} answers
 */
function askQuestions (questions, callback) {
    const answers = {};
    let i = 0;

    /**
     * Asks the next questions in console.
     *  @returns {void}
     */
    function askNext () {
        if (i < questions.length) {
            rl.question(questions[i].message, (answer) => {
                answers[questions[i].name] = answer || questions[i].default;
                i++;
                askNext();
            });
        }
        else {
            // eslint-disable-next-line n/callback-return
            callback(answers);
            rl.close();
        }
    }

    askNext();
}

process.argv.forEach((val) => {
    const splitted = val.split("=");

    if (splitted.length === 2) {
        if (splitted[0] === "source") {
            sourcePath = splitted[1];
            console.info("sourcePath=", sourcePath);
        }
        else if (splitted[0] === "dest") {
            destPath = splitted[1];
            console.info("destPath=", destPath);
        }
    }
});

if (process.argv.length > 2 && (sourcePath === null || destPath === null)) {
    printUsage();
}
else if (sourcePath && destPath) {
    migrator.migrate({
        sourcePath, destPath
    });
}
else if (!usagePrinted) {
    console.info(infoMessage);
    askQuestions(questionsArr, (answers) => {
        migrator.migrate(answers);
    });

}

/**
 * Prints the usage.
 * @returns {void}
 */
function printUsage () {
    usagePrinted = true;
    console.info("Script to migrate masterportal configuration files to version 3.0.0");
    console.info("--------------------------------------------------------------------");
    console.info("Parameters:");
    console.info("source=" + sourceMessage);
    console.info("dest=" + destMessage);
    console.info("\n");
    console.info(infoMessage);
    console.info("If no parameters are given, the user is asked to enter the paths.");
    console.info("\n");
    console.info("example: npm run migrateConfig source=portal/master dest=portal/destination");
}
