# Storymaker status

## v0.3.12 - Simple and Studio workspace modes

Delivered:

- Added a persisted workspace-depth choice. **Simple Mode** exposes the guided Story → Look → Board → Make → Deliver path; **Studio Mode** keeps the complete production navigation and selective-control surfaces.
- Added a deliberate in-context mode switch in the sidebar and a full preference control in Settings. Switching modes never forks or downgrades the project record.
- Kept Simple Mode genuinely low-friction by hiding advanced rooms from the primary rail, while retaining every project detail for Studio Mode later.

Verification pending for this build:

- `npm run test:release`
- Windows package build and unpacked launch smoke

## v0.3.11 - Collection artwork pass

Delivered:

- Installed fourteen supplied visual collection boards and mapped them across all twenty-eight Design Bible directions.
- Removed the distracting ART PENDING / ART READY treatment. Every visual language is represented by real artwork, including related directions that intentionally share a collection board.
- Documented the artwork model and the direct-art override convention for any future one-to-one preset imagery.

Verification pending for this build:

- `npm run test:release`
- Windows package build and unpacked launch smoke

## v0.3.10 - Intent language and guided-mode direction

Delivered:

- Replaced public named-imitation labels with trait-based directions: **Hand-Painted Whimsy** and **Character-Forward 3D** preserve the supplied visual reference art without presenting the product as a franchise- or studio-imitation tool.
- Added a product-language standard that separates broad art-direction render looks from future native 3D renderer integrations.
- Defined the product contract for Simple Mode (guided story-to-delivery) and Studio Mode (depth-on-demand production controls) so both operate on one connected project record.

Verification pending for this build:

- `npm run test:release`
- Windows package build and unpacked launch smoke

## v0.3.9 - Creative library and gateway-ready pass

Delivered:

- Applied the workspace-first creative-OS direction to the Design Bible: a production visual library replaces the fixed style strip, with grouped languages, restrained architectural cards, and one clear selected-language focal point.
- Expanded the catalog from 8 to 28 visual languages. Twenty new directions are visible now as intentional **ART PENDING** production cards rather than broken image placeholders.
- Added a drop-in asset resolver for `.png`, `.jpg`, `.jpeg`, and `.webp` artwork. Add a full-frame image using the exact manifest filename and rebuild; the corresponding card becomes **ART READY** without code changes.
- Added WaveSpeed and OpenRouter to encrypted local provider configuration. OpenRouter has a documented, non-generative credential check; Fal, Kie, and WaveSpeed remain honest saved-key routes until a model-specific render adapter is explicitly implemented and successfully tested.
- Added the visual-preset asset manifest and release checks for the new catalog and secure provider configuration.

Verification pending for this build:

- `npm run test:release`
- Windows package build and unpacked launch smoke

## v0.3.8 - Render reliability pass

Delivered:

- Added a no-cost, model-aware Shot Director preflight. It validates the local provider connection, prompt, model route, duration, mode, public/reference constraints, first/end-frame requirements, and Kling multi-shot plan before an explicit generation request can leave the PC.
- Added persisted queued-video recovery. After a project opens, eligible saved Seedance and Kling jobs are checked again; completed MP4s return to that exact shot's output history, Media Library, and Delivery review. The project is marked dirty so the recovered media record is never silently lost.
- Added `npm run test:release`, a focused release smoke test for the native IPC bridge, video polling/recovery, Shot Director readiness UI, and operator documentation.
- Updated Field Guide and in-app help copy so it reflects the live Model Director, Seedance/Kling job system, recovery behavior, and delivery workflow.

Verification pending for this build:

- `npm run test:release`
- Windows packaged launch and interaction smoke

## v0.3.7 - Kling Omni video jobs

Delivered:

- Added the Kling 3.0 Omni route to the shared asynchronous video-job system: task submission, polling, local media import, project history, and delivery review.
- Added Kling-aware Director Controls for multi-shot plans, subject/first-frame/first-plus-end-frame images, image/video references, native sound direction, 3–15 second duration, 16:9 / 9:16 / 1:1 framing, prompt and negative constraints.
- Selected Media Library images are encoded locally for the request; public HTTPS image/video URLs remain available for cloud-hosted references. Local video references stay explicit rather than silently pretending an upload happened.
- A successful first submitted job marks the saved Kling credential verified; no speculative health endpoint is used.

## v0.3.6 - Launch and preset art pass

Delivered and verified on Windows:

- The compact launch splash is slightly larger, substantially more vivid, and keeps the supplied studio art readable without replacing the application window.
- Home visual-language presets now use complete 16:9 artwork cards instead of narrow cropped background fragments. The rail can scroll horizontally when the studio is narrower than the available presets.

Verification performed:

- `npm run check`

## v0.3.5 - Truthful provider connections

Delivered and verified on Windows:

- Model Hub now separates a locally encrypted saved key from a provider credential that has actually been checked.
- OpenAI and Google use non-generative credential checks. Other providers are never probed against guessed endpoints; their card explains that their first explicit render is the verification point.
- Connection health is stored separately from encrypted secrets and project files, so a `.storymaker` project never contains an API key or provider health record.

Verification performed:

- `npm run check`

## v0.3.4 - Delivery preflight

Delivered and verified on Windows:

- Delivery now reads the real per-shot record rather than presenting a generic handoff screen. Every planned shot declares whether it needs a prompt, is queued with a provider, failed, is ready for review, needs revision, or has been approved.
- Each preflight row returns directly to its Shot Director, opens the exact generated image or video for review, and can explicitly approve the output. Approved image outputs become the scene's staged storyboard reference; approved video outputs remain correctly marked for delivery without pretending they are still frames.
- The preflight summarizes approved outputs, active renders, and items needing attention alongside the local preview and production-package export. The project keeps this review state with its normal atomic save and recovery behavior.

Verification performed:

- `npm run check`

## v0.3.3 - Seedance queued video

Delivered and verified on Windows:

- Every shot has two working depths in one surface: Quick Create for model, aspect, and prompt; Director Controls for model-aware advanced settings.
- Seedance 2.0, Fast, and Mini can now submit a real queued video request, preserve the returned provider task ID/credit information in the shot, refresh provider status, and import the completed MP4 into project media.
- Seedance image-to-video and reference-to-video use public HTTPS image, video, and audio URLs entered in Director Controls. Local Media Library references remain saved with the shot but are not silently sent to an API that requires public URLs.
- GPT Image 1 and Gemini Nano Banana routes retain the per-shot provider/model/prompt/reference/output history workflow. The OpenAI route applies saved quality and reference-fidelity choices to the image request. Provider keys remain encrypted locally and never enter `.storymaker` files.

Verification performed:

- `npm run check`
- `npm run build:win`
- packaged Windows launch smoke with screenshot capture

## Next milestone

Complete release verification, then move to provider-by-provider authenticated task QA with user-provided keys and capability updates only where the real provider response proves a contract difference.
