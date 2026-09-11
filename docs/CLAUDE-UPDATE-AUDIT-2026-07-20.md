# Storymaker update audit — 2026-07-20

## Scope and evidence

This review examined the current source at commit `ad9eedf` and the current
release artifacts in `dist-release`. The release is version `0.3.29`.

The automated release suite passed on 2026-07-20:

- ingestion smoke: 6 assertions
- release smoke: 51 assertions
- syntax and Vite production-build checks

These checks establish source/build integrity. They do **not** prove paid,
live provider rendering, installer behavior, or full Electron user workflows.

## Implemented and verified in source

| Requirement | Status | Evidence |
|---|---|---|
| Video routing through fal, Kie, and WaveSpeed | Implemented in source | Direct Seedance/Kling providers are retired. The active catalog and submit/poll paths route video through those three gateways. |
| Kie, fal, and WaveSpeed video model catalog | Implemented in source | The catalog includes Kie Kling/Seedance/Veo, fal Kling/Seedance, and many WaveSpeed video operations. |
| Delete unused references | Implemented | Media Library identifies every current asset usage, filters unused media, offers clean-up, and distinguishes generated-file deletion from detaching imported media. |
| Script improvement suggestions with accept/reject | Implemented | OpenAI/OpenRouter-backed suggestions are editable, individually accepted or rejected, and respect locked story fields. |
| Preserve-versus-improve import review | Partially implemented | Import review offers Preserve exactly and Improve with AI before committing the parsed material. |
| Image-to-video from an approved storyboard frame | Implemented | `Animate this frame` primes a compatible image-to-video shot with the approved frame attached. |
| Completed video visible in storyboard | Implemented in source | A scene selects a completed shot video before its still for storyboard preview; the asset is linked to the shot and persists in project assets. |
| Style DNA, recommendations, and drift checks | Substantially implemented | 28 style presets have Style DNA data; projects can capture/apply/delete DNA, request recommendations, and run image drift checks. |
| Windows icon plumbing | Implemented, new artwork not applied | Window, installer, shortcuts, and `.storymaker` association already use `assets/app-icon.ico`. |

## Important gaps and risks

### Generation reliability (production blocker)

1. **No live acceptance proof exists for the provider catalog.** The passed suite is static/source-oriented; it does not submit and persist a real image or video for each active gateway.
2. **The catalog can present a model as live before its exact endpoint/payload has been contract-tested.** This is especially risky for broad WaveSpeed model lists and provider model revisions.
3. **The provider interface remains adapter-specific rather than a fully normalized `GenerationProvider` contract.** Job behavior, capabilities, and result normalization are still distributed across Electron handlers.
4. **Model capability data is incomplete.** The main Shot Director initially renders a fixed four-ratio/four-resolution list and then applies generic capability rules. It does not consistently expose only the true per-model native resolutions, duration bounds, or multimodal/reference limits.
5. **No end-to-end paid smoke test was run during this audit**, so successful HTTP, media persistence, playback, project reopen, retry, and fallback remain unproven.

### Story import and production intelligence

1. PDF import relies on a locally installed `pdftotext`; when unavailable, it fails with guidance rather than working out of the box.
2. Scanned PDFs are explicitly unsupported: users must manually export a page to PNG/JPG. Image OCR is available through OpenAI or OpenRouter.
3. Legacy `.doc` is intentionally unsupported and asks the user to convert it.
4. Clipboard paste is not implemented.
5. The deterministic parser is a useful screenplay heuristic, but it only extracts a limited schema. It does not yet robustly extract the full requested production plan: blocking, camera/lens/movement, lighting logic, full audio/VFX, continuity, entrances/exits, and detailed performance plans.
6. Provenance is not field-level. The requested Documented / Inferred / Suggested / Locked classifications and story-version history are not yet a coherent data model.
7. AI story analysis is OpenAI-first with OpenRouter fallback, not yet a general provider-neutral orchestration layer.

### Storyboard/video usability

The technical path now exists: approve a still → **Animate this frame** → render a video → refresh the shot → video is stored on `shot.outputAssetId` and displayed in the storyboard. This corrects the previously missing connection.

However, users need a clearer explicit action after a video renders: **Use as scene motion master** (and optionally **Set storyboard poster frame**). Today the data link is correct but the terminology still makes it easy to believe a video must be "approved" like an image. The usability pass should also add a visible shot/take strip, comparison, replacement, and retry actions directly on the storyboard card.

### Style Library and product polish

1. The Style DNA foundation is present, but the requested streaming-library experience is incomplete: featured/recent/favorites/category shelves, richer cards, search, and custom Style DNA import/generation are not all present.
2. Automatic style enforcement is mainly prompt/context based; it is not yet a model-aware, structured enforcement package across every adapter.
3. Resolution recommendations, automatic upscaling, loading-progress splash behavior, and a full visual QA pass remain incomplete.
4. The supplied `storymakerFile icon.png` has not been converted into a multi-size `.ico` or substituted for the current icon.

## Recommended delivery sequence

1. **Make generation trustworthy:** create a provider-neutral registry with contract-checked capabilities; test each enabled fal/Kie/WaveSpeed image/video route with real keys behind an explicit paid-test flag; persist, play, reopen, retry, and record evidence.
2. **Finish the video workflow:** introduce explicit scene-video selection and storyboard take controls; validate delivery/export chooses the intended video.
3. **Build Import Engine v2:** add clipboard, bundled PDF extraction/OCR, DOC conversion guidance or conversion, rich parse schema, source provenance, versioned review/change plans, and a provider-neutral analysis layer.
4. **Finish Style Library v2:** premium shelves and rich cards, full Style DNA packages, model-aware style application, resolution tiers/upscaling, and polish/accessibility QA.
5. **Release hardening:** install the supplied icon, test a clean installer and portable build, regenerate both artifacts, and document exact verified workflows.

## Definition of completion for the next release

Do not call a provider/model live merely because it appears in a dropdown. A model becomes available only after its current vendor contract passes a low-cost live smoke test and Storymaker proves: job submission, status updates, controlled asset download, media playback, project save/reopen, storyboard linkage, and retry/error reporting.
