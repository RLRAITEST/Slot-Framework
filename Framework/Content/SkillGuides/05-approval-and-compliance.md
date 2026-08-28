# 05 — Approval and compliance checklist

## Why

Gap-brief item 5 (publish checklist) was empty. Upstream `game-approval-checklist.md`, `stake-engine-frontend-checklist.md`, `compliance-checklist.md`, and `compliance-rules.json` are Stake’s QA/jurisdiction gates. Use this file as the pre-ACP punch list. Confirm any numeric band against current [approval guidelines](https://stake-engine.com/docs) if they drift.

## How it maps here

Two ACP uploads ([root README](../../../README.md)): math `publish_files/` + assembled frontend folder. Two approval requests. This checklist is **both** sides plus jurisdiction. Social-language (Stake.US) is a **later** flag (`social=true`); still list it so copy/HUD do not paint you into a corner.

`parts.txt` explainer/paytable rows are filled using [08-game-info-and-disclaimer.md](08-game-info-and-disclaimer.md).

## When

After [03-rtp-signoff.md](03-rtp-signoff.md) pass, Storybook green, replay implemented ([04-rgs-and-replay.md](04-rgs-and-replay.md)). Before clicking Publish / requesting approval.

## Instructions

Work top to bottom. Unchecked item = do not request approval.

### Prechecks

- [ ] Game is **stateless between rounds** (no persistent jackpot meter, no gamble, no early cashout). In-round tumble/FS is allowed; GDD §3 persistence table must match code.
- [ ] No jackpots, gamble, early cashout.
- [ ] No IP-infringing art; no Stake branding in assets you created.
- [ ] Authenticate succeeds on launch ([04](04-rgs-and-replay.md)).
- [ ] Spin/bet control sends a successful `play` request.
- [ ] Title unique; no trademarked mechanic names (e.g. Megaways, Xways) unless you have rights.
- [ ] Assets not offensive/discriminatory.

### Thumbnail (ACP tile)

- [ ] Bright tile; avoids dark edges that clash with Stake chrome.
- [ ] Background and foreground readable; title inside inner margins.

### Math (see also [03](03-rtp-signoff.md))

- [ ] RTP in 90%–98% (unless current docs say otherwise).
- [ ] All modes within 0.5% RTP of each other.
- [ ] Advertised max win achievable (hit-rate 1 in 20M or more frequent).
- [ ] Base hit-rate reasonable (upstream: typically 3–8, not > 20 for “0-win” style hit-rate — interpret against how the kit reports hit-rate).
- [ ] `publish_files/` integrity ([02](02-book-package.md), [09](09-artifact-validators.md)).

### Frontend build

- [ ] Vite/`base` is relative (`"./"` or whatever web-sdk already sets). No absolute CDN hosts you do not control.
- [ ] Assembled folder: `index.html`, `_app/`, `assets/` as in `SlotFolder/README.md`. Upload **that** folder.
- [ ] Static only; no runtime calls to random third-party analytics.
- [ ] Console/network clean in production mode (no recurring errors).
- [ ] Desktop, mobile, popout/mini-player: board not clipped; wins readable on turbo ([11](11-autoplay-and-turbo.md)).

### Game rules UI

- [ ] Symbol payouts, win method (cluster vs scatter), FS trigger/retrigger, each mode cost.
- [ ] RTP and max multiplier **per mode** if they differ.
- [ ] Disclaimer equivalent to [08](08-game-info-and-disclaimer.md).
- [ ] Sound toggle.
- [ ] Space bar bound to spin/bet (when not in an input field).
- [ ] Autoplay requires confirmation ([11](11-autoplay-and-turbo.md)).
- [ ] Modes costing **> 2×** (e.g. bonus buy) require confirmation; not one-click.
- [ ] Ten wins per mode: HUD matches game rules and book `payoutMultiplier` ([01](01-currency-scales.md)).

### Bet levels

- [ ] Respect authenticate `betLevels` / min / max / step.
- [ ] Refresh mid-spin keeps selected bet.

### Replay

- [ ] All items in [04](04-rgs-and-replay.md) §E.

### Jurisdiction / social (when `social=true` / Stake.US)

Replace restricted words in **your** copy (SDK chrome may already swap; verify):

| Avoid | Use |
|---|---|
| Bet | Play |
| Payout (as noun in some strings) | Win / Won |
| Cash / Money | Coins |
| Buy / Purchase | Play / Instantly triggered |
| Deposit / Withdraw | Get coins / Redeem |
| Gamble / Wager | Play |
| Stake (as bet) | Play amount |
| Credit / Fund | Balance |
| Currency | Token |
| Cost of | Can be played for |

- [ ] No `$` prefix on values in social mode.
- [ ] SC and GC if required.
- [ ] Bet button, autoplay, bonus buy, insufficient-funds, game info, replay chrome: no restricted words.
- [ ] US bet-level template (`us_` prefix) when that jurisdiction is in scope.

### ACP completion

- [ ] Math import + Publish Game → Math → approval requested.
- [ ] Frontend import + Publish Game → Front End → approval requested.
- [ ] Both Approved / Active when Stake says so.
- [ ] Do not upload `/Framework` or raw `SlotFolder`.

## Do not

- Do not treat this file as a license to skip current Stake docs.
- Do not enable social wording in the default (real-money) build unless the kit’s `social` flag is on.
- Do not add a jackpot “because the GDD fantasy wants a meter” without a legal/product stop.

## Source

Upstream: `stake-game-developer/references/game-approval-checklist.md`, `stake-engine-frontend-checklist.md`, `compliance-rules.json`  
Official: https://stake-engine.com/docs/approval-guidelines
