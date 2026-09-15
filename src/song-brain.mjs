// Song Brain — the music-video spine.
//
// Ported from the Music Video Director codebase (its one irreplaceable
// piece; the rest of that app was suite weight or a weaker re-build of
// what Storymaker already does). Turns imported audio into a structured
// Song Map with NO API call: tempo (BPM) + beat grid + phase, an energy
// envelope, an automatic section breakdown (Intro / Verse / Chorus /
// Bridge / Outro), a downsampled waveform, and a lyric distributor that
// lays pasted lyrics onto the detected sections.
//
// Everything downstream (shot timing, the cut) keys off this one map's
// timeline — that discipline (analyze once, reuse everywhere) is the
// architectural point, not just the algorithm.
//
// The DSP is pure math on a mono Float32Array + sampleRate: `analyzeSongMap`
// takes decoded PCM and runs in Node (the smoke test) exactly as in the
// Electron renderer. `decodeAudioData` is the only browser-only adapter.
//
// .mjs on purpose: imported unchanged by both the vite renderer bundle and
// scripts/song-brain-smoke.mjs.

export const SECTION_KINDS = [
  "Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Instrumental", "Drop", "Outro"
];

const uuid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID()
  : `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

// ---------------------------------------------------------------------------
// PCM prep
// ---------------------------------------------------------------------------

/** Mix all channels down to a single mono Float32Array. */
export function toMono(channels) {
  if (channels.length === 1) return channels[0];
  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const data of channels) for (let i = 0; i < length; i++) mono[i] += data[i];
  for (let i = 0; i < length; i++) mono[i] /= channels.length;
  return mono;
}

// ---------------------------------------------------------------------------
// Waveform peaks (display)
// ---------------------------------------------------------------------------

function computePeaks(mono, buckets = 1400) {
  const size = Math.max(1, Math.floor(mono.length / buckets));
  const peaks = [];
  let max = 0;
  for (let b = 0; b < buckets; b++) {
    const start = b * size;
    let peak = 0;
    for (let i = 0; i < size; i++) {
      const v = Math.abs(mono[start + i] ?? 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  if (max > 0) for (let i = 0; i < peaks.length; i++) peaks[i] /= max;
  return peaks;
}

// ---------------------------------------------------------------------------
// Onset / energy envelope
// ---------------------------------------------------------------------------

const HOP = 512;
const WIN = 1024;

function computeOnset(mono, sampleRate) {
  const frames = Math.max(0, Math.floor((mono.length - WIN) / HOP));
  const energy = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const base = i * HOP;
    let sum = 0;
    for (let j = 0; j < WIN; j++) { const s = mono[base + j]; sum += s * s; }
    energy[i] = Math.sqrt(sum / WIN);
  }
  // Half-wave-rectified first difference = a cheap onset/novelty signal.
  const onset = new Float32Array(frames);
  for (let i = 1; i < frames; i++) {
    const d = energy[i] - energy[i - 1];
    onset[i] = d > 0 ? d : 0;
  }
  return { onset, energy, frameRate: sampleRate / HOP };
}

// ---------------------------------------------------------------------------
// Tempo + beat phase
// ---------------------------------------------------------------------------

function estimateTempo(onset, frameRate) {
  const minBpm = 70;
  const maxBpm = 180;
  const minLag = Math.max(1, Math.floor((frameRate * 60) / maxBpm));
  const maxLag = Math.ceil((frameRate * 60) / minBpm);
  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = lag; i < onset.length; i++) score += onset[i] * onset[i - lag];
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }
  let bpm = (frameRate * 60) / bestLag;
  while (bpm < minBpm) bpm *= 2;
  while (bpm > maxBpm) bpm /= 2;
  return Math.round(bpm);
}

function estimateBeatOffset(onset, frameRate, bpm) {
  const period = Math.max(1, Math.round((frameRate * 60) / bpm));
  let bestOffset = 0;
  let bestScore = -Infinity;
  for (let off = 0; off < period; off++) {
    let score = 0;
    for (let i = off; i < onset.length; i += period) score += onset[i];
    if (score > bestScore) { bestScore = score; bestOffset = off; }
  }
  return bestOffset / frameRate;
}

/** Derive beat timestamps across the whole track from bpm + phase. */
export function beatTimes({ bpm, beatOffsetSec, durationSec }) {
  const period = 60 / Math.max(1, bpm);
  const out = [];
  for (let t = beatOffsetSec; t < durationSec; t += period) if (t >= 0) out.push(t);
  return out;
}

/** Bar (downbeat) timestamps — every `beatsPerBar`-th beat. */
export function barTimes(song) {
  const beats = beatTimes(song);
  const bars = [];
  for (let i = 0; i < beats.length; i += Math.max(1, song.beatsPerBar || 4)) bars.push(beats[i]);
  return bars;
}

/** Snap a time (seconds) to the nearest beat implied by bpm + phase. Used
 *  whenever the user moves a cut point in a song-timed project so edits stay
 *  on the grid. `unit` = "beat" (default) or "bar". */
export function snapToBeat(t, { bpm, beatOffsetSec = 0, beatsPerBar = 4 }, unit = "beat") {
  const period = (60 / Math.max(1, bpm)) * (unit === "bar" ? Math.max(1, beatsPerBar) : 1);
  const n = Math.round((t - beatOffsetSec) / period);
  return Math.max(0, beatOffsetSec + n * period);
}

// ---------------------------------------------------------------------------
// Manual section editing — pure array transforms. The section detector is a
// heuristic and a long song can merge its first half into one giant "Intro";
// these let the user fix it. Each returns a NEW sections array plus what
// changed, so the caller can reconcile the scene list without re-diffing.
// Sections stay contiguous and covering [0, durationSec] by construction.
// ---------------------------------------------------------------------------
const MIN_SECTION_SEC = 2;
const bySection = (sections, id) => sections.findIndex((s) => s.id === id);

/** Split section `id` at `atSec` (already snapped by the caller). The left
 *  half keeps the id/label; the right half is a new section of the same
 *  kind. */
export function splitSection(sections, id, atSec, { newId } = {}) {
  const i = bySection(sections, id);
  if (i < 0) throw new Error("Section not found.");
  const s = sections[i];
  const cut = Math.round(atSec * 1000) / 1000;
  if (cut - s.start < MIN_SECTION_SEC || s.end - cut < MIN_SECTION_SEC) {
    throw new Error(`Split point must leave at least ${MIN_SECTION_SEC}s on each side.`);
  }
  const rightId = newId || `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const left = { ...s, end: cut };
  const right = { ...s, id: rightId, start: cut, end: s.end, label: `${s.label} (b)`, lyricsText: "" };
  const next = [...sections.slice(0, i), left, right, ...sections.slice(i + 1)];
  return { sections: next, newSectionId: rightId, splitAtSec: cut };
}

/** Merge section `id` with the one after it. The result keeps `id`'s
 *  identity and label and spans both time ranges. */
export function mergeSectionWithNext(sections, id) {
  const i = bySection(sections, id);
  if (i < 0) throw new Error("Section not found.");
  if (i >= sections.length - 1) throw new Error("There is no section after this one to merge with.");
  const a = sections[i];
  const b = sections[i + 1];
  const merged = { ...a, end: b.end, energy: Math.max(a.energy || 0, b.energy || 0) };
  const next = [...sections.slice(0, i), merged, ...sections.slice(i + 2)];
  return { sections: next, removedSectionId: b.id };
}

/** Move the boundary between section `id` and the next one to `atSec`
 *  (snapped by the caller). Both sections stay above the minimum length. */
export function setSectionBoundary(sections, id, atSec) {
  const i = bySection(sections, id);
  if (i < 0 || i >= sections.length - 1) throw new Error("No boundary after this section.");
  const a = sections[i];
  const b = sections[i + 1];
  const t = Math.round(atSec * 1000) / 1000;
  if (t - a.start < MIN_SECTION_SEC || b.end - t < MIN_SECTION_SEC) {
    throw new Error(`Both sections must stay at least ${MIN_SECTION_SEC}s long.`);
  }
  const next = [...sections];
  next[i] = { ...a, end: t };
  next[i + 1] = { ...b, start: t };
  return { sections: next };
}

/** Rename and/or re-type a section in place (identity + boundaries kept). */
export function editSectionMeta(sections, id, { label, kind } = {}) {
  const i = bySection(sections, id);
  if (i < 0) throw new Error("Section not found.");
  const next = [...sections];
  next[i] = {
    ...next[i],
    ...(label != null ? { label: String(label).slice(0, 60) || next[i].label } : {}),
    ...(kind && SECTION_KINDS.includes(kind) ? { kind } : {})
  };
  return { sections: next };
}

/** Contiguity / coverage / minimum-length check for a hand-edited list. */
export function validateSections(sections, durationSec) {
  if (!sections.length) return "A song must have at least one section.";
  if (sections[0].start > 0.01) return "The first section must start at 0:00.";
  if (durationSec && Math.abs(sections[sections.length - 1].end - durationSec) > 0.5) return "The last section must end at the song's end.";
  for (let k = 0; k < sections.length; k++) {
    if (sections[k].end - sections[k].start < MIN_SECTION_SEC - 0.001) return `"${sections[k].label}" is shorter than ${MIN_SECTION_SEC}s.`;
    if (k > 0 && Math.abs(sections[k].start - sections[k - 1].end) > 0.01) return "Sections have a gap or overlap.";
  }
  return "";
}

/** One shot per section — the default music-video cut. Section boundaries are
 *  already bar-aligned by segmentSections(); this is the ordered plan the
 *  scene list is built from. */
export function sectionShotPlan(songMap) {
  return (songMap?.sections || []).map((s, i) => ({
    index: i,
    sectionId: s.id,
    label: s.label,
    kind: s.kind,
    startSec: s.start,
    endSec: s.end,
    durationSec: Math.max(0.5, s.end - s.start),
    energy: s.energy
  }));
}

// ---------------------------------------------------------------------------
// Section segmentation
// ---------------------------------------------------------------------------

/** Per-bar mean energy, normalized 0..1. */
function barEnergies(energy, frameRate, barDur, duration) {
  const bars = Math.max(1, Math.ceil(duration / barDur));
  const out = [];
  let max = 0;
  for (let b = 0; b < bars; b++) {
    const startF = Math.floor(b * barDur * frameRate);
    const endF = Math.min(energy.length, Math.floor((b + 1) * barDur * frameRate));
    let sum = 0; let n = 0;
    for (let i = startF; i < endF; i++) { sum += energy[i]; n++; }
    const e = n > 0 ? sum / n : 0;
    out.push(e);
    if (e > max) max = e;
  }
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

// Percentile thresholds from the song's own distribution, not fixed
// magnitudes — a fixed cutoff produces zero "loud" bars (and so never a
// Chorus) for a ballad or an already-compressed mix.
function levelThresholds(bars) {
  if (bars.length === 0) return { lo: 0.4, hi: 0.72 };
  const sorted = [...bars].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return { lo: at(0.4), hi: at(0.7) };
}

/** Centered moving average — damps bar-to-bar noise, keeps structural swings. */
function movingAverage(values, window) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length, i + half + 1);
    const slice = values.slice(lo, hi);
    return slice.reduce((a, x) => a + x, 0) / slice.length;
  });
}

function energyLevel(e, t) {
  if (e < t.lo) return 0;
  if (e < t.hi) return 1;
  return 2;
}

/** Segment the bar-energy curve into runs of similar energy, enforce a
 *  musical minimum length, then label by energy + position. */
export function segmentSections(bars, barDur, duration) {
  if (bars.length === 0) return [makeSection("Verse", 0, duration, 0.5)];

  const minBars = 4;
  const smoothed = movingAverage(bars, 3);
  const thresholds = levelThresholds(smoothed);
  const levels = smoothed.map((e) => energyLevel(e, thresholds));

  const runs = [];
  let start = 0;
  for (let b = 1; b <= bars.length; b++) {
    if (b === bars.length || levels[b] !== levels[start]) {
      const slice = bars.slice(start, b);
      runs.push({ startBar: start, endBar: b, level: levels[start], energy: slice.reduce((a, x) => a + x, 0) / slice.length });
      start = b;
    }
  }

  const merged = [];
  for (const run of runs) {
    const len = run.endBar - run.startBar;
    if (len < minBars && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.endBar = run.endBar;
      const slice = bars.slice(prev.startBar, prev.endBar);
      prev.energy = slice.reduce((a, x) => a + x, 0) / slice.length;
      prev.level = energyLevel(prev.energy, thresholds);
    } else {
      merged.push({ ...run });
    }
  }
  if (merged.length > 1) {
    const first = merged[0];
    if (first.endBar - first.startBar < minBars) {
      const next = merged[1];
      next.startBar = first.startBar;
      const slice = bars.slice(next.startBar, next.endBar);
      next.energy = slice.reduce((a, x) => a + x, 0) / slice.length;
      merged.shift();
    }
  }
  return labelSegments(merged, barDur, duration);
}

function labelSegments(runs, barDur, duration) {
  const n = runs.length;
  let chorusCount = 0;
  let verseCount = 0;
  let bridgeUsed = false;

  // "Loud" is decided among the sections we actually ended up with. On a
  // narrow-band (loud, compressed) mix the pre-merge per-bar level walks
  // everything to 1, so nothing is ever a Chorus without this.
  const sorted = runs.map((r) => r.energy).sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const loudFloor = percentile(0.7);
  const peak = sorted[sorted.length - 1];
  const hasContrast = peak - sorted[0] > 0.06; // a true drone has no chorus to find
  const isLoud = (run) => hasContrast && run.energy >= loudFloor;

  return runs.map((run, i) => {
    const start = run.startBar * barDur;
    const end = i === n - 1 ? duration : run.endBar * barDur;
    const isFirst = i === 0;
    const isLast = i === n - 1;
    const bookend = (isFirst || isLast) && run.energy < peak;

    let kind;
    if (isFirst && bookend) kind = "Intro";
    else if (isLast && bookend) kind = "Outro";
    else if (isLoud(run)) kind = "Chorus";
    else if (run.level >= 1) {
      if (!bridgeUsed && chorusCount >= 1 && i >= n - 3 && !isLast) { kind = "Bridge"; bridgeUsed = true; }
      else kind = "Verse";
    } else {
      kind = isLast ? "Outro" : "Verse";
    }

    let label = kind;
    if (kind === "Chorus") label = `Chorus ${++chorusCount}`;
    else if (kind === "Verse") label = `Verse ${++verseCount}`;
    return makeSection(kind, start, end, run.energy, label);
  });
}

function makeSection(kind, start, end, energy, label) {
  return { id: uuid(), kind, label: label ?? kind, start, end, energy: Math.max(0, Math.min(1, energy)) };
}

/** 0.25s-bucket normalized energy envelope for the energy lane. */
function coarseEnvelope(energy, frameRate, duration, step = 0.25) {
  const buckets = Math.max(1, Math.ceil(duration / step));
  const out = [];
  let max = 0;
  for (let b = 0; b < buckets; b++) {
    const startF = Math.floor(b * step * frameRate);
    const endF = Math.min(energy.length, Math.floor((b + 1) * step * frameRate));
    let sum = 0; let n = 0;
    for (let i = startF; i < endF; i++) { sum += energy[i]; n++; }
    const e = n > 0 ? sum / n : 0;
    out.push(e);
    if (e > max) max = e;
  }
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

// ---------------------------------------------------------------------------
// Public: analyze decoded PCM into a Song Map
// ---------------------------------------------------------------------------

/**
 * @param {{ mono: Float32Array, sampleRate: number, durationSec?: number, name?: string, fileName?: string }} pcm
 * @returns Song Map
 */
export function analyzeSongMap(pcm) {
  const { mono, sampleRate } = pcm;
  const durationSec = pcm.durationSec ?? mono.length / sampleRate;
  const { onset, energy, frameRate } = computeOnset(mono, sampleRate);
  const bpm = estimateTempo(onset, frameRate);
  const beatOffsetSec = estimateBeatOffset(onset, frameRate, bpm);
  const beatsPerBar = 4;
  const barDur = (60 / bpm) * beatsPerBar;

  const peaks = computePeaks(mono);
  const energyEnvelope = coarseEnvelope(energy, frameRate, durationSec);
  const bars = barEnergies(energy, frameRate, barDur, durationSec);
  const sections = segmentSections(bars, barDur, durationSec);

  const now = new Date().toISOString();
  return {
    id: uuid(),
    name: pcm.name || (pcm.fileName || "Untitled song").replace(/\.[^.]+$/, ""),
    fileName: pcm.fileName || "",
    durationSec, bpm, beatOffsetSec, beatsPerBar,
    sections, lyrics: [], peaks, energyEnvelope,
    createdAt: now, updatedAt: now
  };
}

/** Browser adapter: raw bytes -> decoded PCM -> Song Map. Renderer only. */
export async function analyzeAudioArrayBuffer(arrayBuffer, { name, fileName } = {}) {
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio API is not available in this environment.");
  const ctx = new Ctor();
  let buffer;
  try { buffer = await ctx.decodeAudioData(arrayBuffer.slice(0)); }
  finally { try { ctx.close(); } catch { /* noop */ } }
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
  return analyzeSongMap({ mono: toMono(channels), sampleRate: buffer.sampleRate, durationSec: buffer.duration, name, fileName });
}

// ---------------------------------------------------------------------------
// Re-detection that preserves per-section creative work
// ---------------------------------------------------------------------------

const CARRIED = ["lyricsText", "lead", "backup", "mood", "cameraNote", "choreoNote", "storyNote", "visualStyle", "performerRole"];

/** Move each old section's edits onto the freshly-detected section that
 *  covers the same moment — matched by time overlap, not index. */
export function carrySectionEdits(previous, detected) {
  return detected.map((next) => {
    let best = null; let bestOverlap = 0;
    for (const old of previous) {
      const overlap = Math.min(next.end, old.end) - Math.max(next.start, old.start);
      if (overlap > bestOverlap) { bestOverlap = overlap; best = old; }
    }
    if (!best) return next;
    const carried = {};
    for (const key of CARRIED) if (best[key] !== undefined) carried[key] = best[key];
    return { ...next, ...carried };
  });
}

// ---------------------------------------------------------------------------
// Lyric alignment
// ---------------------------------------------------------------------------

const NON_VOCAL = ["Intro", "Instrumental", "Outro"];

/** Lay pasted lyric lines onto the vocal sections, distributed in
 *  proportion to each section's duration then spaced evenly within it.
 *  Heuristic and fully editable downstream — a starting point, not truth. */
export function distributeLyrics(text, sections) {
  const lines = String(text || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const vocal = sections.filter((s) => !NON_VOCAL.includes(s.kind));
  const pool = (vocal.length > 0 ? vocal : sections).slice().sort((a, b) => a.start - b.start);
  if (pool.length === 0) return [];

  const totalDur = pool.reduce((a, s) => a + (s.end - s.start), 0) || 1;
  const counts = pool.map((s) => Math.max(0, Math.round((lines.length * (s.end - s.start)) / totalDur)));
  let assigned = counts.reduce((a, x) => a + x, 0);
  let idx = 0;
  while (assigned < lines.length) { counts[idx % counts.length]++; assigned++; idx++; }
  while (assigned > lines.length) { const j = counts.findIndex((c) => c > 0); if (j < 0) break; counts[j]--; assigned--; }

  const out = [];
  let cursor = 0;
  pool.forEach((section, si) => {
    const count = counts[si];
    if (count <= 0) return;
    const span = section.end - section.start;
    for (let k = 0; k < count; k++) {
      out.push({ id: uuid(), text: lines[cursor++], start: section.start + ((k + 0.5) / count) * span, sectionId: section.id });
    }
  });
  return out.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SECTION_HUE = {
  Intro: "#64748b", Verse: "#6d5dfc", "Pre-Chorus": "#0891b2", Chorus: "#e0397f",
  Bridge: "#d97706", Instrumental: "#475569", Drop: "#dc2626", Outro: "#334155"
};
export function sectionColor(kind) { return SECTION_HUE[kind] ?? "#6d5dfc"; }
