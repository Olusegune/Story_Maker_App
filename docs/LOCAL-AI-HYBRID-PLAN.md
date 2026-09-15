# Storymaker Local AI and Hybrid Rendering Plan

## Status — implemented and live-tested in 0.3.63

The first production slice is complete:

- Ollama structured story intelligence is live.
- FLUX.1 Schnell local image generation is live.
- Wan 2.1 Fun InP local image-to-video is live.
- Both local media paths persist through Storymaker's normal asset pipeline.
- Model Hub reports image and video readiness separately.

The remaining stages below are roadmap items, not descriptions of the current
release.

## Product recommendation

Storymaker should use one provider-neutral production pipeline with three routing choices:

1. **Automatic** — choose a healthy local engine when it meets the shot requirements, otherwise use a connected cloud provider.
2. **Local** — keep the request and assets on the workstation; never fall back to cloud without approval.
3. **Cloud** — use fal, Kie, WaveSpeed, Google, OpenAI, or OpenRouter explicitly.

Local and cloud outputs must create the same Storymaker job, asset, project link, take history, storyboard state, timeline state, and delivery record.

## Work completed in the current source

- Added localhost-only detection for Ollama at `127.0.0.1:11434`.
- Added localhost-only detection for ComfyUI at `127.0.0.1:8188`.
- Added a Model Hub section that clearly separates on-device runtimes from API-key connections.
- Added Ollama structured-JSON completion support.
- Added Ollama fallback for:
  - story analysis;
  - editable story-improvement recommendations;
  - AI Director review.
- Kept installation and model downloads opt-in.
- Added and live-tested ComfyUI image and video adapters.
- Added explicit start-frame and optional end-frame controls for local Wan video.
- Added native MP4/H.264 persistence through ComfyUI `CreateVideo` and `SaveVideo`.

## Recommended local stack

### Story intelligence

Use Ollama first because its local HTTP API supports chat and structured JSON. Storymaker should expose the installed models discovered from `/api/tags`, allow a preferred model to be chosen, and validate a small schema response before calling it ready.

### Images and video

Use ComfyUI as the local media execution layer. It already represents image, video, and audio work as asynchronous workflow graphs and exposes queue/history/output APIs. Storymaker should ship tested workflow templates, not arbitrary community graphs.

Initial templates:

- text-to-image;
- reference-image / image-to-image;
- character reference sheet;
- image-to-video with an explicit start frame;
- text-to-video draft;
- upscaling.

Every workflow needs a manifest declaring inputs, model dependencies, minimum VRAM, output type, and supported controls.

### Audio and transcription

Add whisper.cpp for offline transcription, subtitle timing, dialogue extraction, and searchable source audio. Keep generated music and voice work behind separately licensed, clearly identified local models or connected providers.

## Hardware profile observed on this workstation

- NVIDIA GeForce RTX 4070 SUPER
- 12 GB VRAM
- 32 GB system memory

Recommended operating envelope:

- Local story analysis: strong fit.
- Local transcription: strong fit.
- Local image generation/editing: strong fit.
- Local video drafts: feasible with optimized/offloaded workflows.
- Long, high-resolution final video: prefer cloud unless the user explicitly accepts slower local renders.

## Next implementation stages

### Stage 1 — finish local text controls

- Add Local / Automatic / Cloud routing in Model Hub.
- Let the user select the preferred installed Ollama model.
- Add capability and schema checks per model.
- Add local OCR through a vision-capable model where available.
- Add token/time estimates and cancellation.

### Stage 2 — ComfyUI adapter

- Discover installed nodes and model folders.
- Import signed Storymaker workflow templates.
- Normalize queue states to Storymaker generation jobs.
- Upload explicit reference assets into ComfyUI input storage.
- Retrieve outputs, copy them into Storymaker storage, and persist normal asset records.
- Support cancellation, stale-job recovery, and restart recovery.

### Stage 3 — tested local workflows

- Text-to-image.
- Multi-reference image generation.
- Character and set design.
- Image-to-video using the approved storyboard image as the explicit start frame.
- Draft text-to-video.
- Upscale and frame interpolation.

### Stage 4 — automatic routing

Score candidate engines using:

- capability match;
- local runtime health;
- available VRAM;
- estimated time;
- estimated cloud cost;
- privacy preference;
- requested quality;
- prior failure history.

Automatic routing must explain its choice and must never silently send a Local-only job to the cloud.

## Release gate

Do not label ComfyUI generation “Live” until one image and one video workflow have:

- completed through the desktop UI;
- produced visible/playable media;
- persisted into a saved project;
- reopened successfully;
- linked to the correct shot;
- appeared in Storyboard and Timeline;
- survived app restart;
- exported through Delivery.
