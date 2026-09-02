# Storymaker 0.3.50 — Stable Import Review

## Fix

The import-enrichment path previously built the local production context by calling a full application render while the import review modal was open. That discarded the modal and temporarily exposed the Story Bible before the AI review arrived.

The production context can now be populated silently during enrichment. The import review stays visible with its loading state until Storymaker opens the completed improvement review.

## Verification

1. Import a story source.
2. Choose **Get AI improvements to review**.
3. Confirm the ingestion modal remains visible while processing.
4. Confirm it transitions directly to the AI review without briefly showing Story Bible.
