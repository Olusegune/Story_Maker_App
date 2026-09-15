# Storymaker 0.3.61 — Claude Code handover

## Working locations

- Canonical repository: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker`
- Claude snapshot: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker-claude-handover-0.3.61`
- Releases: `C:\Users\eduni\Documents\Playground\wheelbarrow-studios-story-maker\dist-release`

Use the snapshot as Claude Code's workspace. It excludes dependencies, release binaries, backups, Git internals, credentials, user projects, and generated media.

## 0.3.61 connected-pipeline changes

1. `motionMasterShotId` now preserves which shot owns a scene motion master.
2. `syncAutomaticMotionMaster()` automatically establishes a master only for one-shot scenes or an already-selected master shot.
3. Multi-shot generation no longer replaces the entire scene with the last completed video.
4. Delivery video approval marks the shot approved and makes it timeline-ready. One-shot scenes also receive the motion master automatically.
5. The explicit **Use as scene motion master** action marks its owning shot approved and records both IDs.
6. Timeline output resolution uses the motion master only for its owning shot; otherwise each shot uses its own selected video/image.
7. `renderProductionPreview()` replaces the fragile direct concat path. It normalizes stills and provider videos, concatenates them, and mixes Timeline audio cues.
8. Audio is padded before `-shortest`, so cue length cannot change picture duration.
9. Production-package CSV contains motion-master and source-frame provenance.
10. `scripts/delivery-pipeline-smoke.mjs` performs a real FFmpeg/FFprobe integration test and serialization checks.

## Critical invariants

- General references never become Start Frame or End Frame automatically.
- Provider/library membership never implies provider attachment.
- A shot's `outputAssetId` is its Timeline output.
- `scene.motionAssetId` is an optional scene-level master, not a bucket for whichever video completed last.
- `scene.motionMasterShotId` identifies the owning shot when there is one.
- Project save/recovery must preserve `sourceFrameAssetId`, output history, review state, motion master, and audio cues.

## Verification

```powershell
npm install
npm run test:release
npm run test:delivery-pipeline
npm run build:win
```

- Release contract: 188 checks.
- Delivery integration smoke: valid mixed H.264/AAC output with picture duration preserved.
- Windows installer and portable packaging completed for 0.3.61.

See `docs/RELEASE-0.3.61-PIPELINE-QA.md` for detailed findings and remaining scope.

