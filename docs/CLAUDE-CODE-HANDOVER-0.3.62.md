# Claude Code Handover — Storymaker 0.3.62

## Codebase

Primary source:

`C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`

Clean handover snapshot:

`C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker-claude-handover-0.3.62`

## Release artifacts

- Installer: `dist-release\Wheelbarrow Studios Story Maker Setup 0.3.62.exe`
- Portable: `dist-release\Wheelbarrow Studios Story Maker 0.3.62.exe`

## What changed in 0.3.62

- Added Characters after Design in the top production navigation.
- Restyled Style Strength and improved Style Library card spacing/actions.
- Rebuilt Model Hub with provider groups, search, and output/connection filters.
- Made Audio Studio a direct and understandable four-step workflow.
- Increased media prominence in Storyboard, Shot Model Director, and Timeline.
- Switched Generate from the stale OpenAI-only route to `visualizationWorkspace()`.
- Added `sceneTakeEntries()` to aggregate scene variations, approved assets, per-shot outputs, output histories, and motion masters.
- Added mixed image/video take previews via `visualTakeMarkup()`.

## Important architecture

- Renderer/application: `src/storymaker.js`
- Release UX overrides: `src/ux-release-041.css`
- Provider and persistence layer: `electron-main.js`
- Desktop bridge: `preload.js`
- Ingestion/parser: `story-ingest.js`

## Verification

Run:

```powershell
npm run test:release
npm run test:delivery-pipeline
```

Expected:

- `STORYMAKER_RELEASE_SMOKE_OK (198 checks)`
- `STORYMAKER_DELIVERY_PIPELINE_OK`

## Next recommended work

- Run paid low-cost live provider smoke tests only when explicitly authorized and funded.
- Continue visual inspection with a populated real project, especially the unified Generate take rail and wide Timeline clips.
- Keep provider-specific payload behavior in `electron-main.js`; do not leak it into renderer components.
- Preserve the explicit distinction between general references and selected start/end frames.

