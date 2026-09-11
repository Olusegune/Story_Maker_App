# Storymaker 0.3.59 — Claude Code handover

## Working locations

- Canonical active repository: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
- Clean handover snapshot: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker-claude-handover-0.3.59`
- Windows releases: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker\dist-release`

Use the handover snapshot as Claude Code's workspace. It contains the latest source, assets, scripts, documentation, package manifests, and production `dist` output. It intentionally excludes `node_modules`, prior release binaries, backups, Git internals, encrypted provider credentials, user projects, and generated media.

## Application architecture

- Electron desktop shell and provider/backend adapters: `electron-main.js`
- Safe renderer bridge: `preload.js`
- Vite renderer entry and application orchestration: `src/storymaker.js`
- Story import/parser: `story-ingest.js`
- Visual Direction engine: `src/visual-direction.js`
- UI styles: `src/*.css`
- Release tests: `scripts/ingest-smoke.mjs`, `scripts/visual-direction-smoke.mjs`, `scripts/release-smoke.mjs`

## Latest repair: reference isolation and exact image animation

The reported defect was not primarily a style-prompt failure. Storymaker automatically promoted scene, character, set, and prop images into provider reference inputs. Those images could dominate the selected Paper Style.

Implemented behavior:

1. Scene generation sends only references explicitly checked by the creator. It no longer falls back to `linkedReferenceIds` when nothing is checked.
2. Shot Director uses explicit, versioned reference selections (`referenceSelectionVersion: 2`). Legacy auto-populated lists are cleared on first use rather than silently submitted.
3. Scene reference selections persist separately as `generationReferenceAssetIds`.
4. Every image take now exposes `Animate this image`; Current Output exposes `Animate this exact image`.
5. That action sets the exact image as `startFrameAssetId`, clears unrelated guidance assets, selects a real I2V model, and opens Shot Director.
6. Frame galleries now provide per-asset project deletion controls. Removal clears character, set, prop, scene, shot, start/end-frame, history, and generation-reference links.
7. Approved storyboard imagery remains available as a source but is never submitted as guidance merely because it exists.

Relevant renderer functions:

- `generateSceneImage`
- `animateExactImageTake`
- `generateSceneVideo`
- `storyboardVideoSourceFrame`
- `openShotDirector`
- `enhanceShotDirector`
- `removeMedia`

## Video pipeline repairs already present

- Single-source I2V operations treat Start Frame as the sole source image.
- WaveSpeed and Kie source files are encoded before upload.
- Seedance 2.0 Fast, Kling 2.6 Pro, WAN, and fallback I2V slugs receive explicit frame capability handling.
- General references are isolated from start/end-frame roles.
- Completed videos persist `sourceFrameAssetId` provenance and link to both shot output and `scene.motionAssetId`.
- New videos identify their source image in Current Output. Legacy videos show `SOURCE NOT RECORDED`.
- Kling 3's richer multi-reference I2V contract is explicitly exempt from single-source clamping.

## Story and Visual Direction work already present

- Multi-format story ingestion and robust screenplay parsing.
- Preserve-versus-improve review workflow.
- Individual and bulk recommendation acceptance.
- OpenAI → Gemini → OpenRouter production-intelligence fallback.
- Structured shot blueprints for performance, camera, lighting, blocking, motion, audio, effects, and continuity.
- Style DNA/Visual Direction inheritance across project, scene, and shot.
- Paper/editorial visual style packages and provider-ready image/video prompts.
- Reusable character, set, prop, wardrobe, vehicle, and creature records.

## Provider/storage notes

- Provider keys are encrypted under Electron `userData` and are not included in the snapshot.
- Supported gateway providers include fal, Kie, and WaveSpeed, with OpenAI/Google/OpenRouter used where applicable.
- Provider output is downloaded into Storymaker-controlled local generated-media storage before project linkage.
- Paid live generation is not part of the default test suite. Use a deliberate low-cost smoke project and explicit creator approval before spending credits.

## Verification at handover

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release contract smoke: 177 checks passed.
- Electron main-process syntax: passed.
- Vite production build: passed.
- Windows installer and portable packaging: expected under version 0.3.59 after the final build step.

Run:

```powershell
npm install
npm run test:release
npm run build:win
```

## Recommended continuation

1. Install dependencies in the snapshot.
2. Run the complete release suite before editing.
3. Perform one paid, low-cost end-to-end test for each connected gateway:
   - Paper-style text-to-image with no references selected.
   - Explicit character/reference image generation.
   - `Animate this exact image` through WaveSpeed WAN/Kling.
   - Kie I2V with the same explicit frame.
   - fal I2V and one fal multi-reference model.
4. Verify the completed video visually matches the recorded `sourceFrameAssetId`.
5. Preserve the explicit-reference rule. Production-library membership must never equal provider attachment automatically.

## Known limitation

Automated tests verify routing, validation, persistence, packaging, and provider contract construction without spending provider credits. A successful real provider render still depends on the user's current key, account access, credits, model availability, and provider uptime.
