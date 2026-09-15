/*
 * Deliberately opt-in paid integration smoke test.
 *
 * STORYMAKER_LIVE_FAL_SMOKE=1 npm run test:fal-live
 *
 * It reads the user's locally encrypted Fal credential through Electron,
 * uploads one project-generated image and MP4 to Fal storage, submits either
 * Seedance 2.0 Reference-to-Video or Kling V3 I2V, polls it to a final state,
 * downloads the output, and writes only redacted evidence.
 */
const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");

if (process.env.STORYMAKER_LIVE_FAL_SMOKE !== "1") {
  console.error("Refusing paid provider request. Set STORYMAKER_LIVE_FAL_SMOKE=1 to run this smoke test.");
  process.exit(2);
}

const userData = path.join(process.env.APPDATA || "", "wheelbarrow-studios-story-maker");
const generatedMedia = path.join(userData, "generated-media");
const mimeFor = (file) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm" }[path.extname(file).toLowerCase()] || "application/octet-stream");
const choose = (extensions) => fs.readdirSync(generatedMedia).map((name) => path.join(generatedMedia, name)).find((file) => extensions.includes(path.extname(file).toLowerCase()) && fs.statSync(file).size > 1024);
const redactUrl = (value) => { try { const url = new URL(value); return `${url.protocol}//${url.host}${url.pathname.split("/").slice(0, 3).join("/")}/…`; } catch { return "[redacted]"; } };

async function errorFor(label, response) {
  const text = await response.text();
  throw new Error(`${label} failed (${response.status}): ${text.slice(0, 300)}`);
}
async function upload(apiKey, file) {
  const mime = mimeFor(file);
  const ticketResponse = await fetch("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", { method: "POST", headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ content_type: mime, file_name: path.basename(file) }) });
  if (!ticketResponse.ok) await errorFor("Fal storage ticket", ticketResponse);
  const ticket = await ticketResponse.json();
  const uploadResponse = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": mime }, body: fs.readFileSync(file) });
  if (!uploadResponse.ok) await errorFor("Fal storage upload", uploadResponse);
  return ticket.file_url;
}
function videoUrls(result) {
  const urls = [];
  const visit = (value) => {
    if (!value) return;
    if (typeof value === "string" && /^https?:\/\//i.test(value)) urls.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (typeof value === "object") Object.entries(value).forEach(([key, item]) => { if (/video|url|file|output/i.test(key)) visit(item); });
  };
  visit(result); return [...new Set(urls)];
}
async function main() {
  app.setPath("userData", userData); await app.whenReady();
  const credentials = JSON.parse(fs.readFileSync(path.join(userData, "provider-credentials.json"), "utf8"));
  const apiKey = credentials.fal && safeStorage.decryptString(Buffer.from(credentials.fal, "base64"));
  if (!apiKey) throw new Error("No locally encrypted Fal credential is available.");
  const image = process.env.STORYMAKER_LIVE_IMAGE || choose([".png", ".jpg", ".jpeg", ".webp"]); const video = process.env.STORYMAKER_LIVE_VIDEO || choose([".mp4", ".mov", ".webm"]);
  if (!image || !video) throw new Error("A generated image and MP4 are required for the live provider smoke test.");
  const [imageUrl, videoUrl] = await Promise.all([upload(apiKey, image), upload(apiKey, video)]);
  const kling = process.env.STORYMAKER_LIVE_FAL_MODEL === "kling-v3";
  const model = kling ? "fal-ai/kling-video/v3/standard/image-to-video" : "bytedance/seedance-2.0/reference-to-video";
  const body = kling
    ? { prompt: "A concise cinematic test shot. Preserve the supplied scene identity and animate subtle, natural camera motion.", duration: "5", start_image_url: imageUrl, elements: [{ video_url: videoUrl }], generate_audio: false }
    : { prompt: "A concise cinematic test shot. Preserve the supplied scene identity and animate subtle, natural camera motion.", duration: 4, aspect_ratio: "21:9", resolution: "480p", image_urls: [imageUrl], video_urls: [videoUrl], audio_urls: [], generate_audio: false };
  const submit = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!submit.ok) await errorFor("Fal Seedance submission", submit);
  const queued = await submit.json(); const requestId = queued.request_id;
  if (!requestId) throw new Error("Fal did not return a Seedance request id.");
  let result;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    const appId = model.split("/").slice(0, 2).join("/");
    const statusResponse = await fetch(`https://queue.fal.run/${appId}/requests/${encodeURIComponent(requestId)}/status`, { headers: { Authorization: `Key ${apiKey}` } });
    if (!statusResponse.ok) await errorFor("Fal video status", statusResponse);
    const status = await statusResponse.json(); const state = String(status.status || "").toUpperCase();
    if (state === "COMPLETED") {
      const resultResponse = await fetch(`https://queue.fal.run/${appId}/requests/${encodeURIComponent(requestId)}`, { headers: { Authorization: `Key ${apiKey}` } });
      if (!resultResponse.ok) await errorFor("Fal video result", resultResponse);
      result = await resultResponse.json(); break;
    }
    if (!["IN_QUEUE", "IN_PROGRESS"].includes(state)) throw new Error(`Fal Seedance ended as ${state}: ${JSON.stringify(status.error || status.detail || "unknown error")}`);
  }
  if (!result) throw new Error("Fal video did not complete before the 10-minute smoke-test timeout.");
  const outputUrl = videoUrls(result)[0]; if (!outputUrl) throw new Error("Fal video completed without a downloadable video URL.");
  const output = await fetch(outputUrl); if (!output.ok) await errorFor("Fal Seedance output download", output);
  const bytes = Buffer.from(await output.arrayBuffer()); if (bytes.length < 8192) throw new Error("Fal Seedance output is too small to be a video.");
  const saved = path.join(generatedMedia, `fal-${kling ? "kling-v3" : "seedance-2"}-live-smoke-${Date.now()}.mp4`); fs.writeFileSync(saved, bytes);
  const evidence = { checkedAt: new Date().toISOString(), provider: "fal", model, requestId, request: kling ? { startFrame: true, videoElements: 1, externalAudioReferences: 0 } : { aspectRatio: "21:9", resolution: "480p", imageReferences: 1, videoReferences: 1, audioReferences: 0 }, uploads: { image: redactUrl(imageUrl), video: redactUrl(videoUrl) }, result: { downloaded: true, bytes: bytes.length, localFile: saved } };
  fs.writeFileSync(path.join(userData, `fal-${kling ? "kling-v3" : "seedance-2"}-live-smoke.json`), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`FAL_MULTIMODAL_LIVE_SMOKE_OK ${JSON.stringify({ requestId, model, bytes: bytes.length, output: path.basename(saved) })}`);
}
main().catch((error) => { console.error(`FAL_MULTIMODAL_LIVE_SMOKE_FAILED ${error?.message || error}`); process.exitCode = 1; }).finally(() => setTimeout(() => app.quit(), 50));
