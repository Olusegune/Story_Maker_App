# Storymaker 0.3.52 — Visual Direction Engine QA

## Delivered

- Versioned, structured Style DNA with a non-destructive inheritance chain: project, scene, then shot.
- Built-in `Layered Paper Editorial` direction with materials, camera, lighting, motion, locks, and negative constraints.
- Visual Direction workspace with searchable style cards, project strength, favorites, a creator, a structured mixer, prompt inspection, drift-check entry point, and desktop-backed My Styles.
- Style references have explicit creative roles and remain independent of video start/end-frame controls.
- Custom Style DNA retains earlier versions; prior versions can be restored as a new current version.
- Future image and video jobs record the resolved Style DNA/version/source metadata with the generated take.
- Portable `.storymaker-style` import/export through the desktop shell.
- Provider-backed Style Preview Lab: character, environment, prop, and storyboard previews are explicit, real image requests that save their output and provenance to the project.
- AI Style DNA interpretation now pauses for a field-level compare/accept/revise review instead of silently saving over a style.

## Verification run

`npm run test:release` passed:

- Ingestion smoke: 13 assertions.
- Visual Direction domain smoke checks.
- Release smoke: 151 checks.
- Electron main-process syntax check and Vite production build.

## Manual desktop check

The Electron application launched successfully using the rebuilt production bundle. No launch-time JavaScript error was observed.

## Live provider evidence

On 2026-07-22, the opt-in Fal multimodal smoke test completed successfully:

- Provider/model: `fal` / `bytedance/seedance-2.0/reference-to-video`
- Request ID: `019f8b86-bde9-73d2-8eed-0c029a3fd132`
- Inputs: one project-generated image and one MP4 reference
- Output: downloaded MP4, 606,620 bytes, 992×432, 4.041667 seconds
- Local evidence: `%APPDATA%\wheelbarrow-studios-story-maker\generated-media\fal-seedance-2-live-smoke-1784752593827.mp4`

## Follow-up validation before release distribution

- Run at least one paid image generation from the Style Preview Lab with a selected Style DNA and confirm the saved asset metadata includes the expected style/version.
- Run one supported video generation from a shot that has a shot-level override and confirm the completed video preserves the same metadata.
- Exercise `.storymaker-style` import/export from the packaged Windows build.
- Verify My Styles persistence across a clean application restart.
