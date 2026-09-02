# Claude handover — 0.4.46

## Release focus

This release closes the reported inconsistency where a selected visual style could be ignored by some image routes or by later final renders. The important design decision is that Style DNA is no longer only a UI prompt-authoring concern: it is enforced centrally in `electron-main.js` immediately before provider submission.

## Where to look

- `electron-main.js`
  - `styleSnapshotPrompt(style, kind, context)` builds contextual character/environment/prop language.
  - `styleEnforcementPrompt(payload, settings, kind)` resolves the live project → scene → shot style and adds the required `STYLE DNA LOCK`.
  - `resolvedShotPrompt(payload, settings, kind)` always prefixes this lock even when `imagePrompt` or `videoPrompt` was saved earlier.
  - `requestShotImage` and all video-submit adapters consume this resolved prompt.
- `src/storymaker.js`
  - Character Lab uses `styleContext: "character"`; Prop Lab (including accessories) uses `"prop"`; Set Lab uses `"environment"`; scene and Shot Director renders use `"storyboard"`.
  - `assignedContinuityReferenceIds(scene)` collects assigned character, set, prop, and accessory media.
  - Shot Director displays these as locked continuity choices and serializes them before optional manually selected references.
- `scripts/style-propagation-audit.mjs` is a focused no-provider-cost guard against accidental removal of the wiring.

## Behavioral expectations

1. Applying a Style DNA affects new character identities, turnarounds, sets, props/accessories, scene generations, individual final stills, and video prompts across every supported provider.
2. Existing generated media is intentionally immutable. If a character identity was created before a style changed, use **Restyle identity image**, then regenerate its turnarounds. Do not silently replace a user-approved asset.
3. A model with fewer image-reference slots than a scene's required continuity assets receives the required assets first; Shot Director makes the shortfall explicit. A no-reference model still receives the text Style DNA lock.

## Commands

```powershell
npm run test:release
node scripts/delivery-pipeline-smoke.mjs
npm run build:win
```

The Windows build uses the shared sibling dependency runtime configured in `package.json` (`..\\wheelbarrow-ai-director\\node_modules`). Keep that contract or replace it with local installed dependencies before moving the repository elsewhere.
