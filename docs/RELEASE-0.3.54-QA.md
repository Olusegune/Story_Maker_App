# Storymaker 0.3.54 QA — Visual Direction Discoverability

## Intent

Make the Visual Direction Engine visible in the established Storymaker studio flow rather than requiring users to discover it in a secondary library screen.

## Implemented

- Home now shows the current project Style DNA, its inherited strength, and a direct action to set or review it.
- The Home create rail and visual-language panel both lead to **Visual Direction**, not the older preset-only destination.
- Storyboard now receives a production-level Visual Direction control, an inheritance notice, and a compact look label on every scene card.
- The surfacing uses existing dark studio surfaces, cyan production labels, compact outlined controls, and the existing gold primary action for missing setup.

## Verification

- `npm run test:release`
  - ingestion smoke: passed (13 assertions)
  - Visual Direction smoke: passed
  - release smoke: passed (156 assertions)
  - Electron main syntax check: passed
  - Vite production build: passed

## Manual acceptance path

1. Open **Home** and confirm the Visual Direction card appears below Project Pulse.
2. Click **Set the look** (or **Open Visual Direction**) and apply a Style DNA.
3. Open **Storyboard** and confirm the board announces the inherited look.
4. Confirm every scene card displays the inherited look and opens the Visual Direction workspace.
5. Generate a scene or shot and confirm the selected Style DNA remains present in its generation metadata.
