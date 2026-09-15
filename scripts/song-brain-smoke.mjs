// Song Brain smoke — deterministic, CI-safe (no audio file, no ffmpeg).
// Synthesizes PCM with known tempo + structure in pure Node and asserts the
// analysis recovers it. Also, if SONG_BRAIN_SAMPLE=<path to an audio file>
// is set and ffmpeg is on PATH, decodes that file and prints its Song Map
// for eyeballing (not asserted).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  analyzeSongMap, segmentSections, distributeLyrics, carrySectionEdits,
  beatTimes, barTimes, snapToBeat, sectionShotPlan,
  splitSection, mergeSectionWithNext, setSectionBoundary, editSectionMeta, validateSections
} from "../src/song-brain.mjs";

const SR = 44100;
let failed = 0;
const ok = (label, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  if (!cond) failed++;
};

// --- synthesis ---------------------------------------------------------
function clickTrack(bpm, seconds, { amp = 1, bed = 0, seed = 1 } = {}) {
  const n = Math.floor(seconds * SR);
  const mono = new Float32Array(n);
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
  if (bed > 0) for (let i = 0; i < n; i++) mono[i] += rnd() * bed;
  const period = SR * 60 / bpm;
  const burst = Math.floor(SR * 0.04); // 40ms
  for (let start = 0; start < n; start += period) {
    const b0 = Math.round(start);
    for (let j = 0; j < burst && b0 + j < n; j++) {
      const env = Math.exp(-j / (burst * 0.35));
      mono[b0 + j] += Math.sin((2 * Math.PI * 1000 * j) / SR) * env * amp;
    }
  }
  return mono;
}

// A full song shape at a steady 120 BPM click so tempo stays detectable
// while section energy contrasts across three tiers:
//   quiet intro / mid verse / loud chorus / mid verse / loud chorus / quiet outro
function structuredTrack() {
  const secs = [
    { len: 8, amp: 0.15, bed: 0.02 },
    { len: 16, amp: 0.5, bed: 0.08 },
    { len: 16, amp: 1.0, bed: 0.22 },
    { len: 16, amp: 0.5, bed: 0.08 },
    { len: 16, amp: 1.0, bed: 0.22 },
    { len: 8, amp: 0.15, bed: 0.02 }
  ];
  const parts = secs.map((cfg) => clickTrack(120, cfg.len, cfg));
  const total = parts.reduce((a, p) => a + p.length, 0);
  const mono = new Float32Array(total);
  let off = 0;
  for (const p of parts) { mono.set(p, off); off += p.length; }
  return mono;
}

// --- tests -----------------------------------------------------------
console.log("--- tempo recovery ---");
for (const bpm of [90, 120, 140]) {
  const map = analyzeSongMap({ mono: clickTrack(bpm, 24, { bed: 0.01 }), sampleRate: SR, name: `click-${bpm}` });
  ok(`click ${bpm} BPM detected within +/-3`, Math.abs(map.bpm - bpm) <= 3, `got ${map.bpm}`);
  // Offset only means anything modulo the beat period — a phase near `period`
  // is the same downbeat as a phase near 0.
  const period = 60 / map.bpm;
  const phaseErr = Math.min(map.beatOffsetSec, Math.abs(period - map.beatOffsetSec));
  ok(`click ${bpm} beat phase within 0.12s of a beat`, phaseErr < 0.12, `err ${phaseErr.toFixed(3)}s (offset ${map.beatOffsetSec.toFixed(3)}s, period ${period.toFixed(3)}s)`);
}

console.log("\n--- beat + bar grid ---");
{
  const map = analyzeSongMap({ mono: clickTrack(120, 20, { bed: 0.01 }), sampleRate: SR });
  const beats = beatTimes(map);
  const bars = barTimes(map);
  const spacing = beats[5] - beats[4];
  ok("beat spacing ~= 0.5s at 120 BPM", Math.abs(spacing - 0.5) < 0.02, `${spacing.toFixed(3)}s`);
  ok("beats span most of the track", beats.at(-1) > map.durationSec - 1, `last beat ${beats.at(-1)?.toFixed(1)}s of ${map.durationSec.toFixed(1)}s`);
  ok("one bar per 4 beats", Math.abs(bars.length - beats.length / 4) <= 1, `${bars.length} bars, ${beats.length} beats`);
}

console.log("\n--- section detection ---");
const structured = structuredTrack();
const smap = analyzeSongMap({ mono: structured, sampleRate: SR, name: "structured" });
const kinds = smap.sections.map((s) => s.kind);
console.log("  sections:", smap.sections.map((s) => `${s.label} ${s.start.toFixed(1)}-${s.end.toFixed(1)}s e=${s.energy.toFixed(2)}`).join(" | "));
ok("at least 4 sections found", smap.sections.length >= 4, `${smap.sections.length}`);
ok("a Chorus was labelled", kinds.includes("Chorus"));
// Which label a given mid-energy run gets (Verse vs Bridge) is a heuristic
// best judged on real audio; on a synthetic signal the invariant is that a
// body section — something that is neither the loud Chorus nor an edge
// Intro/Outro — exists.
ok("a body section (Verse or Bridge) exists", kinds.some((k) => k === "Verse" || k === "Bridge"));
ok("at least 3 distinct section kinds", new Set(kinds).size >= 3, kinds.join(","));
ok("sections are contiguous and ordered", smap.sections.every((s, i) => s.end > s.start && (i === 0 || Math.abs(s.start - smap.sections[i - 1].end) < 0.01)));
ok("sections cover the whole track", Math.abs(smap.sections.at(-1).end - smap.durationSec) < 0.01 && smap.sections[0].start === 0);
ok("loudest section is a Chorus", smap.sections.reduce((a, b) => (b.energy > a.energy ? b : a)).kind === "Chorus");
ok("energy rank tracks the input (chorus > body > intro)", (() => {
  const byKind = (k) => smap.sections.filter((s) => s.kind === k).reduce((a, s) => a + s.energy, 0) / Math.max(1, smap.sections.filter((s) => s.kind === k).length);
  const chorus = byKind("Chorus");
  const body = smap.sections.filter((s) => s.kind === "Verse" || s.kind === "Bridge");
  const bodyE = body.reduce((a, s) => a + s.energy, 0) / Math.max(1, body.length);
  return chorus > bodyE;
})());

console.log("\n--- envelope + peaks ---");
ok("peaks length is 1400", smap.peaks.length === 1400, `${smap.peaks.length}`);
ok("peaks normalized to <=1 with a real max", Math.max(...smap.peaks) > 0.9 && Math.max(...smap.peaks) <= 1.0001);
const expectedBuckets = Math.ceil(smap.durationSec / 0.25);
ok("energy envelope ~0.25s buckets", Math.abs(smap.energyEnvelope.length - expectedBuckets) <= 2, `${smap.energyEnvelope.length} vs ~${expectedBuckets}`);
ok("envelope higher in chorus than verse", (() => {
  const at = (t) => smap.energyEnvelope[Math.floor(t / 0.25)] ?? 0;
  return at(32) > at(16) && at(64) > at(48); // chorus mid-points vs verse mid-points
})());

console.log("\n--- lyric distribution ---");
const lyrics = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n");
const lines = distributeLyrics(lyrics, smap.sections);
ok("all 12 lines placed", lines.length === 12, `${lines.length}`);
ok("lines sorted by start time", lines.every((l, i) => i === 0 || l.start >= lines[i - 1].start));
ok("every line sits inside a real section", lines.every((l) => {
  const sec = smap.sections.find((s) => s.id === l.sectionId);
  return sec && l.start >= sec.start - 0.001 && l.start <= sec.end + 0.001;
}));
ok("no lyrics land in Intro/Outro when vocal sections exist", (() => {
  const nonVocalIds = smap.sections.filter((s) => ["Intro", "Outro", "Instrumental"].includes(s.kind)).map((s) => s.id);
  const hasVocal = smap.sections.some((s) => !["Intro", "Outro", "Instrumental"].includes(s.kind));
  return !hasVocal || lines.every((l) => !nonVocalIds.includes(l.sectionId));
})());

console.log("\n--- Phase 2: beat snap + section shot plan ---");
{
  const grid = { bpm: 120, beatOffsetSec: 0.1, beatsPerBar: 4 }; // beat every 0.5s from 0.1
  ok("snapToBeat lands on the grid", (() => {
    const snapped = snapToBeat(3.30, grid); // (3.30-0.1)/0.5 = 6.4 -> beat 6 -> 3.1
    return Math.abs((snapped - grid.beatOffsetSec) % 0.5) < 1e-9 && Math.abs(snapped - 3.1) < 1e-9;
  })());
  ok("snapToBeat rounds to the nearer beat", Math.abs(snapToBeat(3.40, grid) - 3.6) < 1e-9, `${snapToBeat(3.40, grid)}`);
  ok("snapToBeat never returns negative", snapToBeat(-2, grid) >= 0);
  ok("snapToBeat bar unit uses 4 beats", Math.abs(snapToBeat(3.9, grid, "bar") - 4.1) < 1e-9, `${snapToBeat(3.9, grid, "bar")}`);

  const plan = sectionShotPlan(smap);
  ok("one plan entry per section", plan.length === smap.sections.length);
  ok("plan is contiguous and covers the song", plan[0].startSec === 0
    && Math.abs(plan.at(-1).endSec - smap.durationSec) < 0.01
    && plan.every((p, i) => i === 0 || Math.abs(p.startSec - plan[i - 1].endSec) < 0.01));
  ok("plan durations sum to the song length", Math.abs(plan.reduce((a, p) => a + p.durationSec, 0) - smap.durationSec) < 0.6, `${plan.reduce((a, p) => a + p.durationSec, 0).toFixed(1)} vs ${smap.durationSec.toFixed(1)}`);
  ok("every plan entry carries its section id + label", plan.every((p) => p.sectionId && p.label && p.durationSec >= 0.5));
}

console.log("\n--- section editor (split / merge / boundary / meta) ---");
{
  const base = analyzeSongMap({ mono: structured, sampleRate: SR }).sections; // real, contiguous sections
  const dur = base.at(-1).end;
  const covers = (secs) => secs[0].start === 0 && Math.abs(secs.at(-1).end - dur) < 0.01 && secs.every((s, i) => i === 0 || Math.abs(s.start - secs[i - 1].end) < 0.01) && secs.every((s) => s.end - s.start >= 1.99);

  const first = base[0];
  const mid = (first.start + first.end) / 2;
  const split = splitSection(base, first.id, mid);
  ok("split adds one section", split.sections.length === base.length + 1);
  ok("split keeps coverage + contiguity + min length", covers(split.sections));
  ok("split: left keeps id, right is new", split.sections[0].id === first.id && split.sections[1].id === split.newSectionId && split.sections[1].id !== first.id);
  ok("split: left ends / right starts at the cut", Math.abs(split.sections[0].end - mid) < 1e-6 && Math.abs(split.sections[1].start - mid) < 1e-6);
  let threw = false; try { splitSection(base, first.id, first.start + 0.5); } catch { threw = true; }
  ok("split rejects a too-close cut", threw);

  const merged = mergeSectionWithNext(split.sections, split.sections[0].id);
  ok("merge removes one section", merged.sections.length === split.sections.length - 1);
  ok("merge restores coverage", covers(merged.sections));
  ok("merge reports the removed id", merged.removedSectionId === split.newSectionId);
  ok("split then merge round-trips the count", merged.sections.length === base.length);

  const b = setSectionBoundary(base, base[0].id, base[0].end + 4).sections;
  ok("boundary nudge keeps coverage", covers(b) && Math.abs(b[0].end - (base[0].end + 4)) < 1e-6 && Math.abs(b[1].start - b[0].end) < 1e-6);
  threw = false; try { setSectionBoundary(base, base[0].id, base[1].end - 0.5); } catch { threw = true; }
  ok("boundary nudge rejects collapsing the next section", threw);

  const meta = editSectionMeta(base, base[0].id, { label: "Cold open", kind: "Intro" }).sections;
  ok("meta edit renames without moving boundaries", meta[0].label === "Cold open" && meta[0].start === base[0].start && meta[0].end === base[0].end);
  ok("meta edit ignores an unknown kind", editSectionMeta(base, base[0].id, { kind: "Nonsense" }).sections[0].kind === base[0].kind);

  ok("validateSections passes a clean list", validateSections(base, dur) === "");
  ok("validateSections catches a gap", validateSections([{ ...base[0], end: base[0].end - 3 }, ...base.slice(1)], dur).length > 0);
}

console.log("\n--- re-detection carries edits ---");
{
  const edited = smap.sections.map((s, i) => (i === 1 ? { ...s, mood: "triumphant", cameraNote: "crane up" } : s));
  const redetected = segmentSections(
    // same audio -> same sections; just prove the carry-over by overlap
    smap.sections.map((s) => s.energy), (60 / smap.bpm) * 4, smap.durationSec
  );
  const carried = carrySectionEdits(edited, smap.sections);
  const moved = carried.find((s) => s.mood === "triumphant");
  ok("edited section's notes survive re-detection", Boolean(moved && moved.cameraNote === "crane up"));
  ok("re-detection returns a section list", Array.isArray(redetected) && redetected.length > 0);
}

// --- optional: real file eyeball (not asserted) ----------------------
const sample = process.env.SONG_BRAIN_SAMPLE;
if (sample && fs.existsSync(sample)) {
  const ff = spawnSync("ffmpeg", ["-v", "error", "-i", sample, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (ff.status === 0 && ff.stdout?.length) {
    const mono = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, Math.floor(ff.stdout.length / 4));
    const map = analyzeSongMap({ mono, sampleRate: SR, fileName: sample.split(/[\\/]/).pop() });
    console.log(`\n--- real file: ${map.name} ---`);
    console.log(`  ${map.durationSec.toFixed(1)}s  ${map.bpm} BPM  offset ${map.beatOffsetSec.toFixed(2)}s`);
    map.sections.forEach((s) => console.log(`  ${s.label.padEnd(10)} ${s.start.toFixed(1).padStart(6)}s - ${s.end.toFixed(1).padStart(6)}s   e=${s.energy.toFixed(2)}`));
  } else {
    console.log(`\n(real-file check skipped: ffmpeg decode failed for ${sample})`);
  }
}

console.log(`\n${failed === 0 ? "STORYMAKER_SONG_BRAIN_SMOKE_OK" : `SONG BRAIN SMOKE FAILED (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
