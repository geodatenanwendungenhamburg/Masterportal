const path = require("path"),
    rootPath = path.resolve(__dirname, "../../"),
    stableVersionNumber = require(path.resolve(rootPath, "devtools/tasks/getStableVersionNumber"))(),
    gitRevSync = require("git-rev-sync"),
    dayjs = require("dayjs");

/**
 * Generates a versioned folder name based on the current stable version number,
 * Git information (branch, tag, commit), and timestamps.
 *
 * @module utilities/getMastercodeVersionFolderName
 * @returns {String} A unique folder name string, formatted with the stable version,
 *                   branch, Git last commit date.
 *
 * @requires path - Node's path module for handling and transforming file paths.
 * @requires gitRevSync - A module for synchronously retrieving Git information (`gitRevSync.date()` provides the date of the current commit).
 * @requires dayjs - A library for parsing, formatting, and manipulating dates.
 */
module.exports = function getMastercodeVersionFolderName () {
    let folderName = stableVersionNumber;
    const tag = gitRevSync.tag().replace(/\./g, "_").slice(1),
        branch = gitRevSync.branch(),
        long = gitRevSync.long();

    if (stableVersionNumber !== tag || !branch.includes(long)) {
        const gitLastCommitDate = dayjs(gitRevSync.date()).format("YYYY-MM-DD__HH-mm-ss");


        folderName += `_${gitRevSync.branch()}_git_last_commit_at_${gitLastCommitDate }`;
    }

    return folderName.replace(/[\s:]+/g, "").replace(/#/g, "");
};
