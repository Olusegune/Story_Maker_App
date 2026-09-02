# 0.4.46 — Style enforcement and seamless asset continuity

## What changed

- Every image and video generation now receives a **Style DNA Lock** at the desktop provider boundary. This happens after a saved image/video prompt is loaded, so an old prompt cannot override a newer project, scene, or shot style selection.
- The lock resolves the live inheritance chain (project → scene → shot) and carries context-specific language for characters, environments, and props/accessories.
- This common boundary feeds OpenAI, Gemini/Nano Banana, fal, WaveSpeed, Kie, and local ComfyUI image/video routes.
- Character identity generation and all three turnaround angles explicitly preserve identity, costume, and proportions while rendering the active Style DNA. When an existing identity predates the selected look, Character Lab offers **Restyle identity image** rather than implying that it has silently changed.
- A scene's assigned character, set, prop, and accessory references automatically travel into Shot Director as protected continuity inputs. They take priority over optional references and the interface reports when a provider's image-reference limit cannot fit every required asset.
- Existing full-frame gallery behavior remains in place: shared asset-library images use `contain`, while cinematic preset-card letterboxing is intentionally reframed instead of displayed as black bars.

## QA completed

Run from the project root:

```powershell
npm run test:release
node scripts/delivery-pipeline-smoke.mjs
```

The release suite covers syntax, build output, story ingestion, Style DNA inheritance/context prompt blocks, the backend enforcement path, character/set/prop/storyboard call sites, automatic continuity selection, and the established production release checks. The delivery smoke additionally exercises the mixed-media delivery pipeline.

No paid provider generation was submitted during this release audit: provider credentials and usage are user-owned. The static path audit verifies that every supported provider route receives the final lock immediately before submission.

## Windows artifacts

`npm run build:win` creates an NSIS installer and a portable executable in `dist-release`. These artifacts are unsigned unless a Windows code-signing certificate is supplied to the build environment.

Built 2026-08-31 (x64):

- `Wheelbarrow Studios Story Maker Setup 0.4.46.exe` — SHA-256 `E08BE1E661E6022D82AA10E9D6B9309D91C59C89FB3F909FD6682C24AC59CD67`
- `Wheelbarrow Studios Story Maker 0.4.46.exe` — SHA-256 `6EC241EC3A6EDAE0CCCFB27B5F25DCB74D7106E79CFE4309784B83DC2D7B4D75`
