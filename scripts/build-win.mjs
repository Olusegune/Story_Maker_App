// Windows build wrapper.
//
// Two jobs:
//   1. Work around the long-standing electron-builder EPERM when the output
//      dir is under Documents — always build to C:/wbs-build-test, then copy
//      the three artifacts into dist-release/.
//   2. Turn on Azure Trusted Signing ONLY when it's actually configured:
//      a gitignored signing.config.json (or STORYMAKER_SIGN_* env) supplies
//      the account/profile/endpoint, and AZURE_TENANT_ID / AZURE_CLIENT_ID /
//      AZURE_CLIENT_SECRET authenticate. With neither present the build runs
//      exactly as before and produces working unsigned installers — nothing
//      is added to package.json's `build` block, so a plain
//      `electron-builder` invocation elsewhere is unaffected.
//
// See docs/CODE_SIGNING.md for the one-time Azure setup.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const OUT_DIR = process.env.STORYMAKER_BUILD_OUT || "C:/wbs-build-test";
// Invoke the local JS entry points with the current node binary directly.
// Going through npx/npm on Windows means spawning a .cmd, which recent
// Node refuses without shell:true (EINVAL), and shell:true then needs
// arg escaping — this side-steps both.
const BIN = {
  vite: path.join(root, "node_modules", "vite", "bin", "vite.js"),
  "electron-builder": path.join(root, "node_modules", "electron-builder", "cli.js")
};
const run = (tool, args, opts = {}) => {
  const r = spawnSync(process.execPath, [BIN[tool], ...args], { stdio: "inherit", cwd: root, ...opts });
  if (r.error) { console.error(r.error.message); process.exit(1); }
  if (r.status !== 0) { console.error(`\n${tool} exited ${r.status}`); process.exit(r.status || 1); }
};

// ---- signing config --------------------------------------------------
function signingConfig() {
  let file = {};
  try { file = JSON.parse(fs.readFileSync(path.join(root, "signing.config.json"), "utf8")); } catch { file = {}; }
  const cfg = {
    endpoint: process.env.STORYMAKER_SIGN_ENDPOINT || file.endpoint || "",
    codeSigningAccountName: process.env.STORYMAKER_SIGN_ACCOUNT || file.codeSigningAccountName || "",
    certificateProfileName: process.env.STORYMAKER_SIGN_PROFILE || file.certificateProfileName || "",
    publisherName: process.env.STORYMAKER_SIGN_PUBLISHER || file.publisherName || pkg.build?.productName || ""
  };
  const haveProfile = cfg.endpoint && cfg.codeSigningAccountName && cfg.certificateProfileName;
  const haveAuth = process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID
    && (process.env.AZURE_CLIENT_SECRET || process.env.AZURE_CLIENT_CERTIFICATE_PATH || (process.env.AZURE_USERNAME && process.env.AZURE_PASSWORD));
  return { cfg, enabled: Boolean(haveProfile && haveAuth), haveProfile: Boolean(haveProfile), haveAuth: Boolean(haveAuth) };
}

// `node scripts/build-win.mjs --check-signing` — report the signing
// decision and exit without building. Handy for confirming setup.
if (process.argv.includes("--check-signing")) {
  const { cfg, enabled, haveProfile, haveAuth } = signingConfig();
  console.log(JSON.stringify({ enabled, haveProfile, haveAuth, endpoint: cfg.endpoint || null, codeSigningAccountName: cfg.codeSigningAccountName || null, certificateProfileName: cfg.certificateProfileName || null, publisherName: cfg.publisherName || null }, null, 2));
  process.exit(0);
}

// ---- 1. renderer ---------------------------------------------------
console.log("→ vite build");
run("vite", ["build"]);

// ---- 2. electron-builder -----------------------------------------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
const args = ["--win", "--publish", "never", `-c.directories.output=${OUT_DIR}`];
const { cfg, enabled, haveProfile, haveAuth } = signingConfig();
if (enabled) {
  console.log(`→ Azure Trusted Signing ON  (account "${cfg.codeSigningAccountName}", profile "${cfg.certificateProfileName}")`);
  args.push(
    `-c.win.azureSignOptions.endpoint=${cfg.endpoint}`,
    `-c.win.azureSignOptions.codeSigningAccountName=${cfg.codeSigningAccountName}`,
    `-c.win.azureSignOptions.certificateProfileName=${cfg.certificateProfileName}`,
    `-c.win.azureSignOptions.publisherName=${cfg.publisherName}`
  );
} else {
  const why = haveProfile ? "no AZURE_* credentials in the environment"
    : haveAuth ? "no signing.config.json / STORYMAKER_SIGN_* profile"
    : "not configured (no signing.config.json and no AZURE_* credentials)";
  console.log(`→ Azure Trusted Signing OFF — ${why}. Building UNSIGNED (works, but Windows SmartScreen will warn on download).`);
}
run("electron-builder", args);

// ---- 3. collect artifacts --------------------------------------
const names = [
  `Wheelbarrow Studios Story Maker Setup ${version}.exe`,
  `Wheelbarrow Studios Story Maker Setup ${version}.exe.blockmap`,
  `Wheelbarrow Studios Story Maker ${version}.exe`
];
const distRelease = path.join(root, "dist-release");
fs.rmSync(distRelease, { recursive: true, force: true });
fs.mkdirSync(distRelease, { recursive: true });
for (const name of names) {
  const src = path.join(OUT_DIR, name);
  if (!fs.existsSync(src)) { console.error(`missing expected artifact: ${src}`); process.exit(1); }
  fs.copyFileSync(src, path.join(distRelease, name));
}
console.log(`\n✓ ${enabled ? "signed" : "unsigned"} build ${version} → dist-release/`);
names.forEach((n) => console.log(`  ${n}`));
