import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const baseUrl = process.env.STORYMAKER_COMFY_URL || "http://127.0.0.1:8000";
const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.resolve(
  process.env.STORYMAKER_LOCAL_VIDEO_SOURCE
    || path.join(root, "qa-artifacts", "local-flux-smoke.png")
);
const outputPath = path.join(root, "qa-artifacts", "local-wan-i2v-smoke.mp4");
const model = "wan2.1_fun_inp_1.3B_bf16.safetensors";
const textEncoder = "umt5_xxl_fp8_e4m3fn_scaled.safetensors";
const vae = "wan_2.1_vae.safetensors";
const clipVision = "clip_vision_h.safetensors";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const getJson = async (url, options) => {
  const response = await fetch(url, options);
  const raw = await response.text();
  if (!response.ok) throw new Error(`${url} returned ${response.status}: ${raw.slice(0, 500)}`);
  return JSON.parse(raw);
};
const modelOptions = (info, node, input) => info?.[node]?.input?.required?.[input]?.[0] || [];

if (!fs.existsSync(sourcePath)) throw new Error(`Local video source frame is missing: ${sourcePath}`);
const objectInfo = await getJson(`${baseUrl}/object_info`);
for (const node of ["UNETLoader", "CLIPLoader", "VAELoader", "CLIPVisionLoader", "WanFunInpaintToVideo", "CreateVideo", "SaveVideo"]) {
  if (!objectInfo[node]) throw new Error(`ComfyUI is missing required node ${node}.`);
}
if (!modelOptions(objectInfo, "UNETLoader", "unet_name").includes(model)) throw new Error(`${model} is not installed.`);
if (!modelOptions(objectInfo, "CLIPLoader", "clip_name").includes(textEncoder)) throw new Error(`${textEncoder} is not installed.`);
if (!modelOptions(objectInfo, "VAELoader", "vae_name").includes(vae)) throw new Error(`${vae} is not installed.`);
if (!modelOptions(objectInfo, "CLIPVisionLoader", "clip_name").includes(clipVision)) throw new Error(`${clipVision} is not installed.`);

const upload = new FormData();
upload.append("image", new Blob([fs.readFileSync(sourcePath)], { type: "image/png" }), path.basename(sourcePath));
upload.append("type", "input");
upload.append("overwrite", "true");
const uploaded = await getJson(`${baseUrl}/upload/image`, { method: "POST", body: upload });
const uploadedName = uploaded?.name;
if (!uploadedName) throw new Error("ComfyUI did not return an uploaded image name.");

const prompt = "A slow cinematic push-in. Leaves move gently in a warm breeze, the glowing plant pulses softly, and the botanist breathes naturally. Preserve the exact composition and character identity.";
const negative = "camera shake, scene change, cuts, text, subtitles, logo, watermark, malformed anatomy, duplicated subject, distorted face";
const workflow = {
  "3": { class_type: "KSampler", inputs: { seed: 124578, steps: 12, cfg: 6, sampler_name: "uni_pc", scheduler: "simple", denoise: 1, model: ["66", 0], positive: ["76", 0], negative: ["76", 1], latent_image: ["76", 2] } },
  "6": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["38", 0] } },
  "7": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["38", 0] } },
  "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["39", 0] } },
  "27": { class_type: "CreateVideo", inputs: { images: ["8", 0], fps: 16 } },
  "28": { class_type: "SaveVideo", inputs: { video: ["27", 0], filename_prefix: "Storymaker/local-wan-smoke", format: "mp4", codec: "h264" } },
  "37": { class_type: "UNETLoader", inputs: { unet_name: model, weight_dtype: "default" } },
  "38": { class_type: "CLIPLoader", inputs: { clip_name: textEncoder, type: "wan", device: "default" } },
  "39": { class_type: "VAELoader", inputs: { vae_name: vae } },
  "49": { class_type: "CLIPVisionLoader", inputs: { clip_name: clipVision } },
  "51": { class_type: "CLIPVisionEncode", inputs: { crop: "none", clip_vision: ["49", 0], image: ["52", 0] } },
  "52": { class_type: "LoadImage", inputs: { image: uploadedName } },
  "65": { class_type: "SkipLayerGuidanceDiT", inputs: { double_layers: "9,10", single_layers: "9,10", scale: 3, start_percent: 0.01, end_percent: 0.8, rescaling_scale: 0, model: ["37", 0] } },
  "66": { class_type: "CFGZeroStar", inputs: { model: ["68", 0] } },
  "67": { class_type: "ModelSamplingSD3", inputs: { shift: 5, model: ["65", 0] } },
  "68": { class_type: "UNetTemporalAttentionMultiply", inputs: { self_structural: 1, self_temporal: 1, cross_structural: 1.2, cross_temporal: 1.3, model: ["67", 0] } },
  "76": { class_type: "WanFunInpaintToVideo", inputs: { width: 480, height: 272, length: 33, batch_size: 1, positive: ["6", 0], negative: ["7", 0], vae: ["39", 0], clip_vision_output: ["51", 0], start_image: ["52", 0] } }
};

const queued = await getJson(`${baseUrl}/prompt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: workflow, client_id: `storymaker-video-smoke-${Date.now()}` })
});
const promptId = queued?.prompt_id;
if (!promptId) throw new Error(`ComfyUI rejected the video workflow: ${JSON.stringify(queued?.node_errors || queued)}`);
console.log(`Queued local Wan video ${promptId}.`);

const deadline = Date.now() + 30 * 60 * 1000;
let output;
while (Date.now() < deadline) {
  const history = await getJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`);
  const record = history?.[promptId];
  if (record?.status?.status_str === "error") throw new Error(`ComfyUI failed the local video workflow: ${JSON.stringify(record.status?.messages || record.status).slice(0, 1200)}`);
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
if (!output) throw new Error("ComfyUI did not finish the local video smoke test within 30 minutes.");

const query = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || "", type: output.type || "output" });
const rendered = await fetch(`${baseUrl}/view?${query}`);
if (!rendered.ok) throw new Error(`ComfyUI output download failed (${rendered.status}).`);
fs.writeFileSync(outputPath, Buffer.from(await rendered.arrayBuffer()));
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "json", outputPath], { encoding: "utf8" });
if (probe.status !== 0) throw new Error(`FFprobe could not validate the MP4: ${probe.stderr}`);
const metadata = JSON.parse(probe.stdout);
if (Number(metadata?.format?.duration || 0) < 1 || Number(metadata?.format?.size || 0) < 10_000) throw new Error("The local video output is not a valid playable clip.");

console.log(JSON.stringify({ promptId, sourcePath, outputPath, metadata }, null, 2));
console.log("STORYMAKER_LOCAL_VIDEO_OK");
