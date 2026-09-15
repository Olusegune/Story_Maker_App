# Provider operations and capability matrix

## Credential storage

Storymaker stores provider keys through Electron `safeStorage` in the current Windows user profile. Keys are encrypted by Windows where supported and are never written to `.storymaker` project files, exports, diagnostic logs, or the renderer process.

There are no required plaintext environment variables for the desktop product. If a CI or automated integration harness is added, keep secrets outside the repository and use only these names:

| Variable | Purpose | Required for |
| --- | --- | --- |
| `OPENAI_API_KEY` | Guarded live OpenAI smoke test only | OpenAI image/parser smoke |
| `GOOGLE_API_KEY` | Guarded live Gemini smoke test only | Google image smoke |
| `FAL_KEY` | Guarded fal smoke test only | fal image smoke |
| `WAVESPEED_API_KEY` | Guarded WaveSpeed smoke test only | WaveSpeed image/video smoke |
| `STORYMAKER_LIVE_PROVIDER_SMOKE` | Must equal `1` before a paid live test runs | Any live smoke |

Do not copy user keys into these variables from the app. The app’s encrypted credential store remains the primary production configuration route.

## Capability matrix

| Provider | Exact supported adapter family | Image | Reference image | Video | Job behavior | Availability rule |
| --- | --- | --- | --- | --- | --- | --- |
| OpenAI | Responses API image generation tool | Yes | Yes | No | Synchronous response, local media save | Requires successful key check or render. |
| Google AI | Gemini `generateContent` image response | Yes | Yes | No | Synchronous response, local media save | Requires saved Google key and compatible model access. |
| fal | Seedream v4.5 / v5 Lite endpoints | Yes | Yes | No | Synchronous endpoint, URL download and MIME validation | Only the two exact Seedream model IDs are advertised as native. |
| WaveSpeed | GPT Image 2, Seedream v5 Pro, selected gateway models | Yes | Model dependent | Yes | Provider task ID, polling, local download | Model must have a concrete request contract; failed/no-output tasks stay failed. |
| Seedance | Configured native video endpoint family | No | Public URL only when required | Yes | Provider task ID and recovery polling | Only configured endpoint IDs may be submitted. |
| Kling | Kling 3 Omni adapter | No | Image/video per selected mode | Yes | Provider task ID and recovery polling | Only the exact supported model may be submitted. |
| KIE | No verified native adapter in this release | No | No | No | N/A | Must be marked unavailable; do not submit. |
| OpenRouter | Credential registry only in this release | No | No | No | N/A | Must be marked unavailable; do not submit. |

## Operator validation sequence

1. Open **Model Hub** and save one provider key.
2. Select **Check connection**. A rejected key is reported without exposing it.
3. In **Shot Director**, select a live provider/model and run **Check readiness**.
4. Submit a low-cost image or video job. The app records a durable local job ID before calling the provider.
5. On completion, Storymaker validates/downloads media, attaches it to the shot, and keeps it in the project’s asset list.
6. Save the project. Media is staged in the project’s adjacent `.assets` directory, so reopening does not depend on a provider URL.

## Known limitations

* The desktop build uses durable local polling; it cannot receive public provider webhooks without a separate hosted callback service.
* KIE and OpenRouter are not generation-capable until exact endpoint contracts are implemented and tested. A catalog entry alone is not availability.
* A provider may alter an endpoint/model contract. Use **Check connection** and a guarded live smoke test after provider upgrades.
