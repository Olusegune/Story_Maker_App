# Managed local models — spike findings

**Date:** 2026-09-10
**Question:** Can Storymaker run local video models (LTX-Video, Wan) by
*managing a headless ComfyUI itself* — so the user picks a model from a
list and never opens ComfyUI — and how fragile is that in practice?

**Verdict: GO**, scoped to a curated catalog on a managed headless
ComfyUI. The orchestration layer is small and reliable. The real cost is
acquisition (multi-GB downloads) and the ongoing burden of keeping baked
workflows working across ComfyUI/model updates — both manageable if the
catalog stays deliberately small.

Spike code: `scripts/local-models-spike.mjs` (throwaway, not shipped, not
in `test:release`). It reuses an existing ComfyUI install + venv + weights
on the dev machine so it isolates *orchestration* from *acquisition*.

---

## What the spike proved (on an RTX 4070 SUPER, 12 GB VRAM)

Storymaker can, with no user interaction and no ComfyUI window:

1. **Discover** a ComfyUI code dir + its matched venv + the model base dir.
2. **Spawn** a headless server itself:
   ```
   <venv>\Scripts\python.exe -s <ComfyUI>\main.py \
     --listen 127.0.0.1 --port <private> \
     --base-directory <models/output/input/user root> \
     --disable-auto-launch --dont-print-server
   ```
3. **Wait for readiness** via `GET /system_stats` — also the VRAM-gate
   source (`devices[0].vram_total` / `vram_free`).
4. **Confirm curated weights are visible** via `GET /object_info` (per
   loader node's file list).
5. **Run Storymaker's existing baked workflows unmodified** — the exact
   `requestComfyUiLtxVideo` / `requestComfyUiVideo` node graphs from
   `electron-main.js` — via `POST /prompt`, poll `GET /history/<id>`,
   pull the mp4 from `GET /view`.
6. **Tear the server down** cleanly. Repeat spawns are clean — no port or
   DB-lock issues across runs.

### Measured (2-second clip, cold each time)

| Model | Headless boot | Generate | Total | Output |
|---|---|---|---|---|
| LTX-Video 2B 0.9.8 distilled fp8 | ~10.6 s | ~28 s (768×512, 20 steps) | ~40 s | valid h264 mp4, 49 frames @ 25 fps |
| Wan 2.1 Fun InP 1.3B bf16 | ~10.6 s | ~50 s (512×512, 12 steps) | ~61 s | valid h264 mp4 |

Both models run on **ComfyUI core nodes** — no `custom_nodes` required.

---

## Fragility findings

1. **Code and venv must be a matched pair.** The frontend/template static
   assets (`comfyui_frontend_package`, `comfyui_workflow_templates`) are
   pip packages *in the venv*; the code copy's `server.py` must match the
   version that installed them. Pairing the Electron app's bundled
   `resources/ComfyUI` (v0.3.62) with a newer venv crashed on a moved
   template path (`comfyui_workflow_templates/templates` no longer exists
   — split into `_core` / `_json` sub-packages). **Managed mode must own
   the pair**, upgrade them together, and never point its venv at a
   foreign code dir.

2. **`--base-directory` writes an alembic SQLite DB under the base dir.**
   The spike saw a non-fatal `unable to open database file` warning
   ("in future the database will be required"). Managed mode should give
   ComfyUI a writable base dir it owns and pre-create it.

3. **Output goes to `<base>/output/` with ComfyUI's own auto-incrementing
   filename counter**, shared with any other ComfyUI use of that base
   dir. Managed mode should use a dedicated `--output-directory` (or a
   `Storymaker/` `filename_prefix`, which the baked workflows already do)
   and read results back by the `/history` record, not by scanning.

4. **Baked workflows are version-coupled.** LTX 0.9.8 and Wan 2.1 work on
   today's core nodes; LTX-2 / Wan 2.2 use different nodes and in some
   builds a custom node pack. Every catalog entry needs a
   `(model files, workflow JSON, min ComfyUI version)` triple, and a
   smoke test that submits it — the existing `comfy-*-live-smoke.mjs`
   scripts are the pattern; they'd become part of release validation for
   any catalog change.

5. **VRAM reality on a common card.** 12 GB comfortably runs LTX 2B and
   Wan 1.3B at ≤768². It will *not* run Wan 14B without aggressive
   offload/quant. The catalog must gate by `vram_total` and be honest:
   "needs ~16 GB" beats an OOM 40 s into a render.

---

## What the spike did NOT test: acquisition

This machine already had ComfyUI + a venv + all weights. A from-scratch
install still needs to be built and tested. Plan:

### ComfyUI runtime (~1.5–2 GB, once)
- `ComfyUI_windows_portable_nvidia.7z` from GitHub releases — self-
  contained `python_embeded` + CUDA torch, no system Python needed.
  (AMD/Intel variants exist; NVIDIA-first.)
- Download, verify hash, extract with a bundled `7zr.exe`, record the
  `(python_embeded, ComfyUI, version)` unit. Never touch system Python.
- Alternative: `comfy-cli` — cleaner, but needs a Python to bootstrap it,
  so portable wins for a zero-Python guarantee.

### Curated weights (per model family, from HuggingFace)
Sizes measured from the working set on this machine:

| Family | Files | Size | ComfyUI subfolder |
|---|---|---|---|
| LTX-Video 2B distilled | `ltxv-2b-0.9.8-distilled-fp8.safetensors` (4.2 GB) + `t5xxl_fp8_e4m3fn.safetensors` (4.6 GB) | **~8.8 GB** | `models/checkpoints`, `models/text_encoders` |
| Wan 2.1 Fun InP 1.3B | unet 3.0 GB + `umt5_xxl_fp8` 6.3 GB + `wan_2.1_vae` 0.24 GB + `clip_vision_h` 1.2 GB | **~10.7 GB** | `models/diffusion_models`, `models/text_encoders`, `models/vae`, `models/clip_vision` |

- Download with resume + SHA256 verify to a Storymaker-owned model root;
  generate `extra_model_paths.yaml` so one copy serves every managed
  ComfyUI. Never re-download a file that verifies.
- Disk check before starting: refuse if free space < (download + 20%).

---

## Recommended architecture for the real feature

- **`resolve-runtime` module** (mirrors `resolve-bridge/`): owns the
  portable ComfyUI unit, the model root, the `extra_model_paths.yaml`,
  and the headless process lifecycle (spawn on first local render, idle-
  timeout shutdown, one instance, private port).
- **Catalog** = a static table of `{ id, label, family, files[], workflow,
  minComfyVersion, minVramGB }`. Start with exactly the two proven
  entries. Adding LTX-2 / Wan 2.2 is a catalog row + a workflow + a smoke
  test, not new plumbing.
- **Model Hub UI**: "Local video" section lists catalog entries with
  state (`installed` / `downloadable` / `needs 16 GB VRAM` / `downloading
  62%`). One button per entry. Reuses the existing
  `localRuntimeStatus()` / `refreshLocalRuntimes` surface.
- **Reuse as-is**: `requestComfyUiLtxVideo` / `requestComfyUiVideo` and
  the `:8188`/`:8000` detection already in `electron-main.js` — managed
  mode just adds a third, Storymaker-owned endpoint to the candidate list
  and the ability to start it.
- **Keep it opt-in and clearly "advanced / offline / private."** Cloud
  gateways stay the default path — for most users "click model → runs in
  the cloud → $0.05" beats a 10 GB download and a VRAM lottery.
- **MiniMax / Hailuo is not part of this** — closed-weight, API-only. It
  belongs in the hosted catalog (already reachable via fal / WaveSpeed),
  not here.

## Rough effort / phasing

1. **Runtime module + managed headless lifecycle** (spawn/health/shutdown,
   endpoint wiring). ~M. The spike is most of the proof.
2. **Acquisition** (portable download+extract+verify, weight download with
   resume+hash, disk/VRAM gating, `extra_model_paths.yaml`). ~M–L — the
   fiddly part, lots of failure modes to handle gracefully.
3. **Catalog + Model Hub UI** for the two proven entries. ~M.
4. **Per-entry smoke tests** wired into release validation. ~S.

Ongoing: each ComfyUI/model release can break a baked workflow; the smoke
tests are the early-warning. Keeping the catalog to a handful of entries
is what keeps that burden small.
