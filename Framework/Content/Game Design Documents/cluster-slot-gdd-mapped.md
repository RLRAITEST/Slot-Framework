# GDD — Halloween Cluster (mapped)

Mapped from designer upload [`cluster-slot-gdd.md`](cluster-slot-gdd.md) onto the Framework template. This file is the design of record. The upload stays the designer source; do not treat its `@slot-engine/core` note as the stack.

Inspiration reports in `MechanicsInspiration/` are questions, not numbers to copy.

| Field | Value |
|---|---|
| Status | `fork-locked` |
| Owner | (from upload; unnamed) |
| Date | 2026-09-01 |
| `game_id` | `halloween` |
| Source | `cluster-slot-gdd.md` v0.1 + v1 lock 2026-09-01 (theme: classic Halloween / fall) |

**v1 lock:** positional multiplier spots; FS multipliers persist for the whole Free Spins round; no wilds; Base 1× + Buy ~100× (no Ante); **classic Halloween / autumn fall** theme (not winter); tumble safety cap 100; max 100 total FS per round.

---

## 1. Identity

- Working title: Halloween
- Official title (ACP): **TBD** — working title is not final. Must pass [13](../SkillGuides/13-jurisdiction-requirements.md). Do not use Sugar Rush, Bonanza, Megaways, Xways, Gates of …, or Enhanced/Boosted RTP.
- One-sentence thesis: A 7×7 autumn-Halloween cluster tumble where positional multipliers, not the paytable, create the spike.
- Inspiration (names only): Sugar Rush
- Explicitly out of scope: paylines, wilds, jackpots, gamble, Ante Bet, persistent-between-rounds meters, bomb multipliers, a third win type
- Stake.US / social (`social=true`) in this drop: **later**

---

## 2. Fantasy and feel

- Theme / setting: **Classic Halloween / fall** — pumpkins, fallen leaves, bats, ghosts, witches, harvest night. Not winter (no snow, ice, frost). Not a candy-shop skin; candy corn is a Halloween prop only.
- What the player wants on each spin: A tumble chain that marks and doubles spots, then a Free Spins round where those spots keep growing.
- Volatility intent: High — drought-and-spike
- Signature moment: A long tumble lighting pumpkin-sigil spots, then FS where those spots persist and double into a spike

---

## 3. One round

All tumbles belong to one spin. RGS `end-round` waits until the base tumble chain is done **and** Free Spins (if awarded) have finished, including FS summary.

1. Player commits a bet mode (§10): Base or Buy.
2. Grid fills 7×7 (Buy skips to FS entry per math sample / config).
3. Cluster evaluation (all clusters simultaneous).
4. If any cluster: apply positional multipliers covering those cells → payout for this step → mark / upgrade winning cells → remove winning symbols → gravity + refill → re-evaluate. Repeat until a step has no clusters.
5. Count scatters accumulated on this spin (including the tumble chain). If 4+, enter Free Spins; else go to terminal.
6. Free Spins loop (if entered): same tumble rules; **multiplier spots persist and keep upgrading across the whole FS round**; retrigger per §9; until spin count is zero → summary.
7. Round awards / ends. Client plays book events then kit `end-round`.

Persistence:

| State | Within tumble sequence | Cleared at end of base spin | Persists in free spins |
|---|---|---|---|
| Paying symbols | Winning clusters removed; remainder falls; refill from above | New spin is a fresh fill | Same per FS spin (new fill each FS spin) |
| Multipliers / marks | Persist and upgrade through the tumble chain (mark → ×2 → double, cap per §7) | **Yes** — all marks/values cleared | **Yes** — spots persist and grow across the whole FS round; cleared at FS end |
| Scatter count | Counted across the chain; scatters stay on the grid through tumbles; not a paying cluster | Yes | Counted per FS spin for retrigger; do not persist between rounds |
| Feature meters | Running step-win / tumble multiplier HUD | Yes | FS spin counter + FS total win until summary; then clear |

No state persists between **rounds**.

---

## 4. Grid

| Field | Value |
|---|---|
| Reels × rows | 7 × 7 (49 cells) |
| Why this size | Cluster min 5 on 49 cells; matches the Sugar Rush-class hit threshold vs board size |
| Reel / position restrictions | None specified — any paying symbol or scatter may land anywhere unless math later restricts scatter |
| Wilds | **No** |
| Scatter | Yes. 4+ anywhere on the grid (not adjacency) during one spin’s tumble chain triggers FS. Pays no cash |

---

## 5. Win evaluation (decision, not a sample name)

| Question | Answer |
|---|---|
| Must matches be adjacent to pay? | yes |
| If adjacent: connected component of N+ same symbol? | yes |
| Connectivity | 4-dir (orthogonal only; no diagonals) |
| Minimum count or cluster size | 5 |
| Can several symbol types pay on the same grid state? | yes — all clusters paid simultaneously |
| Do wilds substitute into pays? | no |

**Derived win model:** `cluster`

---

## 6. Symbol set

Payouts as multiples of **total bet**. Upload tables are **illustrative**, not RTP-signed. Art names are classic Halloween / fall placeholders; ids are stable.

10 paying + 1 scatter. **No wild. No bomb/multiplier reel symbol** — multipliers are positional cell marks (§7).

| Id | Role | Pay sketch (5–6 / 7–8 / 9–10 / 11–14 / 15+) | Placeholder art |
|---|---|---|---|
| L1 | pay | 0.10 / 0.25 / 0.50 / 1.00 / 2.50 | maple leaf |
| L2 | pay | 0.15 / 0.35 / 0.65 / 1.30 / 3.25 | acorn |
| L3 | pay | 0.20 / 0.45 / 0.80 / 1.60 / 4.00 | bat |
| L4 | pay | 0.25 / 0.55 / 0.95 / 1.90 / 5.00 | spider |
| L5 | pay | 0.30 / 0.65 / 1.10 / 2.20 / 6.00 | candy corn |
| H1 | pay | 0.50 / 1.50 / 3.00 / 6.00 / 15.00 | jack-o-lantern |
| H2 | pay | 0.75 / 2.25 / 4.50 / 9.00 / 22.50 | ghost |
| H3 | pay | 1.00 / 3.00 / 6.00 / 12.00 / 30.00 | witch hat |
| H4 | pay | 1.50 / 4.50 / 9.00 / 18.00 / 45.00 | coffin |
| H5 | pay | 2.00 / 6.00 / 12.00 / 25.00 / 60.00 | cauldron of witch brew |
| FS | scatter | none | tombstone with **FS**; 4+ anywhere → Free Spins |

---

## 7. Multipliers

**Family: positional spots.** Agrees with §5 `cluster` and `games/0_0_cluster`. Upload §4 bombs are **out of scope** for v1.

| Field | Value |
|---|---|
| Family | positional spots |
| Base game | On a winning cell: 1st hit marks; 2nd hit creates ×2; later hits double. Applies to any winning cluster that covers the cell. Multiple spots in one cluster are **summed**. |
| Free spins | Same upgrade rules. Spots **persist and keep growing for the whole FS round** (not reset between FS spins). Cleared when FS ends. |
| Stacking | add |
| Cap | Per-spot cap: follow cluster sample (reference ×128 unless kit differs). Game win cap 20,000× (§11) |
| Persistence | matches §3 table |

---

## 8. Tumble

| Field | Value |
|---|---|
| Enabled | yes |
| What is removed | Winning cluster symbols |
| What stays | Non-winning paying symbols; scatters; positional marks/values on cells (marks live on the cell, not on the removed symbol) |
| Gravity / refill | Down; new symbols from above |
| Chain cap | Player-facing: until no clusters. Math safety cap: **100** tumble steps per spin (base or FS spin). If hit, stop the chain and continue the round. |

---

## 9. Feature (free spins)

| Field | Value |
|---|---|
| Trigger | 4+ FS scatters anywhere, counting the whole tumble chain; base and buy |
| Award | 4 → 10, 5 → 12, 6 → 14, 7+ → +2 per extra scatter (illustrative; tune in math) |
| Retrigger | yes, same table. **Cap: 100 total FS awarded in one round** (initial + retriggers). Extra awards that would exceed 100 are truncated. |
| What is different vs base | Positional spots persist across the whole FS round; enhanced mark/upgrade behaviour if the cluster sample already weights FS differently |
| Feature win cap vs game win cap | Same game cap 20,000× total bet |

Buy Feature (§10) enters this feature without a natural trigger; award table from the sample/config (tune to RTP).

---

## 10. Bet modes

| Mode | Cost | What changes vs base |
|---|---|---|
| Base | 1× | Single paid spin |
| Buy | 100× (tune 90–100× to RTP) | Instant Free Spins entry |

No Ante in v1.

All shipped modes must land within 0.5% RTP of each other ([13](../SkillGuides/13-jurisdiction-requirements.md)).

---

## 11. Math targets

Targets only. Proof is sims.

| Target | Value | Notes |
|---|---|---|
| RTP (default) | 96.50% | operator variants 94.00% / 92.00% later if required |
| Max win (× stake) | 20,000× | must be achievable at 1 in 20M or more frequent |
| Hit frequency intent | ~30–35% any win | ≈ 1-in-2.9–3.3 |
| Feature frequency intent | ~1 in 120–150 base spins | Buy bypasses this |
| Volatility intent | high | |

---

## 12. Book events

Closed catalog: **kit names from `0_0_cluster` / `apps/cluster`**, snapshotted in `SlotFolder/math/games/halloween/events.md`. Do not add bomb events.

| `type` | Math emits | Frontend handles | Ours? |
|---|---|---|---|
| `reveal` | after draw | show board | keep |
| `winInfo` | after eval | highlight wins | keep |
| `updateTumbleWin` | tumble wallet | tumble HUD | keep |
| `tumbleBoard` | after cascade | drop/refill | keep |
| `setWin` / `setTotalWin` / `finalWin` | wallet totals | HUD + win screens | keep |
| `freeSpinTrigger` / `freeSpinRetrigger` / `updateFreeSpin` / `freeSpinEnd` | FS flow | FS UI | keep |
| `updateGrid` | after spot mark/upgrade | multiplier overlay | keep |
| `updateGlobalMult` | if kit emits | global mult HUD | keep |
| `createBonusSnapshot` | resume helper | handler in sample | keep |
| bomb / custom VFX types | — | — | drop |

---

## 13. Frontend / `parts.txt`

Static board icons live in `SlotFolder/web/apps/halloween/static/assets/sprites/symbolsStatic/` (`L1`–`L5`, `H1`–`H5`, `S`). Background, ramme, and logo are wired. SDK chrome still covers HUD, win spines, and FS screens. Thumbnail: **bright autumn orange**, no dark edges, no baked wording/multipliers (a black-night tile will fail ACP).

| Part | SDK chrome / copy asset / cut | Notes |
|---|---|---|
| slot-ramme | copy asset | `slot-ramme.png` / `slot-ramme-nobg.png` ingested; kit frame still on board |
| slot-logo | copy asset | `slot-logo.png` ingested; kit loader spine still on loading screen |
| slot-thumbnail | cut until art | bright pumpkin/leaf; no baked text; avoid dark edges |
| slot-background | copy asset | `slot-background.png` ingested; kit spine still on canvas |
| slot-win_screen | SDK chrome | Big/Mega/Super |
| slot-big_win_screen | SDK chrome | |
| slot-mega_win_screen | SDK chrome | |
| slot-low_paying_symbols | copy asset | L1–L5 static PNGs ingested |
| slot-high_paying_symbols | copy asset | H1–H5 static PNGs ingested |
| slot-scatter_symbol | copy asset | `S.png` tombstone with FS |
| slot-font | SDK chrome | digit sheet also at `slot-multiple_numbers.png` |
| slot-multiple_symbol | copy asset | mark + numbers ingested; not wired to spots yet |
| slot-wilds | cut | none |
| slot-symbol_win_animation | SDK / later art | cluster burst |
| slot-symbol_anticipation_animation | SDK | |
| slot-free_spin_trigger_animation | SDK / later art | |
| slot-spin_button | SDK chrome | |
| slot-autoplay_button | SDK chrome | |
| slot-bet_selector | SDK chrome | |
| slot-max_bet_button | SDK chrome | |
| slot-settings_menu | SDK chrome | |
| slot-explainer_menu | SDK chrome | |
| slot-paytable_screen | SDK chrome + GDD §6 numbers | |
| slot-loading_screen | SDK chrome | |
| slot-bg_music_base_game | cut until audio | |
| slot-bg_music_free_spins | cut until audio | |
| slot-reel_spin_lyd | cut until audio | tumble/drop |
| slot-symbol_land_lyd | cut until audio | |
| slot-win_jingles | cut until audio | |
| slot-button_click_lyd | SDK / cut | |
| slot-free_spin_musik | cut until audio | |
| slot-ambient_loop_free_spins | cut until audio | |
| slot-explainer_screen | SDK chrome | |

---

## 14. Stake mapping (fork gate)

Authorized. Copy `games/0_0_cluster` → `SlotFolder/math/games/halloween` and `apps/cluster` → `SlotFolder/web/apps/halloween`. Isolation: no imports from `/Framework`.

| Field | Value |
|---|---|
| `game_id` | `halloween` |
| Math sample | `games/0_0_cluster` |
| Web app | `apps/cluster` |
| Grid delta vs sample | 7×7 — confirm kit grid; change `game_config.py` if not already 7×7 |
| Event delta vs sample | keep sample catalog (§12); no bomb events |
| Config work | `game_config.py`: id `halloween`, 7×7, paytable §6, RTP 96.50, win cap 20000, BetModes Base 1× + Buy 100×, no Ante |

Stack: Math = [math-sdk](https://github.com/StakeEngine/math-sdk). Web = [web-sdk](https://github.com/StakeEngine/web-sdk) (Svelte + Pixi). All game code under `SlotFolder` only.

**Fork lock checklist**

- [x] §5 derived win model is not `other` (`cluster`)
- [x] §7 multiplier family agrees with that model (positional spots)
- [x] §12 has no event the other side does not list (keep sample types only)
- [x] Math and web rows above are the matching pair
- [x] State list written; tumble cap 100; FS cap 100
- [x] FS retrigger cap numeric (100 total FS)
- [x] Persistence table complete

---

## 15. Aesthetics

- Look / palette: classic Halloween / fall — pumpkin orange, harvest gold, hay, deep purple, black **on the game board**; ACP thumbnail stays **bright autumn**, not a dark night tile
- Symbol style: L1–L5 simple autumn/Halloween props (leaf, acorn, bat, spider, candy corn); H1–H5 heroes (jack-o-lantern, ghost, witch hat, coffin, witch-brew cauldron)
- HUD / chrome: SDK first
- Screens: loading, paytable, win-tier banners, FS intro/summary
- What must be original art vs SDK chrome: symbols, logo, background, thumbnail, audio original later; buttons/panels SDK until a skin pass

---

## 16. Open questions (post-lock, do not unblock development)

- Official ACP title (working title “Halloween” is generic — rename before publish)
- Exact Buy cost after RTP sims (start 100×)
- Per-spot multiplier cap if the kit differs from ×128
- Operator RTP variants 94% / 92% — not this drop unless asked
- Production art/audio
