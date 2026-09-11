# Storymaker 0.3.43 QA

## Model-aware input repair

- Start and end frame selectors render only for video models that explicitly declare start/end-frame support.
- Switching to any image model immediately clears obsolete video-only frame state from the active shot; it does not appear in the attachment strip or submit payload.
- Importing media attaches only compatible reference types. It never silently assigns an imported image as a start frame or end frame.

## Rendered-take action repair

- The dynamically rendered **All Rendered Takes** gallery now binds Preview, Use this take, Download, and Remove at creation time.
- Choosing a take persists the selected asset, updates image/video scene linkage, and reopens the Shot Director so the selected state is visibly confirmed.

## Verification

`npm run test:release` passed: 10 ingestion assertions, 117 release assertions, JavaScript syntax checks, and the production Vite build.
