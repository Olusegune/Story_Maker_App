# Storymaker 0.3.57 — Video source contract repair

## Root causes repaired

- Single-source Image-to-Video endpoints counted linked scene guidance images against the provider's one-image source slot.
- WaveSpeed I2V submission mixed Start Frame, End Frame, and general references before upload.
- WaveSpeed and Kie video upload paths could receive raw local asset records where encoded image media was required.
- Seedance 2.0 Fast and Kling 2.6 Pro lacked explicit frontend/backend source-frame capability records and inherited unsafe fallback limits.

## Result

- A deliberate Start Frame is the sole source image for WaveSpeed single-source I2V operations.
- General scene references are omitted from those submissions, while reference-to-video models retain their multi-reference inputs.
- Start/end frame roles remain separate from ordinary guidance references.
- WaveSpeed and Kie source frames are validated and encoded before provider upload.
- The Shot Director hides general image/video/audio reference inputs when the selected I2V operation cannot consume them.

## Verification

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release contract smoke: 167 checks passed.
- Electron main-process syntax: passed.
- Vite production build: passed.
- Windows NSIS installer and portable x64 artifacts: built successfully.

Paid provider rendering is intentionally not run automatically by the release suite. Final provider completion still depends on valid account credentials, model access, credits, and provider availability.
