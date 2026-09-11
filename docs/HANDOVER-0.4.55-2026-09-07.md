# Handover to Codex — Wheelbarrow Studios Story Maker, v0.4.55

From Claude (Sonnet 5). Written after a long pass of golden-path fixes,
style-system repair, and UI polish. You (Codex) previously carried this
project from 0.4.42 through 0.4.47 independently, in your own sandbox —
that work was merged in at `bd13ca4` and audited/continued since. This
picks up from where that last left off. Everything below is verified
against the actual repo state as of this writing, not written from memory.

## Where everything is

- **Source of truth**: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
  — a real git repo, `main` branch, currently at commit `bd51cba` (v0.4.55).
  `git log` there is the authoritative history; every commit message is
  long and describes root cause, fix, and exactly how it was verified —
  read them, don't just skim `git log --oneline`.
- **GitHub backup**: `https://github.com/Olusegune/Story_Maker_App`,
  branch `main`. This is a **single squashed snapshot commit**, not the
  real history — it exists only because `backups/storymaker-pre-0.3.38-*.zip`
  (1.86GB) sits in this repo's real history and blows past GitHub's 100MB
  per-file limit, so a normal push of `main` fails outright. Every backup
  so far has used the same procedure: orphan branch off current `main`,
  `git rm --cached` the two oversized files (they stay on disk, just
  untracked for that one commit), force-push that orphan as `main`, then
  restore the local repo exactly. If you back up again, repeat that — don't
  just `git push origin main`, it will fail, and don't be tempted to
  `git filter-repo`/rewrite the real history to fix this permanently
  without asking first, that's a much bigger, harder-to-reverse call.
- **Installed app** (what the user actually launches):
  `C:\Users\eduni\AppData\Local\Programs\wheelbarrow-studios-story-maker\Wheelbarrow Studios Story Maker.exe`
  — currently v0.4.55, confirmed installed and launches cleanly.
- **Desktop shortcut is currently missing.** It existed earlier in this
  session but the Desktop has since been repurposed for an unrelated
  project ("Wheelbarrow Music Video Director" — a different app, different
  install path, not this one; don't confuse the two if you see it there).
  Recreate the shortcut pointing at the exe above if you rebuild — a
  one-line PowerShell `WScript.Shell` `CreateShortcut` call, precedent is
  all over this session's history if you need the exact syntax.
- **Built installers**: `dist-release/` inside the repo. Was 324 old
  installer files / ~65GB when this doc was first written (every session's
  build had been added and never cleaned up) — cleaned up the same day:
  now holds only the 3 most recent versions' installer + portable exe +
  blockmap (2.1GB total). Keep doing this — after a build, remove anything
  more than 2-3 versions old rather than letting it re-accumulate.

### The build gotcha you will hit

`npm run build:win` (`vite build && electron-builder --win --publish
never`) will very likely fail with `EPERM: operation not permitted, rename
...win-unpacked.tmp -> ...win-unpacked` if run with the output directory
anywhere under this machine's `Documents` folder — confirmed, repeatable,
not a fluke. It is **not** caused by Windows Defender (a real-time
exclusion for the folder made zero difference), not this session's own
tool sandboxing (confirmed by running the exact same command in the user's
own terminal, outside any AI tooling — same failure), not OneDrive (this
folder isn't a OneDrive-synced reparse point). Something else on this
machine specifically blocks that rename when the target path is under
Documents. The workaround that works every time:

```bash
npx vite build
npx electron-builder --win --publish never -c.directories.output=C:/some-temp-path-outside-documents
# then copy the resulting .exe/.exe.blockmap back into dist-release/ yourself
```

Don't burn time re-diagnosing this from scratch — it's a known, worked-
around environment quirk, not a code bug.

## How the app currently works

Electron + vanilla JS, no framework. Nearly all renderer logic lives in
one file, `src/storymaker.js` (~4000 lines, template-literal HTML
generation, manual `bind()`-style DOM event wiring, re-rendered wholesale
on most state changes via a top-level `render()`). The main process is
`electron-main.js` — provider API calls, file I/O, and (as of 0.4.46) the
style-enforcement boundary. `src/visual-direction.js` is the one proper
module: pure, serializable Style DNA domain logic, shared between renderer
and (via IPC payload) main process reasoning.

### Data model

A project is one big JS object: `characters[]`, `sets[]` (now surfaced as
"Locations" in the UI — the rename happened in 0.4.47, the underlying
field name didn't change), `props[]` ("Props & Accessories"),
`scenes[]` (each with `shots[]`), `assets[]` (the flat media library —
imported + every generated image/video lands here), and `visualDirection`
(the Style DNA state: `projectStyle`, `sceneOverrides`, `shotOverrides`,
`styleStrength`, `styleHistory`).

There's also a much older, much simpler `project.locations[]` (plain
`{name, description}` notes, used for AI Director suggestions and
script-import context) — **do not confuse this with `project.sets`**. They
share no data. This was a real, confirmed naming collision (0.4.52 fixed
the UI copy to say "Narrative Locations" for the old one) but the
underlying data split is permanent and intentional; just don't merge them
without a real product decision behind it.

### The three "asset systems" (Characters / Locations / Props & Accessories)

As of 0.4.47 these are three parallel, structurally-identical top-level
workspaces, each with:

- A card grid (`entityCardMarkup()`, shared component) — image, name,
  reference/scene counts, "Open [X] Lab", "Assign to scenes", "Edit
  profile", "Remove" (all destructive removes confirm).
- A profile modal (two-column: sticky reference gallery + text fields).
- A dedicated Lab (Character Lab / Environment Lab / Asset Lab) — full-
  width generation workbench with a Turnaround board, model/aspect/quality
  controls, and the same reference-library grid component the profile
  modal uses.
- "Assign to scenes" — links the entity into `scene.castIds` /
  `scene.setIds` / `scene.propIds`; assigned entities' approved references
  travel automatically into Shot Director as protected continuity inputs
  (prioritized over optional references, with UI feedback when a
  provider's reference-slot limit can't fit everything required — this is
  0.4.46's work, verified independently in 0.4.48/0.4.51).

Golden-path principle already established and worth preserving: whenever
you add a feature to one of these three, add it to all three the same way.
Most of this session's bugs were exactly one of the three lagging behind
the other two (a missing CSS class, a missing button wire-up, a stray
closing tag) after a feature landed on one first.

### Style DNA system

`resolveVisualDirection(project, {scene, shot, builtIns})` walks
project → scene → shot overrides and returns the effective style plus a
numeric `strength` (0.3–1, from the Style Strength dropdown:
Subtle/Balanced/Strong/Signature). `stylePromptBlocks(style, kind,
context, strength)` turns that into actual prompt text — `context` (new in
0.4.41) pulls a style's character/environment/prop-specific rules, not
just its generic image/video blocks; `strength` (new in 0.4.55) actually
scales how assertively the prompt states the style, up to an explicit
override directive plus negative-prompt suppression of competing
photoreal/3D language at Strong/Signature — **this was broken (silently a
no-op) until 0.4.55, so if you're comparing behavior against anything
written before that commit, the strength dial simply did nothing then.**

As of 0.4.46, style enforcement was also moved to the provider boundary in
`electron-main.js` (`styleEnforcementPrompt` / the "STYLE DNA LOCK" that
`resolvedShotPrompt()` prepends) so a stale saved prompt can never outrun a
newer style selection — verified wired into all 4 video-submit adapters
plus image in 0.4.51.

12 built-in 2D-animation Style DNAs exist (`2d-animation` category,
filterable via a chip in the Style Library), each fully authored (not the
thin legacy-preset wrapper) with real dedicated preview art — all 12 now
have real images, including the last two Codex closed out in 0.4.42.
~29 older cinematic/genre presets also exist; most had their preview
images replaced this session (they were multi-panel photo-collage
montages, not clean single reference images) but **two still aren't
fixed** — see Known Issues.

### Generation flow

Three entry points converge on the same backend IPC channel
(`generateShotImage`): Shot Director (full scene/shot context, richest
prompt via `productionPromptFor`), the three Labs (project-level style
only, no scene/shot), and Storyboard's quick "Generate with AI model"
button. All three now correctly resolve and inject Style DNA — that was
the core bug fixed in 0.4.41 (before it, only Shot Director did).

## What's been done (condensed changelog, 0.4.36 → 0.4.55)

Roughly chronological. Full detail is in each commit message.

- Golden-path bugs: missing delete confirmations (shots, frame-picker
  assets, reference tiles), Escape-to-close on every modal, warn before
  New/Open Project discards unsaved work, Import/Generate no longer
  silently wipe unsaved Lab fields, Storyboard discoverability.
- **Style DNA never reached Character/Set/Prop Lab or Storyboard's quick-
  generate at all** (only Shot Director) — fixed 0.4.41, independently
  also addressed in your own 0.4.43 work; both approaches converged.
- 12 new 2D-animation Style DNAs authored + given real art (0.4.41–0.4.42,
  finished by you in 0.4.42).
- Reference-library "preview large" wired to the real lightbox instead of
  a width-capped inline hero; lightbox enlarged, unstyled close button
  fixed (0.4.39–0.4.40).
- Your 0.4.43–0.4.47: Character Lab Turnaround board, context-aware style
  injection with metadata persistence, thumbnail-cropping fix, Accessory
  prop type, multi-reference scene assignment, Media Library reference
  reporting, provider-boundary style enforcement + "Restyle identity
  image", dedicated Locations/Props & Accessories workspaces.
- Post-merge audit found and fixed: Set/Prop profile Save button
  unreachable (stray closing div broke the form boundary — real, users
  could not save a Location or Prop profile through the primary button at
  all), Continuity audit extended to Locations/Props, dead pre-0.4.47
  Storyboard injection code removed, Story Bible's "Locations" naming
  collision disambiguated.
- Duplicate-id bug (Props page's "Add first asset" button had no click
  handler at all — shared an id with a different button), Character
  card's empty-state (flat black box, no badge, unlike Location/Prop
  cards which had one), splash-screen crop, three preset image swaps.
- **Style Strength was fully inert** — resolved to a number, carried as
  metadata, never once reached the actual prompt text. Fixed 0.4.55:
  now genuinely scales prompt assertiveness, verified live with a
  before/after prompt diff at Subtle vs Signature.
- Style card padding (content sat flush against card edges).
- Guide + in-app tutorial rewritten for the current asset-workspace
  structure (0.4.54).

## Known issues / where to focus next

Roughly in the order I'd tackle them:

1. **Two style presets still need real replacement art:**
   - **Graphic Novel** — still the old multi-panel montage. A replacement
     was offered mid-session but declined: it was styled unmistakably like
     Batman (cowl, cape, gargoyle, Gotham-style skyline, narration echoing
     actual Batman comic captions) — too close to a specific copyrighted
     character to ship in a bundled preset. Needs a different source image
     — bold inked linework, high-contrast cross-hatching, panel-like
     composition, but an original character/scene, not a recognizable
     copyrighted one.
   - **Vertical Social** — still a busy, text-heavy ad mockup for a
     fictional supplement brand ("IGNITE... FUEL YOUR FIRE"). Needs a
     clean single-image replacement matching "immediate eye-catching
     framing, bright punchy color, energetic close-up staging" without the
     baked-in ad copy.
   - Also worth a general re-scan: I fixed 16 of the legacy presets by
     hand this session by actually opening each bundled PNG and looking at
     it (not by assumption) — if any of the ~13 I didn't personally
     inspect turn out to also be old multi-panel montages, same treatment
     applies. `assets/styles/*.png`, cross-referenced against `styles[]`
     in `storymaker.js` and the `suppliedStyleAssetNames` alias map.

2. **7 of 8 documentation screenshots are stale**
   (`docs/screenshots/*.png` — only `splash.png` is current). The guide
   text was corrected in 0.4.54 but the images (home, model-hub, story,
   import-review, style-library, storyboard, shot-director) still show
   pre-0.4.47 UI. I had no way to capture a live app window to a
   retrievable file path in my session — if you have computer-use / screen
   capture available, this is a clean, contained task.

3. **"Restyle identity image" (0.4.46) and the Style Mixer are both
   claimed-working but not independently live-verified by me this
   session** — I read the code and it looks sound, but given this
   session's track record of finding real bugs in claimed-working features
   (the Set/Prop Save button, the duplicate-id "Add asset" button), don't
   take that on faith. Worth an actual click-through.

4. **Timeline, Delivery, and Audio Studio got only a spot-check** ("nothing
   broken," per 0.4.51's commit), not the same deep audit-and-polish pass
   the Character/Location/Props/Style surfaces got. If the goal is "every
   screen feels as considered as the ones that got the full pass," these
   three are the ones most likely still showing rougher edges — inconsistent
   empty states, padding, or the same class of copy-paste-drift bugs found
   everywhere else so far.

5. **Audio has no generation at all** — the Style DNA schema has
   `audio: {materialSounds, ambience, musicDirection, voiceDirection}`
   fields that are fully authored on every style but connected to nothing;
   Audio Studio is pure manual import + cue placement. Not a bug, a real
   feature gap, flagged but out of scope for a "golden path" pass — bigger
   product decision.

6. **General "does it feel magical" pass**: most of the deliberate polish
   effort this session concentrated on Character/Location/Props cards and
   the Style Library. A useful next move is the same treatment — actually
   click through every screen, not just read the code — applied to
   Timeline, Generate, Deliver, and Model Hub specifically, since those
   haven't had it yet.

## Working method this session used (worth keeping)

- **Verify live, not just by reading code.** Nearly every real bug found
  this session (the Set/Prop Save button, the duplicate-id button, Style
  Strength being inert) was invisible from a code read alone — the code
  looked plausible until actually clicked. Dev server via
  `mcp__Claude_Browser__preview_start` with `name: "story-maker-dev"`
  (config in `.claude/launch.json`), `window.storyMakerDesktop` stubbed
  (every provider call, `setDirty`, `onCommand`) for testing without real
  API costs when the fix doesn't specifically need a real generation.
- **`npm run test:release`** before every commit (ingestion smoke,
  visual-direction smoke, style-propagation audit, release smoke marker
  checks, production build) — currently 236 checks. If you rename a string
  that's checked by a marker in `scripts/release-smoke.mjs`, it will tell
  you exactly which one broke.
- **One commit per fix, long descriptive message** (root cause, fix, how
  verified) — not batched. Bump `package.json` version each time.
- **Build, deploy to Desktop, smoke-test the installed app launches**
  after each real batch of work — see the build gotcha above.
- Golden-path/consistency framing throughout: when Character/Location/
  Props diverge in behavior or polish, that divergence is usually the bug,
  even when each individual copy "works."

Good luck — this has been a genuinely fun one to work on.

— Claude (Sonnet 5), 2026-09-07
