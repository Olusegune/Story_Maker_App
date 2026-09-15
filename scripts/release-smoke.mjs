import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Normalizes CRLF -> LF so a marker with an embedded literal "\n" (rare,
// but it happens) still matches regardless of the checkout's line-ending
// conversion — confirmed live: a fresh `git clone` on this machine (and,
// separately, a real GitHub Actions windows-latest run) checks these
// files out with CRLF, while local edits made through this session's own
// tools stay LF, so the same marker could pass here and fail on a truly
// fresh checkout. One such marker (package.json's asarUnpack check) did
// exactly that; this makes the whole suite immune to it going forward
// instead of only fixing that one marker.
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
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
  ,["src/storymaker.js", 'data-nav="Character Bible">', "Character Bible top production navigation"]
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
  // 0.4.67 ComfyUI robustness pass: LTX-Video's LTXVImgToVideo node requires
  // width/height each divisible by 32 and fails outright otherwise — it was
  // sharing Wan's dimension function, whose 272 short edge isn't. Every
  // local LTX render at 16:9/9:16 would have failed at the ComfyUI node
  // level. Confirmed via ComfyUI-LTXVideo's own issue tracker.
  ,["electron-main.js", "function comfyLtxDimensions(settings)", "LTX-Video's own divisible-by-32 dimensions, not shared with Wan"]
  ,["electron-main.js", "const { width, height } = comfyLtxDimensions(settings);", "LTX-Video workflow uses its dedicated dimension function"]
  // Same class of bug in FLUX's EmptySD3LatentImage (divisible-by-16): only
  // the 3:2 case (680) wasn't a clean multiple.
  ,["electron-main.js", "if (aspect === \"3:2\") return { width: 1024, height: 688 };", "FLUX 3:2 dimensions corrected to a multiple of 16"]
  // localRuntimeStatus()'s /object_info fetch — ComfyUI's single heaviest
  // endpoint, grows with every custom node pack installed — was left on
  // fetchLocalJson's 2500ms default while every other /object_info call in
  // this file (scoped to one node) already got 10-30s.
  ,["electron-main.js", "await fetchLocalJson(`${baseUrl}/object_info`, 20000);", "local runtime status gives ComfyUI's full node schema fetch a realistic timeout"]
  // The LTX-Video local path had image and Wan-video live smoke tests but
  // none of its own — added to close that gap and give local-runtime-smoke
  // parity across all three local capabilities.
  ,["scripts/comfy-ltx-live-smoke.mjs", "STORYMAKER_LOCAL_LTX_VIDEO_OK", "live local LTX-Video acceptance test"]
  ,["package.json", "test:local-ltx-live", "npm script for the local LTX-Video acceptance test"]
  ,["scripts/local-runtime-smoke.mjs", "ltxReady", "local runtime readiness check reports LTX-Video capability"]
  ,["docs/STORYMAKER_GUIDE.md", "Local LTX-Video model", "LTX-Video local setup documented alongside FLUX and Wan"]
  // The Delivery page's local assembly feature already stitched every
  // approved shot/take AND mixed in Audio Studio cues (verified live with a
  // synthetic 3-shot + 1-cue project — real MP4, correct duration, both
  // streams present) — it just had a dead, differently-shaped duplicate
  // function (the real IPC channel was never wired to it) and copy that
  // wrongly called the output "silent." Removed the dead duplicate,
  // corrected the copy, and renamed it "Assemble rough cut" to actually
  // read as the milestone deliverable it already was.
  ,["electron-main.js", "async function renderProductionPreview(payload)", "the one, live, audio-mixing local assembly function"]
  ,["src/storymaker.js", 't("deliver.assemble.button")', "local assembly framed as a real rough cut, not a silent preview"]
  // Delivery's new estimated-spend panel. Verified live with a synthetic
  // 6-asset project: correct total, imported (non-generated) assets
  // correctly excluded, an unknown provider correctly flagged "not
  // tracked" rather than silently priced at $0, and ComfyUI correctly
  // shown as genuinely free rather than merely estimated low.
  ,["src/storymaker.js", "function projectCostSummary(sourceProject = project)", "per-project estimated spend aggregation"]
  ,["src/storymaker.js", 't("deliver.cost.eyebrow")', "Delivery page surfaces the cost estimate"]
  // Local crash/error diagnostics — no third-party account needed. Verified
  // live: window.addEventListener("error"/"unhandledrejection") both
  // correctly forward through the preload bridge with message/stack intact.
  ,["electron-main.js", 'process.on("uncaughtException"', "main-process uncaught exceptions land in the local diagnostics log"]
  ,["electron-main.js", 'process.on("unhandledRejection"', "main-process unhandled rejections land in the local diagnostics log"]
  ,["electron-main.js", 'mainWindow.webContents.on("render-process-gone"', "renderer crashes are logged, not just silently visible as a closed window"]
  ,["src/storymaker.js", 'window.addEventListener("error"', "renderer-side JS errors are forwarded to the local diagnostics log"]
  ,["src/storymaker.js", 'window.addEventListener("unhandledrejection"', "renderer-side unhandled promise rejections are forwarded to the local diagnostics log"]
  ,["preload.js", "logRendererError:", "safe renderer error-logging bridge"]
  ,["preload.js", "openDiagnosticsLog:", "safe diagnostics log reveal bridge"]
  ,["src/storymaker.js", 't("settings.diagnostics.open")', "Settings surfaces a way to find and attach the diagnostics log"]
  // Auto-updater (electron-updater against GitHub Releases). Needs a real
  // GitHub Release with a built installer attached to have anything to
  // find — gh auth login (or the web UI) first, then publish one; every
  // check resolves "no update found" until then, which is expected, not a
  // bug in this wiring. autoDownload stays false: matches this app's
  // existing "check, never act without you" pattern.
  ,["package.json", '"provider": "github"', "update feed points at GitHub Releases"]
  ,["package.json", '"electron-updater"', "electron-updater is a real dependency, bundled into the packaged app"]
  ,["electron-main.js", "autoUpdater.autoDownload = false;", "updates never download without the user choosing to"]
  ,["electron-main.js", 'ipcMain.handle("app:check-for-updates"', "safe update-check IPC"]
  ,["electron-main.js", "if (app.isPackaged) setTimeout(() => { autoUpdater.checkForUpdates()", "background update check only runs in the packaged app, never in dev"]
  ,["preload.js", "checkForUpdates:", "safe update-check bridge"]
  ,["preload.js", "onUpdateStatus:", "safe update-status event bridge"]
  // Caught by testing before shipping: the click handler originally waited
  // on the separate onUpdateStatus event to learn a check found something,
  // rather than reading the version already sitting in its own result —
  // a real race against event-arrival order that left the UI stuck on
  // "Checking…" in exactly the scenario tested. Fixed to set state
  // directly from checkForUpdates()'s own return value.
  ,["src/storymaker.js", "else if (result.version) updateState = { ...updateState, status: \"available\", version: result.version };", "update-check UI sets its own state from the check's result, not only from a racing event"]
  // New installs now default to Simple Mode instead of Studio Mode — a
  // guided, single-path flow that already existed but was never anyone's
  // actual starting point. Verified live both ways: a truly empty
  // localStorage lands in Simple; a profile carrying
  // storymaker-generation-view (set the first time any Shot Director panel
  // ever opens — a reliable proxy for "this is an existing installation")
  // still lands in Studio, so this doesn't silently switch an established
  // user's workflow out from under them.
  ,["src/storymaker.js", "const hasExistingUsage = localStorage.getItem(\"storymaker-generation-view\") !== null;", "new-install default is Simple Mode, existing installs are not silently switched"]
  // FCPXML edit export — a real, importable timeline for Resolve/Premiere/
  // Avid, not just a plain file list. Reuses visualPreviewEntries(), the
  // same source the local MP4 rough cut already builds from, so the two
  // exports can never disagree about what the film actually is. Verified
  // standalone (extracted, no Electron needed for the pure XML builder):
  // tag-balance checked as well-formed, drive-letter colon kept literal in
  // file:// URLs (an early version percent-encoded it to %3A, which is
  // non-standard per RFC 8089's Windows form), special characters in
  // names correctly XML-escaped without double-escaping the already
  // percent-encoded URL, and a still-vs-real-clip hasVideo/hasAudio bug
  // caught by testing (an audio cue's own asset was inheriting
  // hasVideo="1" from the picture-asset code path). Then verified for
  // real: ffprobeDuration() against an actual generated .mp4 already on
  // this PC returned its true 5.06s duration, correctly rounded to 121
  // frames at 24fps in the resulting XML.
  ,["electron-main.js", "function buildFcpxml(project, entries, probedDurations)", "the FCPXML edit builder"]
  ,["electron-main.js", "(index === 0 && /^[A-Za-z]:$/.test(segment)) ? segment : encodeURIComponent(segment)", "Windows drive-letter colon stays literal in file:// URLs, not percent-encoded"]
  ,["electron-main.js", "hasVideo: false", "audio cue assets are correctly declared audio-only, not inheriting hasVideo from picture assets"]
  ,["electron-main.js", "async function exportEditTimeline(payload)", "the export entry point"]
  ,["preload.js", "exportEditTimeline:", "safe edit-export bridge"]
  ,["src/storymaker.js", 't("deliver.editor.exportButton")', "Delivery page surfaces the edit export"]
  // Live "Send to Resolve" button — pushes a shot's output straight into a
  // DaVinci Resolve Studio bin (and the current timeline, if one is open)
  // via Resolve's official scripting API, spawned fresh per click as a
  // Python subprocess so the app itself never links against it. Live
  // testing against the user's real, licensed Resolve Studio install
  // caught three failures that would otherwise have shipped broken:
  // (1) importing DaVinciResolveScript can segfault the OS process with a
  // native 0xC0000005 access violation — not a catchable Python exception —
  // when Resolve isn't running, so a tasklist pre-flight check has to gate
  // spawning the bridge at all; (2) on this PC that same import ALSO
  // crashed under Python 3.10 even with Resolve running, but worked under
  // 3.14, so the interpreter fallback has to advance on any failure
  // (crash, bad exit, unparseable output), not just "not installed"; (3)
  // MediaPool has no AddItemListToMediaPool method (that's MediaStorage) —
  // dir(media_pool) confirmed the real method is ImportMedia(filePaths).
  // Also root-caused "Could not create bin" to Resolve sitting on its
  // Project Manager screen (a project object exists but GetCurrentPage()
  // is still None there) rather than any bin/argument bug — verified live
  // against that exact state.
  ,["electron-main.js", "function isResolveRunning()", "process pre-flight check before ever loading Resolve's scripting module"]
  ,["electron-main.js", "function resolveScriptingEnv()", "per-subprocess Resolve scripting environment, never set system-wide"]
  ,["electron-main.js", 'const candidates = ["python", "py"];', "multiple Python interpreters are tried, since the crash was interpreter-version-specific on this PC"]
  ,["electron-main.js", "async function sendShotToResolve(payload)", "the live send-to-bin entry point"]
  ,["electron-main.js", 'ipcMain.handle("delivery:send-to-resolve"', "safe send-to-Resolve IPC"]
  ,["preload.js", "sendShotToResolve:", "safe send-to-Resolve bridge"]
  ,["resolve-bridge/send_to_resolve.py", "resolve.GetCurrentPage()", "the Project Manager screen is detected via GetCurrentPage(), not just project existence"]
  ,["resolve-bridge/send_to_resolve.py", "media_pool.ImportMedia([file_path])", "the real MediaPool import method, not the nonexistent AddItemListToMediaPool"]
  ,["src/storymaker.js", "async function sendShotToResolve(sceneIndex, shotIndex, button)", "the Delivery-page send-to-Resolve handler"]
  ,["src/storymaker.js", "data-send-to-resolve", "per-shot Send to Resolve button on the Delivery page"]
  // Caught by inspecting the actual packaged build, not just testing in
  // dev: a Python subprocess can't open a file that only exists inside
  // app.asar (it's a virtual path Node's own fs transparently redirects,
  // not a real one any other process can read), so without asarUnpack the
  // bridge script would 404 on every real install despite working fine
  // unpacked in dev. Confirmed live with `asar list` against the built
  // app.asar that resolve-bridge/send_to_resolve.py is really unpacked.
  ,["package.json", '"asarUnpack"', "package.json declares an asarUnpack list"]
  ,["package.json", '"resolve-bridge/**/*"', "resolve-bridge is asarUnpack'd so its script is a real file a Python subprocess can open"]
  ,["electron-main.js", 'app.isPackaged ? __dirname.replace(`${path.sep}app.asar`, `${path.sep}app.asar.unpacked`)', "the Resolve bridge script path resolves to the unpacked copy in a packaged app"]
  // "Send entire edit to Resolve" — the bulk counterpart to the per-shot
  // button. Reuses visualPreviewEntries(), the same source of truth the
  // FCPXML export and local rough cut already share (including each
  // still's planned duration), so the edit is always sent in real
  // scene/shot order regardless of what's been clicked before. Appends
  // one clip at a time, in order, immediately after resolving each one —
  // NOT by collecting every item first and appending the whole list in
  // one batched call, which was this feature's original 0.4.75 design.
  // That batched approach was proven live to break the moment the SAME
  // still is used by more than one shot at different planned durations
  // (the normal case for any stills-only scene): Resolve's ImportMedia
  // coalesces repeated imports of one file path into a single shared
  // MediaPoolItem rather than independent copies, so marking several
  // durations onto that one shared item and only then appending the
  // whole list left every occurrence at whichever duration was marked
  // LAST. Sequential single-item appends still land correctly
  // back-to-back — AppendToTimeline always adds after the timeline's
  // current last item, one call or many — while marking and appending
  // each clip immediately "freezes" that occurrence's own duration before
  // the next clip can touch the shared item's mark again.
  ,["electron-main.js", "async function sendEditToResolve(payload)", "the bulk send-entire-edit-to-Resolve entry point"]
  ,["electron-main.js", 'ipcMain.handle("delivery:send-edit-to-resolve"', "safe send-edit-to-Resolve IPC"]
  ,["preload.js", "sendEditToResolve:", "safe send-edit-to-Resolve bridge"]
  ,["resolve-bridge/send_to_resolve.py", 'bulk_mode = isinstance(payload.get("clips"), list)', "bulk mode is picked by the clips list key, leaving the single-shot filePath shape untouched"]
  ,["resolve-bridge/send_to_resolve.py", "def append_one(media_pool, item, duration, frame_rate):", "each clip is marked and appended one at a time, not batched into one list append"]
  ,["src/storymaker.js", "async function sendEditToResolve()", "the Delivery-page send-entire-edit-to-Resolve handler"]
  ,["src/storymaker.js", 'window.storyMakerDesktop.sendEditToResolve({ project, appendToTimeline: true })', "the bulk handler sends the whole project, not a single shot"]
  ,["src/storymaker.js", 't("deliver.editor.sendToResolveButton")', "the bulk send button is on the Delivery page"]
  // Still durations sent to Resolve (via either button) now match the
  // shot's planned length, closing the gap flagged when 0.4.75 shipped —
  // previously every still landed on the timeline at Resolve's own 5s
  // default regardless of what was planned. Two of Resolve's own
  // documented mechanisms for this were tested live and BOTH silently
  // ignored for a still image: AppendToTimeline([{clipInfo}])'s
  // startFrame/endFrame override, and MediaPoolItem.SetClipProperty
  // ("Duration", ...) (returned False). The one that actually worked,
  // confirmed the same way — 3s and 7.5s requests landed as exactly 72
  // and 180 frames at the project's real 24fps — is MediaPoolItem.
  // SetMarkInOut() immediately before that clip's own single-item
  // AppendToTimeline([item]) call, the same mechanism the Resolve UI
  // itself uses when you mark a range in the bin before editing it in.
  ,["electron-main.js", "const duration = Number.isFinite(payload?.duration) && payload.duration > 0 ? payload.duration : null;", "single-shot duration is only forwarded for a genuine positive number"]
  ,["electron-main.js", "const clips = entries.map((entry) => ({ filePath: entry.path, duration: entry.duration }));", "the bulk edit carries each entry's planned duration through to the bridge"]
  ,["resolve-bridge/send_to_resolve.py", "item.SetMarkInOut(0, frames_for_duration(duration, frame_rate) - 1, \"all\")", "still duration is set via Mark In/Out, the only mechanism confirmed to actually work"]
  ,["resolve-bridge/send_to_resolve.py", 'frame_rate = float(project.GetSetting("timelineFrameRate") or 24)', "duration seconds are converted using the project's real frame rate, not a hardcoded assumption"]
  ,["src/storymaker.js", 'const duration = output.kind === "image" ? Math.max(0.5, Math.min(60, Number(shot?.duration) || 4)) : null;', "the per-shot button's still duration uses the same clamp formula as the bulk edit"]
  // The user guide had never covered any of the Delivery-page export/edit
  // features (rough cut, FCPXML, live Resolve send) despite three of them
  // shipping across 0.4.73-0.4.75 — closed that gap alongside the
  // duration fix rather than letting documentation drift further behind
  // the app.
  ,["docs/STORYMAKER_GUIDE.md", "Getting the cut into an editor", "Delivery-page export/edit options are documented"]
  ,["docs/STORYMAKER_GUIDE.md", "Send to Resolve fails or does nothing", "Resolve integration has its own troubleshooting entry"]
  // Command Palette (Ctrl+K / Settings menu) has sent a "palette" menu
  // command since that menu item was added, but nothing in the live
  // renderer (src/storymaker.js — index.html loads this, not src/main.js,
  // an old pre-0.3.18 prototype whose stub "coming into focus" toast never
  // carried over) ever had a case for it, so the shortcut silently did
  // nothing. Real implementation now: a searchable list of every page plus
  // core actions (new/open/save/save-as, theme, experience mode), reusing
  // the exact same state mutations the equivalent sidebar buttons already
  // use, keyboard-navigable (arrows + Enter), closable via the existing
  // Escape-closes-#modalRoot handler or a backdrop click.
  ,["electron-main.js", 'click: () => send("palette")', "the menu still sends the palette command Ctrl+K is bound to"]
  ,["src/storymaker.js", 'if (command === "palette") openCommandPalette();', "the live renderer actually handles the palette command now"]
  ,["src/storymaker.js", "function commandPaletteEntries()", "the command palette's page/action list"]
  ,["src/storymaker.js", "function renderCommandPalette()", "the command palette's searchable, keyboard-navigable UI"]
  ,["src/production-polish.css", ".command-palette{", "command palette styling is present"]
  // Crash telemetry (Sentry), opt-in and inert until configured. No DSN
  // is committed to this public repo — it lives in an optional,
  // gitignored sentry.config.json, or an env var override — so
  // initTelemetry() never even requires the SDK without one. Confirmed
  // live, not assumed from docs: Sentry.init() must run BEFORE
  // app.whenReady() resolves, or it throws deep inside IPC setup as an
  // unhandled rejection that hung the whole process in testing — ruling
  // out re-calling init() later to react to the Settings toggle. So the
  // SDK's own "enabled" stays true whenever a DSN exists, and the real,
  // instantly-live-togglable gate is telemetryConsent, checked fresh in
  // beforeSend on every event — flipping the toggle never re-inits.
  ,["electron-main.js", "function initTelemetry()", "the telemetry init entry point"]
  ,["electron-main.js", "function redactForTelemetry(value)", "telemetry redaction strips Windows usernames from paths, on top of the existing Bearer/key redaction"]
  ,["electron-main.js", "beforeSend: (event) => (telemetryConsent ? redactSentryEvent(event) : null)", "beforeSend is the live, per-event consent gate — not a one-time enabled flag"]
  ,["electron-main.js", 'ipcMain.handle("telemetry:status"', "safe telemetry-status IPC"]
  ,["electron-main.js", 'ipcMain.handle("telemetry:set-enabled"', "safe telemetry-toggle IPC"]
  ,["electron-main.js", "reportTelemetryError(error)", "uncaughtException also reports to telemetry when configured and consented"]
  ,["electron-main.js", "reportTelemetryError(reason instanceof Error", "unhandledRejection also reports to telemetry when configured and consented"]
  ,["preload.js", "telemetryStatus:", "safe telemetry-status bridge"]
  ,["preload.js", "setTelemetryEnabled:", "safe telemetry-toggle bridge"]
  ,["src/storymaker.js", "let telemetryState = { configured: false, enabled: false };", "telemetry UI state defaults to off, matching opt-in"]
  ,["src/storymaker.js", 'id="telemetryEnabled"', "the Settings-page crash-reporting toggle"]
  ,["package.json", '"@sentry/electron"', "Sentry Electron SDK is a real dependency"]
  ,["package.json", '"sentry.config.json"', "the (gitignored) DSN file is bundled into packaged builds when present"]
  ,[".gitignore", "sentry.config.json", "the DSN file is never committed to this public repo"]
  ,["docs/STORYMAKER_GUIDE.md", "Crash & error reporting", "the opt-in crash-reporting toggle is documented for users, distinct from the always-local diagnostics log"]
  // The "Start Creating" pill visible in the splash art was reported as
  // dead — it's baked-in pixels, never a real control. Fixed with a real,
  // invisible button positioned over it (verified live against both
  // splash images, not just one) rather than adding a second, visibly
  // duplicate button — same click target as "Create a project".
  ,["src/storymaker.js", 'id="splashStartCreating"', "a real button now sits over the baked-in Start Creating pill"]
  ,["src/storymaker.js", '$("#splashStartCreating")?.addEventListener("click", () => { dismissSplash(); openProjectModal(); });', "clicking it does exactly what Create a project does"]
  ,["src/production-polish.css", ".launch-start-creating{", "the overlay button is positioned and styled to sit over the art's baked-in pill"]
  // "Format a story" help chapter + paste-box affordances — the parser
  // (story-ingest.js) is already tolerant of screenplays, Fountain,
  // treatments, and prose; the gap was that writers didn't know that and
  // had no worked example. This adds a Help chapter with a known-good
  // sample (locked to real parser output by ingest-smoke.mjs) and a blank
  // skeleton, a "Load a sample" button and a format-help link in the paste
  // box, and the matching section in the shipped guide.
  ,["src/storymaker.js", "const SAMPLE_SCRIPT = `INT. LIGHTHOUSE", "the Help chapter's known-good sample script"]
  ,["src/storymaker.js", '["format", "02", "Format a story"]', "Format a story is a numbered Help chapter"]
  ,["src/storymaker.js", "const chapters = { start, format, cloud", "the format chapter is wired into the Help chapter map"]
  ,["src/storymaker.js", 'id="loadSampleScript"', "the paste box offers a one-click sample"]
  ,["src/storymaker.js", 'id="helpTrySample"', "the Format chapter can push its sample straight into the paste box"]
  ,["src/storymaker.js", "function openPasteStoryModal(prefill", "the paste box accepts a prefill so the sample lands in it"]
  ,["docs/STORYMAKER_GUIDE.md", "### Formatting your story", "the shipped guide documents the import format"]
  // Licensing / entitlement — LemonSqueezy license keys. Deliberately an
  // entitlement gate, not copy protection: the gate is a real throw in the
  // main process (assertLicensed) at every generation and delivery path,
  // so a non-technical user hits it, but the code is readable JS and a
  // determined person patches it out — this is documented, not hidden.
  // Inert when no store id is configured (dev builds / forks run open).
  // Offline-tolerant: a stored valid key is trusted for 3 days with no
  // network call, then 14 more days of grace before the gate closes.
  ,["electron-main.js", "function assertLicensed()", "the license gate helper"]
  ,["electron-main.js", 'ipcMain.handle("delivery:export-edit", async (_event, payload) => { assertLicensed();', "delivery/export is gated too"]
  ,["electron-main.js", "if (!licenseConfig.configured) return;", "the gate is inert when no license store is configured"]
  ,["electron-main.js", "https://api.lemonsqueezy.com/v1", "LemonSqueezy is the default license backend"]
  ,["electron-main.js", "LICENSE_OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000", "offline grace window past the recheck interval"]
  ,["electron-main.js", 'ipcMain.handle("license:activate"', "activation IPC"]
  ,["preload.js", "activateLicense:", "safe activation bridge"]
  ,["src/storymaker.js", "function openLicenseDialog()", "the activation dialog"]
  ,["src/storymaker.js", "function licenseBanner()", "the persistent unactivated banner"]
  ,["src/storymaker.js", "isn't activated on this device", "the gate error phrase the renderer keys off to surface the dialog"]
  ,[".gitignore", "license.config.json", "the license store config is kept out of the public repo"]
  ,["docs/STORYMAKER_GUIDE.md", "### Licensing and activation", "the shipped guide documents licensing"]
  // Managed local engine — Storymaker runs a headless ComfyUI itself so a
  // user picks LTX / Wan from a list and never opens ComfyUI. Proven by the
  // spike; this is the shipped feature. v1 needs a ComfyUI install to exist
  // (Desktop/portable); the curated weight download is here because placing
  // four files in four folders is the actual headache. The
  // ensureLocalEngineLayout custom_nodes mkdir is load-bearing — ComfyUI's
  // prestartup does os.listdir on it and crashes if it's missing when
  // --base-directory is set (caught by scripts/local-engine-smoke.mjs).
  ,["electron-main.js", "async function startManagedComfy()", "the headless engine lifecycle"]
  ,["electron-main.js", "async function downloadLocalModel(entryId)", "the curated weight downloader"]
  ,["electron-main.js", "\"user\", \"custom_nodes\", \"models/checkpoints\"", "the managed base dir pre-creates custom_nodes so ComfyUI prestartup doesn't crash"]
  ,["electron-main.js", "function looksLikeSafetensors(filePath, expectedSize)", "downloads are accepted on size + safetensors structure, not a brittle sha256 pin"]
  ,["electron-main.js", "await ensureLocalEngineFor(String(payload?.settings?.model", "a local video shot auto-starts the managed engine"]
  ,["electron-main.js", 'ipcMain.handle("local-engine:download-model"', "the model-download IPC"]
  ,["electron-main.js", "const checkpoint = LTX_CHECKPOINT_NAMES.find", "the LTX workflow accepts the bf16 OR the fp8 checkpoint name"]
  ,["preload.js", "downloadLocalModel:", "the safe model-download bridge"]
  ,["preload.js", "onLocalEngineProgress:", "the download-progress event bridge"]
  ,["src/storymaker.js", "function managedEngineSection()", "the Model Hub managed-engine UI"]
  ,["src/storymaker.js", "data-engine-download", "per-model download buttons in Model Hub"]
  ,["scripts/local-engine-smoke.mjs", "STORYMAKER_LOCAL_ENGINE_SMOKE_OK", "the managed-engine smoke exists (run: npm run test:local-engine)"]
  ,["package.json", '"test:local-engine"', "the managed-engine smoke has a runner"]
  // Windows code signing — Azure Trusted Signing, wired but inert until an
  // Azure Trusted Signing account + profile + AZURE_* service-principal
  // creds exist (signing.config.json or STORYMAKER_SIGN_* env). With
  // neither, build:win produces working UNSIGNED installers exactly as
  // before — nothing is added to package.json's `build` block. Verified:
  // the four config states (none / profile-only / profile+creds /
  // env-profile+creds) resolve correctly via `build-win.mjs --check-signing`,
  // and a real unsigned build through the wrapper still produces the three
  // dist-release artifacts. A genuinely signed build can't be verified
  // until the Azure identity validation is approved.
  ,["package.json", '"build:win": "node scripts/build-win.mjs"', "build:win goes through the signing-aware wrapper"]
  ,["scripts/build-win.mjs", "azureSignOptions.endpoint", "the wrapper passes Azure Trusted Signing config to electron-builder"]
  ,["scripts/build-win.mjs", "AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID", "signing only turns on when the service-principal creds are present"]
  ,["scripts/build-win.mjs", "Building UNSIGNED", "the wrapper falls back to an unsigned build rather than failing when signing isn't configured"]
  ,[".gitignore", "signing.config.json", "the Azure signing profile config stays out of the public repo"]
  ,["docs/CODE_SIGNING.md", "Trusted Signing Certificate Profile Signer", "the signing setup doc covers the RBAC role assignment"]
  // Music Video mode — Phase 1: the Song Brain, ported from the Music Video
  // Director codebase (its one irreplaceable piece). Framework-free DSP:
  // analyzeSongMap() runs on a mono Float32Array + sample rate in Node
  // exactly as in the renderer, so the smoke (scripts/song-brain-smoke.mjs,
  // in test:release) can synthesize known-tempo/known-structure PCM and
  // assert the analysis recovers it — verified live against two real songs
  // too. Not wired into the UI yet; Phase 2 makes the Song Map drive shot
  // timing.
  ,["src/song-brain.mjs", "export function analyzeSongMap(", "the framework-free Song Brain analysis"]
  ,["src/song-brain.mjs", "export async function analyzeAudioArrayBuffer(", "the renderer decode adapter (Web Audio -> Song Map)"]
  ,["src/song-brain.mjs", "export function segmentSections(", "automatic Intro/Verse/Chorus/Bridge/Outro segmentation"]
  ,["src/song-brain.mjs", "export function distributeLyrics(", "lyric-to-section distribution"]
  ,["src/song-brain.mjs", "export function carrySectionEdits(", "re-detection that preserves per-section creative edits by time overlap"]
  ,["package.json", '"test:song-brain"', "the Song Brain smoke has a runner and is in test:release"]
  // Music Video mode — Phase 2: the Song Map drives the cut. "Direct as
  // music video" in Audio Studio analyzes a song and rebuilds the project
  // as one scene per detected section (scene.songSectionId), each timed to
  // that section's exact length, with the track placed as a full-length
  // Music cue at zero. visualPreviewEntries() times the rough cut + the
  // FCPXML / Resolve export to the song section-by-section, bypassing the
  // shot planning "duration" field and lifting the 60s still cap while a
  // song is attached.
  ,["src/song-brain.mjs", "export function snapToBeat(", "beat-grid snapping for song-timed cut edits"]
  ,["src/song-brain.mjs", "export function sectionShotPlan(", "one-shot-per-section cut plan"]
  ,["src/storymaker.js", "function applySongToProject(", "attaching a song rebuilds the project as section scenes"]
  ,["src/storymaker.js", "async function directAsMusicVideo(", "the Audio Studio entry point"]
  ,["src/storymaker.js", 'songSectionId: scene?.songSectionId || ""', "scene shape carries the song-section link through normalization"]
  ,["electron-main.js", "project?.song?.sections", "visualPreviewEntries times the cut to the Song Map when one is attached"]
  ,["electron-main.js", 'ipcMain.handle("media:read-bytes"', "renderer can read asset bytes for Web Audio analysis"]
  ,["preload.js", "readMediaBytes:", "safe media-bytes bridge"]
  // Music Video mode — Phases 3-5: make the section project feel like a
  // directed music video. Per-section creative briefs seeded from
  // kind + energy + a chosen "feeling"; lyrics distributed into each
  // scene's brief and shown as ticks on the Timeline audio lane; a
  // song-first Home entry; and the analysis lands as an "arrival" modal
  // (pick a feeling, then drop into the storyboard) rather than a toast.
  ,["src/storymaker.js", "const MUSIC_VIDEO_FEELINGS = [", "the feeling presets that bias per-section briefs"]
  ,["src/storymaker.js", "function sectionBrief(", "per-section creative brief from kind + energy + feeling"]
  ,["src/storymaker.js", "function reseedSongScenes()", "re-cut section briefs when the feeling or lyrics change, without re-analyzing"]
  ,["src/storymaker.js", "function openSongDirectedReveal(", "the directed 'arrival' moment"]
  ,["src/storymaker.js", 'id="directMusicVideoHome"', "song-first entry point on Home"]
  ,["src/storymaker.js", 'id="songLyricsInput"', "lyrics field in the Song Map panel"]
  ,["src/storymaker.js", "class=\"scene-section-chip\"", "section identity on the storyboard scene card"]
  ,["src/storymaker.js", "timeline-lyric-tick", "lyric ticks along the Timeline audio lane"]
  ,["src/storymaker.js", "song: null, songLyrics:", "blankProject carries the music-video fields"]
  ,["docs/STORYMAKER_GUIDE.md", "### Music videos", "the guide documents music-video mode"]
  // Phase 6 — AI Director for music videos. One LLM call for the whole song
  // (so the arc builds and choruses rhyme), keyed by sectionId, same 4-tier
  // provider fallback as every other LLM feature (runs on local Ollama with
  // no key). Offered, never automatic. The prompt + context + parser live in
  // src/music-video-director.mjs so the smoke exercises them in plain Node;
  // verified live end-to-end against qwen3:8b.
  ,["src/music-video-director.mjs", "export function parseMusicVideoDirection(", "the provider-agnostic parser"]
  ,["src/music-video-director.mjs", "export function musicVideoDirectionContext(", "the context builder"]
  ,["src/music-video-director.mjs", "Never imitate or name a living artist", "the instructions carry the identity guard"]
  ,["electron-main.js", 'require("./src/music-video-director.mjs")', "main reuses the shared director module"]
  ,["electron-main.js", "async function requestMusicVideoDirection(payload)", "the 4-tier dispatcher"]
  ,["electron-main.js", 'ipcMain.handle("music-video:direct"', "the AI-director IPC"]
  ,["preload.js", "directMusicVideoTreatment:", "safe AI-director bridge"]
  ,["src/storymaker.js", "async function directMusicVideoWithAI()", "the renderer entry point"]
  ,["src/storymaker.js", "function composeSectionNote(", "briefs prefer the AI treatment, fall back to the template"]
  ,["src/storymaker.js", 'id="directMusicVideoAI"', "Direct-with-AI button in the Song Map panel"]
  ,["src/storymaker.js", 'id="directMusicVideoStoryboard"', "Direct-with-AI callout on the storyboard"]
  ,["src/storymaker.js", "songSectionCreative:", "scene shape carries the AI per-section treatment"]
  ,["package.json", '"src/music-video-director.mjs"', "the shared module is bundled into packaged builds"]
  ,["package.json", '"test:mv-director"', "the AI-director smoke has a runner and is in test:release"]
  // Section editor — the detector is a heuristic and a long song can merge
  // its first half into one giant "Intro". Split / merge / rename / re-type
  // / nudge-a-boundary, everything bar-snapped, with the scene list, timing,
  // lyrics and any AI direction reconciled incrementally (survivors keep
  // their generated frames and edits). Pure array transforms in song-brain,
  // covered by song-brain-smoke.
  ,["src/song-brain.mjs", "export function splitSection(", "split a merged section"]
  ,["src/song-brain.mjs", "export function mergeSectionWithNext(", "merge over-cut sections"]
  ,["src/song-brain.mjs", "export function setSectionBoundary(", "nudge a section boundary"]
  ,["src/song-brain.mjs", "export function validateSections(", "contiguity/coverage guard for hand edits"]
  ,["src/storymaker.js", "function openSectionEditor()", "the section editor modal"]
  ,["src/storymaker.js", "function commitSectionEdit(", "incremental scene reconciliation after a section edit"]
  ,["src/storymaker.js", 'id="editSections"', "Edit sections affordance on the Song Map"]
  // Phase 8 — performance & choreography layer. Per-section cast roles
  // (lead / backup / dancers), a hand-editable choreography note, and prompt
  // construction that folds the section's performers (by name, so their
  // Character Bible likeness references attach), performance note, movement
  // and lyric line into the generation prompt via scene.note + blueprint.
  ,["src/storymaker.js", "choreography: typeof scene?.choreography", "scene shape carries the hand-editable per-section choreography note"]
  ,["src/storymaker.js", "sectionCast: (scene?.sectionCast", "scene shape carries the per-section cast roles"]
  ,["src/storymaker.js", "function sectionPerformers(scene)", "resolves a section's lead / backup / dancers, manual picks over AI"]
  ,["src/storymaker.js", "function effectiveChoreography(scene)", "the hand-edited choreography wins over the AI movement line"]
  ,["src/storymaker.js", "function seedSectionCastFromAI()", "one-time role seeding from an AI direction pass, blanks only"]
  ,["src/storymaker.js", "scene.castIds = [...merged]", "every performing cast member attaches for likeness, not just the lead"]
  ,["src/storymaker.js", "Performers — ${castLine}", "performers fold into the shot blueprint blocking the image prompt reads"]
  ,["src/storymaker.js", 'id="perfLead"', "lead-performer picker in the scene production modal"]
  ,["src/storymaker.js", 'data-perf-role="backup"', "backup / band / feature role picker"]
  ,["src/storymaker.js", 'data-perf-role="dancer"', "dancers / ensemble role picker"]
  ,["src/storymaker.js", 'id="perfChoreo"', "hand-editable choreography field in the scene modal"]
  ,["src/music-video-director.mjs", "backup:string[]", "the director output schema exposes an ensemble field"]
  ,["src/music-video-director.mjs", "Array.isArray(s.backup) ? s.backup", "the parser normalizes backup to a clean string list"]
  ,["src/production-polish.css", ".scene-perf-layer", "the performance & choreography layer is styled"]
  // Phase 9 — delivery & export polish for music videos. Chapter markers at
  // every song section (FCPXML <marker> for the NLE export, embedded
  // ffmetadata chapters for the local MP4 rough cut, both computed from the
  // exact planned section durations already in visualPreviewEntries — no
  // extra ffprobe pass needed), a timed lyrics.srt sidecar, a
  // song-sections.csv breakdown in the production package, and a Deliver
  // workspace panel that checks the cut actually covers the whole song.
  ,["electron-main.js", "function songSectionsCsv(project)", "section breakdown CSV for the production package"]
  ,["electron-main.js", "function buildLyricsSrt(project)", "timed lyric captions, one SRT block per lyric line"]
  ,["electron-main.js", "function buildChaptersFfmetadata(entries)", "chapter timestamps for the local MP4 rough cut, from planned durations"]
  ,["electron-main.js", "const markerXml = clip.marker", "FCPXML carries a chapter marker at every song section"]
  ,["electron-main.js", "async function exportLyricsFile(payload)", "standalone lyrics export"]
  ,["electron-main.js", 'ipcMain.handle("delivery:export-lyrics"', "the lyrics-export IPC"]
  ,["preload.js", "exportLyrics: (payload)", "safe lyrics-export bridge"]
  ,["src/storymaker.js", "function songSyncReport(project)", "checks every song section has a scene before handoff"]
  ,["src/storymaker.js", "async function exportLyrics()", "the renderer entry point for lyrics export"]
  ,["src/storymaker.js", 'id="exportLyrics"', "Export lyrics button in the Deliver workspace"]
  ,["src/storymaker.js", "delivery-mv-panel", "Music Video delivery panel with the sync check"]
  ,["src/production-polish.css", ".delivery-mv-panel", "the delivery panel is styled"]
  // Phase 10 — licensing tier polish for music video exports. A second,
  // optional Pro tier layered on top of the existing base license: base
  // generation and delivery (including the plain rough cut, FCPXML, Send
  // to Resolve, and the production package) are unaffected; only the Music
  // Video delivery-polish additions from Phase 9 (chapter markers, lyric
  // captions, the section-breakdown CSV) require Pro. Wired but inert —
  // every valid key is treated as Pro until a second LemonSqueezy
  // product/variant is actually configured (proProductIds), so this ships
  // with no behavior change for any existing customer.
  ,["electron-main.js", "STORYMAKER_LICENSE_PRO_PRODUCT_IDS", "Pro-tier product ids are configurable via file or env, same as the base gate"]
  ,["electron-main.js", "function licenseTierFor(state, licensedNow)", "resolves none/standard/pro from the activated key's product id"]
  ,["electron-main.js", "tier: licenseTierFor(state, licensed)", "license status carries the resolved tier"]
  ,["electron-main.js", "proTierConfigured: licenseConfig.proProductIds.length > 0", "license status reports whether a Pro product actually exists yet"]
  ,["electron-main.js", "function assertProTier(feature)", "the narrower Pro gate, implies assertLicensed()"]
  ,["electron-main.js", 'ipcMain.handle("delivery:export-lyrics", async (_event, payload) => { assertProTier(', "lyrics export requires Pro"]
  ,["electron-main.js", "function isProTier()", "one soft tier-check helper, not re-derived at every delivery call site"]
  ,["electron-main.js", "const pro = isProTier();", "delivery functions check the tier before including Pro-only polish"]
  ,["electron-main.js", "proLocked: !pro && entries.some((entry) => entry.marker)", "FCPXML export reports when markers were stripped for tier, not silently dropped"]
  ,["package.json", '"license.config.json"', "the license config is actually bundled into packaged builds — it was missing before, so licensing (base or Pro) could never take effect in a shipped app"]
  ,["src/storymaker.js", 'tier: "pro", proTierConfigured: false', "renderer license state defaults to unrestricted, matching the main-process default"]
  ,["src/storymaker.js", "const isPro = licenseState.tier ===", "the Deliver workspace reads the resolved tier"]
  ,["src/storymaker.js", "delivery-mv-panel-locked", "the Music Video panel visibly marks itself locked when Pro-gated"]
  ,["src/production-polish.css", ".delivery-mv-panel-locked", "the locked state has its own amber accent, not just disabled buttons"]
  ,["docs/STORYMAKER_GUIDE.md", "#### Pro tier (Music Video delivery polish)", "the guide documents the Pro tier and how to configure it"]
  // refreshLicenseState() existed but was never called anywhere outside its
  // own definition — license status (base OR the new tier) only ever
  // updated once at app startup or after (de)activating, so visiting
  // Deliver after an upgrade showed stale gating until a restart. Found
  // while live-verifying the Pro-tier UI; fixed alongside it since the tier
  // badge is meaningless if it doesn't refresh.
  ,["src/storymaker.js", 'if (active === "Delivery") { refreshDeliveryCapabilities(); refreshLicenseState(); }', "license status re-fetches on every visit to Deliver (sidebar nav)"]
  ,["src/storymaker.js", 'if (page === "Delivery") { refreshDeliveryCapabilities(); refreshLicenseState(); }', "same refresh via the command palette's Go To"]
  ,["src/storymaker.js", 'active === "Settings" || active === "Delivery") render()', "the fetched status actually triggers a re-render on both pages, not just Settings"]
  // Phase 11 — a multi-agent code review pass across the whole Music Video
  // arc (de004c6..HEAD) surfaced real correctness bugs, not just style
  // nits: entry.duration was overloaded to mean both "still, hold for
  // this long" and "song-timed video, trim to this long", so a real video
  // clip in a song section got ffmpeg's still-only -loop flag (breaking
  // the rough cut render outright) and was misclassified as a silent,
  // duration-less still in the FCPXML export. A second shot added to a
  // section scene claimed the FULL section length instead of a share of
  // it, inflating the cut past the song's real length. Lyric captions
  // could overlap when lines landed under 0.8s apart. Below the render
  // bugs: song-brain.mjs was never bundled for the main process despite
  // being require()'d from it moments later in this same pass — same
  // startup-crash class of bug as license.config.json's own missing
  // build.files entry from Phase 10.
  ,["electron-main.js", 'sceneEntries.push({ path: motionAsset.path, kind: "video" });', "visualPreviewEntries tags every entry's real kind explicitly"]
  ,["electron-main.js", "const per = Math.max(0.5, songDur / sceneEntries.length);", "a section's length is split evenly across however many entries the scene actually contributes"]
  ,["electron-main.js", 'const isStill = entry.kind ? entry.kind === "image" : false;', "FCPXML classifies stills from the explicit kind, not from whether a duration happens to be set"]
  ,["electron-main.js", 'entry.kind === "image" ? ["-loop", "1", "-i", entry.path, "-t", String(entry.duration)]', "the rough cut only sends ffmpeg's still-only -loop flag to an actual still"]
  ,["electron-main.js", "entries.map((entry) => ({ path: entry.path, duration: entry.duration, kind: entry.kind }))", "stripping markers for a standard-tier export keeps entry.kind, so downgrading tier can't reintroduce the still/video misclassification"]
  ,["src/storymaker.js", "scene.shots.forEach((shot) => {", "reseedSongScenes refreshes every shot in a section scene, not just shots[0]"]
  ,["src/storymaker.js", "const perShotDuration = String(Math.max(0.5, Math.round(((section.end - section.start) / scene.shots.length) * 10) / 10));", "a multi-shot section scene's duration field is split evenly too, kept in sync with the render"]
  ,["electron-main.js", "const minEnd = nextStart != null ? Math.min(start + 0.8, nextStart) : start + 0.8;", "the lyrics.srt minimum-duration floor can never push a caption past the next one's start"]
  ,["electron-main.js", "return fs.promises.readFile(p);", "reading an imported audio file off disk is async, so a large import can't freeze the whole app"]
  ,["package.json", '"src/song-brain.mjs"', "song-brain.mjs is bundled into packaged builds — main now require()s it too, not just the renderer"]
  ,["electron-main.js", 'const { formatTime } = require("./src/song-brain.mjs");', "main reuses the renderer's own m:ss formatter instead of a second copy"]
  ,["src/storymaker.js", "function emptySectionCast()", "one factory for the empty cast-role shape instead of the literal repeated at every call site"]
  ,["src/storymaker.js", "none of it carries over to the new song", "re-directing an already-directed project spells out what's actually lost, not a generic prompt"]
  // Localization / i18n — a real i18n system (Intl.PluralRules-backed
  // plurals, {placeholder} interpolation, USD-locked currency formatting),
  // not a token-count trick — with Navigation, Home, Settings, Audio
  // Studio (Music Video end to end), the scene production modal, and
  // Delivery fully translated into Spanish, French, and German. Every
  // other screen still renders in English by design (t() falls back
  // safely) — a scoped, documented first pass, not partial coverage
  // masquerading as complete.
  ,["src/i18n/index.mjs", "export function t(key, vars)", "the lookup+fallback+pluralization+interpolation engine"]
  ,["src/i18n/index.mjs", "new Intl.PluralRules(locale).select(count)", "pluralization defers to the platform per locale, not a hand-rolled n===1 check"]
  ,["src/i18n/index.mjs", "export function initLocale(storedId)", "resolves the persisted choice, else the browser's own language, else English"]
  ,["src/i18n/en.mjs", "export default {", "the English source-of-truth catalog"]
  ,["src/storymaker.js", 'import { t, initLocale, setLocale, getLocale, SUPPORTED_LOCALES, formatCurrencyUSD } from "./i18n/index.mjs";', "the renderer wires up the i18n engine"]
  ,["src/storymaker.js", 'let locale = initLocale(localStorage.getItem("storymaker-locale") || "");', "the active locale persists across launches like theme/nav/experience mode already do"]
  ,["src/storymaker.js", 'id="localeSelect"', "the language switcher lives in Settings, alongside appearance and navigation"]
  ,["src/storymaker.js", "locale = setLocale(event.target.value); localStorage.setItem(\"storymaker-locale\", locale);", "switching language persists it and re-renders immediately"]
  ,["src/storymaker.js", "const NAV_ROOM_LABEL_KEYS", "room identifiers (data-nav, active === comparisons) stay English/stable — only the rendered label translates"]
  ,["src/storymaker.js", "function feelingHint(id)", "Music Video feeling labels/hints resolve through the catalog, not hardcoded English on the data array"]
  ,["src/storymaker.js", "notSet: true", "visualDirectionSummary's internal state check no longer breaks when its display string is translated"]
  ,["scripts/i18n-smoke.mjs", "STORYMAKER_I18N_SMOKE_OK", "catalog parity (keys/placeholders/plural shapes) and the t() engine are covered in test:release"]
  ,["package.json", '"test:i18n": "node scripts/i18n-smoke.mjs"', "the i18n smoke has its own runner and is wired into test:release"]
  ,["docs/STORYMAKER_GUIDE.md", "### Language", "the guide documents the language switcher and what's translated so far"]
  // Bulk "Generate everything" — one still frame for every Storyboard scene
  // that doesn't have output yet, instead of opening Shot Director once per
  // scene. Sequential (never parallel), cost-estimated and confirmed
  // upfront, cancelable between scenes, and every result lands unreviewed
  // exactly as a hand-generated one would. Re-fetches each scene by id
  // fresh every iteration rather than holding an object reference across a
  // render() call — ensureSceneShape() rebuilds project.scenes into new
  // objects on every render, so a stale reference silently drops the
  // mutation; confirmed live before this was caught (only the last scene
  // in a batch kept its output).
  ,["src/storymaker.js", "function bulkGenerationCandidates()", "read-only eligible-scene count, must not create a shot as a render side effect"]
  ,["src/storymaker.js", "function resolveBulkModel(shot)", "resolves each scene's model from its saved settings, falling back to the same default new shots ship with"]
  ,["src/storymaker.js", "async function generateSceneStillHeadless(scene, shot, model)", "headless per-scene generation, no Shot Director modal required"]
  ,["src/storymaker.js", "async function bulkGenerateAllScenes()", "the orchestrator: cost estimate, confirm, sequential run, cancelable"]
  ,["src/storymaker.js", "const scene = project.scenes.find((candidate) => candidate.id === item.sceneId);", "re-fetches the scene fresh every iteration instead of holding a reference across render()"]
  ,["src/storymaker.js", "let bulkGenerationActive = false;", "batch-in-progress flag read by the template, since render() rebuilds the button on every scene"]
  ,["src/storymaker.js", 'id="bulkGenerateScenes"', "Generate everything button on the Storyboard toolbar"]
  // Bulk video — animate every scene with a still but no video yet. Unlike
  // bulk stills (sequential), video providers are already async
  // (submit-then-poll), so this runs a small concurrent worker pool instead
  // of one at a time. monitorQueuedVideoJob itself was hardened first: it
  // now re-resolves scene/shot fresh by id on every call (including every
  // recursive retry) instead of trusting the objects passed in, since
  // render() rebuilds project.scenes into new objects on every call and two
  // or more concurrent video jobs is exactly what this feature introduces —
  // confirmed live (2 concurrent + 1 queued, all 3 landed correctly) before
  // shipping.
  ,["src/storymaker.js", "async function monitorQueuedVideoJob(scene, shot, job, modelLabel, attempt = 0, onSettled = null)", "video-job polling accepts an optional completion callback and re-resolves scene/shot fresh every call"]
  ,["src/storymaker.js", "const liveScene = project.scenes.find((candidate) => candidate.id === scene?.id);", "never trust a scene/shot reference held across a render() call, even mid-poll"]
  ,["src/storymaker.js", "const MAX_CONCURRENT_BULK_VIDEOS = 2;", "bulk video runs a capped concurrent worker pool, not one at a time like bulk stills"]
  ,["src/storymaker.js", "function bulkVideoCandidates()", "eligible scenes: has a still, no video yet"]
  ,["src/storymaker.js", "function resolveBulkVideoModel(shot, mode)", "resolves each scene's video model, falling back to the app's own default image-to-video model"]
  ,["src/storymaker.js", "function submitSceneVideoHeadless(scene, shot, model, sourceFrame)", "headless per-scene video submission, resolves only once the job fully settles"]
  ,["src/storymaker.js", "async function bulkGenerateAllVideos()", "the orchestrator: cost estimate, confirm, concurrent worker pool, stop-vs-cancel messaging"]
  ,["src/storymaker.js", 'id="bulkGenerateVideos"', "Animate everything button on the Storyboard toolbar"]
  // Shot locking — an explicit, durable "bulk actions must never touch
  // this shot" flag, separate from outputReview/outputAssetId so it
  // survives even if the current output is later cleared. Auto-set on
  // every approval path; toggled by hand from Shot Director, which is
  // never itself gated by lock state — locking only ever affects bulk
  // actions, confirmed live (a locked shot's own "Generate" button stayed
  // enabled) before shipping. Also fixes a real, pre-existing dead check:
  // shotPlanEligible referenced blueprint.provenance === "locked", a value
  // nothing in the app ever actually set.
  ,["src/storymaker.js", "locked: Boolean(shot?.locked)", "shot shape carries the lock flag, defaulting false"]
  ,["src/storymaker.js", "if (shot?.locked) return false;", "populateAllShots respects the lock (migrated off the dead provenance check)"]
  ,["src/storymaker.js", "shot.locked = true; // approving a shot is a director's final word on it", "Delivery's Approve action auto-locks the shot"]
  ,["src/storymaker.js", 'owningShot.outputReview = "approved"; owningShot.locked = true;', "the motion-master approval path also auto-locks"]
  ,["src/storymaker.js", "!scene.shots[0]?.locked)", "bulk stills/video eligibility excludes locked shots, not just ones with existing output"]
  ,["src/storymaker.js", 'id="shotLockToggle"', "manual lock/unlock toggle in Shot Director — never gates manual generation, only bulk actions"]
  ,["src/storymaker.js", "scene-lock-chip", "locked scenes show a visible chip on the Storyboard card"]
  ,["src/production-polish.css", ".shot-lock-toggle", "the lock toggle and chip are styled"]
  // Batch re-roll by section kind — Music Video mode. "Redo every Chorus":
  // regenerates whatever kind of output each matching, UNLOCKED scene
  // currently has. Built on runStillsBatch/runVideosBatch, extracted from
  // bulkGenerateAllScenes/bulkGenerateAllVideos as shared runners (a real
  // refactor, not a rewrite — the extracted loop bodies are byte-identical
  // to what already shipped and passed live testing) so this doesn't
  // duplicate the object-identity-safe re-fetch-by-id logic a third time.
  // Verified live: 2 Chorus sections (1 locked, 1 with an existing video),
  // 2 Verse sections — re-rolling "Chorus" submitted exactly one new video
  // for the unlocked scene and touched nothing else.
  ,["src/storymaker.js", "async function runStillsBatch(runnable, dockId, state)", "sequential stills runner shared by bulkGenerateAllScenes and re-roll"]
  ,["src/storymaker.js", "async function runVideosBatch(runnable, dockId, state)", "concurrent video runner shared by bulkGenerateAllVideos and re-roll"]
  ,["src/storymaker.js", "const sourceFrame = scene && shot ? storyboardVideoSourceFrame(scene, shot) : null;", "finds the still to animate even when a video already exists, correct for re-rolling a scene that already has one"]
  ,["src/storymaker.js", "function sectionKindsPresent()", "the kinds actually present in this song's sections"]
  ,["src/storymaker.js", "function rerollCandidates(kind)", "eligible scenes: matches kind (or any kind, for the feeling-scoped caller), unlocked, has existing output"]
  ,["src/storymaker.js", "async function bulkReroll(kind, label)", "the shared orchestrator: prices stills vs video per scene, confirms, runs both runners in sequence sharing one cancel state"]
  ,["src/storymaker.js", "function bulkRerollSectionKind(kind)", "kind-scoped re-roll delegates to the shared orchestrator"]
  ,["src/storymaker.js", 'id="rerollKindSelect"', "section-kind picker on the Storyboard toolbar"]
  ,["src/storymaker.js", 'id="rerollSectionKind"', "Re-roll section button"]
  // Feeling-scoped re-roll — the companion to changing Feeling in Audio
  // Studio. Feeling is one project-wide setting, not a per-section
  // property like kind, so there's no per-value subset to filter to —
  // "scoped by feeling" means every eligible scene at once, reusing the
  // exact same bulkReroll(kind=null, label) the kind-scoped button already
  // calls, not a fourth re-implementation.
  ,["src/storymaker.js", "function bulkRerollForFeeling()", "re-rolls every eligible scene with the active feeling's label, no kind filter"]
  ,["src/storymaker.js", 'id="rerollForFeeling"', "Re-roll all scenes for [feeling] button in the Song Map panel"]
  ,["src/production-polish.css", ".song-feeling-row", "the feeling row + re-roll button are styled"]
  ,["src/production-polish.css", ".reroll-control", "the re-roll control is styled"]
  // Director-inspired Style DNA presets — extends the existing Style
  // Library/Style DNA system as a filter scope rather than a fourth
  // parallel creative-direction system. `promptLabel` is the identity
  // guard: `name` carries a director's real name for human browsing,
  // `promptLabel` carries craft-only language for every prompt-building
  // call site, so the name itself never reaches a generation model.
  ,["src/visual-direction.js", "promptLabel: text(input.promptLabel, name)", "Style DNA's name/promptLabel split — the identity guard"]
  ,["src/visual-direction.js", "export const directorStyleDnas = () => DIRECTOR_STYLE_CONFIGS.map(directorStyle)", "22 director-inspired craft presets"]
  ,["src/storymaker.js", "...twoDStyleDnas(), ...directorStyleDnas()", "director-inspired presets folded into the system Style DNA library"]
  ,["src/storymaker.js", "resolvedStyle.style.promptLabel || resolvedStyle.style.name", "every prompt-prefix call site reads promptLabel, never the raw name"]
  ,["src/storymaker.js", 'data-style-scope="director"', "Director-inspired scope tab in the Style Library"]
  ,["src/storymaker.js", "visualStyleScope === \"director\" ? (dna.categoryIds || []).includes(\"director-inspired\")", "Director-inspired scope filtering"]
  ,["src/storymaker.js", "dna.cardGradient && previewUrl === splashArtwork", "gradient card fallback only when no bundled director photo resolved"]
  ,["src/storymaker.js", "function clearProjectStyleDna()", "the 'My own look' no-influence revert, not a Style DNA"]
  ,["src/storymaker.js", 'data-clear-project-style="true"', "My own look card wired to the revert action"]
  ,["src/storymaker.js", "own-look-card", "My own look card only shown in the Director-inspired scope"]
  // Extensive QA pass (2026-09-13): splash-screen tooltip bug, a real
  // "[object PointerEvent]" bug in the paste-script textarea, 6 stale-
  // object-reference data-loss bugs, a dead duplicate condition, and a
  // rafter-flagged high-severity path-confinement gap on 4 IPC handlers
  // that accept a file path from the renderer — closeable via a crafted
  // .storymaker project file otherwise. Markers below pin the load-bearing
  // fixes so a future edit can't silently reintroduce them.
  ,["src/storymaker.js", 'class="launch-start-creating">Start Creating</button>', "splash Start Creating button has no redundant title= tooltip"]
  ,["src/storymaker.js", '$("#pasteStorySource")?.addEventListener("click", () => openPasteStoryModal());', "Paste script button wrapped, not passed as a bare listener (PointerEvent-as-prefill bug)"]
  ,["electron-main.js", "const authorizedMediaPaths = new Set();", "path-confinement allowlist for local-file IPC handlers"]
  ,["electron-main.js", "const assertMediaPathAuthorized = (p) => {", "path-confinement guard function"]
  ,["electron-main.js", "const filePath = assertMediaPathAuthorized(payload?.filePath);", "OCR handler is path-confined"]
  ,["electron-main.js", "const filePath = assertMediaPathAuthorized(payload?.path); const kind", "upscale handler is path-confined"]
  ,["electron-main.js", "const sourcePath = assertMediaPathAuthorized(payload?.path);", "save-copy handler is path-confined"]
  ,["electron-main.js", "const p = assertMediaPathAuthorized(filePath);", "media:read-bytes handler is path-confined"]
  ,["electron-main.js", "const CONTENT_SECURITY_POLICY =", "renderer CSP is set"]
  ,["electron-main.js", 'mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));', "new-window/navigation guard is set"]
  ,["src/storymaker.js", "const liveScene = project.scenes[sceneIndex] || scene;", "checkStyleDrift re-fetches the scene before mutating drift history"]
  ,["src/storymaker.js", "const liveScene = project.scenes.find((item) => item.id === scene.id) || scene;", "generateSceneImage re-fetches the scene by id before mutating it"]
  // The splash "Start Creating" hotspot's alignment, take two: removing the
  // tooltip (above) fixed the duplicated-text symptom but not the actual
  // cause the user then reported — the hotspot's box was a padded union
  // covering both splash images, not pixel-fitted to either. Measured each
  // 1672×941 PNG's real pill bounds with a canvas pixel-scan and gave each
  // image its own box.
  ,["src/storymaker.js", 'data-splash-variant="${splashVariant}"', "each splash image gets its own precisely-measured button position"]
  ,["src/production-polish.css", '[data-splash-variant="1"] .launch-start-creating', "splash-1's pixel-measured button box"]
  ,["src/production-polish.css", '[data-splash-variant="2"] .launch-start-creating', "splash-2's pixel-measured button box"]
  // Micro-interactions: a newly created card or freshly generated take gets
  // one brief highlight flash. flashHighlight()/consumeHighlight() give a
  // CSS *animation* (the only kind that plays on a freshly created node,
  // unlike a *transition*) single-shot semantics across this innerHTML-
  // rebuild-per-render() architecture — pin the mechanism and every wiring
  // point so a future edit can't silently drop one or leave it replaying.
  ,["src/storymaker.js", "const flashHighlight = (id) => { pendingHighlight = id || \"\"; };", "single-shot highlight setter"]
  ,["src/storymaker.js", "const consumeHighlight = (id) => { if (id && pendingHighlight === id)", "single-shot highlight consumer"]
  ,["src/storymaker.js", "flashHighlight(id); setDirty(); render(); notify(\"Scene added to the board.\");", "addScene flashes the new scene card"]
  ,["src/storymaker.js", "flashHighlight(id); setDirty(); render(); openCharacterModal(count - 1);", "addCharacter flashes the new character card"]
  ,["src/storymaker.js", "flashHighlight(id); setDirty(); render(); openSetModal(count - 1);", "addSet flashes the new set card"]
  ,["src/storymaker.js", "flashHighlight(id);", "addProductionAsset flashes the new prop card"]
  ,["src/storymaker.js", "flashHighlight(asset.id); setDirty(); render();", "generateSceneImage flashes the new take"]
  ,["src/storymaker.js", "justAdded: consumeHighlight(character.id)", "character card consumes its highlight"]
  ,["src/storymaker.js", "consumeHighlight(scene.id) ? \" just-added\" : \"\"", "storyboard scene card consumes its highlight"]
  ,["src/storymaker.js", "consumeHighlight(asset.id) ? \" just-added\" : \"\"", "take history card consumes its highlight"]
  ,["src/production-polish.css", "@keyframes just-added-flash", "the flash animation"]
  ,["src/production-polish.css", "@media(prefers-reduced-motion:reduce){.character-profile.just-added,.scene-card.just-added,.visual-take.just-added{animation:none}}", "flash respects prefers-reduced-motion"]
  // Celebrate completions: a richer, once-per-project #toast for a real
  // milestone, never a blocking dialog. project.milestones persists with
  // the project (not app-session state), so each celebration fires once
  // ever for that project, not once per launch.
  ,["src/storymaker.js", "function notifyCelebrate(title, detail)", "the celebration toast"]
  ,["src/storymaker.js", "function celebrateFirstGeneration()", "first-generation milestone, idempotent via project.milestones"]
  ,["src/storymaker.js", "function celebrateFirstSave()", "first-save milestone, idempotent via project.milestones"]
  ,["src/storymaker.js", "project.milestones = project.milestones && typeof project.milestones === \"object\" ? project.milestones : {};", "milestones persist with the project"]
  ,["src/storymaker.js", "if (project.milestones?.firstSave) notify(\"Project saved safely.\"); else celebrateFirstSave();", "saveProject celebrates only the first save"]
  ,["src/storymaker.js", "if (project.milestones?.firstGeneration) notify(\"Shot frame ready to review.\"); else celebrateFirstGeneration();", "Shot Director celebrates only the first generation"]
  ,["src/storymaker.js", "celebrateFirstGeneration();\n  return generated;", "bulk stills generation also triggers the first-generation milestone"]
  ,["src/production-polish.css", "#toast.celebrate{", "the celebration toast's warm styling"]
  // Ken Burns breathe on the splash art — anchored at the "Start Creating"
  // hotspot's own measured center (66.5%, 50%, matching the
  // data-splash-variant boxes above) so the CTA never drifts out from
  // under its invisible click target as the rest of the frame scales.
  ,["src/production-polish.css", "@keyframes launch-splash-ken-burns{from{transform:scale(1)}to{transform:scale(1.05)}}", "the Ken Burns zoom keyframes"]
  ,["src/production-polish.css", "transform-origin:66.5% 50%;animation:launch-splash-ken-burns", "the zoom is anchored on the Start Creating hotspot, not the image center"]
  ,["src/production-polish.css", "@media(prefers-reduced-motion:reduce){.launch-splash-art-bg{animation:none}}", "Ken Burns respects prefers-reduced-motion"]
  // Loading copy: swapped bare generic verbs (Working…/Generating…/
  // Analyzing…/Checking…) for a label that names what's actually
  // happening, matching the specific verbs the app already used elsewhere
  // (Rendering frame…, Directing your…) instead of a flat status word.
  ,["src/storymaker.js", '"Generating preview…"', "Style DNA preview generation names what it's doing"]
  ,["src/storymaker.js", '"Generating prop…"', "Prop Lab generation matches its Character/Set Lab siblings"]
  ,["src/storymaker.js", '"Reading closer…"', "AI story analysis loading label"]
  ,["src/storymaker.js", '"Verifying…"', "provider connection check loading label"]
  ,["src/storymaker.js", 'textContent = "Refreshing…"; await refreshProviders();', "refresh local engines matches its sibling refresh button's wording"]
  ,["src/storymaker.js", '"Rolling…"', "bulk generation buttons share one warmer loading label instead of a bare status word"]
  // Prompt-from-reference helper (Character/Prop/Set Lab): a reference
  // image existed but the design-brief field still had to be written
  // entirely by hand. Shares the existing vision-provider round trip
  // (renamed from drift-check-only to selectVisionProvider, since it was
  // already generic) rather than a second image-reading code path, and
  // fixed a real gap while reusing it: readImageAsBase64 (drift-check's
  // own image reader, now also this feature's) never validated the
  // renderer-supplied asset path against the session's authorized-media
  // allowlist the way media:read-bytes/run-ocr/upscale/save-copy already
  // do — closed at the shared source instead of only in the new caller.
  ,["electron-main.js", "const authorized = assertMediaPathAuthorized(localPath);", "drift-check's image reader is now path-confined like every other local-file IPC handler"]
  ,["electron-main.js", "const REFERENCE_DESCRIPTION_PROMPTS = {", "per-entity vision instructions for the reference-description helper"]
  ,["electron-main.js", "async function requestReferenceDescription(payload)", "Gemini/OpenAI dispatcher for describing a reference image"]
  ,["electron-main.js", 'ipcMain.handle("reference:describe"', "reference-description IPC handler registered"]
  ,["preload.js", "describeReference: (payload) => ipcRenderer.invoke(\"reference:describe\", payload)", "safe renderer bridge for the reference-description helper"]
  ,["src/storymaker.js", "function selectVisionProvider()", "vision-provider picker generalized beyond drift-check, its original only caller"]
  ,["src/storymaker.js", "async function describeReferenceForPrompt(kind, referenceAssetId, textareaId, button)", "shared Character/Prop/Set Lab prompt-from-reference helper"]
  ,["src/storymaker.js", 'id="characterLabDescribeReference"', "Character Lab describe-from-reference button"]
  ,["src/storymaker.js", 'id="propLabDescribeReference"', "Prop Lab describe-from-reference button"]
  ,["src/storymaker.js", 'id="setLabDescribeReference"', "Set Lab describe-from-reference button"]
  ,["src/production-polish.css", ".lab-describe-button", "the describe-from-reference button is styled as a secondary action"]
  // Rafter code-review on the above (2026-09-14) found a second, sharper gap
  // in readImageAsBase64 while reviewing it: its assetUrl branch fetched any
  // http(s) URL unconditionally, no authorization check at all — unlike the
  // local-path branch right above it. Every real previewUrl this function is
  // ever called with is pathToFileURL()-built (grepped every write site),
  // so a genuine remote URL never legitimately reaches it; the only way one
  // would is a crafted .storymaker project file's asset.previewUrl, making
  // this an unauthenticated SSRF primitive reachable from Check consistency
  // or Describe from reference. Removed rather than gated, since nothing
  // legitimate used it.
  ,["electron-main.js", "No branch for a raw http(s) assetUrl", "the SSRF-prone unconditional remote fetch was removed, not gated"]
  // Live-testing reference-description with a real connected Gemini key
  // (2026-09-14) surfaced a real 404: gemini-2.0-flash is retired. All
  // three of this file's generateContent call sites (completion fallback,
  // drift-check, reference-description) shared the one stale id — fixed
  // together, not just the one under test.
  ,["electron-main.js", "models/gemini-2.5-flash:generateContent", "every Gemini generateContent call uses the current model id, not the retired gemini-2.0-flash"]
  // The describe-from-reference button's disabled state was computed once
  // at modal-open time from hasPortrait/hasReference — but a successful
  // generate or import updates the reference gallery in place afterward
  // (deliberately, to avoid wiping the design brief on a full reopen — see
  // the comment above every such mountReferenceLibrary call), so the
  // button stayed stuck disabled even after a reference existed. Live-
  // caught: generated a real identity image, the button was still
  // disabled. Fixed once, generically, inside mountReferenceLibrary —
  // every generate-success and import-success path already calls it.
  ,["src/storymaker.js", "if (images.length) [\"characterLabDescribeReference\", \"propLabDescribeReference\", \"setLabDescribeReference\"]", "describe-from-reference button re-enables when a reference actually exists, not just at modal-open time"]
  // Still live-testing (2026-09-14): the model-id fix above made the
  // Gemini call succeed, but the returned description came back truncated
  // mid-sentence ("...weathered appearance. Their") with token budget
  // unused. Root cause: gemini-2.5-flash "thinks" by default and that
  // reasoning is billed against the same max_output_tokens ceiling as the
  // visible answer — with a low ceiling, thinking can consume nearly all
  // of it. Disabled thinking on all three of this file's generateContent
  // call sites, since none need chain-of-thought for what they're asked.
  ,["electron-main.js", "thinkingConfig: { thinkingBudget: 0 }", "gemini-2.5-flash thinking disabled everywhere it would silently eat the answer's own token budget"]
  // Three improvement ideas the user asked for directly (2026-09-15):
  // undo, a running spend tracker, and real onboarding.
  //
  // 1. UNDO — five destructive actions (remove character/set/prop/shot,
  // delete Style DNA) used to be either an unrecoverable confirm() dialog
  // or, for character removal, no confirmation at all. Replaced with a
  // single-slot whole-project-snapshot Undo toast (withUndo/notifyUndo) —
  // simpler and more reliable than hand-reconstructing each action's
  // cascading side effects (a removed character touches every scene's
  // castIds; a removed style touches scene/shot overrides and favorites).
  ,["src/storymaker.js", "let pendingUndo = null;", "single-slot undo snapshot state"]
  ,["src/storymaker.js", "function withUndo(label, mutate)", "shared snapshot-before/restore-after undo wrapper"]
  ,["src/storymaker.js", "function notifyUndo(label, restore)", "the Undo toast itself, third #toast variant alongside plain and celebrate"]
  ,["src/storymaker.js", "withUndo(`\"${character.name}\" removed.`", "character removal is undoable, not just confirmed"]
  ,["src/storymaker.js", "withUndo(`\"${set.name}\" removed.`", "set removal is undoable"]
  ,["src/storymaker.js", "withUndo(`\"${item.name}\" removed.`", "prop removal is undoable"]
  ,["src/storymaker.js", "withUndo(`\"${shot.title}\" removed from the plan.`", "shot removal is undoable"]
  ,["src/production-polish.css", "#toast.undo", "the Undo toast is styled as a row with an inline action button"]
  //
  // 2. SPEND TRACKER — projectCostSummary() already powered Delivery's cost
  // panel, but that's a page most people only visit near the end of a
  // project; this is BYO-API-key, real money per click, with no way to see
  // running spend without navigating away mid-work. Surfaced the same
  // summary (not a second tally — same function, same numbers) as a
  // persistent badge in the top bar, present on every workspace.
  ,["src/storymaker.js", "const spend = projectCostSummary();", "top-bar spend badge reuses Delivery's existing cost summary, not a second tally"]
  ,["src/storymaker.js", "class=\"quiet-button spend-badge\"", "persistent top-bar spend badge, visible on every workspace"]
  ,["src/i18n/en.mjs", "shell.spend.badge", "spend badge copy is localized like the rest of the top bar"]
  ,["src/production-polish.css", ".spend-badge", "spend badge styled as a quiet-button variant, not an alarm color"]
  //
  // 3. ONBOARDING — homeProductionStatus() already walks a first-time user
  // through story → style → cast → storyboard → shots one guided step at a
  // time, and Home's own !hasStory branch is a deliberately single-CTA
  // first-run experience (see home()'s own comment on this) — but
  // "Create workspace" sent every new project straight to Story Bible,
  // skipping both. Not a new checklist; routing new projects to the guided
  // flow that already existed and was simply never shown to them.
  ,["src/storymaker.js", "active = \"Home\"; closeModal(); render(); notify(\"Project workspace created.\");", "a new project lands on Home's guided first-run flow, not Story Bible"]
];

for (const [file, marker, label] of assertions) {
  if (!read(file).includes(marker)) throw new Error(`Release smoke failed: missing ${label} in ${file}.`);
}
if (/if \(!frameControlEnabled\) \{\s*settings\.startFrameAssetId\s*=/.test(read("src/storymaker.js"))) throw new Error("Release smoke failed: browsing a non-frame model must not discard the creator's selected Start Frame.");
if (!/runDurableGeneration\([^)]*\)\s*\{\s*assertLicensed\(\);/.test(read("electron-main.js"))) throw new Error("Release smoke failed: runDurableGeneration must call assertLicensed() before starting any generation — that's the licensing gate for every image/video render.");
if (!fs.existsSync(path.join(root, "assets", "app-icon.icns"))) throw new Error("Release smoke failed: macOS application icon is missing.");
if (/async function renderVisualPreview\(payload\)/.test(read("electron-main.js"))) throw new Error("Release smoke failed: dead duplicate renderVisualPreview(payload) must not return — it shares a name with the real, live renderVisualPreview() call site in storymaker.js, which is exactly how it went unnoticed as dead code.");
if (read("resolve-bridge/send_to_resolve.py").includes("AddItemListToMediaPool")) throw new Error("Release smoke failed: send_to_resolve.py must not call AddItemListToMediaPool — that method lives on MediaStorage, not MediaPool, and silently doesn't exist there.");
{
  // Confirmed live: Sentry.init() (called inside initTelemetry()) has to
  // run before app.whenReady() resolves, or it throws an unhandled
  // rejection deep inside IPC setup that hung the process in testing.
  // Asserts the actual source ORDER, not just that both exist — the
  // failure mode here is someone moving the initTelemetry() call below
  // app.whenReady() later, which every other assertion in this file
  // would miss entirely since both strings would still be "present".
  const main = read("electron-main.js");
  const initCallIndex = main.indexOf("initTelemetry();");
  // ".then(" narrows this to the real call site — the explanatory
  // comment right above initTelemetry() itself also contains the bare
  // substring "app.whenReady()", which without this would make the
  // check pass even if the real call were moved after it.
  const whenReadyIndex = main.indexOf("app.whenReady().then(");
  if (initCallIndex === -1 || whenReadyIndex === -1 || initCallIndex > whenReadyIndex) {
    throw new Error("Release smoke failed: initTelemetry() must be called before app.whenReady() — calling Sentry.init() any later throws and hangs, confirmed live.");
  }
}
{
  // A real credential-leak guard, not just a style preference: confirms
  // sentry.config.json (the local, gitignored DSN file) is not actually
  // tracked by git, in case .gitignore alone was ever bypassed with a
  // forced `git add`.
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "sentry.config.json"], { cwd: root, encoding: "utf8" });
  if (result.status === 0) throw new Error("Release smoke failed: sentry.config.json must never be committed — it can carry a real Sentry DSN.");
}
console.log(`STORYMAKER_RELEASE_SMOKE_OK (${assertions.length} checks)`);
