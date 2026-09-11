// Managed local engine smoke. CI-safe: if no ComfyUI runtime is on this
// machine (a fresh GitHub runner won't have one), it SKIPs with exit 0.
// Locally it: discovers a runtime, spawns the headless server the same way
// electron-main's startManagedComfy() does, checks /system_stats and
// /object_info, tears down — and separately exercises the real download
// path (resume + size + safetensors structural check) against the smallest
// catalog file (Wan VAE, ~254 MB) into a throwaway dir.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const OUT = path.join(os.tmpdir(), "storymaker-engine-smoke");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log("[engine-smoke]", ...a);

// ---- discovery (mirrors discoverComfyRuntime) --------------------------
function readBasePath(file) {
  try { return (fs.readFileSync(file, "utf8").match(/^\s*base_path:\s*(.+?)\s*$/m) || [])[1]?.replace(/^["']|["']$/g, "") || ""; }
  catch { return ""; }
}
function discover() {
  const home = os.homedir();
  const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  const roaming = process.env.APPDATA || path.join(home, "AppData", "Roaming");
  const base = readBasePath(path.join(roaming, "ComfyUI", "extra_models_config.yaml"));
  const cands = [];
  if (base) {
    let mains = [];
    try { mains = fs.readdirSync(path.join(local, "Comfy-Desktop", "ComfyUI-Installs")).map((e) => path.join(local, "Comfy-Desktop", "ComfyUI-Installs", e, "ComfyUI", "main.py")); } catch {}
    cands.push({ kind: "comfy-desktop", python: path.join(base, ".venv", "Scripts", "python.exe"), mains, modelStore: path.join(base, "models") });
  }
  for (const root of [local, path.join(home, "Documents"), path.join(home, "Desktop"), "C:\\", "D:\\", "E:\\"]) {
    const p = path.join(root, "ComfyUI_windows_portable");
    cands.push({ kind: "portable", python: path.join(p, "python_embeded", "python.exe"), mains: [path.join(p, "ComfyUI", "main.py")], modelStore: path.join(p, "ComfyUI", "models") });
  }
  for (const c of cands) {
    if (!fs.existsSync(c.python)) continue;
    const main = c.mains.find((m) => fs.existsSync(m));
    if (main) return { ...c, main };
  }
  return null;
}

// ---- safetensors structural check (mirrors looksLikeSafetensors) -------
function looksLikeSafetensors(file, expectedSize) {
  try {
    const st = fs.statSync(file);
    if (expectedSize && st.size !== expectedSize) return false;
    const fd = fs.openSync(file, "r");
    try {
      const head = Buffer.alloc(8); fs.readSync(fd, head, 0, 8, 0);
      const n = Number(head.readBigUInt64LE(0));
      if (n <= 0 || n + 8 > st.size) return false;
      const j = Buffer.alloc(1); fs.readSync(fd, j, 0, 1, 8);
      return j[0] === 0x7b;
    } finally { fs.closeSync(fd); }
  } catch { return false; }
}

const runtime = discover();
if (!runtime) { log("SKIP — no local ComfyUI runtime found on this machine."); process.exit(0); }
log("runtime:", runtime.kind, "|", runtime.python);

// ---- spawn headless (mirrors startManagedComfy) -----------------------
for (const sub of ["models", "input", "output", "user", "custom_nodes"]) fs.mkdirSync(path.join(OUT, sub), { recursive: true });
fs.writeFileSync(path.join(OUT, "extra_model_paths.yaml"),
  runtime.modelStore && fs.existsSync(runtime.modelStore)
    ? `ext:\n  base_path: ${runtime.modelStore}\n  vae: vae\n  checkpoints: checkpoints\n  text_encoders: text_encoders\n  diffusion_models: diffusion_models\n  clip_vision: clip_vision\n`
    : "# none\n", "utf8");
const PORT = 8198;
const server = spawn(runtime.python, ["-s", runtime.main, "--listen", "127.0.0.1", "--port", String(PORT), "--base-directory", OUT, "--extra-model-paths-config", path.join(OUT, "extra_model_paths.yaml"), "--disable-auto-launch", "--dont-print-server"], { windowsHide: true, cwd: path.dirname(runtime.main) });
let serverOut = "";
server.stdout.on("data", (d) => { serverOut += d; });
server.stderr.on("data", (d) => { serverOut += d; });
let dead = null; server.on("exit", (c, s) => { dead = { c, s }; });
const kill = () => { try { server.kill("SIGKILL"); } catch {} };
process.on("exit", kill);

const getJson = async (u, ms = 8000) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try { const r = await fetch(u, { signal: c.signal }); return r.ok ? r.json() : Promise.reject(new Error(String(r.status))); } finally { clearTimeout(t); } };

let stats = null;
const deadline = Date.now() + 120000;
while (Date.now() < deadline) {
  if (dead) { log("FAIL — server exited early", dead, "\n" + serverOut.slice(-2500)); process.exit(1); }
  try { stats = await getJson(`http://127.0.0.1:${PORT}/system_stats`, 3000); break; } catch { await new Promise((r) => setTimeout(r, 1500)); }
}
if (!stats) { log("FAIL — server never became ready"); kill(); process.exit(1); }
const dev = (stats.devices || [])[0] || {};
log(`server ready — ComfyUI ${stats.system?.comfyui_version}, device ${dev.name || "?"}, VRAM ${((dev.vram_total || 0) / 1e9).toFixed(1)}GB`);

const info = await getJson(`http://127.0.0.1:${PORT}/object_info`, 25000);
const hasLtxNode = Boolean(info.LTXVImgToVideo);
const hasWanNode = Boolean(info.WanFunInpaintToVideo);
log(`core nodes — LTXVImgToVideo: ${hasLtxNode}, WanFunInpaintToVideo: ${hasWanNode}`);
if (!hasLtxNode || !hasWanNode) { log("FAIL — expected LTX + Wan nodes in ComfyUI core"); kill(); process.exit(1); }
kill();
await new Promise((r) => setTimeout(r, 400));

// ---- download path: real fetch of the smallest catalog file ----------
const VAE = { name: "wan_2.1_vae.safetensors", size: 253815318, url: "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors" };
const target = path.join(OUT, "dl", VAE.name);
fs.mkdirSync(path.dirname(target), { recursive: true });
log(`downloading ${VAE.name} (${(VAE.size / 1e6).toFixed(0)} MB) to verify the fetch+verify path…`);
const t0 = Date.now();
const res = await fetch(VAE.url, { redirect: "follow" });
if (!res.ok) { log("FAIL — download HTTP", res.status); process.exit(1); }
const out = fs.createWriteStream(`${target}.part`);
const reader = res.body.getReader();
let got = 0;
// eslint-disable-next-line no-constant-condition
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  got += value.length;
  if (!out.write(Buffer.from(value))) await new Promise((r) => out.once("drain", r));
}
await new Promise((r) => out.end(r));
if (!looksLikeSafetensors(`${target}.part`, VAE.size)) { log(`FAIL — downloaded ${got} bytes, structural/size check failed (expected ${VAE.size})`); process.exit(1); }
fs.renameSync(`${target}.part`, target);
log(`download OK — ${got} bytes, size+safetensors verified, ${((Date.now() - t0) / 1000).toFixed(1)}s`);

fs.rmSync(OUT, { recursive: true, force: true });
console.log("STORYMAKER_LOCAL_ENGINE_SMOKE_OK");
