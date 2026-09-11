# Claude Code Handover — Storymaker 0.3.63

## Source of truth

Codebase:

`C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`

Release output:

`C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker\dist-release`

Final packages:

- `Wheelbarrow Studios Story Maker Setup 0.3.63.exe`
- `Wheelbarrow Studios Story Maker 0.3.63.exe`

Do not work from an extracted installer or an older `dist-release` bundle. The
repository above is the current editable source.

## What 0.3.63 adds

- Real Ollama structured-output fallback for story analysis, editable
  recommendations, and AI Director review.
- Real ComfyUI FLUX.1 Schnell text-to-image generation.
- Real ComfyUI Wan 2.1 Fun InP image-to-video generation.
- Native ComfyUI `CreateVideo` and `SaveVideo` MP4/H.264 output.
- Deliberate start-frame and optional end-frame handling.
- Per-model local readiness checks in Model Hub and Shot Director.
- Model Hub GPU, FLUX-ready, and Wan-ready indicators.
- Local runtime and live image/video smoke tests.

## Important implementation locations

- Desktop process, provider adapters, persistence:
  `electron-main.js`
- Renderer and Shot Director:
  `src/storymaker.js`
- Local runtime IPC:
  `preload.js`
- Local runtime smoke:
  `scripts/local-runtime-smoke.mjs`
- Live FLUX smoke:
  `scripts/comfy-image-live-smoke.mjs`
- Live Wan smoke:
  `scripts/comfy-video-live-smoke.mjs`
- Release assertions:
  `scripts/release-smoke.mjs`

## Installed local dependencies on this workstation

- Ollama: `http://127.0.0.1:11434`
- Ollama model: `qwen3:8b`
- ComfyUI Desktop: `http://127.0.0.1:8000`
- FLUX checkpoint:
  `C:\Users\eduni\Documents\ComfyUI\models\checkpoints\flux1-schnell-fp8.safetensors`
- Wan diffusion model:
  `C:\Users\eduni\Documents\ComfyUI\models\diffusion_models\wan2.1_fun_inp_1.3B_bf16.safetensors`
- Wan text encoder:
  `C:\Users\eduni\Documents\ComfyUI\models\text_encoders\umt5_xxl_fp8_e4m3fn_scaled.safetensors`
- Wan VAE:
  `C:\Users\eduni\Documents\ComfyUI\models\vae\wan_2.1_vae.safetensors`
- CLIP Vision:
  `C:\Users\eduni\Documents\ComfyUI\models\clip_vision\clip_vision_h.safetensors`

## Verified evidence

- `qa-artifacts/local-flux-smoke.png`
- `qa-artifacts/local-wan-i2v-smoke.mp4`
- `qa-artifacts/local-wan-i2v-mid.png`

The verified video is H.264 MP4, 480 × 272, 16 fps, and 2.0625 seconds.

## Commands

```powershell
npm run test:local-runtime
npm run test:local-image-live
npm run test:local-video-live
npm run test:release
npm run test:delivery-pipeline
npm run build:win
```

## Next recommended work

1. Add a user preference for Automatic / Local only / Cloud only routing.
2. Add an installed-Ollama-model selector.
3. Add local upscaling and frame interpolation as separate capability modules.
4. Add whisper.cpp for local transcription and subtitle timing.
5. Add durable recovery for interrupted ComfyUI jobs across app restarts.

Preserve the provider-neutral asset contract. Local outputs must continue to flow
through the same project asset, take, storyboard, timeline, and delivery records as
cloud outputs.
