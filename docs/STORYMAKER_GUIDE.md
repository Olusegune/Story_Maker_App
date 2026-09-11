# Storymaker Setup and Field Guide

This guide takes a new user from installation through a saved image-and-video
shot. The same guide is available inside Storymaker from **Help > Story Maker
Guide** or by pressing **F1**.

![Storymaker splash screen](screenshots/splash.png)

## 1. Install Storymaker

Storymaker is supplied in two Windows packages:

- **Setup** installs the application and creates normal Windows shortcuts.
- **Portable** runs without installation and can be placed in any writable
  production folder.

Before installing a newer release, save your projects and close every running
Storymaker window. Run the Setup file and follow the Windows prompts. Installing
a new release does not intentionally remove `.storymaker` project files.

For the portable build, place the EXE in a folder where your Windows account can
write files. Do not run it directly from a compressed archive.

### First-launch check

1. Open Storymaker.
2. Close the splash screen.
3. Create a small test project.
4. Save it as a `.storymaker` file.
5. Close and reopen the project before beginning a large production.

## 2. Understand the two workspace modes

**Simple Mode** provides one guided path:

```text
Story → Look → Board → Make → Deliver
```

**Studio Mode** exposes the complete production system, including characters,
sets, props, continuity, per-shot models, camera, lighting, performance, motion,
references, audio, timeline, and delivery controls.

Both modes use the same project data. Switching modes does not create a second
project or remove advanced decisions.

![The production desk home screen](screenshots/home.png)

### Language

**Settings → Appearance → Language** switches the interface language.
Storymaker ships with **Spanish, French, and German** alongside English,
detected automatically from your system language on first launch and
overridable at any time — the choice is remembered per device.

Translated today: navigation (sidebar and top bar), Home, Settings, **Audio
Studio end to end** (the Song Map, Direct with AI, the section editor, and
the per-section performance & choreography panel), the scene production
modal, and **Delivery** (including the Music Video delivery panel). Every
other screen still shows in English — the app never breaks or shows a raw
key if a translation is missing; it falls back to English for that one
piece of text while the rest of the page stays in your chosen language.
More screens are translated incrementally in later releases.

## 3. Connect cloud AI providers

Open **Model Hub** from the left sidebar.

Storymaker supports configured models through:

- OpenAI
- Google Gemini
- fal
- Kie
- WaveSpeed
- OpenRouter

### Connection procedure

1. Create an API key in the provider's official dashboard.
2. Confirm the account has access or credits for the model you intend to use.
3. Find the provider under **Cloud connections** in Model Hub.
4. Paste the key and choose **Save key**.
5. Choose **Check connection**.
6. Do not begin a paid render until the provider reports **Verified**.

![Model Hub, showing connected providers and the shot model catalog](screenshots/model-hub.png)

Keys are protected with Windows credential encryption. They are not written into
`.storymaker` project files or exported production packages.

Never paste API keys into prompts, project notes, screenshots, or support
messages.

### Provider roles

| Provider | Typical Storymaker use |
| --- | --- |
| OpenAI | Story intelligence and image generation |
| Google Gemini | Story fallback and Nano Banana image models |
| fal | Image, editing, Kling, Seedance, reference and multimodal video |
| Kie | Image/video gateway models such as Kling, Veo, and Seedance |
| WaveSpeed | Image/video gateway models such as Wan and Seedance |
| OpenRouter | Optional language-model routing |

Model capabilities change over time. Storymaker's selected model controls are the
authoritative description of what the installed release will submit.

## 4. Set up local AI

Cloud providers are optional. Storymaker can use Ollama for story intelligence
and ComfyUI for local image and video generation.

### Ollama

1. Install Ollama for Windows from the official Ollama website.
2. Start Ollama.
3. Install a capable instruct model. Storymaker 0.3.64 was verified with
   `qwen3:8b`.
4. Keep Ollama available at `http://127.0.0.1:11434`.
5. Open Storymaker's Model Hub and choose **Refresh local engines**.

When ready, Model Hub lists the installed model and marks Ollama **Ready**.
Storymaker can use it for structured story analysis, recommendations, and AI
Director fallback.

### ComfyUI

There are two ways to use ComfyUI with Storymaker.

#### Managed (recommended for local video)

1. Install ComfyUI Desktop for Windows once, or unzip a portable ComfyUI.
   You do **not** need to open it or keep it running.
2. Open **Model Hub → Managed Local Video Engine**.
3. Pick **LTX-Video 2B** or **Wan 2.1 Fun InP 1.3B** and choose
   **Download**. Storymaker fetches the exact weight set from Hugging Face
   into a folder it owns (shared with any ComfyUI models you already have)
   and verifies each file.
4. That's it. When a shot uses a local model, Storymaker starts a headless
   ComfyUI server itself on a private port, runs the shot, and stops the
   server when it has been idle for a while. No ComfyUI window ever opens.

Nothing downloads or starts without you choosing it in Model Hub.

#### Manual

1. Install ComfyUI Desktop and keep it running at `http://127.0.0.1:8000`
   (portable ComfyUI is supported at `http://127.0.0.1:8188`).
2. Install the required models into the correct ComfyUI model folders
   (listed below).
3. Restart ComfyUI after adding model files.
4. Open Model Hub and choose **Refresh local engines**.

#### Local FLUX image model

Place:

```text
flux1-schnell-fp8.safetensors
```

in:

```text
ComfyUI/models/checkpoints
```

#### Local Wan video models

The verified Wan 2.1 Fun InP workflow requires:

- Wan 2.1 Fun InP 1.3B diffusion model
- UMT5 XXL text encoder
- Wan 2.1 VAE
- CLIP Vision H

Place each file in its corresponding ComfyUI folder:

```text
ComfyUI/models/diffusion_models
ComfyUI/models/text_encoders
ComfyUI/models/vae
ComfyUI/models/clip_vision
```

#### Local LTX-Video model

An alternative local image-to-video engine — generally faster than Wan on the
same hardware, at a different quality/motion tradeoff. Requires the
[ComfyUI-LTXVideo](https://github.com/Lightricks/ComfyUI-LTXVideo) custom
node pack in addition to the model files below.

The verified LTX-Video 2B 0.9.8 Distilled workflow requires:

- LTX-Video 2B 0.9.8 Distilled checkpoint
- T5 XXL text encoder

Place:

```text
ltxv-2b-0.9.8-distilled-fp8.safetensors
```

in `ComfyUI/models/checkpoints`, and:

```text
t5xxl_fp8_e4m3fn.safetensors
```

in `ComfyUI/models/text_encoders`.

Model Hub reports **FLUX Image Ready**, **Wan Video Ready**, and **LTX Video
Ready** separately. ComfyUI merely running does not mean every local
capability is installed.

Local video was validated on an NVIDIA RTX 4070 SUPER with 12 GB VRAM. Lower
memory systems may require smaller workflows. Long, high-resolution final videos
will generally be faster through a cloud provider. Local generation targets
NVIDIA GPUs specifically — AMD, Apple Silicon, and CPU-only systems are not
a verified configuration for either local video engine.

## 5. Import and improve a story

![The Story Bible screen, ready to import a source](screenshots/story.png)

Import a supported story, script, treatment, outline, PDF, document, text file,
Fountain/FDX source, image scan, or clipboard text.

### Formatting your story

You do not need Final Draft or any particular software. The offline parser
reads best when a few plain-text conventions are present:

- Scene headings begin with `INT.` or `EXT.`, then a location, then `- DAY`
  or `- NIGHT` (for example `INT. LIGHTHOUSE - KEEPER'S QUARTERS - NIGHT`).
- A speaking character's name is in CAPITALS on its own line, with their
  dialogue on the line directly below it.
- A blank line separates every heading, name, and paragraph.
- Each short action paragraph becomes one shot, so keep paragraphs to a
  single idea.

If none of that formatting is present — a treatment, a numbered outline, or
plain prose — the import still works: choose **Improve with AI** on the
review screen and it builds a full scene breakdown from any format. The
conventions above only matter for the offline parser.

The in-app guide's **Format a story** chapter contains a known-good sample
script you can load straight into the paste box, plus a blank skeleton to
fill in. Nothing is committed to the project until you review what was
detected.

Storymaker first shows what it understood. You can:

- preserve the source exactly and build the production structure; or
- request AI improvements and review each proposed change.

Accepting or rejecting one recommendation does not remove the remaining
recommendations. The original imported source remains preserved.

![The import review, showing what Storymaker understood before anything is committed](screenshots/import-review.png)

Save the project after accepting changes and after building the storyboard.

### Music videos

For a music video, start from the song instead of a script.

1. **Home → Music video**, or **Audio Studio → Direct as music video**.
   Pick an audio file (MP3, WAV, M4A, OGG, FLAC).
2. Storymaker analyzes the track locally — no API key, nothing uploaded —
   for tempo, the beat grid, and an automatic section breakdown
   (Intro / Verse / Chorus / Bridge / Outro), and shows what it heard.
3. Optionally choose a **feeling** (Performance-first, Story, Movement,
   Visual world, Cinematic, Afrobeats). It changes the per-section
   creative briefs, never the timing.
4. **Direct the storyboard.** The project is rebuilt as **one scene per
   section**, each timed to that section's exact length, with a starter
   brief from its energy and the feeling. The song is placed as a
   full-length music cue at zero.

From there it is an ordinary Storymaker project: generate a frame or a
video take per section scene, review, and assemble. The rough cut, the
FCPXML export, and Send to Resolve are all timed to the song, section by
section — the shot **Duration** field is bypassed while a song is
attached.

- **Lyrics** (Audio Studio → Song Map panel): paste them one line per
  line and Storymaker spreads them across the sections and into each
  scene's brief. They also appear as ticks along the Timeline audio lane,
  and drive the timed lyric-caption export below.
- **Re-analyze / replace song** rebuilds the section list; any creative
  notes on sections that still overlap are carried across.
- A section can run longer than the 99-second cap that applies to
  ordinary shot durations — song timing is not clamped.

#### Direct with AI

**Audio Studio → Direct with AI** (or the same callout on the Storyboard,
once a song is attached) sends the song's structure, your treatment, cast,
and feeling to an AI director and writes a concrete, shootable brief back
onto every section: a shot, camera plan, blocking, performance direction,
movement, wardrobe, and a suggested lead performer — plus an overall
logline, energy arc, and visual approach for the whole video. Choruses are
directed to share visual motifs so they rhyme with each other; energy
tracks the section's own loudness and builds across the cut.

Uses whichever provider is connected, in order: Gemini → OpenAI →
OpenRouter → a local Ollama model — so it works with zero API key if
Ollama is running locally. Re-running it rewrites every section's brief
(generated frames and takes are untouched); anything you've hand-edited in
the section editor or the performance panel below is preserved across a
re-direct, not overwritten.

#### Fixing the section breakdown

The detector is a heuristic — a long, evenly-produced song can merge its
first minute or two into one "Intro". **Audio Studio → Edit sections**
opens a per-section editor: rename a section, re-type its kind, **split**
it at a typed timestamp, **merge** it into the next, or nudge a boundary —
every edit snaps to the nearest bar. Scenes, timing, lyrics, and any AI
direction on the sections that survive an edit follow along; a split adds
one new scene, a merge removes one, nothing else is rebuilt.

#### Performance & choreography

Open any section scene's **Edit scene, cast & references** to assign who
performs it: a **lead**, any number of **backup/band** performers, and any
number of **dancers/ensemble** — picked from the Character Bible — plus a
free-text **choreography/movement** note you can hand-edit (it starts from
the AI director's movement suggestion, if you ran one, but your own edit
always wins). Every performer assigned this way has their Character Bible
likeness reference attached to that section's generation automatically —
not just the lead — so a dance break with three cast members on screen
keeps all three recognizable.

## 6. Create production assets

Reusable identities live in three dedicated workspaces in the left navigation:

- **Characters** — people, via **Character Lab**
- **Locations** — recurring places, via **Environment Lab**
- **Props & accessories** — wardrobe, vehicles, creatures, weapons, and any
  other reusable object, via **Asset Lab**

Each workspace works the same way: add an entry, open its Lab to generate or
import a reference image, and approve the result. The approved image becomes
a project asset with its own continuity profile.

To connect an asset to the story, choose **Assign to scenes** on its card (or
assign it from inside a scene's own edit view in Storyboard). Once assigned,
that asset's approved reference is automatically offered to compatible image
and video renders for every shot in that scene — this is how a character's
face, a location's look, or a prop's design stays consistent from shot to
shot without re-attaching it every time.

General references guide appearance and continuity. They do not automatically
become video Start or End Frames.

## 7. Choose or create a Style DNA

![The Style Library, showing foundation looks ready to apply](screenshots/style-library.png)

Open **Style** to browse the built-in library — genre and mood foundations
(Cyberpunk, Film Noir, Dark Fantasy, and similar) alongside a dedicated set
of 2D animation presets (Sunlit Graphic Storybook, Cut-Paper Theatre,
Ink-and-Wash Legend, and others), filterable with the **2D Animation** chip
above the grid. Choose **Apply** on any preset to make it the project's
visual language — no custom authoring required.

A locked style reaches every generation surface, not just the storyboard:
Character Lab, Environment Lab, and Asset Lab all resolve the current
project (or scene/shot override) Style DNA and fold its material, lighting,
and character/environment/prop-specific language into what they send the
model, so a character generated after locking a style already renders in
that style.

To build your own instead of using a preset, choose **Create style**.

1. Name the style.
2. Describe materials, shapes, palette, lighting, camera, character feeling,
   motion, and anything that must be avoided.
3. Optionally add image references.
4. Assign each reference a role, strength, what to extract, and what to ignore.
5. Save an editable draft, or choose **Interpret with AI**.
6. Review the structured interpretation before accepting it.
7. Generate character, environment, prop, and storyboard previews.
8. Generate a motion preview from an approved style frame.
9. Apply the Style DNA at project, scene, or shot level.

Editing a custom style creates a new version. Earlier versions remain restorable.
Use **Manage My Styles** to rename, duplicate, export, or remove custom styles.
Save a style to **My Styles** to reuse it across projects, or export a
`.storymaker-style` package.

Style DNA controls the rendering language. It does not replace approved
characters, sets, props, or wardrobe identities.

## 8. Generate a storyboard image

![The Storyboard, showing every scene with its locked visual direction](screenshots/storyboard.png)

1. Open Storyboard.
2. Choose **Generate with AI model** on a scene.
3. Select an image provider and model.
4. Choose aspect ratio and resolution supported by that model.
5. Attach only the production assets needed for the shot.
6. Open Director Controls for camera, lighting, acting, blocking, audio, motion,
   continuity, and negative constraints.
7. Choose **Check readiness**.
8. Generate the image.
9. Review the output and approve the desired take for the storyboard.
10. Save the project.

![The Shot Model Director, with Director Controls open for camera, lighting, performance, and continuity](screenshots/shot-director.png)

## 9. Animate the exact storyboard frame

Choose **Animate this exact image** from an approved image, or explicitly select
that image in the shot's Start Frame control.

For image-to-video:

- the Start Frame defines the opening composition;
- the End Frame is optional and only appears for compatible models;
- general references remain separate guidance;
- models with a one-image limit receive only the deliberately selected source
  frame;
- multimodal controls appear only for compatible models.

Run readiness before submitting the job. Completed videos return to Output
History, Media Library, Storyboard, Timeline, and Delivery.

## 10. Save, recover, and deliver

`Ctrl+S` saves the project. Storymaker uses atomic writes and maintains a recovery
copy when replacing an existing project.

Queued generation jobs retain their provider task IDs. On project reopen,
Storymaker checks eligible jobs and can recover completed assets.

Delivery can export:

- a reopenable project;
- staged production assets;
- shot and audio cue lists;
- production notes;
- local visual previews when FFmpeg is available.

### Getting the cut into an editor

The Delivery page offers three ways to get the assembled film into a real
editing timeline, all built from the same shot order and planned still
durations — they never disagree about what the film actually is:

- **Assemble rough cut** — renders a real local 1080p MP4 (needs FFmpeg).
  Good for a quick screening; not an editable timeline.
- **Export edit (FCPXML)** — writes a `.fcpxml` file any NLE (DaVinci
  Resolve, Premiere, Avid) can open directly as a real, editable timeline.
  No live connection needed — Resolve doesn't even have to be running.
  This is the most portable option and the only one that works with
  Premiere or Avid.
- **Send to Resolve** (per-shot, on each shot's row) and **Send entire
  edit to Resolve** (the whole approved film at once, in order) — push
  straight into a running DaVinci Resolve Studio session: creates or
  reuses a bin named after the project, imports each shot's output, and
  appends it to the currently open timeline. A still holds for its
  planned duration, exactly as it would in the FCPXML export or the local
  rough cut; a real video clip always plays its own actual length.
  Sending the same shot again reuses what's already in the bin instead of
  importing a duplicate. Requires:
  - **DaVinci Resolve Studio** running, specifically — the free edition
    does not expose the scripting API this feature uses;
  - a project genuinely open in the main workspace (not just sitting on
    the Project Manager / database picker screen);
  - **Python 3.6 or newer (64-bit)** installed on this PC — Storymaker
    spawns it to talk to Resolve's scripting API, it isn't bundled;
  - append-to-timeline specifically also needs a timeline open in that
    project — without one, the shot still lands in the bin with a clear
    note explaining why nothing was appended.

#### Music video delivery

A Music Video project's Delivery page adds a sync panel: the song's name,
BPM, and duration, and a check that every song section still has a scene
— a section that lost its scene (usually from editing outside the section
editor) plays under nothing in the assembled cut, and this catches it
before an editor does. It also adds, requiring the **Pro** tier below:

- A **chapter marker at every song section**, embedded in both the FCPXML
  export (as a real jump-to point in Resolve, Premiere, or Final Cut) and
  the local rough-cut MP4 (as a native chapter, readable in VLC,
  QuickTime, or any player that shows chapters) — computed from the
  section's own planned length, not a guess.
- **Export lyrics (.srt)** — a standalone button next to the sync panel;
  timed lyric captions, one block per line, each capped to its section
  and to 6 seconds so a caption never lingers.
- **`song-sections.csv`** — bundled automatically into the production
  package: label, kind, timing, energy, and lyric lines for every
  section, a clean reference for a human editor.

## Troubleshooting

### Provider key rejected

Replace the key in Model Hub and run **Check connection**. Confirm it belongs to
the selected provider and has access to the selected model.

### ComfyUI not detected

Confirm ComfyUI is running on port 8000 or 8188. Restart it after installing
models, then refresh local engines.

### Image-to-video requires a Start Frame

Select the approved storyboard image deliberately. General reference images are
not automatically used as start frames.

### Model rejects the reference count

Remove unnecessary references or select a model that supports more images or
multimodal assets.

### Generation completed but output is not visible

Open Output History and choose **Review take**. Check Media Library, save, and
reopen the project so durable-job recovery can run.

### Local video is slow

Use shorter duration and draft resolution, close other GPU applications, or
select a cloud video provider.

### Send to Resolve fails or does nothing

- **"DaVinci Resolve isn't open"** — launch DaVinci Resolve Studio first.
  The free edition cannot run this feature at all; only Studio exposes
  the scripting API it depends on.
- **"...still on the Project Manager screen"** — Resolve is running but no
  project is actually open in the main workspace yet. Open or create a
  project inside Resolve, then send again.
- **"Could not find a Python interpreter"** — install Python 3.6+
  (64-bit) from python.org or the Microsoft Store, then try again.
- **Sent to the bin, but nothing appended to the timeline** — open or
  create a timeline in the current Resolve project; the shot stays safely
  in the bin either way and can be sent again once one exists.
- A still lands at the wrong length only if its planned duration in
  Storymaker changed after it was already sent — send it again to
  refresh it; a real video clip is never resized and always plays its own
  actual length.

### Crash & error reporting

Settings has two separate things under **Diagnostics** and **Crash & error
reporting** — worth knowing apart:

- **Diagnostics** is always on and always local: a private log of
  generation failures, renderer errors, and crashes, written only to this
  PC. Nothing here is ever sent anywhere automatically. Attach it (Open
  diagnostics log) when reporting a problem.
- **Crash & error reporting** is a separate, opt-in toggle. If this build
  has a crash-reporting service configured, turning it on additionally
  sends crashes and errors to Wheelbarrow Studios automatically —
  redacted the same way the local log is, plus the Windows username
  stripped out of any file paths, since this is the one thing in the app
  that sends data off the machine. It never includes story content,
  prompts, or API keys. Off by default; turn it off again at any time.
  If the toggle is disabled and grayed out, this build has no
  crash-reporting service configured and the local diagnostics log above
  is still the way to share a problem.

### Licensing and activation

Storymaker uses a license key as proof of purchase. Your key arrives in the
purchase email.

- **What a key unlocks:** AI generation (images and video) and delivery
  (the local rough cut, FCPXML export, Send to Resolve, and the production
  package). Writing, the Story Bible, storyboards, and visual direction
  are always available without a key.
- **Activate:** open **Settings → License & Activation → Enter license
  key**, or use the banner shown at the top of the workspace, and paste
  the key. Activation binds the key to this device.
- **Move to another device:** open **Settings → License & Activation →
  Manage activation → Deactivate this device**, then activate on the new
  one. Each key allows a limited number of active devices.
- **Offline use:** once activated, Storymaker keeps working offline. It
  re-checks the key in the background when it can; a device that stays
  offline for an extended period will eventually be asked to reconnect and
  re-verify.
- **Builds without a configured store** (development builds, forks) do not
  require activation and run with every feature open.

A license key is an entitlement and a deterrent against casual copying. It
is not, and is not presented as, protection against a determined attacker.

#### Pro tier (Music Video delivery polish)

A licensed key optionally carries a **Pro** tier, separate from base
activation. Pro is entirely opt-in for a shipping build:

- **What Pro adds:** in Music Video mode, chapter markers embedded at
  every song section (in both the FCPXML export and the local rough-cut
  MP4), the standalone timed lyric-caption export (`lyrics.srt`), and the
  `song-sections.csv` breakdown bundled into the production package.
  Everything else — core generation, the base rough cut, FCPXML export,
  Send to Resolve, and the production package itself — is unaffected by
  tier and works on any activated key.
- **Setup:** create a second LemonSqueezy product or variant in the same
  store as the base license, then add its numeric product id to
  `license.config.json`'s `proProductIds` array (or the
  `STORYMAKER_LICENSE_PRO_PRODUCT_IDS` env var, comma-separated for more
  than one). Until `proProductIds` is set, every valid license key is
  treated as Pro — so this ships wired but inert, identical to today's
  behavior, until deliberately turned on.
- **A key's tier follows its product id** at activation time (the same
  `product_id` LemonSqueezy already reports for `productIds`), not a
  separate flag — sell the Pro tier as its own priced product/variant.

### Support information

When reporting a failure, include:

- Storymaker version;
- provider and exact model;
- operation such as text-to-image or image-to-video;
- time of failure;
- displayed error and correlation ID.

Never include the API key.

## Keyboard shortcuts

- `Ctrl+N` — new project
- `Ctrl+O` — open project
- `Ctrl+S` — save project
- `Ctrl+,` — settings
- `Ctrl+K` — command palette (jump to any page, or run a core action, by typing)
- `F1` — help
