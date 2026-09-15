# Storymaker 0.3.47 — Import Enrichment Recovery QA

## Fixed

- A failed remote story-analysis request no longer leaves an imported script trapped at the ingestion review.
- The enhancement review now clearly shows the provider error, preserves the local parsed plan, offers **Retry AI improvements**, and still allows the user to build the parsed storyboard.
- The import button retains its accurate label after a failed request.
- Story-analysis success and failure events are recorded in the local diagnostics log without source text or credentials.
- If both keys are configured, an OpenAI analysis failure now attempts an OpenRouter fallback and reports both provider failures when neither succeeds.

## Verification

`npm run test:release` passed:

- 13 ingestion assertions
- 134 release checks
- Electron main-process syntax validation
- Vite production build

## Manual verification path

1. Import a script and select **Get AI improvements to review**.
2. On success, review individual editable story proposals and accept or reject each one.
3. On a provider failure, confirm the error is visible in the review, choose **Retry AI improvements** or **Implement — populate … shots**.
4. Open **Model Hub** only if the displayed error asks for a connection or model correction.
