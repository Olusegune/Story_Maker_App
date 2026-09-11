# Story Maker 0.4.42 — Preset completion and QA

## What changed

- Completed the two outstanding 2D Animation preview assets with original dedicated artwork:
  - `Sunlit Graphic Storybook.png`
  - `Soft Gouache Memory.png`
- Each 2D Style DNA now resolves to a named, single-scene image. No 2D style falls back to the generic splash illustration.
- Corrected the release version in both `package.json` and `package-lock.json` to `0.4.42`.

## Validation completed

- JavaScript syntax checks for the renderer and visual-direction module.
- Visual Direction smoke checks.
- Production Vite build, confirming both new assets are emitted.
- Windows packaging completed for x64: an NSIS installer and a portable executable.

## Windows deliverables

- `dist-release/Wheelbarrow Studios Story Maker Setup 0.4.42.exe`
- `dist-release/Wheelbarrow Studios Story Maker 0.4.42.exe`

The executables are not Authenticode-signed because this build environment has no Windows signing certificate configured. Windows may display its normal unsigned-app warning until a signed release is produced.

## Deliberate safety decision

The supplied Batman-like graphic-novel image remains excluded. The Graphic Novel preset continues to use its existing original, non-franchise-specific asset.
