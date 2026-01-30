const fs = require("fs");

// The file we want to fix
const FILE = "CHANGELOG.md";
console.log("start script");
if (fs.existsSync(FILE)) {
  let content = fs.readFileSync(FILE, "utf8");

  // Escape Issue hashes
  content = content.replace(/Issue #(\d+)/g, "Issue \\#$1");

  fs.writeFileSync(FILE, content);
  console.log("Changelog auto-fixed.");

  // Re-add file to stage
  require("child_process").execSync("git add CHANGELOG.md");
}
