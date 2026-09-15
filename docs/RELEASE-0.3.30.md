# Storymaker 0.3.30 release notes

## What changed

- Repaired video result handling for fal, Kie, and WaveSpeed: result payloads are normalized across provider URL shapes, downloads follow redirects and retry transient failures, and returned files are validated before becoming project assets.
- Updated Kie reference uploads to accept either documented result URL shape (`fileUrl` or `downloadUrl`), fixing the exact upload failure reported by the desktop app.
- Corrected video preflight classification so a selected video model is never described as a still-image render.
- Added a structured Shot Blueprint to every shot: narrative, performance, blocking, camera, lighting, motion, audio, effects, continuity, and provenance. Director Controls now expose dedicated performance, lighting, blocking, and continuity fields.
- Imported parser and AI-analysis signals now seed Shot Blueprints, so documented camera, lighting, performance, audio, effects, and continuity notes are available at shot level instead of being inert parser metadata.
- Added project-scoped durable generation recovery. Completed image/video jobs are read from the local ledger, verified on disk, attached to their originating project and shot, then surfaced in the storyboard after a renderer refresh or restart.
- Added a reusable **Use as scene motion master** action for generated video takes. A selected video now becomes the scene's motion asset and is preferred by storyboard and delivery previews.
- Added a dedicated **Generate video** action to every storyboard panel. It automatically selects image-to-video when that scene has an approved/generated still, otherwise opens a text-to-video shot with the scene brief prefilled.
- Added model-aware request validation for output type, aspect ratio, resolution, reference limits, video durations, and reference-required video modes.
- Kept active video routing to fal, Kie, and WaveSpeed. Retired direct Kling and Seedance routes remain unavailable for submission.
- Added project identity to new durable jobs to prevent media from one same-named project appearing in another.
- Added Story Import v2 signals for camera, lighting, audio, effects, performance, continuity, source evidence, scene notes, and clipboard import.
- Preserved a pre-change story version whenever a suggested revision is accepted.
- Replaced the Windows/installer/file-association artwork with the supplied Storymaker icon.

## Generation workflow

1. Create or open a project.
2. Import a source document or use **File → Import Story from Clipboard**.
3. Create/select a scene and open its AI shot direction controls.
4. Select Automatic routing or a configured provider/model.
5. Submit the generation. The job is stored locally before the provider request finishes.
6. On completion, Storymaker copies the delivered media into its managed local media store, creates a project asset, and attaches it to the matching shot.
7. Review the take. For video, choose **Use as scene motion master** to make it the scene's motion asset for storyboard and delivery.

## Verification performed

- `npm run test:release` completed successfully:
  - Story ingestion smoke: 10 assertions.
  - Release/static integration smoke: 55 checks.
  - Electron main-process syntax check.
  - Vite production build.
- Windows installer and portable executable were built from this source revision.
- The final portable executable was launched on Windows and reached the production home screen.

## Intentional safeguards

- Jobs are recovered only when their durable `projectId` matches the open project. Legacy jobs that lack a project ID are not auto-attached, preventing accidental cross-project media assignment.
- Provider credentials stay in the application configuration and are not emitted in logs or release artifacts.
- Unsupported model/control combinations fail before a provider request is sent.

## Remaining external verification

Every provider/model combination cannot be certified without spending provider credits for each configured account/model. The included provider health, preflight, durable job, result-persistence, and routing layers are in place; exercise each provider's low-cost smoke request from Model Hub after installing if you want account-specific confirmation.
