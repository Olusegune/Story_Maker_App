const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const DAYPARTS = ["DAY", "NIGHT", "MORNING", "EVENING", "DAWN", "DUSK", "LATER", "CONTINUOUS", "SAME"];
const TRANSITIONS = /^(FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP|WIPE|TITLE|THE END|CONTINUED|MORE|OMITTED)/i;
const CHARACTER_EXCLUDE = /^(INT|EXT|INT\.\/EXT|I\/E|FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP|TITLE|THE END|CONTINUED|MORE|OMITTED|NOTE|ACTION|SFX|MUSIC)$/i;

function decodeEntities(value) {
  return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

function stripMarkup(value) {
  return decodeEntities(String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n").replace(/<[^>]+>/g, ""));
}

function readZipEntries(buffer) {
  const entries = new Map();
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error("This archive is missing a ZIP directory.");
  const count = buffer.readUInt16LE(eocd + 10); const centralOffset = buffer.readUInt32LE(eocd + 16);
  let cursor = centralOffset;
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("This ZIP archive has an invalid directory entry.");
    const method = buffer.readUInt16LE(cursor + 10); const compressedSize = buffer.readUInt32LE(cursor + 20); const nameLength = buffer.readUInt16LE(cursor + 28); const extraLength = buffer.readUInt16LE(cursor + 30); const commentLength = buffer.readUInt16LE(cursor + 32); const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26); const localExtraLength = buffer.readUInt16LE(localOffset + 28); const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) entries.set(name, compressed); else if (method === 8) entries.set(name, zlib.inflateRawSync(compressed)); else throw new Error(`Unsupported ZIP compression method ${method}.`);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function xmlText(buffer) {
  const xml = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : String(buffer || "");
  return stripMarkup(xml.replace(/<w:tab\s*\/?\s*>/gi, "\t").replace(/<w:br\s*\/?\s*>/gi, "\n").replace(/<text:tab\s*\/?\s*>/gi, "\t").replace(/<text:line-break\s*\/?\s*>/gi, "\n")).replace(/\r/g, "");
}

function extractPdfText(filePath) {
  const result = spawnSync("pdftotext", ["-layout", filePath, "-"], { encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (!result.error && result.status === 0 && result.stdout.trim()) return { text: result.stdout, warnings: [] };
  return { text: "", warnings: ["PDF text extraction is unavailable on this device. Install Poppler/pdftotext or provide a text-based source."] };
}

function readSource(filePath) {
  const extension = path.extname(filePath).toLowerCase(); const name = path.basename(filePath);
  if ([".pdf"].includes(extension)) return { name, type: "pdf", ...extractPdfText(filePath) };
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff"].includes(extension)) return { name, type: "image", text: "", warnings: ["Image OCR is queued for the OCR worker. The image is preserved as a source asset until OCR is approved."] };
  const raw = fs.readFileSync(filePath);
  if ([".docx", ".odt", ".fdx", ".celtx"].includes(extension)) {
    const entries = readZipEntries(raw); const preferred = extension === ".odt" ? ["content.xml"] : extension === ".fdx" ? ["Final Draft FDX document.xml"] : extension === ".celtx" ? ["script.xml", "project.xml"] : ["word/document.xml"];
    const xml = preferred.map((candidate) => entries.get(candidate)).find(Boolean) || [...entries.entries()].find(([entry]) => /document\.xml$|content\.xml$/i.test(entry))?.[1];
    if (!xml) throw new Error(`Could not find the document body inside ${name}.`);
    return { name, type: extension.slice(1), text: xmlText(xml), warnings: [] };
  }
  if (extension === ".doc") return { name, type: "doc", text: "", warnings: ["Legacy .doc files need conversion to .docx, PDF, Fountain, or plain text before they can be parsed reliably."] };
  let text = raw.toString("utf8").replace(/^\uFEFF/, "");
  if ([".html", ".htm"].includes(extension)) text = stripMarkup(text);
  if (extension === ".rtf") text = text.replace(/\\'[0-9a-f]{2}/gi, "").replace(/\\[a-z]+\d* ?/gi, "").replace(/[{}]/g, "");
  return { name, type: extension.slice(1) || "text", text, warnings: [] };
}

function sceneHeading(line) {
  const match = String(line || "").trim().match(/^(INT\.?\s*\/\s*EXT|INT\.?|EXT\.?|I\/E)\s*[-.]?\s+(.+?)(?:\s+[-–—]\s+(.+))?$/i);
  if (!match) return null;
  const raw = match[2].trim(); const parts = raw.split(/\s+[-–—]\s+/); const location = parts[0].trim(); const time = (parts[1] || match[3] || "").trim().toUpperCase();
  return { heading: String(line).trim(), location, interiorExterior: match[1].replace(/\./g, "").toUpperCase(), timeOfDay: DAYPARTS.includes(time) ? time : "UNSPECIFIED" };
}

function likelyCharacter(line, nextLine) {
  const value = String(line || "").trim(); const normalized = value.replace(/\s+\([^)]*\)$/, "").trim();
  if (!value || value.length < 2 || value.length > 48 || !/^[A-Z0-9][A-Z0-9 .,'-]*$/.test(normalized) || CHARACTER_EXCLUDE.test(normalized) || TRANSITIONS.test(normalized)) return false;
  return Boolean(nextLine && String(nextLine).trim());
}

function nextNonEmpty(lines, index) {
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    if (String(lines[cursor] || "").trim()) return lines[cursor];
  }
  return "";
}

function normalizeScreenplayLine(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/[\u2013\u2014]/g, "-");
}

function sceneHeadingFlexible(line) {
  const normalized = normalizeScreenplayLine(line).trim().replace(/^(?:SCENE\s+)?\d+[.)\]:-]*\s*/i, "");
  const match = normalized.match(/^(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|INT\.?|EXT\.?|I\/E)\s*[-.]?\s+(.+?)(?:\s+-\s+(.+))?$/i);
  if (!match) return null;
  const parts = match[2].trim().split(/\s+-\s+/);
  const location = parts[0].trim();
  const time = (parts[1] || match[3] || "").trim().toUpperCase();
  return { heading: String(line).trim(), location, interiorExterior: match[1].replace(/\./g, "").toUpperCase(), timeOfDay: DAYPARTS.some((part) => time.startsWith(part)) ? time : "UNSPECIFIED" };
}

function addDetectedProps(line, props, lineNumber) {
  const match = String(line || "").match(/\b(knife|gun|phone|car|key|camera|book|letter|watch|bag|sword|ring|bottle|laptop|tablet|briefcase|passport|helmet|mask|microphone|guitar|weapon|vehicle)\b/ig);
  (match || []).forEach((prop) => {
    const key = prop.toLowerCase();
    if (!props.has(key)) props.set(key, { id: `prop-${props.size + 1}`, name: prop, category: /car|vehicle/i.test(prop) ? "vehicle" : "identified object", importance: "background", source: { lineStart: lineNumber, lineEnd: lineNumber } });
  });
}

function sourceEvidence(lineStart, lineEnd = lineStart) {
  return { lineStart, lineEnd, provenance: "documented" };
}

function productionSignals(lines, scenes) {
  const performance = []; const lighting = []; const audio = []; const effects = []; const camera = []; const continuity = [];
  const cameraPattern = /\b(close[- ]?up|wide(?: shot)?|medium(?: shot)?|extreme close[- ]?up|over[- ]?the[- ]?shoulder|pov|point of view|low angle|high angle|dolly|tracking|handheld|crane|pan|tilt|zoom|rack focus|\d{2,3}mm)\b/i;
  const lightingPattern = /\b(backlit|key light|fill light|rim light|candlelight|moonlight|neon|practical(?: light)?|golden hour|overcast|fog|smoke|rain|shadow|silhouette|color temperature)\b/i;
  const audioPattern = /\b(sfx|sound effect|ambience|ambient|music|score|song|silence|voiceover|v\.?o\.|f[\/.]?x|foley|whisper|shouts?)\b/i;
  const effectPattern = /\b(vfx|visual effect|composite|screen replacement|explosion|particle|cg(?:i)?|matte painting|transition)\b/i;
  const performancePattern = /\b(beat|pause|hesitates|sighs|smiles|cries|angry|fearful|nervous|relieved|whispers|stares|turns away|eye line|gesture)\b/i;
  const continuityPattern = /\b(same (?:costume|wardrobe|location|time|day|night|room|weapon|prop)|continues|still wearing|returns|again)\b/i;
  lines.forEach((raw, index) => {
    const text = String(raw || "").trim(); if (!text) return;
    const evidence = sourceEvidence(index + 1);
    const scene = scenes.find((item) => item.source.lineStart <= index + 1 && item.source.lineEnd >= index + 1);
    const sceneId = scene?.id || "";
    if (cameraPattern.test(text)) camera.push({ sceneId, note: text, ...evidence });
    if (lightingPattern.test(text)) lighting.push({ sceneId, note: text, ...evidence });
    if (audioPattern.test(text)) audio.push({ sceneId, note: text, ...evidence });
    if (effectPattern.test(text)) effects.push({ sceneId, note: text, ...evidence });
    if (performancePattern.test(text)) performance.push({ sceneId, note: text, ...evidence });
    if (continuityPattern.test(text)) continuity.push({ sceneId, note: text, ...evidence });
  });
  return { performance, lighting, audio, effects, camera, continuity };
}

function parseStoryStructure(text) {
  const normalizedText = normalizeScreenplayLine(String(text || "").replace(/\r/g, ""));
  const lines = normalizedText.split("\n"); const scenes = []; const characters = new Map(); const locations = new Map(); const props = new Map(); let current = null; let action = []; let activeDialogue = null;
  const flushAction = () => { if (current && action.length) current.action.push(...action.splice(0)); else action = []; };
  const flushDialogue = () => { if (activeDialogue && current) { activeDialogue.text = activeDialogue.lines.join(" ").trim(); activeDialogue.source.lineEnd = activeDialogue._lineEnd; delete activeDialogue.lines; delete activeDialogue._lineEnd; if (activeDialogue.text) current.dialogue.push(activeDialogue); } activeDialogue = null; };
  lines.forEach((raw, index) => {
    const line = raw.trim();
    // PDF/DOC exports often insert a blank line between a speaker cue and the
    // dialogue. Keep an empty dialogue open when the next substantive line is
    // not another cue or slugline; otherwise a valid screenplay loses every
    // line of dialogue on import.
    if (!line) {
      const following = nextNonEmpty(lines, index);
      if (activeDialogue && !activeDialogue.lines.length && following && !likelyCharacter(following, nextNonEmpty(lines, index + 1)) && !sceneHeadingFlexible(following) && !sceneHeading(following)) return;
      flushDialogue(); flushAction(); return;
    }
    const heading = sceneHeadingFlexible(line) || sceneHeading(line);
    if (heading) { flushDialogue(); flushAction(); current = { id: `scene-${scenes.length + 1}`, sceneNumber: scenes.length + 1, title: heading.location, ...heading, objective: "", emotionalPurpose: "", storyBeat: "", beginning: "", middle: "", end: "", estimatedDurationSeconds: 45, action: [], dialogue: [], source: { lineStart: index + 1, lineEnd: index + 1 } }; scenes.push(current); locations.set(heading.location.toLowerCase(), { name: heading.location, description: "Imported scene location.", source: { lineStart: index + 1, lineEnd: index + 1 } }); return; }
    if (activeDialogue) { if (likelyCharacter(line, nextNonEmpty(lines, index)) || sceneHeadingFlexible(line) || sceneHeading(line)) flushDialogue(); else { activeDialogue.lines.push(line); addDetectedProps(line, props, index + 1); activeDialogue._lineEnd = index + 1; if (current?.source) current.source.lineEnd = index + 1; return; } }
    if (likelyCharacter(line, nextNonEmpty(lines, index))) { flushAction(); const name = line.replace(/\s*\([^)]*\)\s*$/, "").trim(); if (!characters.has(name.toLowerCase())) characters.set(name.toLowerCase(), { id: `character-${characters.size + 1}`, name, aliases: [], role: "", description: "", personality: "", goals: "", relationships: [], physicalDescription: "", emotionalProfile: "", importance: "supporting", screenTimeEstimateSeconds: 0, source: { lineStart: index + 1, lineEnd: index + 1 } }); activeDialogue = { character: name, text: "", lines: [], source: { lineStart: index + 1, lineEnd: index + 1 }, _lineEnd: index + 1 }; return; }
    if (current) { action.push(line); addDetectedProps(line, props, index + 1); if (current.source) current.source.lineEnd = index + 1; }
  });
  flushDialogue();
  flushAction(); scenes.forEach((scene) => { const actionText = scene.action.join(" "); scene.storyBeat = actionText.slice(0, 240); scene.beginning = scene.action.slice(0, Math.max(1, Math.ceil(scene.action.length / 3))).join(" ").slice(0, 240); scene.middle = scene.action.slice(Math.ceil(scene.action.length / 3), Math.ceil(scene.action.length * 2 / 3)).join(" ").slice(0, 240); scene.end = scene.action.slice(Math.ceil(scene.action.length * 2 / 3)).join(" ").slice(0, 240); scene.dialogue.forEach((line) => { const character = characters.get(String(line.character).toLowerCase()); if (character) character.screenTimeEstimateSeconds += 8; }); delete scene.action; });
  const textLower = normalizedText.toLowerCase(); const themeWords = [["memory", "Memory"], ["belong", "Belonging"], ["truth", "Truth"], ["grief", "Grief"], ["love", "Love"], ["fear", "Fear"], ["hope", "Hope"], ["identity", "Identity"], ["freedom", "Freedom"]];
  const signals = productionSignals(lines, scenes);
  scenes.forEach((scene) => {
    scene.provenance = "documented";
    scene.cameraNotes = signals.camera.filter((item) => item.sceneId === scene.id);
    scene.lightingNotes = signals.lighting.filter((item) => item.sceneId === scene.id);
    scene.audioNotes = signals.audio.filter((item) => item.sceneId === scene.id);
    scene.performanceNotes = signals.performance.filter((item) => item.sceneId === scene.id);
    scene.effectsNotes = signals.effects.filter((item) => item.sceneId === scene.id);
    scene.continuityNotes = signals.continuity.filter((item) => item.sceneId === scene.id);
  });
  const warnings = [];
  if (!scenes.length && normalizedText.trim()) warnings.push("No screenplay sluglines were found. The document was retained; add INT./EXT. scene headings for the most precise scene breakdown.");
  if (scenes.length && !characters.size) warnings.push("Scenes were found but no dialogue cues were detected. Character profiles can still be added manually.");
  const confidence = scenes.length ? Math.min(0.96, 0.68 + Math.min(scenes.length, 8) * 0.025 + Math.min(characters.size, 6) * 0.015) : characters.size ? 0.5 : 0.18;
  return { version: 3, status: "needs-review", confidence, story: { title: "", genre: "", logline: "", synopsis: "", themes: themeWords.filter(([needle]) => textLower.includes(needle)).map(([, label]) => label), tone: "", emotionalArc: "", worldRules: "", timeline: "", provenance: "inferred" }, scenes, characters: [...characters.values()], locations: [...locations.values()], props: [...props.values()], sets: [], ...signals, warnings };
}

function ingestStoryFile(filePath) { const source = readSource(filePath); return { ...source, analysis: parseStoryStructure(source.text), importedAt: new Date().toISOString(), filePath }; }
function ingestStoryText(text, name = "Pasted story") {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  return { name: String(name || "Pasted story").slice(0, 140), type: "clipboard", text: normalized, warnings: normalized.trim() ? [] : ["Paste story material before continuing."], analysis: parseStoryStructure(normalized), importedAt: new Date().toISOString(), filePath: "" };
}

module.exports = { ingestStoryFile, ingestStoryText, parseStoryStructure, readSource };
