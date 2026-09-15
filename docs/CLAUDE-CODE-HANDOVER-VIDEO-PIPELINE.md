# Storymaker handover for Claude Code — video pipeline

## Repository and release locations

- Source repository: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
- Release output: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker\dist-release`
- Current version: `0.3.30`
- Installer: `dist-release\Wheelbarrow Studios Story Maker Setup 0.3.30.exe`
- Portable: `dist-release\Wheelbarrow Studios Story Maker 0.3.30.exe`
- Local generated media and encrypted provider credentials: `%APPDATA%\wheelbarrow-studios-story-maker`
- Existing pre-change backup: `C:\Users\eduni\Documents\Playground\Storymaker-backups\wheelbarrow-studios-story-maker-20260720-122759`

Do **not** print, copy, commit, or otherwise expose API credentials. They are stored through Electron `safeStorage` in the user profile.

## Current truth

Image generation has succeeded. Video generation is **not verified working end-to-end** and the user reports it is currently failing for Kie, fal, and WaveSpeed.

Treat this as a production-blocking issue. Do not call video support complete merely because the queue request returns a task ID or a job enters `queued`/`completed`.

Definition of success:

```text
submit job
→ provider completes
→ Storymaker downloads a valid video
→ saves it under generated-media
→ creates/updates a project asset
→ attaches it to the correct shot
→ offers it as a scene motion master
→ video is visible/playable after project reopen
```

## User-reported failures

The latest visual evidence was supplied in `codex-clipboard-ae1bd49c-7983-4d91-9789-4d6100c8fb26.png`.

1. WaveSpeed / `bytedance/seedance-2.0/image-to-video`

```text
WaveSpeed completed the task, but the result video could not be downloaded.
```

This proves provider completion but failure in result extraction/download/persistence.

2. Kie / `kie-seedance-2-video`

```text
Kie accepted <reference>.png without returning a file URL.
```

Root cause found: `uploadKieMedia` expected `data.fileUrl` only. Kie's current File Stream Upload documentation also returns `data.downloadUrl` in a successful response. The source was updated to accept either field.

3. fal

No single captured fal error accompanies this handover, but it used the same brittle one-URL result-download strategy as the other providers. It must be live-tested.

## Changes already made

### Video result persistence

File: `electron-main.js`

- Added `videoUrlsFromResult(value)` to collect result URLs from varied provider response shapes, prioritizing output/video/result/download-like keys.
- Added `downloadGeneratedVideo(urls, title, provider)`:
  - tries candidate URLs
  - follows redirects
  - retries each candidate three times
  - requests video/octet-stream content
  - validates response status, MIME/signature, and size
  - persists only validated media into Storymaker `generated-media`
- Updated `pollFalShotVideo`, `pollWaveSpeedShotVideo`, `pollKieVeoVideo`, and `pollKieMarketVideo` to use this shared downloader.
- Updated `saveGeneratedVideo` to record MIME type/source URL and preserve WebM/MOV extension where available.
- Updated `uploadKieMedia` to accept `data.fileUrl || data.downloadUrl`.
- Fixed `preflightShot`: video capability values are title-cased (`Video`), while the old preflight checked lowercase (`video`), causing the UI to claim a WaveSpeed video would render as a still image.

### Durable job lifecycle

Files: `electron-main.js`, `src/storymaker.js`

- Video submit creates a durable local job record.
- Polling writes a completed video asset path into the durable job ledger.
- Renderer recovery reads completed assets scoped by `projectId`, attaches them to the matching project/shot, and avoids cross-project matching by name.
- A generated video can be selected with **Use as scene motion master**; it is then preferred by storyboard and delivery preview.

### Storyboard video entry point

File: `src/storymaker.js`

- Every storyboard scene card has **Generate video**.
- If an approved/generated still exists, it primes a compatible image-to-video model with the image reference.
- If no still exists, it primes text-to-video from the scene brief.

### Production intelligence / shot blueprint

Files: `story-ingest.js`, `electron-main.js`, `src/storymaker.js`

- Local parser detects camera, lighting, performance, audio, VFX, and continuity phrases and retains source evidence.
- AI story-analysis schema now asks for camera, lighting, performance, audio, effects, and continuity data.
- Imported analysis creates a starter shot with a `blueprint` object:

```js
{
  narrative, performance, blocking, camera, lighting,
  motion, audio, effects, continuity, provenance
}
```

- Shot Director now exposes Director Controls for performance, lighting, blocking, and VFX/continuity. These are persisted and compiled into generation prompts by `shotImagePrompt`.

## Important files and functions

| Purpose | File | Key functions |
|---|---|---|
| Provider video adapters | `electron-main.js` | `submitFalShotVideo`, `pollFalShotVideo`, `submitWaveSpeedShotVideo`, `pollWaveSpeedShotVideo`, `submitKieVeoVideo`, `pollKieVeoVideo`, `submitKieMarketVideo`, `pollKieMarketVideo` |
| Shared result persistence | `electron-main.js` | `videoUrlsFromResult`, `downloadGeneratedVideo`, `saveGeneratedVideo`, `runDurableGeneration` |
| Provider routing IPC | `electron-main.js` | `shot:submit-video`, `shot:poll-video` |
| Renderer video workflow | `src/storymaker.js` | `generateSceneVideo`, `enhanceShotDirector`, `recoverQueuedVideoJobs`, `recoverCompletedGenerationAssets`, `openVariation` |
| Parser | `story-ingest.js` | `productionSignals`, `parseStoryStructure`, `ingestStoryText` |
| Static release checks | `scripts/release-smoke.mjs` | 60 marker checks as of this handover |

## Required next work

1. **Run real low-cost video smoke requests** for each configured provider:
   - WaveSpeed: one text-to-video and one image-to-video
   - Kie: one text-to-video and one image-to-video
   - fal: one text-to-video and one image-to-video

2. For each test, capture and inspect:
   - exact submit response (redact secrets)
   - exact status/result response (redact signed query tokens in reports)
   - every candidate output URL considered
   - response status/content type/byte size for video download
   - persisted local asset path
   - matching project asset, shot `outputAssetId`, and scene `motionAssetId`

3. If a provider returns a response shape not covered by `videoUrlsFromResult`, add a provider-specific normalizer. Do not weaken result validation just to mark a job completed.

4. Ensure Kie upload forms match the current API contract. Current docs show multipart file upload and a `downloadUrl`; review whether `uploadPath`/`fileName` should be included for the account/model in use.

5. Add actual paid smoke tests behind an explicit environment flag, with test cleanup. Static checks are not evidence that a third-party provider contract works.

6. Do not rebuild or give the user a new EXE until at least one successful, persisted, playable video is verified from each enabled gateway—or clearly state which providers remain unverified.

## Commands

```powershell
Set-Location C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker
npm run test:release
npm run build:win
```

`npm run test:release` currently passes:

```text
Ingestion smoke passed (10 assertions).
STORYMAKER_RELEASE_SMOKE_OK (60 checks)
```

These are static/build checks; they do not exercise paid provider requests.

## Known product gaps

- The advanced import engine is still incomplete relative to the original product brief. The parser and shot blueprint are a foundation, not the complete production-intelligence system.
- Script improvement suggestions exist in AI Director and support editable Accept/Reject, but the full import-time change-plan/review experience is not complete.
- The most urgent blocker remains live video generation persistence.
