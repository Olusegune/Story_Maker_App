const OLLAMA = "http://127.0.0.1:11434";
const COMFY_CANDIDATES = ["http://127.0.0.1:8000", "http://127.0.0.1:8188"];

async function json(url, options = {}, timeoutMs = 180000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.text();
    if (!response.ok) throw new Error(`${url} returned ${response.status}: ${body.slice(0, 240)}`);
    return JSON.parse(body);
  } finally {
    clearTimeout(timeout);
  }
}

const tags = await json(`${OLLAMA}/api/tags`, {}, 10000);
const models = (Array.isArray(tags?.models) ? tags.models : [])
  .map((entry) => String(entry?.name || entry?.model || ""))
  .filter(Boolean);
if (!models.length) throw new Error("Ollama is running but has no installed model.");
const preferred = models.find((name) => /qwen3/i.test(name)) || models[0];
const completion = await json(`${OLLAMA}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: preferred,
    stream: false,
    format: "json",
    messages: [
      { role: "system", content: "Return valid JSON with keys title, logline, and scenes. scenes must be an array." },
      { role: "user", content: "A botanist finds a luminous seed in a ruined orbital greenhouse." }
    ],
    options: { temperature: 0 }
  })
});
const structured = JSON.parse(String(completion?.message?.content || completion?.response || ""));
if (!structured?.title || !structured?.logline || !Array.isArray(structured?.scenes)) {
  throw new Error("Ollama did not satisfy the Storymaker structured-output contract.");
}

let comfy = null;
for (const baseUrl of COMFY_CANDIDATES) {
  try {
    const stats = await json(`${baseUrl}/system_stats`, {}, 5000);
    comfy = { baseUrl, stats };
    break;
  } catch {}
}
if (!comfy) throw new Error("ComfyUI is not reachable on its supported desktop or portable port.");
const cuda = (Array.isArray(comfy.stats?.devices) ? comfy.stats.devices : [])
  .find((device) => String(device?.type || "").toLowerCase() === "cuda");
if (!cuda) throw new Error("ComfyUI is running without a CUDA device.");
const objectInfo = await json(`${comfy.baseUrl}/object_info`, {}, 30000);
const optionsFor = (node, input) => {
  const options = objectInfo?.[node]?.input?.required?.[input]?.[0];
  return Array.isArray(options) ? options.map(String) : [];
};
const imageReady = optionsFor("CheckpointLoaderSimple", "ckpt_name").includes("flux1-schnell-fp8.safetensors");
const videoReady = optionsFor("UNETLoader", "unet_name").includes("wan2.1_fun_inp_1.3B_bf16.safetensors")
  && optionsFor("CLIPLoader", "clip_name").includes("umt5_xxl_fp8_e4m3fn_scaled.safetensors")
  && optionsFor("VAELoader", "vae_name").includes("wan_2.1_vae.safetensors")
  && optionsFor("CLIPVisionLoader", "clip_name").includes("clip_vision_h.safetensors")
  && Boolean(objectInfo?.WanFunInpaintToVideo && objectInfo?.CreateVideo && objectInfo?.SaveVideo);
if (!imageReady) throw new Error("The verified local FLUX image workflow is not installed.");
if (!videoReady) throw new Error("The verified local Wan image-to-video workflow is not installed.");

console.log(JSON.stringify({
  ok: true,
  ollama: { model: preferred, title: structured.title, sceneCount: structured.scenes.length },
  comfyui: { baseUrl: comfy.baseUrl, device: cuda.name, vramTotal: cuda.vram_total, imageReady, videoReady }
}, null, 2));
console.log("STORYMAKER_LOCAL_RUNTIME_OK");
