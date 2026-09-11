# Storymaker Handover — 0.3.77 (updated through 0.3.78)

Date: 2026-08-13
Prior handover: `docs/CLAUDE-CODE-HANDOVER-VIDEO-PIPELINE.md` (video pipeline verification, 0.3.30)

## Update — 0.3.78: acting and emotion engine

Added after this doc was first written, same day. The premise: most AI-filmmaking tools chase action/fight/explosion prompts; the actual differentiator is emotional truth and acting. The pipe from script to generated emotion already existed end to end (detected performance signal → shot blueprint → generation prompt) — it was just thin in three places, now closed:

1. **`performancePattern` in `story-ingest.js`** — was ~15 words. Expanded to real acting vocabulary (voice cracking, jaw tightening, avoided eye contact, trembling, shoulders sagging, long silences, reaching-then-pulling-away, and more). Verified against a realistic emotional scene: previously 0 of 3 clearly emotional action lines matched; now all 3 do. Zero regressions across the full test/regression suite built up over this session.
2. **`character.emotionalProfile`** — existed as a field on every character since the AI story-analysis schema was built, but nothing ever read it back; confirmed dead data. Now injected into `shotImagePrompt`'s Character continuity line, so an actor's established emotional baseline informs every generation, not just what's detected in that one scene. Deliberately *not* added to `sceneImagePrompt`'s lighter cast-context line — matches the existing precedent that appearance/wardrobe detail is already shot-level-only, not scene-level.
3. **`SHOT_PLAN_INSTRUCTIONS`** (the AI shot-planner) — its `performance` field was generic. Sharpened to explicitly ask for facial expression, physical tension, what's concealed vs. what leaks through, and where the emotional truth sits on an arc across the beat — and explicitly requires action-scene shots (fight, chase, explosion) to still carry real performance direction for what the character is *feeling* under the choreography, not just the choreography itself.

**Known real limitation, not chased further**: this only reaches shot-level generation via the AI shot-planner ("Populate all shots") and the local keyword detector. There's no UI yet showing the user what emotional signal a given shot inherited before they generate — the Shot Director's existing "Acting & Performance" textarea is where it lands and can be edited, but nothing visually flags "this came from the character's baseline" vs. "this came from the scene" vs. "you typed this yourself." That's a real next step if this keeps getting built out — provenance-tagging for acting direction, same idea as the Locked/Suggested/Inferred system already built for style choices, just not yet applied here.

## Where things are

- **Codebase**: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
- **Installed app** (currently running this build): `C:\Users\eduni\AppData\Local\Programs\wheelbarrow-studios-story-maker`
- **Latest installer**: `dist-release\Wheelbarrow Studios Story Maker Setup 0.3.78.exe`
- **Latest portable exe**: `dist-release\Wheelbarrow Studios Story Maker 0.3.78.exe`
- **Git**: `main`, working tree clean, tip commit `23947d7` ("Acting and emotion engine: broader detection, character baselines, real acting direction")
- **Test suite**: `npm run test:release` → `node scripts/ingest-smoke.mjs && node scripts/release-smoke.mjs && npm run check`. Currently passing: 13 ingestion assertions + 217 release-smoke checks + full syntax check across `electron-main.js`, `preload.js`, `story-ingest.js`, `src/storymaker.js`.

## What this session did, roughly in order

1. **Video pipeline verification** (0.3.30) — real paid smoke tests against fal, Kie, and WaveSpeed; all three confirmed working end-to-end (submit → download → persisted asset → playable).
2. **Advanced Import Workflow** (0.3.31–0.3.32) — bundled AI-enhanced optimization into one import-time review screen; added whole-storyboard shot planning ("Populate all shots").
3. **UX pass** (0.3.33) — preview lightboxes for generated images/video, video thumbnails in Media Library, real 21:9 support for `gpt-image-1` (generate-then-crop, since OpenAI's Images API has no native 21:9 size), Shot Director panel layout fix, AI Enhancement Review actions.
4. **Golden Path navigation audit** (0.3.67–0.3.71) — found and fixed two parallel, overlapping navigation systems (a sidebar and a top bar both listing similar-but-different destinations); retired a duplicate "Design Bible" screen in favor of the more complete "Style Library"; removed 12 confirmed-dead legacy screen implementations; fixed a misleading nav label and an orphaned Help screen; fixed a real CSS layout bug in the Style Library card grid (also caught and fixed a live bug I'd reintroduced mid-fix — see commit `4b1ff94`).
5. **Story parser overhaul** (0.3.72–0.3.77) — the largest piece of this session. See below.

## The parser work — what's actually fixed

The local heuristic parser (`story-ingest.js`, function `parseStoryStructure`) previously only recognized strict screenplay format: `INT./EXT.` sluglines and ALL-CAPS speaker cues. Anything else — prose, treatments, less rigorously formatted scripts — came back with 0 scenes and often 0 characters, even when real story content was clearly present, and in the worst case (pure prose) dialogue was being silently discarded entirely rather than just left unattached.

This was fixed and then **tested against 7 independently-written real-format samples** (not synthetic cases tuned to the regex — several bugs were only found because a fresh, independently-written test exposed something the earlier tuning examples didn't). Each fix was verified against the full regression set before shipping, and the final screenplay/character-merge/parenthetical fix was additionally verified two ways beyond automated testing: live in the running app via computer-use (paste → review screen → Storyboard → Character Bible → Continuity → Shot Planner, all cross-checked), and by saving the project and reading the actual persisted `.storymaker` JSON to confirm the exact dialogue text at the data level, not just via UI rendering.

**Real bugs found and fixed, in order:**

| # | Format tested | Bug | Fix |
|---|---|---|---|
| 1 | Pure prose, no sluglines | 0 scenes even with clear content; dialogue silently discarded (not just unattached) when no scene container existed | Added prose-scene segmentation (chapter/transition-phrase signals, or word-count chunking as fallback); `flushDialogue` now records dialogue via a `looseDialogue` list regardless of scene state, re-homed once scenes are known |
| 2 | Prose (same) | No location/prop extraction outside slugline format | Added `extractProseLocation` (multi-word Title Case phrases + common place nouns) and ran prop detection against full scene text |
| 3 | Standard fiction prose (`"..." Name said`) | 0 characters — only ALL-CAPS screenplay cues were ever recognized | Added `extractQuotedDialogue`: name+speech-verb attribution, same-paragraph speaker carry-forward for unattributed continuation quotes |
| 4 | (bug found while building #3) | Carry-forward speaker bled across unrelated exchanges | `segmentProseIntoScenes` was flattening paragraph breaks to spaces, destroying the boundary the carry-forward logic needs; fixed to preserve `\n\n` |
| 5 | Original industry-standard screenplay (parentheticals, V.O./O.S., CONT'D, dual sluglines) | Compound sluglines (`INT. PRECINCT 14 - BULLPEN - DAY`) lost the sub-location and time-of-day entirely | `splitLocationAndTime`: only the *last* segment is a time candidate, not everything after the first `-` |
| 6 | (same) | `"CAPTAIN DIALLO"` and `"DIALLO"` registered as two different characters | `resolveCharacterKey`: title-prefix-aware merge (CAPTAIN/DETECTIVE/DOCTOR/etc. + bare name → same character), populates the previously-unused `aliases` field |
| 7 | (same) | Parenthetical stage directions (`"(not looking up)"`) leaked into spoken dialogue text | Standalone parenthetical lines excluded from `activeDialogue.lines` |
| 8 | Mixed-case/tab-indented screenplay (`Int. Diner`, `Nora`) | Title Case character cues (not full ALL-CAPS) went completely undetected | `likelyCharacter` accepts Title Case when every word is capitalized and there's no sentence-ending punctuation — an action line can't be mistaken for a cue |
| 9 | Numbered treatment/outline (`1. THE SETUP`) | Numbered headings satisfied the ALL-CAPS character pattern and imported as fake cast members; this starved the real character (never registered) so her name later got misread as a location | `NUMBERED_HEADING` excludes these from character detection and adds them as prose scene boundaries instead |
| 10 | (same) | Fixing #9 truncated scene titles by one character (`"HE SETUP"`) | Consumed `\S` in the regex changed to a zero-width lookahead; `PROSE_SCENE_MARKER` now reuses `NUMBERED_HEADING.source` instead of a second hand-duplicated copy of the same pattern |
| 11 | Single-quote dialogue prose (British/literary convention) | 0 characters — only double quotes were ever matched | Added single-quote detection with a content-character class that treats a contraction/possessive apostrophe (`didn't`, `Thomas's`) as ordinary text, not a delimiter; only the *dominant* quote style in a document is used (never both at once), to avoid a stray single-quoted word for emphasis in a double-quoted document being mistaken for dialogue |

**One format tested clean with no bugs found**: a numbered-slugline shooting-script style screenplay with apostrophe/hyphen names (`O'BRIEN`, `MARY-ANNE`) and extended transitions (SMASH CUT TO:, MATCH CUT TO:) — a good sign the fixes above are holding up rather than just chasing individual symptoms.

## Known, honest limitations (not chased further — real regex ceiling, not oversight)

- **Pronoun-only dialogue attribution** (`"..." he said`) is never resolved to a name. Doing so needs actual coreference resolution, not regex. Lines like this are correctly left unattributed rather than guessed.
- **A person's or company's name that never has any dialogue attributed to it** can still be misread as a location by the proper-noun-phrase heuristic (e.g. `"Whitmore Holdings"` in a treatment with no dialogue at all). Distinguishing a person/company name from a real place name without real NLP isn't reliably solvable by regex, and a heuristic attempt risked breaking the compound-location detection that already works correctly (`"House of Law"`, `"Precinct 14 - Bullpen"`).
- **Single-word place names** with no distinguishing signal (e.g. `"Golgotha"`) aren't extracted as locations — same class of limitation.
- **Prop detection** uses a fixed keyword list (knife, gun, phone, car, key, camera, book, letter, watch, bag, sword, ring, bottle, laptop, tablet, briefcase, passport, helmet, mask, microphone, guitar, weapon, vehicle) — a real prop not on this list (e.g. "lantern," confirmed missed in the Poe test) won't be detected. Expanding this list is a cheap, low-risk future improvement if it becomes a real pain point.

None of these are things a regex-based local parser can close reliably. The AI-assisted analysis path ("Build storyboard with AI") already exists as the answer for genuinely ambiguous or free-form material — the local parser's job is to handle the common, structurally-recognizable cases well and be honest about what it can't do, not to become a full NLP system.

## What to do next, if continuing

1. If the parser keeps surfacing gaps, the highest-value next targets are probably: (a) expanding the prop keyword list, (b) testing a stage-play format (character name + period + dialogue on one line — a real, different convention not yet tried), (c) testing an interview-transcript format (`Q:`/`A:` or `NAME:` at line start).
2. The Style Library CSS cleanup audit (dead-rule sweep across the 12 CSS files) was started but not finished — see the earlier conversation for the partial cascade audit script if picking this back up. Low priority; cosmetic, not functional.
3. Everything in this handover has been verified either by direct test execution, live app interaction, or reading the app's own persisted output — not by assumption. Where I couldn't verify something directly (e.g., screens I didn't click through this session), I've said so rather than implied coverage I didn't have.

## On the music/SFX question (Suno / ElevenLabs integration)

Asked, not prioritized. Short answer: **yes, worth doing eventually, but correctly scoped as a real next-iteration feature, not a quick add-on.**

Why it fits: Storymaker already has an Audio Studio / cue sheet screen, and the whole app's premise is turning a story into every layer of a production — visuals, now sound is the obvious next layer. The shot blueprint system already tracks an `audio` field per shot (audio intent notes extracted from parsed scripts), so there's already a natural hook for "here's what this scene should sound like" to flow into a generation request instead of just sitting as a note nobody acts on.

What it would actually take, roughly:
- **Suno** (music) — full track or stem generation from a text prompt (mood, tempo, instrumentation). The natural trigger points are project-level (a theme/score) and scene-level (a cue tied to a specific beat). This is architecturally similar to the video pipeline already built (submit → poll → download → persist as an audio asset) — same shape, different provider.
- **ElevenLabs** (voice/SFX) — two distinct uses worth keeping separate: (a) text-to-speech for dialogue scratch tracks (read the parsed dialogue lines aloud, useful for animatics/previz before real casting or VO), and (b) sound-effect generation for the SFX cues the parser already partially detects (`addDetectedProps`-adjacent — a "door" prop plus an action verb near it could reasonably prompt "door creak" SFX).
- Both would need: provider key management in Model Hub (already has the pattern for 6 providers), a generation adapter (submit/poll/download, same shape as existing video adapters), and UI hooks in Audio Studio to trigger and review results — most of the *architecture* for this already exists and would be reused, not invented.

Given it's explicitly not the priority right now, I haven't started anything here — just flagging that when the Golden Path work is far enough along, this is a coherent, well-scoped next feature rather than a bolt-on, because the app is already structured in a way that makes it a natural extension rather than a new subsystem.
