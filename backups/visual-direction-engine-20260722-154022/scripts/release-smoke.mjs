import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assertions = [
  ["electron-main.js", "ipcMain.handle(\"shot:preflight\"", "native preflight IPC"],
  ["electron-main.js", "function preflightShot(payload)", "model-aware preflight implementation"],
  ["electron-main.js", "function pollFalShotVideo", "fal video job polling"],
  ["electron-main.js", "function pollKieMarketVideo", "Kie video job polling"],
  ["preload.js", "preflightShot: (payload)", "safe renderer preflight bridge"],
  ["src/storymaker.js", "Check readiness", "shot readiness UI"],
  ["src/storymaker.js", "recoverQueuedVideoJobs", "queued job recovery"],
  ["src/storymaker.js", "setInterval(() => { recoverCompletedGenerationAssets", "background recovery cadence"],
  ["src/storymaker.js", "optionalStyleAssets", "drop-in visual preset assets"],
  ["scripts/sync-preset-art.ps1", "Sports Anthem.png", "supplied collection-art sync"],
  ["src/storymaker.js", "storymaker-experience-mode", "persisted Simple and Studio workspace modes"],
  ["src/storymaker.js", "simple-mode-guide", "guided Simple Mode path"],
  ["src/storymaker.js", "WaveSpeed", "expanded provider catalog"],
  ["src/storymaker.js", "sceneModel", "scene visualization model selector"],
  ["src/storymaker.js", "sceneReferences", "scene reference tray"],
  ["src/storymaker.js", "data-generate-scene-shot", "generated storyboard shot action"],
  ["src/storymaker.js", "data-generate-scene-video", "per-panel storyboard video action"],
  ["src/storymaker.js", "importCharacterReference", "character reference import action"],
  ["src/storymaker.js", "openCharacterLab", "dedicated character generation workflow"],
  ["src/storymaker.js", "characterLabGenerate", "character lab generation action"],
  ["src/character-lab.css", "character-profile-grid", "character lab visual system"],
  ["src/character-lab-overrides.css", "#shotModel", "model selector visual treatment"],
  ["src/storymaker.js", "ensureTimelineShape", "timeline normalization"],
  ["src/storymaker.js", "data-timeline-shot-duration", "editable timeline shot duration"],
  ["src/storymaker.js", "data-timeline-transition", "editable scene transitions"],
  ["src/storymaker.js", "timeline-audio-clip", "audio cue timeline lane"],
  ["src/timeline-polish.css", "timeline-sequence-head", "timeline sequence visual system"],
  ["src/storymaker.js", "Generated outputs only", "generated-output storyboard guardrail"],
  ["electron-main.js", "openrouter", "OpenRouter secure provider configuration"],
  ["electron-main.js", "ipcMain.handle(\"media:import\"", "native media import IPC"],
  ["electron-main.js", "multiSelections", "multi-file media picker"],
  ["electron-main.js", "mp3\", \"wav\", \"m4a", "native audio import formats"],
  ["electron-main.js", "mp4\", \"mov\", \"m4v", "native video import formats"],
  ["electron-main.js", "openai/gpt-image-2/${editing ? \"edit\" : \"text-to-image\"}", "WaveSpeed reference-aware image routing"],
  ["electron-main.js", "const responseModel = \"gpt-5.1\"", "OpenAI Responses image tool routing"],
  ["electron-main.js", "Do not send input_fidelity", "OpenAI cross-model reference compatibility"],
  ["electron-main.js", "requestWaveSpeedGatewayImage", "WaveSpeed gateway image routing"],
  ["electron-main.js", "submitWaveSpeedShotVideo", "WaveSpeed gateway video routing"],
  ["src/storymaker.js", "id=\"shotProvider\"", "provider selection in Shot Director"],
  ["src/storymaker.js", "modelCapabilitySummary", "visible model capability summary"],
  ["src/storymaker.js", "wavespeed-ai/flux-dev", "expanded WaveSpeed image catalog"],
  ["src/storymaker.js", "wavespeed-ai/veo-3.1", "expanded WaveSpeed video catalog"],
  ["src/storymaker.js", "toggle.id = \"themeToggle\"", "light and dark mode toggle"],
  ["src/character-lab-overrides.css", "background:#f4b544", "flat action button treatment"],
  ["electron-main.js", "seedream/v5/lite/${references.length ? \"edit\" : \"text-to-image\"}", "Fal reference-aware image routing"],
  ["electron-main.js", "function validateGenerationRequest", "trusted generation request validation"],
  ["electron-main.js", "const MODEL_CAPABILITIES", "backend model capability contract"],
  ["electron-main.js", "downloadGeneratedVideo", "durable provider video download recovery"],
  ["electron-main.js", "result?.data?.fileUrl || result?.data?.downloadUrl", "Kie upload URL compatibility"],
  ["electron-main.js", "source:import-text", "clipboard story import IPC"],
  ["electron-main.js", "function runDurableGeneration", "durable local generation job ledger"],
  ["electron-main.js", "ipcMain.handle(\"providers:diagnostics\"", "provider diagnostics IPC"],
  ["electron-main.js", "contentType && !contentType.startsWith(\"image/\")", "downloaded image MIME validation"],
  ["preload.js", "providerDiagnostics: ()", "safe diagnostics bridge"],
  ["src/storymaker.js", "backendJobId", "UI durable job linkage"],
  ["src/storymaker.js", "Use as scene motion master", "explicit storyboard video selection"],
  ["src/storymaker.js", "defaultShotBlueprint", "structured production shot blueprint"],
  ["src/storymaker.js", "PRODUCTION BLUEPRINT", "editable acting lighting and continuity controls"],
  ["src/storymaker.js", "captureStoryVersion", "reviewable story revision history"],
  ["src/storymaker.js", "shotReferencePack", "shot-level model input tray"],
  ["src/storymaker.js", "data-detach-reference", "per-shot reference detach control"],
  ["src/storymaker.js", "data-delete-reference", "in-director project asset removal control"],
  ["src/storymaker.js", "shotStartFrame", "start-frame reference control"],
  ["src/storymaker.js", "shotEndFrame", "end-frame reference control"],
  ["src/storymaker.js", "shotAudioReferences", "model-aware audio reference control"],
  ["src/storymaker.js", "Imported and attached", "native-picker assets attach to the active shot"],
  ["src/storymaker.js", "shotStartFrameChoices", "visual start-frame selection"],
  ["src/storymaker.js", "shotEndFrameChoices", "visual end-frame selection"],
  ["src/storymaker.js", "AUTHORITATIVE MODEL-READY PROMPTS", "paired image and video prompt package"],
  ["src/storymaker.js", "productionPromptFor", "structured production prompt compiler"],
  ["src/storymaker.js", "generationDock", "non-blocking persistent render dock"],
  ["src/storymaker.js", "this is a dock, never a modal lock", "background render assurance"],
  ["src/storymaker.js", "SHOT INTENT / STORY BEAT", "unambiguous creative-intent field"],
  ["src/storymaker.js", "AUTHORITATIVE MODEL-READY PROMPTS", "single authoritative output prompt source"],
  ["src/storymaker.js", "Preserve & create prompt plan", "preserved-script prompt workflow"],
  ["electron-main.js", "cleanGeneratedTitle", "sanitized generated asset titles"],
  ["src/storymaker.js", "shotTakeAssets", "persistent per-shot take inventory"],
  ["src/storymaker.js", "data-select-shot-take", "explicit preferred-take selection"],
  ["src/storymaker.js", "data-preview-asset", "Media Library preview action"],
  ["src/storymaker.js", "data-download-asset", "Media Library download action"],
  ["src/storymaker.js", "VIDEO GENERATION PACKAGE", "structured video production prompt"],
  ["src/storymaker.js", "promptPackageVersion: 2", "structured prompt migration marker"],
  ["src/studio.css", "shot-model-visual", "visual output representation on shot cards"],
  ["src/storymaker.js", "Kie Seedance supports separately selected image guidance", "Kie Seedance frame and multimodal guidance"],
  ["src/storymaker.js", "monitorQueuedVideoJob", "visible queued-video render monitor"],
  ["src/storymaker.js", "generation-overlay-progress", "visible generation progress percentage"],
  ["src/storymaker.js", "video is ready to review", "video completion notification"],
  ["src/storymaker.js", "activeVideoMonitorIds", "duplicate queued-video monitor protection"],
  ["src/storymaker.js", "shotDeliveryResolution", "1K/2K/4K delivery target control"],
  ["src/storymaker.js", "Seedance 2.0 · Reference-to-Video", "Seedance multimodal model catalog"],
  ["electron-main.js", "referenceLimits: { image: 9, video: 3, audio: 3 }", "Seedance multimodal request validation"],
  ["electron-main.js", "body.audio_urls = audio.slice(0, 3)", "Seedance multimodal provider payload"],
  ["electron-main.js", "async function uploadFalReferences", "provider-hosted Fal multimodal references"],
  ["electron-main.js", "initiate-multipart", "large Fal reference multipart upload"],
  ["electron-main.js", "async function upscaleProjectMedia", "Fal Topaz image/video upscale adapter"],
  ["electron-main.js", "const sourceUrl = await falUploadReference", "provider-hosted Topaz source staging"],
  ["electron-main.js", ".mkv", "extended video import support"],
  ["preload.js", "upscaleMedia: (payload)", "safe upscaler bridge"],
  ["src/accessibility-and-reference.css", ".audio-empty p{margin-bottom:27px}", "Audio empty-state spacing"],
  ["docs/STORYMAKER_GUIDE.md", "Video jobs and recovery", "operator documentation"],
  ["docs/VISUAL_PRESET_ASSET_MANIFEST.md", "collection boards", "visual preset asset documentation"],
  ["docs/PRODUCT_LANGUAGE.md", "Render-look profiles are not renderer integrations", "truthful product-language standard"]
  ,["src/storymaker.js", "characterReferenceIds", "multi-reference character continuity routing"]
  ,["src/storymaker.js", "Eyes lead each decision", "thought-led character acting prompt synthesis"]
  ,["src/storymaker.js", "ACTING & MICRO-ANIMATION", "video performance and secondary-motion section"]
  ,["src/storymaker.js", "STILL-FRAME INTENTION", "image acting and emotional-composition section"]
  ,["src/storymaker.js", "CINEMATIC STRUCTURE", "video story-beat structure section"]
  ,["src/storymaker.js", "LIGHTING & ATMOSPHERE", "lighting is injected into both render packages"]
  ,["src/storymaker.js", "supportsStartEndFrames", "video-only start/end-frame capability gate"]
  ,["src/storymaker.js", "setIds: Array.isArray(scene?.setIds)", "persistent scene set assignments"]
  ,["src/storymaker.js", "propIds: Array.isArray(scene?.propIds)", "persistent scene production-asset assignments"]
  ,["src/storymaker.js", "SETS & LOCATIONS", "scene-level reusable set assignment"]
  ,["src/storymaker.js", "PROPS & PRODUCTION ASSETS", "scene-level reusable production-asset assignment"]
  ,["story-ingest.js", "sceneHeadingFlexible", "robust numbered screenplay slugline parser"]
  ,["electron-main.js", "parseJsonObject", "tolerant structured AI-analysis parser"]
  ,["electron-main.js", "const startFrame = references.find", "explicit-only provider start frame"]
  ,["src/storymaker.js", "Frame controls are deliberately not rendered", "frame controls are not statically present"]
  ,["src/storymaker.js", "frameHost?.remove()", "image-model frame controls are removed from the DOM"]
  ,["src/storymaker.js", "function openProductionAssetModal", "reusable wardrobe vehicle creature asset editor"]
  ,["src/storymaker.js", "PRODUCTION LIBRARY", "production-library workspace"]
  ,["src/storymaker.js", "data-scene-asset-type=\"set\"", "storyboard reusable set assignment"]
  ,["src/storymaker.js", "data-scene-asset-type=\"prop\"", "storyboard reusable production-asset assignment"]
  ,["src/storymaker.js", "suggestScriptImprovements(project)", "import enrichment requests editorial improvements"]
  ,["src/storymaker.js", "data-accept-import-suggestion", "import review accepts individual story improvements"]
  ,["src/storymaker.js", "Preserve exactly & build", "clear storyboard-creation action after parsing"]
  ,["electron-main.js", "parseJsonObject(text, \"Script improvement response\")", "tolerant script-improvement response parser"]
  ,["electron-main.js", "requestGeminiCompletion", "Gemini production-intelligence fallback"]
  ,["electron-main.js", "requestGeminiShotPlan", "Gemini shot-planning fallback"]
  ,["src/storymaker.js", "startEndFrames: true", "model-aware explicit frame controls"]
  ,["src/storymaker.js", "acceptAllScriptSuggestions", "bulk editorial recommendation approval"]
  ,["src/storymaker.js", "The remaining recommendations are still available", "persistent individual recommendation decisions"]
  ,["src/storymaker.js", "function suggestionTextarea", "visible-modal recommendation control scoping"]
  ,["src/storymaker.js", ".filter((item) => !item.status || item.status === \"pending\")", "pending-only Director recommendation inbox"]
  ,["src/storymaker.js", "item.provider === provider && item.model === model", "provider-aware duplicate model resolution"]
  ,["src/storymaker.js", "Switched to ${routedModel.label}", "compatible multimodal model routing after import"]
  ,["src/storymaker.js", "const needsCompatibleRoute", "complete mixed-media batch routing"]
  ,["src/storymaker.js", "Importing creates compatible references only", "imports do not auto-select frame controls"]
  ,["src/storymaker.js", "actions locally", "dynamically rendered take actions are bound"]
  ,["src/storymaker.js", "character-reference-grid", "visual Character Bible reference selector"]
  ,["src/storymaker.js", "data-design-filter", "structured Design Bible filtering"]
  ,["src/ux-release-041.css", "timeline-shot-clip", "resilient timeline card sizing"]
  ,["src/ux-release-041.css", ".preset-family header small", "accessible Design family hierarchy"]
  ,["package.json", "build:mac:universal", "macOS universal deployment target"]
  ,["docs/MACOS-DEPLOYMENT.md", "macOS deployment", "macOS release instructions"]
];

for (const [file, marker, label] of assertions) {
  if (!read(file).includes(marker)) throw new Error(`Release smoke failed: missing ${label} in ${file}.`);
}
if (!fs.existsSync(path.join(root, "assets", "app-icon.icns"))) throw new Error("Release smoke failed: macOS application icon is missing.");
console.log(`STORYMAKER_RELEASE_SMOKE_OK (${assertions.length} checks)`);
