import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ingestStoryFile, ingestStoryText } = require("../story-ingest.js");
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "storymaker-ingest-"));
const file = path.join(folder, "sample.fountain");
fs.writeFileSync(file, `INT. OLD HOUSE - NIGHT\n\nMARA enters with a phone and a letter. A handheld close-up follows her through candlelight and smoke.\n\nMARA\nI thought you were gone.\n\nSFX: A car engine starts outside.\n\nEXT. OLD HOUSE - DAWN\n\nA car waits in the fog.\n`, "utf8");
const result = ingestStoryFile(file);
const analysis = result.analysis;
const pasted = ingestStoryText("INT. STUDIO - DAY\n\nMARA\nWe begin again.");
const exported = ingestStoryText("12. INT. KITCHEN - NIGHT\n\nMARA (V.O.)\n\nI kept the passport.\n\n13. EXT. ROOFTOP - DAWN\n\nJON\n\nThe car is waiting.", "exported screenplay");
const assertions = [
  ["source text", result.text.includes("MARA")],
  ["two scenes", analysis.scenes.length === 2],
  ["character", analysis.characters.some((character) => character.name === "MARA")],
  ["location", analysis.locations.some((location) => location.name === "OLD HOUSE")],
  ["dialogue", analysis.scenes[0]?.dialogue?.[0]?.text === "I thought you were gone."],
  ["prop", analysis.props.some((prop) => prop.name.toLowerCase() === "phone")],
  ["camera signal", analysis.camera.some((note) => /handheld/i.test(note.note))],
  ["lighting signal", analysis.lighting.some((note) => /candlelight/i.test(note.note))],
  ["audio signal", analysis.audio.some((note) => /engine/i.test(note.note))],
  ["clipboard source", pasted.type === "clipboard" && pasted.analysis.scenes.length === 1],
  ["numbered sluglines", exported.analysis.scenes.length === 2],
  ["spaced dialogue cue", exported.analysis.characters.some((character) => character.name === "MARA") && exported.analysis.scenes[0]?.dialogue?.[0]?.text === "I kept the passport."],
  ["extended prop vocabulary", exported.analysis.props.some((prop) => prop.name.toLowerCase() === "passport")]
];
for (const [label, passed] of assertions) if (!passed) throw new Error(`Ingestion smoke failed: ${label}`);
console.log(`Ingestion smoke passed (${assertions.length} assertions).`);
fs.rmSync(folder, { recursive: true, force: true });
