# Storymaker 0.3.55 — Video Input and Recovery Repair

## Fixed

- Seedance Image-to-Video now rejects an invalid request before spend when no explicit Start Frame is selected. The Start Frame is sent as `image_url`; general reference images remain guidance and are never silently promoted into a start frame.
- Start and end frames no longer count against a model's general image-reference allowance.
- Kie Seedance UI and submission limits now match its one-image guidance contract.
- Kie image-to-video sends the deliberate Start Frame as its source image rather than automatically choosing the first general reference.
- Completed video recovery now also reconciles known durable job IDs/provider task IDs, so completed media can return to the exact shot after project identity/history changes.

## Verification

- `npm run test:release`: passed.
- Release smoke: 160 checks.
- Electron main syntax and Vite production build: passed.
- A low-duration paid fal smoke was started through the queue/poll/download route, but exceeded the local two-minute automation window; it is not represented as a successful test result.
