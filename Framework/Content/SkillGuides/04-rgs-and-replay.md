# 04 — RGS wallet flow and replay

## Why

Storybook never proves Stake. ACP needs a live RGS: authenticate, play, end-round, and **mandatory replay**. Upstream `stake-engine-rgs.md` and `stake-engine-replay.md` are the missing platform contract. Gap-brief §6 already says platform access is a publish gate; this file is the how.

## How it maps here

| Local | Live |
|---|---|
| `pnpm run storybook --filter=<game_id>` | fake/local books, no wallet |
| `pnpm run dev --filter=<game_id>` + session query string | real `play/` books |
| Assembled static folder on ACP | production RGS |

Web-sdk samples already implement most of this. Your job is: do not break it when you skin `apps/<game_id>`, and do not hardcode the RGS host.

## When

After Init, fork-lock, sample copy, Storybook green on **your** events. You need an [engine.stake.com](https://engine.stake.com/) account to complete this guide. You can read it earlier; you cannot execute the live steps without access.

## Instructions

### A. Launch URL (never hardcode host)

Required query fields (names as documented by Stake; web-sdk will read them):

| Param | Role |
|---|---|
| `sessionID` | player session |
| `lang` | ISO 639-1 |
| `device` | `mobile` or `desktop` |
| `rgs_url` | RGS base URL — **must** be taken from the query string |

Example shape:

```text
index.html?sessionID=...&lang=en&device=desktop&rgs_url=...
```

After ACP publish: Developer → Start game session → Launch. Paste that query string onto local `pnpm run dev` so the UI talks to the live RGS.

**Test:** change `rgs_url` and confirm network calls go to the new host.

### B. Wallet call order

1. **`POST /wallet/authenticate`** — first call on load. Reads `balance`, `config` (`minBet`, `maxBet`, `stepBet`, `betLevels`), maybe an in-flight `round`. If skipped, later calls fail with `ERR_IS`.
2. **`POST /wallet/play`** — one round; returns the event stream (book). Amount is ×1e6 ([01-currency-scales.md](01-currency-scales.md)).
3. **`POST /wallet/end-round`** — mandatory when win > 0 or the kit requires an explicit close. Finalizes the bet.
4. **`POST /wallet/balance`** — refresh when needed.
5. **`POST /bet/event`** — in-round progress for reconnect/resume if the kit uses it.

Never play / balance / end-round before authenticate.

### C. Amount and bet levels

- Money integers: `1_000_000` = `1.0` display.
- Use **only** bet levels returned by authenticate `config`. Do not invent a bet ladder.
- Upstream approval bands (verify on current docs): USD $0.10–$1,000 default $1.00; also JPY / MXN templates. Stake.US uses `us_` prefix templates.
- Persist selected bet across refresh mid-round; do not snap back to default if the RGS still has the round.

### D. Error codes to handle in UI

Client 400:

| Code | Meaning | Player-facing |
|---|---|---|
| `ERR_VAL` | invalid request | stop; do not retry blindly |
| `ERR_IPB` | insufficient balance | no duplicate spin |
| `ERR_IS` | invalid/expired session | re-auth or reload |
| `ERR_ATE` | auth token expired | re-auth |
| `ERR_GLE` | gambling limits | stop autoplay |
| `ERR_LOC` | invalid location | stop |

Server 500: `ERR_GEN`, `ERR_MAINTENANCE` — no duplicate `play` until recovered.

Spin button: disable when a request is in flight; re-enable only after terminal events **and** animations finished ([07-event-animation-playback.md](07-event-animation-playback.md)).

### E. Replay (mandatory for approval)

Query params:

- Required: `replay=true`, `game`, `version`, `mode`, `event`, `rgs_url`
- Optional (as documented): `currency`, `amount`, `lang`, `device`, `social`

Fetch:

```text
GET {rgs_url}/bet/replay/{game}/{version}/{mode}/{event}
```

No `sessionID`. Public URL. Expected fields include `payoutMultiplier`, `costMultiplier`, `state`.

UX:

1. Auto-fetch replay payload on load (loading indicator).
2. Explicit **Play** to start playback (or kit equivalent).
3. Hide/disable betting UI. No live `play/`.
4. Full animation + audio of that event stream.
5. End: result + **Play Again** (replay only). Never switch replay → real betting.
6. Show cost, multiplier, and real bet cost clearly.

QA per mode: loss, normal win, big win, max-win cap, bonus/FS trigger.

### F. `end-round` vs book events

RGS `end-round` is a **wallet** call. Book events (`finalWin`, etc.) are **playback**. Frontend does not invent the win; it displays events then closes the round when the kit says to. Align “round complete” with GDD §3 (what the RGS waits on).

## Do not

- Do not hardcode `engine.stake.com` or any RGS host in the app.
- Do not call wallet endpoints from Storybook.
- Do not implement a second RGS client next to the web-sdk one.
- Do not skip replay because Storybook “already plays books”.

## Source

Upstream: `stake-game-developer/references/stake-engine-rgs.md`, `stake-engine-replay.md`  
Official: https://stake-engine.com/docs  
This repo: `SlotFolder/README.md` (session query string), gap-brief §6
