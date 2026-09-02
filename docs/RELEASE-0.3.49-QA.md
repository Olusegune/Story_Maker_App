# Storymaker 0.3.49 — Import, Multimodal, and Enrichment Recovery

## Root causes corrected

- The former enrichment path made a second, very large remote production parse before requesting any recommendations. OpenAI and Gemini could time out while trying to return a huge JSON document for a long screenplay.
- Imported video/audio was being correctly added to the project but the notification made it appear that import failed when the selected model did not accept those types.
- Start/end frame controls had no direct image-import action, forcing creators to leave the shot workflow.

## Repairs

- Uses the local import parser immediately, then requests compact Director, script-improvement, style, and shot-plan recommendations in parallel.
- Gemini is preferred for compact production-intelligence calls, with OpenAI and OpenRouter retained as fallback routes.
- Directly importing a start or end frame now adds the image to the project and selects it for exactly that role.
- General reference import remains separate from start/end assignment.
- Media import copy now states that unsupported types were imported to the project and identifies model compatibility as the next decision.

## QA

- Release checks cover local parsing, model-aware frame controls, and the Gemini fallback implementation.
- Manual test path: choose a compatible reference-to-video model, import image/video/audio from Shot Model Director, then select imported images in the explicit Start Frame and End Frame panels.
