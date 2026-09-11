const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const DAYPARTS = ["DAY", "NIGHT", "MORNING", "EVENING", "DAWN", "DUSK", "LATER", "CONTINUOUS", "SAME"];
const TRANSITIONS = /^(FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP|WIPE|TITLE|THE END|CONTINUED|MORE|OMITTED)/i;
const CHARACTER_EXCLUDE = /^(INT|EXT|INT\.\/EXT|I\/E|FADE|CUT|DISSOLVE|SMASH|MATCH|JUMP|TITLE|THE END|CONTINUED|MORE|OMITTED|NOTE|ACTION|SFX|MUSIC)$/i;
// Structural/section labels (act breaks, chapter headings, prologue, etc.)
// are ALL-CAPS lines immediately followed by body text, which is exactly
// the shape likelyCharacter() looks for — without this, "ACT ONE" or
// "CHAPTER 1" gets imported as a cast member.
const STRUCTURAL_LABEL = /^(?:END OF )?(?:ACT|PART|CHAPTER|BOOK|EPISODE|SCENE)\s+[A-Z0-9]+$|^(?:PROLOGUE|EPILOGUE|COLD OPEN|TEASER|INTERMISSION|FLASHBACK|FLASH FORWARD|MONTAGE|INTERCUT|END OF EPISODE|OPENING|ENDING|CLOSING|FADE IN|FADE OUT|FADE TO BLACK)$/i;
// Treatments and outlines commonly number their beats ("1. THE SETUP").
// The digit-plus-period prefix means these already satisfy the ALL-CAPS
// character-cue shape (digits and periods are both allowed by that
// pattern) — without this, a numbered heading gets imported as a cast
// member, and since the real characters never get detected, their names
// can end up misread as locations downstream.
// Lookahead, not a consumed character — this pattern also gets used with
// .replace() to strip the numbering off a heading for the scene title, and
// a consumed \S would eat the heading's first real letter along with it
// ("1. THE SETUP" -> "HE SETUP").
const NUMBERED_HEADING = /^\d+[.):]\s+(?=\S)/;
// A character is often introduced with a title ("CAPTAIN DIALLO") and
// referred to by the bare name afterward ("DIALLO") — standard screenplay
// convention. Without this, the same person registers as two characters.
const NAME_TITLE_PREFIX = /^(?:CAPTAIN|DETECTIVE|SERGEANT|LIEUTENANT|OFFICER|AGENT|DOCTOR|DR|PROFESSOR|JUDGE|SENATOR|GENERAL|COLONEL|MAJOR|PRESIDENT|KING|QUEEN|PRINCE|PRINCESS|FATHER|MOTHER|SISTER|BROTHER|UNCLE|AUNT|MR|MRS|MS|MISS|REVEREND|RABBI|CHIEF|COACH)\.?\s+/i;
function resolveCharacterKey(name, characters) {
  const fullKey = name.toLowerCase();
  if (characters.has(fullKey)) return fullKey;
  const bareKey = name.replace(NAME_TITLE_PREFIX, "").trim().toLowerCase();
  if (bareKey !== fullKey && characters.has(bareKey)) return bareKey;
  for (const key of characters.keys()) {
    if (key.replace(NAME_TITLE_PREFIX, "").trim() === bareKey && bareKey) return key;
  }
  return fullKey;
}
// Prose, treatments, and outlines never carry INT./EXT. sluglines, so the
// slugline-only scene detector above finds nothing for them — this is the
// fallback that gives a paste/import without formal screenplay formatting
// a real scene breakdown instead of "0 scenes" with no way to attach the
// characters and dialogue that WERE found. A chapter/section marker or a
// time/location-shift phrase at the start of a paragraph is treated as a
// hard scene break; with no such signals anywhere, paragraphs are grouped
// into word-count-sized chunks so a whole prose piece still becomes a
// handful of scenes rather than one undifferentiated block.
const PROSE_SCENE_MARKER = new RegExp(`^(?:#{1,3}\\s|\\*{3,}|-{3,}|={3,})|^(?:END OF )?(?:ACT|PART|CHAPTER|BOOK|EPISODE|SCENE)\\s+[A-Z0-9]+\\b|${STRUCTURAL_LABEL.source}|${NUMBERED_HEADING.source}`, "i");
const PROSE_TRANSITION_SIGNAL = /^(later|meanwhile|elsewhere|afterward|earlier|back (?:at|in)|the next (?:day|morning|night|week)|some time later|(?:a )?(?:few )?(?:hours?|days?|weeks?|months?|years?) later|that (?:night|morning|evening|afternoon))\b/i;
// A title page ("BISHOP BLING BLING\nThe Pastor Who Lost Jesus in a
// Megachurch") sitting above the real content reads exactly like an
// ALL-CAPS speaker cue to likelyCharacter() and like ordinary scene
// content to the prose segmenter below. It's only safe to assume "this
// short leading block is front matter, not story" when the rest of the
// document clearly uses structural headings (OPENING, ACT ONE, ...) —
// otherwise a short opening paragraph in an unstructured piece would get
// silently dropped.
function detectTitleBlockRange(lines) {
  let start = -1; let end = -1; let lineCount = 0; let wordCount = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = String(lines[index] || "").trim();
    if (!line) { if (start >= 0) break; continue; }
    if (sceneHeadingFlexible(line) || sceneHeading(line) || PROSE_SCENE_MARKER.test(line)) return null;
    if (start < 0) start = index;
    end = index; lineCount += 1; wordCount += line.split(/\s+/).filter(Boolean).length;
    if (lineCount > 3 || wordCount > 24) return null;
  }
  if (start < 0) return null;
  const hasLaterHeading = lines.slice(end + 1).some((raw) => PROSE_SCENE_MARKER.test(String(raw || "").trim()));
  return hasLaterHeading ? { startLine: start, endLine: end } : null;
}

function segmentProseIntoScenes(lines, titleBlock) {
  const paragraphs = [];
  let block = null;
  lines.forEach((raw, index) => {
    const line = String(raw || "").trim();
    if (!line) { block = null; return; }
    if (!block) { block = { startLine: index, endLine: index, lines: [line] }; paragraphs.push(block); }
    else { block.endLine = index; block.lines.push(line); }
  });
  if (titleBlock) {
    const titleIndex = paragraphs.findIndex((p) => p.startLine >= titleBlock.startLine && p.endLine <= titleBlock.endLine);
    if (titleIndex >= 0) paragraphs.splice(titleIndex, 1);
  }
  if (!paragraphs.length) return [];
  const hardBreaks = paragraphs.filter((p) => PROSE_SCENE_MARKER.test(p.lines[0]) || PROSE_TRANSITION_SIGNAL.test(p.lines[0]));
  const groups = [];
  if (hardBreaks.length) {
    let current = null;
    paragraphs.forEach((p) => {
      const isBreak = PROSE_SCENE_MARKER.test(p.lines[0]) || PROSE_TRANSITION_SIGNAL.test(p.lines[0]);
      if (isBreak || !current) { current = { startLine: p.startLine, endLine: p.endLine, paragraphs: [p] }; groups.push(current); }
      else { current.endLine = p.endLine; current.paragraphs.push(p); }
    });
  } else {
    // No explicit signal anywhere: chunk by word count so a long prose
    // piece still yields a real handful of scenes instead of one giant
    // block or (worse) one scene per paragraph.
    const TARGET_WORDS = 180;
    let current = null; let wordCount = 0;
    paragraphs.forEach((p) => {
      const words = p.lines.join(" ").split(/\s+/).filter(Boolean).length;
      if (!current || wordCount >= TARGET_WORDS) { current = { startLine: p.startLine, endLine: p.endLine, paragraphs: [p] }; groups.push(current); wordCount = 0; }
      else { current.endLine = p.endLine; current.paragraphs.push(p); }
      wordCount += words;
    });
  }
  return groups.map((group) => {
    // Paragraph breaks (\n\n) are preserved rather than flattened to spaces
    // — extractQuotedDialogue resets its "same speaker continues" tracking
    // at each paragraph boundary, so losing them here would let one
    // attributed speaker's name silently bleed across unrelated exchanges
    // later in the same scene.
    const text = group.paragraphs.map((p) => p.lines.join(" ")).join("\n\n");
    const firstLine = group.paragraphs[0].lines[0];
    const cleanedOpener = firstLine.replace(PROSE_SCENE_MARKER, "").replace(/^[\s:.\-]+/, "").trim();
    // A bare structural heading ("OPENING", "ENDING", "FADE OUT") strips down
    // to nothing here — without the firstLine fallback, the title fell all
    // the way through to the full scene body text instead of the heading.
    const titleSource = cleanedOpener || firstLine.trim() || text;
    const title = titleSource.split(/(?<=[.!?])\s+/)[0].slice(0, 60).trim() || `Scene ${group.startLine + 1}`;
    return { startLine: group.startLine, endLine: group.endLine, title, text };
  });
}

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

// A real slugline is often more than LOCATION - TIME — "INT. PRECINCT 14 -
// BULLPEN - DAY" has a sub-location in the middle. Splitting on the first
// " - " and treating everything after it as "time" throws away the
// sub-location and usually fails to recognize the actual time of day
// (since "BULLPEN - DAY" isn't a real daypart). Only the LAST segment is a
// candidate time; everything before it is the full location.
function splitLocationAndTime(raw, matchesDaypart) {
  const segments = String(raw || "").split(/\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  if (segments.length > 1) {
    const last = segments[segments.length - 1].toUpperCase();
    if (matchesDaypart(last)) return { location: segments.slice(0, -1).join(" - "), time: last };
  }
  return { location: segments.join(" - "), time: "" };
}
function sceneHeading(line) {
  const match = String(line || "").trim().match(/^(INT\.?\s*\/\s*EXT|INT\.?|EXT\.?|I\/E)\s*[-.]?\s+(.+)$/i);
  if (!match) return null;
  const { location, time } = splitLocationAndTime(match[2].trim(), (value) => DAYPARTS.includes(value));
  return { heading: String(line).trim(), location, interiorExterior: match[1].replace(/\./g, "").toUpperCase(), timeOfDay: DAYPARTS.includes(time) ? time : "UNSPECIFIED" };
}

// Real scripts don't always follow the strict ALL-CAPS speaker-cue rule —
// PDF-to-text conversions and less rigorously formatted scripts commonly
// use Title Case ("Nora", "Detective Rosa Vance") instead. A Title Case
// candidate is only accepted when EVERY word starts with a capital and it
// carries no sentence-ending punctuation — an action line like "Nora
// walks to her car." fails on both counts (lowercase words, trailing
// period), so this doesn't turn ordinary narration into false cues.
const TITLE_CASE_NAME = /^[A-Z][a-zA-Z'’-]*(?:\s+[A-Z][a-zA-Z'’-]*){0,3}$/;
function likelyCharacter(line, nextLine) {
  const value = String(line || "").trim(); const normalized = value.replace(/\s+\([^)]*\)$/, "").trim();
  if (!value || value.length < 2 || value.length > 48) return false;
  // STRUCTURAL_LABEL alone only catches a bare "ACT ONE" — compound headings
  // like "ACT ONE - THE PREACHER" still look like an ALL-CAPS speaker cue to
  // the checks below, so also exclude anything PROSE_SCENE_MARKER treats as
  // a scene break (it matches on the heading prefix, not the whole line).
  if (CHARACTER_EXCLUDE.test(normalized) || TRANSITIONS.test(normalized) || STRUCTURAL_LABEL.test(normalized) || NUMBERED_HEADING.test(normalized) || PROSE_SCENE_MARKER.test(normalized)) return false;
  const isAllCaps = /^[A-Z0-9][A-Z0-9 .,'-]*$/.test(normalized);
  const isTitleCase = !isAllCaps && TITLE_CASE_NAME.test(normalized) && !/[.!?,;:]$/.test(normalized);
  if (!isAllCaps && !isTitleCase) return false;
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
  const match = normalized.match(/^(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|INT\.?|EXT\.?|I\/E)\s*[-.]?\s+(.+)$/i);
  if (!match) return null;
  const matchesDaypart = (value) => DAYPARTS.some((part) => value.startsWith(part));
  const { location, time } = splitLocationAndTime(match[2].trim(), matchesDaypart);
  return { heading: String(line).trim(), location, interiorExterior: match[1].replace(/\./g, "").toUpperCase(), timeOfDay: matchesDaypart(time) ? time : "UNSPECIFIED" };
}

// Prose has no INT./EXT. line to read a location straight off of, so this
// looks for the same signal a reader would: a place named right after a
// location preposition ("in the garden", "at the House of Law"), or one of
// a set of common place nouns. Not true entity recognition — a heuristic,
// same as the rest of this parser — but it beats leaving every prose scene
// with no location at all.
// Multi-word Title Case phrases ("House of Law", "New House") are a strong,
// sentence-position-independent signal — unlike a single capitalized word,
// they can't be confused with an ordinary sentence-initial capital. Common
// lowercase place nouns ("the garden", "the bedroom") catch the rest.
const PROPER_NOUN_PHRASE = /\b[A-Z][a-z]+(?:\s+(?:of|the)\s+[A-Z][a-z]+|\s+[A-Z][a-z]+)+\b/g;
const COMMON_PLACE_NOUN = /\bthe\s+(garden|kitchen|office|street|house|school|church|beach|forest|city|town|room|hall|court|field|hill|road|market|library|chapel|castle|cave|meadow|harbor|bridge|bedroom|tomb|apartment|building|park|station|hospital|prison|temple|palace|cottage|cabin|shore|river|mountain|valley|desert|island|village)\b/gi;
function extractProseLocation(text, characterNames) {
  const counts = new Map();
  const tally = (phrase) => { const key = phrase.toLowerCase(); if (characterNames.has(key)) return; const entry = counts.get(key) || { label: phrase, count: 0 }; entry.count += 1; counts.set(key, entry); };
  [...text.matchAll(new RegExp(PROPER_NOUN_PHRASE.source, "g"))].forEach((m) => tally(m[0].trim()));
  [...text.matchAll(new RegExp(COMMON_PLACE_NOUN.source, "gi"))].forEach((m) => tally(m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()));
  if (!counts.size) return "";
  // Most frequent candidate wins (a place named twice is more likely the
  // scene's actual setting than one named once in passing); ties keep
  // first-seen order, and a multi-word proper noun outranks a generic
  // common-noun match at equal frequency (more specific signal).
  return [...counts.values()].sort((a, b) => b.count - a.count || (/\s/.test(b.label) ? 1 : 0) - (/\s/.test(a.label) ? 1 : 0))[0].label;
}
// The ALL-CAPS speaker cue that likelyCharacter() looks for is a
// screenplay convention — standard prose fiction almost never uses it,
// instead marking speech with a quote and an attribution tag ("Name
// said", "said Name"). Tested against real prose (not synthetic cases):
// without this, ordinary fiction with clearly named, speaking characters
// came back with zero characters detected at all.
const SPEECH_VERB = "(?:said|asked|replied|whispered|shouted|muttered|continued|added|exclaimed|murmured|answered|called|cried|yelled|declared|stated|remarked|began|sighed|snapped|laughed)";
const PROSE_NAME = "[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?";
const AFTER_QUOTE_SPEAKER = new RegExp(`^[,.]?\\s*(?:(${PROSE_NAME})\\s+${SPEECH_VERB}|${SPEECH_VERB}\\s+(${PROSE_NAME}))\\b`);
const BEFORE_QUOTE_SPEAKER = new RegExp(`(${PROSE_NAME})\\s+${SPEECH_VERB}[,:]?\\s*$`);
// British/literary fiction commonly uses single quotes for dialogue
// instead of double quotes. A naive '...' regex breaks on contractions and
// possessives ("didn't", "Thomas's") since they contain apostrophes too —
// this content class treats an apostrophe as regular content only when
// it's shaped like a contraction (a letter immediately before AND after
// it); the real delimiters are apostrophes that aren't shaped that way.
// Only ONE quote style is used per document — running both patterns
// unconditionally risks a single quoted word for emphasis ('the', as
// scare quotes) in an otherwise double-quoted document being picked up as
// a stray dialogue fragment and mislabeled via speaker carry-forward.
const SINGLE_QUOTE_CONTENT = "(?:[^']|(?<=[A-Za-z])'(?=[A-Za-z]))";
const SINGLE_QUOTE_RE = new RegExp(`(?<![A-Za-z])'(${SINGLE_QUOTE_CONTENT}{2,400}?)'(?![A-Za-z])`, "g");
const DOUBLE_QUOTE_RE = /"([^"]{2,400})"/g;
function extractQuotedDialogue(text) {
  const doubleCount = (text.match(DOUBLE_QUOTE_RE) || []).length;
  const singleCount = (text.match(SINGLE_QUOTE_RE) || []).length;
  const activeQuoteRe = singleCount > doubleCount ? SINGLE_QUOTE_RE : DOUBLE_QUOTE_RE;
  const results = [];
  const paragraphs = text.split(/\n\s*\n/);
  let cursor = 0;
  paragraphs.forEach((paragraph) => {
    const quoteRe = new RegExp(activeQuoteRe.source, "g");
    let match; let lastSpeaker = null;
    while ((match = quoteRe.exec(paragraph))) {
      const quoted = match[1];
      const after = paragraph.slice(match.index + match[0].length, match.index + match[0].length + 60);
      const before = paragraph.slice(Math.max(0, match.index - 60), match.index);
      let name = null;
      const afterMatch = after.match(AFTER_QUOTE_SPEAKER);
      if (afterMatch) name = afterMatch[1] || afterMatch[2];
      if (!name) { const beforeMatch = before.match(BEFORE_QUOTE_SPEAKER); if (beforeMatch) name = beforeMatch[1]; }
      // A quote with no attribution of its own, in the same paragraph as one
      // that WAS attributed, is almost always the same speaker continuing —
      // a common prose pattern ("Traffic," Sarah said. "You could have
      // started without me.") a per-quote-only check would otherwise miss.
      // Pronoun-only attribution ("he said") is a real, known gap: resolving
      // "he"/"she" to a name needs actual coreference resolution, not regex.
      if (!name && lastSpeaker) name = lastSpeaker;
      if (name) { results.push({ character: name, text: quoted, index: cursor + match.index }); lastSpeaker = name; }
    }
    cursor += paragraph.length + 2;
  });
  return results;
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
  // Same reasoning as performancePattern below: technical screenplay jargon
  // ("rack focus", "key light") almost never shows up in ordinary prose —
  // a writer describes what's actually seen, not the coverage plan. Each
  // list adds the plain-language version of the same signal alongside the
  // technical terms, so prose and screenplay format both get read.
  const cameraPattern = new RegExp("\\b(?:" + [
    "close[- ]?up", "wide(?: shot)?", "medium(?: shot)?", "extreme close[- ]?up", "over[- ]?the[- ]?shoulder", "pov", "point of view",
    "low angle", "high angle", "dolly", "tracking", "handheld", "crane", "pan", "tilt", "zoom", "rack focus", "\\d{2,3}mm",
    "camera (?:pushes?|pulls?|drifts?|moves?|lingers?|follows?)", "frames? (?:her|him|them)", "in frame", "off[- ]?screen",
    "we see", "we watch", "cuts? to", "silhouetted against", "comes? into (?:view|focus)", "out of focus"
  ].join("|") + ")\\b", "i");
  const lightingPattern = new RegExp("\\b(?:" + [
    "backlit", "key light", "fill light", "rim light", "candlelight", "moonlight", "neon", "practical(?: light)?", "golden hour",
    "overcast", "fog", "smoke", "rain", "shadow", "silhouette", "color temperature",
    "dim(?:ly)?", "bright(?:ly)?", "dark(?:ness)?", "sunlight", "moonlit", "flicker(?:ing|s)?", "glow(?:ing|s)?", "shadowy", "hazy",
    "dusk", "dawn", "twilight", "lamplight", "firelight", "streetlight", "harsh light", "soft light", "warm light", "cold light",
    "half[- ]?lit", "sunset", "sunrise", "gloom(?:y)?"
  ].join("|") + ")\\b", "i");
  const audioPattern = /\b(sfx|sound effect|ambience|ambient|music|score|song|silence|voiceover|v\.?o\.|f[\/.]?x|foley|whisper|shouts?|hums?|buzzes?|echoes?|creaks?|footsteps|ringing)\b/i;
  const effectPattern = new RegExp("\\b(?:" + [
    "vfx", "visual effect", "composite", "screen replacement", "explosion", "particle", "cg(?:i)?", "matte painting", "transition",
    "flames?", "fire", "smoke rises", "dust", "debris", "shatters?", "shattered", "explodes?", "sparks?", "storm", "lightning",
    "wind howls", "collapses?", "crumbles?", "bursts?"
  ].join("|") + ")\\b", "i");
  // Broad on purpose: this is the signal that separates Storymaker's
  // generations from "action scene, fight scene, explosion" — the acting
  // and emotional truth of a beat, not just what's physically happening.
  // Grouped for readability, not that it changes how the regex runs.
  const performancePattern = new RegExp("\\b(?:" + [
    "beat", "pause", "hesitates?", "falters?", "trembles?", "shudders?",
    "sighs?", "smiles?", "grins?", "frowns?", "winces?", "flinches?", "gasps?", "cries?", "sobs?", "weeps?", "laughs?", "chuckles?",
    "angry", "furious", "rage", "fearful", "terrified", "nervous", "anxious", "relieved", "devastated", "heartbroken", "grief-stricken",
    "ashamed", "embarrassed", "humiliated", "defiant", "vulnerable", "desperate", "hopeful", "numb", "exhausted",
    "whispers?", "murmurs?", "stammers?", "chokes? (?:up|on)", "voice (?:cracks?|breaks?|trembles?|catches?|wavers?)",
    "stares?", "glares?", "avoids? (?:eye contact|her eyes|his eyes|their eyes)", "won'?t (?:look|meet (?:her|his|their) eyes)", "can'?t meet (?:her|his|their) eyes",
    "turns away", "looks away", "eye line", "eyes well up", "eyes widen", "jaw tightens?", "fists? clenche?d?", "shoulders? (?:sag|slump|tense)",
    "gesture", "reaches? for", "pulls? away", "steps? back", "recoils?", "goes? (?:still|silent|quiet)", "long silence", "can'?t (?:speak|find the words)"
  ].join("|") + ")\\b", "i");
  const continuityPattern = /\b(same (?:costume|wardrobe|location|time|day|night|room|weapon|prop)|continues|still wearing|returns|again|still holding|once more|as before|hasn'?t moved|still there)\b/i;
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

// Screenplays generated for Storymaker (via the GPT instructions in
// docs/storymaker-gpt-instructions.md) author an explicit "SHOTS:" list per
// scene — "SHOT 1: Wide establishing of the chamber", etc. Without this,
// that authored breakdown was silently discarded on import: only camera,
// lighting, performance, audio, effects, and continuity NOTES were ever
// attributed to scenes, never the shot list itself, so every imported scene
// got exactly one generic starter shot regardless of how many the writer
// actually planned.
// PDF-to-text extraction renders bullet glyphs inconsistently across pages
// and font subsets — "-", "*", "•" (U+2022), "●" (U+25CF), "▪", etc. can all
// show up for the same list depending on how a given page was encoded.
// Stripping every leading non-alphanumeric character before matching (rather
// than enumerating specific bullet characters) means the pattern doesn't
// silently miss shots on pages that happened to use a glyph we didn't list.
const shotLinePattern = /^SHOT\s+\d+\s*:\s*(.+)$/i;
function parseShotList(lines, scenes) {
  const shotsBySceneId = new Map();
  lines.forEach((raw, index) => {
    const stripped = String(raw || "").trim().replace(/^[^A-Za-z0-9]+/, "");
    if (!stripped) return;
    const match = stripped.match(shotLinePattern);
    if (!match) return;
    const description = match[1].trim();
    if (!description) return;
    const scene = scenes.find((item) => item.source.lineStart <= index + 1 && item.source.lineEnd >= index + 1);
    if (!scene) return;
    if (!shotsBySceneId.has(scene.id)) shotsBySceneId.set(scene.id, []);
    shotsBySceneId.get(scene.id).push({ description, ...sourceEvidence(index + 1) });
  });
  return shotsBySceneId;
}

function parseStoryStructure(text) {
  const normalizedText = normalizeScreenplayLine(String(text || "").replace(/\r/g, ""));
  const lines = normalizedText.split("\n"); const scenes = []; const characters = new Map(); const locations = new Map(); const props = new Map(); let current = null; let action = []; let activeDialogue = null;
  const titleBlock = detectTitleBlockRange(lines);
  const inTitleBlock = (index) => Boolean(titleBlock && index >= titleBlock.startLine && index <= titleBlock.endLine);
  // Dialogue is recorded here regardless of whether a scene container exists
  // yet — the prose fallback below re-homes it once real scenes are known.
  // Without this, a pasted script with no INT./EXT. sluglines loses every
  // line of dialogue outright (flushDialogue used to require `current`).
  const looseDialogue = [];
  const flushAction = () => { if (current && action.length) current.action.push(...action.splice(0)); else action = []; };
  const flushDialogue = () => {
    if (activeDialogue) {
      activeDialogue.text = activeDialogue.lines.join(" ").trim();
      activeDialogue.source.lineEnd = activeDialogue._lineEnd;
      delete activeDialogue.lines; delete activeDialogue._lineEnd;
      if (activeDialogue.text) { if (current) current.dialogue.push(activeDialogue); else looseDialogue.push(activeDialogue); }
    }
    activeDialogue = null;
  };
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
    if (activeDialogue) {
      if (likelyCharacter(line, nextNonEmpty(lines, index)) || sceneHeadingFlexible(line) || sceneHeading(line)) flushDialogue();
      else {
        // A standalone parenthetical ("(not looking up)", "(beat)") is a
        // performance direction, not spoken text — including it in the
        // dialogue string puts stage directions in the character's mouth.
        if (!/^\([^)]*\)$/.test(line)) activeDialogue.lines.push(line);
        addDetectedProps(line, props, index + 1); activeDialogue._lineEnd = index + 1; if (current?.source) current.source.lineEnd = index + 1; return;
      }
    }
    if (!inTitleBlock(index) && likelyCharacter(line, nextNonEmpty(lines, index))) {
      flushAction();
      const name = line.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const key = resolveCharacterKey(name, characters);
      if (!characters.has(key)) characters.set(key, { id: `character-${characters.size + 1}`, name, aliases: [], role: "", description: "", personality: "", goals: "", relationships: [], physicalDescription: "", emotionalProfile: "", importance: "supporting", screenTimeEstimateSeconds: 0, source: { lineStart: index + 1, lineEnd: index + 1 } });
      const character = characters.get(key);
      if (character.name !== name && !character.aliases.includes(name)) character.aliases.push(name);
      activeDialogue = { character: character.name, text: "", lines: [], source: { lineStart: index + 1, lineEnd: index + 1 }, _lineEnd: index + 1 };
      return;
    }
    if (current) { action.push(line); addDetectedProps(line, props, index + 1); if (current.source) current.source.lineEnd = index + 1; }
  });
  flushDialogue();
  flushAction(); scenes.forEach((scene) => { const actionText = scene.action.join(" "); scene.storyBeat = actionText.slice(0, 240); scene.beginning = scene.action.slice(0, Math.max(1, Math.ceil(scene.action.length / 3))).join(" ").slice(0, 240); scene.middle = scene.action.slice(Math.ceil(scene.action.length / 3), Math.ceil(scene.action.length * 2 / 3)).join(" ").slice(0, 240); scene.end = scene.action.slice(Math.ceil(scene.action.length * 2 / 3)).join(" ").slice(0, 240); scene.dialogue.forEach((line) => { const character = characters.get(String(line.character).toLowerCase()); if (character) character.screenTimeEstimateSeconds += 8; }); delete scene.action; });
  // Nothing carried an INT./EXT. slugline (prose, treatment, outline) — the
  // loop above still found real characters and dialogue (cue detection
  // doesn't need a scene container; looseDialogue captured it), just
  // nothing to attach them to. Segment the prose into scenes and re-home
  // that already-detected dialogue by line position instead of leaving the
  // user with characters and no board.
  if (!scenes.length && normalizedText.trim()) {
    const segments = segmentProseIntoScenes(lines, titleBlock);
    const characterNames = new Set([...characters.values()].map((character) => character.name.toLowerCase()));
    segments.forEach((segment, segmentIndex) => {
      const words = segment.text.split(/\s+/).filter(Boolean);
      const third = Math.max(1, Math.ceil(words.length / 3));
      const location = extractProseLocation(segment.text, characterNames);
      if (location && !locations.has(location.toLowerCase())) locations.set(location.toLowerCase(), { name: location, description: "Inferred from scene text.", source: { lineStart: segment.startLine + 1, lineEnd: segment.endLine + 1 } });
      addDetectedProps(segment.text, props, segment.startLine + 1);
      const scene = {
        id: `scene-${segmentIndex + 1}`, sceneNumber: segmentIndex + 1, title: segment.title, location, interiorExterior: "", timeOfDay: "UNSPECIFIED",
        objective: "", emotionalPurpose: "", storyBeat: segment.text.slice(0, 240),
        beginning: words.slice(0, third).join(" ").slice(0, 240), middle: words.slice(third, third * 2).join(" ").slice(0, 240), end: words.slice(third * 2).join(" ").slice(0, 240),
        estimatedDurationSeconds: 45, dialogue: [], source: { lineStart: segment.startLine + 1, lineEnd: segment.endLine + 1 }, provenance: "inferred"
      };
      // Standard prose fiction almost never uses the ALL-CAPS speaker cue
      // likelyCharacter() looks for — this is the complementary path for
      // ordinary quoted dialogue with a "Name said" attribution tag.
      extractQuotedDialogue(segment.text).forEach((line) => {
        const key = line.character.toLowerCase();
        if (!characters.has(key)) characters.set(key, { id: `character-${characters.size + 1}`, name: line.character, aliases: [], role: "", description: "", personality: "", goals: "", relationships: [], physicalDescription: "", emotionalProfile: "", importance: "supporting", screenTimeEstimateSeconds: 0, source: { lineStart: segment.startLine + 1, lineEnd: segment.endLine + 1 } });
        scene.dialogue.push({ character: line.character, text: line.text, source: { lineStart: segment.startLine + 1, lineEnd: segment.endLine + 1 } });
        characterNames.add(key);
        characters.get(key).screenTimeEstimateSeconds += 8;
      });
      scenes.push(scene);
    });
    looseDialogue.forEach((line) => {
      const home = scenes.find((scene) => line.source.lineStart >= scene.source.lineStart && line.source.lineStart <= scene.source.lineEnd) || scenes[scenes.length - 1];
      if (!home) return;
      home.dialogue.push(line);
      const character = characters.get(String(line.character).toLowerCase());
      if (character) character.screenTimeEstimateSeconds += 8;
    });
  }
  const textLower = normalizedText.toLowerCase(); const themeWords = [["memory", "Memory"], ["belong", "Belonging"], ["truth", "Truth"], ["grief", "Grief"], ["love", "Love"], ["fear", "Fear"], ["hope", "Hope"], ["identity", "Identity"], ["freedom", "Freedom"]];
  const signals = productionSignals(lines, scenes);
  const parsedShotsBySceneId = parseShotList(lines, scenes);
  scenes.forEach((scene) => {
    // Prose-fallback scenes already carry provenance:"inferred" — the
    // parser guessed the scene break, not the author. Only slugline-based
    // scenes (which never set this field) default to "documented".
    if (!scene.provenance) scene.provenance = "documented";
    scene.cameraNotes = signals.camera.filter((item) => item.sceneId === scene.id);
    scene.lightingNotes = signals.lighting.filter((item) => item.sceneId === scene.id);
    scene.audioNotes = signals.audio.filter((item) => item.sceneId === scene.id);
    scene.performanceNotes = signals.performance.filter((item) => item.sceneId === scene.id);
    scene.effectsNotes = signals.effects.filter((item) => item.sceneId === scene.id);
    scene.continuityNotes = signals.continuity.filter((item) => item.sceneId === scene.id);
    scene.parsedShots = parsedShotsBySceneId.get(scene.id) || [];
  });
  const usedProseFallback = scenes.length > 0 && scenes.every((scene) => scene.provenance === "inferred");
  const warnings = [];
  if (!scenes.length && normalizedText.trim()) warnings.push("No text could be parsed into scenes. Try pasting the raw story text directly.");
  if (usedProseFallback) warnings.push(`No screenplay sluglines were found, so ${scenes.length} scene${scenes.length === 1 ? "" : "s"} ${scenes.length === 1 ? "was" : "were"} inferred from paragraph and topic breaks instead. Review the breakdown below — add INT./EXT. headings to the source for a more precise, director-grade split.`);
  if (scenes.length && !characters.size) warnings.push("Scenes were found but no dialogue cues were detected. Character profiles can still be added manually.");
  const confidence = !scenes.length ? (characters.size ? 0.5 : 0.18)
    : usedProseFallback ? Math.min(0.72, 0.42 + Math.min(scenes.length, 8) * 0.02 + Math.min(characters.size, 6) * 0.015)
    : Math.min(0.96, 0.68 + Math.min(scenes.length, 8) * 0.025 + Math.min(characters.size, 6) * 0.015);
  return { version: 3, status: "needs-review", confidence, story: { title: "", genre: "", logline: "", synopsis: "", themes: themeWords.filter(([needle]) => textLower.includes(needle)).map(([, label]) => label), tone: "", emotionalArc: "", worldRules: "", timeline: "", provenance: "inferred" }, scenes, characters: [...characters.values()], locations: [...locations.values()], props: [...props.values()], sets: [], ...signals, warnings };
}

function ingestStoryFile(filePath) { const source = readSource(filePath); return { ...source, analysis: parseStoryStructure(source.text), importedAt: new Date().toISOString(), filePath }; }
function ingestStoryText(text, name = "Pasted story") {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  return { name: String(name || "Pasted story").slice(0, 140), type: "clipboard", text: normalized, warnings: normalized.trim() ? [] : ["Paste story material before continuing."], analysis: parseStoryStructure(normalized), importedAt: new Date().toISOString(), filePath: "" };
}

module.exports = { ingestStoryFile, ingestStoryText, parseStoryStructure, readSource };
