# Storymaker 0.3.40 QA

## Take retention and selection

- Every completed image/video job remains as a project asset and as an entry in its shot's **All Rendered Takes** gallery.
- Rendering a new take does not delete or replace an earlier file. It only changes the current output pointer after the user chooses **Use this take**.
- Selecting a video assigns it as the scene motion take. Selecting a still clears the motion take and assigns that still as the scene's selected visual, so the storyboard always follows the user’s most recent explicit choice.
- Each take can be previewed, downloaded, or removed individually. Removing a take detaches all project links safely and deletes only app-generated files.

## Media Library

- Media cards now expose Preview and Download actions. Clicking a card’s preview opens the same image/video review surface; videos play with native controls there.
- Existing Remove behavior remains available.

## Visual and prompt polish

- Shot Model Director cards show the selected take as a thumbnail/video preview; videos preview while hovered.
- Text is clamped in cards to prevent overflow; full titles remain available in the detail surface.
- Legacy prompt packages migrate to labeled Image/Video production packages on next edit/save. New video prompts are organized by scene, story purpose, performance, blocking, camera, lighting, motion, audio, VFX, continuity, and negative constraints.

## Automated verification

`npm run test:release` passed: 10 ingestion assertions, 102 release assertions, JavaScript syntax checks, and production Vite build.
