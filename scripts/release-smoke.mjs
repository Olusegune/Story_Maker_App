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
  ["docs/STORYMAKER_GUIDE.md", "Set up local AI", "local AI setup documentation"],
  ["docs/STORYMAKER_GUIDE.md", "Connect cloud AI providers", "cloud provider setup documentation"],
  ["docs/STORYMAKER_GUIDE.md", "Choose or create a Style DNA", "custom style documentation"],
  ["docs/VISUAL_PRESET_ASSET_MANIFEST.md", "collection boards", "visual preset asset documentation"],
  ["docs/PRODUCT_LANGUAGE.md", "Render-look profiles are not renderer integrations", "truthful product-language standard"]
  ,["src/storymaker.js", "characterReferenceIds", "multi-reference character continuity routing"]
  ,["src/storymaker.js", "means a blank section in the compiled prompt", "blank Production Blueprint boxes stay blank in compiled prompts"]
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
  ,["src/storymaker.js", "PROPS & PRODUCTION ASSETS", "props-and-production-assets workspace"]
  ,["src/storymaker.js", "function entityCardMarkup", "shared entity card reused by Character/Set/Prop lists"]
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
  ,["src/storymaker.js", "reference-library-grid", "visual Character Bible reference selector"]
  ,["src/storymaker.js", "function referenceLibraryMarkup", "shared hero-preview reference library reused by Character/Set/Prop profiles and Labs"]
  ,["src/storymaker.js", "function openPropLab", "Prop Lab generation workbench"]
  ,["src/storymaker.js", "data-design-filter", "structured Design Bible filtering"]
  ,["src/ux-release-041.css", "timeline-shot-clip", "resilient timeline card sizing"]
  ,["src/ux-release-041.css", ".preset-family header small", "accessible Design family hierarchy"]
  ,["package.json", "build:mac:universal", "macOS universal deployment target"]
  ,["docs/MACOS-DEPLOYMENT.md", "macOS deployment", "macOS release instructions"]
  ,["src/visual-direction.js", "layeredPaperEditorial", "structured Layered Paper Editorial Style DNA"]
  ,["src/visual-direction.js", "resolveVisualDirection", "project scene shot visual-direction inheritance resolver"]
  ,["src/visual-direction.js", "appendStyleHistory", "non-destructive Style DNA version history"]
  ,["src/storymaker.js", "VISUAL DIRECTION / STYLE LIBRARY", "Visual Direction workspace"]
  ,["src/storymaker.js", "shotVisualDirection", "per-shot visual-direction override control"]
  ,["src/storymaker.js", "visual-direction-home-card", "Visual Direction surfaced on Home"]
  ,["src/storymaker.js", "data-open-storyboard-visual-direction", "Visual Direction surfaced on Storyboard"]
  ,["electron-main.js", "style-library:save", "desktop-backed My Styles persistence"]
  ,["preload.js", "saveUserStyle", "safe My Styles renderer bridge"]
  ,["src/storymaker.js", "STYLE VALIDATION PREVIEWS", "real Style DNA preview lab"]
  ,["src/storymaker.js", "generateStyleMotionPreview", "real Style DNA motion preview"]
  ,["src/storymaker.js", "openMyStylesManager", "custom style management workspace"]
  ,["src/storymaker.js", "data-style-scope", "All My Styles and Favorites filtering"]
  ,["src/storymaker.js", "project.visualDirection.projectStyle = null", "deleted active style cleanup"]
  ,["src/storymaker.js", "INSTALL · CONNECT · CREATE", "first-run setup help"]
  ,["src/storymaker.js", "ComfyUI · local media", "in-app ComfyUI setup guidance"]
  ,["src/storymaker.js", "openStyleComparison", "Style DNA interpretation acceptance review"]
  ,["src/storymaker.js", "stylePreview", "Style DNA preview asset provenance"]
  ,["electron-main.js", "General reference images remain guidance", "explicit video start-frame validation"]
  ,["src/storymaker.js", "providerTaskIds", "completed video recovery by durable provider task id"]
  ,["electron-main.js", "Seedance Image-to-Video requires a selected Start Frame", "Seedance video payload guard"]
  ,["electron-main.js", "knownJobs", "completed video recovery across project identity changes"]
  ,["src/storymaker.js", "startFrameAssetId: sourceFrame ? sourceFrame.id", "storyboard video action explicitly sets an I2V start frame"]
  ,["src/storymaker.js", "Use approved storyboard frame as Start Frame", "director start-frame shortcut"]
  ,["electron-main.js", "function isSingleSourceImageToVideo", "single-source image-to-video contract"]
  ,["electron-main.js", "const sourceFrames = imageReferences", "WaveSpeed source-frame encoding"]
  ,["electron-main.js", "? imageReferences([startFrame, endFrame].filter(Boolean), 2)", "Kie source-frame encoding"]
  ,["src/storymaker.js", "const effectiveInputLimits", "model-operation-specific reference limits"]
  ,["src/storymaker.js", "const imageIds = new Set(singleSourceI2V ? []", "single-source payload reference isolation"]
  ,["src/storymaker.js", "const registeredModelCapability", "registered and inferred model capability layering"]
  ,["src/storymaker.js", "const storyboardVideoSourceFrame", "storyboard image-to-video source resolver"]
  ,["src/storymaker.js", "sourceFrameAssetId: nextSettings.startFrameAssetId", "video job source-frame provenance"]
  ,["src/storymaker.js", "VIDEO · FROM", "visible video source-frame provenance"]
  ,["src/storymaker.js", "syncAutomaticMotionMaster(scene, shot, generated.id)", "completed video storyboard linkage"]
  ,["src/storymaker.js", "referenceSelectionVersion: 2", "explicit-only shot reference selection"]
  ,["electron-main.js", "function styleEnforcementPrompt", "provider-boundary Style DNA enforcement"]
  ,["electron-main.js", "STYLE DNA LOCK", "mandatory Style DNA prompt lock"]
  ,["electron-main.js", "Reference images establish identity, costume, geometry, and composition only", "style takes precedence over source rendering medium"]
  ,["src/storymaker.js", "styleContext: \"character\"", "character style context routing"]
  ,["src/storymaker.js", "styleContext: \"prop\"", "prop and accessory style context routing"]
  ,["src/storymaker.js", "styleContext: \"environment\"", "set style context routing"]
  ,["src/storymaker.js", "styleContext: \"storyboard\"", "storyboard and final-render style context routing"]
  ,["src/storymaker.js", "assignedContinuityReferenceIds", "automatic assigned asset continuity routing"]
  ,["src/storymaker.js", "continuity-locked", "visible protected continuity references"]
  ,["src/storymaker.js", "visualDirection: project.visualDirection", "Style DNA forwarded through render payloads"]
  ,["src/storymaker.js", "Restyle identity image", "explicit stale-identity restyle path"]
  ,["src/storymaker.js", "const refs = checked;", "scene generation never falls back to implicit references"]
  ,["src/storymaker.js", "function animateExactImageTake", "exact image take animation action"]
  ,["src/storymaker.js", "data-delete-frame-asset", "direct frame-library removal control"]
  ,["src/storymaker.js", "generationReferenceAssetIds", "persistent explicit scene reference selection"]
  ,["src/storymaker.js", "const compatible = providerModels.find", "provider changes preserve the current image-to-video operation"]
  ,["src/storymaker.js", "const styledPicker = document.createElement", "app-styled Visual Direction picker"]
  ,["src/storymaker.js", "General references remain independent guidance", "clear frame-versus-guidance model messaging"]
  ,["src/accessibility-and-reference.css", ".studio-select-trigger", "Visual Direction picker design-system styling"]
  ,["src/accessibility-and-reference.css", ".shot-current-outputs .shot-output-grid>div>button", "uniform current-output action sizing"]
  ,["src/storymaker.js", "motionMasterShotId", "persistent scene motion-master provenance"]
  ,["src/storymaker.js", "Video approved and placed in the timeline", "delivery approval to timeline workflow"]
  ,["electron-main.js", "async function renderProductionPreview", "normalized mixed-provider production preview"]
  ,["electron-main.js", "amix=inputs=", "timeline audio cue mixing"]
  ,["electron-main.js", "motion_master", "motion master production-package manifest"]
  ,["scripts/delivery-pipeline-smoke.mjs", "STORYMAKER_DELIVERY_PIPELINE_OK", "executable mixed-media delivery QA"]
  ,["src/storymaker.js", 'data-nav="Character Bible">Characters', "Character Bible top production navigation"]
  ,["src/storymaker.js", "function sceneTakeEntries", "unified scene image and video take history"]
  ,["src/storymaker.js", "visualTakeMarkup", "mixed-media Scene Visualization take rendering"]
  ,["src/storymaker.js", 'return visualizationWorkspace()', "provider-neutral Generate workspace routing"]
  ,["src/storymaker.js", 'id="importAudioDirect"', "direct Audio Studio import"]
  ,["src/storymaker.js", "audio-workflow", "connected Audio Studio workflow guidance"]
  ,["src/storymaker.js", "model-provider-groups", "grouped Model Hub catalog"]
  ,["src/storymaker.js", "data-model-hub-filter", "Model Hub output filters"]
  ,["electron-main.js", "async function localRuntimeStatus", "local Ollama and ComfyUI runtime discovery"]
  ,["electron-main.js", "requestOllamaCompletion", "private local story-intelligence adapter"]
  ,["electron-main.js", "requestOllamaStoryAnalysis", "Ollama story-analysis fallback"]
  ,["electron-main.js", "COMFYUI_ENDPOINT_CANDIDATES", "ComfyUI Desktop and portable endpoint discovery"]
  ,["preload.js", "localRuntimeStatus:", "safe local runtime status bridge"]
  ,["src/storymaker.js", "local-runtime-section", "local engines surfaced in Model Hub"]
  ,["scripts/local-runtime-smoke.mjs", "STORYMAKER_LOCAL_RUNTIME_OK", "live local runtime acceptance test"]
  ,["scripts/comfy-image-live-smoke.mjs", "STORYMAKER_LOCAL_IMAGE_OK", "live local FLUX image acceptance test"]
  ,["scripts/comfy-video-live-smoke.mjs", "STORYMAKER_LOCAL_VIDEO_OK", "live local Wan image-to-video acceptance test"]
  ,["electron-main.js", "async function requestComfyUiVideo", "local Wan image-to-video adapter"]
  ,["src/storymaker.js", "local-wan21-fun-inp-1.3b", "local Wan model registry entry"]
  ,["src/ux-release-041.css", ".visual-take-play", "video-aware Scene Visualization take preview"]
  ,["src/ux-release-041.css", ".scene-card .scene-image{height:220px}", "fuller storyboard media framing"]
  ,["src/storymaker.js", "function locationsWorkspace", "dedicated Locations workspace"]
  ,["src/storymaker.js", "function productionAssetsWorkspace", "dedicated Props and Accessories workspace"]
  ,["src/storymaker.js", 'data-nav="Locations"', "Locations top navigation"]
  ,["src/storymaker.js", 'data-nav="Production Assets"', "Props and Accessories top navigation"]
  ,["src/storymaker.js", "expandLabReferenceGallery", "full-width Set and Prop Lab reference galleries"]
];

for (const [file, marker, label] of assertions) {
  if (!read(file).includes(marker)) throw new Error(`Release smoke failed: missing ${label} in ${file}.`);
}
if (/if \(!frameControlEnabled\) \{\s*settings\.startFrameAssetId\s*=/.test(read("src/storymaker.js"))) throw new Error("Release smoke failed: browsing a non-frame model must not discard the creator's selected Start Frame.");
if (!fs.existsSync(path.join(root, "assets", "app-icon.icns"))) throw new Error("Release smoke failed: macOS application icon is missing.");
console.log(`STORYMAKER_RELEASE_SMOKE_OK (${assertions.length} checks)`);
