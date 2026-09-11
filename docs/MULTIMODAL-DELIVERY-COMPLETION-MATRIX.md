# Multimodal and Delivery Completion Matrix

| Requirement | Implementation evidence | Runtime evidence |
| --- | --- | --- |
| Delete reference assets in the model UI | `data-delete-reference`, `removeMedia`, and usage cleanup clear every image/video/audio/start/end attachment. | Release smoke contract. |
| Import images, videos, and audio | Native multi-select picker recognizes image, video, and audio formats and rejects unreadable files with an actionable message. | Packaged portable launches; picker contract is checked in release smoke. |
| Re-select an existing imported asset | `importAssetsIntoProject()` returns already-known selected assets to the Shot Director instead of treating them as failed imports. | Release smoke contract. |
| Start/end frames | Model-aware start/end selects are only shown on models whose capability declares `startEndFrames`. | Live Kling V3 start-frame generation completed. |
| Seedance 2.0 multimodal inputs | Fal Reference-to-Video sends up to 9 image, 3 video, and 3 audio URLs after provider storage staging. | Live image+video 21:9 Seedance job completed and persisted. |
| Kling model inputs | Kling V3 supports start/end images and image/video elements; external audio is not advertised because that provider schema does not accept it. | Live start-frame + video-element Kling V3 job completed and persisted. |
| 21:9 | Available only in model capability registries that support it. | Seedance live test returned a valid 992x432 H.264 result. |
| 1K/2K/4K delivery | Delivery selector maps 1K/2K to Topaz 2x and 4K to Topaz 4x; output is persisted as a new project asset. | Live Fal Topaz 2x returned a valid 2752x1536 PNG. |
| Visible progress, trivia, completion notification | Render overlay contains percentage, stage, rotating film/AI trivia, polling updates, and a completion toast. | Release smoke contract; provider jobs completed with saved artifacts. |

Provider evidence is stored under `%APPDATA%\\wheelbarrow-studios-story-maker` and intentionally redacts API keys and full provider URLs.
