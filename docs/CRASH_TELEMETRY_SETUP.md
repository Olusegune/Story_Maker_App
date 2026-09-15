# Setting up crash telemetry (Sentry)

Storymaker's crash-reporting integration (`@sentry/electron`, wired into
`electron-main.js`) is fully built and shipped, but stays **completely
inert** until this one file exists. No account, no DSN, no code changes
needed beyond this — this is the only step left.

## Why this file, and not something committed to the repo

The DSN isn't a secret in the traditional sense (Sentry DSNs are designed
to ship inside client apps), but this repo is public, and there's no
reason to invite garbage events into your own Sentry project by leaving
it sitting in git history forever. `sentry.config.json` is in
`.gitignore` for exactly that reason — create it locally, it gets bundled
into every packaged build (`package.json`'s `build.files` already
includes it), and it never touches the repo.

## Steps

1. **Create a free Sentry account** at [sentry.io](https://sentry.io) (or
   sign in if you already have one — the free tier's error volume is far
   more than a small desktop app needs).
2. **Create a new project** inside Sentry: choose **Electron** as the
   platform when prompted. Name it something like `storymaker`.
3. Sentry will show you a **DSN** — a URL that looks like
   `https://<key>@o<org-id>.ingest.<region>.sentry.io/<project-id>`.
   Copy it.
4. At the project root (`wheelbarrow-studios-story-maker/`, next to
   `package.json`), create `sentry.config.json`:

   ```json
   { "dsn": "https://<key>@o<org-id>.ingest.<region>.sentry.io/<project-id>" }
   ```

5. Rebuild and reinstall Storymaker as usual. That's it — nothing else
   changes. The build now bundles the DSN; crash reporting still stays
   **off** for every user (including you) until it's turned on from
   Settings > Crash & error reporting, per install.

## Verifying it actually works

1. Launch the built app, open **Settings**, confirm the **Crash & error
   reporting** toggle is now enabled (not grayed out) and turn it on.
2. Trigger a real error to confirm delivery — the simplest is to open
   DevTools (**View > Toggle Developer Tools**) and run
   `throw new Error("telemetry test")` in the console, or reproduce any
   real bug.
3. Check your Sentry project's **Issues** tab — the event should appear
   within a few seconds, with the message and stack trace redacted:
   Bearer tokens / API keys replaced with `[redacted]`, and your Windows
   username replaced with `[user]` in any file paths.

## An alternative to the file: an environment variable

`STORYMAKER_SENTRY_DSN` overrides the file if set at launch — useful for
a CI build step, without ever writing the file to disk at all:

```powershell
$env:STORYMAKER_SENTRY_DSN = "https://..."
```

## What actually gets sent (once a user opts in)

- The error message and stack trace, redacted (Bearer/API-key tokens and
  the Windows username stripped, same as the local diagnostics log plus
  the extra path redaction).
- App version, OS, and whether the build is packaged — standard Sentry
  context, used to tell which release a crash came from.

**Never sent, under any configuration:** story content, prompts,
character/scene data, project files, or API keys — the redaction in
`beforeSend` (`electron-main.js`) fails *closed*: if redaction itself
ever throws, the event is dropped rather than risking something
unredacted going out.
