# Storymaker 0.3.64 — Style System and Getting Started

## Custom Style DNA completion

- Added a real My Styles management screen.
- Added All, My Styles, and Favorites library views.
- Added project and personal-library location labels.
- Added open, edit/version, export, duplicate, and remove workflows.
- Removing an active project Style DNA now clears project, scene, shot,
  favorites, recent-use, and preview bindings safely.
- Added local or cloud image-to-video motion preview generation from an approved
  Style DNA image preview.
- Motion previews preserve Style DNA metadata and the exact source-frame asset.
- Existing project, scene, and shot inheritance remains non-destructive.

## Help and onboarding

- Replaced the compact field guide with a six-chapter in-app setup center.
- Added clear Setup-versus-Portable installation instructions.
- Added provider-neutral cloud API connection and verification instructions.
- Added Ollama installation, model, port, and refresh guidance.
- Added ComfyUI Desktop/portable ports and FLUX/Wan model-folder guidance.
- Added a first image-to-video production walkthrough.
- Added custom-style creation and reuse instructions.
- Added troubleshooting for provider keys, ComfyUI readiness, start frames,
  reference limits, missing outputs, and local-video performance.
- Added live status badges for cloud providers, Ollama, FLUX, and Wan.
- Packaged the complete Markdown field guide with the application.

## Safety and product behavior

- Help never displays or requests saved credential values.
- Local and cloud engine instructions remain clearly separated.
- General references remain independent from video Start and End Frames.
- Style DNA controls rendering language without replacing production identities.

## Regression gates

- Visual Direction domain smoke.
- Style lifecycle release assertions.
- Ingestion and generation pipeline regression.
- Vite production build.
- Packaged Windows UI review.
