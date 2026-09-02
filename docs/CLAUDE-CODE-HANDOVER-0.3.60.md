# Storymaker 0.3.60 — Claude Code handover

## Working locations

- Canonical repository: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
- Claude snapshot: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker-claude-handover-0.3.60`
- Windows releases: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker\dist-release`

Use the snapshot as Claude Code's workspace. It excludes dependencies, release binaries, backups, Git internals, provider credentials, user projects, and generated media.

## Architecture

- Electron shell/provider adapters: `electron-main.js`
- Renderer bridge: `preload.js`
- Main application and generation orchestration: `src/storymaker.js`
- Story parser: `story-ingest.js`
- Visual Direction engine: `src/visual-direction.js`
- UI styles: `src/*.css`
- Contract tests: `scripts/*-smoke.*`

## 0.3.60 repair

The Seedance failure was renderer state loss, not only a provider error. When the creator changed API provider, the provider's first arbitrary model could briefly become selected. That model often lacked frame controls, and `renderReferenceInputs()` erased `startFrameAssetId` and `endFrameAssetId` before Seedance loaded. Submission then correctly failed because no deliberate Start Frame remained.

Implemented:

1. Browsing a model without frame controls hides the frame UI but no longer destroys the creator's selected frame state.
2. Provider changes prefer a model whose declared modes include the current operation, such as `image-to-video`, instead of blindly selecting the provider's first model.
3. Model capability copy now identifies Start Frame and optional End Frame independently from general guidance references.
4. Visual Direction uses an app-styled accessible listbox instead of the native white Windows select menu.
5. `Download` and `Animate this exact image` now share a consistent 142 × 32 action size and deliberate spacing.
6. Five release regressions plus a destructive-state guard were added. The release contract now contains 182 checks.

Key renderer areas:

- `enhanceShotDirector()`
- `updateProviderModels()`
- `updateCapabilities()`
- `renderReferenceInputs()`
- `animateExactImageTake()`

## Existing explicit-reference contract

- Scene and Shot Director generation submit only references explicitly selected by the creator.
- General references never become Start Frame or End Frame automatically.
- `Animate this exact image` sets that precise image as Start Frame and clears unrelated guidance for single-source I2V.
- Single-source I2V adapters clamp to one source image.
- Generated video records `sourceFrameAssetId` and links to the shot and `scene.motionAssetId`.
- Reference/frame assets can be detached from a shot or removed from the project in the model UI.

Do not reintroduce automatic promotion of scene, character, set, prop, or style-preview images into provider inputs. Project-library membership is not provider attachment.

## Verification

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release contract: 182 checks passed.
- Electron syntax and Vite production build: passed.
- Windows installer/portable packaging performed for 0.3.60.

Run before continuing:

```powershell
npm install
npm run test:release
npm run build:win
```

## Paid-provider limitation

The automated suite validates routing, validation, persistence, payload construction, and packaging without spending credits. It does not prove a current paid Seedance response. Live completion still depends on the creator's current key, entitlement, credits, model availability, and provider uptime. For live QA, use one low-cost project and verify that the resulting video's recorded `sourceFrameAssetId` matches the chosen image.

