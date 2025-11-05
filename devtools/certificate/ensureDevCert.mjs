// auto-dev cert generator (OpenSSL + req.cnf).

import {existsSync, writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// This script lives in devtools/certificate → use this folder directly.
const certDir = __dirname;
const P = (f) => path.join(certDir, f);

const KEY = P("localhost.key");
const CSR = P("localhost.csr");
const PEM = P("localhost.pem");
const CNF = P("req.cnf");

// Tiny helper to run openssl and fail fast
const sh = (args, stdio = "inherit") => spawnSync("openssl", args, {stdio}).status === 0;

const defaultCnf =
`[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
C = DE
ST = State
L = Location
O = Masterportal
OU = Dev
CN = localhost
[v3_req]
keyUsage = critical, digitalSignature, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = ::1
`;

// 1) Ensure req.cnf
if (!existsSync(CNF)) {
  writeFileSync(CNF, defaultCnf, "utf8");
  console.log(`[dev-cert] wrote default req.cnf → ${CNF}`);
}

// 2) If both key & cert exist → done
if (existsSync(KEY) && existsSync(PEM)) {
  console.log("[dev-cert] dev certificate already present ✔");
  process.exit(0);
}

// 3) Check openssl presence
if (!sh(["version"], "ignore")) {
  console.warn("[dev-cert] OpenSSL not found. Dev server will start on HTTP this time.\n" +
               "Install OpenSSL or run once:\n" +
               "  cd devtools/certificate && openssl genrsa -out localhost.key 2048 &&\n" +
               "  openssl req -new -key localhost.key -out localhost.csr -config req.cnf &&\n" +
               "  openssl x509 -req -days 3650 -in localhost.csr -signkey localhost.key -out localhost.pem -extensions v3_req -extfile req.cnf");
  process.exit(0);
}

// 4) Generate key → csr → cert
console.log("[dev-cert] generating localhost.key …");
if (!sh(["genrsa", "-out", KEY, "2048"])) process.exit(1);

console.log("[dev-cert] generating localhost.csr …");
if (!sh(["req", "-new", "-key", KEY, "-out", CSR, "-config", CNF])) process.exit(1);

console.log("[dev-cert] generating localhost.pem …");
if (!sh(["x509", "-req", "-days", "3650", "-in", CSR, "-signkey", KEY, "-out", PEM, "-extensions", "v3_req", "-extfile", CNF])) process.exit(1);

console.log("[dev-cert] ✅ certificates ready:", KEY, PEM);
