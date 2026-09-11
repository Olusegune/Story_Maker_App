# Storymaker 0.3.39 QA

## Render continuity

Generation status now appears in a persistent, minimizable dock at the lower-right of the app. It does not blur, disable, or capture the production workspace. Video jobs remain durable and continue polling from their persisted job record while the user moves between screens.

## Prompt authority

- **Shot Intent / Story Beat** is a creative brief only.
- **Image Prompt** is the sole provider payload for image models.
- **Video Prompt** is the sole provider payload for video models.
- The inactive prompt remains editable for a later still or animation pass.
- The selected model visibly identifies which prompt is active.
- Rebuild both from shot intent regenerates paired prompts from the current approved blueprint without touching references or the source story.

## Story handling

Both import choices now communicate the same production result: Preserve & create prompt plan keeps the authored script intact while creating editable production blueprints and paired prompts; Improve with AI keeps recommendations reviewable and only plans approved changes.

## Presentation polish

- Splash artwork is brighter, richer, and more saturated while keeping the background workspace intentionally subdued.
- Generated asset display titles no longer expose timestamped filenames; current and future takes show a human-readable title in review.

## Automated verification

`npm run test:release` passed: ingestion smoke (10 assertions), release smoke (95 assertions), syntax checks, and Vite production build.

## Manual verification to perform with a configured provider account

1. Queue a real video render, navigate to Story Bible/Timeline/Media Library, and confirm the render dock keeps updating while all controls remain usable.
2. Reopen the project after completion and confirm the take is visible under its shot.
3. Verify the model-specific active prompt notice changes between an image and a video model, then submit a low-cost request from each.
