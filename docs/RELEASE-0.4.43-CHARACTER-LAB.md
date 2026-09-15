# Story Maker 0.4.43 — Character continuity workbench

## Character Lab

- Replaced the cramped image sidebar with a full-width Character Turnaround board.
- The board presents the approved identity beside dedicated Front, Side, and Back views. Every image opens in the large preview lightbox.
- Generating a new identity clears stale turnaround views; generating a turnaround fills the board without discarding the current brief or model choices.
- The approved identity and turnaround assets now automatically accompany the character into any scene where they are cast.

## Style application

- Character, set, prop, and storyboard generation explicitly inject the active Style DNA name and its relevant prompt blocks.
- Resulting character, set, and prop assets persist Style DNA metadata for traceability.

## Preset presentation

- Preset-card image framing now crops baked-in cinematic letterboxing at the outer edge, producing clean edge-to-edge thumbnails instead of black bars.

## Windows build

- Packaged and verified the x64 NSIS installer and portable executable in `dist-release/`.
- This build is not Authenticode-signed because no code-signing certificate is configured in the build environment.
