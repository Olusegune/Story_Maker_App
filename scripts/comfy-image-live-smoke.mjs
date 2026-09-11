import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["http://127.0.0.1:8000", "http://127.0.0.1:8188"];

async function response(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await fetch(url, { ...options, signal: controller.signal });
    if (!result.ok) throw new Error(`${url} returned ${result.status}: ${(await result.text()).slice(0, 500)}`);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

let baseUrl = "";
for (const candidate of candidates) {
  try {
    await response(`${candidate}/system_stats`, {}, 5000);
    baseUrl = candidate;
    break;
  } catch {}
}
if (!baseUrl) throw new Error("ComfyUI is not reachable.");

const model = "flux1-schnell-fp8.safetensors";
const checkpointInfo = await (await response(`${baseUrl}/object_info/CheckpointLoaderSimple`)).json();
const installed = checkpointInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
if (!installed.includes(model)) throw new Error(`${model} is not installed.`);

const prompt = "A cinematic production still of a lone botanist discovering a softly luminous seed inside a ruined orbital greenhouse, wide 16:9 composition, expressive silhouette, atmospheric practical lighting, realistic materials, no text, no logo, no watermark.";
const workflow = {
  "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: model } },
  "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
  "3": { class_type: "CLIPTextEncode", inputs: { text: "text, logo, watermark, split panels, malformed anatomy", clip: ["1", 1] } },
  "4": { class_type: "EmptySD3LatentImage", inputs: { width: 768, height: 432, batch_size: 1 } },
  "5": { class_type: "KSampler", inputs: { seed: 3407, steps: 4, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
  "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
  "7": { class_type: "SaveImage", inputs: { filename_prefix: "Storymaker-QA/local-flux-smoke", images: ["6", 0] } }
};
const queued = await (await response(`${baseUrl}/prompt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: workflow, client_id: `storymaker-smoke-${Date.now()}` })
})).json();
if (!queued?.prompt_id) throw new Error(`Workflow was rejected: ${JSON.stringify(queued?.node_errors || queued)}`);

const deadline = Date.now() + 15 * 60 * 1000;
let image = null;
while (Date.now() < deadline) {
  const history = await (await response(`${baseUrl}/history/${encodeURIComponent(queued.prompt_id)}`)).json();
  const record = history?.[queued.prompt_id];
  if (record?.status?.status_str === "error") throw new Error(`ComfyUI workflow failed: ${JSON.stringify(record.status)}`);
  const images = Object.values(record?.outputs || {}).flatMap((output) => output?.images || []);
  if (images.length) { image = images[0]; break; }
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
if (!image) throw new Error("ComfyUI image smoke test timed out.");

const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || "", type: image.type || "output" });
const bytes = Buffer.from(await (await response(`${baseUrl}/view?${query}`)).arrayBuffer());
if (bytes.length < 1024 || bytes.subarray(1, 4).toString() !== "PNG") throw new Error("ComfyUI returned an invalid PNG.");
const artifactDir = path.join(root, "qa-artifacts");
fs.mkdirSync(artifactDir, { recursive: true });
const artifact = path.join(artifactDir, "local-flux-smoke.png");
fs.writeFileSync(artifact, bytes);
console.log(JSON.stringify({ ok: true, baseUrl, model, promptId: queued.prompt_id, bytes: bytes.length, artifact }, null, 2));
console.log("STORYMAKER_LOCAL_IMAGE_OK");
