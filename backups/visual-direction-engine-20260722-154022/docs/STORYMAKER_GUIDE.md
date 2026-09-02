# Storymaker Field Guide

## Start a project

Choose **New Project** from the splash screen, Home, or `File > New Story`. Use **Open Project** or `File > Open Story` to continue a saved `.storymaker` project.

## Save safely

`Ctrl+S` saves the project. Storymaker writes project files atomically and creates a `.bak` recovery copy beside an existing project before replacing it. If a project file becomes unreadable, opening it will attempt to recover the last safe backup.

## Build the production context

1. Use **Story Bible** for a title, logline, and premise.
2. Use **Design Bible** to select the visual language. The library distinguishes supplied **Art Ready** cards from intentional **Art Pending** directions. See `VISUAL_PRESET_ASSET_MANIFEST.md` to add artwork without changing the interface.

Storymaker uses broad visual directions rather than public named imitation modes. Familiar references may help a director describe intent privately, but the working direction should resolve into editable traits such as materials, palette, proportion, camera, lighting, and pacing. Render-look profiles are art-direction controls, not claims of native third-party renderer support; see `PRODUCT_LANGUAGE.md`.
3. Use **Character Bible** to build the cast.
4. Use **Storyboard** to turn the context into a sequence of scenes.

## Work with project media

Open **Media Library** to import images, video, or audio. Images can be attached to a storyboard scene as an editable visual reference; choose **Edit scene & reference** from the board to replace or remove one later.

On the next save, Storymaker stages imported media in a folder beside the `.storymaker` file named after the project. This keeps the project record connected to its production references when you reopen it. Removing an item from the library removes its project link but does not delete the original file or the staged copy.

## Build continuity before production

Use **Character Bible** to make a production profile for every recurring person: role, appearance, wardrobe, voice, scene objective, and an optional project image reference. Open a scene from **Storyboard** to assign the cast who appear in that beat.

Open **Continuity** to run a private, local audit of the saved project record. It identifies missing story context, open character profiles, scenes without a selected visual, missing cast assignments, and scenes that do not yet have a shot plan. It does not call an AI model or send any project material.

## Plan shots

Open **Shots** and choose **Build starter plan** to create one editable shot for each storyboard scene. Adjust framing, lens, movement, duration, and the narrative purpose of every shot. The planner carries the approved storyboard frame with it when one exists. Add or remove shots freely; they are saved in the project file.

### Direct models shot by shot

Open **Shots** to enter the Shot Model Director. Every shot owns a saved production specification: selected provider/model, generation mode, prompt, negative constraints, aspect ratio, resolution, motion intent, references, a no-cost readiness check, and output history. **Quick Create** keeps the common choices small; **Director Controls** exposes model-specific duration, camera, sound, reference-role, multi-shot, and repeatability controls. A model marked **Live** has a native adapter; a model marked **In build** can be prepared and saved but never appears as a working render button.

Choose **Check readiness** before a render to validate the local provider key, prompt, duration, selected mode, and reference contract. This does not send media or create a provider job. It explains what must be corrected before an explicit generation request can leave the PC.

## Time the cut and build the cue sheet

Open **Timeline** to review the accumulating shot durations across scenes. Selecting a shot clip opens its Scene Visualization workspace; edit duration in **Shots** to adjust the planned pacing.

Open **Audio** to create local dialogue, music, ambience, and sound-effect cues from audio files imported in Media Library. Cues include a type, scene, start, duration, level, and note. They remain part of the `.storymaker` project and appear in the timeline.

## Export a production package

Open **Deliver** and select **Export production package**. Choose a destination folder. Storymaker creates a production-package folder containing a reopenable project with staged assets, `shot-list.csv`, `audio-cues.csv`, and `production-notes.md`. This export never deletes or alters the original media files.

### Render a local visual preview

When FFmpeg is available on the PC, Deliver also offers **Render local visual preview**. It creates a silent 1080p MP4 from each scene's approved (or attached) image reference and holds that frame for the planned shot duration. It is a truthful pacing and board-review preview, not a generative video render; it does not upload project material or alter original media.

## Connect providers

Open **Model Hub** to connect a provider. Provider keys are encrypted with Windows credential protection, remain on the local computer, and are never written into `.storymaker` project files.

OpenAI and Google have non-generative connection checks. OpenRouter uses its documented account-key check. Fal, Kie, and WaveSpeed are stored as secure, explicit gateway connections until their model-specific render routes are implemented and verified; Storymaker does not guess at a provider endpoint or claim that a saved key is a working render path.

### Run a live Director review

Connect an **OpenAI** key in Model Hub, then open **AI Director** and choose **Run live director review**. Storymaker sends the current creative record only after that explicit action. It saves the returned structured direction with the project, so the summary, decision notes, and suggested themes remain available when you reopen it. You can apply missing suggested themes to the Story Bible in one click.

If OpenAI is not connected, AI Director still offers private local suggestions based on the project record. Other provider connections remain available for their model-specific image or video routes; they do not silently become AI Director adapters.

### Visualize a storyboard scene

Open **Generate** in the production bar (or **Motion Graphics** in the sidebar) to use Scene Visualization. Choose a storyboard scene, shape the Director's Visual Brief, choose a frame, and select **Generate scene frame**.

When OpenAI is connected, Storymaker sends the scene brief and its compact Story and Design Bible context only after you select Generate. If the scene has an attached PNG, JPEG, WEBP, or GIF reference under 10 MB, it is included as a visual reference for that request. The returned frame becomes a project asset and is saved beside the project on the next save. Review a take and choose **Approve for storyboard** to make it the scene's reference image.

Scene Visualization currently uses the live OpenAI scene-frame adapter. The per-shot Model Director routes GPT Image 1, the configured Gemini Nano Banana image models, Seedance video jobs, and Kling 3.0 Omni video jobs through their own explicit controls.

### Video jobs and recovery

Seedance and Kling are asynchronous video providers. Storymaker saves their provider task IDs with the shot, and completed videos return to the project Media Library and Delivery review. When you reopen a project, Storymaker checks eligible queued jobs again if that provider key is saved on the PC. Save the project after a recovered result so its new media record is retained.

## Interface controls

- `Ctrl+N` creates a project.
- `Ctrl+O` opens a project.
- `Ctrl+S` saves a project.
- `Ctrl+,` opens Settings.
- The sidebar density control cycles full, compact, and icons-only navigation.
- Settings switches between dark and light studio modes.
