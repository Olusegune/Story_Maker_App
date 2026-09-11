// AI Director for music videos — smoke.
// Unit-tests the pure context builder + parser (deterministic, in test:release).
// If Ollama is up with a model, also does one real round-trip and asserts the
// model's output survives the parser (not asserted hard — a weak local model
// can legitimately fail the JSON contract; it prints PASS/SKIP).
import { MUSIC_VIDEO_DIRECTION_INSTRUCTIONS, musicVideoDirectionContext, parseMusicVideoDirection } from "../src/music-video-director.mjs";

let failed = 0;
const ok = (label, cond, detail = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`); if (!cond) failed++; };

const sectionIds = ["s1", "s2", "s3", "s4"];
const payload = {
  song: { name: "Test Song", bpm: 120, durationSec: 200 },
  feeling: "cinematic",
  treatment: "A late-night city drive. The artist is looking for someone.",
  cast: [{ name: "Mara", description: "lead vocalist, mid-20s, denim jacket" }],
  sections: [
    { id: "s1", label: "Intro", kind: "Intro", startSec: 0, endSec: 20, energy: 0.3, lyrics: [] },
    { id: "s2", label: "Verse 1", kind: "Verse", startSec: 20, endSec: 80, energy: 0.5, lyrics: ["driving through the rain", "watching every lane"] },
    { id: "s3", label: "Chorus 1", kind: "Chorus", startSec: 80, endSec: 140, energy: 0.95, lyrics: ["find you in the light", "hold on through the night"] },
    { id: "s4", label: "Outro", kind: "Outro", startSec: 140, endSec: 200, energy: 0.2, lyrics: [] }
  ]
};

console.log("--- context builder ---");
{
  const ctx = JSON.parse(musicVideoDirectionContext(payload));
  ok("song fields carried", ctx.song.name === "Test Song" && ctx.song.bpm === 120 && ctx.song.durationSec === 200);
  ok("feeling + treatment carried", ctx.feeling === "cinematic" && ctx.treatment.startsWith("A late-night"));
  ok("cast carried", ctx.cast.length === 1 && ctx.cast[0].name === "Mara");
  ok("one section entry per input, ids preserved", ctx.sections.length === 4 && ctx.sections.map((s) => s.id).join() === "s1,s2,s3,s4");
  ok("section energy rounded to 2dp, lyrics carried", ctx.sections[2].energy === 0.95 && ctx.sections[1].lyrics.length === 2);
  ok("instructions are non-trivial", MUSIC_VIDEO_DIRECTION_INSTRUCTIONS.length > 800 && /never imitate/i.test(MUSIC_VIDEO_DIRECTION_INSTRUCTIONS));
}

console.log("\n--- parser ---");
{
  const good = JSON.stringify({
    logline: "  A   night   drive. ", energyArc: "builds to the chorus", visualApproach: "neon, wet asphalt",
    sections: [
      { sectionId: "s1", shot: "Wide of an empty street", camera: "static", blocking: "artist enters frame left", performance: "still, watching", movement: "none", wardrobe: "denim jacket", lead: "Mara", backup: [] },
      { sectionId: "s2", shot: "Tracking alongside the car", camera: "dolly", blocking: "", performance: "sings 'driving through the rain'", movement: "slow pan", wardrobe: "", lead: "Mara", backup: "Kojo" },
      { sectionId: "s3", shot: "Rooftop, city behind", camera: "orbit", blocking: "arms wide", performance: "belts the hook", movement: "full choreography", wardrobe: "", lead: "Mara", backup: ["Kojo", "Ada", ""] },
      { sectionId: "s4", shot: "Car pulls away", camera: "locked", blocking: "", performance: "quiet", movement: "none", wardrobe: "", lead: "Mara" },
      { sectionId: "GHOST", shot: "should be dropped", performance: "x" }
    ]
  });
  const parsed = parseMusicVideoDirection(good, sectionIds);
  ok("logline whitespace-collapsed", parsed.logline === "A night drive.");
  ok("only known section ids kept (GHOST dropped)", parsed.sections.length === 4 && !parsed.sections.some((s) => s.sectionId === "GHOST"));
  ok("fields cleaned + present", parsed.sections[1].performance.includes("driving through the rain") && parsed.sections[2].movement === "full choreography");
  ok("lead preserved", parsed.sections.every((s) => s.lead === "Mara"));
  ok("backup normalized to string[] (scalar wrapped, blanks dropped)", Array.isArray(parsed.sections[1].backup) && parsed.sections[1].backup[0] === "Kojo" && parsed.sections[2].backup.length === 2 && parsed.sections[0].backup.length === 0);

  let threw = false;
  try { parseMusicVideoDirection("not json at all", sectionIds); } catch { threw = true; }
  ok("rejects non-JSON", threw);

  threw = false;
  try { parseMusicVideoDirection(JSON.stringify({ sections: [{ sectionId: "s1" }] }), sectionIds); } catch { threw = true; }
  ok("rejects sections with no usable content", threw);

  // A model that returns sections keyed by unknown ids -> nothing usable -> throws
  threw = false;
  try { parseMusicVideoDirection(JSON.stringify({ sections: [{ sectionId: "zzz", shot: "x" }] }), sectionIds); } catch { threw = true; }
  ok("rejects when no section id matches", threw);
}

console.log("\n--- live Ollama round-trip (opt-in) ---");
try {
  const tags = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(3000) }).then((r) => r.json());
  const model = (tags.models || []).map((m) => m.name).find((n) => /qwen3|llama3|gemma3|mistral/i.test(n)) || (tags.models || [])[0]?.name;
  if (!model) { console.log("SKIP — Ollama running but no model installed"); }
  else {
    const res = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(240000),
      body: JSON.stringify({ model, stream: false, format: "json", options: { temperature: 0.2 }, messages: [
        { role: "system", content: MUSIC_VIDEO_DIRECTION_INSTRUCTIONS },
        { role: "user", content: `Direct a music video for this song:\n${musicVideoDirectionContext(payload)}` }
      ] })
    }).then((r) => r.json());
    const text = res?.message?.content || "";
    const parsed = parseMusicVideoDirection(text, sectionIds);
    console.log(`PASS — ${model} produced ${parsed.sections.length} usable sections`);
    console.log(`  logline: ${parsed.logline.slice(0, 100)}`);
    console.log(`  chorus shot: ${(parsed.sections.find((s) => s.sectionId === "s3") || {}).shot?.slice(0, 100)}`);
    console.log(`  chorus performance: ${(parsed.sections.find((s) => s.sectionId === "s3") || {}).performance?.slice(0, 100)}`);
  }
} catch (error) {
  console.log(`SKIP — live round-trip unavailable: ${error?.message || error}`);
}

console.log(`\n${failed === 0 ? "STORYMAKER_MV_DIRECTOR_SMOKE_OK" : `MV DIRECTOR SMOKE FAILED (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
