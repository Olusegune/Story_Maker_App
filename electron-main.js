const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, clipboard, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");
const { spawn, spawnSync } = require("child_process");
const { ingestStoryFile, ingestStoryText, parseStoryStructure } = require("./story-ingest");

let mainWindow; let dirty = false; let quitting = false; let closePending = false;
const providerIds = ["openai", "google", "fal", "kie", "wavespeed", "openrouter", "comfyui"];
const LOCAL_RUNTIME_ENDPOINTS = {
  ollama: "http://127.0.0.1:11434",
  comfyui: "http://127.0.0.1:8000"
};
const COMFYUI_ENDPOINT_CANDIDATES = [
  LOCAL_RUNTIME_ENDPOINTS.comfyui,
  "http://127.0.0.1:8188"
];
const providerConfigPath = () => path.join(app.getPath("userData"), "provider-credentials.json");
const providerHealthPath = () => path.join(app.getPath("userData"), "provider-health.json");
const generationJobsPath = () => path.join(app.getPath("userData"), "generation-jobs.json");
const diagnosticsPath = () => path.join(app.getPath("userData"), "generation-diagnostics.jsonl");
const userStyleLibraryPath = () => path.join(app.getPath("userData"), "visual-style-library.json");
const generationStatuses = new Set(["queued", "processing", "completed", "failed", "cancelled"]);
// This is the backend authority for safe submission. The UI may make the
// controls pleasant, but no route can submit a combination outside this
// contract. Broad gateway models use conservative defaults until their exact
// vendor capability has passed a live contract test.
const MODEL_CAPABILITIES = {
  "local-flux1-schnell-fp8": { output: "image", ratios: ["1:1", "16:9", "9:16", "3:2", "2:3"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 0 },
  "local-wan21-fun-inp-1.3b": { output: "video", ratios: ["16:9", "9:16", "1:1"], resolutions: ["480p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, endFrame: true, duration: [2, 5] },
  // 21:9 is not a native OpenAI image size — requestOpenAIShotImage generates
  // at the widest native size (1536x1024) and center-crops to 21:9 via
  // ffmpeg. Listed here because that crop step makes it a real, working
  // option, not because the Images API itself accepts it.
  "gpt-image-1": { output: "image", ratios: ["1:1", "3:2", "2:3", "16:9", "9:16", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 8 },
  // gpt-image-2.5-flare/sunburst (OpenAI, 2026-09-08) and their fal
  // mirrors — one shared capability entry per model id, reused across
  // both provider paths (requestOpenAIShotImage / requestFalImage), same
  // as gpt-image-1 above. fal's documented image_urls cap is 16.
  "gpt-image-2.5-flare": { output: "image", ratios: ["1:1", "3:2", "2:3", "16:9", "9:16", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 16 },
  "gpt-image-2.5-sunburst": { output: "image", ratios: ["1:1", "3:2", "2:3", "16:9", "9:16", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 16 },
  "fal-gpt-image-2.5-flare": { output: "image", ratios: ["1:1", "3:2", "2:3", "16:9", "9:16", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 16 },
  "fal-gpt-image-2.5-sunburst": { output: "image", ratios: ["1:1", "3:2", "2:3", "16:9", "9:16", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 16 },
  "gemini-2.5-flash-image": { output: "image", ratios: ["1:1", "16:9", "9:16"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 8 },
  "kie-veo-3.1": { output: "video", ratios: ["16:9", "9:16"], resolutions: ["720p", "1080p"], references: 1, duration: [3, 8] },
  "kie-kling-2.6-t2v": { output: "video", ratios: ["1:1", "16:9", "9:16"], resolutions: ["720p", "1080p"], references: 0, duration: [3, 10] },
  "kie-kling-2.6-i2v": { output: "video", ratios: ["16:9"], resolutions: ["720p", "1080p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, duration: [3, 10] },
  "kie-seedance-2-video": { output: "video", ratios: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"], resolutions: ["480p", "720p", "1080p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, duration: [3, 15] },
  "bytedance/seedance-2.0/text-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], resolutions: ["480p", "720p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, duration: [4, 15] },
  "bytedance/seedance-2.0/image-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], resolutions: ["480p", "720p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, duration: [4, 15] },
  "bytedance/seedance-2.0-fast/image-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], resolutions: ["480p", "720p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, duration: [4, 15] },
  "kwaivgi/kling-v2.6-pro/image-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, singleSourceImageToVideo: true, startEndFrames: true, duration: [3, 10] },
  "bytedance/seedance-2.0/reference-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], resolutions: ["480p", "720p"], references: 15, referenceLimits: { image: 9, video: 3, audio: 3 }, duration: [4, 15] },
  "fal-ai/kling-video/v3/standard/text-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], references: 0, referenceLimits: { image: 0, video: 0, audio: 0 }, duration: [3, 15] },
  "fal-ai/kling-video/v3/standard/image-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], references: 8, referenceLimits: { image: 8, video: 6, audio: 0 }, startEndFrames: true, duration: [3, 15] },
  "fal-ai/kling-video/o1/standard/reference-to-video": { output: "video", ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], references: 7, referenceLimits: { image: 7, video: 0, audio: 0 }, duration: [3, 10] }
};
function modelCapability(model, provider = "") {
  const id = String(model || "");
  if (MODEL_CAPABILITIES[id]) return MODEL_CAPABILITIES[id];
  const video = /(?:video|seedance|kling|veo|wan|sora|vidu|hunyuan|ltx|hailuo|runway|i2v|t2v)/i.test(id);
  const singleSourceI2V = video && /(?:image-to-video|(?:^|[\/-])i2v(?:[\/-]|$))/i.test(id) && !/reference-to-video/i.test(id);
  return video
    ? { output: "video", ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], resolutions: ["480p", "720p", "1080p"], references: singleSourceI2V ? 0 : 1, referenceLimits: { image: singleSourceI2V ? 0 : 1, video: 0, audio: 0 }, startEndFrames: singleSourceI2V, singleSourceImageToVideo: singleSourceI2V, duration: [3, 15] }
    : { output: "image", ratios: ["1:1", "16:9", "9:16", "3:2", "2:3", "21:9"], resolutions: ["1024x1024", "1536x1024", "1024x1536"], references: 8 };
}
function isSingleSourceImageToVideo(settings, capability) {
  const mode = String(settings?.mode || "");
  const provider = String(settings?.provider || "");
  const model = String(settings?.model || "");
  if (mode !== "image-to-video") return false;
  if (capability?.singleSourceImageToVideo === true) return true;
  return provider === "wavespeed" && /(?:^|\/)image-to-video(?:$|\/)/i.test(model);
}
function generationId(prefix = "gen") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function redactDiagnostic(value) {
  return String(value || "").replace(/(Bearer|Key)\s+[A-Za-z0-9_\-.]+/gi, "$1 [redacted]").replace(/([?&]key=)[^&\s]+/gi, "$1[redacted]");
}
function readGenerationJobs() {
  try { const value = JSON.parse(fs.readFileSync(generationJobsPath(), "utf8")); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function writeGenerationJobs(jobs) { fs.mkdirSync(path.dirname(generationJobsPath()), { recursive: true }); fs.writeFileSync(generationJobsPath(), `${JSON.stringify(jobs.slice(0, 500), null, 2)}\n`, "utf8"); }
function readUserStyleLibrary() {
  try { const value = JSON.parse(fs.readFileSync(userStyleLibraryPath(), "utf8")); return Array.isArray(value) ? value.filter((style) => style && typeof style === "object" && typeof style.id === "string" && typeof style.name === "string").slice(0, 300) : []; }
  catch { return []; }
}
function writeUserStyleLibrary(styles) {
  const safe = Array.isArray(styles) ? styles.filter((style) => style && typeof style === "object" && typeof style.id === "string" && typeof style.name === "string").slice(0, 300) : [];
  fs.mkdirSync(path.dirname(userStyleLibraryPath()), { recursive: true });
  const temporary = `${userStyleLibraryPath()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(safe, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, userStyleLibraryPath());
  return safe;
}
function logGeneration(event, detail = {}) {
  const record = { at: new Date().toISOString(), event, ...detail };
  fs.mkdirSync(path.dirname(diagnosticsPath()), { recursive: true });
  fs.appendFileSync(diagnosticsPath(), `${JSON.stringify(record, (_key, value) => typeof value === "string" ? redactDiagnostic(value) : value)}\n`, "utf8");
  return record;
}
// Real crash telemetry, opt-in, built on the local diagnostics log
// above rather than replacing it — that log stays exactly as it was.
//
// The DSN is never committed to this public repo: it lives in an
// optional, gitignored sentry.config.json at the project root (bundled
// into packaged builds via package.json's build.files, the same
// mechanism resolve-bridge/**/* already uses), or an env var override
// for build-time injection. Neither exists on this dev machine yet, so
// telemetry stays fully inert — initTelemetry() below never even
// requires the Sentry SDK when there's no DSN configured.
const telemetryConsentPath = () => path.join(app.getPath("userData"), "telemetry-settings.json");
function readTelemetryConsent() {
  try { return JSON.parse(fs.readFileSync(telemetryConsentPath(), "utf8"))?.enabled === true; }
  catch { return false; }
}
function writeTelemetryConsent(value) {
  fs.mkdirSync(path.dirname(telemetryConsentPath()), { recursive: true });
  fs.writeFileSync(telemetryConsentPath(), JSON.stringify({ enabled: Boolean(value) }), "utf8");
}
function loadSentryDsn() {
  const envDsn = String(process.env.STORYMAKER_SENTRY_DSN || "").trim();
  if (envDsn) return envDsn;
  try { return String(JSON.parse(fs.readFileSync(path.join(__dirname, "sentry.config.json"), "utf8"))?.dsn || "").trim(); }
  catch { return ""; }
}
// Same redaction the local diagnostics log already applies (strips
// Bearer/API-key tokens from any string field), plus stripping the
// Windows username out of file paths — a log that never leaves the
// user's own PC doesn't need that, but this is the one thing in the
// app that sends data off the machine, so it gets the stricter
// treatment. Fails closed: if redaction itself throws for any reason,
// the event is dropped rather than risking something unredacted
// going out.
function redactForTelemetry(value) {
  return redactDiagnostic(value)
    .replace(/([A-Za-z]:\\Users\\)[^\\]+(\\|$)/g, "$1[user]$2")
    .replace(/(\/(?:home|Users)\/)[^/]+(\/|$)/g, "$1[user]$2");
}
function redactSentryEvent(event) {
  try { return JSON.parse(JSON.stringify(event, (_key, value) => typeof value === "string" ? redactForTelemetry(value) : value)); }
  catch { return null; }
}
let telemetrySdk = null;
let telemetryConsent = false;
let telemetryConfiguredDsn = "";
// Confirmed live (not assumed from docs): Sentry.init() must run BEFORE
// app.whenReady() resolves — calling it any later throws "Sentry SDK
// should be initialized before the Electron app 'ready' event is
// fired" from deep inside its IPC setup, as an unhandled rejection that
// left the process hung in testing. That rules out re-calling init()
// later to react to the user flipping the Settings toggle. Instead,
// the SDK's own "enabled" option is left true whenever a DSN exists,
// and telemetryConsent — checked fresh in beforeSend on every single
// event — is the real, live-togglable gate: flipping the Settings
// toggle just updates this variable and the saved file, taking effect
// on the very next captured error with no restart and no re-init.
// Confirmed live too: beforeSend fires regardless of the SDK's enabled
// value, and returning null from it drops the event before any network
// attempt — closing the app right after (Sentry.close()) resolves in
// well under a second with nothing pending, exactly as expected for an
// event that was never actually queued to send.
function initTelemetry() {
  telemetryConfiguredDsn = loadSentryDsn();
  telemetryConsent = readTelemetryConsent();
  if (!telemetryConfiguredDsn) return;
  telemetrySdk = require("@sentry/electron/main");
  telemetrySdk.init({
    dsn: telemetryConfiguredDsn,
    enabled: true,
    autoSessionTracking: false,
    environment: app.isPackaged ? "production" : "development",
    release: `storymaker@${app.getVersion()}`,
    beforeSend: (event) => (telemetryConsent ? redactSentryEvent(event) : null)
  });
}
function reportTelemetryError(error) {
  if (!telemetrySdk || !telemetryConsent) return;
  try { telemetrySdk.captureException(error instanceof Error ? error : new Error(String(error))); } catch {}
}
// For events that aren't a thrown Error — a renderer crash, a failed
// load, an error forwarded from the renderer as a plain message/stack
// pair rather than a live Error object — captured as a message with the
// raw detail attached, same beforeSend redaction applies either way.
function reportTelemetryMessage(message, extra) {
  if (!telemetrySdk || !telemetryConsent) return;
  try { telemetrySdk.captureMessage(message, { level: "error", extra }); } catch {}
}
initTelemetry();

// ---------------------------------------------------------------------------
// Licensing / entitlement — LemonSqueezy license keys.
//
// This is an ENTITLEMENT gate, not a copy-protection wall, and it's built
// and named that way on purpose. Storymaker ships as an Electron app: the
// renderer is readable JavaScript inside an asar, so a determined person
// patches any check out in minutes — no offline scheme changes that. What
// this DOES buy: friction against casual "here, copy my install" sharing,
// and a clean record of who's entitled to updates and support. The gate is
// a real throw in the main process (not just a hidden button) so a
// non-technical user actually hits it; that's the honest bar.
//
// Config (store id + allowed product ids) is NOT secret but isn't blasted
// into this public repo either: it lives in a gitignored license.config.json
// at the project root (bundled into packaged builds via build.files, same
// as sentry.config.json), or STORYMAKER_LICENSE_* env vars. With no store
// id configured, licensing is INERT — assertLicensed() is a no-op and the
// app runs unrestricted, so a dev build or a fork is never bricked.
const LICENSE_RECHECK_MS = 72 * 60 * 60 * 1000;      // trust a cached "valid" for 3 days
const LICENSE_OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000; // then allow 14 more days fully offline
const licenseStatePath = () => path.join(app.getPath("userData"), "license.json");
function readLicenseState() {
  try { return JSON.parse(fs.readFileSync(licenseStatePath(), "utf8")) || {}; }
  catch { return {}; }
}
function writeLicenseState(next) {
  fs.mkdirSync(path.dirname(licenseStatePath()), { recursive: true });
  fs.writeFileSync(licenseStatePath(), JSON.stringify(next, null, 2), "utf8");
}
function loadLicenseConfig() {
  const envStore = String(process.env.STORYMAKER_LICENSE_STORE_ID || "").trim();
  const envProducts = String(process.env.STORYMAKER_LICENSE_PRODUCT_IDS || "").trim();
  // Pro tier — a second, more expensive LemonSqueezy product/variant in the
  // same store. Entirely optional: leave this unset and every valid key
  // (from productIds above) is treated as Pro, so nothing changes for
  // anyone until this is actually configured. See licenseTierFor() below
  // for what a Pro key additionally unlocks (currently: Music Video mode's
  // delivery polish — chapter markers, lyric captions, section CSV).
  const envProProducts = String(process.env.STORYMAKER_LICENSE_PRO_PRODUCT_IDS || "").trim();
  let file = {};
  try { file = JSON.parse(fs.readFileSync(path.join(__dirname, "license.config.json"), "utf8")) || {}; }
  catch { file = {}; }
  const storeId = Number(envStore || file.storeId || 0) || 0;
  const productIds = (envProducts ? envProducts.split(",") : (file.productIds || []))
    .map((id) => Number(String(id).trim())).filter(Boolean);
  const proProductIds = (envProProducts ? envProProducts.split(",") : (file.proProductIds || []))
    .map((id) => Number(String(id).trim())).filter(Boolean);
  const apiBase = String(process.env.STORYMAKER_LICENSE_API_BASE || file.apiBase || "https://api.lemonsqueezy.com/v1").replace(/\/+$/, "");
  return { storeId, productIds, proProductIds, apiBase, configured: storeId > 0 };
}
const licenseConfig = loadLicenseConfig();
let licenseState = readLicenseState();

// A mock so the whole gate + UI + offline-grace logic is testable without a
// real store or key. STORYMAKER_LICENSE_MOCK = valid | invalid | limit | expired.
function licenseMock() {
  const mode = String(process.env.STORYMAKER_LICENSE_MOCK || "").trim().toLowerCase();
  if (!mode) return null;
  const meta = { store_id: licenseConfig.storeId || 1, product_id: licenseConfig.productIds[0] || 1, customer_name: "Mock Customer" };
  if (mode === "valid") return { ok: true, activated: true, valid: true, license_key: { status: "active", activation_limit: 3, activation_usage: 1, expires_at: null }, instance: { id: "mock-instance", name: "mock" }, meta };
  if (mode === "limit") return { ok: false, error: "License key has reached its activation limit." };
  if (mode === "expired") return { ok: false, activated: false, valid: false, license_key: { status: "expired" }, meta };
  return { ok: false, error: "license_key not found." }; // "invalid"
}
async function lemonSqueezyCall(action, params) {
  const mock = licenseMock();
  if (mock) return mock;
  const body = new URLSearchParams(params);
  const response = await fetch(`${licenseConfig.apiBase}/licenses/${action}`, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, ...data };
}
// A LemonSqueezy response only entitles THIS app if it's from the configured
// store and (when product ids are pinned) one of the allowed products —
// otherwise any valid key from any unrelated LemonSqueezy store would work.
function licenseMetaMatches(meta) {
  if (!meta) return false;
  if (licenseConfig.storeId && Number(meta.store_id) !== licenseConfig.storeId) return false;
  if (licenseConfig.productIds.length && !licenseConfig.productIds.includes(Number(meta.product_id))) return false;
  return true;
}
// A licensed key is "pro" by default: with no proProductIds configured,
// every valid key across every configured productId counts as Pro, so
// this ships wired-but-inert (identical UX to today) until a second
// LemonSqueezy product actually exists to sell as the upgrade. Once
// proProductIds is set, a key whose product_id isn't in that list is
// "standard" — fully licensed (generation and base delivery still work),
// just not entitled to the Pro-only Music Video delivery polish.
function licenseTierFor(state, licensedNow) {
  if (!licenseConfig.configured) return "pro";
  if (!licensedNow) return "none";
  if (!licenseConfig.proProductIds.length) return "pro";
  return licenseConfig.proProductIds.includes(Number(state.productId)) ? "pro" : "standard";
}
function summarizeLicense(state) {
  const now = Date.now();
  // A stored valid license is trusted without any network call for
  // LICENSE_RECHECK_MS; after that, refreshLicense() tries to re-validate
  // on every launch, but a genuinely offline user keeps working for
  // LICENSE_OFFLINE_GRACE_MS more before the gate finally closes. So the
  // total offline tolerance from the last good check is recheck + grace.
  const age = state.lastCheck ? now - state.lastCheck : 0;
  const licensed = Boolean(state.valid) && (!state.lastCheck || age < LICENSE_RECHECK_MS + LICENSE_OFFLINE_GRACE_MS);
  return {
    configured: licenseConfig.configured,
    licensed: licenseConfig.configured ? licensed : true,
    tier: licenseTierFor(state, licensed),
    proTierConfigured: licenseConfig.proProductIds.length > 0,
    hasKey: Boolean(state.key),
    status: state.status || (state.key ? "unknown" : "none"),
    customerName: state.customerName || "",
    activationLimit: state.activationLimit || null,
    activationUsage: state.activationUsage || null,
    lastCheck: state.lastCheck || null,
    staleOffline: Boolean(state.valid && state.lastCheck && now - state.lastCheck >= LICENSE_RECHECK_MS),
    message: state.message || ""
  };
}
function licenseOk() {
  return summarizeLicense(licenseState).licensed;
}
function licenseTier() {
  return summarizeLicense(licenseState).tier;
}
// The soft check — include Pro-only extras when entitled, quietly omit
// them otherwise, unlike assertProTier() which throws. One place to read
// instead of `licenseTier() === "pro"` re-derived at every call site.
function isProTier() {
  return licenseTier() === "pro";
}
// The base gate. Called at the top of every generation and every
// delivery/export path. No-op when licensing isn't configured.
function assertLicensed() {
  if (!licenseConfig.configured) return;
  if (licenseOk()) return;
  const error = new Error("Storymaker isn't activated on this device. Enter your license key in Settings to generate and deliver.");
  error.code = "LICENSE_REQUIRED";
  throw error;
}
// The narrower Pro gate — implies assertLicensed() (a Pro key is still a
// license key) and additionally requires the Pro tier. Currently guards
// only the Music Video delivery-polish additions (see loadLicenseConfig's
// comment); base generation and delivery stay on the standard gate above.
// No-op under the same two conditions as assertLicensed(): licensing not
// configured at all, or no Pro product configured yet (licenseTier() then
// returns "pro" for every valid key) — so this is inert until deliberately
// turned on, not a silent new restriction on existing customers.
function assertProTier(feature) {
  assertLicensed();
  if (isProTier()) return;
  const error = new Error(`${feature || "This feature"} is part of Storymaker's Pro tier. Your current license covers generation and delivery — upgrading to Pro adds Music Video's chapter markers, lyric captions, and section breakdown export.`);
  error.code = "LICENSE_PRO_REQUIRED";
  throw error;
}
async function activateLicense(rawKey) {
  const key = String(rawKey || "").trim();
  if (!key) throw new Error("Enter a license key.");
  if (!licenseConfig.configured) return { ...summarizeLicense(licenseState), message: "This build has no license store configured, so activation isn't required." };
  const instanceName = `Storymaker · ${require("os").hostname()}`.slice(0, 190);
  const result = await lemonSqueezyCall("activate", { license_key: key, instance_name: instanceName });
  if (!result.ok || result.activated === false || result.error) {
    throw new Error(result.error || "That license key could not be activated. Check the key, or that it hasn't reached its device limit.");
  }
  if (!licenseMetaMatches(result.meta)) {
    throw new Error("That key is valid, but it isn't for this product.");
  }
  const lk = result.license_key || {};
  licenseState = {
    key,
    instanceId: result.instance?.id || "",
    valid: lk.status === "active",
    status: lk.status || "active",
    customerName: result.meta?.customer_name || "",
    activationLimit: lk.activation_limit ?? null,
    activationUsage: lk.activation_usage ?? null,
    productId: result.meta?.product_id || null,
    lastCheck: Date.now(),
    message: ""
  };
  writeLicenseState(licenseState);
  return summarizeLicense(licenseState);
}
async function deactivateLicense() {
  if (licenseState.key && licenseState.instanceId && licenseConfig.configured) {
    try { await lemonSqueezyCall("deactivate", { license_key: licenseState.key, instance_id: licenseState.instanceId }); }
    catch { /* still clear locally — a freed-or-not seat shouldn't block sign-out */ }
  }
  licenseState = {};
  writeLicenseState(licenseState);
  return summarizeLicense(licenseState);
}
// Periodic re-validation. Runs at startup and is safe to call again; a
// network failure is NOT treated as "unlicensed" — the offline grace in
// summarizeLicense() covers a genuinely offline user for two weeks past the
// last good check before the gate closes.
async function refreshLicense() {
  if (!licenseConfig.configured || !licenseState.key) return summarizeLicense(licenseState);
  try {
    const result = await lemonSqueezyCall("validate", {
      license_key: licenseState.key,
      ...(licenseState.instanceId ? { instance_id: licenseState.instanceId } : {})
    });
    if (result.ok && result.valid && licenseMetaMatches(result.meta)) {
      const lk = result.license_key || {};
      licenseState = { ...licenseState, valid: true, status: lk.status || "active", activationLimit: lk.activation_limit ?? licenseState.activationLimit, activationUsage: lk.activation_usage ?? licenseState.activationUsage, lastCheck: Date.now(), message: "" };
    } else if (result.ok && result.valid === false) {
      licenseState = { ...licenseState, valid: false, status: result.license_key?.status || "invalid", lastCheck: Date.now(), message: "This license key is no longer valid on this device." };
    }
    // any other shape (network error, malformed) -> leave state untouched, grace applies
  } catch { /* offline -> grace */ }
  writeLicenseState(licenseState);
  return summarizeLicense(licenseState);
}

function updateGenerationJob(id, patch) {
  const jobs = readGenerationJobs(); const index = jobs.findIndex((job) => job.id === id);
  if (index < 0) return null;
  const next = { ...jobs[index], ...patch, updatedAt: new Date().toISOString() };
  jobs[index] = next; writeGenerationJobs(jobs); return next;
}
function createGenerationJob(kind, payload) {
  const settings = payload?.settings || {};
  const job = { id: generationId(kind), kind, status: "processing", provider: String(settings.provider || ""), model: String(settings.model || ""), projectId: String(payload?.project?.id || ""), projectName: String(payload?.project?.name || ""), sceneTitle: String(payload?.scene?.title || ""), shotTitle: String(payload?.shot?.title || ""), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 1 };
  const jobs = readGenerationJobs(); jobs.unshift(job); writeGenerationJobs(jobs); logGeneration("job.created", { jobId: job.id, provider: job.provider, model: job.model, kind }); return job;
}
function errorCategory(error) {
  const message = String(error?.message || error || "Generation failed.");
  if (/key|credential|401|403|authori[sz]/i.test(message)) return "authentication";
  if (/credit|balance|payment|insufficient/i.test(message)) return "insufficient_credits";
  if (/rate|429/i.test(message)) return "rate_limit";
  if (/timeout|too long|abort/i.test(message)) return "timeout";
  if (/unsupported|not supported|deprecated|model/i.test(message)) return "unsupported_parameter";
  if (/reference|upload|file|mime|image url/i.test(message)) return "upload_failure";
  return "provider_failure";
}
function readProviderCredentials() {
  try { return JSON.parse(fs.readFileSync(providerConfigPath(), "utf8")); }
  catch { return {}; }
}
function writeProviderCredentials(config) {
  fs.mkdirSync(path.dirname(providerConfigPath()), { recursive: true });
  fs.writeFileSync(providerConfigPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
function readProviderHealth() {
  try { return JSON.parse(fs.readFileSync(providerHealthPath(), "utf8")); }
  catch { return {}; }
}
function writeProviderHealth(health) {
  fs.mkdirSync(path.dirname(providerHealthPath()), { recursive: true });
  fs.writeFileSync(providerHealthPath(), `${JSON.stringify(health, null, 2)}\n`, "utf8");
}
function markProviderVerified(provider, message) {
  const health = readProviderHealth();
  health[provider] = { state: "verified", checkedAt: new Date().toISOString(), message };
  writeProviderHealth(health);
}
function providerStatus() {
  const config = readProviderCredentials();
  const health = readProviderHealth();
  const encrypted = safeStorage.isEncryptionAvailable();
  return {
    encryptionAvailable: encrypted,
    providers: providerIds.reduce((result, id) => {
      result[id] = Boolean(encrypted && config[id]);
      return result;
    }, {}),
    health: providerIds.reduce((result, id) => { result[id] = health[id] || null; return result; }, {})
  };
}
function getProviderKey(provider) {
  const encrypted = readProviderCredentials()[provider];
  if (!encrypted || !safeStorage.isEncryptionAvailable()) return "";
  try { return safeStorage.decryptString(Buffer.from(encrypted, "base64")); }
  catch { return ""; }
}
async function fetchLocalJson(url, optionsOrTimeout = 2500, timeoutOverride) {
  const options = typeof optionsOrTimeout === "object" && optionsOrTimeout ? optionsOrTimeout : {};
  const timeoutMs = typeof optionsOrTimeout === "number" ? optionsOrTimeout : Number(timeoutOverride || 2500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Local service returned ${response.status}.`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}
async function activeComfyUiBaseUrl() {
  for (const baseUrl of comfyEndpointCandidates()) {
    try {
      await fetchLocalJson(`${baseUrl}/system_stats`, 5000);
      return baseUrl;
    } catch {}
  }
  throw new Error("ComfyUI is not running. Start ComfyUI Desktop, then retry.");
}
async function localRuntimeStatus() {
  const checkedAt = new Date().toISOString();
  const result = {
    checkedAt,
    ollama: { state: "offline", baseUrl: LOCAL_RUNTIME_ENDPOINTS.ollama, models: [], message: "Ollama was not detected on this PC." },
    comfyui: { state: "offline", baseUrl: LOCAL_RUNTIME_ENDPOINTS.comfyui, models: [], devices: [], message: "ComfyUI was not detected on this PC." }
  };
  await Promise.all([
    fetchLocalJson(`${LOCAL_RUNTIME_ENDPOINTS.ollama}/api/tags`).then((payload) => {
      const models = (Array.isArray(payload?.models) ? payload.models : []).map((item) => String(item?.name || item?.model || "")).filter(Boolean);
      result.ollama = { ...result.ollama, state: models.length ? "ready" : "available", models, message: models.length ? `${models.length} local language model${models.length === 1 ? "" : "s"} ready.` : "Ollama is running. Install a model to enable private story intelligence." };
    }).catch(() => {}),
    (async () => {
      for (const baseUrl of comfyEndpointCandidates()) {
        try {
          const payload = await fetchLocalJson(`${baseUrl}/system_stats`);
          const devices = (Array.isArray(payload?.devices) ? payload.devices : []).map((item) => ({
            name: String(item?.name || item?.type || "Local device"),
            type: String(item?.type || ""),
            vramTotal: Number(item?.vram_total || 0),
            vramFree: Number(item?.vram_free || 0)
          }));
          let models = [];
          let localCapabilities = { image: false, video: false, videoLtx: false };
          try {
            // /object_info returns ComfyUI's ENTIRE node schema — every
            // built-in node plus every custom node pack installed (LTX-Video
            // support alone adds several) — easily the heaviest endpoint
            // ComfyUI exposes, yet this call was left on fetchLocalJson's
            // 2500ms default: the shortest timeout anywhere in this file,
            // on the single biggest payload. A real install with a handful
            // of custom node packs could plausibly need longer than that to
            // respond, which would make Model Hub report "no local
            // capability detected" even with a fully working, fully
            // installed ComfyUI — every other /object_info call in this
            // file (scoped to one node) already gets 10-30s.
            const objectInfo = await fetchLocalJson(`${baseUrl}/object_info`, 20000);
            const optionsFor = (node, input) => {
              const options = objectInfo?.[node]?.input?.required?.[input]?.[0];
              return Array.isArray(options) ? options.map(String).filter(Boolean) : [];
            };
            const checkpoints = optionsFor("CheckpointLoaderSimple", "ckpt_name");
            const diffusionModels = optionsFor("UNETLoader", "unet_name");
            const textEncoders = optionsFor("CLIPLoader", "clip_name");
            const vaes = optionsFor("VAELoader", "vae_name");
            const visionModels = optionsFor("CLIPVisionLoader", "clip_name");
            models = [...new Set([...checkpoints, ...diffusionModels, ...textEncoders, ...vaes, ...visionModels])];
            localCapabilities = {
              image: checkpoints.includes("flux1-schnell-fp8.safetensors"),
              video: diffusionModels.includes("wan2.1_fun_inp_1.3B_bf16.safetensors")
                && textEncoders.includes("umt5_xxl_fp8_e4m3fn_scaled.safetensors")
                && vaes.includes("wan_2.1_vae.safetensors")
                && visionModels.includes("clip_vision_h.safetensors")
                && Boolean(objectInfo?.WanFunInpaintToVideo),
              videoLtx: checkpoints.includes("ltxv-2b-0.9.8-distilled-fp8.safetensors") && textEncoders.includes("t5xxl_fp8_e4m3fn.safetensors") && Boolean(objectInfo?.LTXVImgToVideo)
            };
          } catch {}
          const anyReady = localCapabilities.image || localCapabilities.video || localCapabilities.videoLtx;
          const videoEngines = [localCapabilities.video ? "Wan" : "", localCapabilities.videoLtx ? "LTX-Video" : ""].filter(Boolean);
          result.comfyui = {
            ...result.comfyui,
            baseUrl,
            state: anyReady ? "ready" : "available",
            models,
            devices,
            capabilities: localCapabilities,
            message: anyReady
              ? `${localCapabilities.image ? "Local image" : ""}${localCapabilities.image && videoEngines.length ? " and " : ""}${videoEngines.length ? `image-to-video (${videoEngines.join(", ")})` : ""} generation ready.`
              : "ComfyUI is running. Install a local workflow model to enable private image and video generation."
          };
          return;
        } catch {}
      }
    })()
  ]);
  return result;
}
// ===========================================================================
// Managed local engine — Storymaker runs a headless ComfyUI itself.
//
// The point (proven by the spike, see docs/LOCAL_MODELS_SPIKE.md): a user
// who wants LTX-Video or Wan locally should pick it from a list and never
// open ComfyUI. Storymaker discovers a ComfyUI runtime (its own, or an
// existing Desktop/portable install), spawns the SERVER only — no window —
// on a private port it owns, downloads the curated weight set into a folder
// it owns, points ComfyUI at both that folder and any existing model store
// the user already has, runs the SAME baked LTX/Wan workflows the manual
// ComfyUI path already uses, and shuts the server down when idle.
//
// v1 requires a ComfyUI install to already exist on the PC (Desktop or
// portable) — downloading a portable runtime from scratch is a later pass.
// The curated MODEL download is here though, because placing four weight
// files in four different folders is the actual ComfyUI headache.
const MANAGED_COMFY_PORT = 8199;
const MANAGED_COMFY_IDLE_MS = 12 * 60 * 1000;
const localEngineDir = () => path.join(app.getPath("userData"), "local-engine");
const localEngineModelsDir = () => path.join(localEngineDir(), "models");
// Verified 200-OK and sizes pulled live from the HuggingFace API. No sha256
// pin: HF's xet CDN de-dupes and re-uploads in ways that make a pinned hash
// brittle, so a download is accepted on exact byte size + a safetensors
// structural check (8-byte LE header length, then parseable JSON header
// whose declared span fits the file) — that catches truncation, a wrong
// redirect, and disk-full, which are the real failure modes. sha256 pinning
// is a later hardening.
const LOCAL_ENGINE_CATALOG = [
  {
    id: "ltx-video-2b",
    label: "LTX-Video 2B (distilled)",
    engine: "ltx",
    minVramGB: 8,
    blurb: "Fast image-to-video. Best for quick motion on a modest GPU.",
    files: [
      { name: "ltxv-2b-0.9.8-distilled.safetensors", dir: "checkpoints", size: 6340744492, url: "https://huggingface.co/Lightricks/LTX-Video/resolve/main/ltxv-2b-0.9.8-distilled.safetensors" },
      { name: "t5xxl_fp8_e4m3fn.safetensors", dir: "text_encoders", size: 4893934904, url: "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors" }
    ]
  },
  {
    id: "wan-2-1-fun-inp-1-3b",
    label: "Wan 2.1 Fun InP 1.3B",
    engine: "wan",
    minVramGB: 8,
    blurb: "Image-to-video with start/end frame control. Slower, steadier motion.",
    files: [
      { name: "wan2.1_fun_inp_1.3B_bf16.safetensors", dir: "diffusion_models", size: 3128957992, url: "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_fun_inp_1.3B_bf16.safetensors" },
      { name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", dir: "text_encoders", size: 6735906897, url: "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" },
      { name: "wan_2.1_vae.safetensors", dir: "vae", size: 253815318, url: "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors" },
      { name: "clip_vision_h.safetensors", dir: "clip_vision", size: 1264219396, url: "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors" }
    ]
  }
];
// LTX may be present as the bf16 distilled checkpoint (what managed mode
// downloads) OR the community fp8 quant (what a hand-set-up ComfyUI often
// has). Either satisfies the workflow; check both names everywhere.
const LTX_CHECKPOINT_NAMES = ["ltxv-2b-0.9.8-distilled.safetensors", "ltxv-2b-0.9.8-distilled-fp8.safetensors"];

let managedComfy = { proc: null, port: MANAGED_COMFY_PORT, baseUrl: `http://127.0.0.1:${MANAGED_COMFY_PORT}`, startedAt: 0, lastUsed: 0, starting: null };
let localEngineDownload = null; // { entryId, file, receivedBytes, totalBytes, phase, cancel }

function comfyEndpointCandidates() {
  // Managed first: if Storymaker started it, prefer it over whatever else
  // the user might have running.
  return managedComfy.proc ? [managedComfy.baseUrl, ...COMFYUI_ENDPOINT_CANDIDATES] : [...COMFYUI_ENDPOINT_CANDIDATES];
}
function readYamlBasePath(file) {
  try {
    const match = fs.readFileSync(file, "utf8").match(/^\s*base_path:\s*(.+?)\s*$/m);
    return match ? match[1].replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
// Find a (python, main.py) pair that can actually run a ComfyUI server.
// Order: Storymaker's own runtime (later pass), then Comfy Desktop 2.x,
// then a portable ComfyUI in a common spot. Returns null if none.
function discoverComfyRuntime() {
  const exists = (p) => { try { return p && fs.existsSync(p); } catch { return false; } };
  const local = process.env.LOCALAPPDATA || path.join(app.getPath("home"), "AppData", "Local");
  const roaming = app.getPath("appData");
  const candidates = [];

  // Storymaker-owned portable runtime (populated by a future download step).
  candidates.push({
    kind: "storymaker",
    python: path.join(localEngineDir(), "runtime", "python_embeded", "python.exe"),
    mains: [path.join(localEngineDir(), "runtime", "ComfyUI", "main.py")]
  });

  // Comfy Desktop 2.x: venv lives at <base_path>/.venv, code under
  // Comfy-Desktop/ComfyUI-Installs/*/ComfyUI/main.py.
  const desktopBase = readYamlBasePath(path.join(roaming, "ComfyUI", "extra_models_config.yaml"));
  const installsRoot = path.join(local, "Comfy-Desktop", "ComfyUI-Installs");
  let desktopMains = [];
  try { desktopMains = fs.readdirSync(installsRoot).map((e) => path.join(installsRoot, e, "ComfyUI", "main.py")); } catch {}
  desktopMains.push(path.join(local, "Programs", "@comfyorgcomfyui-electron", "resources", "ComfyUI", "main.py"));
  if (desktopBase) {
    candidates.push({ kind: "comfy-desktop", python: path.join(desktopBase, ".venv", "Scripts", "python.exe"), mains: desktopMains, modelStore: path.join(desktopBase, "models") });
  }

  // Portable ComfyUI in common locations.
  for (const root of [local, path.join(app.getPath("home"), "Documents"), path.join(app.getPath("home"), "Desktop"), "C:\\", "D:\\", "E:\\"]) {
    const portable = path.join(root, "ComfyUI_windows_portable");
    candidates.push({ kind: "portable", python: path.join(portable, "python_embeded", "python.exe"), mains: [path.join(portable, "ComfyUI", "main.py")], modelStore: path.join(portable, "ComfyUI", "models") });
  }

  for (const candidate of candidates) {
    if (!exists(candidate.python)) continue;
    const main = candidate.mains.find(exists);
    if (!main) continue;
    return { kind: candidate.kind, python: candidate.python, main, modelStore: candidate.modelStore || "" };
  }
  return null;
}
function ensureLocalEngineLayout(runtime) {
  const base = localEngineDir();
  // custom_nodes must EXIST — ComfyUI's prestartup does os.listdir on it
  // unconditionally when --base-directory is set and crashes if it's missing.
  for (const sub of ["models", "input", "output", "user", "custom_nodes", "models/checkpoints", "models/text_encoders", "models/diffusion_models", "models/vae", "models/clip_vision"]) {
    fs.mkdirSync(path.join(base, sub), { recursive: true });
  }
  // Point the managed server at the user's existing model store too, so an
  // already-downloaded weight isn't downloaded again.
  const extraStores = [runtime?.modelStore].filter((p) => p && fs.existsSync(p));
  const yaml = extraStores.length
    ? `storymaker_external:\n  base_path: ${extraStores[0]}\n  checkpoints: checkpoints\n  text_encoders: text_encoders\n  diffusion_models: diffusion_models\n  vae: vae\n  clip_vision: clip_vision\n  clip: clip\n  unet: unet\n`
    : "# no external ComfyUI model store discovered\n";
  fs.writeFileSync(path.join(base, "extra_model_paths.yaml"), yaml, "utf8");
}
async function comfyHealthy(baseUrl, timeoutMs = 4000) {
  try { await fetchLocalJson(`${baseUrl}/system_stats`, timeoutMs); return true; } catch { return false; }
}
function stopManagedComfy() {
  if (managedComfy.proc) { try { managedComfy.proc.kill("SIGKILL"); } catch {} }
  managedComfy.proc = null; managedComfy.startedAt = 0;
}
// Start the headless server (idempotent). Rejects with a plain-language
// reason if no runtime is discoverable — the UI turns that into "install
// ComfyUI once, then this runs it for you".
async function startManagedComfy() {
  if (managedComfy.proc && await comfyHealthy(managedComfy.baseUrl)) { managedComfy.lastUsed = Date.now(); return managedComfy.baseUrl; }
  if (managedComfy.starting) return managedComfy.starting;
  managedComfy.starting = (async () => {
    const runtime = discoverComfyRuntime();
    if (!runtime) throw new Error("No local ComfyUI engine was found on this PC. Install ComfyUI Desktop once (or a portable ComfyUI) and Storymaker will run it for you from then on — you won't need to open it.");
    ensureLocalEngineLayout(runtime);
    const args = [
      "-s", runtime.main,
      "--listen", "127.0.0.1",
      "--port", String(managedComfy.port),
      "--base-directory", localEngineDir(),
      "--extra-model-paths-config", path.join(localEngineDir(), "extra_model_paths.yaml"),
      "--disable-auto-launch",
      "--dont-print-server"
    ];
    const child = spawn(runtime.python, args, { windowsHide: true, cwd: path.dirname(runtime.main) });
    const logStream = fs.createWriteStream(path.join(localEngineDir(), "server.log"), { flags: "w" });
    child.stdout.on("data", (d) => logStream.write(d));
    child.stderr.on("data", (d) => logStream.write(d));
    let exitedEarly = null;
    child.on("exit", (code, sig) => { exitedEarly = { code, sig }; if (managedComfy.proc === child) { managedComfy.proc = null; } });
    managedComfy.proc = child;
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      if (exitedEarly) {
        const tail = (() => { try { return fs.readFileSync(path.join(localEngineDir(), "server.log"), "utf8").slice(-1200); } catch { return ""; } })();
        throw new Error(`The local ComfyUI engine (${runtime.kind}) exited while starting. Last log:\n${tail}`);
      }
      if (await comfyHealthy(managedComfy.baseUrl, 3000)) {
        managedComfy.startedAt = Date.now(); managedComfy.lastUsed = Date.now();
        logGeneration("local-engine.started", { kind: runtime.kind, port: managedComfy.port });
        return managedComfy.baseUrl;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    stopManagedComfy();
    throw new Error("The local ComfyUI engine did not become ready within two minutes.");
  })();
  try { return await managedComfy.starting; } finally { managedComfy.starting = null; }
}
setInterval(() => {
  if (managedComfy.proc && managedComfy.lastUsed && Date.now() - managedComfy.lastUsed > MANAGED_COMFY_IDLE_MS && !localEngineDownload) {
    logGeneration("local-engine.idle-stop", { idleMs: Date.now() - managedComfy.lastUsed });
    stopManagedComfy();
  }
}, 60000).unref?.();
app.on("before-quit", stopManagedComfy);

// safetensors structural check: 8-byte LE header length, then that many
// bytes of JSON, whose largest declared tensor end offset must fit inside
// the remaining file. Cheap, catches truncation and wrong-file.
function looksLikeSafetensors(filePath, expectedSize) {
  try {
    const stat = fs.statSync(filePath);
    if (expectedSize && stat.size !== expectedSize) return false;
    const fd = fs.openSync(filePath, "r");
    try {
      const head = Buffer.alloc(8);
      fs.readSync(fd, head, 0, 8, 0);
      const headerLen = Number(head.readBigUInt64LE(0));
      if (headerLen <= 0 || headerLen > 100_000_000 || headerLen + 8 > stat.size) return false;
      const json = Buffer.alloc(Math.min(headerLen, 1_000_000));
      fs.readSync(fd, json, 0, json.length, 8);
      // First byte of a safetensors header is always '{'.
      return json[0] === 0x7b;
    } finally { fs.closeSync(fd); }
  } catch { return false; }
}
function localModelFilePath(file) {
  return path.join(localEngineModelsDir(), file.dir, file.name);
}
function localEngineEntryState(entry, installedNames, device) {
  const missing = entry.files.filter((f) => {
    const managed = localModelFilePath(f);
    if (fs.existsSync(managed) && looksLikeSafetensors(managed, f.size)) return false;
    // Present in the user's existing ComfyUI store (seen via /object_info)?
    const alias = entry.engine === "ltx" && f.dir === "checkpoints" ? LTX_CHECKPOINT_NAMES : [f.name];
    return !alias.some((n) => installedNames.includes(n));
  });
  const vramGB = device ? device.vramTotal / 1e9 : 0;
  return {
    id: entry.id, label: entry.label, engine: entry.engine, blurb: entry.blurb,
    minVramGB: entry.minVramGB,
    totalBytes: entry.files.reduce((sum, f) => sum + f.size, 0),
    installed: missing.length === 0,
    missingFiles: missing.map((f) => f.name),
    vramOk: !device || vramGB >= entry.minVramGB - 0.5,
    vramGB: Math.round(vramGB * 10) / 10
  };
}
async function localEngineStatus() {
  const runtime = discoverComfyRuntime();
  let installedNames = []; let device = null; let running = false; let baseUrl = "";
  for (const candidate of comfyEndpointCandidates()) {
    if (!(await comfyHealthy(candidate))) continue;
    running = true; baseUrl = candidate;
    try {
      const stats = await fetchLocalJson(`${candidate}/system_stats`, 5000);
      device = (stats.devices || [])[0] ? { name: String(stats.devices[0].name || ""), vramTotal: Number(stats.devices[0].vram_total || 0) } : null;
      const info = await fetchLocalJson(`${candidate}/object_info`, 20000);
      const opt = (n, i) => (Array.isArray(info?.[n]?.input?.required?.[i]?.[0]) ? info[n].input.required[i][0].map(String) : []);
      installedNames = [...new Set([...opt("CheckpointLoaderSimple", "ckpt_name"), ...opt("UNETLoader", "unet_name"), ...opt("CLIPLoader", "clip_name"), ...opt("VAELoader", "vae_name"), ...opt("CLIPVisionLoader", "clip_name")])];
    } catch {}
    break;
  }
  // Not running: still report install state from the managed model dir on disk.
  return {
    runtimeFound: Boolean(runtime),
    runtimeKind: runtime?.kind || "",
    running,
    baseUrl,
    managed: Boolean(managedComfy.proc),
    device,
    download: localEngineDownload ? { entryId: localEngineDownload.entryId, file: localEngineDownload.file, receivedBytes: localEngineDownload.receivedBytes, totalBytes: localEngineDownload.totalBytes, phase: localEngineDownload.phase } : null,
    catalog: LOCAL_ENGINE_CATALOG.map((entry) => localEngineEntryState(entry, installedNames, device))
  };
}
function emitLocalEngineProgress() {
  const payload = localEngineDownload
    ? { entryId: localEngineDownload.entryId, file: localEngineDownload.file, receivedBytes: localEngineDownload.receivedBytes, totalBytes: localEngineDownload.totalBytes, phase: localEngineDownload.phase }
    : { phase: "idle" };
  try { mainWindow?.webContents.send("local-engine-progress", payload); } catch {}
}
// Download one catalog entry's files into the managed model dir. Skips a
// file that's already there and structurally valid. Resumes a partial
// .part with a Range request. Verifies size + safetensors structure before
// accepting. Rewrites extra_model_paths.yaml so a running managed server
// picks the new files up on its next object_info.
async function downloadLocalModel(entryId) {
  if (localEngineDownload) throw new Error("A model download is already in progress.");
  const entry = LOCAL_ENGINE_CATALOG.find((e) => e.id === entryId);
  if (!entry) throw new Error("Unknown local model.");
  ensureLocalEngineLayout(discoverComfyRuntime());
  const controller = new AbortController();
  localEngineDownload = { entryId, file: "", receivedBytes: 0, totalBytes: entry.files.reduce((s, f) => s + f.size, 0), phase: "starting", cancel: () => controller.abort() };
  emitLocalEngineProgress();
  let doneBytes = 0;
  try {
    for (const file of entry.files) {
      const finalPath = localModelFilePath(file);
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
      localEngineDownload.file = file.name;
      if (fs.existsSync(finalPath) && looksLikeSafetensors(finalPath, file.size)) {
        doneBytes += file.size; localEngineDownload.receivedBytes = doneBytes; localEngineDownload.phase = "verifying"; emitLocalEngineProgress();
        continue;
      }
      const partPath = `${finalPath}.part`;
      let from = 0;
      try { from = fs.existsSync(partPath) ? fs.statSync(partPath).size : 0; } catch { from = 0; }
      if (from > file.size) { fs.unlinkSync(partPath); from = 0; }
      localEngineDownload.phase = "downloading"; localEngineDownload.receivedBytes = doneBytes + from; emitLocalEngineProgress();
      const response = await fetch(file.url, { headers: from ? { Range: `bytes=${from}-` } : {}, signal: controller.signal, redirect: "follow" });
      if (!response.ok && response.status !== 206) throw new Error(`Download of ${file.name} failed (HTTP ${response.status}).`);
      const out = fs.createWriteStream(partPath, { flags: from && response.status === 206 ? "a" : "w" });
      if (!(from && response.status === 206)) from = 0;
      let received = from;
      await new Promise((resolve, reject) => {
        const reader = response.body.getReader();
        const pump = () => reader.read().then(({ done, value }) => {
          if (done) { out.end(resolve); return; }
          received += value.length; doneBytes; localEngineDownload.receivedBytes = doneBytes + received;
          if (received % (8 * 1024 * 1024) < value.length) emitLocalEngineProgress();
          if (!out.write(Buffer.from(value))) { out.once("drain", pump); } else { pump(); }
        }).catch(reject);
        pump();
      });
      localEngineDownload.phase = "verifying"; emitLocalEngineProgress();
      if (!looksLikeSafetensors(partPath, file.size)) {
        throw new Error(`${file.name} downloaded but failed its integrity check (expected ${file.size} bytes). Try again — a partial file was kept for resume.`);
      }
      fs.renameSync(partPath, finalPath);
      doneBytes += file.size; localEngineDownload.receivedBytes = doneBytes; emitLocalEngineProgress();
    }
    ensureLocalEngineLayout(discoverComfyRuntime());
    localEngineDownload.phase = "done"; emitLocalEngineProgress();
    logGeneration("local-engine.model-installed", { entryId });
    return { ok: true };
  } catch (error) {
    logGeneration("local-engine.download-failed", { entryId, error: error?.message || "download failed" });
    throw error;
  } finally {
    localEngineDownload = null; emitLocalEngineProgress();
  }
}
// Called from the generation dispatch when a shot uses a comfyui model:
// bring the managed engine up if nothing is already serving.
async function ensureLocalEngineFor(_model) {
  for (const candidate of comfyEndpointCandidates()) {
    if (await comfyHealthy(candidate)) { managedComfy.lastUsed = Date.now(); return; }
  }
  await startManagedComfy();
}
function preferredOllamaModel(models) {
  const names = (Array.isArray(models) ? models : []).map(String);
  const priorities = [/qwen3/i, /gemma3/i, /llama3\.3/i, /llama3\.2/i, /mistral/i];
  for (const pattern of priorities) {
    const match = names.find((name) => pattern.test(name));
    if (match) return match;
  }
  return names[0] || "";
}
async function requestOllamaCompletion(instructions, userContent, timeoutMs = 180000) {
  const runtime = await localRuntimeStatus();
  const model = preferredOllamaModel(runtime.ollama.models);
  if (!model) throw new Error("Ollama is not ready. Start Ollama and install a local language model first.");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${LOCAL_RUNTIME_ENDPOINTS.ollama}/api/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [{ role: "system", content: instructions }, { role: "user", content: userContent }],
        options: { temperature: 0.2 }
      })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`Ollama request failed (${response.status}): ${raw.slice(0, 300)}`);
    let payload; try { payload = JSON.parse(raw); } catch { throw new Error("Ollama returned an unreadable response."); }
    const text = String(payload?.message?.content || payload?.response || "").trim();
    if (!text) throw new Error("Ollama returned no text.");
    return { text, model };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The local model took too long to respond.");
    throw error;
  } finally { clearTimeout(timeout); }
}
async function verifyProviderConnection(provider) {
  const apiKey = getProviderKey(provider);
  if (!apiKey) throw new Error("Save this provider key before running a connection check.");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response;
    if (provider === "openai") response = await fetch("https://api.openai.com/v1/models", { signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}` } });
    else if (provider === "google") response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, { signal: controller.signal });
    else if (provider === "openrouter") response = await fetch("https://openrouter.ai/api/v1/key", { signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}` } });
    else {
      const health = readProviderHealth(); health[provider] = { state: "saved", checkedAt: new Date().toISOString(), message: "This provider is verified by its first explicit render request; no non-generative health endpoint is assumed." }; writeProviderHealth(health); return providerStatus();
    }
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "This provider rejected the saved key." : `Connection check failed (${response.status}).`);
    const health = readProviderHealth(); health[provider] = { state: "verified", checkedAt: new Date().toISOString(), message: "Credential accepted by the provider." }; writeProviderHealth(health); return providerStatus();
  } catch (error) {
    const health = readProviderHealth(); health[provider] = { state: "failed", checkedAt: new Date().toISOString(), message: error?.name === "AbortError" ? "Connection check timed out." : (error?.message || "Connection check failed.") }; writeProviderHealth(health); throw error;
  } finally { clearTimeout(timeout); }
}
function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  for (const item of payload?.output || []) for (const content of item?.content || []) if (typeof content?.text === "string" && content.text.trim()) return content.text.trim();
  return "";
}
function parseDirectorReview(text, provider = "openai") {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    summary: String(parsed.summary || ""),
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions.slice(0, 5).map((item) => ({ signal: String(item.signal || "DIRECTOR NOTE"), title: String(item.title || "Creative decision"), rationale: String(item.rationale || ""), target: String(item.target || "Story Bible") })) : [],
    suggestedThemes: Array.isArray(parsed.suggestedThemes) ? parsed.suggestedThemes.slice(0, 6).map(String) : [],
    recommendedStructure: parsed.recommendedStructure && String(parsed.recommendedStructure.name || "").trim() ? { name: String(parsed.recommendedStructure.name).trim(), rationale: String(parsed.recommendedStructure.rationale || "").trim() } : null,
    generatedAt: new Date().toISOString(),
    provider
  };
}
function parseJsonObject(text, label) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(cleaned); } catch {
    // Some otherwise valid providers preface a JSON response with a short
    // sentence. Recover the first complete object rather than making the user
    // re-run analysis and pay for the same request again.
    const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* report the actionable error below */ }
    }
    throw new Error(`${label} could not be structured.`);
  }
}
function parseStoryAnalysis(text, provider = "openai") {
  const parsed = parseJsonObject(text, "Story analysis");
  const list = (value) => Array.isArray(value) ? value : [];
  return {
    version: 2, status: "needs-review", confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.8)),
    story: { title: String(parsed.story?.title || ""), genre: String(parsed.story?.genre || ""), logline: String(parsed.story?.logline || ""), synopsis: String(parsed.story?.synopsis || ""), themes: list(parsed.story?.themes).map(String).slice(0, 12), tone: String(parsed.story?.tone || ""), emotionalArc: String(parsed.story?.emotionalArc || ""), worldRules: String(parsed.story?.worldRules || ""), timeline: String(parsed.story?.timeline || "") },
    scenes: list(parsed.scenes).slice(0, 200), characters: list(parsed.characters).slice(0, 100), locations: list(parsed.locations).slice(0, 100), props: list(parsed.props).slice(0, 200), sets: list(parsed.sets).slice(0, 100), performance: list(parsed.performance).slice(0, 200), camera: list(parsed.camera).slice(0, 200), lighting: list(parsed.lighting).slice(0, 200), audio: list(parsed.audio).slice(0, 200), effects: list(parsed.effects).slice(0, 200), continuity: list(parsed.continuity).slice(0, 200), warnings: list(parsed.warnings).map(String).slice(0, 20), generatedAt: new Date().toISOString(), provider
  };
}
const STORY_ANALYSIS_INSTRUCTIONS = "You are Storymaker's production parser. Analyze the supplied story source without inventing facts. Return JSON only. Preserve uncertainty with empty strings or warnings. Use this schema: {confidence:number,story:{title,genre,logline,synopsis,themes:string[],tone,emotionalArc,worldRules,timeline},scenes:[{id,sceneNumber,title,heading,location,interiorExterior,timeOfDay,objective,emotionalPurpose,storyBeat,beginning,middle,end,estimatedDurationSeconds,dialogue:[{character,text}],source}],characters:[{id,name,aliases,role,description,personality,goals,relationships,physicalDescription,emotionalProfile,importance}],locations:[{id,name,description}],props:[{id,name,category,importance}],sets:[{name,description}],performance:[{sceneId,character,objective,subtext,blocking,facialExpression,gesture,eyeLine}],camera:[{sceneId,shotSize,angle,lens,movement,composition,focus}],lighting:[{sceneId,key,fill,rim,practicals,colorTemperature,atmosphere,continuity}],audio:[{sceneId,dialogue,ambience,music,sfx}],effects:[{sceneId,description}],continuity:[{sceneId,description}],warnings:string[]}. Keep IDs stable within this response and cap scenes at 200.";
async function requestOpenAIStoryAnalysisImpl(source, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: STORY_ANALYSIS_INSTRUCTIONS, input: `Analyze this source material for production planning.\n\n${source.slice(0, 120000)}` }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable story analysis."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no story analysis.");
    try { return parseStoryAnalysis(output, "openai"); } catch { throw new Error("OpenAI returned story analysis that could not be structured. Please retry."); }
  } catch (error) { if (error?.name === "AbortError") throw new Error("AI story analysis took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
// OpenRouter speaks the standard chat/completions shape, not OpenAI's Responses
// API, so it needs its own request builder — but the same schema instructions
// and the same parser, since both just return JSON text.
async function requestOpenRouterCompletion(instructions, userContent, apiKey, timeoutMs) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "openai/gpt-4o", messages: [{ role: "system", content: instructions }, { role: "user", content: userContent }] }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenRouter", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenRouter returned an unreadable response."); }
    const text = result?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenRouter returned no text.");
    return text;
  } catch (error) { if (error?.name === "AbortError") throw new Error("OpenRouter took too long to respond. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
// Gemini is a first-class text fallback for the production-intelligence
// pipeline. It deliberately uses its own GenerateContent protocol rather
// than pretending Gemini is compatible with either Responses or OpenRouter.
async function requestGeminiCompletion(instructions, userContent, apiKey, timeoutMs = 90000) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${instructions}\n\n${userContent}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } })
    });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Gemini", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("Gemini returned an unreadable response."); }
    const text = (result?.candidates || []).flatMap((candidate) => candidate?.content?.parts || []).map((part) => part?.text || "").join("\n").trim();
    if (!text) throw new Error("Gemini returned no text.");
    return text;
  } catch (error) { if (error?.name === "AbortError") throw new Error("Gemini took too long to respond. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOpenRouterStoryAnalysis(source, apiKey) {
  const output = await requestOpenRouterCompletion(STORY_ANALYSIS_INSTRUCTIONS, `Analyze this source material for production planning.\n\n${source.slice(0, 120000)}`, apiKey, 120000);
  try { return parseStoryAnalysis(output, "openrouter"); } catch { throw new Error("OpenRouter returned story analysis that could not be structured. Please retry."); }
}
async function requestGeminiStoryAnalysis(source, apiKey) {
  const output = await requestGeminiCompletion(STORY_ANALYSIS_INSTRUCTIONS, `Analyze this source material for production planning.\n\n${source.slice(0, 12000)}`, apiKey, 60000);
  try { return parseStoryAnalysis(output, "google"); } catch { throw new Error("Gemini returned story analysis that could not be structured. Please retry."); }
}
async function requestOllamaStoryAnalysis(source) {
  const output = await requestOllamaCompletion(STORY_ANALYSIS_INSTRUCTIONS, `Analyze this source material for production planning.\n\n${source.slice(0, 60000)}`, 240000);
  try { return parseStoryAnalysis(output.text, "ollama"); } catch { throw new Error("The local model returned story analysis that could not be structured. Try a stronger Ollama model."); }
}
// OpenAI is preferred when both keys are saved, since Storymaker's prompts were
// tuned against gpt-5.1. OpenRouter exists so a project can run this feature
// on an OpenRouter-only key, without ever needing an OpenAI account.
async function requestOpenAIStoryAnalysis(payload) {
  const source = String(payload?.sourceText || "").trim(); if (!source) throw new Error("Import story text before running AI story analysis.");
  const openaiKey = getProviderKey("openai");
  const googleKey = getProviderKey("google");
  const openrouterKey = getProviderKey("openrouter");
  if (openaiKey) {
    try {
      const analysis = await requestOpenAIStoryAnalysisImpl(source, openaiKey);
      logGeneration("story.analysis.completed", { provider: "openai", sourceCharacters: source.length, sceneCount: analysis.scenes.length });
      return analysis;
    }
    catch (openaiError) {
      logGeneration("story.analysis.failed", { provider: "openai", sourceCharacters: source.length, error: openaiError?.message || "Story analysis failed." });
      if (googleKey) {
        try {
          const analysis = await requestGeminiStoryAnalysis(source, googleKey);
          logGeneration("story.analysis.completed", { provider: "google", sourceCharacters: source.length, sceneCount: analysis.scenes.length, fallbackFrom: "openai" });
          return analysis;
        } catch (googleError) {
          logGeneration("story.analysis.failed", { provider: "google", sourceCharacters: source.length, error: googleError?.message || "Story analysis failed.", fallbackFrom: "openai" });
          if (!openrouterKey) throw new Error(`AI story analysis failed. OpenAI: ${openaiError?.message || "request failed"}. Gemini: ${googleError?.message || "request failed"}.`);
        }
      }
      if (openrouterKey) {
        try {
          const analysis = await requestOpenRouterStoryAnalysis(source, openrouterKey);
          logGeneration("story.analysis.completed", { provider: "openrouter", sourceCharacters: source.length, sceneCount: analysis.scenes.length, fallbackFrom: "openai" });
          return analysis;
        } catch (openrouterError) {
          logGeneration("story.analysis.failed", { provider: "openrouter", sourceCharacters: source.length, error: openrouterError?.message || "Story analysis failed.", fallbackFrom: "openai" });
          throw new Error(`AI story analysis failed. OpenAI: ${openaiError?.message || "request failed"}. Gemini: ${googleKey ? "fallback did not complete" : "not connected"}. OpenRouter: ${openrouterError?.message || "request failed"}.`);
        }
      }
      throw openaiError;
    }
  }
  if (googleKey) {
    try {
      const analysis = await requestGeminiStoryAnalysis(source, googleKey);
      logGeneration("story.analysis.completed", { provider: "google", sourceCharacters: source.length, sceneCount: analysis.scenes.length });
      return analysis;
    } catch (error) {
      logGeneration("story.analysis.failed", { provider: "google", sourceCharacters: source.length, error: error?.message || "Story analysis failed." });
      if (!openrouterKey) throw error;
    }
  }
  if (openrouterKey) {
    try {
      const analysis = await requestOpenRouterStoryAnalysis(source, openrouterKey);
      logGeneration("story.analysis.completed", { provider: "openrouter", sourceCharacters: source.length, sceneCount: analysis.scenes.length });
      return analysis;
    } catch (error) {
      logGeneration("story.analysis.failed", { provider: "openrouter", sourceCharacters: source.length, error: error?.message || "Story analysis failed." });
      throw error;
    }
  }
  try {
    const analysis = await requestOllamaStoryAnalysis(source);
    logGeneration("story.analysis.completed", { provider: "ollama", sourceCharacters: source.length, sceneCount: analysis.scenes.length });
    return analysis;
  } catch (error) {
    logGeneration("story.analysis.failed", { provider: "ollama", sourceCharacters: source.length, error: error?.message || "Local story analysis failed." });
    throw new Error("Connect OpenAI, Google Gemini, or OpenRouter—or start Ollama with a local language model—before running AI story analysis.");
  }
}
const OCR_INSTRUCTIONS = "Transcribe every readable word in this image verbatim. Preserve scene headings, character names, dialogue, and action lines exactly as written, including line breaks. Do not summarize, correct, or invent text. If a word is illegible, write [illegible] in its place. Output only the transcribed text, nothing else.";
async function requestOpenAIImageOcrImpl(imagePath, mime, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const data = fs.readFileSync(imagePath).toString("base64");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-5.1", store: false, input: [{ role: "user", content: [{ type: "input_text", text: OCR_INSTRUCTIONS }, { type: "input_image", image_url: `data:${mime};base64,${data}` }] }] })
    });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable OCR response."); }
    const text = extractResponseText(result); if (!text) throw new Error("OpenAI could not read any text from this image.");
    return text;
  } catch (error) { if (error?.name === "AbortError") throw new Error("OCR took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOpenRouterImageOcr(imagePath, mime, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const data = fs.readFileSync(imagePath).toString("base64");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [{ role: "user", content: [{ type: "text", text: OCR_INSTRUCTIONS }, { type: "image_url", image_url: { url: `data:${mime};base64,${data}` } }] }] })
    });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenRouter", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenRouter returned an unreadable OCR response."); }
    const text = result?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenRouter could not read any text from this image.");
    return text;
  } catch (error) { if (error?.name === "AbortError") throw new Error("OCR took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
// Runs when a source has no extractable text: a standalone image today.
// Scanned PDFs with no text layer hit the same wall (pdftotext returns
// nothing) but rendering a PDF page to an image isn't wired up yet — the
// user is told to export that page as PNG/JPG and re-import it instead of
// getting a silent failure.
async function requestImageOcr(payload) {
  const filePath = String(payload?.filePath || "");
  if (!filePath || !fs.existsSync(filePath)) throw new Error("This source file is no longer on disk. Re-import it before running OCR.");
  const info = fs.statSync(filePath);
  if (info.size > 20 * 1024 * 1024) throw new Error("Choose a source image smaller than 20 MB for OCR.");
  const mime = imageMimeType(filePath);
  if (!mime) {
    if (path.extname(filePath).toLowerCase() === ".pdf") throw new Error("This scanned PDF has no text layer. Export its first page as a PNG or JPG and import that instead.");
    throw new Error("OCR only supports image files (PNG, JPG, WEBP, GIF, BMP, TIFF) right now.");
  }
  const openaiKey = getProviderKey("openai");
  const openrouterKey = getProviderKey("openrouter");
  if (!openaiKey && !openrouterKey) throw new Error("Connect an OpenAI or OpenRouter key in Model Hub before running OCR.");
  const text = openaiKey ? await requestOpenAIImageOcrImpl(filePath, mime, openaiKey) : await requestOpenRouterImageOcr(filePath, mime, openrouterKey);
  return { text, analysis: parseStoryStructure(text) };
}
// Deliberately scoped to fields that exist on a live project record — logline,
// premise, and each scene's objective note — rather than every field the raw
// story-analysis schema can produce. Each suggestion names its own scope and
// current text so the renderer can show a real before/after and apply an
// accepted one to the exact field it came from.
const SCRIPT_IMPROVEMENT_INSTRUCTIONS = "You are Storymaker's script doctor. Read the supplied production context — logline, premise, and each scene's objective — and propose concrete rewrites that make the story clearer, better paced, or higher stakes. Do not invent facts not implied by the material. Only propose a change where the rewrite is a genuine improvement, not a rephrase for its own sake. The context includes a lockedScopes array — the author has explicitly locked these (\"logline\" and/or \"premise\") and protected them from revision; never propose a suggestion whose scope is in that list. Return JSON only with this exact shape: {suggestions:[{id:string,category:\"pacing\"|\"stakes\"|\"clarity\"|\"structure\"|\"dialogue\",scope:\"logline\"|\"premise\"|\"scene\",sceneTitle:string,title:string,rationale:string,expectedBenefit:string,productionConsequence:string,currentText:string,suggestedText:string}]}. rationale explains why the current text is a weakness. expectedBenefit names the concrete narrative payoff of the rewrite (e.g. \"raises the stakes of the midpoint reversal\"). productionConsequence names what changes downstream in production if this is accepted (e.g. \"the location list gains one new interior\", \"no downstream impact\" if genuinely none). sceneTitle is required and must exactly match one of the supplied scene titles when scope is \"scene\", and should be empty string otherwise. Propose at most 8 suggestions, ranked most impactful first.";
function scriptImprovementContext(project) {
  return {
    title: project?.name || "Untitled Film",
    logline: project?.logline || "",
    premise: project?.premise || "",
    themes: project?.themes || [],
    scenes: (project?.scenes || []).map((scene) => ({ title: scene?.title || "", note: scene?.note || "" })),
    lockedScopes: Array.isArray(project?.lockedFields) ? project.lockedFields : []
  };
}
function parseScriptImprovements(text) {
  const parsed = parseJsonObject(text, "Script improvement response");
  const list = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  return list.slice(0, 8).map((item, index) => ({
    id: String(item.id || `suggestion-${Date.now()}-${index}`),
    category: ["pacing", "stakes", "clarity", "structure", "dialogue"].includes(item.category) ? item.category : "clarity",
    scope: ["logline", "premise", "scene"].includes(item.scope) ? item.scope : "scene",
    sceneTitle: String(item.sceneTitle || ""),
    title: String(item.title || "Suggested improvement"),
    rationale: String(item.rationale || ""),
    expectedBenefit: String(item.expectedBenefit || ""),
    productionConsequence: String(item.productionConsequence || "No downstream production impact noted."),
    currentText: String(item.currentText || ""),
    suggestedText: String(item.suggestedText || ""),
    status: "pending"
  })).filter((item) => item.suggestedText);
}
async function requestOpenAIScriptImprovementsImpl(project, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: SCRIPT_IMPROVEMENT_INSTRUCTIONS, input: `Review this production context and propose script improvements:\n${JSON.stringify(scriptImprovementContext(project))}` }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no script improvements.");
    try { return parseScriptImprovements(output); } catch { throw new Error("OpenAI returned suggestions that could not be structured. Please retry."); }
  } catch (error) { if (error?.name === "AbortError") throw new Error("Script improvement review took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOpenRouterScriptImprovements(project, apiKey) {
  const output = await requestOpenRouterCompletion(SCRIPT_IMPROVEMENT_INSTRUCTIONS, `Review this production context and propose script improvements:\n${JSON.stringify(scriptImprovementContext(project))}`, apiKey, 120000);
  try { return parseScriptImprovements(output); } catch { throw new Error("OpenRouter returned suggestions that could not be structured. Please retry."); }
}
async function requestGeminiScriptImprovements(project, apiKey) {
  const output = await requestGeminiCompletion(SCRIPT_IMPROVEMENT_INSTRUCTIONS, `Review this production context and propose script improvements:\n${JSON.stringify(scriptImprovementContext(project))}`, apiKey, 90000);
  try { return parseScriptImprovements(output); } catch { throw new Error("Gemini returned suggestions that could not be structured. Please retry."); }
}
async function requestOllamaScriptImprovements(project) {
  const output = await requestOllamaCompletion(SCRIPT_IMPROVEMENT_INSTRUCTIONS, `Review this production context and propose script improvements:\n${JSON.stringify(scriptImprovementContext(project))}`, 180000);
  try { return parseScriptImprovements(output.text); } catch { throw new Error("The local model returned suggestions that could not be structured. Try a stronger Ollama model."); }
}
async function requestScriptImprovements(project) {
  if (!String(project?.logline || "").trim() && !(project?.scenes || []).some((scene) => scene?.note)) throw new Error("Add a logline or scene objectives before requesting script improvements.");
  const openaiKey = getProviderKey("openai");
  const googleKey = getProviderKey("google");
  const openrouterKey = getProviderKey("openrouter");
  let suggestions; let lastError;
  if (googleKey) try { suggestions = await requestGeminiScriptImprovements(project, googleKey); } catch (error) { lastError = error; logGeneration("story.improvements.failed", { provider: "google", error: error?.message || "Request failed." }); }
  if (!suggestions && openaiKey) try { suggestions = await requestOpenAIScriptImprovementsImpl(project, openaiKey); } catch (error) { lastError = error; logGeneration("story.improvements.failed", { provider: "openai", error: error?.message || "Request failed." }); }
  if (!suggestions && openrouterKey) try { suggestions = await requestOpenRouterScriptImprovements(project, openrouterKey); } catch (error) { lastError = error; logGeneration("story.improvements.failed", { provider: "openrouter", error: error?.message || "Request failed." }); }
  if (!suggestions) try { suggestions = await requestOllamaScriptImprovements(project); } catch (error) { lastError = error; logGeneration("story.improvements.failed", { provider: "ollama", error: error?.message || "Local request failed." }); }
  if (!suggestions) throw lastError || new Error("No story-improvement provider completed the request.");
  logGeneration("story.improvements.completed", { provider: openaiKey && suggestions ? "openai-or-fallback" : "fallback", count: suggestions.length });
  // The prompt already tells the model not to touch locked scopes, but a
  // model can ignore instructions — this is the enforcement that actually
  // holds regardless of what comes back.
  const locked = new Set(Array.isArray(project?.lockedFields) ? project.lockedFields : []);
  return locked.size ? suggestions.filter((item) => !locked.has(item.scope)) : suggestions;
}

// ---------------------------------------------------------------------------
// AI Director for music videos (Phase 6).
//
// One LLM call for the WHOLE song so it can reason about the arc and make the
// choruses rhyme visually. Input is the Song Brain map (sections, BPM, energy)
// + each section's distributed lyric lines + an optional treatment + the
// chosen "feeling" + the cast. Output is a per-section shootable treatment
// keyed by sectionId (exact mapping, never by index). Same 4-tier provider
// fallback as every other LLM feature; runs on local Ollama with no key.
// Offered, never automatic — the template briefs stand until the user asks.
// The prompt + context builder + parser live in src/music-video-director.mjs
// so the smoke can exercise them in plain Node.
const { MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, musicVideoDirectionContext, parseMusicVideoDirection } = require("./src/music-video-director.mjs");
const { formatTime } = require("./src/song-brain.mjs");
async function requestOpenAICompletion(instructions, userContent, apiKey, timeoutMs = 120000) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions, input: userContent }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no content.");
    return output;
  } catch (error) { if (error?.name === "AbortError") throw new Error("OpenAI took too long to respond. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestMusicVideoDirection(payload) {
  // Filter out blank/duplicate ids here, not just check the array is
  // non-empty — parseMusicVideoDirection keys its acceptance Set by these
  // ids, and a project whose sections lack real ids (malformed or from
  // before ids were added) would otherwise degenerate that Set to one
  // entry, silently accepting a response for none of the real sections
  // instead of throwing — a much harder failure to diagnose than a clear
  // upfront error.
  const sectionIds = [...new Set((Array.isArray(payload?.sections) ? payload.sections : []).map((s) => String(s.id || "")).filter(Boolean))];
  if (!sectionIds.length) throw new Error("Analyze a song before directing it with AI.");
  const userContent = `Direct a music video for this song:\n${musicVideoDirectionContext(payload)}`;
  const googleKey = getProviderKey("google");
  const openaiKey = getProviderKey("openai");
  const openrouterKey = getProviderKey("openrouter");
  const attempts = [
    googleKey && ["google", () => requestGeminiCompletion(MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, userContent, googleKey, 90000)],
    openaiKey && ["openai", () => requestOpenAICompletion(MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, userContent, openaiKey, 120000)],
    openrouterKey && ["openrouter", () => requestOpenRouterCompletion(MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, userContent, openrouterKey, 120000)],
    ["ollama", async () => (await requestOllamaCompletion(MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, userContent, 240000)).text]
  ].filter(Boolean);
  let lastError;
  for (const [provider, run] of attempts) {
    try {
      const parsed = parseMusicVideoDirection(await run(), sectionIds);
      logGeneration("music-video.direction.completed", { provider, sections: parsed.sections.length });
      return { ...parsed, provider };
    } catch (error) {
      lastError = error;
      logGeneration("music-video.direction.failed", { provider, error: error?.message || "request failed" });
    }
  }
  throw new Error(lastError?.message?.includes("Ollama is not ready")
    ? "No AI model is available. Connect OpenAI, Gemini, or OpenRouter in Model Hub, or run Ollama locally with a language model."
    : (lastError?.message || "The AI director could not complete."));
}

// Per spec: never promise to imitate a living filmmaker or reproduce a
// protected creative identity. A user may mention a director, film, or era
// conversationally — this translates that into broad, descriptive,
// reusable creative attributes instead of a "do it like <name>" mode.
const CREATIVE_INFLUENCE_INSTRUCTIONS = "A filmmaker has described a creative reference for their production — a director's name, a specific film, an era, or a mood. Translate that reference into a reusable, descriptive creative-influence package. Never promise to imitate a specific living filmmaker or reproduce their protected creative identity, and never claim the output IS that filmmaker's style — describe the underlying craft attributes instead, the way a film-school analysis would. Return JSON only with this exact shape: {category:string, traits:string[], note:string}. category is a short descriptive label for the overall creative territory (for example \"Large-Scale Cerebral Thriller\", \"Monumental Atmospheric Science Fiction\", \"Character-Driven Cultural Drama\", \"Kinetic Animated Adventure\" — invent a fitting label, do not just reuse these examples). traits is 5 to 8 short phrases covering structure, visual approach, pacing, camera, lighting, or sound as relevant (for example \"nonlinear structure\", \"restrained exposition\", \"architectural composition\"). note is one sentence reminding the user this is a set of craft attributes inspired by the reference, not a reproduction of anyone's work.";
function creativeInfluencePrompt(referenceText) {
  return `Translate this creative reference into a creative-influence package:\n${String(referenceText || "").slice(0, 2000)}`;
}
function parseCreativeInfluence(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  const traits = Array.isArray(parsed.traits) ? parsed.traits.slice(0, 8).map(String).filter(Boolean) : [];
  if (!traits.length) throw new Error("No usable creative traits were returned.");
  return {
    category: String(parsed.category || "Creative direction"),
    traits,
    note: String(parsed.note || "These are craft attributes inspired by the reference, not a reproduction of anyone's work."),
    generatedAt: new Date().toISOString()
  };
}
async function requestOpenAICreativeInfluence(referenceText, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: CREATIVE_INFLUENCE_INSTRUCTIONS, input: creativeInfluencePrompt(referenceText) }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no creative-influence translation.");
    try { return parseCreativeInfluence(output); } catch { throw new Error("OpenAI returned a response that could not be structured. Please retry."); }
  } catch (error) { if (error?.name === "AbortError") throw new Error("Creative-influence translation took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOpenRouterCreativeInfluence(referenceText, apiKey) {
  const output = await requestOpenRouterCompletion(CREATIVE_INFLUENCE_INSTRUCTIONS, creativeInfluencePrompt(referenceText), apiKey, 60000);
  try { return parseCreativeInfluence(output); } catch { throw new Error("OpenRouter returned a response that could not be structured. Please retry."); }
}
async function requestOllamaCreativeInfluence(referenceText) {
  const output = await requestOllamaCompletion(CREATIVE_INFLUENCE_INSTRUCTIONS, creativeInfluencePrompt(referenceText), 60000);
  try { return parseCreativeInfluence(output.text); } catch { throw new Error("The local model returned a response that could not be structured. Try a stronger Ollama model."); }
}
async function requestCreativeInfluence(payload) {
  const referenceText = String(payload?.referenceText || "").trim();
  if (!referenceText) throw new Error("Describe a film, director, era, or mood before translating a creative influence.");
  const openaiKey = getProviderKey("openai");
  const openrouterKey = getProviderKey("openrouter");
  if (openaiKey) return requestOpenAICreativeInfluence(referenceText, openaiKey);
  if (openrouterKey) return requestOpenRouterCreativeInfluence(referenceText, openrouterKey);
  // Built after the cloud-only paths above and never wired to Ollama, even
  // though a working local-model adapter already existed for this exact
  // request shape — Ollama showing "ready" in Model Hub didn't mean every
  // AI feature could actually reach it.
  try { return await requestOllamaCreativeInfluence(referenceText); }
  catch { throw new Error("Connect an OpenAI or OpenRouter key, or start Ollama with a local language model, before translating a creative influence."); }
}
// Per Style Library spec section 4: recommend styles based on the imported
// story instead of making the user browse the whole library blind. No
// fabricated "consistency score" or "difficulty" metric — there's no real
// data behind those, so this only ever returns a name the model picked from
// the supplied list plus a one-sentence reason, both enforced server-side.
const STYLE_RECOMMENDATION_INSTRUCTIONS = "You are Storymaker's visual-language advisor. Given this production's story context and a list of available visual-style presets (name and tone only), recommend 2 to 4 presets that best fit this specific story. Return JSON only with this exact shape: {recommendations:[{name:string,reason:string}]}. name must exactly match one of the supplied preset names — never invent a preset that was not in the list. reason is one concise sentence explaining why that preset fits this story's tone or genre. Rank most fitting first.";
function parseStyleRecommendations(text, availableNames) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  const validNames = new Set(availableNames);
  const list = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  // Hard filter: a recommendation naming a preset that doesn't exist in the
  // library is dropped rather than shown, regardless of what the model
  // returned — the UI has nothing to attach it to and a fabricated preset
  // name would silently fail to highlight anything.
  const filtered = list.filter((item) => validNames.has(String(item?.name || ""))).slice(0, 4).map((item) => ({ name: String(item.name), reason: String(item.reason || "").trim() }));
  if (!filtered.length) throw new Error("No recommendations matched an available preset.");
  return filtered;
}
function styleRecommendationPrompt(project, availableStyles) {
  const context = { title: project?.name || "Untitled Film", logline: project?.logline || "", premise: project?.premise || "", genre: project?.ingestion?.analysis?.story?.genre || "", themes: project?.themes || [] };
  return `Recommend visual-style presets for this story:\n${JSON.stringify(context)}\n\nAvailable presets:\n${JSON.stringify(availableStyles)}`;
}
async function requestOpenAIStyleRecommendations(project, availableStyles, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: STYLE_RECOMMENDATION_INSTRUCTIONS, input: styleRecommendationPrompt(project, availableStyles) }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no style recommendations.");
    try { return parseStyleRecommendations(output, availableStyles.map((style) => style.name)); } catch { throw new Error("OpenAI returned a response that could not be structured. Please retry."); }
  } catch (error) { if (error?.name === "AbortError") throw new Error("Style recommendation took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOpenRouterStyleRecommendations(project, availableStyles, apiKey) {
  const output = await requestOpenRouterCompletion(STYLE_RECOMMENDATION_INSTRUCTIONS, styleRecommendationPrompt(project, availableStyles), apiKey, 60000);
  try { return parseStyleRecommendations(output, availableStyles.map((style) => style.name)); } catch { throw new Error("OpenRouter returned a response that could not be structured. Please retry."); }
}
async function requestOllamaStyleRecommendations(project, availableStyles) {
  const output = await requestOllamaCompletion(STYLE_RECOMMENDATION_INSTRUCTIONS, styleRecommendationPrompt(project, availableStyles), 60000);
  try { return parseStyleRecommendations(output.text, availableStyles.map((style) => style.name)); } catch { throw new Error("The local model returned a response that could not be structured. Try a stronger Ollama model."); }
}
async function requestGeminiStyleRecommendations(project, availableStyles, apiKey) {
  const output = await requestGeminiCompletion(STYLE_RECOMMENDATION_INSTRUCTIONS, styleRecommendationPrompt(project, availableStyles), apiKey, 45000);
  try { return parseStyleRecommendations(output, availableStyles.map((style) => style.name)); } catch { throw new Error("Gemini returned style recommendations that could not be structured. Please retry."); }
}
async function requestStyleRecommendations(payload) {
  const project = payload?.project || {};
  const availableStyles = Array.isArray(payload?.availableStyles) ? payload.availableStyles.filter((style) => style?.name).map((style) => ({ name: String(style.name), tone: String(style.tone || "") })) : [];
  if (!availableStyles.length) throw new Error("No style presets are available to recommend from.");
  if (!String(project?.logline || "").trim() && !String(project?.premise || "").trim() && !(project?.themes || []).length) throw new Error("Add a logline, premise, or theme before requesting style recommendations.");
  const openaiKey = getProviderKey("openai");
  const googleKey = getProviderKey("google");
  const openrouterKey = getProviderKey("openrouter");
  let lastError;
  if (googleKey) try { return await requestGeminiStyleRecommendations(project, availableStyles, googleKey); } catch (error) { lastError = error; logGeneration("story.styles.failed", { provider: "google", error: error?.message || "Request failed." }); }
  if (openaiKey) try { return await requestOpenAIStyleRecommendations(project, availableStyles, openaiKey); } catch (error) { lastError = error; logGeneration("story.styles.failed", { provider: "openai", error: error?.message || "Request failed." }); }
  if (openrouterKey) try { return await requestOpenRouterStyleRecommendations(project, availableStyles, openrouterKey); } catch (error) { lastError = error; logGeneration("story.styles.failed", { provider: "openrouter", error: error?.message || "Request failed." }); }
  // Same gap as creative influence and shot planning: never wired to
  // Ollama despite a working local adapter existing for this exact shape.
  try { return await requestOllamaStyleRecommendations(project, availableStyles); } catch (error) { lastError = error; logGeneration("story.styles.failed", { provider: "ollama", error: error?.message || "Local request failed." }); }
  throw lastError || new Error("Connect an OpenAI, Google Gemini, or OpenRouter key, or start Ollama with a local language model, before requesting style recommendations.");
}
const STYLE_DNA_CREATION_INSTRUCTIONS = "You are Storymaker's Visual Direction Engine. Convert the creator's brief into an original, production-ready visual style. Do not imitate living artists or studios. Return JSON only: {name,description,categoryIds,tags,creativeIntent:{summary,emotionalTone,narrativeUseCases},medium:{primary,secondary,handcrafted,practical,digital},visualLanguage:{shapeLanguage,lineQuality,silhouetteApproach,levelOfRealism,levelOfStylization,detailDensity,visualComplexity,negativeSpace},materials:{primaryMaterials,secondaryMaterials,surfaceProperties,imperfections},color:{paletteName,primaryColors,secondaryColors,accentColors,backgroundColors,saturation,contrast,temperature,harmony,restrictions},lighting:{approach,keyDirection,softness,contrast,atmosphere,shadowBehavior,practicalLights},composition:{principles,framing,subjectScale,negativeSpaceGuidance,depthStrategy,visualHierarchy},camera:{shotLanguage,lenses,depthOfField,cameraHeight,cameraMovement,stabilization,forbiddenMovements},characters:{anatomy,proportions,facialDesign,eyes,hair,wardrobe,texture,actingStyle,microAnimation,identityConsistencyRules},environments:{architecture,terrain,atmosphericPerspective,worldDensity,setDressingRules},props:{designLanguage,materialRules,scaleRules},animation:{technique,frameFeeling,motionQuality,physics,secondaryMotion,transitionRules,forbiddenMotion},effects:{allowed,restrained,forbidden},promptBlocks:{universal,image,video,negative,character,environment,prop,storyboard},continuityRules,forbiddenElements}. Keep strings concise, arrays bounded, and preserve the creator's stated restrictions.";
function parseStyleDnaDraft(text) {
  const parsed = parseJsonObject(text, "Visual Style response");
  if (!parsed || typeof parsed !== "object" || !String(parsed.name || "").trim()) throw new Error("The AI response did not contain a usable style name.");
  return parsed;
}
function styleDnaCreatorPrompt(payload) {
  const input = { name: String(payload?.name || "").slice(0, 140), description: String(payload?.description || "").slice(0, 9000), genre: String(payload?.genre || "").slice(0, 300), audience: String(payload?.audience || "").slice(0, 300), realism: String(payload?.realism || ""), format: String(payload?.format || ""), referenceRoles: Array.isArray(payload?.references) ? payload.references.map((reference) => ({ role: reference?.role, extract: String(reference?.extract || "").slice(0, 300), ignore: String(reference?.ignore || "").slice(0, 300) })).slice(0, 10) : [] };
  if (!input.description) throw new Error("Describe the visual direction before asking AI to interpret it.");
  return `Create Style DNA from this creator brief:\n${JSON.stringify(input)}`;
}
async function requestStyleDna(payload) {
  const prompt = styleDnaCreatorPrompt(payload); const openaiKey = getProviderKey("openai"); const googleKey = getProviderKey("google"); const openrouterKey = getProviderKey("openrouter");
  let lastError;
  if (googleKey) try { return parseStyleDnaDraft(await requestGeminiCompletion(STYLE_DNA_CREATION_INSTRUCTIONS, prompt, googleKey, 90000)); } catch (error) { lastError = error; logGeneration("style.interpret.failed", { provider: "google", error: error?.message || "Request failed." }); }
  if (openaiKey) try {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 90000);
    try { const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: STYLE_DNA_CREATION_INSTRUCTIONS, input: prompt }) }); const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw)); const output = extractResponseText(JSON.parse(raw)); return parseStyleDnaDraft(output); } finally { clearTimeout(timeout); }
  } catch (error) { lastError = error; logGeneration("style.interpret.failed", { provider: "openai", error: error?.message || "Request failed." }); }
  if (openrouterKey) try { return parseStyleDnaDraft(await requestOpenRouterCompletion(STYLE_DNA_CREATION_INSTRUCTIONS, prompt, openrouterKey, 90000)); } catch (error) { lastError = error; logGeneration("style.interpret.failed", { provider: "openrouter", error: error?.message || "Request failed." }); }
  // Same gap as creative influence, shot planning, and style recommendations
  // used to have: never wired to Ollama despite a working local adapter
  // existing for this exact shape. Tried last since a local model is more
  // likely to under-perform this structured a task than a frontier one.
  try { return parseStyleDnaDraft((await requestOllamaCompletion(STYLE_DNA_CREATION_INSTRUCTIONS, prompt, 180000)).text); } catch (error) { lastError = error; logGeneration("style.interpret.failed", { provider: "ollama", error: error?.message || "Local request failed." }); }
  throw lastError || new Error("Connect OpenAI, Google Gemini, or OpenRouter in Model Hub, or start Ollama with a local language model, before creating a style with AI.");
}
// Per the Advanced Import Workflow spec's "Automated Storyboard Generation":
// a single action that fully populates camera, lighting, performance,
// motion, audio, effects, and continuity for every shot across the whole
// board — today each imported scene only ever gets one locally-parsed
// "starter" shot, never a real shot breakdown (wide/medium/close-up etc).
const SHOT_PLAN_INSTRUCTIONS = "You are Storymaker's shot planner — and, for the performance field specifically, its acting coach. Given a list of scenes (title, story objective, and whatever camera/lighting/performance notes were already detected), break each scene into 2 to 4 concrete shots that would actually cover it in production — for example an establishing wide, a medium two-shot, and a close-up on the emotional beat, only when the scene supports that many distinct camera setups. A short single-beat scene may need only one shot; do not pad. Return JSON only with this exact shape: {scenes:[{sceneId:string,shots:[{title:string,framing:string,lens:string,movement:string,purpose:string,camera:string,lighting:string,performance:string,blocking:string,motion:string,audio:string,effects:string,continuity:string}]}]}. sceneId must exactly match one of the supplied scene ids. Every shot field should be a concrete, usable production instruction — never a placeholder like \"TBD\" or \"as appropriate\". performance is real acting direction, not a mood label: name the specific facial expression and physical tension (jaw, hands, posture, breath), what the character is actively concealing versus what leaks through despite them, and where the emotional truth of the shot sits on an arc from the start of the beat to its end — \"guarded, arms crossed, tight smile that doesn't reach her eyes; the smile breaks by the end of the line\" rather than \"she is upset.\" Ground every performance note in what the scene material actually supports — do not invent a character's inner life beyond what the story implies. Action-scene shots (a fight, a chase, an explosion) still get a real performance note — fear, exhilaration, grim resolve, whatever the character is actually feeling under the physical event, not just the choreography. Do not invent plot events, characters, or dialogue not implied by the supplied scene material.";
function shotPlanContext(project) {
  return {
    title: project?.name || "Untitled Film",
    style: project?.style || "",
    scenes: (project?.scenes || []).slice(0, 40).map((scene) => ({
      id: scene?.id || "",
      title: scene?.title || "",
      objective: scene?.note || "",
      existingNotes: (scene?.shots || []).map((shot) => shot?.blueprint?.narrative || shot?.purpose).filter(Boolean).join(" ")
    })).filter((scene) => scene.id)
  };
}
function parseShotPlan(text, validSceneIds) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  const validIds = new Set(validSceneIds);
  const list = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  // Same hard-filter principle as the style recommender: a scene id the
  // model invented has nothing in this project to attach to, so it's
  // dropped rather than silently creating an orphaned entry.
  const result = list.filter((entry) => validIds.has(String(entry?.sceneId || ""))).map((entry) => ({
    sceneId: String(entry.sceneId),
    shots: (Array.isArray(entry.shots) ? entry.shots : []).slice(0, 4).map((shot) => ({
      title: String(shot?.title || "Shot"),
      framing: String(shot?.framing || "Medium shot"),
      lens: String(shot?.lens || "35mm"),
      movement: String(shot?.movement || "Static"),
      purpose: String(shot?.purpose || ""),
      camera: String(shot?.camera || ""),
      lighting: String(shot?.lighting || ""),
      performance: String(shot?.performance || ""),
      blocking: String(shot?.blocking || ""),
      motion: String(shot?.motion || ""),
      audio: String(shot?.audio || ""),
      effects: String(shot?.effects || ""),
      continuity: String(shot?.continuity || "")
    })).filter((shot) => shot.purpose || shot.camera || shot.lighting)
  })).filter((entry) => entry.shots.length);
  if (!result.length) throw new Error("No usable shot plan was returned.");
  return result;
}
async function requestOpenAIShotPlan(project, apiKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const context = shotPlanContext(project);
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-5.1", store: false, instructions: SHOT_PLAN_INSTRUCTIONS, input: `Plan shots for these scenes:\n${JSON.stringify(context)}` }) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }
    const output = extractResponseText(result); if (!output) throw new Error("OpenAI returned no shot plan.");
    try { return parseShotPlan(output, context.scenes.map((scene) => scene.id)); } catch { throw new Error("OpenAI returned a shot plan that could not be structured. Please retry."); }
  } catch (error) { if (error?.name === "AbortError") throw new Error("Shot planning took too long. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestOllamaShotPlan(project) {
  const context = shotPlanContext(project);
  const output = await requestOllamaCompletion(SHOT_PLAN_INSTRUCTIONS, `Plan shots for these scenes:\n${JSON.stringify(context)}`, 180000);
  try { return parseShotPlan(output.text, context.scenes.map((scene) => scene.id)); } catch { throw new Error("The local model returned a shot plan that could not be structured. Try a stronger Ollama model."); }
}
async function requestOpenRouterShotPlan(project, apiKey) {
  const context = shotPlanContext(project);
  const output = await requestOpenRouterCompletion(SHOT_PLAN_INSTRUCTIONS, `Plan shots for these scenes:\n${JSON.stringify(context)}`, apiKey, 120000);
  try { return parseShotPlan(output, context.scenes.map((scene) => scene.id)); } catch { throw new Error("OpenRouter returned a shot plan that could not be structured. Please retry."); }
}
async function requestGeminiShotPlan(project, apiKey) {
  const context = shotPlanContext(project);
  const output = await requestGeminiCompletion(SHOT_PLAN_INSTRUCTIONS, `Plan shots for these scenes:\n${JSON.stringify(context)}`, apiKey, 90000);
  try { return parseShotPlan(output, context.scenes.map((scene) => scene.id)); } catch { throw new Error("Gemini returned a shot plan that could not be structured. Please retry."); }
}
async function requestShotPlan(payload) {
  const project = payload?.project || {};
  if (!(project?.scenes || []).length) throw new Error("Add at least one scene before planning shots.");
  const openaiKey = getProviderKey("openai");
  const googleKey = getProviderKey("google");
  const openrouterKey = getProviderKey("openrouter");
  let lastError;
  if (googleKey) try { return await requestGeminiShotPlan(project, googleKey); } catch (error) { lastError = error; logGeneration("story.shot-plan.failed", { provider: "google", error: error?.message || "Request failed." }); }
  if (openaiKey) try { return await requestOpenAIShotPlan(project, openaiKey); } catch (error) { lastError = error; logGeneration("story.shot-plan.failed", { provider: "openai", error: error?.message || "Request failed." }); }
  if (openrouterKey) try { return await requestOpenRouterShotPlan(project, openrouterKey); } catch (error) { lastError = error; logGeneration("story.shot-plan.failed", { provider: "openrouter", error: error?.message || "Request failed." }); }
  try { return await requestOllamaShotPlan(project); } catch (error) { lastError = error; logGeneration("story.shot-plan.failed", { provider: "ollama", error: error?.message || "Local request failed." }); }
  throw lastError || new Error("Connect an OpenAI, Google Gemini, or OpenRouter key, or start Ollama with a local language model, before planning shots.");
}
const DIRECTOR_REVIEW_INSTRUCTIONS = "You are Storymaker's AI Director. Give cinematic, specific, practical story-direction notes. Do not invent project facts. Return JSON only with this exact shape: {summary:string, decisions:[{signal:string,title:string,rationale:string,target:string}], suggestedThemes:string[], recommendedStructure:{name:string,rationale:string}}. Provide at most five decisions. Targets must be Story Bible, Character Bible, Design Bible, or Storyboard. recommendedStructure names one narrative structure this specific material would benefit from — for example Three-Act Structure, Five-Act Structure, Hero's Journey, Character Transformation Arc, Save-the-Cat Beat Progression, Mystery Reveal Structure, Tragedy Structure, Circular Narrative, Parallel Narrative, Nonlinear Structure, Documentary Inquiry Structure, Commercial Problem-Solution Structure, or Music-Video Emotional Progression — chosen for what this material actually needs, not a default. rationale explains why that structure specifically strengthens this material; do not recommend a structure the material already clearly follows well.";
function directorReviewContext(project) {
  return {
    title: project?.name || "Untitled Film", logline: project?.logline || "", premise: project?.premise || "", world: project?.world || "", worldRules: project?.rules || "", relationships: project?.relationships || "", themes: project?.themes || [], visualLanguage: project?.style || "", locations: (project?.locations || []).map((location) => ({ name: location?.name || "", description: location?.description || "" })), characters: (project?.characters || []).map((character) => ({ name: character?.name || "", role: character?.role || "" })), scenes: (project?.scenes || []).map((scene) => ({ title: scene?.title || "", note: scene?.note || "" }))
  };
}
async function requestOpenAIDirectorReviewImpl(project, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5.1",
        store: false,
        instructions: DIRECTOR_REVIEW_INSTRUCTIONS,
        input: `Review this production context and identify the next highest-leverage creative decisions:\n${JSON.stringify(directorReviewContext(project))}`
      })
    });
    const raw = await response.text();
    if (!response.ok) { const detail = raw.slice(0, 500); if (response.status === 401) throw new Error("OpenAI rejected this key. Reconnect it in Model Hub."); if (response.status === 429) throw new Error("OpenAI is rate-limiting this request. Try again shortly."); throw new Error(`OpenAI request failed (${response.status}): ${detail}`); }
    let payload;
    try { payload = JSON.parse(raw); }
    catch { throw new Error("OpenAI returned an unreadable response. Please try again."); }
    const output = extractResponseText(payload);
    if (!output) throw new Error("OpenAI returned no director text.");
    try { return parseDirectorReview(output, "openai"); }
    catch { throw new Error("OpenAI returned a director review that could not be structured. Please try again."); }
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The live Director review took too long. Please try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}
async function requestOpenRouterDirectorReview(project, apiKey) {
  const output = await requestOpenRouterCompletion(DIRECTOR_REVIEW_INSTRUCTIONS, `Review this production context and identify the next highest-leverage creative decisions:\n${JSON.stringify(directorReviewContext(project))}`, apiKey, 60000);
  try { return parseDirectorReview(output, "openrouter"); }
  catch { throw new Error("OpenRouter returned a director review that could not be structured. Please try again."); }
}
async function requestGeminiDirectorReview(project, apiKey) {
  const output = await requestGeminiCompletion(DIRECTOR_REVIEW_INSTRUCTIONS, `Review this production context and identify the next highest-leverage creative decisions:\n${JSON.stringify(directorReviewContext(project))}`, apiKey, 60000);
  try { return parseDirectorReview(output, "google"); }
  catch { throw new Error("Gemini returned a director review that could not be structured. Please try again."); }
}
async function requestOllamaDirectorReview(project) {
  const output = await requestOllamaCompletion(DIRECTOR_REVIEW_INSTRUCTIONS, `Review this production context and identify the next highest-leverage creative decisions:\n${JSON.stringify(directorReviewContext(project))}`, 180000);
  try { return parseDirectorReview(output.text, "ollama"); }
  catch { throw new Error("The local model returned a director review that could not be structured. Try a stronger Ollama model."); }
}
async function requestOpenAIDirectorReview(project) {
  const openaiKey = getProviderKey("openai");
  const googleKey = getProviderKey("google");
  if (googleKey) try { return await requestGeminiDirectorReview(project, googleKey); } catch (error) { logGeneration("story.director-review.failed", { provider: "google", error: error?.message || "Request failed." }); }
  if (openaiKey) try { return await requestOpenAIDirectorReviewImpl(project, openaiKey); } catch (error) { logGeneration("story.director-review.failed", { provider: "openai", error: error?.message || "Request failed." }); }
  const openrouterKey = getProviderKey("openrouter"); if (openrouterKey) return requestOpenRouterDirectorReview(project, openrouterKey);
  return requestOllamaDirectorReview(project);
}
function imageMimeType(file) {
  const ext = path.extname(String(file || "")).toLowerCase();
  return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" })[ext] || "";
}
function mediaMimeType(file) {
  const image = imageMimeType(file); if (image) return image;
  const ext = path.extname(String(file || "")).toLowerCase();
  return ({ ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".m4v": "video/x-m4v", ".avi": "video/x-msvideo", ".mkv": "video/x-matroska", ".flv": "video/x-flv", ".wmv": "video/x-ms-wmv", ".mpeg": "video/mpeg", ".mpg": "video/mpeg", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac", ".aiff": "audio/aiff", ".aif": "audio/aiff", ".wma": "audio/x-ms-wma" })[ext] || "";
}
function compact(value, limit = 1800) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
// Mirrors the Style Library's DNA in src/storymaker.js by preset name. The
// renderer only ever sends the bare preset name in project.style; without
// this table every generation received nothing more than "Visual language:
// Cyberpunk." with no actual craft guidance for the model to act on.
const STYLE_DNA = {
  "Cinematic Documentary": { promptFragment: "Handheld observational camera, natural available light, muted realistic color grading, imperfect framing that favors truth over polish, 35mm photojournalistic texture.", negativePrompt: "over-stylization, symmetrical composition, saturated color grading, staged lighting, glossy CGI sheen" },
  "Cyberpunk": { promptFragment: "Rain-slicked streets, dense neon signage, teal-and-magenta contrast lighting, volumetric fog, towering dense urban architecture, reflective wet surfaces.", negativePrompt: "daylight, pastel colors, clean minimalist environments, rural or natural settings" },
  "Hand-Painted Whimsy": { promptFragment: "Soft hand-painted watercolor textures, warm natural light, gentle rounded character design, lush detailed backgrounds, a sense of quiet wonder.", negativePrompt: "photorealism, hard-edged CGI, cold color grading, mechanical or industrial harshness" },
  "Character-Forward 3D": { promptFragment: "Warm stylized 3D rendering, expressive exaggerated character proportions, soft global illumination, rich saturated color palette, appealing rounded shapes.", negativePrompt: "photorealistic skin texture, flat lighting, muted desaturated colors, harsh shadows" },
  "Commercial Ads": { promptFragment: "Polished studio lighting, crisp product-grade clarity, confident graphic composition, premium color grading, immaculate surfaces.", negativePrompt: "clutter, dim lighting, amateur framing, visible imperfections or blemishes" },
  "Motion Graphics Pop": { promptFragment: "Bold flat graphic shapes, saturated primary color blocking, dynamic kinetic composition, crisp vector-clean edges, high-energy layout.", negativePrompt: "photorealism, muted colors, static symmetrical composition, soft gradients" },
  "Space Opera": { promptFragment: "Vast scale environments, dramatic rim lighting against deep space, intricate futuristic production design, sweeping epic composition, atmospheric haze.", negativePrompt: "small or intimate scale, contemporary settings, handheld camera shake, mundane lighting" },
  "YouTube Explainer": { promptFragment: "Bright even lighting, clean simple backgrounds, friendly approachable color palette, clear uncluttered composition that reads instantly.", negativePrompt: "dark moody lighting, visual clutter, complex layered backgrounds, low contrast" },
  "Anime Story Film": { promptFragment: "Bold expressive linework, dramatic speed and impact lines, large emotive eyes, saturated dynamic lighting, kinetic action staging.", negativePrompt: "photorealism, muted colors, static rigid posing, Western cartoon proportions" },
  "Dark Fantasy": { promptFragment: "Weathered ancient textures, low warm firelight against deep shadow, ominous overcast atmosphere, richly detailed period costuming and armor.", negativePrompt: "bright cheerful lighting, clean modern surfaces, pastel colors" },
  "Magical Realism": { promptFragment: "Naturalistic grounded settings touched by one impossible, quietly luminous detail; soft golden-hour light; unhurried lyrical composition.", negativePrompt: "overt fantasy spectacle, garish special effects, harsh clinical lighting" },
  "Film Noir": { promptFragment: "High-contrast black-and-white or desaturated lighting, hard venetian-blind shadows, rain-streaked windows, smoke-filled interiors, precise geometric framing.", negativePrompt: "bright even lighting, saturated color, cheerful open compositions" },
  "Psychological Thriller": { promptFragment: "Claustrophobic tight framing, unsettling asymmetric composition, cold desaturated color grading, harsh single-source lighting, dread-inducing negative space.", negativePrompt: "warm inviting lighting, wide open friendly compositions, saturated cheerful colors" },
  "Folk Horror": { promptFragment: "Earthy natural textures, ritualistic symmetrical staging, muted autumnal palette, hazy diffused daylight, unsettling pastoral stillness.", negativePrompt: "urban settings, neon or artificial lighting, clean modern production design" },
  "Romantic Drama": { promptFragment: "Soft luminous backlight, warm intimate close framing, gentle shallow depth of field, tactile natural fabrics and textures, unhurried tender pacing.", negativePrompt: "harsh flat lighting, cold color grading, wide impersonal framing" },
  "Prestige Historical": { promptFragment: "Meticulous period-accurate costuming and production design, candlelight and window-light motivated sources, painterly composition, tactile aged materials.", negativePrompt: "modern props or architecture, artificial neon lighting, contemporary clothing" },
  "Neo-Western": { promptFragment: "Sun-bleached wide-open landscapes, harsh directional daylight, dusty raw textures, weathered practical wardrobe, long horizon-driven composition.", negativePrompt: "urban interiors, neon lighting, crowded compositions, soft diffused light" },
  "Sci-Fi Realism": { promptFragment: "Plausible near-future technology, sober naturalistic lighting, vast sparse environments, functional utilitarian production design, restrained color palette.", negativePrompt: "fantastical creatures, saturated neon color, implausible magic-like effects" },
  "High Fantasy": { promptFragment: "Grand mythic scale, richly ornamented costuming and architecture, dramatic directional lighting, sweeping painterly vistas, saturated jewel-toned palette.", negativePrompt: "contemporary settings, minimalist production design, muted desaturated color" },
  "Graphic Novel": { promptFragment: "Bold inked linework, high-contrast cross-hatched shading, dramatic panel-like composition, limited punchy color palette.", negativePrompt: "photorealistic rendering, soft gradients, muted low-contrast lighting" },
  "Stop Motion": { promptFragment: "Tactile handmade puppet textures, visible fingerprint imperfections in materials, warm practical set lighting, charmingly imperfect motion.", negativePrompt: "smooth CGI rendering, photorealistic skin, perfectly symmetrical geometry" },
  "Luxury Beauty": { promptFragment: "Flawless soft studio lighting, glossy sensory surface detail, elegant minimal composition, refined desaturated luxury palette.", negativePrompt: "clutter, harsh lighting, visible blemishes or imperfections, busy backgrounds" },
  "Product Macro": { promptFragment: "Extreme macro precision, immaculate studio lighting with controlled reflections, premium material texture detail, clean isolated composition.", negativePrompt: "dust, fingerprints, cluttered backgrounds, uneven amateur lighting" },
  "Music Video": { promptFragment: "High-energy rhythmic staging, bold saturated color washes, dynamic unconventional camera angles, expressive performance-forward composition.", negativePrompt: "static composition, muted colors, conservative symmetrical framing" },
  "Vertical Social": { promptFragment: "Immediate eye-catching framing built for a vertical frame, bright punchy color, fast-read composition, energetic close-up staging.", negativePrompt: "wide horizontal composition, slow contemplative pacing, muted colors" },
  "Sports Anthem": { promptFragment: "Heroic low-angle framing, high-contrast dramatic lighting, kinetic motion blur, bold saturated team colors, triumphant epic scale.", negativePrompt: "static posed framing, muted colors, soft diffused lighting" },
  "Fashion Editorial": { promptFragment: "Sculptural high-fashion posing, bold graphic studio lighting, minimalist modern composition, striking confident color contrast.", negativePrompt: "cluttered backgrounds, soft casual posing, muted low-contrast lighting" },
  "Kids Adventure": { promptFragment: "Warm inviting color palette, rounded friendly character design, bright optimistic lighting, playful sense of wonder and scale.", negativePrompt: "dark ominous lighting, muted desaturated colors, threatening or grotesque design" }
};
// A project can now carry immutable Style DNA snapshots at project, scene, and
// shot scope. Keep this small backend reader provider-neutral: it never trusts
// raw UI text as a schema, only extracts serializable prompt blocks from the
// already persisted snapshot. Legacy preset names remain supported above.
function styleSnapshotFor(project, scene, shot) {
  const direction = project?.visualDirection || {};
  const binding = (shot?.id && direction.shotOverrides?.[shot.id]) || (scene?.id && direction.sceneOverrides?.[scene.id]) || direction.projectStyle;
  const snapshot = binding?.snapshot;
  return snapshot && typeof snapshot === "object" ? snapshot : null;
}
function styleSnapshotPrompt(style, kind = "image", context = "") {
  if (!style) return { positive: "", negative: "" };
  const contextDetails = context === "character"
    ? [style.characters?.anatomy, style.characters?.proportions, style.characters?.facialDesign, style.characters?.wardrobe, style.characters?.texture, Array.isArray(style.characters?.identityConsistencyRules) && style.characters.identityConsistencyRules.join(", ")]
    : context === "environment"
      ? [style.environments?.architecture, style.environments?.terrain, style.environments?.atmosphericPerspective, Array.isArray(style.environments?.setDressingRules) && style.environments.setDressingRules.join(", ")]
      : context === "prop"
        ? [style.props?.designLanguage, Array.isArray(style.props?.materialRules) && style.props.materialRules.join(", "), Array.isArray(style.props?.scaleRules) && style.props.scaleRules.join(", ")]
        : [];
  const positive = [style.name, style.promptBlocks?.universal, style.promptBlocks?.[kind], style.promptBlocks?.[context], style.visualLanguage?.shapeLanguage, style.lighting?.approach, Array.isArray(style.camera?.shotLanguage) && style.camera.shotLanguage.join(", "), Array.isArray(style.materials?.primaryMaterials) && style.materials.primaryMaterials.join(", "), Array.isArray(style.continuityRules) && style.continuityRules.join(", "), ...contextDetails].filter(Boolean).join(". ");
  const negative = [style.promptBlocks?.negative, ...(Array.isArray(style.forbiddenElements) ? style.forbiddenElements : []), ...(kind === "video" && Array.isArray(style.animation?.forbiddenMotion) ? style.animation.forbiddenMotion : [])].filter(Boolean).join(", ");
  return { positive: compact(positive, 850), negative: compact(negative, 650) };
}
// The renderer may hold a previously edited generation package. That text is
// useful direction, but it must never freeze an older look after a creator
// applies a new Style DNA. This lock is composed at the provider boundary and
// therefore reaches every image adapter (OpenAI, Gemini, fal, WaveSpeed, Kie,
// and local models) with the actual current project/scene/shot override.
function styleEnforcementPrompt(payload, settings, kind = "image") {
  const project = payload?.project || {}; const scene = payload?.scene || {}; const shot = payload?.shot || {};
  const context = String(settings?.styleContext || "storyboard");
  const snapshot = styleSnapshotFor(project, scene, shot);
  const legacy = STYLE_DNA[project?.style];
  const resolved = styleSnapshotPrompt(snapshot, kind, context);
  const positive = resolved.positive || legacy?.promptFragment || "";
  const negative = resolved.negative || legacy?.negativePrompt || "";
  if (!positive && !negative) return "";
  const strength = String(project?.visualDirection?.styleStrength || "balanced");
  const emphasis = strength === "signature" || strength === "strong"
    ? "Make the Style DNA unmistakable and dominant in the finished render."
    : "Apply the Style DNA consistently throughout the finished render.";
  return [
    `STYLE DNA LOCK — ${snapshot?.name || project?.style || "Active visual direction"}.`,
    emphasis,
    positive && `Required visual language: ${positive}.`,
    "Reference images establish identity, costume, geometry, and composition only; do not copy their source rendering medium when it conflicts with this Style DNA.",
    negative && `Never introduce: ${negative}.`
  ].filter(Boolean).join("\n");
}
function responseImageResult(payload) {
  for (const item of payload?.output || []) {
    if (item?.type === "image_generation_call" && typeof item.result === "string" && item.result) return item.result;
    for (const content of item?.content || []) if (typeof content?.b64_json === "string" && content.b64_json) return content.b64_json;
  }
  return "";
}
function saveGeneratedImage(base64, title) {
  const folder = path.join(app.getPath("userData"), "generated-media");
  fs.mkdirSync(folder, { recursive: true });
  const fileName = `${safeAssetName(title || "scene")}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const filePath = path.join(folder, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  const info = fs.statSync(filePath);
  return { name: fileName, displayName: cleanGeneratedTitle(title), path: filePath, previewUrl: pathToFileURL(filePath).toString(), kind: "image", size: info.size, modifiedAt: info.mtime.toISOString() };
}
function saveGeneratedVideo(buffer, title, metadata = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 1024) throw new Error("The provider returned an empty or invalid video file.");
  const folder = path.join(app.getPath("userData"), "generated-media");
  fs.mkdirSync(folder, { recursive: true });
  const mimeType = String(metadata.mimeType || "").toLowerCase();
  const extension = mimeType.includes("webm") ? ".webm" : mimeType.includes("quicktime") || mimeType.includes("mov") ? ".mov" : ".mp4";
  const fileName = `${safeAssetName(title || "shot")}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const filePath = path.join(folder, fileName);
  fs.writeFileSync(filePath, buffer);
  const info = fs.statSync(filePath);
  return { name: fileName, displayName: cleanGeneratedTitle(title), path: filePath, previewUrl: pathToFileURL(filePath).toString(), kind: "video", mimeType: mimeType || "video/mp4", size: info.size, modifiedAt: info.mtime.toISOString(), ...(metadata.sourceUrl ? { sourceUrl: metadata.sourceUrl } : {}) };
}
function shotImagePrompt(project, scene, shot, settings) {
  const direction = compact(settings?.prompt || shot?.purpose || scene?.note || "", 1800);
  const blueprint = shot?.blueprint || settings?.blueprint || {};
  const styleDna = STYLE_DNA[project?.style]; const resolvedStyle = styleSnapshotPrompt(styleSnapshotFor(project, scene, shot), /VIDEO GENERATION PACKAGE/i.test(settings?.prompt || "") ? "video" : "image");
  const negative = compact([settings?.negativePrompt, resolvedStyle.negative || styleDna?.negativePrompt].filter(Boolean).join(", "), 900);
  const context = [
    project?.name && `Project: ${compact(project.name, 120)}.`,
    project?.logline && `Story promise: ${compact(project.logline, 460)}.`,
    resolvedStyle.positive ? `Visual Direction: ${resolvedStyle.positive}.` : project?.style && `Visual language: ${compact(project.style, 220)}.${styleDna ? ` ${compact(styleDna.promptFragment, 400)}` : ""}`,
    Array.isArray(project?.characters) && project.characters.length && `Character continuity: ${project.characters.slice(0, 10).map((character) => `${compact(character?.name, 80)}${character?.appearance ? ` — ${compact(character.appearance, 180)}` : ""}${character?.wardrobe ? `; wardrobe: ${compact(character.wardrobe, 140)}` : ""}${character?.emotionalProfile ? `; emotional baseline: ${compact(character.emotionalProfile, 140)}` : ""}`).join(" | ")}.`,
    Array.isArray(project?.sets) && project.sets.length && `Set continuity: ${project.sets.slice(0, 8).map((set) => `${compact(set?.name, 80)}${set?.description ? ` — ${compact(set.description, 160)}` : ""}`).join(" | ")}.`,
    Array.isArray(project?.props) && project.props.length && `Prop continuity: ${project.props.slice(0, 12).map((prop) => compact(prop?.name, 80)).join(", ")}.`,
    scene?.title && `Scene: ${compact(scene.title, 160)}.`,
    scene?.note && `Scene objective: ${compact(scene.note, 520)}.`,
    shot?.title && `Shot: ${compact(shot.title, 160)}.`,
    shot?.purpose && `Shot purpose: ${compact(shot.purpose, 500)}.`,
    shot?.framing && `Framing: ${compact(shot.framing, 100)}.`,
    shot?.lens && `Lens: ${compact(shot.lens, 100)}.`,
    shot?.movement && `Camera movement: ${compact(shot.movement, 100)}.`,
    blueprint?.camera && `Camera plan: ${compact(blueprint.camera, 620)}.`,
    blueprint?.blocking && `Blocking and composition: ${compact(blueprint.blocking, 620)}.`,
    blueprint?.lighting && `Lighting and atmosphere: ${compact(blueprint.lighting, 620)}.`,
    blueprint?.performance && `Performance direction: ${compact(blueprint.performance, 620)}.`,
    blueprint?.motion && `Motion plan: ${compact(blueprint.motion, 380)}.`,
    blueprint?.audio && `Audio intent: ${compact(blueprint.audio, 420)}.`,
    blueprint?.effects && `Effects plan: ${compact(blueprint.effects, 420)}.`,
    blueprint?.continuity && `Continuity constraints: ${compact(blueprint.continuity, 500)}.`,
    settings?.motion && `Motion character: ${compact(settings.motion, 100)}.`,
    direction && `Director instruction: ${direction}.`,
    negative && `Do not include or change: ${negative}.`
  ].filter(Boolean).join("\n");
  return `Create one finished cinematic production frame for this exact shot. Respect the shot's camera, story objective, visual language, and all supplied reference images. Produce one coherent frame only; no split panels, text, subtitles, logos, watermarks, or interface elements. Do not invent named characters, props, or plot events that are not present in the production context.\n\n${context}`;
}
function imageSizeForShot(settings) {
  const aspect = String(settings?.aspectRatio || "16:9");
  if (aspect === "1:1") return "1024x1024";
  if (aspect === "9:16") return "1024x1536";
  return "1536x1024";
}
function validateGenerationRequest(payload, expectedOutput) {
  const settings = payload?.settings || {};
  const provider = String(settings.provider || "").trim();
  const model = String(settings.model || "").trim();
  const prompt = String(settings.prompt || payload?.shot?.purpose || "").trim();
  const aspectRatio = String(settings.aspectRatio || "16:9");
  const resolution = String(settings.resolution || "").trim();
  const references = Array.isArray(payload?.references) ? payload.references : [];
  const capability = modelCapability(model, provider);
  const errors = [];
  if (!provider || !providerIds.includes(provider)) errors.push("Select a supported provider.");
  if (!model || model.length > 180) errors.push("Select a valid model.");
  if (!prompt || prompt.length < 3) errors.push("Write a shot prompt with at least three characters.");
  if (prompt.length > 6000) errors.push("Shorten the shot prompt to 6,000 characters or fewer.");
  if (!capability.ratios.includes(aspectRatio)) errors.push(`${model} does not support the ${aspectRatio} aspect ratio.`);
  if (resolution && capability.resolutions?.length && !capability.resolutions.includes(resolution)) errors.push(`${model} does not support the ${resolution} resolution.`);
  if (capability.output !== expectedOutput) errors.push(`${model} is registered for ${capability.output} generation, not ${expectedOutput} generation.`);
  const referenceLimits = isSingleSourceImageToVideo(settings, capability) ? { image: 0, video: 0, audio: 0 } : (capability.referenceLimits || { image: capability.references, video: 0, audio: 0 });
  // Start/end frames are deliberate composition controls, not general
  // reference images. Do not count them against a model's guidance limit.
  const guidanceReferences = references.filter((reference) => !["start-frame", "end-frame"].includes(reference?.role));
  const referenceCounts = guidanceReferences.reduce((counts, reference) => { const kind = ["image", "video", "audio"].includes(reference?.kind) ? reference.kind : "image"; counts[kind] += 1; return counts; }, { image: 0, video: 0, audio: 0 });
  Object.entries(referenceCounts).forEach(([kind, count]) => { if (count > (referenceLimits[kind] || 0)) errors.push(model + " accepts up to " + (referenceLimits[kind] || 0) + " " + kind + " reference" + ((referenceLimits[kind] || 0) === 1 ? "" : "s") + "."); });
  references.forEach((reference) => {
    const filePath = String(reference?.path || "");
    if (!filePath || !fs.existsSync(filePath)) errors.push(`Reference is unavailable: ${reference?.name || "unnamed asset"}.`);
    else { const sizeLimit = reference?.kind === "video" ? 200 * 1024 * 1024 : reference?.kind === "audio" ? 50 * 1024 * 1024 : 10 * 1024 * 1024; if (fs.statSync(filePath).size > sizeLimit) errors.push("Reference exceeds the " + Math.round(sizeLimit / 1024 / 1024) + " MB provider upload limit: " + (reference?.name || path.basename(filePath)) + "."); }
  });
  if (expectedOutput === "video") {
    const duration = Number(settings.duration || 5);
    const [minimum, maximum] = capability.duration || [3, 15];
    if (!Number.isFinite(duration) || duration < minimum || duration > maximum) errors.push(`${model} supports video durations from ${minimum} to ${maximum} seconds.`);
    const mode = String(settings.mode || "text-to-video");
    const startFrame = references.find((reference) => reference?.role === "start-frame" && reference?.kind === "image");
    if (mode === "image-to-video" && !startFrame && !(Array.isArray(settings.referenceUrls) && settings.referenceUrls.length)) errors.push("Image-to-video requires a deliberately selected Start Frame. General reference images remain guidance and are not used as a start frame.");
    if (mode === "reference-to-video" && !guidanceReferences.length && !(Array.isArray(settings.referenceUrls) && settings.referenceUrls.length)) errors.push("Attach at least one compatible reference for this video mode.");
  }
  if (errors.length) { const error = new Error(errors[0]); error.code = "validation"; error.details = errors; throw error; }
}
function imageReferences(referenceAssets, limit = 8) {
  return (Array.isArray(referenceAssets) ? referenceAssets : []).slice(0, limit).flatMap((reference) => {
    const filePath = String(reference?.path || "");
    const mime = imageMimeType(filePath);
    if (!filePath || !mime || !fs.existsSync(filePath)) return [];
    try {
      const info = fs.statSync(filePath);
      if (info.size > 10 * 1024 * 1024) return [];
      return [{ id: reference?.id || "", role: reference?.role || "image", path: filePath, mime, data: fs.readFileSync(filePath).toString("base64"), name: reference?.name || path.basename(filePath), kind: "image" }];
    } catch { return []; }
  });
}
function mediaReferences(referenceAssets, limit = 16) {
  return (Array.isArray(referenceAssets) ? referenceAssets : []).slice(0, limit).flatMap((reference) => {
    const filePath = String(reference?.path || ""); const mime = mediaMimeType(filePath);
    if (!filePath || !mime || !fs.existsSync(filePath)) return [];
    try {
      const info = fs.statSync(filePath); const max = reference?.kind === "video" ? 1024 * 1024 * 1024 : reference?.kind === "audio" ? 250 * 1024 * 1024 : 64 * 1024 * 1024;
      if (info.size > max) return [];
      // The Fal multimodal path uploads the file straight to provider storage.
      // Keep a small data URI only for providers that explicitly need one.
      return [{ id: reference?.id || "", path: filePath, mime, size: info.size, data: info.size <= 32 * 1024 * 1024 ? fs.readFileSync(filePath).toString("base64") : "", name: reference?.name || path.basename(filePath), kind: reference?.kind || (mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "image") }];
    } catch { return []; }
  });
}
function errorForProvider(provider, response, detail) {
  if (response.status === 401 || response.status === 403) return `${provider} rejected this key or this account has no access to the selected model.`;
  if (response.status === 429) return `${provider} is rate-limiting this request. Wait a moment and retry.`;
  return `${provider} generation failed (${response.status}): ${detail.slice(0, 380)}`;
}
// Fast/Balanced/High is the app-wide quality abstraction every model
// respects. gpt-image-2.5-flare/sunburst (2026-09-08) additionally accept
// "xhigh" and "max" — Very High/Maximum only ever reach the API when the
// selected model's capability opts into the richer tier set (see
// registeredModelCapability's qualityTiers in storymaker.js and the
// matching <select> repopulation in updateCapabilities), so every other
// model still only ever sends Fast/Balanced/High.
const IMAGE_QUALITY_TO_API = { Fast: "low", Balanced: "medium", High: "high", "Very High": "xhigh", Maximum: "max" };
async function requestOpenAIShotImage(payload, prompt, references) {
  const apiKey = getProviderKey("openai");
  if (!apiKey) throw new Error("Connect an OpenAI key in Model Hub before generating this shot.");
  const settings = payload?.settings || {};
  // GPT Image is exposed as a Responses API image_generation tool, which
  // accepts its own "model" field (gpt-image-1 / gpt-image-2 /
  // gpt-image-2.5-flare / gpt-image-2.5-sunburst) — separate from the
  // "model" of the Responses call itself (responseModel, below, must stay a
  // reasoning model like gpt-5.1; passing an image model there is the exact
  // 400 model_not_found failure users used to see). gpt-image-2 was, at one
  // point, not yet available through this tool at all, hence the fallback
  // to gpt-image-1 below — but it must be an *exact* match, not a substring
  // replace: "gpt-image-2.5-flare".replace("gpt-image-2", "gpt-image-1")
  // would silently corrupt it to the nonexistent "gpt-image-1.5-flare".
  const imageModel = settings.model === "gpt-image-2" ? "gpt-image-1" : String(settings.model || "gpt-image-1");
  const responseModel = "gpt-5.1";
  const size = imageSizeForShot(settings);
  const quality = IMAGE_QUALITY_TO_API[settings.quality] || "medium";
  // transparent/opaque backgrounds are new to gpt-image-2.5-*; every other
  // model ignores an "auto" background harmlessly (the tool call still only
  // sends it — earlier models simply don't expose the control that would
  // ever change it away from "auto").
  const background = ["transparent", "opaque"].includes(String(settings.background || "").toLowerCase()) ? settings.background.toLowerCase() : "auto";
  // Do not send input_fidelity in the tool call below — OpenAI may route
  // this tool to a newer GPT Image backend that rejects that legacy
  // option, even when the UI model label reads GPT Image 1. inputFidelity
  // is still computed and recorded in the returned generation metadata;
  // it just never becomes part of the request itself.
  const inputFidelity = settings.referenceStrength === "Loose" ? "low" : "high";
  const content = [{ type: "input_text", text: prompt }];
  references.forEach((reference) => content.push({ type: "input_image", image_url: `data:${reference.mime};base64,${reference.data}` }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: responseModel, store: false,
        input: [{ role: "user", content }],
        tools: [{ type: "image_generation", model: imageModel, action: references.length ? "edit" : "generate", size, quality, background, output_format: "png" }],
        tool_choice: { type: "image_generation" }
      })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));
    let result;
    try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable image response. Please retry this shot."); }
    const base64 = responseImageResult(result);
    if (!base64) throw new Error("OpenAI completed the request without an image output. Check image-generation access for this model.");
    const asset = saveGeneratedImage(base64, payload?.shot?.title || "shot");
    if (String(settings.aspectRatio || "") === "21:9") {
      await cropImageToAspectRatio(asset.path, "21:9");
      const info = fs.statSync(asset.path);
      asset.size = info.size; asset.modifiedAt = info.mtime.toISOString();
    }
    return { asset, generation: { provider: "openai", model: imageModel, responseModel, prompt, size, quality, background, inputFidelity, usedReferences: references.map((reference) => reference.name), generatedAt: new Date().toISOString() } };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("OpenAI took too long to render this shot. Please retry.");
    throw error;
  } finally { clearTimeout(timeout); }
}
async function requestGoogleShotImage(payload, prompt, references) {
  const apiKey = getProviderKey("google");
  if (!apiKey) throw new Error("Connect a Google AI key in Model Hub before generating this shot.");
  const settings = payload?.settings || {};
  const model = String(settings.model || "gemini-3.1-flash-image");
  const aspectRatio = ["1:1", "3:2", "16:9", "9:16"].includes(String(settings.aspectRatio)) ? String(settings.aspectRatio) : "16:9";
  const parts = [{ text: prompt }, ...references.map((reference) => ({ inlineData: { mimeType: reference.mime, data: reference.data } }))];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } } })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(errorForProvider("Google AI", response, raw));
    let result;
    try { result = JSON.parse(raw); } catch { throw new Error("Google AI returned an unreadable image response. Please retry this shot."); }
    const imagePart = (result?.candidates || []).flatMap((candidate) => candidate?.content?.parts || []).find((part) => part?.inlineData?.data || part?.inline_data?.data);
    const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data || "";
    if (!base64) throw new Error("Google AI completed the request without an image output. Confirm this model is enabled for your API key.");
    const asset = saveGeneratedImage(base64, payload?.shot?.title || "shot");
    return { asset, generation: { provider: "google", model, prompt, aspectRatio, usedReferences: references.map((reference) => reference.name), generatedAt: new Date().toISOString() } };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Google AI took too long to render this shot. Please retry.");
    throw error;
  } finally { clearTimeout(timeout); }
}
async function saveGeneratedImageUrl(url, title, provider, apiKey) {
  if (!/^https?:\/\//i.test(String(url || ""))) throw new Error(`${provider} returned an invalid image URL.`);
  let response = await fetch(url);
  // Some gateways (WaveSpeed) can hand back a result URL gated behind the
  // same bearer token used to submit the task, rather than a public/signed
  // one. A plain download 401s; retry once with that token before giving up.
  if (response.status === 401 && apiKey) response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`${provider} returned an image that could not be downloaded (${response.status}).`);
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType && !contentType.startsWith("image/")) throw new Error(`${provider} returned a non-image response (${contentType}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 64) throw new Error(`${provider} returned an empty or invalid image file.`);
  const folder = path.join(app.getPath("userData"), "generated-media"); fs.mkdirSync(folder, { recursive: true });
  const extension = contentType.includes("webp") ? ".webp" : contentType.includes("jpeg") ? ".jpg" : contentType.includes("gif") ? ".gif" : ".png";
  const fileName = `${safeAssetName(title || "shot")}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`; const filePath = path.join(folder, fileName); fs.writeFileSync(filePath, buffer); const info = fs.statSync(filePath);
  return { name: fileName, displayName: cleanGeneratedTitle(title), path: filePath, previewUrl: pathToFileURL(filePath).toString(), kind: "image", mimeType: contentType || imageMimeType(filePath), size: info.size, modifiedAt: info.mtime.toISOString(), sourceUrl: url };
}
function imageUrlsFromResult(value) {
  // Deliberately unscoped to any particular provider's key names (url,
  // image_url, video.url, output.video_url, ...) rather than an allowlist —
  // every provider added so far has used a slightly different shape, and an
  // allowlist just means the next one silently returns nothing.
  const urls = []; const visit = (item) => { if (!item) return; if (typeof item === "string" && /^https?:\/\//i.test(item)) urls.push(item); else if (Array.isArray(item)) item.forEach(visit); else if (typeof item === "object") Object.values(item).forEach(visit); }; visit(value); return [...new Set(urls)];
}
// WaveSpeed's poll response always includes a self-referential urls.get
// status link, even while the job is still processing — the same "urls"
// field pollWaveSpeedShotVideo below already excludes. imageUrlsFromResult's
// unscoped recursive search picks that Bearer-gated status link up as
// readily as a real output, so an image polling loop that resolves as soon
// as ANY url shows up (even on the first, still-processing response) grabs
// that status link and then fails downloading it with 401. Only look once
// WaveSpeed itself reports completion, and prefer the documented `outputs`
// field over the generic scrape.
function waveSpeedImageOutputs(data) {
  const outputs = Array.isArray(data?.outputs) ? data.outputs.filter((url) => /^https?:\/\//i.test(String(url || ""))) : [];
  if (outputs.length) return outputs;
  return imageUrlsFromResult({ ...data, urls: undefined });
}
function videoUrlsFromResult(value) {
  const preferred = []; const fallback = [];
  const visit = (item, key = "") => {
    if (!item) return;
    if (typeof item === "string") { if (/^https?:\/\//i.test(item)) (/video|output|result|download|file|url/i.test(key) ? preferred : fallback).push(item); return; }
    if (Array.isArray(item)) return item.forEach((entry) => visit(entry, key));
    if (typeof item === "object") Object.entries(item).forEach(([childKey, child]) => visit(child, childKey));
  };
  visit(value); return [...new Set([...preferred, ...fallback])];
}
function looksLikeVideo(buffer) { const header = Buffer.isBuffer(buffer) ? buffer.subarray(0, 64).toString("ascii") : ""; return buffer?.length >= 1024 && (header.includes("ftyp") || header.startsWith("\x1A\x45\xDF\xA3") || header.startsWith("RIFF")); }
async function downloadGeneratedVideo(urls, title, provider) {
  const candidates = [...new Set((Array.isArray(urls) ? urls : [urls]).filter((url) => /^https?:\/\//i.test(String(url || ""))))];
  if (!candidates.length) throw new Error(`${provider} completed the task without a usable video URL.`);
  const failures = [];
  for (const url of candidates) for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", headers: { Accept: "video/*,application/octet-stream;q=0.9,*/*;q=0.1" } });
      const contentType = String(response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!(contentType.startsWith("video/") || contentType === "application/octet-stream" || looksLikeVideo(buffer))) throw new Error(`unexpected ${contentType || "response type"}`);
      if (!looksLikeVideo(buffer) && buffer.length < 8 * 1024) throw new Error("response is too small to be a video");
      return saveGeneratedVideo(buffer, title, { mimeType: contentType, sourceUrl: url });
    } catch (error) { failures.push(`${new URL(url).hostname}: ${error?.message || "download failed"}`); if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 700 * attempt)); }
  }
  throw new Error(`${provider} completed the task, but Storymaker could not persist its video result. ${failures.slice(-2).join("; ")}`);
}
async function upscaleProjectMedia(payload) {
  const apiKey = getProviderKey("fal"); if (!apiKey) throw new Error("Connect a fal key in Model Hub before upscaling.");
  const filePath = String(payload?.path || ""); const kind = String(payload?.kind || mediaKind(filePath)); const factor = Math.max(1, Math.min(4, Number(payload?.factor) || 2));
  if (!filePath || !fs.existsSync(filePath) || !["image", "video"].includes(kind)) throw new Error("Choose a local image or video asset to upscale.");
  const mime = mediaMimeType(filePath); if (!mime) throw new Error("This media type cannot be sent to the selected upscaler.");
  const sourceUrl = await falUploadReference({ path: filePath, mime, name: path.basename(filePath), kind, size: fs.statSync(filePath).size }, apiKey);
  const endpoint = kind === "video" ? "fal-ai/topaz/upscale/video" : "fal-ai/topaz/upscale/image";
  const body = kind === "video" ? { video_url: sourceUrl, model: "Proteus", upscale_factor: factor, H264_output: true } : { image_url: sourceUrl, model: "Standard V2", upscale_factor: factor, output_format: "png", face_enhancement: true };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), kind === "video" ? 900000 : 240000);
  try {
    const response = await fetch(`https://fal.run/${endpoint}`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` }, body: JSON.stringify(body) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("fal upscaler", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("fal returned an unreadable upscale response."); }
    if (kind === "video") { const asset = await downloadGeneratedVideo(videoUrlsFromResult(result), path.basename(filePath, path.extname(filePath)) + "-upscaled", "fal"); return { asset, generation: { provider: "fal", model: endpoint, factor, generatedAt: new Date().toISOString() } }; }
    const url = imageUrlsFromResult(result)[0]; if (!url) throw new Error("fal completed the upscale without an image URL."); const asset = await saveGeneratedImageUrl(url, path.basename(filePath, path.extname(filePath)) + "-upscaled", "fal"); return { asset, generation: { provider: "fal", model: endpoint, factor, generatedAt: new Date().toISOString() } };
  } catch (error) { if (error?.name === "AbortError") throw new Error("The upscaler took too long. Your source is still safe; try again or use a smaller input."); throw error; } finally { clearTimeout(timeout); }
}

async function requestFalImage(payload, prompt, references) {
  const apiKey = getProviderKey("fal"); if (!apiKey) throw new Error("Connect a fal key in Model Hub before generating this shot.");
  const model = String(payload?.settings?.model || "fal-seedream-v45");
  if (model.includes("video")) throw new Error(`${model} is a fal video model; it must be queued through the video pipeline, not requested as an image.`);
  const settings = payload?.settings || {};
  // fal-ai/gpt-image-2.5-flare and fal-ai/gpt-image-2.5-sunburst (added
  // 2026-09-08, confirmed live via fal's own API docs) are one endpoint each
  // — no separate /edit or /text-to-image sub-path like Seedream below; the
  // presence of image_urls alone tells fal which mode to run, matching how
  // OpenAI's own image_generation tool infers edit-vs-generate.
  const isGptImage25 = model === "fal-gpt-image-2.5-flare" || model === "fal-gpt-image-2.5-sunburst";
  const endpoint = isGptImage25
    ? `fal-ai/gpt-image-2.5-${model.endsWith("sunburst") ? "sunburst" : "flare"}`
    : model === "fal-seedream-v5-lite" ? `fal-ai/bytedance/seedream/v5/lite/${references.length ? "edit" : "text-to-image"}` : `fal-ai/bytedance/seedream/v4.5/${references.length ? "edit" : "text-to-image"}`;
  const body = isGptImage25
    ? { prompt, image_size: { width: imageSizeForShot(settings).startsWith("1024") ? 1024 : 1536, height: imageSizeForShot(settings).endsWith("1536") ? 1536 : 1024 }, quality: IMAGE_QUALITY_TO_API[settings.quality] || "high", background: ["transparent", "opaque"].includes(String(settings.background || "").toLowerCase()) ? settings.background.toLowerCase() : "auto", num_images: 1, output_format: "png" }
    : { prompt, image_size: { width: imageSizeForShot(settings).startsWith("1024") ? 1024 : 1536, height: imageSizeForShot(settings).endsWith("1536") ? 1536 : 1024 }, num_images: 1, enable_safety_checker: true };
  // fal's documented cap for gpt-image-2.5's image_urls is 16; Seedream's
  // existing behavior (4) is untouched.
  if (references.length) body.image_urls = references.slice(0, isGptImage25 ? 16 : 4).map((reference) => `data:${reference.mime};base64,${reference.data}`);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 180000);
  // fal has no native 21:9 image_size preset either (see the identical note
  // on cropImageToAspectRatio, originally written for OpenAI) — only
  // reached when the model's capability lists "21:9" at all, which today
  // means only fal-gpt-image-2.5-flare/sunburst; Seedream's own capability
  // entries don't offer 21:9, so validateGenerationRequest rejects it there
  // before this function is ever called.
  try { const response = await fetch(`https://fal.run/${endpoint}`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` }, body: JSON.stringify(body) }); const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("fal", response, raw)); let result; try { result = JSON.parse(raw); } catch { throw new Error("fal returned an unreadable image response."); } const url = imageUrlsFromResult(result)[0]; if (!url) throw new Error("fal completed without an image URL."); const asset = await saveGeneratedImageUrl(url, payload?.shot?.title, "fal"); if (String(settings.aspectRatio || "") === "21:9") { await cropImageToAspectRatio(asset.path, "21:9"); const info = fs.statSync(asset.path); asset.size = info.size; asset.modifiedAt = info.mtime.toISOString(); } markProviderVerified("fal", `Rendered ${model}.`); return { asset, generation: { provider: "fal", model, prompt, generatedAt: new Date().toISOString() } }; } catch (error) { if (error?.name === "AbortError") throw new Error("fal took too long to render this shot. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
// fal's queue API: submit POST queue.fal.run/{model}, poll GET
// .../requests/{id}/status, fetch result GET .../requests/{id}. Auth is
// "Key", matching the already-proven fal image adapter above — verified
// against fal's own docs, not the image adapter's convention alone.
function falClosestEnum(value, options, fallback) {
  const numeric = Number(value); if (!Number.isFinite(numeric)) return fallback;
  return options.reduce((closest, option) => Math.abs(option - numeric) < Math.abs(closest - numeric) ? option : closest, options[0]);
}
function falVideoBody(model, prompt, settings, references) {
  const isKling = model.includes("kling-video");
  const duration = String(falClosestEnum(settings.duration, isKling ? [5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 5));
  const imageUrl = references[0]?.url || (references[0]?.data ? `data:${references[0].mime};base64,${references[0].data}` : "");
  const mediaUrl = (reference) => reference?.url || (reference?.data ? "data:" + reference.mime + ";base64," + reference.data : "");
  const images = references.filter((reference) => reference.kind === "image");
  const videos = references.filter((reference) => reference.kind === "video");
  const audio = references.filter((reference) => reference.kind === "audio");
  // General image references are never implicit start frames. A start or end
  // frame reaches a video provider only after the creator selected that exact
  // asset in the video-only frame controls.
  const startFrame = references.find((reference) => reference.id && reference.id === settings.startFrameAssetId);
  const endFrame = references.find((reference) => reference.id && reference.id === settings.endFrameAssetId);
  if (model.startsWith("bytedance/seedance-2.0/")) {
    const body = { prompt, duration: Math.max(4, Math.min(15, Number(settings.duration) || 5)), aspect_ratio: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "16:9", resolution: ["480p", "720p"].includes(String(settings.resolution)) ? settings.resolution : "720p", generate_audio: Boolean(settings.audioInstruction) };
    if (model.endsWith("image-to-video")) {
      const startUrl = startFrame ? mediaUrl(startFrame) : "";
      if (!startUrl) throw new Error("Seedance Image-to-Video requires a selected Start Frame. Choose it in Frame Controls; general reference images are not promoted automatically.");
      body.image_url = startUrl;
      if (endFrame) body.end_image_url = mediaUrl(endFrame);
    }
    if (model.endsWith("reference-to-video")) { body.image_urls = images.slice(0, 9).map(mediaUrl); body.video_urls = videos.slice(0, 3).map(mediaUrl); body.audio_urls = audio.slice(0, 3).map(mediaUrl); }
    return body;
  }
  if (model.includes("kling-video/v3/standard")) {
    const body = { prompt, duration: String(falClosestEnum(settings.duration, [3, 5, 10, 15], 5)), negative_prompt: settings.negativePrompt || "blur, distort, and low quality", generate_audio: Boolean(settings.audioInstruction) };
    if (startFrame) body.start_image_url = mediaUrl(startFrame); else body.aspect_ratio = ["16:9", "9:16", "1:1"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "16:9";
    if (endFrame) body.end_image_url = mediaUrl(endFrame);
    const elements = [...images.filter((reference) => reference !== startFrame && reference !== endFrame).map((reference) => ({ frontal_image_url: mediaUrl(reference) })), ...videos.map((reference) => ({ video_url: mediaUrl(reference) }))];
    if (elements.length) body.elements = elements.slice(0, 7);
    return body;
  }
  if (model.includes("kling-video/o1/standard/reference-to-video")) {
    return { prompt, duration: String(falClosestEnum(settings.duration, [3, 5, 10], 5)), negative_prompt: settings.negativePrompt || "blur, distort, and low quality", image_urls: images.slice(0, 7).map(mediaUrl), generate_audio: Boolean(settings.audioInstruction) };
  }
  if (isKling) {
    const body = { prompt, duration, negative_prompt: settings.negativePrompt || "blur, distort, and low quality" };
    if (imageUrl) body.image_url = imageUrl; else body.aspect_ratio = ["16:9", "9:16", "1:1"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "16:9";
    return body;
  }
  const body = { prompt, duration, aspect_ratio: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "auto", resolution: ["480p", "720p", "1080p"].includes(String(settings.resolution)) ? settings.resolution : "1080p" };
  if (imageUrl) body.image_url = imageUrl;
  return body;
}
async function falUploadReference(reference, apiKey) {
  if (!reference?.path || !fs.existsSync(reference.path)) throw new Error(`Reference ${reference?.name || "file"} is no longer available locally.`);
  const contentType = reference.mime || "application/octet-stream";
  const size = Number(reference.size || fs.statSync(reference.path).size || 0);
  const multipart = size > 90 * 1024 * 1024;
  const ticketResponse = await fetch(`https://rest.fal.ai/storage/upload/${multipart ? "initiate-multipart" : "initiate"}?storage_type=fal-cdn-v3`, {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType, file_name: reference.name || path.basename(reference.path) })
  });
  const raw = await ticketResponse.text();
  if (!ticketResponse.ok) throw new Error(errorForProvider("fal storage", ticketResponse, raw));
  let ticket; try { ticket = JSON.parse(raw); } catch { throw new Error("fal storage returned an unreadable upload ticket."); }
  if (!ticket?.upload_url || !ticket?.file_url) throw new Error("fal storage did not return a usable upload URL.");
  if (!multipart) {
    const upload = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": contentType }, body: fs.readFileSync(reference.path) });
    if (!upload.ok) throw new Error(`fal storage could not upload ${reference.name || "reference"} (HTTP ${upload.status}).`);
  } else {
    const parsed = new URL(ticket.upload_url); const chunkSize = 10 * 1024 * 1024; const handle = fs.openSync(reference.path, "r"); const parts = [];
    try {
      for (let offset = 0, partNumber = 1; offset < size; offset += chunkSize, partNumber += 1) {
        const chunk = Buffer.alloc(Math.min(chunkSize, size - offset)); fs.readSync(handle, chunk, 0, chunk.length, offset);
        const url = `${parsed.origin}${parsed.pathname}/${partNumber}${parsed.search}`;
        const partResponse = await fetch(url, { method: "PUT", body: chunk }); const partRaw = await partResponse.text();
        if (!partResponse.ok) throw new Error(`fal storage could not upload part ${partNumber} of ${reference.name || "reference"} (HTTP ${partResponse.status}).`);
        let part; try { part = JSON.parse(partRaw); } catch { part = { etag: partResponse.headers.get("etag") }; }
        if (!part?.etag) throw new Error(`fal storage did not return an ETag for part ${partNumber}.`);
        parts.push({ partNumber, etag: part.etag });
      }
    } finally { fs.closeSync(handle); }
    const completeUrl = `${parsed.origin}${parsed.pathname}/complete${parsed.search}`;
    const complete = await fetch(completeUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parts }) });
    if (!complete.ok) throw new Error(`fal storage could not finalize ${reference.name || "reference"} (HTTP ${complete.status}).`);
  }
  return ticket.file_url;
}
async function uploadFalReferences(references, apiKey) {
  // fal workers need a provider-accessible URL. Uploading all local inputs
  // prevents video/audio data-URI size failures and makes reference handling
  // identical for Seedance 2.0 and Kling.
  return Promise.all((references || []).map(async (reference) => ({ ...reference, url: await falUploadReference(reference, apiKey) })));
}
async function submitFalShotVideo(payload) {
  const apiKey = getProviderKey("fal"); if (!apiKey) throw new Error("Connect a fal key in Model Hub before queueing this shot.");
  const settings = payload?.settings || {};
  const model = String(settings.model || ""); if (!(model.startsWith("fal-ai/") || model.startsWith("bytedance/"))) throw new Error("Select a fal video model before queueing this shot.");
  const prompt = resolvedShotPrompt(payload, settings, "video");
  const references = await uploadFalReferences(mediaReferences(payload?.references), apiKey);
  const body = falVideoBody(model, prompt, settings, references);
  const response = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` }, body: JSON.stringify(body) });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("fal", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("fal accepted the request with an unreadable response."); }
  const taskId = result?.request_id; if (!taskId) throw new Error("fal did not return a request id.");
  markProviderVerified("fal", `Queued ${model}.`); return { taskId, status: "queued", pollAfterSeconds: 6 };
}
async function pollFalShotVideo(payload) {
  const apiKey = getProviderKey("fal"); const taskId = String(payload?.taskId || ""); const model = String(payload?.model || "");
  if (!apiKey || !taskId || !model) throw new Error("A fal key, provider task ID, and model are required to refresh this video.");
  // fal's own docs: "the subpath... should be used when making the request,
  // but not when getting request status or results". Empirically confirmed
  // against the live API (not just docs): for fal-ai/bytedance/seedance/v1/
  // pro/text-to-video, only fal-ai/bytedance (owner/app-name, 2 segments)
  // returns 200 on the status endpoint — every deeper prefix 405s. This
  // matches fal's documented model_id convention: "namespace and model name
  // separated by a slash, e.g. fal-ai/fast-sdxl" — anything past that is a
  // submit-time variant path, not part of the app's queue identity.
  const statusAppId = model.split("/").slice(0, 2).join("/");
  const response = await fetch(`https://queue.fal.run/${statusAppId}/requests/${encodeURIComponent(taskId)}/status`, { headers: { Authorization: `Key ${apiKey}` } });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("fal", response, raw));
  let status; try { status = JSON.parse(raw); } catch { throw new Error("fal returned an unreadable task status."); }
  const state = String(status?.status || "").toUpperCase();
  if (state === "IN_QUEUE" || state === "IN_PROGRESS") return { status: "processing", pollAfterSeconds: 6 };
  if (state !== "COMPLETED") return { status: "failed", error: status?.error || "fal could not complete this video." };
  const resultResponse = await fetch(`https://queue.fal.run/${statusAppId}/requests/${encodeURIComponent(taskId)}`, { headers: { Authorization: `Key ${apiKey}` } });
  const resultRaw = await resultResponse.text(); if (!resultResponse.ok) throw new Error(errorForProvider("fal", resultResponse, resultRaw));
  let result; try { result = JSON.parse(resultRaw); } catch { throw new Error("fal returned an unreadable result response."); }
  const asset = await downloadGeneratedVideo(videoUrlsFromResult(result), payload?.title || "fal-shot", "fal");
  return { status: "completed", asset, videoUrl: asset.sourceUrl, generation: { provider: "fal", model, taskId, generatedAt: new Date().toISOString() } };
}
async function requestWaveSpeedImage(payload, prompt) {
  const apiKey = getProviderKey("wavespeed"); if (!apiKey) throw new Error("Connect a WaveSpeed key in Model Hub before generating this shot.");
  const model = String(payload?.settings?.model || "wavespeed-gpt-image-2"); const settings = payload?.settings || {}; const references = imageReferences(payload?.references); const editing = model === "wavespeed-gpt-image-2" && references.length > 0; const endpoint = model === "wavespeed-seedream-v5-pro" ? "https://api.wavespeed.ai/api/v3/bytedance/seedream-v5.0-pro" : `https://api.wavespeed.ai/api/v3/openai/gpt-image-2/${editing ? "edit" : "text-to-image"}`;
  const body = model === "wavespeed-seedream-v5-pro" ? { prompt, aspect_ratio: String(settings.aspectRatio || "16:9"), resolution: String(settings.resolution || "1k").includes("2") ? "2k" : "1k", output_format: "png" } : { prompt, aspect_ratio: String(settings.aspectRatio || "16:9"), resolution: String(settings.resolution || "1k").includes("2") ? "2k" : "1k", quality: settings.quality === "Fast" ? "low" : settings.quality === "High" ? "high" : "medium", output_format: "png", ...(editing ? { images: await uploadWaveSpeedReferences(references.slice(0, 16), apiKey) } : {}) };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 180000);
  try { const response = await fetch(endpoint, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) }); const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("WaveSpeed", response, raw)); let result; try { result = JSON.parse(raw); } catch { throw new Error("WaveSpeed returned an unreadable task response."); } const taskId = result?.data?.id || result?.data?.task_id || result?.id; if (!taskId) throw new Error("WaveSpeed did not return a task id."); let output = null; for (let attempt = 0; attempt < 90; attempt += 1) { await new Promise((resolve) => setTimeout(resolve, 2000)); const poll = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(taskId)}/result`, { signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}` } }); const pollRaw = await poll.text(); if (!poll.ok) throw new Error(errorForProvider("WaveSpeed", poll, pollRaw)); let status; try { status = JSON.parse(pollRaw); } catch { throw new Error("WaveSpeed returned an unreadable task status."); } const data = status?.data || status; const statusValue = String(data?.status || "").toLowerCase(); if (["failed", "error", "canceled"].includes(statusValue)) throw new Error(data?.error || "WaveSpeed image generation failed."); if (["completed", "succeeded", "success"].includes(statusValue)) { output = waveSpeedImageOutputs(data)[0] || null; break; } } if (!output) throw new Error("WaveSpeed did not return an image before the task timed out."); const asset = await saveGeneratedImageUrl(output, payload?.shot?.title, "WaveSpeed", apiKey); markProviderVerified("wavespeed", `Rendered ${model}.`); return { asset, generation: { provider: "wavespeed", model, prompt, taskId, generatedAt: new Date().toISOString() } }; } catch (error) { if (error?.name === "AbortError") throw new Error("WaveSpeed took too long to render this shot. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function requestWaveSpeedGatewayImage(payload, prompt, references) {
  const apiKey = getProviderKey("wavespeed"); if (!apiKey) throw new Error("Connect a WaveSpeed key in Model Hub before generating this shot.");
  const settings = payload?.settings || {}; const model = String(settings.model || "wavespeed-ai/flux-dev");
  const body = { prompt, aspect_ratio: String(settings.aspectRatio || "16:9"), ...(references.length ? { images: await uploadWaveSpeedReferences(references.slice(0, 8), apiKey) } : {}) };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 240000);
  try {
    const response = await fetch(`https://api.wavespeed.ai/api/v3/${model}`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("WaveSpeed", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("WaveSpeed returned an unreadable task response."); }
    const taskId = result?.data?.id || result?.data?.task_id || result?.id; if (!taskId) throw new Error("WaveSpeed did not return a task id.");
    let output = null;
    for (let attempt = 0; attempt < 120; attempt += 1) { await new Promise((resolve) => setTimeout(resolve, 2000)); const poll = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(taskId)}/result`, { signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}` } }); const pollRaw = await poll.text(); if (!poll.ok) throw new Error(errorForProvider("WaveSpeed", poll, pollRaw)); let status; try { status = JSON.parse(pollRaw); } catch { throw new Error("WaveSpeed returned an unreadable task status."); } const data = status?.data || status; const statusValue = String(data?.status || "").toLowerCase(); if (["failed", "error", "canceled"].includes(statusValue)) throw new Error(data?.error || "WaveSpeed image generation failed."); if (["completed", "succeeded", "success"].includes(statusValue)) { output = waveSpeedImageOutputs(data)[0] || null; break; } }
    if (!output) throw new Error("WaveSpeed did not return an image before the task timed out."); const asset = await saveGeneratedImageUrl(output, payload?.shot?.title, "WaveSpeed", apiKey); markProviderVerified("wavespeed", `Rendered ${model}.`); return { asset, generation: { provider: "wavespeed", model, prompt, taskId, generatedAt: new Date().toISOString() } };
  } catch (error) { if (error?.name === "AbortError") throw new Error("WaveSpeed took too long to render this shot. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function submitWaveSpeedShotVideo(payload) {
  const apiKey = getProviderKey("wavespeed"); if (!apiKey) throw new Error("Connect a WaveSpeed key in Model Hub before queueing this shot.");
  const settings = payload?.settings || {}; const model = String(settings.model || "");
  if (!model.includes("/")) throw new Error("Select a WaveSpeed video model before queueing this shot.");
  const allReferences = Array.isArray(payload?.references) ? payload.references : [];
  const startFrame = allReferences.find((reference) => reference?.id && reference.id === settings.startFrameAssetId && reference.kind === "image");
  const endFrame = allReferences.find((reference) => reference?.id && reference.id === settings.endFrameAssetId && reference.kind === "image");
  // Deliberately ordered: specifically selected frames always win over a
  // general reference, which remains guidance rather than becoming a frame.
  const guidanceImages = imageReferences(allReferences.filter((reference) => reference?.role === "image"));
  // WaveSpeed's video schema is `image` (a single string), not an `images`
  // array, and it sizes output with `resolution` rather than `aspect_ratio`.
  // The operation is the last slug segment, and it decides which reference
  // fields the model will accept.
  const operation = model.split("/").pop();
  const body = {
    prompt: resolvedShotPrompt(payload, settings, "video"),
    duration: Math.max(3, Math.min(15, Number(settings.duration) || 5)),
    resolution: waveSpeedVideoResolution(settings),
    ...(settings.negativePrompt ? { negative_prompt: String(settings.negativePrompt) } : {}),
    ...(/^\d+$/.test(String(settings.seed || "")) ? { seed: Number(settings.seed) } : {})
  };
  if (operation.startsWith("image-to-video") || operation === "start-end-to-video") {
    if (!startFrame) throw new Error(`${model} needs a deliberately selected Start Frame.`);
    const sourceFrames = imageReferences(operation === "start-end-to-video" ? [startFrame, endFrame].filter(Boolean) : [startFrame], 2);
    if (!sourceFrames.length) throw new Error("The selected Start Frame is unavailable or cannot be encoded for WaveSpeed.");
    const uploaded = await uploadWaveSpeedReferences(sourceFrames, apiKey);
    body.image = uploaded[0];
    // Only dedicated start/end endpoints receive a second frame. A normal
    // I2V endpoint never gets a silent, unsupported last_image parameter.
    if (operation === "start-end-to-video" && endFrame && uploaded[1]) body.last_image = uploaded[1];
  } else if (operation.startsWith("reference-to-video")) {
    if (!guidanceImages.length) throw new Error(`${model} needs at least one reference image. Select one from Media Library in Director Controls.`);
    body.images = await uploadWaveSpeedReferences(guidanceImages.slice(0, 4), apiKey);
  }
  const response = await fetch(`https://api.wavespeed.ai/api/v3/${model}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) }); const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("WaveSpeed", response, raw)); let result; try { result = JSON.parse(raw); } catch { throw new Error("WaveSpeed accepted the request with an unreadable response."); } const taskId = result?.data?.id || result?.data?.task_id || result?.id; if (!taskId) throw new Error("WaveSpeed did not return a task id."); markProviderVerified("wavespeed", `Queued ${model}.`); return { taskId, status: "queued", pollAfterSeconds: 5 };
}
async function pollWaveSpeedShotVideo(payload) {
  const apiKey = getProviderKey("wavespeed"); const taskId = String(payload?.taskId || ""); if (!apiKey || !taskId) throw new Error("A WaveSpeed key and provider task ID are required to refresh this video."); const response = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(taskId)}/result`, { headers: { Authorization: `Bearer ${apiKey}` } }); const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("WaveSpeed", response, raw)); let result; try { result = JSON.parse(raw); } catch { throw new Error("WaveSpeed returned an unreadable task status."); } const data = result?.data || result; const status = String(data?.status || "processing").toLowerCase(); if (["failed", "error", "canceled", "cancelled", "timeout"].includes(status)) return { status: "failed", error: data?.error || (status === "timeout" ? "WaveSpeed timed out before finishing this video." : "WaveSpeed could not complete this video.") };
  // WaveSpeed's response always includes a self-referential urls.get status
  // link, even while the job is still processing. Searching the whole
  // payload for any https:// string (videoUrlsFromResult) before the job is
  // actually done means that link — which needs the Bearer token, not
  // signed public access — gets mistaken for the finished video and fails
  // with 401 on download. Only look for a real result once WaveSpeed itself
  // reports completion, and prefer the documented `outputs` field over a
  // generic recursive search of the whole response.
  if (status !== "succeeded" && status !== "completed") return { status: "processing", pollAfterSeconds: 5 };
  const outputs = Array.isArray(data?.outputs) ? data.outputs.filter((url) => /^https?:\/\//i.test(String(url || ""))) : [];
  const videoUrls = outputs.length ? outputs : videoUrlsFromResult({ ...data, urls: undefined });
  if (!videoUrls.length) return { status: "failed", error: "WaveSpeed completed without a video URL." };
  const asset = await downloadGeneratedVideo(videoUrls, payload?.title || "wavespeed-shot", "WaveSpeed"); return { status: "completed", asset, videoUrl: asset.sourceUrl, generation: { provider: "wavespeed", model: payload?.model || "wavespeed-ai/wan-2.1-i2v-720p", taskId, generatedAt: new Date().toISOString() } };
}
// Kie is a per-model gateway: each product (Veo, GPT-4o Image, Runway, ...)
// has its own submit/poll endpoint under api.kie.ai, rather than one path
// parameterized by model id the way WaveSpeed works. Local references need a
// public URL first, uploaded through Kie's separate file-stream host.
async function uploadKieMedia(reference, apiKey) {
  const form = new FormData();
  form.append("file", new Blob([Buffer.from(reference.data, "base64")], { type: reference.mime }), reference.name || "reference");
  // uploadPath is a required field per Kie's File Stream Upload contract
  // (docs.kie.ai/file-upload-api/upload-file-stream) — without it the
  // endpoint 400s with "Missing required parameter: uploadPath" before ever
  // reaching the part of the response this function actually parses.
  form.append("uploadPath", "storymaker-references");
  form.append("fileName", reference.name || `reference-${Date.now()}`);
  const response = await fetch("https://kieai.redpandaai.co/api/file-stream-upload", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form });
  const raw = await response.text();
  if (!response.ok) throw new Error(errorForProvider("Kie media upload", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie returned an unreadable media upload response."); }
  const url = result?.data?.fileUrl || result?.data?.downloadUrl;
  if (!url) throw new Error(`Kie accepted ${reference.name || "a reference"} without returning a usable file URL.`);
  return url;
}
function uploadKieReferences(references, apiKey) {
  return Promise.all(references.map((reference) => uploadKieMedia(reference, apiKey)));
}
function kieVideoResolution(settings) {
  const requested = `${settings?.resolution || ""} ${settings?.quality || ""}`.toLowerCase();
  if (/4k/.test(requested)) return "4k";
  return /1080|1920|high/.test(requested) ? "1080p" : "720p";
}
async function requestKieImage(payload, prompt, references) {
  const apiKey = getProviderKey("kie");
  if (!apiKey) throw new Error("Connect a Kie API key in Model Hub before generating this shot.");
  const settings = payload?.settings || {};
  // GPT-4o Image only accepts three fixed sizes, unlike every other adapter's
  // free aspect ratio — clamp rather than send an unsupported value.
  const size = settings.aspectRatio === "9:16" ? "2:3" : settings.aspectRatio === "16:9" ? "3:2" : "1:1";
  const body = { prompt, size, ...(references.length ? { filesUrl: await uploadKieReferences(references.slice(0, 5), apiKey) } : {}) };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch("https://api.kie.ai/api/v1/gpt4o-image/generate", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
    const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Kie", response, raw));
    let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie returned an unreadable task response."); }
    const taskId = result?.data?.taskId; if (!taskId) throw new Error("Kie did not return a task id.");
    let output = null;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const poll = await fetch(`https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`, { signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}` } });
      const pollRaw = await poll.text(); if (!poll.ok) throw new Error(errorForProvider("Kie", poll, pollRaw));
      let status; try { status = JSON.parse(pollRaw); } catch { throw new Error("Kie returned an unreadable task status."); }
      const data = status?.data || {};
      if (data.successFlag === 2 || data.successFlag === 3) throw new Error(data.errorMessage || "Kie image generation failed.");
      const urls = data?.response?.result_urls;
      if (data.successFlag === 1 && Array.isArray(urls) && urls[0]) { output = urls[0]; break; }
    }
    if (!output) throw new Error("Kie did not return an image before the task timed out.");
    const asset = await saveGeneratedImageUrl(output, payload?.shot?.title, "Kie");
    markProviderVerified("kie", "Rendered GPT-4o Image."); return { asset, generation: { provider: "kie", model: "kie-gpt4o-image", prompt, taskId, generatedAt: new Date().toISOString() } };
  } catch (error) { if (error?.name === "AbortError") throw new Error("Kie took too long to render this shot. Please retry."); throw error; } finally { clearTimeout(timeout); }
}
async function submitKieShotVideo(payload) {
  const marketModel = KIE_MARKET_MODEL_IDS[String(payload?.settings?.model || "")];
  if (marketModel) return submitKieMarketVideo(payload, marketModel);
  return submitKieVeoVideo(payload);
}
async function submitKieVeoVideo(payload) {
  const apiKey = getProviderKey("kie");
  if (!apiKey) throw new Error("Connect a Kie API key in Model Hub before queueing this shot.");
  const settings = payload?.settings || {};
  const references = imageReferences(payload?.references);
  const imageUrls = references.length ? await uploadKieReferences(references.slice(0, 3), apiKey) : [];
  const duration = [4, 6, 8].reduce((closest, value) => Math.abs(value - (Number(settings.duration) || 8)) < Math.abs(closest - (Number(settings.duration) || 8)) ? value : closest, 8);
  const body = {
    prompt: resolvedShotPrompt(payload, settings, "video"),
    model: settings.quality === "High" ? "veo3" : "veo3_fast",
    aspect_ratio: ["16:9", "9:16"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "Auto",
    resolution: kieVideoResolution(settings),
    duration,
    ...(imageUrls.length ? { imageUrls, generationType: "REFERENCE_2_VIDEO" } : {})
  };
  const response = await fetch("https://api.kie.ai/api/v1/veo/generate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Kie", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie accepted the request with an unreadable response."); }
  const taskId = result?.data?.taskId; if (!taskId) throw new Error("Kie did not return a task id.");
  markProviderVerified("kie", "Queued Veo 3.1."); return { taskId, status: "queued", pollAfterSeconds: 8 };
}
async function pollKieShotVideo(payload) {
  const marketModel = KIE_MARKET_MODEL_IDS[String(payload?.model || "")];
  if (marketModel) return pollKieMarketVideo(payload, marketModel);
  return pollKieVeoVideo(payload);
}
async function pollKieVeoVideo(payload) {
  const apiKey = getProviderKey("kie"); const taskId = String(payload?.taskId || ""); if (!apiKey || !taskId) throw new Error("A Kie key and provider task ID are required to refresh this video.");
  const response = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${encodeURIComponent(taskId)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Kie", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie returned an unreadable task status."); }
  const data = result?.data || {};
  if (data.successFlag === 2 || data.successFlag === 3) return { status: "failed", error: data.errorMessage || "Kie could not complete this video." };
  if (data.successFlag !== 1) return { status: "processing", pollAfterSeconds: 8 };
  const asset = await downloadGeneratedVideo(videoUrlsFromResult(data?.response || data), payload?.title || "kie-shot", "Kie");
  return { status: "completed", asset, videoUrl: asset.sourceUrl, generation: { provider: "kie", model: "kie-veo-3.1", taskId, generatedAt: new Date().toISOString() } };
}
// Kie's newer "Market" catalog (Kling, Seedance) runs through one generic
// task API rather than Veo's dedicated endpoint above — verified separately
// against Kie's own per-model docs, not assumed to share Veo's contract.
// Catalog ids deliberately contain "video" / "t2v" / "i2v" so the substring
// heuristic in preflightShot (below) classifies them as video without a
// separate provider-specific branch.
const KIE_MARKET_MODEL_IDS = { "kie-kling-2.6-t2v": "kling-2.6/text-to-video", "kie-kling-2.6-i2v": "kling-2.6/image-to-video", "kie-seedance-2-video": "bytedance/seedance-2" };
function kieMarketInput(model, prompt, settings, imageUrls, frameUrls = {}) {
  if (model.startsWith("kling-2.6")) {
    const duration = String(falClosestEnum(settings.duration, [5, 10], 5));
    const input = { prompt, duration, sound: Boolean(settings.audioInstruction) };
    if (model.endsWith("text-to-video")) input.aspect_ratio = ["1:1", "16:9", "9:16"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "16:9";
    else input.image_urls = imageUrls.slice(0, 1);
    return input;
  }
  // bytedance/seedance-2: one model id covers both text-to-video and
  // image-to-video — first_frame_url is simply omitted for text-to-video.
  const input = {
    prompt,
    aspect_ratio: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"].includes(String(settings.aspectRatio)) ? settings.aspectRatio : "16:9",
    resolution: ["480p", "720p", "1080p", "4k"].includes(String(settings.resolution)) ? settings.resolution : "720p",
    duration: falClosestEnum(settings.duration, Array.from({ length: 12 }, (_, index) => index + 4), 5),
    generate_audio: Boolean(settings.audioInstruction)
  };
  if (frameUrls.startFrameUrl || imageUrls.length) input.first_frame_url = frameUrls.startFrameUrl || imageUrls[0];
  if (frameUrls.endFrameUrl) input.last_frame_url = frameUrls.endFrameUrl;
  return input;
}
async function submitKieMarketVideo(payload, kieModel) {
  const apiKey = getProviderKey("kie"); if (!apiKey) throw new Error("Connect a Kie API key in Model Hub before queueing this shot.");
  const settings = payload?.settings || {};
  const prompt = resolvedShotPrompt(payload, settings, "video");
  const allReferences = Array.isArray(payload?.references) ? payload.references : [];
  const startFrame = allReferences.find((reference) => reference?.id && reference.id === settings.startFrameAssetId && reference.kind === "image");
  const endFrame = allReferences.find((reference) => reference?.id && reference.id === settings.endFrameAssetId && reference.kind === "image");
  const guidanceImages = imageReferences(allReferences.filter((reference) => reference?.role === "image"));
  // Kie's I2V contracts accept one source image. The selected Start Frame is
  // that source; a general guidance image must never silently replace it.
  const imageToVideo = String(settings.mode) === "image-to-video" || kieModel.endsWith("image-to-video");
  const references = imageToVideo
    ? imageReferences([startFrame, endFrame].filter(Boolean), 2)
    : guidanceImages.slice(0, 1);
  const imageUrls = references.length ? await uploadKieReferences(references, apiKey) : [];
  const frameUrls = { startFrameUrl: startFrame ? imageUrls[references.findIndex((reference) => reference.id === startFrame.id)] : "", endFrameUrl: endFrame ? imageUrls[references.findIndex((reference) => reference.id === endFrame.id)] : "" };
  const body = { model: kieModel, input: kieMarketInput(kieModel, prompt, settings, imageUrls, frameUrls) };
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Kie", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie accepted the request with an unreadable response."); }
  const taskId = result?.data?.taskId; if (!taskId) throw new Error("Kie did not return a task id.");
  markProviderVerified("kie", `Queued ${kieModel}.`); return { taskId, status: "queued", pollAfterSeconds: 8 };
}
async function pollKieMarketVideo(payload, kieModel) {
  const apiKey = getProviderKey("kie"); const taskId = String(payload?.taskId || ""); if (!apiKey || !taskId) throw new Error("A Kie key and provider task ID are required to refresh this video.");
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  const raw = await response.text(); if (!response.ok) throw new Error(errorForProvider("Kie", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("Kie returned an unreadable task status."); }
  const data = result?.data || {};
  if (data.state === "fail") return { status: "failed", error: data.failMsg || "Kie could not complete this video." };
  if (data.state !== "success") return { status: "processing", pollAfterSeconds: 8 };
  let parsedResult; try { parsedResult = JSON.parse(data.resultJson || "{}"); } catch { throw new Error("Kie returned an unreadable result payload."); }
  const asset = await downloadGeneratedVideo(videoUrlsFromResult(parsedResult), payload?.title || "kie-shot", "Kie");
  return { status: "completed", asset, videoUrl: asset.sourceUrl, generation: { provider: "kie", model: kieModel, taskId, generatedAt: new Date().toISOString() } };
}
// Retired: native ByteDance ModelArk (Seedance direct) and Kling Open Platform
// (Kling direct) adapters. Both are covered through the fal/Kie/WaveSpeed
// gateways instead — see falVideoBody, kieMarketInput, and the WaveSpeed
// gateway catalog — which need only the three gateway credentials rather
// than a fourth and fifth provider key.
// WaveSpeed does not accept data: URIs for media inputs — only URLs. Local
// references must go through the media endpoint first, which returns a URL that
// lives for 7 days: far longer than any render, and it means a retry of the
// same shot re-uploads rather than reusing a stale link.
async function uploadWaveSpeedMedia(reference, apiKey) {
  const form = new FormData();
  form.append("file", new Blob([Buffer.from(reference.data, "base64")], { type: reference.mime }), reference.name || "reference");
  // Content-Type is deliberately unset so fetch writes its own multipart boundary.
  const response = await fetch("https://api.wavespeed.ai/api/v3/media/upload/binary", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form });
  const raw = await response.text();
  if (!response.ok) throw new Error(errorForProvider("WaveSpeed media upload", response, raw));
  let result; try { result = JSON.parse(raw); } catch { throw new Error("WaveSpeed returned an unreadable media upload response."); }
  const url = result?.data?.download_url || result?.data?.url;
  if (!url) throw new Error(`WaveSpeed accepted ${reference.name || "a reference"} without returning a media URL.`);
  return url;
}
function uploadWaveSpeedReferences(references, apiKey) {
  return Promise.all(references.map((reference) => uploadWaveSpeedMedia(reference, apiKey)));
}
// WaveSpeed video models advertise 720p / 1080p; anything else is clamped.
function waveSpeedVideoResolution(settings) {
  const requested = `${settings?.resolution || ""} ${settings?.quality || ""}`.toLowerCase();
  return /1080|1920|high|4k/.test(requested) ? "1080p" : "720p";
}
async function submitShotVideo(payload) {
  validateGenerationRequest(payload, "video");
  const provider = String(payload?.settings?.provider || "");
  if (provider === "comfyui") {
    // Bring up the managed headless engine if nothing is already serving,
    // so a local shot "just works" without the user starting ComfyUI.
    await ensureLocalEngineFor(String(payload?.settings?.model || ""));
    return String(payload?.settings?.model || "") === "local-ltxv2b-0.9.8-distilled" ? requestComfyUiLtxVideo(payload) : requestComfyUiVideo(payload);
  }
  if (provider === "wavespeed") return submitWaveSpeedShotVideo(payload);
  if (provider === "kie") return submitKieShotVideo(payload);
  if (provider === "fal") return submitFalShotVideo(payload);
  throw new Error("This model does not use the Storymaker video job system.");
}
async function pollShotVideo(payload) {
  const provider = String(payload?.provider || "");
  if (provider === "wavespeed") return pollWaveSpeedShotVideo(payload);
  if (provider === "kie") return pollKieShotVideo(payload);
  if (provider === "fal") return pollFalShotVideo(payload);
  throw new Error("This queued video has no recognized provider.");
}
function preflightCheck(level, label, message) { return { level, label, message }; }
function preflightShot(payload) {
  const settings = payload?.settings || {};
  const provider = String(settings.provider || "");
  const model = String(settings.model || "");
  const checks = [];
  const capability = modelCapability(model, provider);
  const isVideo = String(capability.output || "").toLowerCase() === "video";
  const prompt = String(settings.prompt || payload?.shot?.purpose || "").trim();
  checks.push(prompt ? preflightCheck("pass", "Prompt", "A shot prompt is ready to send.") : preflightCheck("error", "Prompt", "Write a shot prompt before generating."));
  checks.push(provider
    ? provider === "comfyui"
      ? preflightCheck("pass", "Local engine", "ComfyUI will be checked on this PC before submission; no API key is required.")
      : getProviderKey(provider)
        ? preflightCheck("pass", "Provider", `${provider === "google" ? "Google AI" : provider[0].toUpperCase() + provider.slice(1)} credentials are saved locally.`)
        : preflightCheck("error", "Provider", `Connect ${provider === "google" ? "Google AI" : provider[0].toUpperCase() + provider.slice(1)} in Model Hub before generating.`)
    : preflightCheck("error", "Provider", "Select a model before generating."));
  if (isVideo) {
    const duration = Number(settings.duration || 0);
    const [minimum, maximum] = capability.duration || [3, 15];
    checks.push(duration >= minimum && duration <= maximum ? preflightCheck("pass", "Duration", `${duration} seconds is within the ${model} range.`) : preflightCheck("error", "Duration", `Choose a duration from ${minimum} to ${maximum} seconds for ${model}.`));
  }
  if (["wavespeed", "kie", "fal"].includes(provider) && isVideo) checks.push(preflightCheck("pass", "Output", `This shot will queue a ${provider} video task and return the result to this project.`));
  if (provider === "comfyui" && isVideo) checks.push(preflightCheck("pass", "Output", `This shot will animate its deliberately selected Start Frame privately through the local ${model === "local-ltxv2b-0.9.8-distilled" ? "LTX-Video" : "Wan"} workflow.`));
  if (["openai", "google"].includes(provider)) {
    checks.push(preflightCheck("pass", "Output", "This shot will render as a still image and return to review."));
  }
  if (provider === "wavespeed" && !isVideo) checks.push(preflightCheck("pass", "Output", "This shot will render through the WaveSpeed model gateway and return to review."));
  if (provider === "comfyui" && !isVideo) checks.push(preflightCheck("pass", "Output", "This shot will render privately through ComfyUI and return to the same project review flow."));
  const errors = checks.filter((check) => check.level === "error");
  return { ready: !errors.length, checkedAt: new Date().toISOString(), provider, model, checks, errors: errors.map((check) => check.message), warnings: checks.filter((check) => check.level === "warning").map((check) => check.message) };
}
// EmptySD3LatentImage (used for FLUX below) also requires width and height
// each divisible by 16 — it divides both by that factor internally to size
// the latent. Every case here was already a clean multiple of 16 except
// 3:2's height: 680/16 = 42.5. Of the two neighboring multiples of 16
// (672, 688), 688 lands closer to true 3:2 (1024/688 ≈ 1.488 vs.
// 1024/672 ≈ 1.524; target is 1.5).
function comfyImageDimensions(settings) {
  const aspect = String(settings?.aspectRatio || "16:9");
  if (aspect === "1:1") return { width: 1024, height: 1024 };
  if (aspect === "9:16" || aspect === "2:3") return { width: 576, height: 1024 };
  if (aspect === "3:2") return { width: 1024, height: 688 };
  return { width: 1024, height: 576 };
}
async function requestComfyUiImage(payload, prompt) {
  const settings = payload?.settings || {};
  const baseUrl = await activeComfyUiBaseUrl();
  const model = "flux1-schnell-fp8.safetensors";
  const objectInfo = await fetchLocalJson(`${baseUrl}/object_info/CheckpointLoaderSimple`, 10000);
  const checkpoints = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
  if (!Array.isArray(checkpoints) || !checkpoints.includes(model)) {
    throw new Error(`ComfyUI is running, but ${model} is not installed yet.`);
  }
  const { width, height } = comfyImageDimensions(settings);
  const seed = Number.isFinite(Number(settings.seed)) && String(settings.seed).trim()
    ? Math.max(0, Math.floor(Number(settings.seed)))
    : Math.floor(Math.random() * 2147483647);
  const negative = compact(settings.negativePrompt || "text, watermark, logo, split panels, malformed anatomy", 900);
  const workflow = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: model } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "4": { class_type: "EmptySD3LatentImage", inputs: { width, height, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 4, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { filename_prefix: "Storymaker/shot", images: ["6", 0] } }
  };
  const submitted = await fetchLocalJson(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: generationId("storymaker") })
  }, 15000);
  const promptId = String(submitted?.prompt_id || "");
  if (!promptId) throw new Error(`ComfyUI rejected the workflow: ${JSON.stringify(submitted?.node_errors || submitted).slice(0, 500)}`);
  const deadline = Date.now() + 15 * 60 * 1000;
  let image = null;
  while (Date.now() < deadline) {
    const history = await fetchLocalJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`, 10000);
    const record = history?.[promptId];
    if (record?.status?.status_str === "error") throw new Error("ComfyUI failed this local image workflow. Open its queue for node-level details.");
    const images = Object.values(record?.outputs || {}).flatMap((output) => Array.isArray(output?.images) ? output.images : []);
    if (images.length) { image = images[0]; break; }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  if (!image) throw new Error("ComfyUI did not finish the local image within 15 minutes.");
  const params = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || "", type: image.type || "output" });
  const response = await fetch(`${baseUrl}/view?${params}`);
  if (!response.ok) throw new Error(`ComfyUI completed the workflow, but its image could not be downloaded (${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) throw new Error("ComfyUI returned an invalid local image file.");
  const asset = saveGeneratedImage(buffer.toString("base64"), payload?.shot?.title || "shot");
  return {
    asset,
    generation: {
      provider: "comfyui",
      model: String(settings.model || "local-flux1-schnell-fp8"),
      checkpoint: model,
      prompt,
      size: `${width}x${height}`,
      seed,
      local: true,
      generatedAt: new Date().toISOString()
    }
  };
}
function comfyVideoDimensions(settings) {
  const aspect = String(settings?.aspectRatio || "16:9");
  if (aspect === "9:16") return { width: 272, height: 480 };
  if (aspect === "1:1") return { width: 384, height: 384 };
  return { width: 480, height: 272 };
}
async function uploadComfyUiImage(baseUrl, reference) {
  const filePath = String(reference?.path || "");
  if (!filePath || !fs.existsSync(filePath) || !imageMimeType(filePath)) throw new Error("The selected local Start Frame is unavailable.");
  const form = new FormData();
  form.append("image", new Blob([fs.readFileSync(filePath)], { type: imageMimeType(filePath) }), path.basename(filePath));
  form.append("type", "input");
  form.append("overwrite", "true");
  const uploaded = await fetchLocalJson(`${baseUrl}/upload/image`, { method: "POST", body: form }, 60000);
  if (!uploaded?.name) throw new Error("ComfyUI could not stage the selected frame for local video generation.");
  return String(uploaded.name);
}
async function requestComfyUiVideo(payload) {
  const settings = payload?.settings || {};
  const references = Array.isArray(payload?.references) ? payload.references : [];
  const startFrame = references.find((reference) => reference?.role === "start-frame" && reference?.kind === "image");
  const endFrame = references.find((reference) => reference?.role === "end-frame" && reference?.kind === "image");
  if (!startFrame) throw new Error("Local image-to-video requires a deliberately selected Start Frame.");
  const baseUrl = await activeComfyUiBaseUrl();
  const objectInfo = await fetchLocalJson(`${baseUrl}/object_info`, 30000);
  const optionList = (node, input) => {
    const options = objectInfo?.[node]?.input?.required?.[input]?.[0];
    return Array.isArray(options) ? options.map(String) : [];
  };
  const model = "wan2.1_fun_inp_1.3B_bf16.safetensors";
  const textEncoder = "umt5_xxl_fp8_e4m3fn_scaled.safetensors";
  const vae = "wan_2.1_vae.safetensors";
  const clipVision = "clip_vision_h.safetensors";
  const missing = [
    [optionList("UNETLoader", "unet_name"), model],
    [optionList("CLIPLoader", "clip_name"), textEncoder],
    [optionList("VAELoader", "vae_name"), vae],
    [optionList("CLIPVisionLoader", "clip_name"), clipVision]
  ].filter(([options, name]) => !options.includes(name)).map(([, name]) => name);
  if (missing.length || !objectInfo?.WanFunInpaintToVideo) throw new Error(`The local Wan video workflow is not fully installed.${missing.length ? ` Missing: ${missing.join(", ")}.` : ""}`);
  const startImage = await uploadComfyUiImage(baseUrl, startFrame);
  const endImage = endFrame ? await uploadComfyUiImage(baseUrl, endFrame) : "";
  const { width, height } = comfyVideoDimensions(settings);
  const duration = Math.max(2, Math.min(5, Number(settings.duration) || 3));
  const length = Math.round(duration * 16 / 4) * 4 + 1;
  const seed = Number.isFinite(Number(settings.seed)) && String(settings.seed).trim()
    ? Math.max(0, Math.floor(Number(settings.seed)))
    : Math.floor(Math.random() * 2147483647);
  const prompt = compact(settings.videoPrompt || settings.prompt || payload?.shot?.purpose || "Subtle cinematic motion", 6000);
  const negative = compact(settings.negativePrompt || "camera shake, scene change, cuts, text, subtitles, logo, watermark, malformed anatomy, duplicated subject, distorted face", 1500);
  const workflow = {
    "3": { class_type: "KSampler", inputs: { seed, steps: 12, cfg: 6, sampler_name: "uni_pc", scheduler: "simple", denoise: 1, model: ["66", 0], positive: ["76", 0], negative: ["76", 1], latent_image: ["76", 2] } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["38", 0] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["38", 0] } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["39", 0] } },
    "27": { class_type: "CreateVideo", inputs: { images: ["8", 0], fps: 16 } },
    "28": { class_type: "SaveVideo", inputs: { video: ["27", 0], filename_prefix: "Storymaker/local-wan", format: "mp4", codec: "h264" } },
    "37": { class_type: "UNETLoader", inputs: { unet_name: model, weight_dtype: "default" } },
    "38": { class_type: "CLIPLoader", inputs: { clip_name: textEncoder, type: "wan", device: "default" } },
    "39": { class_type: "VAELoader", inputs: { vae_name: vae } },
    "49": { class_type: "CLIPVisionLoader", inputs: { clip_name: clipVision } },
    "51": { class_type: "CLIPVisionEncode", inputs: { crop: "none", clip_vision: ["49", 0], image: ["52", 0] } },
    "52": { class_type: "LoadImage", inputs: { image: startImage } },
    "65": { class_type: "SkipLayerGuidanceDiT", inputs: { double_layers: "9,10", single_layers: "9,10", scale: 3, start_percent: 0.01, end_percent: 0.8, rescaling_scale: 0, model: ["37", 0] } },
    "66": { class_type: "CFGZeroStar", inputs: { model: ["68", 0] } },
    "67": { class_type: "ModelSamplingSD3", inputs: { shift: 5, model: ["65", 0] } },
    "68": { class_type: "UNetTemporalAttentionMultiply", inputs: { self_structural: 1, self_temporal: 1, cross_structural: 1.2, cross_temporal: 1.3, model: ["67", 0] } },
    "76": { class_type: "WanFunInpaintToVideo", inputs: { width, height, length, batch_size: 1, positive: ["6", 0], negative: ["7", 0], vae: ["39", 0], clip_vision_output: ["51", 0], start_image: ["52", 0], ...(endImage ? { end_image: ["72", 0] } : {}) } },
    ...(endImage ? { "72": { class_type: "LoadImage", inputs: { image: endImage } } } : {})
  };
  const submitted = await fetchLocalJson(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: generationId("storymaker-video") })
  }, 30000);
  const promptId = String(submitted?.prompt_id || "");
  if (!promptId) throw new Error(`ComfyUI rejected the local video workflow: ${JSON.stringify(submitted?.node_errors || submitted).slice(0, 900)}`);
  const deadline = Date.now() + 30 * 60 * 1000;
  let output = null;
  while (Date.now() < deadline) {
    const history = await fetchLocalJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`, 15000);
    const record = history?.[promptId];
    if (record?.status?.status_str === "error") throw new Error(`ComfyUI failed the local video workflow: ${JSON.stringify(record.status?.messages || record.status).slice(0, 900)}`);
    const outputs = Object.values(record?.outputs || {}).flatMap((item) => [
      ...(Array.isArray(item?.images) ? item.images : []),
      ...(Array.isArray(item?.gifs) ? item.gifs : []),
      ...(Array.isArray(item?.videos) ? item.videos : [])
    ]);
    if (outputs.length) { output = outputs[0]; break; }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (!output) throw new Error("ComfyUI did not finish the local video within 30 minutes.");
  const query = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || "", type: output.type || "output" });
  const response = await fetch(`${baseUrl}/view?${query}`);
  if (!response.ok) throw new Error(`ComfyUI completed the workflow, but its animation could not be downloaded (${response.status}).`);
  const asset = saveGeneratedVideo(Buffer.from(await response.arrayBuffer()), payload?.shot?.title || "local-wan-shot", { mimeType: "video/mp4" });
  return {
      asset,
      status: "completed",
      generation: {
        provider: "comfyui",
        model: String(settings.model || "local-wan21-fun-inp-1.3b"),
        checkpoint: model,
        promptId,
        prompt,
        size: `${width}x${height}`,
        duration,
        fps: 16,
        seed,
        sourceFrameAssetId: startFrame.id || "",
        endFrameAssetId: endFrame?.id || "",
        local: true,
        generatedAt: new Date().toISOString()
      }
    };
}
// LTX-Video's LTXVImgToVideo node requires width and height EACH divisible
// by 32 — its latent path uses height//32 and width//32 internally, and it
// fails outright on an off-grid value rather than rounding it. Wan's
// comfyVideoDimensions() below returns 272 for its short edge, which is
// fine for Wan (its VAE only needs multiples of 8, and that value was
// live-validated) but not divisible by 32 — every local LTX-Video render
// at 16:9 or 9:16 would have failed at the ComfyUI node level. Confirmed
// against ComfyUI-LTXVideo's own issue tracker and docs.comfy.org's
// LTXVImgToVideo reference. Kept as its own function, not shared with
// Wan's, so this fix can never regress Wan's already-validated dimensions.
function comfyLtxDimensions(settings) {
  const aspect = String(settings?.aspectRatio || "16:9");
  if (aspect === "9:16") return { width: 256, height: 448 };
  if (aspect === "1:1") return { width: 384, height: 384 };
  return { width: 448, height: 256 };
}
async function requestComfyUiLtxVideo(payload) {
  const settings = payload?.settings || {};
  const references = Array.isArray(payload?.references) ? payload.references : [];
  const startFrame = references.find((reference) => reference?.role === "start-frame" && reference?.kind === "image");
  if (!startFrame) throw new Error("Local image-to-video requires a deliberately selected Start Frame.");
  const baseUrl = await activeComfyUiBaseUrl();
  const objectInfo = await fetchLocalJson(`${baseUrl}/object_info/CheckpointLoaderSimple`, 10000);
  const checkpoints = objectInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
  // Managed downloads place the bf16 distilled checkpoint; a hand-set-up
  // ComfyUI often has the community fp8 quant. Either drives the workflow.
  const checkpoint = LTX_CHECKPOINT_NAMES.find((name) => Array.isArray(checkpoints) && checkpoints.includes(name));
  if (!checkpoint) throw new Error(`ComfyUI is running, but the LTX-Video 2B checkpoint (${LTX_CHECKPOINT_NAMES.join(" or ")}) is not installed yet.`);
  const startImage = await uploadComfyUiImage(baseUrl, startFrame);
  const { width, height } = comfyLtxDimensions(settings);
  const duration = Math.max(2, Math.min(5, Number(settings.duration) || 3));
  const frameRate = 25;
  const length = Math.round(duration * frameRate / 8) * 8 + 1;
  const seed = Number.isFinite(Number(settings.seed)) && String(settings.seed).trim()
    ? Math.max(0, Math.floor(Number(settings.seed)))
    : Math.floor(Math.random() * 2147483647);
  const prompt = compact(settings.videoPrompt || settings.prompt || payload?.shot?.purpose || "Subtle cinematic motion", 6000);
  const negative = compact(settings.negativePrompt || "camera shake, scene change, cuts, text, subtitles, logo, watermark, malformed anatomy, duplicated subject, distorted face, low quality, worst quality", 1500);
  const textEncoder = "t5xxl_fp8_e4m3fn.safetensors";
  const textEncoders = await fetchLocalJson(`${baseUrl}/object_info/CLIPLoader`, 10000).then((info) => info?.CLIPLoader?.input?.required?.clip_name?.[0] || []);
  if (!Array.isArray(textEncoders) || !textEncoders.includes(textEncoder)) throw new Error(`ComfyUI is running, but ${textEncoder} is not installed yet.`);
  const workflow = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: checkpoint } },
    "cl": { class_type: "CLIPLoader", inputs: { clip_name: textEncoder, type: "ltxv" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["cl", 0] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["cl", 0] } },
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
    "14": { class_type: "SaveVideo", inputs: { video: ["13", 0], filename_prefix: "Storymaker/local-ltx", format: "mp4", codec: "h264" } }
  };
  const submitted = await fetchLocalJson(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: generationId("storymaker-ltx-video") })
  }, 30000);
  const promptId = String(submitted?.prompt_id || "");
  if (!promptId) throw new Error(`ComfyUI rejected the local LTX-Video workflow: ${JSON.stringify(submitted?.node_errors || submitted).slice(0, 900)}`);
  const deadline = Date.now() + 30 * 60 * 1000;
  let output = null;
  while (Date.now() < deadline) {
    const history = await fetchLocalJson(`${baseUrl}/history/${encodeURIComponent(promptId)}`, 15000);
    const record = history?.[promptId];
    if (record?.status?.status_str === "error") throw new Error(`ComfyUI failed the local LTX-Video workflow: ${JSON.stringify(record.status?.messages || record.status).slice(0, 900)}`);
    const outputs = Object.values(record?.outputs || {}).flatMap((item) => [
      ...(Array.isArray(item?.images) ? item.images : []),
      ...(Array.isArray(item?.gifs) ? item.gifs : []),
      ...(Array.isArray(item?.videos) ? item.videos : [])
    ]);
    if (outputs.length) { output = outputs[0]; break; }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (!output) throw new Error("ComfyUI did not finish the local LTX-Video within 30 minutes.");
  const query = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || "", type: output.type || "output" });
  const response = await fetch(`${baseUrl}/view?${query}`);
  if (!response.ok) throw new Error(`ComfyUI completed the workflow, but its animation could not be downloaded (${response.status}).`);
  const asset = saveGeneratedVideo(Buffer.from(await response.arrayBuffer()), payload?.shot?.title || "local-ltx-shot", { mimeType: "video/mp4" });
  return {
    asset,
    status: "completed",
    generation: {
      provider: "comfyui",
      model: String(settings.model || "local-ltxv2b-0.9.8-distilled"),
      checkpoint,
      promptId,
      prompt,
      size: `${width}x${height}`,
      duration,
      fps: frameRate,
      seed,
      sourceFrameAssetId: startFrame.id || "",
      local: true,
      generatedAt: new Date().toISOString()
    }
  };
}
// The renderer's "AUTHORITATIVE MODEL-READY PROMPTS" boxes (Shot Director's
// Image/Video Generation Package) are a full, independently-composed
// prompt — including character continuity, style DNA, and the acting
// direction paragraph — built by productionPromptFor() and preserved
// correctly through every save (collectSettings() only falls back to a
// fresh recompile when the box is empty). But several submit paths here
// called shotImagePrompt() directly instead of reading it, silently
// discarding any edit the user made to that "authoritative" text with no
// indication anything was wrong. shotImagePrompt() builds its own full
// context from scratch — it's not a drop-in single input, so the fix is to
// use the renderer's finished prompt as-is when one exists, and only fall
// back to a fresh compile for a shot that's never had one built.
function resolvedShotPrompt(payload, settings, kind) {
  const precomputed = String((kind === "video" ? settings?.videoPrompt : settings?.imagePrompt) || "").trim();
  const base = precomputed || shotImagePrompt(payload?.project || {}, payload?.scene || {}, payload?.shot || {}, settings);
  const styleLock = styleEnforcementPrompt(payload, settings, kind);
  return styleLock ? `${styleLock}\n\n${base}` : base;
}
async function requestShotImage(payload) {
  validateGenerationRequest(payload, "image");
  const settings = payload?.settings || {};
  const provider = String(settings.provider || "");
  const prompt = resolvedShotPrompt(payload, settings, "image");
  const references = imageReferences(payload?.references);
  if (provider === "openai") return requestOpenAIShotImage(payload, prompt, references);
  if (provider === "google") return requestGoogleShotImage(payload, prompt, references);
  if (provider === "fal") return requestFalImage(payload, prompt, references);
  // A slash means a WaveSpeed gateway path ({vendor}/{model}/{operation}); the
  // two bespoke ids (wavespeed-gpt-image-2, wavespeed-seedream-v5-pro) have
  // none. Matching on the slash rather than a "wavespeed-ai/" prefix keeps this
  // correct once gateway ids are replaced with their real vendor namespaces.
  if (provider === "wavespeed") return String(settings.model || "").includes("/") ? requestWaveSpeedGatewayImage(payload, prompt, references) : requestWaveSpeedImage(payload, prompt);
  if (provider === "kie") return requestKieImage(payload, prompt, references);
  if (provider === "comfyui") {
    if (references.length) throw new Error("This first local FLUX workflow is text-to-image only. Remove references or choose a compatible cloud image model.");
    await ensureLocalEngineFor(String(settings.model || ""));
    return requestComfyUiImage(payload, prompt);
  }
  throw new Error("This provider does not have an image adapter. Select a live model from Model Hub.");
}
const writeAtomic = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = `${file}.tmp-${process.pid}`; const h = fs.openSync(tmp, "w"); try { fs.writeSync(h, `${JSON.stringify(value, null, 2)}\n`, "utf8"); fs.fsyncSync(h); } finally { fs.closeSync(h); } if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`); fs.renameSync(tmp, file); };
const readSafe = (file) => { try { return { value: JSON.parse(fs.readFileSync(file, "utf8")), recovered: false }; } catch (error) { const backup = `${file}.bak`; if (!fs.existsSync(backup)) throw error; return { value: JSON.parse(fs.readFileSync(backup, "utf8")), recovered: true }; } };
const mediaKind = (file) => {
  const ext = path.extname(file).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv", ".flv", ".wmv", ".mpeg", ".mpg"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".aiff", ".aif", ".wma"].includes(ext)) return "audio";
  return "file";
};
const safeAssetName = (value) => String(value || "asset").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
function cleanGeneratedTitle(value) {
  return String(value || "Generated take").replace(/[._-]+/g, " ").replace(/\bshot\s*0*(\d+)\b/gi, "Shot $1").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 96) || "Generated take";
}
function stageProjectAssets(projectFile, project) {
  if (!Array.isArray(project?.assets) || !project.assets.length) return project;
  const assetFolder = path.join(path.dirname(projectFile), `${path.basename(projectFile, path.extname(projectFile))}.assets`);
  fs.mkdirSync(assetFolder, { recursive: true });
  project.assets = project.assets.map((asset, index) => {
    const source = String(asset?.path || "");
    if (!source || !fs.existsSync(source)) return asset;
    const suffix = path.extname(source) || path.extname(asset.name || "");
    const target = path.join(assetFolder, `${safeAssetName(asset.id || `asset-${index + 1}`)}${suffix}`);
    if (path.resolve(source) !== path.resolve(target)) fs.copyFileSync(source, target);
    return { ...asset, path: target, previewUrl: pathToFileURL(target).toString(), kind: asset.kind || mediaKind(target), stagedAt: new Date().toISOString() };
  });
  return project;
}
function csvCell(value) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function productionRows(project) {
  const characters = new Map((project?.characters || []).map((character) => [character.id, character.name]));
  const rows = [["scene", "scene_title", "shot", "shot_title", "purpose", "framing", "lens", "movement", "seconds", "cast", "approved_reference", "motion_master", "source_frame", "model", "generation_mode", "aspect_ratio", "output_review", "output_asset", "latest_job_status", "local_reference_count", "public_reference_count"]];
  (project?.scenes || []).forEach((scene, sceneIndex) => (scene.shots || []).forEach((shot, shotIndex) => { const settings = shot.modelSettings || {}; const latest = Array.isArray(settings.outputHistory) ? settings.outputHistory[0] || {} : {}; rows.push([
    sceneIndex + 1, scene.title || "", shotIndex + 1, shot.title || "", shot.purpose || "", shot.framing || "", shot.lens || "", shot.movement || "", shot.duration || "", (scene.castIds || []).map((id) => characters.get(id)).filter(Boolean).join("; "), scene.approvedVariationId || scene.referenceAssetId || "", scene.motionAssetId || "", latest.sourceFrameAssetId || settings.startFrameAssetId || "", settings.model || "", settings.mode || "", settings.aspectRatio || "", shot.outputReview || "unreviewed", shot.outputAssetId || "", latest.status || "", Array.isArray(settings.referenceAssetIds) ? settings.referenceAssetIds.length : 0, Array.isArray(settings.referenceUrls) ? settings.referenceUrls.length : 0
  ]); }));
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
function audioRows(project) {
  const assets = new Map((project?.assets || []).map((asset) => [asset.id, asset.name]));
  const scenes = new Map((project?.scenes || []).map((scene) => [scene.id, scene.title]));
  const rows = [["cue", "type", "asset", "scene", "shot", "start", "duration", "level", "notes"]];
  (project?.audioTracks || []).forEach((cue, index) => rows.push([index + 1, cue.type || "", assets.get(cue.assetId) || "", scenes.get(cue.sceneId) || "", cue.shotTitle || "", cue.start || "", cue.duration || "", cue.level || "", cue.notes || ""]));
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
// Music Video mode — delivery handoff docs. A section breakdown and timed
// lyric captions are what an editor or platform upload actually needs
// alongside the cut itself; neither existed before this pass. m:ss
// formatting reuses song-brain.mjs's formatTime (already the renderer's
// own m:ss formatter) rather than a second, independently-maintained copy.
function songSectionsCsv(project) {
  const song = project?.song;
  if (!song || !Array.isArray(song.sections) || !song.sections.length) return null;
  const lyrics = Array.isArray(song.lyrics) ? song.lyrics : [];
  const rows = [["#", "label", "kind", "start", "end", "duration_sec", "energy_pct", "lyrics"]];
  song.sections.forEach((section, index) => {
    const lines = lyrics.filter((line) => line.sectionId === section.id).sort((a, b) => a.start - b.start).map((line) => line.text);
    rows.push([index + 1, section.label || section.kind || "", section.kind || "", formatTime(section.start), formatTime(section.end), Math.max(0, Number(section.end) - Number(section.start)).toFixed(1), Math.round((section.energy || 0) * 100), lines.join(" / ")]);
  });
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
function srtTimestamp(seconds) {
  const ms = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))},${pad(ms % 1000, 3)}`;
}
// Each lyric line only carries its own start time (distributeLyrics spaces
// lines evenly across a section) — the caption's end is the next line's
// start, capped to its section's end so a caption never bleeds into the
// next section, and capped again at 6s so a long gap before the next line
// doesn't leave a caption lingering on screen past a natural read length.
function buildLyricsSrt(project) {
  const lines = Array.isArray(project?.song?.lyrics) ? [...project.song.lyrics].sort((a, b) => a.start - b.start) : [];
  if (!lines.length) return null;
  const sections = project?.song?.sections || [];
  const songEnd = Number(project?.song?.durationSec) || null;
  return lines.map((line, index) => {
    const start = Math.max(0, Number(line.start) || 0);
    const sectionEnd = sections.find((section) => section.id === line.sectionId)?.end;
    const nextStart = lines[index + 1] ? Number(lines[index + 1].start) : null;
    const ceiling = sectionEnd != null ? sectionEnd : (songEnd != null ? songEnd : start + 6);
    let end = nextStart != null ? Math.min(nextStart, ceiling) : ceiling;
    // The 0.8s floor must never push past the next line's own start — lines
    // spaced evenly across a short, lyric-dense section can be well under
    // 0.8s apart, and without this cap the floor would make this caption's
    // block overlap the next one's, which most caption readers reject.
    const minEnd = nextStart != null ? Math.min(start + 0.8, nextStart) : start + 0.8;
    end = Math.max(end, minEnd);
    end = Math.min(end, start + 6);
    end = Math.max(end, start + 0.05); // hard floor: never a zero/negative-duration cue
    return `${index + 1}\n${srtTimestamp(start)} --> ${srtTimestamp(end)}\n${String(line.text || "").trim()}\n`;
  }).join("\n");
}
async function exportProductionPackage(payload) {
  const project = payload?.project || {};
  const result = await dialog.showOpenDialog(mainWindow, { title: "Choose a folder for the Storymaker production package", properties: ["openDirectory", "createDirectory"] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const root = path.join(result.filePaths[0], `${safeAssetName(project.name || "untitled-film")}-production-package`);
  fs.mkdirSync(root, { recursive: true });
  const snapshot = JSON.parse(JSON.stringify(project));
  const projectFile = path.join(root, `${safeAssetName(project.name || "untitled-film")}.storymaker`);
  writeAtomic(projectFile, stageProjectAssets(projectFile, snapshot));
  fs.writeFileSync(path.join(root, "shot-list.csv"), `${productionRows(snapshot)}\n`, "utf8");
  fs.writeFileSync(path.join(root, "audio-cues.csv"), `${audioRows(snapshot)}\n`, "utf8");
  // Music Video delivery polish (chapter breakdown + lyric captions) is a
  // Pro-tier entitlement — see loadLicenseConfig/assertProTier. A standard
  // license still gets the full base package (project record, shot list,
  // audio cues, notes); it just omits these two files.
  const pro = isProTier();
  const sectionsCsv = pro ? songSectionsCsv(snapshot) : null;
  if (sectionsCsv) fs.writeFileSync(path.join(root, "song-sections.csv"), `${sectionsCsv}\n`, "utf8");
  const lyricsSrt = pro ? buildLyricsSrt(snapshot) : null;
  if (lyricsSrt) fs.writeFileSync(path.join(root, "lyrics.srt"), lyricsSrt, "utf8");
  const audit = (project.scenes || []).flatMap((scene) => (scene.shots || []).map((shot) => ({ shot, output: (project.assets || []).find((asset) => asset.id === shot.outputAssetId) })));
  const approvedOutputs = audit.filter(({ shot, output }) => output && shot.outputReview === "approved").length;
  const activeJobs = audit.filter(({ shot, output }) => !output && ["submitting", "queued", "generating", "processing", "running"].includes((shot.modelSettings?.outputHistory || [])[0]?.status)).length;
  const attention = audit.filter(({ shot, output }) => !output && ((shot.modelSettings?.outputHistory || [])[0]?.status === "failed" || !shot.modelSettings?.prompt?.trim())).length;
  const notes = [
    `# ${project.name || "Untitled Film"} — Production Package`, "",
    `Exported: ${new Date().toLocaleString()}`, "",
    "## Story", project.logline || "No logline recorded.", "",
    "## Visual language", project.style || "Not selected.", "",
    "## Delivery preflight", `- Approved outputs: ${approvedOutputs}`, `- Provider jobs in progress: ${activeJobs}`, `- Shots needing attention: ${attention}`, "",
    "## Contents", "- Project file with staged assets", "- shot-list.csv (including model, references, and review status)", "- audio-cues.csv",
    ...(sectionsCsv ? ["- song-sections.csv (section breakdown: timing, energy, lyrics)"] : []),
    ...(lyricsSrt ? ["- lyrics.srt (timed lyric captions)"] : []),
    "- Project asset folder",
    ...(project.song && !pro ? ["", "_A song-sections.csv breakdown and lyrics.srt captions are available on Storymaker Pro._"] : []),
    ""
  ].join("\n");
  fs.writeFileSync(path.join(root, "production-notes.md"), notes, "utf8");
  return { canceled: false, folderPath: root };
}
async function exportLyricsFile(payload) {
  const project = payload?.project || {};
  const srt = buildLyricsSrt(project);
  if (!srt) throw new Error("This project has no timed lyrics yet — add lyrics in Audio Studio first.");
  const choice = await dialog.showSaveDialog(mainWindow, {
    title: "Export lyric captions",
    defaultPath: path.join(app.getPath("documents"), `${safeAssetName(project.name || "untitled-film")}-lyrics.srt`),
    filters: [{ name: "SubRip captions", extensions: ["srt"] }]
  });
  if (choice.canceled || !choice.filePath) return { canceled: true };
  fs.writeFileSync(choice.filePath, srt, "utf8");
  return { canceled: false, filePath: choice.filePath, lines: (project.song?.lyrics || []).length };
}
function ffmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], { windowsHide: true });
  return !result.error && result.status === 0;
}
function visualPreviewEntries(project) {
  const assets = new Map((project?.assets || []).map((asset) => [asset.id, asset]));
  // Music Video mode: when a Song Map is attached and a scene is tied to one
  // of its sections (scene.songSectionId, set by applySongToProject), the cut
  // is timed to the SONG, not the shot planning field — that section's exact
  // length for both stills and video takes, and the 60s still cap is lifted
  // (a real section can run longer). A scene with no matching section falls
  // straight back to the normal per-shot timing.
  const sectionSecs = new Map((project?.song?.sections || []).map((s) => [s.id, Math.max(0.5, Number(s.end) - Number(s.start))]));
  const songDurFor = (scene) => (scene?.songSectionId && sectionSecs.has(scene.songSectionId) ? sectionSecs.get(scene.songSectionId) : null);
  const entries = [];
  (project?.scenes || []).forEach((scene) => {
    const songDur = songDurFor(scene);
    const section = songDur != null ? (project?.song?.sections || []).find((s) => s.id === scene?.songSectionId) : null;
    const marker = section ? String(section.label || section.kind || "") : "";
    // Collect this scene's entries first, `duration` unset — every consumer
    // (buildFcpxml, renderProductionPreview) needs to tell a real video clip
    // from a still on its own terms (entry.kind), not by inferring it from
    // whether a duration happens to be set, which broke the moment a
    // song-timed real video clip also started carrying a planned duration
    // (the "hold/trim to section" behavior below): a still misread as a
    // clip loses its hold time, and a clip misread as a still gets ffmpeg's
    // -loop flag (a still-only option) or FCPXML's silent/no-duration
    // placeholder — this exact bug, caught in review, is why the split
    // below happens in two passes instead of inline.
    const sceneEntries = [];
    const motionAsset = assets.get(scene?.motionAssetId);
    if (motionAsset?.kind === "video" && motionAsset.path && fs.existsSync(motionAsset.path)) {
      sceneEntries.push({ path: motionAsset.path, kind: "video" });
    } else {
      const stillAsset = assets.get(scene?.approvedVariationId || scene?.referenceAssetId);
      const stillPath = String(stillAsset?.path || "");
      const hasStill = stillPath && fs.existsSync(stillPath) && stillAsset.kind === "image";
      const shots = Array.isArray(scene?.shots) && scene.shots.length ? scene.shots : [null];
      shots.forEach((shot) => {
        // A shot's own generated video takes priority over the scene's still —
        // this used to only ever look at the still, so a fully animated project
        // would assemble a preview using none of its actual video takes.
        const videoAsset = shot?.outputAssetId ? assets.get(shot.outputAssetId) : null;
        if (videoAsset?.kind === "video" && videoAsset.path && fs.existsSync(videoAsset.path)) {
          sceneEntries.push({ path: videoAsset.path, kind: "video" });
          return;
        }
        if (!hasStill) return;
        sceneEntries.push({ path: stillPath, kind: "image", ownDuration: Math.max(0.5, Math.min(60, Number(shot?.duration) || 4)) });
      });
    }
    if (!sceneEntries.length) return;
    if (songDur != null) {
      // Song-timed: hold/trim the clip(s) to the section's exact length.
      // Split evenly across every entry this scene actually contributes —
      // normally exactly one — so a scene with more than one shot (Shot
      // Planner's "Add shot" works on any scene, section scenes included)
      // never inflates the cut past the song's real length; every
      // subsequent section would otherwise drift out of sync with the
      // audio track.
      const per = Math.max(0.5, songDur / sceneEntries.length);
      sceneEntries.forEach((entry) => { entry.duration = per; });
    } else {
      sceneEntries.forEach((entry) => { entry.duration = entry.kind === "image" ? entry.ownDuration : null; });
    }
    // The chapter-marker label attaches once, to the scene's first entry —
    // consumed by buildFcpxml (a real <marker> an NLE can jump between) and
    // the local MP4 rough cut (an embedded chapter list).
    if (marker) sceneEntries[0].marker = marker;
    sceneEntries.forEach((entry) => { delete entry.ownDuration; entries.push(entry); });
  });
  return entries;
}
// Every entry in a Music Video project already carries its exact planned
// duration (song-section length, not a probed guess — see visualPreviewEntries),
// so chapter timestamps here are exact without touching ffprobe. Only ever
// called when project.song exists.
function buildChaptersFfmetadata(entries) {
  let cursor = 0;
  const marks = [];
  entries.forEach((entry) => {
    if (entry.marker) marks.push({ startSec: cursor, title: entry.marker });
    cursor += Math.max(0, Number(entry.duration) || 0);
  });
  if (!marks.length) return null;
  const totalMs = Math.round(cursor * 1000);
  const escapeMeta = (value) => String(value).replace(/([=;#\\])/g, "\\$1").replace(/[\r\n]/g, " ");
  const lines = [";FFMETADATA1"];
  marks.forEach((mark, index) => {
    const startMs = Math.round(mark.startSec * 1000);
    const endMs = index + 1 < marks.length ? Math.round(marks[index + 1].startSec * 1000) : totalMs;
    lines.push("[CHAPTER]", "TIMEBASE=1/1000", `START=${startMs}`, `END=${Math.max(startMs + 1, endMs)}`, `title=${escapeMeta(mark.title)}`);
  });
  return lines.join("\n") + "\n";
}
function ffprobeDuration(filePath) {
  const result = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath], { windowsHide: true, encoding: "utf8" });
  const value = Number.parseFloat(String(result.stdout || "").trim());
  if (!result.error && result.status === 0 && Number.isFinite(value) && value > 0) return value;
  return null;
}
// A real, importable edit — Resolve, Premiere, and Avid all read FCPXML
// directly, and unlike a plain EDL it can carry actual file:// references
// and hold-duration stills, not just cut points against media that's
// already sitting in a project. This describes exactly the same cut
// visualPreviewEntries() already builds for the local MP4 rough cut
// (renderProductionPreview) — same source, same order, same durations —
// so the two exports never disagree about what the film actually is.
function buildFcpxml(project, entries, probedDurations) {
  const FPS = 24;
  const secToFrames = (seconds) => Math.max(1, Math.round(Number(seconds) * FPS));
  const rational = (frames) => `${frames}/${FPS}s`;
  const xesc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  // encodeURIComponent on every segment also encodes a Windows drive
  // letter's own colon (C: -> C%3A) — caught by testing against a real
  // path below. RFC 8089's Windows form keeps that colon literal; only the
  // segments after it need escaping (for spaces and the like, which this
  // app's own default paths already contain).
  const fileUrl = (filePath) => {
    const segments = String(filePath).replace(/\\/g, "/").split("/");
    return `file:///${segments.map((segment, index) => (index === 0 && /^[A-Za-z]:$/.test(segment)) ? segment : encodeURIComponent(segment)).join("/")}`;
  };

  // One asset per unique file. Stills get FCPXML's conventional long
  // placeholder duration (a still has no native length of its own) and
  // hasAudio="0". Real clips get their actual probed duration and
  // hasAudio="1" regardless of whether every model's output truly carries
  // audio — safer to over-declare a channel that turns out silent than to
  // risk an import that silently drops a model's own generated dialogue
  // because the XML claimed there was none to find.
  const assetsByPath = new Map();
  let assetCounter = 0;
  const assetFor = (filePath, isStill, durationSeconds) => {
    if (assetsByPath.has(filePath)) return assetsByPath.get(filePath);
    assetCounter += 1;
    const entry = { id: `r${10 + assetCounter}`, name: path.basename(filePath), filePath, isStill, durationSeconds, hasVideo: true };
    assetsByPath.set(filePath, entry);
    return entry;
  };

  const clipEntries = entries.map((entry) => {
    // entry.kind is authoritative when present (set by visualPreviewEntries).
    // Falling back to the old duration-implies-still inference only for
    // entries built before that field existed (there are none left in this
    // codebase, but a stale caller failing safe as "real clip" — needing a
    // probe — is the safer wrong guess than mislabeling one a still).
    const isStill = entry.kind ? entry.kind === "image" : false;
    const durationSeconds = entry.duration != null ? entry.duration : (probedDurations.get(entry.path) || 4);
    const asset = assetFor(entry.path, isStill, durationSeconds);
    return { id: asset.id, durationFrames: secToFrames(durationSeconds), isStill, marker: entry.marker || "" };
  });
  let cursor = 0;
  const primaryClips = clipEntries.map((clip) => { const offsetFrames = cursor; cursor += clip.durationFrames; return { ...clip, offsetFrames }; });
  const totalFrames = cursor;

  const assetXml = (asset) => {
    const durationAttr = asset.isStill ? "86400s" : rational(secToFrames(asset.durationSeconds));
    const audioAttrs = asset.isStill ? 'hasAudio="0"' : 'hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"';
    return `    <asset id="${asset.id}" name="${xesc(asset.name)}" uid="${asset.id}" start="0s" duration="${durationAttr}" hasVideo="${asset.hasVideo ? "1" : "0"}" ${audioAttrs} format="r1">\n      <media-rep kind="original-media" src="${xesc(fileUrl(asset.filePath))}"/>\n    </asset>`;
  };
  const pictureAssetsXml = [...assetsByPath.values()].map(assetXml).join("\n");

  // Audio cues are nested under whichever primary clip is actually playing
  // at that cue's own start time — a lane-attached clip's offset is
  // measured from its *anchor's* start, not the sequence's start, so this
  // is the one place the math has to track a real anchor rather than just
  // reusing the cue's absolute timeline position.
  const audioAssets = [];
  const cueXmlByParentIndex = new Map();
  (project.audioTracks || []).forEach((cue, index) => {
    const cueAsset = (project.assets || []).find((item) => item.id === cue.assetId);
    if (!cueAsset?.path) return;
    const cueDurationSeconds = Math.max(0.1, Number(cue.duration) || 5);
    const id = `a${index + 1}`;
    audioAssets.push({ id, name: path.basename(cueAsset.path), filePath: cueAsset.path, isStill: false, durationSeconds: cueDurationSeconds, hasVideo: false });
    const cueStartFrames = secToFrames(Math.max(0, Number(cue.start) || 0));
    let parentIndex = primaryClips.findIndex((clip) => cueStartFrames >= clip.offsetFrames && cueStartFrames < clip.offsetFrames + clip.durationFrames);
    if (parentIndex < 0) parentIndex = primaryClips.length - 1;
    if (parentIndex < 0) return;
    const relativeOffsetFrames = Math.max(0, cueStartFrames - primaryClips[parentIndex].offsetFrames);
    const xml = `<asset-clip ref="${id}" lane="-1" offset="${rational(relativeOffsetFrames)}" duration="${rational(secToFrames(cueDurationSeconds))}" audioRole="music"/>`;
    if (!cueXmlByParentIndex.has(parentIndex)) cueXmlByParentIndex.set(parentIndex, []);
    cueXmlByParentIndex.get(parentIndex).push(xml);
  });
  const audioAssetsXml = audioAssets.map(assetXml).join("\n");

  const spineXml = primaryClips.map((clip, index) => {
    const nestedAudio = (cueXmlByParentIndex.get(index) || []).join("");
    // A chapter marker at the very start of each song-section's clip — its
    // "start" is 0s in the clip's own local frame (matching how the nested
    // audio cues above already reason about clip-relative time), so it lands
    // exactly on the section boundary regardless of the clip's position in
    // the overall sequence. Every NLE that reads FCPXML markers (Resolve,
    // Premiere, Final Cut) surfaces these as jump-to points on the timeline.
    const markerXml = clip.marker ? `<marker start="0s" duration="${rational(1)}" value="${xesc(clip.marker)}"/>` : "";
    return `    <asset-clip ref="${clip.id}" offset="${rational(clip.offsetFrames)}" duration="${rational(clip.durationFrames)}"${clip.isStill ? "" : ' audioRole="dialogue"'}>${markerXml}${nestedAudio}</asset-clip>`;
  }).join("\n");

  const projectName = xesc(project.name || "Untitled Film");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1080p24" frameDuration="1/24s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
${pictureAssetsXml}${audioAssetsXml ? `\n${audioAssetsXml}` : ""}
  </resources>
  <library>
    <event name="${projectName}">
      <project name="${projectName}">
        <sequence duration="${rational(totalFrames)}" format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
${spineXml}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
async function exportEditTimeline(payload) {
  const project = payload?.project || {};
  const entries = visualPreviewEntries(project);
  if (!entries.length) throw new Error("Approve an image or attach a video take for at least one shot before exporting an edit.");
  const needsProbe = entries.some((entry) => entry.duration == null);
  if (needsProbe && !ffmpegAvailable()) throw new Error("Exporting real video clip durations needs FFmpeg installed on this PC (the same tool the local rough cut uses). Install FFmpeg and retry, or approve stills only for now.");
  const probedDurations = new Map();
  for (const entry of entries) {
    if (entry.duration != null || probedDurations.has(entry.path)) continue;
    probedDurations.set(entry.path, ffprobeDuration(entry.path) || 4);
  }
  // Chapter markers (buildFcpxml reads entry.marker, set by
  // visualPreviewEntries for every song-timed clip) are a Pro-tier
  // delivery-polish entitlement — strip them for a standard license so the
  // export itself, unaffected, still succeeds.
  const pro = isProTier();
  const markedEntries = pro ? entries : entries.map((entry) => ({ path: entry.path, duration: entry.duration, kind: entry.kind }));
  const xml = buildFcpxml(project, markedEntries, probedDurations);
  const choice = await dialog.showSaveDialog(mainWindow, {
    title: "Export edit for Resolve, Premiere, or Avid",
    defaultPath: path.join(app.getPath("documents"), `${safeAssetName(project.name || "untitled-film")}.fcpxml`),
    filters: [{ name: "Final Cut Pro XML", extensions: ["fcpxml"] }]
  });
  if (choice.canceled || !choice.filePath) return { canceled: true };
  fs.writeFileSync(choice.filePath, xml, "utf8");
  return { canceled: false, filePath: choice.filePath, clips: entries.length, audioCues: (project.audioTracks || []).filter((cue) => (project.assets || []).some((asset) => asset.id === cue.assetId)).length, sectionMarkers: markedEntries.filter((entry) => entry.marker).length, proLocked: !pro && entries.some((entry) => entry.marker) };
}
// The live half of the Resolve integration — sends one shot's output
// straight into Resolve's Media Pool (and, if a timeline is open, appends
// it there too), via Resolve's official Python scripting API. Studio-only
// (the free edition doesn't expose it); confirmed licensed on this dev
// machine before any of this was built, via
// %PROGRAMDATA%\Blackmagic Design\DaVinci Resolve\Support\.license.
//
// isResolveRunning() is a hard requirement, not an optimization: loading
// fusionscript.dll (what DaVinciResolveScript.py does on import) while
// Resolve itself isn't running reliably crashes the Python process with a
// native access violation (0xC0000005) rather than raising a catchable
// Python exception — reproduced directly, in both a POSIX shell and native
// PowerShell, before this guard existed. A Python-side try/except around
// the import cannot catch that; the only safe fix is never attempting the
// import unless Resolve's own process is confirmed alive first.
function isResolveRunning() {
  const result = spawnSync("tasklist", ["/FI", "IMAGENAME eq Resolve.exe", "/NH"], { windowsHide: true, encoding: "utf8" });
  return !result.error && /resolve\.exe/i.test(result.stdout || "");
}
function resolveScriptingEnv() {
  const scriptingRoot = "C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Developer\\Scripting";
  const existingPythonPath = process.env.PYTHONPATH ? `;${process.env.PYTHONPATH}` : "";
  return { ...process.env, RESOLVE_SCRIPT_API: scriptingRoot, RESOLVE_SCRIPT_LIB: "C:\\Program Files\\Blackmagic Design\\DaVinci Resolve\\fusionscript.dll", PYTHONPATH: `${scriptingRoot}\\Modules${existingPythonPath}` };
}
// Windows has no single reliable "python" name — python.org installs,
// the Store's stub, and the py launcher all vary machine to machine (this
// dev machine alone resolves "python" to 3.10 and "py" to 3.14, both
// valid). Try each in order; only fall through to the next on ENOENT
// (this one genuinely isn't installed), not on any other failure.
function runResolveBridge(payload) {
  const candidates = ["python", "py"];
  return new Promise((resolve, reject) => {
    // Advance to the next candidate on *any* failure to produce a usable
    // response, not only ENOENT. Confirmed live on this dev machine that
    // this distinction is load-bearing, not theoretical: "python" resolves
    // to a 3.10 install whose loading of fusionscript.dll crashes the
    // whole process with a native access violation (0xC0000005) — no
    // catchable Python exception, no stdout, just a dead process — while
    // "py" resolves to 3.14 and works cleanly. A version-only fallback
    // (advancing solely on "not installed") would have tried the crashing
    // one, gotten a crash, and reported failure without ever reaching the
    // interpreter that actually works. Which specific version crashes is
    // machine-dependent (whatever ships as each name's target); the fix is
    // to keep trying, not to guess a "safe" order.
    let lastError = null;
    const tryNext = (index) => {
      if (index >= candidates.length) { reject(lastError || new Error("Could not find a working Python interpreter on this PC. The DaVinci Resolve integration needs Python 3.6+ (64-bit) installed.")); return; }
      // A Python subprocess can't read a file that only exists inside
      // app.asar — that's a virtual path Node's own fs transparently
      // redirects, not a real one on disk. asarUnpack (package.json)
      // extracts this folder next to it as app.asar.unpacked, so in a
      // packaged app __dirname (which still points inside app.asar) needs
      // that one path segment swapped to find the real, spawnable file.
      const scriptRoot = app.isPackaged ? __dirname.replace(`${path.sep}app.asar`, `${path.sep}app.asar.unpacked`) : __dirname;
      const scriptPath = path.join(scriptRoot, "resolve-bridge", "send_to_resolve.py");
      const child = spawn(candidates[index], [scriptPath], { windowsHide: true, env: resolveScriptingEnv() });
      let stdout = ""; let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", (error) => {
        lastError = error.code === "ENOENT" ? new Error("Could not find a Python interpreter on this PC. The DaVinci Resolve integration needs Python 3.6+ (64-bit) installed.") : error;
        if (index + 1 < candidates.length) tryNext(index + 1); else reject(lastError);
      });
      child.on("close", (code) => {
        const lastLine = stdout.trim().split("\n").filter(Boolean).pop();
        let parsed = null;
        if (lastLine) { try { parsed = JSON.parse(lastLine); } catch { parsed = null; } }
        if (parsed) { resolve(parsed); return; }
        lastError = new Error(stderr.trim() || `The "${candidates[index]}" Python interpreter exited with code ${code} and gave no usable response — it may not be compatible with Resolve's scripting library on this PC.`);
        if (index + 1 < candidates.length) tryNext(index + 1); else reject(lastError);
      });
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    };
    tryNext(0);
  });
}
async function sendShotToResolve(payload) {
  const filePath = String(payload?.filePath || "");
  if (!filePath || !fs.existsSync(filePath)) throw new Error("This shot has no output file to send yet — generate or approve one first.");
  if (!isResolveRunning()) throw new Error("DaVinci Resolve isn't open. Launch DaVinci Resolve Studio, open or create a project, and try again.");
  const binName = String(payload?.binName || "Storymaker").trim().slice(0, 120) || "Storymaker";
  // duration is only meaningful for a still (hold this many seconds on the
  // timeline) — a real video clip always plays its own length regardless,
  // so the renderer only ever sends a number here when the output is an
  // image; anything else (undefined/null) leaves a real clip untouched.
  const duration = Number.isFinite(payload?.duration) && payload.duration > 0 ? payload.duration : null;
  const result = await runResolveBridge({ filePath, binName, appendToTimeline: payload?.appendToTimeline !== false, duration });
  if (!result.ok) throw new Error(result.message || "DaVinci Resolve could not accept this shot.");
  return result;
}
// The bulk counterpart to sendShotToResolve() above: sends the WHOLE edit
// in one go, in the same scene/shot order the FCPXML export and the local
// rough cut already agree on (visualPreviewEntries() is the single shared
// source of truth for all three, including each still's planned
// duration). Individual per-shot clicks only ever land in click order
// because each is its own AppendToTimeline([item]) call; this instead
// resolves every file to a media pool item first and appends the whole
// ordered list in ONE AppendToTimeline(items) call, on the Python side,
// which is what actually guarantees sequential placement on the timeline
// regardless of what's been sent there before.
async function sendEditToResolve(payload) {
  const project = payload?.project || {};
  const entries = visualPreviewEntries(project);
  if (!entries.length) throw new Error("Approve an image or attach a video take for at least one shot before sending the edit to Resolve.");
  if (!isResolveRunning()) throw new Error("DaVinci Resolve isn't open. Launch DaVinci Resolve Studio, open or create a project, and try again.");
  const binName = String(project?.name || "Storymaker").trim().slice(0, 120) || "Storymaker";
  const clips = entries.map((entry) => ({ filePath: entry.path, duration: entry.duration }));
  const result = await runResolveBridge({ clips, binName, appendToTimeline: payload?.appendToTimeline !== false });
  if (!result.ok) throw new Error(result.message || "DaVinci Resolve could not accept this edit.");
  return result;
}
function concatFileLine(filePath) {
  return `file '${String(filePath).replace(/\\/g, "/").replace(/'/g, "'\\\\''")}'`;
}
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn("ffmpeg", args, { windowsHide: true });
    let details = "";
    process.stderr.on("data", (chunk) => { details = `${details}${chunk}`.slice(-6000); });
    process.on("error", (error) => reject(error));
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(details || `FFmpeg exited with code ${code}.`)));
  });
}
// OpenAI's Images API has no native 21:9 size — this generates at the
// widest native size (1536x1024) and center-crops the height down until
// the frame reads 21:9, the standard technique when the underlying model
// can't produce an ultra-wide ratio directly. Fails loudly rather than
// silently keeping the wrong ratio: the user explicitly chose 21:9.
async function cropImageToAspectRatio(filePath, aspectRatio) {
  if (aspectRatio !== "21:9") return;
  if (!ffmpegAvailable()) throw new Error("21:9 for GPT Image needs FFmpeg installed on this PC to crop the wide frame — install FFmpeg and retry.");
  const tempPath = `${filePath}.crop-${Date.now()}.png`;
  await runFfmpeg(["-y", "-i", filePath, "-vf", "crop=iw:iw*9/21:0:(ih-iw*9/21)/2", "-frames:v", "1", tempPath]);
  fs.renameSync(tempPath, filePath);
}
async function renderProductionPreview(payload) {
  if (!ffmpegAvailable()) throw new Error("A local preview render needs FFmpeg, but it is not available on this PC.");
  const project = payload?.project || {};
  const entries = visualPreviewEntries(project);
  if (!entries.length) throw new Error("Approve an image or choose a video motion master before rendering a preview.");
  const choice = await dialog.showSaveDialog(mainWindow, {
    title: "Save Storymaker rough cut",
    defaultPath: path.join(app.getPath("documents"), `${safeAssetName(project.name || "untitled-film")}-rough-cut.mp4`),
    filters: [{ name: "MP4 video", extensions: ["mp4"] }]
  });
  if (choice.canceled || !choice.filePath) return { canceled: true };
  const tempRoot = fs.mkdtempSync(path.join(app.getPath("temp"), "storymaker-preview-"));
  const normalized = [];
  try {
    // Provider videos can differ in codec, frame rate, dimensions, pixel
    // format, and audio layout. Normalize sources before concatenation.
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const segment = path.join(tempRoot, `segment-${String(index + 1).padStart(3, "0")}.mp4`);
      // -loop 1 is the image2-demuxer idiom for looping a STILL — ffmpeg
      // rejects it on a real video container. entry.kind (not "a duration
      // happens to be set") is what actually tells the two apart: a
      // song-timed real video clip also carries a planned duration (held/
      // trimmed to its section), so that alone can't be the test.
      const input = entry.kind === "image" ? ["-loop", "1", "-i", entry.path, "-t", String(entry.duration)]
        : entry.duration != null ? ["-i", entry.path, "-t", String(entry.duration)]
        : ["-i", entry.path];
      await runFfmpeg(["-y", ...input,
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x090b13,fps=24,format=yuv420p",
        "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", segment]);
      normalized.push(segment);
    }
    const listPath = path.join(tempRoot, "segments.txt");
    fs.writeFileSync(listPath, `${normalized.map(concatFileLine).join("\n")}\n`, "utf8");
    const videoOnly = path.join(tempRoot, "video-only.mp4");
    await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", "-movflags", "+faststart", videoOnly]);

    const assets = new Map((project.assets || []).map((asset) => [asset.id, asset]));
    const cues = (project.audioTracks || []).map((cue) => ({ cue, asset: assets.get(cue.assetId) })).filter(({ asset }) => asset?.path && fs.existsSync(asset.path));
    // Music Video mode: every entry's duration is the exact planned section
    // length (not a guess), so chapter timestamps can be computed up front
    // and muxed straight into the MP4 — no separate probing pass needed.
    // Embedded chapters are the same Pro-tier delivery polish as the FCPXML
    // markers above; a standard license still gets the full rough cut.
    const pro = isProTier();
    const chaptersContent = (project.song && pro) ? buildChaptersFfmetadata(entries) : null;
    let chaptersPath = null;
    if (chaptersContent) { chaptersPath = path.join(tempRoot, "chapters.txt"); fs.writeFileSync(chaptersPath, chaptersContent, "utf8"); }
    if (cues.length) {
      const audioInputs = cues.flatMap(({ asset }) => ["-i", asset.path]);
      const chains = cues.map(({ cue }, index) => {
        const startMs = Math.max(0, Number(cue.start || 0)) * 1000;
        const duration = Math.max(.1, Math.min(3600, Number(cue.duration || 5)));
        const level = Math.max(-60, Math.min(12, Number.parseFloat(String(cue.level || "0")) || 0));
        return `[${index + 1}:a]atrim=0:${duration},asetpts=PTS-STARTPTS,adelay=${Math.round(startMs)}:all=1,volume=${level}dB[a${index}]`;
      });
      const labels = cues.map((_, index) => `[a${index}]`).join("");
      const filter = `${chains.join(";")};${labels}amix=inputs=${cues.length}:duration=longest:normalize=0,apad[mix]`;
      const metaInputs = chaptersPath ? ["-f", "ffmetadata", "-i", chaptersPath] : [];
      const metaMap = chaptersPath ? ["-map_metadata", String(1 + cues.length)] : [];
      // Pad the cue mix with silence, then let the picture edit define the
      // final duration. Short cues cannot truncate it; late cues cannot extend it.
      await runFfmpeg(["-y", "-i", videoOnly, ...audioInputs, ...metaInputs, "-filter_complex", filter, "-map", "0:v:0", "-map", "[mix]", ...metaMap, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", choice.filePath]);
    } else if (chaptersPath) {
      await runFfmpeg(["-y", "-i", videoOnly, "-f", "ffmetadata", "-i", chaptersPath, "-map", "0", "-map_metadata", "1", "-c", "copy", "-movflags", "+faststart", choice.filePath]);
    } else fs.copyFileSync(videoOnly, choice.filePath);
    return { canceled: false, filePath: choice.filePath, clips: entries.length, audioCues: cues.length, chapters: chaptersContent ? (chaptersContent.match(/\[CHAPTER\]/g) || []).length : 0, proLocked: !pro && Boolean(project.song) && entries.some((entry) => entry.marker) };
  } finally {
    try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch {}
  }
}

function send(command) { mainWindow?.webContents.send("menu-command", command); }
function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "File", submenu: [
      { label: "New Story", accelerator: "Ctrl+N", click: () => send("new") },
      { label: "Import Story from Clipboard", accelerator: "Ctrl+Shift+V", click: () => send("paste-source") },
      { label: "Open Story...", accelerator: "Ctrl+O", click: () => send("open") },
      { label: "Save Story", accelerator: "Ctrl+S", click: () => send("save") },
      { label: "Save Story As...", accelerator: "Ctrl+Shift+S", click: () => send("save-as") },
      { type: "separator" }, { role: "quit", label: "Exit" }
    ]},
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "togglefullscreen" }, { role: "toggleDevTools" }] },
    { label: "Settings", submenu: [{ label: "Open Settings", accelerator: "Ctrl+,", click: () => send("settings") }, { label: "Command Palette", accelerator: "Ctrl+K", click: () => send("palette") }] },
    { label: "Help", submenu: [{ label: "Story Maker Guide", accelerator: "F1", click: () => send("help") }] }
  ]));
}
function createWindow() {
  mainWindow = new BrowserWindow({ width: 1560, height: 980, minWidth: 1180, minHeight: 760, show: false, title: "Wheelbarrow Studios Story Maker", backgroundColor: "#090b13", icon: path.join(__dirname, "assets", "app-icon.ico"), webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false } });
  mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => { console.error("Renderer load failed", { code, description, url }); try { logGeneration("renderer-load-failed", { code, description, url }); } catch {} reportTelemetryMessage("Renderer load failed", { code, description, url }); });
  // render-process-gone is the modern replacement for the deprecated
  // "crashed" event — fires on a renderer crash, OOM kill, or GPU-process
  // failure taking the page down with it. Previously invisible: nothing
  // wrote this to disk, so a user hitting a real crash had no artifact to
  // hand back for debugging, only "it just closed."
  mainWindow.webContents.on("render-process-gone", (_event, details) => { console.error("Renderer process gone", details); try { logGeneration("renderer-process-gone", { reason: details?.reason, exitCode: details?.exitCode }); } catch {} reportTelemetryMessage(`Renderer process gone: ${details?.reason || "unknown"}`, { reason: details?.reason, exitCode: details?.exitCode }); });
  mainWindow.webContents.once("did-finish-load", () => {
    if (!process.env.STORYMAKER_SMOKE_SCREENSHOT) return;
    setTimeout(async () => {
      try { fs.writeFileSync(process.env.STORYMAKER_SMOKE_SCREENSHOT, (await mainWindow.webContents.capturePage()).toPNG()); }
      catch (error) { console.error("Smoke screenshot failed", error); }
    }, 650);
  });
  mainWindow.on("close", (event) => { if (!dirty || quitting) return; const choice = dialog.showMessageBoxSync(mainWindow, { type: "question", buttons: ["Save", "Don't Save", "Cancel"], defaultId: 0, cancelId: 2, title: "Save your story?", message: "You have unsaved story work.", detail: "Save before leaving so your story world, characters, and storyboard stay safe." }); if (choice === 0) { event.preventDefault(); if (!closePending) { closePending = true; send("save-and-close"); } } else if (choice === 2) event.preventDefault(); });
}
async function runDurableGeneration(kind, payload, runner) {
  assertLicensed();
  const job = createGenerationJob(kind, payload);
  try {
    const result = await runner(payload);
    const status = kind === "video" && !result?.asset ? (generationStatuses.has(result?.status) ? result.status : "queued") : "completed";
    const completed = updateGenerationJob(job.id, { status, providerTaskId: result?.taskId || result?.generation?.taskId || "", completedAt: status === "completed" ? new Date().toISOString() : undefined, result: { assetPath: result?.asset?.path || "", kind: result?.asset?.kind || "", provider: result?.generation?.provider || job.provider, model: result?.generation?.model || job.model } });
    logGeneration("job.transition", { jobId: job.id, status, provider: job.provider, model: job.model });
    return { ...result, job: completed };
  } catch (error) {
    const message = error?.message || "Generation failed.";
    const failed = updateGenerationJob(job.id, { status: "failed", failedAt: new Date().toISOString(), error: { category: errorCategory(error), message, retryable: !/authentication|validation|unsupported_parameter/i.test(errorCategory(error)) } });
    logGeneration("job.failed", { jobId: job.id, provider: job.provider, model: job.model, category: errorCategory(error), message });
    error.correlationId = failed?.id || job.id;
    throw error;
  }
}
function providerDiagnostics() {
  const status = providerStatus();
  return {
    generatedAt: new Date().toISOString(),
    encryptionAvailable: status.encryptionAvailable,
    providers: providerIds.map((provider) => ({ provider, configured: Boolean(status.providers?.[provider]), health: status.health?.[provider] || null })),
    queue: { durableLocalJobs: true, active: readGenerationJobs().filter((job) => ["queued", "processing"].includes(job.status)).length, persistedJobs: readGenerationJobs().length },
    storage: { generatedMediaPath: path.join(app.getPath("userData"), "generated-media"), writable: (() => { try { fs.mkdirSync(path.join(app.getPath("userData"), "generated-media"), { recursive: true }); return true; } catch { return false; } })() }
  };
}

// Style Library: Drift detection via vision providers
//
// Assets referenced from the renderer are almost always a local filesystem
// path (asset.path) or a file:// URL built from one (asset.previewUrl) — the
// same shape every other reference-image call in this file already reads
// with fs.readFileSync (see requestOpenAIImageOcrImpl above). Node/Electron's
// global fetch() does not support the file:// scheme, so it must never be
// used for those; only a genuine http(s) URL goes through fetch.
async function readImageAsBase64(assetPath, assetUrl) {
  const localPath = assetPath || (assetUrl && assetUrl.startsWith("file:") ? fileURLToPath(assetUrl) : "");
  if (localPath) {
    if (!fs.existsSync(localPath)) throw new Error(`Asset file not found on disk: ${localPath}`);
    const mime = imageMimeType(localPath);
    if (!mime) throw new Error("Style drift can only be checked against an image, not a video or other file.");
    return { data: fs.readFileSync(localPath).toString("base64"), mime };
  }
  if (assetUrl && /^https?:\/\//i.test(assetUrl)) {
    const response = await fetch(assetUrl);
    if (!response.ok) throw new Error(`Could not download asset for drift check (${response.status}).`);
    const contentType = response.headers.get("content-type") || "image/png";
    return { data: Buffer.from(await response.arrayBuffer()).toString("base64"), mime: contentType };
  }
  throw new Error("This asset has no local file or public URL to check.");
}
async function requestGeminiDriftCheck(payload, apiKey) {
  const { styleDnaProfile, assetPath, assetUrl, generationPrompt } = payload;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const driftPrompt = `Analyze this image against a saved visual style profile and return drift scores.

SAVED STYLE PROFILE:
- Visual Language: ${styleDnaProfile?.visualLanguage || "not specified"}
- Color Palette: ${(styleDnaProfile?.colorPalette || []).join(", ") || "not specified"}
- Typography: ${styleDnaProfile?.typography || "not specified"}
- Materials: ${styleDnaProfile?.materials || "not specified"}
- Mood: ${styleDnaProfile?.mood || "not specified"}
- Atmosphere: ${styleDnaProfile?.atmosphere || "not specified"}

GENERATION PROMPT CONTEXT:
${generationPrompt}

Analyze the provided image and return JSON with exactly this shape:
{
  "colorDrift": <number 0-100>,
  "typographyDrift": <number 0-100>,
  "materialDrift": <number 0-100>,
  "moodDrift": <number 0-100>,
  "atmosphereDrift": <number 0-100>,
  "compositeDrift": <number 0-100>,
  "findings": {
    "color": "<finding about color vs palette>",
    "typography": "<finding about typography>",
    "materials": "<finding about materials>",
    "mood": "<finding about mood alignment>",
    "atmosphere": "<finding about atmosphere>"
  },
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}

Drift is 0% when the image perfectly matches the profile, 100% when completely different. Base scores on visual analysis, not assumptions.`;

    const image = await readImageAsBase64(assetPath, assetUrl);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: driftPrompt },
            { inline_data: { mime_type: image.mime, data: image.data } }
          ]
        }],
        generationConfig: { temperature: 0.3, max_output_tokens: 1024 }
      })
    });

    const raw = await response.text();
    if (!response.ok) throw new Error(errorForProvider("Gemini", response, raw));

    let result;
    try { result = JSON.parse(raw); } catch { throw new Error("Gemini returned an unreadable response."); }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) throw new Error("Gemini returned no drift analysis for this image.");
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let report;
    try { report = JSON.parse(cleaned); } catch { throw new Error("Gemini returned a response that could not be structured. Please retry."); }

    return {
      styleDnaId: styleDnaProfile?.id || "",
      styleDnaName: styleDnaProfile?.name || "Untitled Style",
      checkedAt: new Date().toISOString(),
      colorDrift: Math.max(0, Math.min(100, Number(report.colorDrift) || 0)),
      typographyDrift: Math.max(0, Math.min(100, Number(report.typographyDrift) || 0)),
      materialDrift: Math.max(0, Math.min(100, Number(report.materialDrift) || 0)),
      moodDrift: Math.max(0, Math.min(100, Number(report.moodDrift) || 0)),
      atmosphereDrift: Math.max(0, Math.min(100, Number(report.atmosphereDrift) || 0)),
      compositeDrift: Math.max(0, Math.min(100, Number(report.compositeDrift) || 0)),
      findings: report.findings || {},
      suggestions: Array.isArray(report.suggestions) ? report.suggestions : []
    };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Drift check took too long. Please retry.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestOpenAIDriftCheck(payload, apiKey) {
  const { styleDnaProfile, assetPath, assetUrl, generationPrompt } = payload;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const driftPrompt = `Analyze this image against a saved visual style profile and return drift scores.

SAVED STYLE PROFILE:
- Visual Language: ${styleDnaProfile?.visualLanguage || "not specified"}
- Color Palette: ${(styleDnaProfile?.colorPalette || []).join(", ") || "not specified"}
- Typography: ${styleDnaProfile?.typography || "not specified"}
- Materials: ${styleDnaProfile?.materials || "not specified"}
- Mood: ${styleDnaProfile?.mood || "not specified"}
- Atmosphere: ${styleDnaProfile?.atmosphere || "not specified"}

GENERATION PROMPT CONTEXT:
${generationPrompt}

Analyze the provided image and return JSON with exactly this shape:
{
  "colorDrift": <number 0-100>,
  "typographyDrift": <number 0-100>,
  "materialDrift": <number 0-100>,
  "moodDrift": <number 0-100>,
  "atmosphereDrift": <number 0-100>,
  "compositeDrift": <number 0-100>,
  "findings": {
    "color": "<finding about color vs palette>",
    "typography": "<finding about typography>",
    "materials": "<finding about materials>",
    "mood": "<finding about mood alignment>",
    "atmosphere": "<finding about atmosphere>"
  },
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

    const image = await readImageAsBase64(assetPath, assetUrl);

    // Same /v1/responses + gpt-5.1 + input_image pattern the OCR path above
    // uses for OpenAI vision calls, rather than a second, unproven code path.
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5.1",
        store: false,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: driftPrompt },
            { type: "input_image", image_url: `data:${image.mime};base64,${image.data}` }
          ]
        }]
      })
    });

    const raw = await response.text();
    if (!response.ok) throw new Error(errorForProvider("OpenAI", response, raw));

    let result;
    try { result = JSON.parse(raw); } catch { throw new Error("OpenAI returned an unreadable response."); }

    const text = extractResponseText(result);
    if (!text) throw new Error("OpenAI returned no drift analysis for this image.");
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let report;
    try { report = JSON.parse(cleaned); } catch { throw new Error("OpenAI returned a response that could not be structured. Please retry."); }

    return {
      styleDnaId: styleDnaProfile?.id || "",
      styleDnaName: styleDnaProfile?.name || "Untitled Style",
      checkedAt: new Date().toISOString(),
      colorDrift: Math.max(0, Math.min(100, Number(report.colorDrift) || 0)),
      typographyDrift: Math.max(0, Math.min(100, Number(report.typographyDrift) || 0)),
      materialDrift: Math.max(0, Math.min(100, Number(report.materialDrift) || 0)),
      moodDrift: Math.max(0, Math.min(100, Number(report.moodDrift) || 0)),
      atmosphereDrift: Math.max(0, Math.min(100, Number(report.atmosphereDrift) || 0)),
      compositeDrift: Math.max(0, Math.min(100, Number(report.compositeDrift) || 0)),
      findings: report.findings || {},
      suggestions: Array.isArray(report.suggestions) ? report.suggestions : []
    };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Drift check took too long. Please retry.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestDriftCheck(payload) {
  const provider = String(payload?.provider || "").trim();
  if (provider !== "google" && provider !== "openai") throw new Error("Drift check requires Gemini (google) or OpenAI provider.");

  const styleDnaProfile = payload?.styleDnaProfile;
  if (!styleDnaProfile) throw new Error("Style DNA profile is required for drift checking.");

  const assetPath = String(payload?.assetPath || "").trim();
  const assetUrl = String(payload?.assetUrl || "").trim();
  if (!assetPath && !assetUrl) throw new Error("An asset file or URL is required for drift checking.");

  if (provider === "google") {
    const key = getProviderKey("google");
    if (!key) throw new Error("Connect a Google Gemini key in Model Hub before checking style drift.");
    return requestGeminiDriftCheck(payload, key);
  } else {
    const key = getProviderKey("openai");
    if (!key) throw new Error("Connect an OpenAI key in Model Hub before checking style drift.");
    return requestOpenAIDriftCheck(payload, key);
  }
}

ipcMain.handle("project:save", async (_event, payload) => { const project = payload?.project || {}; if (!payload?.saveAs && payload?.filePath && fs.existsSync(payload.filePath)) { writeAtomic(payload.filePath, stageProjectAssets(payload.filePath, project)); dirty = false; return { canceled: false, filePath: payload.filePath }; } const result = await dialog.showSaveDialog(mainWindow, { title: "Save Story Maker Project", defaultPath: payload?.suggestedName || "untitled.storymaker", filters: [{ name: "Story Maker Project", extensions: ["storymaker"] }, { name: "JSON", extensions: ["json"] }] }); if (result.canceled || !result.filePath) return { canceled: true }; writeAtomic(result.filePath, stageProjectAssets(result.filePath, project)); dirty = false; return { canceled: false, filePath: result.filePath }; });
ipcMain.handle("project:open", async () => { const result = await dialog.showOpenDialog(mainWindow, { title: "Open Story Maker Project", properties: ["openFile"], filters: [{ name: "Story Maker Project", extensions: ["storymaker", "json"] }] }); if (result.canceled || !result.filePaths[0]) return { canceled: true }; const filePath = result.filePaths[0]; const opened = readSafe(filePath); return { canceled: false, filePath, project: opened.value, recovered: opened.recovered }; });
ipcMain.handle("source:import", async () => { const result = await dialog.showOpenDialog(mainWindow, { title: "Import Story Source", properties: ["openFile"], filters: [{ name: "Story source", extensions: ["pdf", "doc", "docx", "txt", "md", "fdx", "fountain", "celtx", "rtf", "odt", "html", "htm", "csv", "png", "jpg", "jpeg", "webp", "tif", "tiff"] }, { name: "All files", extensions: ["*"] }] }); if (result.canceled || !result.filePaths[0]) return { canceled: true }; const filePath = result.filePaths[0]; const info = fs.statSync(filePath); if (info.size > 32 * 1024 * 1024) throw new Error("Choose a source file smaller than 32 MB."); const ingested = ingestStoryFile(filePath); return { canceled: false, ...ingested }; });
ipcMain.handle("source:import-text", async (_event, payload) => {
  const text = String(payload?.text || "");
  if (text.length > 2 * 1024 * 1024) throw new Error("Paste a story shorter than 2 MB.");
  return { canceled: false, ...ingestStoryText(text, payload?.name || "Pasted story") };
});
ipcMain.handle("clipboard:read-text", async () => clipboard.readText());
ipcMain.handle("source:run-ocr", async (_event, payload) => requestImageOcr(payload));
// Raw bytes of an already-imported media file, for the renderer to decode
// with Web Audio (Song Brain). Chromium blocks fetch() of file:// even from
// a file:// page, so the renderer can't read its own asset bytes directly.
ipcMain.handle("media:read-bytes", async (_event, filePath) => {
  const p = String(filePath || "");
  if (!p || !fs.existsSync(p)) throw new Error("That media file could not be found on disk.");
  const stat = fs.statSync(p);
  if (stat.size > 200 * 1024 * 1024) throw new Error("That file is over 200 MB — too large to analyze here.");
  // Async, not fs.readFileSync: this runs in the single-threaded main
  // process, which also owns window management and every other window's
  // IPC — a synchronous read of a file up to 200MB (a long lossless song
  // import, easily) stalls the entire app's UI, not just this call, for
  // the duration of the disk read.
  return fs.promises.readFile(p);
});
ipcMain.handle("media:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, { title: "Import Production Media", properties: ["openFile", "multiSelections"], filters: [{ name: "Production media", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "mp4", "mov", "m4v", "webm", "avi", "mkv", "flv", "wmv", "mpeg", "mpg", "mp3", "wav", "m4a", "aac", "ogg", "flac", "aiff", "aif", "wma"] }, { name: "All files", extensions: ["*"] }] });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  const assets = result.filePaths.flatMap((filePath) => { try { const info = fs.statSync(filePath); const kind = mediaKind(filePath); return kind === "file" ? [] : [{ name: path.basename(filePath), path: filePath, previewUrl: pathToFileURL(filePath).toString(), kind, size: info.size, modifiedAt: info.mtime.toISOString() }]; } catch { return []; } });
  if (!assets.length) throw new Error("No supported image, video, or audio files could be read. Choose a local media file that is not locked by another application.");
  return { canceled: false, assets };
});
// Only ever deletes a file that lives inside this app's own generated-media
// folder. Imported media keeps its original path on the user's disk, and this
// must never touch that — "remove" for an imported asset only ever means
// detaching it from the project record, never destroying the user's own file.
ipcMain.handle("media:delete-file", async (_event, payload) => {
  const targetPath = String(payload?.path || "");
  if (!targetPath) return { ok: true, deleted: false };
  const generatedDir = path.join(app.getPath("userData"), "generated-media");
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(generatedDir + path.sep)) return { ok: true, deleted: false };
  if (!fs.existsSync(resolved)) return { ok: true, deleted: false };
  fs.unlinkSync(resolved);
  return { ok: true, deleted: true };
});
ipcMain.handle("media:upscale", async (_event, payload) => upscaleProjectMedia(payload));
ipcMain.handle("app:setDirty", async (_event, value) => { dirty = Boolean(value); return { ok: true }; });
ipcMain.handle("app:close-after-save", async () => { closePending = false; quitting = true; mainWindow?.close(); return { ok: true }; });
ipcMain.handle("app:cancel-close", async () => { closePending = false; return { ok: true }; });
ipcMain.handle("providers:status", async () => providerStatus());
ipcMain.handle("providers:diagnostics", async () => providerDiagnostics());
ipcMain.handle("local-runtimes:status", async () => localRuntimeStatus());
ipcMain.handle("local-engine:status", async () => localEngineStatus());
ipcMain.handle("local-engine:start", async () => { await startManagedComfy(); return localEngineStatus(); });
ipcMain.handle("local-engine:stop", async () => { stopManagedComfy(); return localEngineStatus(); });
ipcMain.handle("local-engine:download-model", async (_event, entryId) => downloadLocalModel(String(entryId || "")));
ipcMain.handle("local-engine:cancel-download", async () => { localEngineDownload?.cancel?.(); return { ok: true }; });
ipcMain.handle("diagnostics:log-renderer-error", async (_event, detail) => { try { logGeneration("renderer-error", { message: detail?.message, source: detail?.source, line: detail?.line, col: detail?.col, stack: detail?.stack, type: detail?.type }); } catch {} reportTelemetryMessage(String(detail?.message || "Renderer error"), { source: detail?.source, line: detail?.line, col: detail?.col, stack: detail?.stack, type: detail?.type }); return { ok: true }; });
// Reveals the log file itself (selected in Explorer) when it exists so the
// user can see it's real and attach it directly; falls back to just
// opening its folder before anything has ever been logged, since
// showItemInFolder on a nonexistent path silently does nothing.
ipcMain.handle("diagnostics:open-log", async () => { const file = diagnosticsPath(); if (fs.existsSync(file)) { shell.showItemInFolder(file); return { ok: true, empty: false }; } fs.mkdirSync(path.dirname(file), { recursive: true }); shell.openPath(path.dirname(file)); return { ok: true, empty: true }; });
ipcMain.handle("telemetry:status", async () => ({ configured: Boolean(telemetryConfiguredDsn), enabled: telemetryConsent }));
// Flips the live gate beforeSend checks on every event — no re-init,
// takes effect on the very next error (see initTelemetry()'s comment
// for why re-calling Sentry.init() here isn't an option).
ipcMain.handle("telemetry:set-enabled", async (_event, value) => {
  telemetryConsent = Boolean(value);
  writeTelemetryConsent(telemetryConsent);
  return { ok: true, enabled: telemetryConsent };
});
ipcMain.handle("generation:jobs", async () => readGenerationJobs());
ipcMain.handle("generation:recover-assets", async (_event, payload) => {
  const projectId = String(payload?.projectId || "");
  const knownJobs = new Set([...(Array.isArray(payload?.jobIds) ? payload.jobIds : []), ...(Array.isArray(payload?.providerTaskIds) ? payload.providerTaskIds : [])].map((id) => String(id || "")).filter(Boolean));
  if (!projectId && !knownJobs.size) return [];
  return readGenerationJobs().filter((job) => job.status === "completed" && (job.projectId === projectId || knownJobs.has(String(job.id)) || knownJobs.has(String(job.providerTaskId || ""))) && job.result?.assetPath && fs.existsSync(job.result.assetPath)).map((job) => {
    const assetPath = job.result.assetPath; const info = fs.statSync(assetPath);
    return { jobId: job.id, providerTaskId: job.providerTaskId || "", sceneTitle: job.sceneTitle, shotTitle: job.shotTitle, provider: job.result.provider || job.provider, model: job.result.model || job.model, asset: { name: path.basename(assetPath), path: assetPath, previewUrl: pathToFileURL(assetPath).toString(), kind: job.result.kind || mediaKind(assetPath), size: info.size, modifiedAt: info.mtime.toISOString() } };
  });
});
// Generated media lives in userData, which is not somewhere a user can browse
// to. This saves a copy wherever they choose so a finished take can leave the
// app without exporting the whole production package.
ipcMain.handle("media:save-copy", async (_event, payload) => {
  const sourcePath = String(payload?.path || "");
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("This generated file is no longer on disk. Re-run the shot to recreate it.");
  const suggested = path.basename(sourcePath);
  const extension = path.extname(suggested).replace(".", "").toLowerCase();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save a copy",
    defaultPath: path.join(app.getPath(["mp4", "mov", "webm", "m4v"].includes(extension) ? "videos" : "downloads"), suggested),
    filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }, { name: "All files", extensions: ["*"] }] : [{ name: "All files", extensions: ["*"] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  fs.copyFileSync(sourcePath, result.filePath);
  return { ok: true, filePath: result.filePath };
});
ipcMain.handle("generation:log-blocked", async (_event, payload) => {
  const record = logGeneration("job.blocked", {
    stage: String(payload?.stage || "unknown").slice(0, 60),
    reason: String(payload?.reason || "No reason supplied.").slice(0, 400),
    provider: String(payload?.provider || "").slice(0, 40),
    model: String(payload?.model || "").slice(0, 180),
    kind: payload?.kind === "video" ? "video" : "image",
    surface: String(payload?.surface || "shot-director").slice(0, 60)
  });
  return { ok: true, at: record.at };
});
ipcMain.handle("providers:save-key", async (_event, payload) => {
  const provider = String(payload?.provider || "");
  const apiKey = String(payload?.apiKey || "").trim();
  if (!providerIds.includes(provider)) throw new Error("Unknown provider.");
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Windows credential encryption is unavailable on this device.");
  const config = readProviderCredentials();
  const health = readProviderHealth();
  if (!apiKey) delete config[provider];
  else config[provider] = safeStorage.encryptString(apiKey).toString("base64");
  delete health[provider];
  writeProviderCredentials(config);
  writeProviderHealth(health);
  return providerStatus();
});
ipcMain.handle("providers:verify", async (_event, provider) => verifyProviderConnection(String(provider || "")));
ipcMain.handle("director:review", async (_event, project) => requestOpenAIDirectorReview(project));
ipcMain.handle("story:analyze", async (_event, payload) => requestOpenAIStoryAnalysis(payload));
ipcMain.handle("story:suggest-improvements", async (_event, project) => requestScriptImprovements(project));
ipcMain.handle("music-video:direct", async (_event, payload) => requestMusicVideoDirection(payload));
ipcMain.handle("story:creative-influence", async (_event, payload) => requestCreativeInfluence(payload));
ipcMain.handle("story:recommend-styles", async (_event, payload) => requestStyleRecommendations(payload));
ipcMain.handle("style:interpret", async (_event, payload) => requestStyleDna(payload));
ipcMain.handle("style-library:list", async () => readUserStyleLibrary());
ipcMain.handle("style-library:save", async (_event, style) => {
  if (!style || typeof style !== "object" || typeof style.id !== "string" || typeof style.name !== "string") throw new Error("A valid Style DNA is required.");
  const library = readUserStyleLibrary(); const next = [{ ...style, visibility: "private", savedToLibraryAt: new Date().toISOString() }, ...library.filter((entry) => entry.id !== style.id)];
  return writeUserStyleLibrary(next);
});
ipcMain.handle("style-library:remove", async (_event, id) => writeUserStyleLibrary(readUserStyleLibrary().filter((style) => style.id !== String(id || ""))));
ipcMain.handle("style-library:export", async (_event, style) => {
  if (!style || typeof style !== "object" || typeof style.id !== "string" || typeof style.name !== "string") throw new Error("Choose a valid Style DNA to export.");
  const result = await dialog.showSaveDialog(mainWindow, { title: "Export Storymaker Style", defaultPath: `${String(style.name).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "style"}.storymaker-style`, filters: [{ name: "Storymaker Style", extensions: ["storymaker-style"] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  writeAtomic(result.filePath, { format: "storymaker-style", version: 1, exportedAt: new Date().toISOString(), style });
  return { canceled: false, filePath: result.filePath };
});
ipcMain.handle("style-library:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, { title: "Import Storymaker Style", properties: ["openFile"], filters: [{ name: "Storymaker Style", extensions: ["storymaker-style", "json"] }] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(result.filePaths[0], "utf8")); } catch { throw new Error("That Style package is not valid JSON."); }
  const style = parsed?.style || parsed;
  if (!style || typeof style !== "object" || typeof style.name !== "string") throw new Error("That file does not contain a valid Storymaker Style DNA.");
  return { canceled: false, style: { ...style, source: "imported", visibility: "project" } };
});
ipcMain.handle("story:plan-shots", async (_event, payload) => requestShotPlan(payload));
ipcMain.handle("drift:check", async (_event, payload) => requestDriftCheck(payload));
ipcMain.handle("shot:generate-image", async (_event, payload) => runDurableGeneration("image", payload, requestShotImage));
ipcMain.handle("shot:submit-video", async (_event, payload) => runDurableGeneration("video", payload, submitShotVideo));
ipcMain.handle("shot:poll-video", async (_event, payload) => {
  const result = await pollShotVideo(payload);
  // Submitting a video goes through runDurableGeneration, but polling did not,
  // so a job that finished stayed "queued" with an empty assetPath forever and
  // its completion never reached the diagnostics log. Close that loop here.
  const taskId = String(payload?.taskId || "");
  const job = taskId ? readGenerationJobs().find((entry) => entry.providerTaskId === taskId) : null;
  if (job && result?.status && result.status !== job.status) {
    updateGenerationJob(job.id, {
      status: result.status,
      ...(result.status === "completed" ? { completedAt: new Date().toISOString(), result: { assetPath: result?.asset?.path || "", kind: result?.asset?.kind || "video", provider: job.provider, model: job.model } } : {}),
      ...(result.error ? { error: { category: "provider_failure", message: String(result.error), retryable: true } } : {})
    });
    logGeneration("job.transition", { jobId: job.id, status: result.status, provider: job.provider, model: job.model, ...(result.error ? { message: String(result.error) } : {}) });
  }
  return result;
});
ipcMain.handle("shot:preflight", async (_event, payload) => preflightShot(payload));
// Delivery + export are gated alongside generation: an unactivated copy can
// write and plan the whole film, but producing output (AI frames, the local
// rough cut, an NLE hand-off) is what activation unlocks. delivery:capabilities
// stays open so the UI can still describe what delivery would do.
ipcMain.handle("project:export-package", async (_event, payload) => { assertLicensed(); return exportProductionPackage(payload); });
ipcMain.handle("delivery:capabilities", async () => ({ previewRender: ffmpegAvailable() }));
ipcMain.handle("delivery:render-preview", async (_event, payload) => { assertLicensed(); return renderProductionPreview(payload); });
ipcMain.handle("delivery:export-edit", async (_event, payload) => { assertLicensed(); return exportEditTimeline(payload); });
ipcMain.handle("delivery:export-lyrics", async (_event, payload) => { assertProTier("Lyric caption export"); return exportLyricsFile(payload); });
ipcMain.handle("delivery:send-to-resolve", async (_event, payload) => { assertLicensed(); return sendShotToResolve(payload); });
ipcMain.handle("delivery:send-edit-to-resolve", async (_event, payload) => { assertLicensed(); return sendEditToResolve(payload); });
ipcMain.handle("license:status", async () => summarizeLicense(licenseState));
ipcMain.handle("license:activate", async (_event, key) => activateLicense(key));
ipcMain.handle("license:deactivate", async () => deactivateLicense());
ipcMain.handle("license:refresh", async () => refreshLicense());
// Every uncaught exception or rejected promise in the main process lands
// in the same redacted local diagnostics log generation failures already
// use (still true regardless of telemetry — that log never leaves this
// PC), and also — only when a DSN is configured and the user has opted
// in via Settings — in Sentry, redacted again the stricter way. Logs,
// does not rethrow — Electron's own default handler (a dialog + exit)
// still runs after this for anything that would otherwise crash the
// process outright.
process.on("uncaughtException", (error) => { console.error("Uncaught exception", error); try { logGeneration("uncaught-exception", { message: error?.message, stack: String(error?.stack || "").slice(0, 4000) }); } catch {} reportTelemetryError(error); });
process.on("unhandledRejection", (reason) => { console.error("Unhandled rejection", reason); try { logGeneration("unhandled-rejection", { message: reason?.message || String(reason), stack: String(reason?.stack || "").slice(0, 4000) }); } catch {} reportTelemetryError(reason instanceof Error ? reason : new Error(String(reason?.message || reason))); });
// Update feed is package.json's build.publish (GitHub Releases on
// Olusegune/Story_Maker_App). This has nothing to check against until a
// real GitHub Release exists with a built installer attached — a
// force-pushed commit to main is not a Release. Requires `gh auth login`
// (or the GitHub web UI) to publish one; until then every check below just
// resolves to "no update found," which is a normal, harmless outcome, not
// a bug in this wiring.
// autoDownload stays false deliberately, matching this app's existing "we
// check, we never act without you choosing" pattern for local runtimes —
// a user explicitly downloads and installs an available update rather
// than it happening silently in the background.
const { autoUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
function sendUpdateStatus(status, detail = {}) { mainWindow?.webContents.send("update-status", { status, ...detail }); }
autoUpdater.on("update-available", (info) => sendUpdateStatus("available", { version: info?.version }));
autoUpdater.on("update-not-available", () => sendUpdateStatus("up-to-date"));
autoUpdater.on("error", (error) => { try { logGeneration("update-check-error", { message: error?.message }); } catch {} sendUpdateStatus("error", { message: error?.message || "Update check failed." }); });
autoUpdater.on("download-progress", (progress) => sendUpdateStatus("downloading", { percent: Math.round(progress?.percent || 0) }));
autoUpdater.on("update-downloaded", (info) => sendUpdateStatus("downloaded", { version: info?.version }));
ipcMain.handle("app:get-version", async () => app.getVersion());
ipcMain.handle("app:check-for-updates", async () => {
  if (!app.isPackaged) return { ok: false, message: "Update checks only run in the packaged Windows app." };
  try { const result = await autoUpdater.checkForUpdates(); return { ok: true, version: result?.updateInfo?.version || null }; }
  catch (error) { return { ok: false, message: error?.message || "Update check failed." }; }
});
ipcMain.handle("app:download-update", async () => {
  if (!app.isPackaged) return { ok: false, message: "Updates only download in the packaged Windows app." };
  try { await autoUpdater.downloadUpdate(); return { ok: true }; }
  catch (error) { return { ok: false, message: error?.message || "The update could not be downloaded." }; }
});
ipcMain.handle("app:install-update", async () => { if (app.isPackaged) autoUpdater.quitAndInstall(); return { ok: true }; });
app.whenReady().then(() => {
  createWindow(); createMenu();
  // A few seconds after launch, quietly — never interrupts startup, and a
  // failure here (no internet, no release published yet) is swallowed the
  // same way the local-runtime checks already swallow their own failures.
  if (app.isPackaged) setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 8000);
  // Re-validate the license in the background shortly after launch (only if
  // one is stored and licensing is configured). Never blocks startup; an
  // offline failure is covered by the grace window in summarizeLicense().
  if (licenseConfig.configured && licenseState.key) setTimeout(() => { refreshLicense().catch(() => {}); }, 6000);
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
