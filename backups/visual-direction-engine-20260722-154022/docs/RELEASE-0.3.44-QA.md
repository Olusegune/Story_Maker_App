# Storymaker 0.3.44 QA record

## Scope

- Reliable deterministic screenplay ingestion.
- Reusable production-asset assignments on storyboard scenes.
- Reference-frame gating and output-specific prompt routing regression coverage.

## Verified

- Numbered screenplay sluglines (`12. INT. KITCHEN - NIGHT`) create separate scenes.
- A blank line between a character cue and dialogue no longer drops dialogue.
- Detected props include expanded explicit production vocabulary, including passport and vehicle.
- Scene records persist `setIds` and `propIds`; their approved reference media is included in shot generation context.
- Start/end frame settings remain video-only and are never auto-selected by a general media import.
- Image and video prompt packages remain separate and output-aware.
- `npm run test:release` passed: 13 ingestion checks, 123 release checks, Electron syntax check, and Vite production build.

## Manual packaging check

- Windows NSIS installer and portable executable are produced by `npm run build:win` in `dist-release`.
