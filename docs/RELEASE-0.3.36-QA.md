# Storymaker 0.3.36 QA

## Media and reference lifecycle

- Expanded native import recognition for common image, video, and audio containers, including MKV, FLV, WMV, MPEG, AIFF, and WMA.
- Media imports now return an actionable error when no supported local files can be read.
- Shot-level image, video, audio, start-frame, and end-frame assignments are counted as real usages in Media Library.
- Removing a project asset now clears every reference role that points to it.
- The Shot Director has both detach and project-removal actions for attached media.

## Generation and delivery

- Seedance 2.0 Reference-to-Video supports up to nine images, three videos, and three audio assets through its Fal contract.
- Added a visible queued-video monitor with provider polling, estimated progress, rotating film/AI trivia, and a completion notification.
- Added delivery targets: Native, 1K, 2K, and 4K. 2K/4K request Fal Topaz upscaling after a successful render.
- Added manual 2x/4x Topaz upscaling for generated image and video takes.

## Verification

- npm run test:release passed: 10 ingestion assertions, 72 release assertions, Electron main-process syntax check, and Vite production build.
- npm run build:win completed successfully, producing signed installer and portable Windows executables.

## Live-provider note

- Provider calls require the user's configured Fal credential and incur provider charges. The request and persistence paths are implemented, but no paid live job was submitted during packaging QA.
