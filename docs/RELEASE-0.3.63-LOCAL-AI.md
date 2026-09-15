# Storymaker 0.3.63 — Local AI Release

## Outcome

Storymaker now has a verified hybrid execution path. The existing provider-neutral
job, asset, take, storyboard, timeline, and delivery pipeline can use either cloud
providers or private engines running on the workstation.

## Local engines verified

- Ollama with `qwen3:8b` for structured story analysis, recommendations, and AI
  Director fallback.
- ComfyUI with FLUX.1 Schnell FP8 for text-to-image generation.
- ComfyUI with Wan 2.1 Fun InP 1.3B for image-to-video generation.
- Explicit start-frame selection is required for local image-to-video.
- End frames remain optional and independent from general reference images.

## Runtime behavior

- Storymaker probes loopback services only.
- Ollama is detected at `127.0.0.1:11434`.
- ComfyUI Desktop is detected at `127.0.0.1:8000`; portable ComfyUI is also
  supported at `127.0.0.1:8188`.
- Model readiness is checked per capability. A running ComfyUI process is not
  presented as image- or video-ready unless the required files and nodes exist.
- Generated images and videos are copied into Storymaker project storage and use
  the same asset records as cloud outputs.

## Real acceptance results

- Structured Ollama JSON: passed.
- FLUX text-to-image: passed and visually inspected.
- Wan image-to-video from the exact approved source frame: passed.
- Video integrity: H.264 MP4, 480 × 272, 16 fps, 2.0625 seconds.
- Delivery pipeline smoke test: passed.

Evidence:

- `qa-artifacts/local-flux-smoke.png`
- `qa-artifacts/local-wan-i2v-smoke.mp4`
- `qa-artifacts/local-wan-i2v-mid.png`

## Hardware validated

- NVIDIA GeForce RTX 4070 SUPER
- 12 GB VRAM
- 32 GB system memory

The local video workflow intentionally uses draft-sized frames and conservative
sampling. Cloud providers remain the recommended route for long, high-resolution
final video.

## Installation boundary

The Windows installer does not bundle Ollama, ComfyUI, or approximately 11 GB of
model weights. Model installation remains explicit and user-controlled. Storymaker
detects installed runtimes and explains exactly which capabilities are ready.

## Known limitations

- Automatic cost/quality routing between local and cloud engines is not yet a
  scored policy engine; users can select the desired provider explicitly.
- Local OCR, transcription, local audio generation, frame interpolation, and
  local upscaling are future capability modules.
- Cloud-provider live requests were not re-spent during this local-AI release.
  Existing cloud adapters remain covered by static and pipeline regression tests.

## Windows artifacts

- Installer: `dist-release/Wheelbarrow Studios Story Maker Setup 0.3.63.exe`
  - SHA-256: `3AB9106A171EFC65BB7B0A6787CD39F8B7B53D7CF7B06CA454D18A36DEF92059`
- Portable: `dist-release/Wheelbarrow Studios Story Maker 0.3.63.exe`
  - SHA-256: `D029EC48BCEC20E90E167B611CC4A9F4D02AEEF33E343253A5526ABD10DD951A`

Both artifacts report product version `0.3.63`. The exact portable executable was
launched after packaging; its splash, production desk, and Model Hub were visually
verified. Model Hub correctly reported Ollama, FLUX image, and Wan video as ready.

## Final regression report

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release smoke: 209 checks passed.
- Vite production build: passed.
- Local runtime structured-output and capability checks: passed.
- Real local Wan image-to-video render: passed.
- Delivery persistence pipeline: passed.
