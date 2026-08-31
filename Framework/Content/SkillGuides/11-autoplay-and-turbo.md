# 11 — Autoplay and turbo (presentation only)

## Why

Stake approval requires autoplay confirmation, a visible stop, and no one-click start on expensive modes. Turbo/quick spin must **not** change math. Upstream `autoplay-system-designer` and `turbo-spin-designer` encode that. Web-sdk HUD likely already implements both; this guide is the policy to preserve and QA.

## How it maps here

`parts.txt`: `slot-autoplay_button`, `slot-spin_button`. SDK chrome first; only replace art. GDD does not need a new mechanic for turbo. Autoplay stop-on-feature should match GDD §9 (e.g. stop when FS triggers) if you expose that option.

## When

After Storybook spin path works. Before [05](05-approval-and-compliance.md). Optional stop-conditions can wait; confirmation + stop button cannot.

## Instructions

### Autoplay

1. **Start** requires a confirmation step (never 1-click into auto-spin).
2. Confirmation shows remaining rules: spin count, and if a mode costs **> 2×** (ante/buy), that cost is explicit ([05](05-approval-and-compliance.md)).
3. While running: spin control becomes **Stop**; remaining count visible.
4. Stop conditions (check **before** each spin):
   - player Stop
   - remaining count reached
   - balance below min bet (`ERR_IPB`)
   - session errors (`ERR_IS`, `ERR_ATE`, `ERR_GLE`, `ERR_LOC`)
   - optional: any win / FS trigger — only if the UI offers those toggles; then implement them deterministically
5. Connection loss: stop; do not queue plays. Resume is a new explicit start.
6. Autoplay must not skip authenticate/play/end-round order ([04](04-rgs-and-replay.md)).
7. Social mode: no “AutoBET” / “Bet” in labels ([05](05-approval-and-compliance.md), [13](13-jurisdiction-requirements.md)).

QA: 1 spin, N spins, FS trigger during autoplay, insufficient balance, stop mid-flight (no double `play`).

### Turbo / quick spin

1. Modes: at least **normal** and whatever the kit offers (quick/turbo). Table of phase durations (ms) — start from sample constants; do not zero them out.
2. Turbo changes **animation duration only**. Same book, same `payoutMultiplier`.
3. Stop/skip: fast-forward **current** animation; still process every event in order. Never skip `winInfo` / `finalWin` / FS trigger events.
4. Minimum readable time on wins and feature intros (do not 0ms the FS banner).
5. Lock speed toggles during resolve if the sample does; changing turbo mid-tumble is a desync source.
6. Replay uses the same event order; turbo may apply if the kit allows it in replay — still no betting.

QA: normal vs turbo on the **same** Storybook book; HUD totals identical. Feature trigger still visible.

## Do not

- Do not “optimize RTP feel” by dropping tumbles in turbo.
- Do not start autoplay from the buy confirmation in one combined click.
- Do not implement a second autoplay state machine beside the SDK’s.

## Source

Upstream: `autoplay-system-designer`, `turbo-spin-designer`  
Approval: autoplay confirm, >2× mode confirm, spacebar still spins when not in autoplay
