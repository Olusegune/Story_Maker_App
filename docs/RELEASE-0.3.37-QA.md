# Storymaker 0.3.37 QA

## Fixed in this build

- Selecting an already-imported file in **Import reference media** no longer produces the misleading “No new media was imported” result. The Shot Director reopens with that project asset ready to attach.
- The Shot Director now makes the capability boundary explicit: Kie Seedance accepts image references only; users are directed to **fal → Seedance 2.0 Reference-to-Video** for image, video, and audio reference packs.
- Fal video jobs upload local reference files to Fal storage before queue submission. Seedance 2.0 and Kling therefore receive provider-accessible URLs instead of oversized local data URLs.
- Large Fal references use the provider’s multipart storage protocol (10 MB parts above 90 MB); source limits are 64 MB images, 250 MB audio, and 1 GB video.
- Duplicate queued-video monitor runs are suppressed, avoiding overlapping status polls and duplicate completion imports.

## Automated verification

Run from the repository root:

```powershell
npm run test:release
```

This verifies source syntax, the production Vite build, 78 release-contract assertions, the import/parser smoke suite, reference lifecycle controls, Fal storage staging, Seedance's 9/3/3 multimodal payload, render monitoring, and delivery upscaler bridges.

## Live-provider verification boundary

The packaged build preserves keys locally and deliberately never prints them. Two paid live Fal smoke requests were completed on 2026-07-21 using the encrypted local Fal credential. No API key or full provider URL was saved in the evidence.

1. **Seedance 2.0 Reference-to-Video** accepted one project image plus one project MP4 at 21:9 and 480p, then returned a 4.04-second 992x432 H.264 MP4. The saved evidence is `%APPDATA%\\wheelbarrow-studios-story-maker\\fal-multimodal-live-smoke.json`.
2. **Kling V3 Image-to-Video** accepted a character start frame plus a matching project-video element, then returned a 5.04-second 1176x784 H.264 MP4. The saved evidence is `%APPDATA%\\wheelbarrow-studios-story-maker\\fal-kling-v3-live-smoke.json`.
3. In the app, choose **fal** and the matching model, attach media in the model-input tray, then press **Check readiness** and **Generate video**. Confirm the render overlay advances and the completion notification appears.

External audio references are intentionally shown only for models whose provider schema accepts them. Fal Seedance Reference-to-Video accepts up to three audio files; the validated Kling V3 route supplies native generated audio but does not advertise unsupported external audio input.

## Live upscale evidence

Fal Topaz image upscale was also completed through the same Fal-storage staging approach used by the desktop delivery control. A 2x request downloaded and persisted a PNG at 2752x1536. Redacted evidence is stored locally at `%APPDATA%\\wheelbarrow-studios-story-maker\\fal-topaz-live-smoke.json`.

## Distribution note

The installer and portable executable are version-stamped `0.3.37`. They are not Authenticode-signed because no Windows code-signing certificate is configured in this build environment; Windows may show its standard unsigned-app warning until a certificate is supplied and the artifacts are rebuilt.
