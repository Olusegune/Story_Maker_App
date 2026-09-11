# Storymaker 0.3.41 QA

## UX and connected production changes

- Timeline shot cards now grow vertically, wrap long titles, camera text, and model names, and retain readable padding rather than clipping content.
- Design Bible now provides a compact filter bar for all styles, story recommendations, and each style family. Category headers use the accessible amber action accent and have increased visual weight.
- Character profiles support multiple role-tagged visual references: primary identity, secondary look, wardrobe, expression, pose, and environment. The legacy dropdown is replaced in the active Character Bible editor by selectable visual cards.
- Character movement, continuity rules, identity, wardrobe, objective, and selected reference roles are injected into structured image and video prompt packages whenever the character is assigned to the scene.
- Video prompts add thought-led acting and restrained secondary animation: gaze, blink timing, breath, facial asymmetry, hands, weight, posture, fabric, hair, and motivated pauses. Image prompts describe the decisive acting moment instead of a generic pose.

## Verification performed

- `node --check src/storymaker.js`
- `node --check electron-main.js`
- `npm run test:release` — 10 ingestion assertions, 102 release assertions, syntax checks, and a production Vite build passed.
- Manual source-path audit confirmed the Character Bible references flow through `linkedReferenceIds()` to compatible shot renders and that prompt compilation reads cast profiles.

## Packaging

- Windows installer and portable build remain configured through `build:win`.
- macOS `.dmg` and `.zip` targets for x64, arm64, and universal builds are declared. See `docs/MACOS-DEPLOYMENT.md` for the required macOS, signing, icon, and notarization steps.
- macOS binaries cannot be created or verified from this Windows build environment and are not represented as complete artifacts.
