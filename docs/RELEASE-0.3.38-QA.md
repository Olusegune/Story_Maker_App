# Storymaker 0.3.38 QA and release note

## What changed

- The Shot Director now attaches compatible files selected in **Import and attach media** directly to the active shot. This applies to image, video, and audio references within the selected model's declared input limits.
- Start and end frames are visual thumbnail cards rather than filename dropdowns. A user can clear or replace either frame from the same model-input panel.
- The current model controls which asset roles are visible. Seedance 2.0 Reference-to-Video can expose image, video, audio, start-frame, and end-frame inputs; unsupported inputs are not sent.
- Delivery quality is exposed as clear Native, 1K, 2K, and 4K controls, alongside only the selected model's supported native resolution choices.
- Every parsed/imported scene and every AI-planned shot now receives a connected **Image Prompt** and **Video Prompt** compiled from narrative purpose, performance, blocking, camera, lighting, motion, sound, effects, continuity, and the project visual language.
- Accepting a script improvement creates a new story version and regenerates the still-safe production storyboard from the approved direction. Generated or locked shots are preserved.

## Checks run

- `node --check src/storymaker.js`
- `node --check electron-main.js`
- `npm run test:release`

Result: ingestion smoke passed (10 assertions); release smoke passed (89 assertions); Vite production build passed.

## Manual acceptance path

1. Import a script, run the breakdown, then accept an AI improvement. Open Storyboard or Shot Director and verify the shot contains populated image/video prompt packages and production-blueprint fields.
2. Select a multimodal video model such as **fal → Seedance 2.0 Reference-to-Video**. Use **Import and attach media** to select image, video, and audio files. Verify each compatible item appears under Attached references without visiting Media Library.
3. Select a start/end-frame capable model. Verify imported images appear as visual thumbnail cards in Start Frame and End Frame; click a card, then verify an attached-reference chip is shown. Click × to detach it from only this shot.
4. Choose Native, 1K, 2K, or 4K. Verify the selected delivery control is highlighted before submission.

## Truthful limits

- Actual model input combinations remain limited to the capability record and provider adapter. Storymaker does not claim that a model supports audio or end frames when its provider contract does not.
- 1K/2K/4K are delivery targets. Native output uses the selected model's real resolution; image upscale requires a connected fal key and Topaz availability.
- Provider credentials and paid remote renders must be tested on the user's configured account; the release checks do not spend provider credits.
