import path from "path";
import { execSync } from "child_process";
import dayjs from "dayjs";
import getStableVersionNumber from "./getStableVersionNumber.mjs";

function git(cmd, cwd) {
    try {
        return execSync(cmd, { cwd, encoding: "utf8" }).trim();
    } catch {
        return "";
    }
}

export default function getMastercodeVersionFolderName() {
    const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../");
    const stableVersionNumber = getStableVersionNumber();
    let folderName = stableVersionNumber;

    //  gitRevSync
    const tagRaw = git("git describe --tags --abbrev=0", repoRoot); // e.g. v3.13.0
    const tag = tagRaw ? tagRaw.replace(/^v/, "").replace(/\./g, "_") : "";
    const branch = git("git rev-parse --abbrev-ref HEAD", repoRoot);
    const long = git("git rev-parse --short HEAD", repoRoot);
    const dateStr = git("git log -1 --format=%cd --date=format:'%Y-%m-%d__%H-%M-%S'", repoRoot).replace(/'/g, "");

    if (stableVersionNumber !== tag || !branch.includes(long)) {
        const gitLastCommitDate = dateStr || dayjs().format("YYYY-MM-DD__HH-mm-ss");
        folderName += `_${branch}_git_last_commit_at_${gitLastCommitDate}`;
    }

    return folderName.replace(/[\s:]+/g, "").replace(/#/g, "");
}