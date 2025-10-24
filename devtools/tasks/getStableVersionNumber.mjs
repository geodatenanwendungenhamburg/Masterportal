import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
    readFileSync(path.resolve(__dirname, "../../package.json"), "utf8")
);

export default function getStableVersionNumber(delimiter = "_") {
    return pkg.version.replace(/\./g, delimiter);
}
