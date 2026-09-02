# Claude Code handover — Storymaker 0.3.38

Repository: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`

## Current release target

Version is `0.3.38`. Build both Windows targets with `npm run build:win`; artifacts are emitted to `dist-release`.

## This pass

- `src/storymaker.js`
  - `Import and attach media` now imports and attaches compatible image/video/audio files to the active Shot Director form. The prior behavior only reported that a selection was ready, which was the user-visible failure.
  - Start/end frame dropdowns were replaced with thumbnail-card selectors: `shotStartFrameChoices` and `shotEndFrameChoices`.
  - The Shot Director has a paired `MODEL-READY PROMPT PACKAGE`: `shotImagePrompt` and `shotVideoPrompt`.
  - `productionPromptFor()` compiles story, performance, blocking, camera, light, motion, audio, effects, continuity, and style into model-ready prompt text.
  - Import breakdown and `populateAllShots()` populate these prompts. Accepting an editorial suggestion captures a story version and reruns planning only for still-safe scenes.
- `src/accessibility-and-reference.css` adds the visual frame-card UI.
- `src/shot-controls.css` adds the Native/1K/2K/4K delivery control and paired prompt layout.
- `scripts/release-smoke.mjs` has 89 source-contract assertions.

## Existing video pipeline work to preserve

- `electron-main.js` implements Fal, Kie, and WaveSpeed adapters, durable generation jobs, provider media download, and local result persistence.
- Fal multimodal staging occurs in `falUploadReference` / `uploadFalReferences`; Seedance Reference-to-Video has limits `image: 9, video: 3, audio: 3`.
- Previous live tests created valid local media:
  - Fal Seedance 2.0 live smoke: `C:\Users\eduni\AppData\Roaming\wheelbarrow-studios-story-maker\generated-media\fal-seedance-2-live-smoke-1784639574585.mp4`
  - Fal Kling v3 live smoke: `C:\Users\eduni\AppData\Roaming\wheelbarrow-studios-story-maker\generated-media\fal-kling-v3-live-smoke-1784639933825.mp4`
  - Fal Topaz live smoke: `C:\Users\eduni\AppData\Roaming\wheelbarrow-studios-story-maker\generated-media\fal-topaz-live-smoke-1784640177704.png`

## Verification before changing providers

1. `npm run test:release`
2. With valid keys present, run paid smoke tests deliberately:
   - `npm run test:fal-live`
   - `npm run test:fal-upscale-live`
3. In the desktop app, select a provider/model, import one media file of each advertised type, submit a low-cost render, wait for completion, reopen the project, and confirm the persisted asset and output history.

## Important constraints

- Never pretend external audio/video/start/end-frame support exists for a model unless the exact provider model capability says so.
- Do not replace generated or locked shots when accepting an AI story suggestion.
- Preserve the user’s project files and existing dirty worktree changes.

## Backup

Pre-0.3.38 snapshot: `backups\storymaker-pre-0.3.38-20260721-095622.zip`.
