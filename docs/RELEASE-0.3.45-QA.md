# Storymaker 0.3.45 QA record

## Blocking-reference repair

- General image references are no longer used as an implicit start frame by the fal video adapter.
- Start and end frame selectors are not in the DOM until a selected model explicitly supports start/end frames.
- Changing to an image model removes the frame selector DOM and clears stale frame IDs before save or submission.
- Imported media attaches only to its matching general-reference role. Frame selection is a separate deliberate action.
- The obsolete `IMAGE ROLE` control that offered first/end-frame semantics outside the video-only frame UI has been removed.

## Interconnected production system

- Character and Set Labs retain persistent profile IDs and approved visual references.
- The new Production Library manages reusable props, wardrobe/costume, vehicles, creatures, weapons, products, and other production assets.
- Storyboard scene editing supports cast, set/location, and production-asset assignments.
- Scene assignment IDs persist and their approved visual references are incorporated into compatible shot generation requests.

## Automated QA

- `npm run test:release` passed: 13 deterministic ingestion checks, 130 release regression checks, Electron main-process syntax validation, and a Vite production build.
- Checks include explicit-only provider start frames, removal of image-model frame controls, production-library availability, and storyboard asset assignment wiring.
