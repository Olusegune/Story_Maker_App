# Storymaker 0.3.42 QA

## Production prompt compiler

- Video prompts are now structured as a directing package: scene, story purpose, narrative/dialogue, cast continuity, acting and micro-animation, blocking/camera, lighting/atmosphere, environment/VFX, visual language, continuity, motion/timing, audio, cinematic structure, and negative constraints.
- Character performance is thought-led and beat-specific: gaze before a decision, blink timing at thought shifts, breath, facial asymmetry, restrained hands, posture and weight changes, fabric/hair settling, listening, reaction, and motivated pauses.
- Image prompts now describe a decisive story moment rather than a static pose. They explicitly use gaze, silhouette, hand placement, body language, facial expression, composition, and lighting to communicate a character's internal thought.
- The implementation uses top-tier feature-animation acting attributes without claiming or attempting to reproduce a specific studio or filmmaker style.

## Verification

`npm run test:release` passed: 10 ingestion assertions, 114 release assertions, JavaScript syntax checks, and the Vite production build.
