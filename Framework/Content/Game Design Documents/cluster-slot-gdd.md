# Game Design Document
## Working Title: *[TBD]* — Cluster-Pays Candy Slot (Sugar Rush–style)

**Doc version:** 0.1 (draft)
**Genre:** Video slot — cluster pays, tumble/avalanche
**Engine/Stack:** `@slot-engine/core` + PixiJS

> Note: No theme was specified, so this document assumes a candy/confectionery skin (matching the Sugar Rush reference) purely as a working placeholder for symbol naming. Every symbol is defined by *tier*, not by specific art, so the whole doc reskins cleanly if the theme changes later.

---

## Table of Contents
1. Game Overview
2. Grid & Cluster Mechanic
3. Symbols & Paytable
4. Multiplier (Bomb) System
5. Free Spins Feature
6. Optional Modules (Ante Bet, Buy Feature)
7. Math Model Targets
8. Game Flow / State Machine
9. UI/UX
10. Technical Notes
11. Open Questions

---

## 1. Game Overview

| Field | Value |
|---|---|
| Grid | 7 columns × 7 rows (49 cells) |
| Win mechanic | Cluster Pays (orthogonally connected symbols) |
| Min cluster size | 5 |
| Core loop | Spin → Cluster check → Tumble (repeat) → Multiplier resolve → Payout |
| Volatility | High |
| Target base RTP | 96.00%–96.50% (configurable down-variants for operator RTP requirements, e.g. 94.00%, 92.00%) |
| Target max win | 20,000× total bet (cap; adjustable) |
| Paylines | None — cluster pays uses total-bet multipliers, not per-line pay |

---

## 2. Grid & Cluster Mechanic

- The grid is filled with symbols every spin (7×7 = 49 cells).
- A **cluster** is 5 or more identical symbols connected **horizontally or vertically** (diagonal connections do not count).
- All clusters on the board are evaluated and paid **simultaneously**.
- Winning symbols burst/are removed from the grid.
- Symbols above empty cells fall to fill the gap (gravity), and new symbols drop in from above to refill the top.
- This "tumble" repeats automatically as long as new clusters keep forming — a single spin can chain through many tumbles.
- A spin ends when a tumble step produces no new clusters.

---

## 3. Symbols & Paytable

11 paytable-relevant symbol types: **5 low pay, 5 high pay, 1 free-spin (scatter) symbol**, plus the non-paytable **Multiplier symbol** (see Section 4).

### Low pay (L1–L5)
Simple candy/fruit shapes — flat colors, least detail.

| Symbol | 5–6 | 7–8 | 9–10 | 11–14 | 15+ |
|---|---|---|---|---|---|
| L1 (blue) | 0.10× | 0.25× | 0.50× | 1.00× | 2.50× |
| L2 (green) | 0.15× | 0.35× | 0.65× | 1.30× | 3.25× |
| L3 (purple) | 0.20× | 0.45× | 0.80× | 1.60× | 4.00× |
| L4 (red) | 0.25× | 0.55× | 0.95× | 1.90× | 5.00× |
| L5 (yellow) | 0.30× | 0.65× | 1.10× | 2.20× | 6.00× |

### High pay (H1–H5)
More detailed/rendered candy hero symbols.

| Symbol | 5–6 | 7–8 | 9–10 | 11–14 | 15+ |
|---|---|---|---|---|---|
| H1 (lollipop) | 0.50× | 1.50× | 3.00× | 6.00× | 15.00× |
| H2 (donut) | 0.75× | 2.25× | 4.50× | 9.00× | 22.50× |
| H3 (cupcake) | 1.00× | 3.00× | 6.00× | 12.00× | 30.00× |
| H4 (chocolate bar) | 1.50× | 4.50× | 9.00× | 18.00× | 45.00× |
| H5 (candy cane) | 2.00× | 6.00× | 12.00× | 25.00× | 60.00× |

All values are × **total bet**, not per line. These are illustrative starting points for a math/balancing pass, not final RTP-verified figures.

### Free Spin symbol (scatter)
- Pays no direct cash prize.
- Any 4+ appearing anywhere on the grid (not adjacency-based) triggers Free Spins — see Section 5.

---

## 4. Multiplier (Bomb) System

- After each tumble step (including the very first fill), there's a chance for one or more grid cells to spawn a **Multiplier symbol** instead of a normal symbol.
- Multiplier symbols carry a value from a weighted table, e.g.:

| Value | Rarity |
|---|---|
| 2×, 3× | Common |
| 5×, 10× | Uncommon |
| 15×, 25× | Rare |
| 50×, 100× | Very rare |
| 250×+ | Ultra rare (high-volatility moment) |

  (Exact weights need simulation/math-team balancing — this table is a shape, not final probabilities.)
- If a Multiplier symbol is adjacent to / consumed by a winning cluster, it's removed from the board and its value is banked.
- **Resolution rule:** all Multiplier values banked during a single tumble step are **summed** (not multiplied together), and that sum is applied once to the total win of that tumble step.
- Banked multipliers reset each new tumble step (each step's multiplier total only applies to that step's win).

---

## 5. Free Spins Feature

- **Trigger:** 4+ Free Spin symbols landing anywhere on the grid within one spin (including its tumble chain).
- **Award table** (example, needs math-team tuning):

| Scatters landed | Free spins awarded |
|---|---|
| 4 | 10 |
| 5 | 12 |
| 6 | 14 |
| 7+ | +2 per extra scatter |

- **Retrigger:** landing 4+ scatters again during Free Spins adds more spins using the same table.
- Free Spins uses an enhanced Multiplier weight table (higher average value / higher spawn rate than base game).
- **Optional variant module:** a persistent, accumulating multiplier that carries and grows across the whole Free Spins round rather than resetting each tumble (a "1000x-style" high-volatility variant, common in this genre). Flagged as optional — pick one mode per release.
- Free Spins ends when the spin count reaches zero; a summary screen shows total win.

---

## 6. Optional Modules

### Ante Bet
- +25% total bet increases Free Spin symbol frequency (standard genre convention). Optional — confirm jurisdiction allows it before including.

### Buy Feature
- Instant-purchase entry into Free Spins for roughly 90×–100× total bet (needs math-team pricing to hit target RTP contribution). Confirm jurisdiction/platform allows bonus buys before including.

---

## 7. Math Model Targets

| Metric | Target |
|---|---|
| RTP | 96.50% default; 94.00% / 92.00% operator variants |
| Volatility | High |
| Hit frequency (any win) | ~30–35% |
| Free Spins trigger frequency | ~1 in 120–150 base spins |
| Max win cap | 20,000× bet |

These are design targets for the math/simulation pass, not guaranteed outcomes — actual RTP must be verified via simulation before certification.

---

## 8. Game Flow / State Machine

```
Idle
 → Spin Requested
 → Initial Grid Fill
 → Cluster Evaluation
    → [if win] Tumble Loop:
         Multiplier Spawn Check → Win Payout → Symbol Removal
         → Gravity/Refill → Re-evaluate Clusters
    → [if no win] exit loop
 → Scatter Count Check
    → [if 4+] Free Spins Intro → Free Spins Loop → Free Spins Summary
    → [else] Return to Idle
```

---

## 9. UI/UX

**HUD:** balance, bet amount, win amount, spin button, autoplay, turbo spin, settings/paytable, Free Spins counter (during bonus), running multiplier meter (during tumbles).

**Animation beats:** symbol drop/bounce on landing, cluster burst/particle effect, multiplier symbol "roll-up" merge into the win counter, Free Spins trigger celebration, retrigger celebration, win-tier banners (Big/Mega/Super Win).

**Audio beats:** ambient base-game loop, higher-energy Free Spins loop, symbol land sfx, cluster burst sfx, multiplier chime (scaling with value), tumble whoosh, Free Spins trigger fanfare, big-win fanfare tiers, button/UI sfx.

UI chrome (buttons, panels, iconography) can reuse your existing design system for visual consistency with the rest of your product line, rather than being designed from scratch.

---

## 10. Technical Notes

- Game logic/state on `@slot-engine/core`, rendering via PixiJS — consistent with your current stack.
- Paytable, cluster-size tiers, and multiplier weight tables should be config-driven (JSON) so the math team can rebalance without touching game code.
- Each spin's RNG outcome (grid fills, multiplier spawns, scatter placement) should be resolvable server-side / deterministically replayable for RGS or provably-fair integration.
- Tumble chain and multiplier resolution should be modeled as a discrete step sequence (see Section 8) so replay/animation can be driven off the same step log used for the math result.

---

## 11. Open Questions

- Final theme direction (candy assumed as placeholder — confirm or reskin).
- Target platform/jurisdiction (affects max win cap, Ante Bet legality, Buy Feature legality).
- Include a traditional Wild symbol, or keep the Multiplier-bomb-only design (as in the reference game)?
- Standard reset-per-tumble multiplier vs. persistent accumulating Free Spins variant — pick one for v1.
