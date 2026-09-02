import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src", "visual-direction.js"), "utf8");
const visual = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const paper = visual.layeredPaperEditorial();
assert.equal(paper.id, "system-layered-paper-editorial");
assert.match(paper.promptBlocks.negative, /plastic/i);
assert.ok(paper.camera.forbiddenMovements.includes("orbit"));

const custom = visual.defaultStyleDna({ id: "custom-style", name: "Custom", promptBlocks: { image: "soft practical lighting", negative: "logos" } });
const project = { styleDnas: [custom], style: "Custom", scenes: [{ id: "scene-a", appliedStyleDnaId: "custom-style", shots: [] }] };
const state = visual.migrateVisualDirection(project, []);
assert.equal(state.projectStyle.styleId, "custom-style");
assert.equal(state.sceneOverrides["scene-a"].styleId, "custom-style");
project.visualDirection = state;
const resolved = visual.resolveVisualDirection(project, { scene: project.scenes[0] });
assert.equal(resolved.style.id, "custom-style");
assert.ok(visual.stylePromptBlocks(resolved.style, "image").positive.includes("soft practical lighting"));

const contextual = visual.defaultStyleDna({
  id: "contextual-style",
  name: "Contextual",
  promptBlocks: {
    image: "a single coherent illustrated world",
    character: "expressive hand-drawn faces and clean silhouette language",
    environment: "layered painted architecture and atmospheric depth",
    prop: "playful crafted prop geometry and tactile materials",
    negative: "photorealism, logos"
  }
});
assert.match(visual.stylePromptBlocks(contextual, "image", "character").positive.join(" "), /expressive hand-drawn faces/i);
assert.match(visual.stylePromptBlocks(contextual, "image", "environment").positive.join(" "), /layered painted architecture/i);
assert.match(visual.stylePromptBlocks(contextual, "image", "prop").positive.join(" "), /playful crafted prop geometry/i);

const version = visual.styleVersion(custom, { description: "A revised custom direction" });
visual.appendStyleHistory(state, custom);
assert.equal(version.version, 2);
assert.equal(visual.styleHistoryFor(state, custom.id).length, 1);

const mix = visual.blendStyles([{ style: paper, weight: 65 }, { style: custom, weight: 35 }]);
assert.equal(mix.source, "remixed");
assert.match(mix.description, /65%/);
assert.match(mix.promptBlocks.negative, /plastic/i);

console.log("Visual Direction smoke checks passed.");
