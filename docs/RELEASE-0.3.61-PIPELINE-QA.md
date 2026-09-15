# Storymaker 0.3.61 — connected delivery pipeline QA

## Outcome

The verified workflow now continues beyond generation:

`approved/generated image → generated video → shot approval → Timeline → audio cues → local production preview → production-package export → save/reopen`

## Repairs

- Approving a generated video in Delivery now places that shot output in the Timeline and establishes the scene motion master when the scene has one shot.
- A deliberate **Use as scene motion master** action records both the video asset and originating shot.
- Multi-shot scenes no longer collapse to the last generated video. Each shot retains its own selected output; an optional scene master remains explicit.
- Motion-master identity and source-frame provenance survive project serialization and recovery.
- Local preview rendering normalizes every provider clip and held storyboard still to 1920×1080, 24 fps, H.264 before concatenation.
- Timeline audio cues are trimmed, delayed, level-adjusted, mixed, padded with silence, and encoded as AAC.
- Short cues cannot truncate the picture edit, and late cues cannot extend it.
- Production-package shot lists now include `motion_master` and `source_frame` columns.

## Verification

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release contract: 188 checks passed.
- Electron syntax and Vite production build: passed.
- Executable delivery pipeline smoke: passed.
- Mixed still/video result: H.264 video plus AAC audio, expected duration retained.
- Real generated-media assembly: 1920×1080 H.264/AAC preview successfully produced from Storymaker outputs.
- Packaged UI screenshot: splash modal and blurred application background rendered correctly.

Run the media test with:

```powershell
npm run test:delivery-pipeline
```

## Observed provider state

Existing durable job history contains successful image/video completions through OpenAI, Google, fal, Kie, and WaveSpeed, including Kie Seedance, WaveSpeed Seedance/WAN, and fal Seedance. Current provider health records show fal, Kie, WaveSpeed, OpenAI, and Google verified. OpenRouter's saved key is rejected and should be replaced only if that optional fallback is needed.

## Remaining limitation

Storymaker can render a reliable reviewable production preview and export a structured package. It is not yet a nonlinear editor with frame-accurate trimming, keyframed transitions, or a full mastering/mixing surface.

