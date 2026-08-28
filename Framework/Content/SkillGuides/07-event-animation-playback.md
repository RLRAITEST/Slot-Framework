# 07 — Event-driven playback (book events → animation)

## Why

Gap-brief §4 and recipe 12: math and UI must share one event catalog. Upstream `event-animation-designer` plus `frontend-integration.md` say the frontend is a **deterministic event player** — no client-side payout math. Their example types (`spinStart`, `winLine`) are **wrong**. Use this Framework’s types.

## How it maps here

Canonical catalog (extend only via GDD §12):

| `type` | Math | Frontend |
|---|---|---|
| `reveal` | after draw | show board |
| `winInfo` | after eval | highlight wins |
| `tumbleBoard` | after cascade | drop/refill |
| `setWin` / `setTotalWin` / `finalWin` | wallet totals | HUD + win screens |
| `freeSpinTrigger` / `freespinUpdate` / `freespinEnd` | FS flow | FS UI |
| custom | `game_events.py` | new handler + Storybook story |

Web-sdk: `bookEventHandlerMap` (name as in the sample app). After fork, `apps/<game_id>/` must handle **exactly** the types math emits.

## When

After fork-lock and sample copy. First pass: delete or stub handlers the GDD marked `drop`; add handlers for `add`. Storybook before live RGS.

## Instructions

### 1. Copy the catalog into both trees

After fork-lock:

1. Keep the table in the GDD (source of truth in Framework).
2. **Copy** the same table into `SlotFolder/math/games/<game_id>/events.md`.
3. Mirror types in the web app (comments or a ts type union next to `bookEventHandlerMap`).

Do not `import` from `/Framework`.

### 2. Playback rules

1. Disable spin when `play` starts (live) or when Storybook spin starts.
2. Play events **in array order**. Do not reorder for “nicer” animation.
3. `reveal`: render grid from payload; do not guess symbols.
4. `winInfo`: highlight positions and amounts from payload; do not recompute clusters.
5. `tumbleBoard`: animate drop/refill from payload.
6. Wallet events: HUD uses ×100 book scale ([01](01-currency-scales.md)).
7. FS events: remaining spins and mode UI follow events, not a local counter that can drift.
8. Re-enable spin only after the **last** event’s animation **and** (live) end-round policy from the kit.

If `winInfo` contains `basePayout`, `appliedMultiplier`, and `payout`, consistency check (upstream): `payout ≈ (basePayout * appliedMultiplier) / 100` — only if those fields exist in **your** kit events. If they do not, skip; do not add fields to match the upstream skill.

### 3. Timeline per event type

For each catalog row, write (in GDD or a copied `apps/<game_id>` comment):

| Field | Content |
|---|---|
| `type` | catalog name |
| Handler | function / story name |
| Duration | ms (or “kit default”) |
| Interruptible | yes/no (turbo/skip) |
| On skip | jump to end of **this** event, never skip later events’ **data** |

Turbo may shorten duration; it must not drop `winInfo` or `finalWin` ([11](11-autoplay-and-turbo.md)).

### 4. Add a book event (recipe 12)

1. Add GDD §12 row (name, when emitted, payload shape).
2. Emit from math (`game_events.py` or sample equivalent) immediately after the logic step.
3. Add handler in `bookEventHandlerMap`.
4. Add a Storybook story with a **fixture book** (JSON sequence) that contains the new type.
5. Copy updated `events.md` into the math game folder.
6. Run a tiny uncompressed sim; confirm the type appears; confirm UI does not throw.

### 5. Contract errors

Unknown `type`, missing required payload, or events after the round should already be terminal: **stop playback**, log path/type/index, do not invent a board. Live: do not send a second `play`.

### 6. Verification

- [ ] Every GDD §12 `keep`/`add` has a handler.
- [ ] No handler for types math never emits.
- [ ] Storybook: loss, small win, tumble chain, FS trigger/retrigger/end (if in GDD).
- [ ] Replay uses the same handlers ([04](04-rgs-and-replay.md)).

## Do not

- Do not rename events to upstream `spinStart` / `roundResult`.
- Do not calculate wins in Svelte because “Pixi needs the number sooner”.
- Do not emit custom events “for VFX” without a GDD row.

## Source

Upstream: `event-animation-designer`, `stake-game-developer/references/frontend-integration.md`, `rgs-event-contract.md` (event **names** discarded)  
This repo: gap-brief §4, GDD §12
