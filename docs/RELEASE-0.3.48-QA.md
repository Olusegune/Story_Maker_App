# Storymaker 0.3.48 — Gemini Fallback and Frame Controls

## Production-intelligence fallback

- Gemini is now used after an OpenAI failure and before OpenRouter for story analysis.
- Gemini also backs script improvements, live Director review, and shot planning when OpenAI is unavailable.
- All providers use a provider-native JSON request and normalized parsers; no provider payload reaches the UI.
- Provider failures are logged locally without keys or source text.

## Start and end frames

- Start/end frame controls remain separate from ordinary image references.
- They appear only for video models whose capability record explicitly supports them.
- Kie Seedance 2.0 now exposes explicit start and end image selectors and sends those selected frame URLs as first/last frame inputs.
- WaveSpeed preserves the explicit selected-frame order. A normal image-to-video endpoint never receives a general reference as an implicit start/end frame.

## Verification

`npm run test:release` must pass before packaging. The build produces NSIS installer and portable Windows artifacts.
