# 13 — Jurisdiction requirements

## Why

Stake reviews wording, currency display, naming, and (for Stake.US) social-game language separately from math/frontend polish. Gap-brief item 5 only pointed at a summary in [05](05-approval-and-compliance.md). This file is the jurisdiction punch list, including title/thumbnail rules that sit on the same [approval-guidelines](https://stake-engine.com/docs/approval-guidelines) tree.

Official: [Jurisdiction requirements](https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements)

Numeric bands and banned phrases can drift. If this file disagrees with that page, **the page wins**.

## How it maps here

| Concern | Where it lives |
|---|---|
| Title / series confusion | GDD §1 + `jurisdiction.mjs --title` |
| RTP / max-win / hit-rate | [03](03-rtp-signoff.md) + `jurisdiction.mjs --report` |
| Thumbnail brightness / no baked text | `parts.txt` `slot-thumbnail` + `optimize-assets.mjs` |
| Stake.US social copy | Default build is real-money; `social=true` later |
| Authenticate / play / spacebar | Live QA in [04](04-rgs-and-replay.md) / [12](12-qa-before-acp.md) |

Copy [`Framework/Content/Tooling/`](../Tooling/README.md) into `SlotFolder/math/games/<game_id>/tools/` after fork-lock. Do not import `/Framework`.

## When

- **Title:** while naming (GDD §1). Re-check before ACP.
- **Math gates:** after sim / LUT optimize, before math publish.
- **Thumbnail:** when composing the ACP tile (Tile Editor).
- **Social:** only if Stake.US / `social=true` is in scope for this drop.

## Instructions

### 1. Title (all jurisdictions)

Unique. Must not imply affiliation with an established publisher or series.

Banned in the title (and obvious close variants):

- `Megaways`, `Xways`
- `Enhanced` / `Boosted` (or any synonym) `RTP`
- `Gates of …`
- `… Bonanza`

Reviews stop if **two or more** brand-confusion criteria apply (similarity to existing titles is one of them). Do not lean on a competitor’s name in the working title “as a placeholder”.

```sh
node tools/jurisdiction.mjs --title="Working Title"
```

### 2. Content safety

Assets and imagery must not be offensive, discriminatory, or inappropriate. No Stake™ / Kick™ branding in art you created. No appeal to minors.

### 3. Game thumbnail (ACP Tile Editor)

The tile is composed in the dashboard (background, foreground, gradient, title layer). Do not bake the title into the PNG.

- [ ] Tile generally **bright**; does not clash with the Stake lobby background.
- [ ] **Dark edges** avoided (they disappear into Stake chrome).
- [ ] Background bright and appropriate.
- [ ] Foreground appropriate; key focus area filled.
- [ ] Gradient a similar colour to the background (legibility, not a second brand colour).
- [ ] Title fits **inner guidelines**; not hard against the edges.
- [ ] **No wording or multipliers** on background or foreground images.

```sh
node tools/optimize-assets.mjs --thumbnail-only
```

Luminance is measurable. Baked text is a **manual** fail.

### 4. Math bands (also [03](03-rtp-signoff.md))

| Gate | Limit |
|---|---|
| RTP | 90%–98% |
| Mode-to-mode RTP | within **0.5%** absolute |
| Advertised max win | achievable; hit-rate **1 in 20,000,000 or more frequent** |
| Base >0-win hit-rate | typical 1-in-3 to 1-in-8; **not rarer than 1 in 20** |

`simulate.mjs`, `build-stake-engine-math.mjs`, and `optimize-luts.mjs` call the same checker after they write a report. math-sdk `make run` still needs:

```sh
node tools/jurisdiction.mjs --report=path/to/report.json
```

### 5. Prechecks / RGS / frontend (live)

Not automated in Tooling. Must still pass:

- [ ] Authenticate with the RGS on launch.
- [ ] Bet/spin control sends a successful `play` request.
- [ ] Space bar bound to bet/spin (when focus is not in an input).
- [ ] Bet levels from `authenticate` (USD / JPY / MXN cases in [05](05-approval-and-compliance.md)).
- [ ] `rgs_url` from the query string ([04](04-rgs-and-replay.md)).

### 6. Stake.US / social (`social=true`)

Later flag. Still keep HUD/copy from painting you into a corner.

Restricted → replacement (your strings; SDK chrome may already swap — verify):

| Avoid | Use |
|---|---|
| Bet | Play |
| Payout (as noun) | Win / Won |
| Cash / Money | Coins |
| Buy / Purchase | Play / Instantly triggered |
| Deposit / Withdraw | Get coins / Redeem |
| Gamble / Wager | Play |
| Stake (as bet) | Play amount |
| Credit / Fund | Balance |
| Currency | Token |
| Cost of | Can be played for |

UI surfaces that must contain **no** restricted word:

- Bet button
- Game info / paytable
- Bet amount field (not “bet amount”)
- Autoplay labels and popups (not “AutoBET”)
- Bonus-buy label and confirmation (no “buy” / “bet”)
- Insufficient-funds error
- Replay window

Also:

- [ ] Support **SC** and **GC**; no `$` prefix on values.
- [ ] Stake.US bet-level template uses the `us_` prefix.

```sh
node tools/jurisdiction.mjs --copy=path/to/assembled-or-i18n.json --social
```

Audit **assembled frontend strings**, not Framework markdown.

## Do not

- Do not treat Tooling as a license to skip the live RGS prechecks.
- Do not enable social wording in the default real-money build.
- Do not import these scripts from `/Framework` into Vite or Python.

## Source

Official: https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements  
Related: https://stake-engine.com/docs/approval-guidelines  
This repo: `Framework/Content/Tooling/jurisdiction.config.json`
