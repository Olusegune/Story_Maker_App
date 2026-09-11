# Overnight session — 2026-09-08 into 2026-09-09

You asked two questions before bed: is there a market for this, and what
would make it more amazing. You picked one to start ("auto-assemble a rough
cut"), then said "go for all 7" plus the three productization gaps
(code signing, auto-updater, crash reporting — plus monetization and
power-user density from the same message), and left it to me overnight.

This is the honest accounting. Shipped and verified vs. genuinely blocked
on your own action vs. still just a backlog — clearly marked, not blurred
together.

**Versions shipped tonight:** 0.4.68 → 0.4.72, all installed, all pushed to
GitHub, all in the Desktop backup folder (now `Story Maker Backup 0.4.72 -
2026-09-08`). Every change below passed `npm run test:release` (265 checks
by the end, up from 236) before shipping, and every feature was verified
live — either in the dev browser, or in a real packaged build, not just
read as source.

---

## 1. Idea #1 — auto-assemble a rough cut

**Status: already existed. Fixed what was actually wrong with it.**

I recommended this as the highest-leverage idea, then went to build it and
found it already lived on the Delivery page — `renderProductionPreview()`
already normalized mixed codecs across providers, concatenated every
approved shot/take in order, and mixed in Audio Studio cues at their own
timing and level. I verified this myself with a synthetic 3-shot + 1-cue
project before touching anything: real MP4, correct duration, both video
and audio streams present.

What was actually broken: a dead, same-named duplicate function
(`renderVisualPreview`, video-only, no audio) that nothing was wired to —
the real IPC channel always pointed at the working one. That confusable
naming is almost certainly why I went looking at the wrong function first.
Removed the dead one. Also fixed genuinely wrong copy — it called the
output "silent" even when audio cues existed, and called a real rough cut
a "preview." Renamed the button "Assemble rough cut" and rewrote the
copy to say what it actually does.

*(0.4.68)*

## 2. Idea #2 — a cost/usage meter

**Status: built, verified, shipped.**

New "ESTIMATED SPEND" panel on Delivery. Every generated asset already
carried `generation.{provider,model}` — this is aggregation over data that
already existed. Rough per-provider/per-kind USD estimates (OpenAI's two
entries are grounded in the exact pricing I verified when I added GPT
Image 2.5 earlier; fal/Kie/WaveSpeed are one flat figure per provider
rather than chasing 30+ individual gateway model prices that would drift
immediately). Imported/uploaded media correctly contributes nothing.
ComfyUI/local generations are shown as genuinely $0, not just estimated
low. A model this table doesn't cover shows "not tracked," never silently
$0.

Verified live with a synthetic 6-asset project (2 tracked providers, 1
free local, 1 untracked, 1 non-generated import) — total, breakdown, and
the untracked/free distinction all came back exactly right.

*(0.4.69)*

## 3. "No crash reporting"

**Status: local safety net built. Real third-party reporting still needs
you.**

A real Sentry/Bugsnag integration needs an account and a DSN wired in —
that's genuinely your call to make (which service, what data policy), not
something I should improvise. What I built instead, which needed no
account: every uncaught exception, unhandled rejection, renderer crash
(`render-process-gone`), and renderer-side JS error now lands in the same
local diagnostics log generation failures already used (same redaction, so
no key ever ends up in it). New "Open diagnostics log" button in Settings
— something concrete to attach when something breaks, instead of the file
only being findable by knowing to dig through AppData.

Verified live: threw a synthetic error and a synthetic rejection in the
dev browser, confirmed both are captured and forwarded correctly.

*(0.4.70)*

**If you want real crash reporting later:** pick Sentry (generous free
tier, Electron SDK is mature) or Bugsnag, create an account, get a DSN,
and it's a small addition on top of what's here — the capture points
already exist, they'd just also forward to the SDK.

## 4. "No auto-updater"

**Status: fully wired. Has nothing to check against until you do one
thing.**

`electron-updater` is now a real dependency (confirmed bundled into a
real packaged build via `asar list`), pointed at GitHub Releases on
`Olusegune/Story_Maker_App`. `autoDownload` stays `false` — matches this
app's existing "check, never act without you" pattern. A background check
runs ~8s after launch in packaged builds only; manual check/download/
install lives in a new "UPDATES" section in Settings, next to Diagnostics.

**This has nothing to find until a real GitHub Release exists.** A
force-pushed commit to `main` — which is how this whole session has been
getting code onto GitHub, because `gh` was never authenticated — is not a
Release. I verified the honest failure mode in a real packaged build: the
background check ran, found no published release, and logged
`"No published versions on GitHub"` gracefully. No crash, no confusing
error, exactly the right behavior for "not set up yet."

**What you need to do, once, to make this real:**
1. `gh auth login` in a terminal (interactive — I cannot do this for you,
   it's a real account action).
2. From then on, instead of the orphan-snapshot force-push this session
   has been using, publish an actual tagged Release with the built
   installer attached — either `gh release create v0.4.72
   "dist-release/Wheelbarrow Studios Story Maker Setup 0.4.72.exe"
   --title "0.4.72"` from a terminal, or the "Draft a new release" button
   on the GitHub repo page, uploading the same file.
3. Every install from 0.4.71 onward will then actually find and offer
   that update the next time it checks.

Also caught and fixed by testing before it shipped: my first version of
the "Check for updates" button set its state only from a separate event
that electron-updater fires as a side effect — a real race, since that
event arrives over a different IPC channel than the button's own result,
with no guaranteed order. A test reproducing that timing left the UI stuck
on "Checking…" forever. Fixed to read the check's own result directly.

*(0.4.71)*

## 5. "No monetization model"

**Status: not built. Here's the actual recommendation, and why I didn't
just build something.**

I could have added a fake-looking "Upgrade" button that goes nowhere, but
that would be worse than nothing — either it's deceptive scaffolding or
it's a broken control the first real user clicks. Real payment collection
needs a merchant account (Stripe, Paddle, LemonSqueezy, etc.) — that's a
business decision with real terms-of-service and banking details, not
something I can or should set up on your behalf.

**My actual recommendation, matching what you floated:** free app,
optional paid style packs.

- **Why this fits what's already built:** `.storymaker-style` export/
  import already exists as a real package format. A "premium style pack"
  is the same file format with a license check in front of it — small
  addition, not a rearchitecture.
- **Concretely, when you're ready:** pick a payment processor that
  handles license-key delivery for you (LemonSqueezy and Gumroad both do
  this well for indie desktop software, minimal backend needed) → sell a
  style pack as a digital product → the buyer gets a license key by email
  → Story Maker gets one new screen: "Redeem a style pack" (key input →
  validate against the processor's API → unlock the `.storymaker-style`
  file). That's genuinely a single afternoon of engineering once the
  processor account exists, and I'm glad to build the app side of it the
  moment you have one.
- **What I'd avoid:** subscriptions. BYOK is a real, load-bearing part of
  this app's identity (no markup on generation, you see exactly what you
  spend — the cost meter shipped tonight leans into that). A subscription
  on top of BYOK reads as double-charging and undercuts the actual pitch.

## 6. "Power-user density"

**Status: fixed, the good way — routed people to something that already
existed.**

Simple Mode — a guided, single-path flow (Story → Look → Board → Make →
Deliver, five rooms in the sidebar instead of thirteen) — already existed
and was already well-built. It just was never the default. Every new
install has been landing straight in Studio Mode's full thirteen-tab
interface, with nothing telling a first-time user Simple Mode exists.

Flipping the literal default was risky — `storymaker-experience-mode`
being unset can't distinguish "brand new" from "you, who's simply never
touched this specific setting." I used `storymaker-generation-view` as a
proxy instead: it's written the first time any Shot Director panel opens,
which any real production work would have done at least once. Present →
stay in Studio. Absent → default to Simple.

Verified live both directions: a fully cleared profile lands in Simple
Mode; a profile carrying that one signal lands in Studio Mode. Your own
installation has extensive real usage in its diagnostics log (real
`gpt-image-2.5-sunburst` jobs completing, going back through tonight) — it
should land in Studio Mode exactly as before. If it doesn't, that's the
one thing from tonight worth telling me about first.

*(0.4.72)*

## 7. "No marketing site"

**Status: a real landing page exists. Private, yours to share when ready.**

Built as a Claude Artifact (private by default — nobody sees it until you
choose to share it): **https://claude.ai/code/artifact/89ff7761-76da-45e9-a085-7e957c8be1f6**

Not a template — built from the app's own actual brand identity (the two
new splash pieces as real hero/interlude art, the same violet/cyan/amber
palette this session has been using in-app all along), structured around
the product's own vocabulary rather than generic SaaS sections: a
"Production Call Sheet" instead of a feature grid, an "Engines" section
naming every real connected provider plus local ComfyUI, a closing "slate"
styled like an actual clapperboard. Bricolage Grotesque + Archivo + JetBrains
Mono, not the Inter-and-gradient-hero look every AI tool defaults to.

This is a real domain/hosting decision waiting on you, same as code
signing below — the Artifact link works today and needs nothing from you
to be shareable as-is; a real `storymaker.app`-type domain is a separate,
later step if you want one.

## 8. "No code signing"

**Status: cannot do — needs a real purchase and business verification.
Here's exactly what to do when you're ready.**

I cannot buy a code-signing certificate on your behalf — that's a real
financial transaction requiring your business/identity details, squarely
outside what I should ever do without you directly in the loop.

**When you're ready:**
- **Cheapest real option:** a standard OV (Organization Validation) code
  signing certificate, ~$70-250/year depending on the CA (DigiCert,
  Sectigo, SSL.com are the common ones). This removes the "unknown
  publisher" SmartScreen warning after enough install reputation builds up
  — not instantly, but it starts the clock.
- **Faster trust, more expensive:** an EV (Extended Validation) certificate
  on a hardware token, ~$300-500/year. SmartScreen trusts these
  essentially immediately, no reputation-building period, but they
  require a stricter identity-verification process and the token itself.
- Once you have either, `electron-builder`'s `win.certificateFile` /
  `certificatePassword` config (or Azure Trusted Signing / a signing
  service token) is a small `package.json` change — the build pipeline
  itself is already set up to receive it.

---

## Backlog — real ideas, not started, scoped for whoever picks them up next

These are the remaining items from "all 7" — each is a genuine feature
build, not a quick fix, so rather than rush weaker versions of all four
tonight, here's what each one actually needs:

**Voice + lip-sync.** Needs a voice provider — ElevenLabs is the obvious
fit (voice cloning, a real API, matches the BYOK pattern every other
provider in this app already follows). Scope: a new provider entry in
Model Hub, a generation call in `electron-main.js` following the exact
shape `requestOpenAIShotImage`/`requestFalImage` already establish, and
wiring it to Audio Studio's existing cue system. I didn't start this
because it needs your own ElevenLabs key to verify against, the same
constraint that shaped tonight's ComfyUI and ElevenLabs-adjacent work —
building it blind risks the same class of bug the LTX-Video dimension fix
caught, just without a way to catch it before you hit it.

**Continuity report extension.** The infrastructure already exists —
Style DNA Lock, the drift-check QA pass comparing a frame against its
locked style. Extending it to a full end-of-film pass (walk every
generated frame, flag drift automatically instead of one frame at a time
on request) is a real but contained feature — mostly UI and a loop around
code that's already proven.

**Genre starter kits.** Content work more than engineering: pair a handful
of story-structure templates (3-act short, explainer, product ad) with
the 40+ styles already in the library. Needs real editorial thought on
what the templates actually say, not just a UI shell.

**Community style-sharing.** The `.storymaker-style` export format already
exists. A real shared gallery needs a hosting decision (even a lightweight
one — a shared folder, a simple web listing) that's genuinely yours to
make, not mine to improvise.

---

## Everything that shipped tonight, in order

| Version | What |
|---|---|
| 0.4.68 | Rough cut: removed dead duplicate, fixed wrong "silent" copy, renamed to "Assemble rough cut" |
| 0.4.69 | Estimated spend panel on Delivery |
| 0.4.70 | Local crash/error diagnostics + "Open diagnostics log" in Settings |
| 0.4.71 | Auto-updater wiring (electron-updater + GitHub Releases) |
| 0.4.72 | New installs default to Simple Mode |

All on GitHub (`main`, pushed via the established orphan-snapshot
procedure — same caveat as always: this is not a Release, see §4 above).
All in `Story Maker Backup 0.4.72 - 2026-09-08` on your Desktop, installer
+ portable + codebase zip. The installed app on this PC is 0.4.72 and
launches clean.

One pre-existing, unrelated finding surfaced by `npm audit` while adding
`electron-updater`: Electron itself (41.7.2, already pinned before
tonight) has a known high-severity advisory, fixed in 41.10.7+. I didn't
bump it tonight — an Electron version change touches enough surface area
(window creation, IPC, the works) that it deserves its own dedicated test
pass, not a rushed addition to an already full night. Worth doing soon;
`npm audit fix --force` will do it, then a full `test:release` + manual
smoke pass before shipping it.
