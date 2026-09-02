import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
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

// Final scene renders receive selected continuity references automatically, with
// the assigned character, set, prop and accessory assets protected in the picker.
assert.match(ui, /const assignedContinuityReferenceIds = \(scene\) =>/);
assert.match(read("src\/production-polish.css"), /\.continuity-locked/);
assert.match(ui, /const continuityAndManualIds = \[\.\.\.new Set\(\[\.\.\.automaticReferenceIds, \.\.\.manualReferenceIds\]\)\]/);
assert.match(ui, /characterReferenceIds/);
assert.match(ui, /entityReferenceIds/);
assert.match(ui, /category: prop\?\.category \|\| "prop"/);

console.log("STORYMAKER_STYLE_PROPAGATION_OK (backend lock, all creation contexts, automatic continuity)");
