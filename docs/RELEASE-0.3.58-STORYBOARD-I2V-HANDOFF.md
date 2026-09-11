# Storymaker 0.3.58 — Storyboard image-to-video handoff

## Root cause

The storyboard's default video route selects WaveSpeed WAN Image-to-Video. WAN inherited the generic video capability, which did not expose frame controls. Opening Shot Director therefore cleared the Start Frame that the storyboard action had just assigned. The request then failed preflight or fell back to prompt-led behavior.

## Repairs

- Infer explicit Start Frame capability for single-source I2V operation slugs, including WAN and other gateway models.
- Resolve the source frame from the approved storyboard image, selected image take, image history, scene variations, then scene reference—in that order.
- Preserve `sourceFrameAssetId` on the video job and completed asset.
- Link completed video assets back to `scene.motionAssetId` and the originating shot.
- Display the source image name alongside new video outputs.
- Label legacy videos whose source was never recorded instead of implying they came from the current image.
- Preserve Kling 3's richer multi-reference I2V contract as an explicit exception.

## QA

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release smoke: 172 checks passed.
- Electron syntax and Vite production build: passed.
