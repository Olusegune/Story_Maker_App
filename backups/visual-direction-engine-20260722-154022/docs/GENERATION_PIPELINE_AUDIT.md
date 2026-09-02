# Storymaker generation pipeline audit

Audit date: 2026-07-18

## Executive finding

Storymaker is an Electron/Vite desktop application. It has real direct provider calls, but its generation pipeline is not production reliable yet. The primary blocker is architectural: jobs, generated media, and asset links are created in renderer memory and only become durable when the user manually saves the project. Video jobs are provider-backed but depend on manual polling and have no durable desktop-side job manager. The application contains provider-specific request code instead of a common validated provider contract.

## Runtime and boundaries

| Area | Current implementation | Audit result |
| --- | --- | --- |
| Desktop shell | Electron main process (`electron-main.js`) with a restricted preload bridge | Appropriate boundary, but too much workflow orchestration is in the renderer. |
| UI | Vite vanilla JavaScript (`src/storymaker.js`) | Functional, but currently owns job lifecycle and persistence decisions. |
| Persistence | User-selected `.storymaker` JSON project file; provider credentials and health as encrypted/local JSON under Electron user data | No database, migrations, queue, or automatic project checkpoint for generation results. |
| Assets | Local original paths plus generated files in `userData/generated-media` | Generated files are local and persisted by path, but not copied beside the project or integrity checked. Imported media is referenced in place. |
| Providers | Direct `fetch` adapters for OpenAI, Google, fal, WaveSpeed, Seedance/Kling-style video handling | Partial and provider-specific; model list can exceed proven adapter support. |
| Async work | Frontend/manual polling and a startup recovery scan for selected video providers | No durable cross-project job store, no backoff policy, cancellation, or webhook receiver. |
| Logging | Console errors and user-facing strings | No structured redacted event log or correlation ID. |

## Current generation trace

### Image generation

`Shot Director / Scene image UI` → renderer preflight → `preload.js` IPC → `electron-main.js` direct provider request → provider-specific polling/download where applicable → file written to `userData/generated-media` → renderer adds asset to `project.assets` and a shot history entry → user must save project.

Broken or fragile links:

1. A successful remote job can have an unrecognized result shape, producing a completed status without a locally linked asset.
2. There is no durable job record before a provider request begins; app restart during an image request loses the job state.
3. The renderer performs the final asset/project link; a crash after download but before manual save can orphan media.
4. Asset paths are absolute and imported references remain external files. Moving a project or source file can break a reference.
5. Some listed model IDs route through generic assumptions instead of a verified provider-specific contract.

### Video generation

`Shot Director` → renderer creates an in-project pending job → IPC submits provider task → renderer stores task id → user manually refreshes or startup recovery polls → main process downloads result → renderer attaches asset → user saves project.

Broken or fragile links:

1. Polling is user-triggered for many jobs and has no exponential backoff, deadline, cancellation, or durable worker.
2. No webhook server exists in a desktop app, so configured providers requiring callbacks cannot be supported by a callback URL.
3. Video output validation is only a download/write; it does not probe MIME, duration, dimensions, or playability.
4. A failed poll can become `check-failed` without a standardized retry policy or error category.

## Provider status and registry

| Provider | Current purpose | Verified adapter level | Risk |
| --- | --- | --- | --- |
| OpenAI | Director/story parsing, image generation | Direct Responses API adapter | Request model/tool compatibility must be constrained per model. |
| Google | Gemini image generation | Direct API adapter | Catalog/response validation needs a strict contract. |
| fal | Seedream image variants | Direct endpoint adapter | Only specific endpoints are implemented; generic catalog entries must not imply support. |
| WaveSpeed | GPT Image, Seedream, generic image/video gateway | Direct submit/poll adapter | Response shapes and model request schemas vary; generic routing is not sufficient proof of every model. |
| Seedance / Kling | Video jobs | Partial direct submit/poll paths | No durable worker, capabilities must be endpoint verified. |
| KIE / OpenRouter | Registry/configuration | No complete native generation adapter | Must be marked unavailable until an exact endpoint contract is implemented. |

## Security and environment findings

* API keys are stored with Electron `safeStorage` where available. They are not exposed to the renderer, which is correct.
* There is no environment-variable schema or startup validation. Provider configuration is entirely user-entered credentials.
* No callback URL, object-store credentials, database credentials, or queue-worker configuration exists because this is currently a local desktop architecture.
* Diagnostic data needs redaction and correlation IDs before it can safely report actionable provider errors.

## Incomplete, placeholder, and dead-path findings

* `src/main.js` is a legacy, unused renderer with placeholder workspace actions; `index.html` loads the newer Storymaker renderer.
* Several workspaces still render generic “being built” placeholders.
* Multiple UI/model catalog entries represent planned or generic capabilities without a dedicated adapter.
* Existing `catch {}` is used for safe cleanup and JSON fallbacks, but operational failures are not consistently logged.
* Existing project persistence is manual; no atomic auto-checkpoint exists for completed media/job transitions.

## Root causes of the reported missing-media issue

1. Provider result normalization accepted too narrow a set of result payload keys.
2. The renderer could display a completed job history entry without a corresponding `assetId` link.
3. The project could contain an asset that was not reconciled into the job history after an earlier generation.
4. The final rendering state depended on local UI state rather than a durable, normalized job record.

## Remediation plan

1. Add a provider-neutral normalized job and result contract plus request validation at the Electron main-process boundary.
2. Add a durable local job ledger, redacted diagnostic log, stale-job recovery, polling deadlines, retries, and cancellation where supported.
3. Make media persistence explicit: download, MIME/integrity checks, local asset metadata, project linking, and atomic project checkpoint.
4. Restrict the model registry to implemented capabilities and make unsupported combinations impossible to submit.
5. Repair the UI to expose real state, recovery, retry, media preview, and provider health instead of inferred completion.
6. Add contract, persistence, and guarded real-provider smoke tests, then rebuild installer and portable artifacts.

## Known architectural limitation

A local Electron application cannot host publicly reachable provider webhooks without an external service or tunnel. This remediation will use resilient polling and durable local recovery; a cloud webhook/queue service is a separate deployment decision, not something that can be truthfully simulated inside this desktop build.
