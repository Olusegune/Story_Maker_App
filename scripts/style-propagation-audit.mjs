import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Normalizes CRLF -> LF so marker matching is immune to checkout-time
// line-ending conversion (a fresh clone/CI checkout can differ from a
// locally-edited working tree here) — see the matching note in
// release-smoke.mjs, where this exact class of bug was caught live.
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const main = read("electron-main.js");
const ui = read("src/storymaker.js");

// The backend is the final common path for OpenAI, Gemini, Fal, WaveSpeed, Kie
// and local image/video adapters. A stored prompt may never bypass the active DNA.
assert.match(main, /function styleEnforcementPrompt\(payload, settings, kind = "image"\)/);
assert.match(main, /STYLE DNA LOCK/);
assert.match(main, /function resolvedShotPrompt\(payload, settings, kind\)/);
assert.match(main, /const styleLock = styleEnforcementPrompt\(payload, settings, kind\);/);
assert.match(main, /return styleLock \? `\$\{styleLock\}\\n\\n\$\{base\}` : base;/);
assert.doesNotMatch(main, /if \(precomputed\) return precomputed;/);
assert.match(main, /const prompt = resolvedShotPrompt\(payload, settings, "image"\)/);
assert.match(main, /resolvedShotPrompt\(payload, settings, "video"\)/);

// Every first-class image production surface supplies a context, so Style DNA
// can express its character, set, prop/accessory, and storyboard vocabulary.
for (const context of ["character", "environment", "prop", "storyboard"]) {
  assert.match(ui, new RegExp(`styleContext: "${context}"`));
}
assert.match(ui, /visualDirection: project\.visualDirection/);

// The assigned character/set/prop/accessory cast for a scene is surfaced in
// the Shot Director's reference picker as a labeled "SCENE CAST" suggestion
// — 0.4.59 stopped force-merging it into every render (it used to be
// undeletable, disabled-checkbox "protected" tiles, silently injecting a
// character's entire reference library into every shot in the scene whether
// or not that character actually belonged in the shot). What actually gets
// sent for generation must be exactly what the user checked. 0.4.61 went a
// step further: with no active search, the picker shows only this scene's
// own suggestions plus whatever's already attached, not the whole project
// Media Library — a search box narrows/expands into the rest on demand.
assert.match(ui, /const assignedContinuityReferenceIds = \(scene\) =>/);
assert.match(read("src\/production-polish.css"), /\.continuity-locked/);
assert.match(read("src\/production-polish.css"), /\.continuity-suggested/);
assert.match(ui, /const suggestedReferenceIds = automaticReferenceIds;/);
assert.match(ui, /const applyReferenceSearchFilter = \(\) =>/);
assert.match(ui, /isRelevantByDefault = tile\.classList\.contains\("continuity-suggested"\)/);
assert.match(ui, /referenceAssetIds: manualReferenceIds/);
assert.doesNotMatch(ui, /const continuityAndManualIds = \[\.\.\.new Set\(\[\.\.\.automaticReferenceIds, \.\.\.manualReferenceIds\]\)\]/);
assert.match(ui, /characterReferenceIds/);
assert.match(ui, /entityReferenceIds/);
assert.match(ui, /category: prop\?\.category \|\| "prop"/);

// GPT Image 2.5 (Flare + Sunburst), added 2026-09-08 via OpenAI direct and
// fal. The Responses API image_generation tool used to be called with no
// "model" field at all, silently ignoring whatever the user picked in Model
// Hub — the fix here is what makes model selection work for real, not just
// what adds the two new models.
assert.match(main, /const IMAGE_QUALITY_TO_API = \{ Fast: "low", Balanced: "medium", High: "high", "Very High": "xhigh", Maximum: "max" \};/);
assert.match(main, /const imageModel = settings\.model === "gpt-image-2" \? "gpt-image-1" : String\(settings\.model \|\| "gpt-image-1"\);/);
assert.doesNotMatch(main, /String\(settings\.model \|\| "gpt-image-1"\)\.replace\("gpt-image-2", "gpt-image-1"\)/);
assert.match(main, /tools: \[\{ type: "image_generation", model: imageModel, action: references\.length \? "edit" : "generate", size, quality, background, output_format: "png" \}\]/);
assert.match(main, /const isGptImage25 = model === "fal-gpt-image-2\.5-flare" \|\| model === "fal-gpt-image-2\.5-sunburst";/);
for (const id of ["gpt-image-2.5-flare", "gpt-image-2.5-sunburst", "fal-gpt-image-2.5-flare", "fal-gpt-image-2.5-sunburst"]) {
  assert.match(main, new RegExp(`"${id.replace(/\./g, "\\.")}": \\{ output: "image"`));
  assert.match(ui, new RegExp(`"${id.replace(/\./g, "\\.")}": \\{ ratios:`));
  assert.match(ui, new RegExp(`model: "${id.replace(/\./g, "\\.")}"`));
}
assert.match(ui, /qualityTiers: \["Fast", "Balanced", "High", "Very High", "Maximum"\]/);
assert.match(ui, /data-capability="background">BACKGROUND<select id="shotBackground">/);
assert.match(ui, /replaceOptions\(\$\("#shotQuality"\), capability\.qualityTiers \|\| \["Fast", "Balanced", "High"\]/);

// 21:9 for GPT Image 2.5: OpenAI-direct already reused the existing
// cropImageToAspectRatio path automatically (it's keyed on aspectRatio, not
// model); fal needed its own crop step since fal has no native 21:9 preset
// either. Character/Prop Lab's Output Ratio selects were missing 21:9
// entirely (Set Lab already had it) — fixed for consistency across all 3.
assert.match(main, /if \(String\(settings\.aspectRatio \|\| ""\) === "21:9"\) \{ await cropImageToAspectRatio\(asset\.path, "21:9"\); const info = fs\.statSync\(asset\.path\); asset\.size = info\.size; asset\.modifiedAt = info\.mtime\.toISOString\(\); \} markProviderVerified\("fal"/);
assert.match(ui, /id="characterLabAspect"><option>1:1<\/option><option>3:2<\/option><option>2:3<\/option><option>16:9<\/option><option>9:16<\/option><option>21:9<\/option>/);
assert.match(ui, /id="propLabAspect"><option>1:1<\/option><option>3:2<\/option><option>16:9<\/option><option>9:16<\/option><option>21:9<\/option>/);

console.log("STORYMAKER_STYLE_PROPAGATION_OK (backend lock, all creation contexts, automatic continuity, GPT Image 2.5)");
