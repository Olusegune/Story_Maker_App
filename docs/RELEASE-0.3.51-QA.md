# Storymaker 0.3.51 QA and repair note

## Resolved defects

- Recommendation decisions are now persisted as `accepted` or `rejected` instead of deleting the recommendation and re-rendering away the review modal.
- Accepting or rejecting one proposal leaves the complete recommendation set visible and preserves the current review position.
- The review includes **Accept all N remaining** and retains individual editable Accept/Reject controls.
- Accepted scene recommendations synchronize the scene objective and an untouched starter shot's narrative and image/video prompt packages. Detailed shot planning remains an explicit final review action.
- Decided recommendations remain in project data as editorial history, while the AI Director inbox shows only pending recommendations.
- Recommendation controls are scoped to the visible modal, preventing a duplicate control behind the modal from receiving the edit or status update.
- Shot model resolution now uses both provider and exact model identifier. This fixes fal/WaveSpeed collisions where both providers expose the same Seedance identifier.
- Media imported while an incompatible model is selected is routed to a compatible live video model when one exists, preferring a connected provider. The imported files are then attached to the correct image, video, or audio reference role.
- General references remain separate from deliberate video start/end frames; imports never assign frame roles automatically.

## Pipeline verification

- Local media records preserve identity, path, MIME type, byte size, and media kind.
- fal video inputs are uploaded to provider-accessible storage before request submission.
- Seedance 2.0 reference-to-video receives separate `image_urls`, `video_urls`, and `audio_urls` arrays.
- Start/end-frame fields are emitted only for compatible image-to-video models and only for explicitly selected assets.
- Static release suite: 13 ingestion assertions and 144 cross-layer release assertions passed.
- JavaScript syntax validation and the production Vite build passed.
- Live fal paid-provider smoke passed on 2026-07-22 using `bytedance/seedance-2.0/reference-to-video`: one image reference and one video reference were uploaded, request `019f8b3c-d749-7311-9a50-94112cb349e2` completed, and a 662,579-byte result was downloaded.
- `ffprobe` verified the downloaded result as an MP4-family container with a 4.041667-second duration.
- The live smoke covered image and video references. Audio import, classification, storage upload, and Seedance `audio_urls` request mapping passed static integration checks; no eligible local audio asset was available for a paid audio-reference render.

## Usability audit notes

- The notification now distinguishes successful project import from model attachment and explains automatic model switching.
- Accepted/rejected recommendation cards gain a visible status and disabled controls without collapsing the rest of the review.
- The bulk action count updates after every individual decision.

## Known external constraints

- Provider account access, credits, moderation, rate limits, endpoint availability, and model deprecations remain controlled by each provider.
- A mixed media selection can only attach when at least one configured model supports every selected media kind; otherwise the files remain safely available in the project library.
