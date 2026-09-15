import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Unlike scripts/comfy-image-live-smoke.mjs and scripts/comfy-video-live-smoke.mjs,
// there was no live smoke test for the LTX-Video local path at all —
// electron-main.js's requestComfyUiLtxVideo() had never been run against a
// real ComfyUI instance by anything in this repo. That's how a real bug
// (width/height not divisible by 32 — LTX-Video's LTXVImgToVideo node
// requires it, and fails outright rather than rounding) sat unnoticed for
// every 16:9/9:16 local LTX render. This mirrors the other two live smoke
// tests exactly so the LTX path finally gets the same coverage.
const baseUrl = process.env.STORYMAKER_COMFY_URL || "http://127.0.0.1:8000";
const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.resolve(
  process.env.STORYMAKER_LOCAL_VIDEO_SOURCE
    || path.join(root, "qa-artifacts", "local-flux-smoke.png")
);
const outputPath = path.join(root, "qa-artifacts", "local-ltx-i2v-smoke.mp4");
const checkpoint = "ltxv-2b-0.9.8-distilled-fp8.safetensors";
const textEncoder = "t5xxl_fp8_e4m3fn.safetensors";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const getJson = async (url, options) => {
  const response = await fetch(url, options);
  const raw = await response.text();
  if (!response.ok) throw new Error(`${url} returned ${response.status}: ${raw.slice(0, 500)}`);
  return JSON.parse(raw);
};

if (!fs.existsSync(sourcePath)) throw new Error(`Local video source frame is missing: ${sourcePath} (run comfy-image-live-smoke.mjs first, or set STORYMAKER_LOCAL_VIDEO_SOURCE).`);
const objectInfo = await getJson(`${baseUrl}/object_info`);
for (const node of ["CheckpointLoaderSimple", "CLIPLoader", "LTXVConditioning", "LTXVImgToVideo", "ModelSamplingLTXV", "LTXVScheduler", "LTXVCropGuides", "CreateVideo", "SaveVideo"]) {
  if (!objectInfo[node]) throw new Error(`ComfyUI is missing required node ${node}. Install ComfyUI-LTXVideo.`);
}
const checkpoints = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
if (!checkpoints.includes(checkpoint)) throw new Error(`${checkpoint} is not installed.`);
const textEncoders = objectInfo?.CLIPLoader?.input?.required?.clip_name?.[0] || [];
if (!textEncoders.includes(textEncoder)) throw new Error(`${textEncoder} is not installed.`);

const upload = new FormData();
upload.append("image", new Blob([fs.readFileSync(sourcePath)], { type: "image/png" }), path.basename(sourcePath));
upload.append("type", "input");
upload.append("overwrite", "true");
const uploaded = await getJson(`${baseUrl}/upload/image`, { method: "POST", body: upload });
const uploadedName = uploaded?.name;
if (!uploadedName) throw new Error("ComfyUI did not return an uploaded image name.");

const prompt = "A slow cinematic push-in. Leaves move gently in a warm breeze, the glowing plant pulses softly, and the botanist breathes naturally. Preserve the exact composition and character identity.";
const negative = "camera shake, scene change, cuts, text, subtitles, logo, watermark, malformed anatomy, duplicated subject, distorted face, low quality, worst quality";
// 448x256: matches requestComfyUiLtxVideo's comfyLtxDimensions() for 16:9 —
// both divisible by 32, unlike the 480x272 Wan uses (which fails here).
const width = 448; const height = 256; const frameRate = 25;
const length = Math.round(3 * frameRate / 8) * 8 + 1; // ~3s, divisible by 8 plus 1
const workflow = {
  "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: checkpoint } },
  "cl": { class_type: "CLIPLoader", inputs: { clip_name: textEncoder, type: "ltxv" } },
  "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["cl", 0] } },
  "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["cl", 0] } },
  "4": { class_type: "LTXVConditioning", inputs: { positive: ["2", 0], negative: ["3", 0], frame_rate: frameRate } },
  "5": { class_type: "LoadImage", inputs: { image: uploadedName } },
  "6": { class_type: "LTXVImgToVideo", inputs: { positive: ["4", 0], negative: ["4", 1], vae: ["1", 2], image: ["5", 0], width, height, length, batch_size: 1, strength: 1 } },
  "7": { class_type: "ModelSamplingLTXV", inputs: { model: ["1", 0], max_shift: 2.05, base_shift: 0.95 } },
  "8": { class_type: "LTXVScheduler", inputs: { steps: 20, max_shift: 2.05, base_shift: 0.95, stretch: true, terminal: 0.1 } },
  "9": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
  "10": { class_type: "SamplerCustom", inputs: { model: ["7", 0], add_noise: true, noise_seed: 3407, cfg: 3, positive: ["6", 0], negative: ["6", 1], sampler: ["9", 0], sigmas: ["8", 0], latent_image: ["6", 2] } },
  "11": { class_type: "LTXVCropGuides", inputs: { positive: ["6", 0], negative: ["6", 1], latent: ["10", 0] } },
  "12": { class_type: "VAEDecode", inputs: { samples: ["11", 2], vae: ["1", 2] } },
  "13": { class_type: "CreateVideo", inputs: { images: ["12", 0], fps: frameRate } },
  "14": { class_type: "SaveVideo", inputs: { video: ["13", 0], filename_prefix: "Storymaker-QA/local-ltx-smoke", format: "mp4", codec: "h264" } }
};

const queued = await getJson(`${baseUrl}/prompt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: workflow, client_id: `storymaker-ltx-smoke-${Date.now()}` })
});
const promptId = queued?.prompt_id;
if (!promptId) throw new Error(`ComfyUI rejected the LTX-Video workflow: ${JSON.stringify(queued?.node_errors || queued)}`);
console.log(`Queued local LTX-Video ${promptId}.`);

const deadline = Date.now() + 30 * 60 * 1000;
let output;
while (Date.now() < deadline) {
  const history = await getJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`);
  const record = history?.[promptId];
  if (record?.status?.status_str === "error") throw new Error(`ComfyUI failed the local LTX-Video workflow: ${JSON.stringify(record.status?.messages || record.status).slice(0, 1200)}`);
  const candidates = Object.values(record?.outputs || {}).flatMap((item) => [
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(item?.gifs) ? item.gifs : []),
    ...(Array.isArray(item?.videos) ? item.videos : [])
  ]);
  if (candidates.length) {
    output = candidates[0];
    break;
  }
  await wait(2000);
}
if (!output) throw new Error("ComfyUI did not finish the local LTX-Video smoke test within 30 minutes.");

const query = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || "", type: output.type || "output" });
const rendered = await fetch(`${baseUrl}/view?${query}`);
if (!rendered.ok) throw new Error(`ComfyUI output download failed (${rendered.status}).`);
fs.writeFileSync(outputPath, Buffer.from(await rendered.arrayBuffer()));
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "json", outputPath], { encoding: "utf8" });
if (probe.status !== 0) throw new Error(`FFprobe could not validate the MP4: ${probe.stderr}`);
const metadata = JSON.parse(probe.stdout);
if (Number(metadata?.format?.duration || 0) < 1 || Number(metadata?.format?.size || 0) < 10_000) throw new Error("The local LTX-Video output is not a valid playable clip.");

console.log(JSON.stringify({ promptId, sourcePath, outputPath, metadata }, null, 2));
console.log("STORYMAKER_LOCAL_LTX_VIDEO_OK");
