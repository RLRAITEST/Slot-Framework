# 12 — QA before ACP

## Why

Upstream `slot-qa-engineer` is a generic test-plan skill. This Framework needs a **concrete** matrix: GDD vs math books vs Storybook vs live RGS. Use this after first books exist; it is gap-brief implementation step 7–8.

## How it maps here

| Layer | What you test |
|---|---|
| Math | `make run`, [02](02-book-package.md), [03](03-rtp-signoff.md), [09](09-artifact-validators.md) |
| UI | Storybook stories per bookEvent ([07](07-event-animation-playback.md)) |
| Platform | [04](04-rgs-and-replay.md), [05](05-approval-and-compliance.md), [13](13-jurisdiction-requirements.md) |

No cheat debug menu required unless the kit already has one. Prefer fixture books in Storybook.

## When

- **Coding gate:** Storybook + tiny uncompressed books (no Engine account).
- **Publish gate:** live session + replay + this list vs [05](05-approval-and-compliance.md).

## Instructions

### 1. Build the matrix from the GDD

One row per: bet mode × (loss, small win, tumble chain, FS trigger, FS retrigger, max-win if possible). Expected: GDD rule + event `type`s + HUD amounts ([01](01-currency-scales.md)).

### 2. Math tests

- [ ] Small uncompressed run completes.
- [ ] `publish_files/` integrity ([09](09-artifact-validators.md)).
- [ ] RTP sign-off ([03](03-rtp-signoff.md)) or explicitly “preliminary, not for ACP”.
- [ ] No event `type` outside GDD §12.
- [ ] Persistence (GDD §3) observable in event sequences (e.g. multipliers survive tumble if specified).

### 3. Storybook tests

- [ ] Spin, win highlight, tumble, FS UI, win screens.
- [ ] Rapid remount ([10](10-pixi-svelte-lifecycle.md)).
- [ ] Autoplay/turbo if already wired ([11](11-autoplay-and-turbo.md)).
- [ ] Paytable/disclaimer ([08](08-game-info-and-disclaimer.md)).
- [ ] No console errors on the happy path.

### 4. Live / replay tests (account required)

- [ ] Authenticate → play → end-round.
- [ ] Insufficient balance.
- [ ] Refresh mid-round / resume if the kit supports it.
- [ ] Replay: loss, win, FS ([04](04-rgs-and-replay.md) §E).
- [ ] `rgs_url` override.

### 5. Defect log

Each bug: severity (block/approval vs polish), steps, mode, book `id` if known, expected vs actual. Blockers = catalog mismatch, wrong money scale, missing replay, RTP fail, unknown events.

### 6. Sign-off

ACP only if: [05](05-approval-and-compliance.md) complete, [13](13-jurisdiction-requirements.md) title/math/thumbnail (and social if in scope) pass, math preliminary-or-final RTP labeled honestly, no open blockers. Residual risks listed (e.g. “social mode not in this drop”).

## Do not

- Do not use live RGS as the first test of a new bookEvent (Storybook fixture first).
- Do not sign off UI against the cluster sample while math is scatter (or the reverse).

## Source

Upstream: `slot-qa-engineer`  
This repo: gap-brief §6 and implementation order 7–8
