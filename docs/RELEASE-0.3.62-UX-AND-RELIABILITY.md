# Storymaker 0.3.62 — UX and Reliability QA

## Completed

- Added **Characters** to the top production navigation immediately after Design.
- Replaced the native Style Strength appearance with the Storymaker control language.
- Increased Style Library card spacing and primary Apply-button size.
- Rebuilt Model Hub as a searchable, filterable catalog grouped by provider.
- Added a direct Audio Studio import action and a clear Import → Cue → Timeline → Delivery workflow.
- Increased Storyboard, Shot Director, and Timeline media presentation sizes.
- Routed Generate to the provider-neutral Scene Visualization workspace.
- Unified scene take history across scene variations, approved frames, shot outputs, output history, and motion masters.
- Added image and video previews to Scene Visualization take history.
- Corrected misleading “Approved”/“No takes yet” combinations caused by incomplete take lookup.

## QA

- Ingestion smoke: 13 assertions passed.
- Visual Direction smoke: passed.
- Release smoke: 198 checks passed.
- Vite production build: passed.
- Delivery pipeline smoke: produced a valid H.264/AAC preview.
- Desktop visual pass: splash, Home, top navigation, Style Library, Model Hub, and Audio Studio inspected at 1546 × 973.

## Product decision

Character Bible remains in the left development navigation and is also present in the top production sequence after Design. This is intentional: the sidebar is the complete workspace map, while the top bar communicates the primary production order.

