// AI Director for music videos — the pure, provider-agnostic pieces.
// electron-main.js requires this for the LLM dispatch; the smoke imports it
// directly. Keeping the prompt + context builder + parser here (not the
// network calls) makes them testable in Node with no Electron.

export const MUSIC_VIDEO_DIRECTION_INSTRUCTIONS = "You are Storymaker's music-video director. You are given a song broken into ordered sections (each with a kind like Intro/Verse/Chorus/Bridge/Outro, a start/end in seconds, a relative energy 0-1, and its lyric lines), plus an optional written treatment, a creative \"feeling\", and a cast list. Write a concrete, shootable per-section treatment for a music video cut to this song. Rules: (1) Choruses must share visual motifs so each chorus rhymes — recurring location, framing, colour, or action. (2) The visual energy must track each section's energy value and build across the video. (3) Every field is 1-2 plain sentences a shoot could execute — no mood-words without an image. (4) performance/acting notes should reference the actual lyric words when lyrics are given. (5) movement scales with energy: held/minimal in low sections, full choreography or kinetic camera in high ones. (6) lead must be exactly one name from the cast list, or \"\" if the cast is empty or no single lead fits; backup is zero or more other names from the cast list who perform in that section (band, feature vocalist, ensemble) — [] when none apply. (7) Honour the feeling throughout. (8) Never imitate or name a living artist or reproduce a protected identity — describe craft attributes only. Return JSON only with this exact shape: {logline:string, energyArc:string, visualApproach:string, sections:[{sectionId:string, shot:string, camera:string, blocking:string, performance:string, movement:string, wardrobe:string, lead:string, backup:string[]}]}. Return exactly one sections entry per input section, each sectionId copied verbatim from the input.";

export function musicVideoDirectionContext(payload) {
  const song = payload?.song || {};
  const sections = (Array.isArray(payload?.sections) ? payload.sections : []).slice(0, 16).map((s) => ({
    id: String(s.id || ""),
    label: String(s.label || s.kind || ""),
    kind: String(s.kind || ""),
    startSec: Math.round(Number(s.startSec) || 0),
    endSec: Math.round(Number(s.endSec) || 0),
    energy: Math.round((Number(s.energy) || 0) * 100) / 100,
    lyrics: (Array.isArray(s.lyrics) ? s.lyrics : []).map((l) => String(l)).slice(0, 40)
  }));
  return JSON.stringify({
    song: { name: String(song.name || "Untitled"), bpm: Number(song.bpm) || 0, durationSec: Math.round(Number(song.durationSec) || 0) },
    feeling: String(payload?.feeling || ""),
    treatment: String(payload?.treatment || "").slice(0, 8000),
    cast: (Array.isArray(payload?.cast) ? payload.cast : []).slice(0, 12).map((c) => ({ name: String(c.name || ""), description: String(c.description || "").slice(0, 300) })),
    sections
  });
}

export function parseMusicVideoDirection(text, sectionIds) {
  let data;
  try { data = typeof text === "string" ? JSON.parse(text) : text; } catch { throw new Error("The AI director returned output that could not be read as JSON."); }
  const wanted = new Set((sectionIds || []).map(String));
  const clean = (v) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, 600);
  const sections = (Array.isArray(data?.sections) ? data.sections : [])
    .filter((s) => wanted.size === 0 || wanted.has(String(s?.sectionId)))
    .map((s) => ({
      sectionId: String(s.sectionId || ""),
      shot: clean(s.shot), camera: clean(s.camera), blocking: clean(s.blocking),
      performance: clean(s.performance), movement: clean(s.movement),
      wardrobe: clean(s.wardrobe), lead: clean(s.lead),
      backup: (Array.isArray(s.backup) ? s.backup : (s.backup ? [s.backup] : [])).map(clean).filter(Boolean).slice(0, 6)
    }))
    .filter((s) => s.sectionId && (s.shot || s.performance || s.camera));
  if (!sections.length) throw new Error("The AI director returned no usable sections.");
  return { logline: clean(data.logline), energyArc: clean(data.energyArc), visualApproach: clean(data.visualApproach), sections };
}
