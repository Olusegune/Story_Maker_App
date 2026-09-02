/* Opt-in paid smoke test for the exact Fal storage -> Topaz path used by the desktop app. */
const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");
if (process.env.STORYMAKER_LIVE_FAL_SMOKE !== "1") { console.error("Set STORYMAKER_LIVE_FAL_SMOKE=1 to run this paid smoke test."); process.exit(2); }
const userData = path.join(process.env.APPDATA || "", "wheelbarrow-studios-story-maker");
const media = path.join(userData, "generated-media");
async function main() {
  app.setPath("userData", userData); await app.whenReady();
  const encrypted = JSON.parse(fs.readFileSync(path.join(userData, "provider-credentials.json"), "utf8")).fal;
  const key = encrypted && safeStorage.decryptString(Buffer.from(encrypted, "base64")); if (!key) throw new Error("No locally encrypted Fal credential is available.");
  const source = fs.readdirSync(media).map((name) => path.join(media, name)).find((file) => path.extname(file).toLowerCase() === ".png"); if (!source) throw new Error("No generated PNG is available for the upscale smoke test.");
  const ticketResponse = await fetch("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", { method: "POST", headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ content_type: "image/png", file_name: path.basename(source) }) });
  if (!ticketResponse.ok) throw new Error(`Fal storage ticket failed (${ticketResponse.status}).`); const ticket = await ticketResponse.json();
  const upload = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: fs.readFileSync(source) }); if (!upload.ok) throw new Error(`Fal storage upload failed (${upload.status}).`);
  const response = await fetch("https://fal.run/fal-ai/topaz/upscale/image", { method: "POST", headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ image_url: ticket.file_url, model: "Standard V2", upscale_factor: 2, output_format: "png", face_enhancement: true }) });
  const raw = await response.text(); if (!response.ok) throw new Error(`Fal Topaz failed (${response.status}): ${raw.slice(0, 300)}`); const result = JSON.parse(raw); const url = result?.image?.url || result?.images?.[0]?.url || result?.url; if (!url) throw new Error("Fal Topaz returned no image URL.");
  const output = await fetch(url); if (!output.ok) throw new Error(`Fal Topaz output download failed (${output.status}).`); const bytes = Buffer.from(await output.arrayBuffer()); if (bytes.length < 4096) throw new Error("Fal Topaz output is unexpectedly small.");
  const saved = path.join(media, `fal-topaz-live-smoke-${Date.now()}.png`); fs.writeFileSync(saved, bytes); fs.writeFileSync(path.join(userData, "fal-topaz-live-smoke.json"), `${JSON.stringify({ checkedAt: new Date().toISOString(), provider: "fal", endpoint: "fal-ai/topaz/upscale/image", factor: 2, result: { downloaded: true, bytes: bytes.length, localFile: saved } }, null, 2)}\n`);
  console.log(`FAL_TOPAZ_LIVE_SMOKE_OK ${JSON.stringify({ bytes: bytes.length, output: path.basename(saved) })}`);
}
main().catch((error) => { console.error(`FAL_TOPAZ_LIVE_SMOKE_FAILED ${error?.message || error}`); process.exitCode = 1; }).finally(() => setTimeout(() => app.quit(), 50));
