# Storymaker 0.3.34 release QA

## Scope

- Replaced the marketing-style Home hero with a production dashboard driven by the current project's real state.
- Enlarged the startup splash and made the studio behind it blurred and non-interactive until it is closed.
- Kept Home actions connected to existing project, Story Bible, Character Bible, Storyboard, Model Hub, AI Director, and Design Bible workflows.
- Corrected release metadata so the package and lockfile both identify version `0.3.34`.

## Audit findings fixed

1. The production renderer is `src/storymaker.js`; `src/main.js` is not loaded by `index.html`. The release change was applied only to the packaged renderer.
2. The prior Home screen was a static marketing composition with no project-state-based routing. Home now derives readiness, the recommended next room, cast/scene/shot counts, and provider connection status from the live project record.
3. The splash did not explicitly blur the underlying app shell. It now applies and removes a focus state on the main and sidebar surfaces, while retaining a real close control.
4. `package-lock.json` was stale at `0.3.30` despite package version `0.3.33`. Both package files are now `0.3.34`.

## Verification performed

| Check | Result |
| --- | --- |
| Ingestion smoke tests | Passed: 10 assertions |
| Release smoke tests | Passed: 60 assertions |
| Static Electron validation | Passed: `node --check electron-main.js` |
| Production Vite build | Passed |
| Windows installer build | Passed |
| Windows portable build | Passed |
| Development desktop visual test | Passed: blurred splash, close transition, Home layout |
| Home next-step routing | Passed: `Open Story Bible` navigates to Story Bible |
| Packaged portable visual test | Passed: splash shown; closing it opens the production desk |

## Build artifacts

- `dist-release/Wheelbarrow Studios Story Maker Setup 0.3.34.exe`
- `dist-release/Wheelbarrow Studios Story Maker 0.3.34.exe`

## Boundaries of this pass

This release pass validates the Home/splash experience, renderer build, packaging, and the existing automated generation-contract suite. It does not make a paid live generation call because provider credentials and credit usage were not supplied as part of this release check. Provider-specific end-to-end generation remains subject to the configured keys, account access, and provider availability.
