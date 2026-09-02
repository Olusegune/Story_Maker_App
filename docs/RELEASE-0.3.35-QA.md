# Storymaker 0.3.35 QA notes

## Delivered

- Increased top-navigation and compact-sidebar icon/text targets for improved readability and click accuracy.
- Added intentional space between the Audio Studio empty-state copy and its primary action.
- Added a model-aware Shot Director attachment tray with removable shot-local image references, multiple video and audio references where supported, optional start/end frames, and a clear-all action that leaves library media untouched.
- Added capability-gated Fal model entries for Seedance 2.0 and Kling V3/O1.
- Added typed media validation and Seedance 2.0 request construction for up to nine images, three videos, and three audio references.

## Verification

npm run test:release passed: ingestion smoke (10 assertions), release smoke (66 assertions), Electron main-process syntax checking, and a Vite production build.

## Scope note

Multimodal controls are presented only for catalogued endpoints with an implemented request contract. Generic Kie and WaveSpeed video entries remain image-reference-only until each selected endpoint has a verified multimedia payload contract; this prevents the UI from accepting assets that an adapter would silently discard.
