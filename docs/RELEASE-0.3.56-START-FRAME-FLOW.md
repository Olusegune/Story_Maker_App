# Storymaker 0.3.56 — Start Frame Workflow Repair

## Fixed

- **Generate video from frame** now makes the chosen storyboard frame the explicit Image-to-Video Start Frame.
- The Shot Director now offers **Use approved storyboard frame as Start Frame** whenever the scene has an approved/generated image.
- General references remain separate guidance: importing or checking a reference image never silently assigns it as a start/end frame.

## Expected workflow

1. Generate and approve a storyboard image.
2. Click **Generate video from frame** on that scene, or use the explicit Start Frame shortcut in Shot Director.
3. Optionally add general visual references, an end frame, video references, or audio only when the selected model supports them.
4. Generate video.
