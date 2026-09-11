// THROWAWAY SPIKE — not shipped, not wired into anything, not in test:release.
//
// Question it answers: can Storymaker manage a headless ComfyUI itself —
// spawn the server, drive it over HTTP, run one of the baked local video
// workflows against already-present weights, tear it down — without the
// user ever opening ComfyUI? i.e. is "managed ComfyUI + curated catalog"
// actually feasible, and how fragile is the orchestration layer.
//
// It deliberately reuses an EXISTING ComfyUI code + venv + model set on
// this machine (discovered, not bundled) so the spike isolates the
// orchestration question from the multi-GB acquisition question, which is
// covered separately in the findings doc.
//
// Run: node scripts/local-models-spike.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const SCRATCH = process.env.SPIKE_OUT || path.join(os.tmpdir(), "storymaker-local-spike");
fs.mkdirSync(SCRATCH, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

// ---- 1. Discovery -------------------------------------------------------
// A real managed mode would search these the same way, then fall back to
// downloading a portable ComfyUI + venv if none is found.
// FINDING 1: code + venv must be a MATCHED pair. The frontend static
// assets (comfyui_frontend_package, comfyui_workflow_templates) are pip
// packages IN the venv, and the code copy's server.py must match the
// version that installed them. Pairing the Electron app's bundled
// resources/ComfyUI (v0.3.62) with the Desktop-2 venv (built for a newer
// ComfyUI) crashed on a moved template path. So the discovered unit is
// the pair, not two independent lists. Here: the Desktop-2 managed
// install (code) + the venv that Desktop built for it.
const CANDIDATES = {
  main: [
    "C:/Users/eduni/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI/main.py"
  ],
  python: [
    "C:/Users/eduni/Documents/ComfyUI/.venv/Scripts/python.exe"
  ],
  base: [
    "C:/Users/eduni/Documents/ComfyUI"
  ]
};
const firstThatExists = (arr, label) => {
  const hit = arr.find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`discovery failed: no ${label} found in ${JSON.stringify(arr)}`);
  return hit;
};
const MAIN = firstThatExists(CANDIDATES.main, "ComfyUI main.py");
const PYTHON = firstThatExists(CANDIDATES.python, "ComfyUI venv python");
const BASE = firstThatExists(CANDIDATES.base, "ComfyUI base directory");
const PORT = 8199; // deliberately not 8000/8188 so we don't collide with a user's own instance
const API = `http://127.0.0.1:${PORT}`;
log("discovered ComfyUI main:", MAIN);
log("discovered venv python  :", PYTHON);
log("discovered base dir     :", BASE);

// ---- 2. Spawn headless ------------------------------------------------
const serverLog = fs.createWriteStream(path.join(SCRATCH, "comfy-server.log"));
log(`${since()} spawning headless server on :${PORT} …`);
const server = spawn(PYTHON, [
  "-s", MAIN,
  "--listen", "127.0.0.1",
  "--port", String(PORT),
  "--base-directory", BASE,
  "--disable-auto-launch",
  "--dont-print-server"
], { windowsHide: true, cwd: path.dirname(MAIN) });
server.stdout.on("data", (d) => serverLog.write(d));
server.stderr.on("data", (d) => serverLog.write(d));
let serverExited = null;
server.on("exit", (code, sig) => { serverExited = { code, sig }; });

const kill = () => { try { server.kill("SIGKILL"); } catch {} };
process.on("exit", kill);
process.on("SIGINT", () => { kill(); process.exit(1); });

const getJson = async (url, opts, timeoutMs = 20000) => {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const body = await r.text();
    if (!r.ok) throw new Error(`${url} -> ${r.status}: ${body.slice(0, 300)}`);
    return body ? JSON.parse(body) : {};
  } finally { clearTimeout(to); }
};

// ---- 3. Wait for readiness -----------------------------------------------
const bootDeadline = Date.now() + 120000;
let stats = null;
while (Date.now() < bootDeadline) {
  if (serverExited) { console.error("SERVER EXITED EARLY", serverExited, "\n--- last server log ---\n", fs.readFileSync(path.join(SCRATCH, "comfy-server.log"), "utf8").slice(-3000)); process.exit(1); }
  try { stats = await getJson(`${API}/system_stats`, {}, 4000); break; } catch { await new Promise((r) => setTimeout(r, 1500)); }
}
if (!stats) { console.error("server never became ready in 120s"); kill(); process.exit(1); }
const bootMs = Date.now() - t0;
const dev = stats.devices?.[0] || {};
log(`${since()} SERVER READY — boot took ${(bootMs / 1000).toFixed(1)}s`);
log(`  ComfyUI ${stats.system?.comfyui_version}  python ${stats.system?.python_version?.split(" ")[0]}  pytorch ${stats.system?.pytorch_version}`);
log(`  device: ${dev.name}  VRAM total ${(dev.vram_total / 1e9).toFixed(1)}GB  free ${(dev.vram_free / 1e9).toFixed(1)}GB`);

const MODEL = process.env.SPIKE_MODEL === "wan" ? "wan" : "ltx";
log(`${since()} model under test: ${MODEL}`);

// ---- 4. Confirm the curated model is visible ---------------------------
const oi = await getJson(`${API}/object_info`, {}, 30000);
const opts = (node, input) => oi?.[node]?.input?.required?.[input]?.[0] || [];
if (MODEL === "ltx") {
  const need = [["CheckpointLoaderSimple", "ckpt_name", "ltxv-2b-0.9.8-distilled-fp8.safetensors"], ["CLIPLoader", "clip_name", "t5xxl_fp8_e4m3fn.safetensors"]];
  const miss = need.filter(([n, i, f]) => !opts(n, i).includes(f));
  log(`${since()} catalog check: ${miss.length ? "MISSING " + miss.map((m) => m[2]).join(", ") : "all LTX weights PRESENT"}`);
  if (miss.length) { kill(); process.exit(1); }
} else {
  const need = [["UNETLoader", "unet_name", "wan2.1_fun_inp_1.3B_bf16.safetensors"], ["CLIPLoader", "clip_name", "umt5_xxl_fp8_e4m3fn_scaled.safetensors"], ["VAELoader", "vae_name", "wan_2.1_vae.safetensors"], ["CLIPVisionLoader", "clip_name", "clip_vision_h.safetensors"]];
  const miss = need.filter(([n, i, f]) => !opts(n, i).includes(f));
  const nodeOk = !!oi.WanFunInpaintToVideo;
  log(`${since()} catalog check: ${miss.length ? "MISSING " + miss.map((m) => m[2]).join(", ") : "all Wan weights PRESENT"}; WanFunInpaintToVideo node ${nodeOk ? "PRESENT" : "MISSING"}`);
  if (miss.length || !nodeOk) { kill(); process.exit(1); }
}

// ---- 5. Upload a start frame -----------------------------------------
const startFrameSrc = path.resolve("assets/styles/Film Noir.png");
const fd = new FormData();
fd.append("image", new Blob([fs.readFileSync(startFrameSrc)]), "spike-start.png");
fd.append("overwrite", "true");
const up = await getJson(`${API}/upload/image`, { method: "POST", body: fd }, 30000);
const startImage = up.name;
log(`${since()} uploaded start frame -> ${startImage}`);

// ---- 6. Submit the EXACT baked workflow from electron-main.js ----------
// (short duration to keep the spike quick; node graphs copied verbatim.)
const seed = 42;
let workflow;
if (MODEL === "ltx") {
  const frameRate = 25, duration = 2;
  const length = Math.round(duration * frameRate / 8) * 8 + 1;
  const width = 768, height = 512;
  workflow = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "ltxv-2b-0.9.8-distilled-fp8.safetensors" } },
    "cl": { class_type: "CLIPLoader", inputs: { clip_name: "t5xxl_fp8_e4m3fn.safetensors", type: "ltxv" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: "slow cinematic push-in, drifting fog, dim lamplight", clip: ["cl", 0] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: "camera shake, scene change, cuts, text, watermark, low quality", clip: ["cl", 0] } },
    "4": { class_type: "LTXVConditioning", inputs: { positive: ["2", 0], negative: ["3", 0], frame_rate: frameRate } },
    "5": { class_type: "LoadImage", inputs: { image: startImage } },
    "6": { class_type: "LTXVImgToVideo", inputs: { positive: ["4", 0], negative: ["4", 1], vae: ["1", 2], image: ["5", 0], width, height, length, batch_size: 1, strength: 1 } },
    "7": { class_type: "ModelSamplingLTXV", inputs: { model: ["1", 0], max_shift: 2.05, base_shift: 0.95 } },
    "8": { class_type: "LTXVScheduler", inputs: { steps: 20, max_shift: 2.05, base_shift: 0.95, stretch: true, terminal: 0.1 } },
    "9": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
    "10": { class_type: "SamplerCustom", inputs: { model: ["7", 0], add_noise: true, noise_seed: seed, cfg: 3, positive: ["6", 0], negative: ["6", 1], sampler: ["9", 0], sigmas: ["8", 0], latent_image: ["6", 2] } },
    "11": { class_type: "LTXVCropGuides", inputs: { positive: ["6", 0], negative: ["6", 1], latent: ["10", 0] } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11", 2], vae: ["1", 2] } },
    "13": { class_type: "CreateVideo", inputs: { images: ["12", 0], fps: frameRate } },
    "14": { class_type: "SaveVideo", inputs: { video: ["13", 0], filename_prefix: "SpikeLTX/local-ltx", format: "mp4", codec: "h264" } }
  };
} else {
  const width = 512, height = 512, duration = 2;
  const length = Math.round(duration * 16 / 4) * 4 + 1;
  workflow = {
    "3": { class_type: "KSampler", inputs: { seed, steps: 12, cfg: 6, sampler_name: "uni_pc", scheduler: "simple", denoise: 1, model: ["66", 0], positive: ["76", 0], negative: ["76", 1], latent_image: ["76", 2] } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "gentle drifting motion, soft light", clip: ["38", 0] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "camera shake, cuts, text, watermark", clip: ["38", 0] } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["39", 0] } },
    "27": { class_type: "CreateVideo", inputs: { images: ["8", 0], fps: 16 } },
    "28": { class_type: "SaveVideo", inputs: { video: ["27", 0], filename_prefix: "SpikeWan/local-wan", format: "mp4", codec: "h264" } },
    "37": { class_type: "UNETLoader", inputs: { unet_name: "wan2.1_fun_inp_1.3B_bf16.safetensors", weight_dtype: "default" } },
    "38": { class_type: "CLIPLoader", inputs: { clip_name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", type: "wan", device: "default" } },
    "39": { class_type: "VAELoader", inputs: { vae_name: "wan_2.1_vae.safetensors" } },
    "49": { class_type: "CLIPVisionLoader", inputs: { clip_name: "clip_vision_h.safetensors" } },
    "51": { class_type: "CLIPVisionEncode", inputs: { crop: "none", clip_vision: ["49", 0], image: ["52", 0] } },
    "52": { class_type: "LoadImage", inputs: { image: startImage } },
    "65": { class_type: "SkipLayerGuidanceDiT", inputs: { double_layers: "9,10", single_layers: "9,10", scale: 3, start_percent: 0.01, end_percent: 0.8, rescaling_scale: 0, model: ["37", 0] } },
    "66": { class_type: "CFGZeroStar", inputs: { model: ["68", 0] } },
    "67": { class_type: "ModelSamplingSD3", inputs: { shift: 5, model: ["65", 0] } },
    "68": { class_type: "UNetTemporalAttentionMultiply", inputs: { self_structural: 1, self_temporal: 1, cross_structural: 1.2, cross_temporal: 1.3, model: ["67", 0] } },
    "76": { class_type: "WanFunInpaintToVideo", inputs: { width, height, length, batch_size: 1, positive: ["6", 0], negative: ["7", 0], vae: ["39", 0], clip_vision_output: ["51", 0], start_image: ["52", 0] } }
  };
}
const genStart = Date.now();
const submitted = await getJson(`${API}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: workflow, client_id: "spike" }) }, 30000);
const promptId = submitted.prompt_id;
if (!promptId) { console.error("workflow rejected:", JSON.stringify(submitted).slice(0, 1200)); kill(); process.exit(1); }
log(`${since()} workflow accepted, prompt_id=${promptId} — generating …`);

// ---- 7. Poll to completion -----------------------------------------
const genDeadline = Date.now() + 20 * 60 * 1000;
let out = null, lastNote = "";
while (Date.now() < genDeadline) {
  const hist = await getJson(`${API}/history/${encodeURIComponent(promptId)}`, {}, 15000).catch(() => ({}));
  const rec = hist[promptId];
  if (rec?.status?.status_str === "error") { console.error("GENERATION ERROR:", JSON.stringify(rec.status.messages).slice(0, 2000)); kill(); process.exit(1); }
  const outputs = Object.values(rec?.outputs || {}).flatMap((i) => [...(i.images || []), ...(i.gifs || []), ...(i.videos || [])]);
  if (outputs.length) { out = outputs[0]; break; }
  const q = await getJson(`${API}/queue`, {}, 8000).catch(() => ({}));
  const note = (q.queue_running || []).length ? "running" : (q.queue_pending || []).length ? "queued" : "…";
  if (note !== lastNote) { log(`  ${since()} ${note}`); lastNote = note; }
  await new Promise((r) => setTimeout(r, 2500));
}
if (!out) { console.error("no output within 20min"); kill(); process.exit(1); }
const genMs = Date.now() - genStart;

// ---- 8. Retrieve --------------------------------------------------
const q = new URLSearchParams({ filename: out.filename, subfolder: out.subfolder || "", type: out.type || "output" });
const vid = await fetch(`${API}/view?${q}`);
const bytes = Buffer.from(await vid.arrayBuffer());
const savedTo = path.join(SCRATCH, out.filename);
fs.writeFileSync(savedTo, bytes);

// ---- 9. Teardown ------------------------------------------------
kill();
await new Promise((r) => setTimeout(r, 500));

// ---- 10. Report ---------------------------------------------------
console.log("\n================ SPIKE RESULT ================");
console.log("ORCHESTRATION: WORKED");
console.log(`  headless boot        : ${(bootMs / 1000).toFixed(1)}s`);
console.log(`  LTX 2s clip generate : ${(genMs / 1000).toFixed(1)}s  (768x512, 25fps, 20 steps, seed 42)`);
console.log(`  output               : ${savedTo}  (${(bytes.length / 1e6).toFixed(2)} MB)`);
console.log(`  server clean exit    : ${serverExited ? JSON.stringify(serverExited) : "killed by spike"}`);
console.log(`  total wall time      : ${since()}`);
console.log("=============================================");
