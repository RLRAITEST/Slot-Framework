# Sugar Rush (Pragmatic Play) — Full Mechanics & Math-Model Report

*Reference document for slot engineering. Focus: how the game actually resolves a round, and why the math model behaves the way it does.*

---

## 1. At a glance

| Property | Value |
|---|---|
| Studio / release | Pragmatic Play, June 2022 |
| Grid | 7×7 (49 positions) |
| Win mechanic | Cluster pays, 5+ connected symbols |
| Connectivity | Orthogonal only (horizontal + vertical, no diagonals) |
| Cascade | Tumble (winning symbols removed, refill from above) |
| Wilds | **None** |
| Scatter | Gumball/candy machine, lands on any position |
| Signature feature | Multiplier Spots (positional, doubling, additive) |
| Default RTP | 96.50% (operator-configurable: 95.50% / 94.50%) |
| Bonus buy RTP | 96.50% (identical to base) |
| Volatility | 5/5 |
| Hit frequency | ~34.48% (≈1 win per 2.9 spins) |
| FS trigger rate | ≈1 in 323 spins |
| Max win | 5,000× stake |
| Max win frequency | ≈1 in 2,340,000 spins |
| 1,000×+ frequency | ≈1 in 37,900 spins |
| Bet range | €0.20 – €100 (some operators up to €240) |

Sources: Pragmatic Play game page, AskGamblers, SlotCatalog, BigWinBoard, operator rule pages.

---

## 2. Core loop — how one round resolves

```
SPIN
 ├─ Fill 7×7 grid from reel strips / weighted symbol distribution
 ├─ TUMBLE LOOP:
 │    1. Find all clusters (5+ same symbol, 4-connected)
 │    2. If no clusters → exit loop
 │    3. For each cluster:
 │         base_win   = paytable[symbol][clusterSize]
 │         multSum    = Σ multiplierValue at each position in cluster
 │         clusterWin = base_win × max(multSum, 1)
 │         spinWin   += clusterWin
 │    4. Mark / upgrade multiplier spots for every winning position
 │    5. Remove winning symbols, gravity-drop remainder, refill from top
 │    6. Repeat from 1
 ├─ Count scatters accumulated on this spin/sequence → maybe trigger FS
 ├─ Base game: clear all marks + multipliers
 └─ Award spinWin (capped at 5,000×)
```

The critical design point: **all tumbles belong to one spin**. The multiplier state is built up *within* that sequence and then thrown away — unless you're in free spins.

---

## 3. Cluster detection logic

A cluster is a **connected component** of identical symbols under 4-connectivity, with size ≥ 5.

```ts
const DIRS = [[0,1],[0,-1],[1,0],[-1,0]]; // no diagonals

function findClusters(grid: Symbol[][]): Cluster[] {
  const seen = Array.from({length: 7}, () => Array(7).fill(false));
  const clusters: Cluster[] = [];

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (seen[r][c] || isScatter(grid[r][c])) continue;

      const sym = grid[r][c];
      const stack = [[r, c]];
      const cells: [number, number][] = [];
      seen[r][c] = true;

      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        cells.push([cr, cc]);
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr > 6 || nc < 0 || nc > 6) continue;
          if (seen[nr][nc] || grid[nr][nc] !== sym) continue;
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }

      if (cells.length >= 5) clusters.push({ symbol: sym, cells });
    }
  }
  return clusters;
}
```

Notes:
- Flood-fill (BFS/DFS) is the correct primitive. Don't try payline enumeration — the "20 lines" wording on some operator pages is marketing copy that doesn't map to the actual evaluation.
- Scatters are excluded from cluster formation and are **not** removed by tumbles in the standard implementation; they persist and are counted for the trigger.
- Because there are no wilds, cluster formation is purely a function of symbol adjacency. This makes the RNG/reel-strip weighting the *only* lever on hit frequency.

---

## 4. Paytable structure

Seven paying symbols, split into two value bands:

**Low band — 3 gummy bears** (orange, purple, red)
**High band — 4 candies** (star, jelly bean, heart, round candy)

Confirmed anchor values (per 1 unit total bet):

| Cluster size | Gummy bears | Candies |
|---|---|---|
| 5 (minimum) | 0.2× – 0.3× | 0.4× – 1× |
| 15+ (maximum) | 20× – 30× | 40× – 150× |

The top symbol (round pink candy) pays **150×** for a 15+ cluster. Intermediate tiers step upward between these anchors — read them off the in-game paytable if you need exact values, since public sources only reliably report the endpoints.

### What this tells you about the math

A 150× top-symbol hit is the *entire* base-symbol ceiling. The game's 5,000× cap is therefore **~33× above the largest possible unmultiplied cluster**. That gap is filled exclusively by Multiplier Spots. This is the single most important structural fact about the model: the paytable is deliberately flat and low so that nearly all of the top-end RTP mass is delivered through the multiplier system during free spins.

---

## 5. Multiplier Spots — exact rules

This is where most reimplementations get it wrong. The precise sequence:

1. **First explosion** at position *(r,c)* → the position is **marked** (highlighted). No multiplier value yet.
2. **Second explosion** at that same marked position → multiplier is **created at ×2**.
3. **Every subsequent explosion** at that position → multiplier **doubles**: 2 → 4 → 8 → 16 → 32 → 64 → 128.
4. **Cap: ×128** in original Sugar Rush.
5. A multiplier applies to **any winning cluster that covers that position**.
6. **Multiple multipliers in one cluster are SUMMED, not multiplied.** A cluster covering ×64 and ×128 spots resolves as ×192, not ×8192.

```ts
type Cell = { marked: boolean; mult: number }; // mult = 0 means "no multiplier yet"

function onWinningPositions(state: Cell[][], cells: [number,number][]) {
  for (const [r, c] of cells) {
    const cell = state[r][c];
    if (!cell.marked) {
      cell.marked = true;          // 1st hit: mark only
    } else if (cell.mult === 0) {
      cell.mult = 2;               // 2nd hit: create at x2
    } else {
      cell.mult = Math.min(cell.mult * 2, MULT_CAP); // 3rd+: double
    }
  }
}

function clusterPayout(base: number, cells: [number,number][], state: Cell[][]) {
  const sum = cells.reduce((acc, [r,c]) => acc + state[r][c].mult, 0);
  return base * (sum > 0 ? sum : 1);
}
```

### Ordering subtlety

Whether you upgrade multipliers **before** or **after** paying the current cluster changes the RTP measurably. In Pragmatic's implementation, a cluster is paid using the multiplier values **already present** on those positions; the upgrade from that cluster's own explosion applies to *future* tumbles. Get this wrong and your simulated RTP will drift high.

### Persistence rules

| Context | Behaviour |
|---|---|
| Base game | Marks + multipliers persist across tumbles **within one spin**, then fully clear when the tumble chain ends |
| Free spins | Marks + multipliers persist for the **entire feature**, across all spins, and keep compounding |

This single difference is the whole reason free spins carry the max-win potential. In the base game you might reach a couple of ×2/×4 spots in a long chain; in free spins, spots reached during spin 3 are still sitting there at ×64 on spin 14.

---

## 6. Free Spins

**Trigger:** scatters landing anywhere on the grid during a spin (including symbols that arrive via tumble).

| Scatters | Free spins |
|---|---|
| 3 | 10 |
| 4 | 12 |
| 5 | 15 |
| 6 | 20 |
| 7 | 30 |

**Retrigger:** identical table — 3–7 scatters during the feature award 10–30 additional spins. No cap on retriggers.

**Feature behaviour:**
- Special reel strips are used during the bonus (higher cluster and scatter density than base).
- Marked spots and their multiplier values do **not** reset between free spins.
- Multipliers continue doubling toward the ×128 ceiling across the whole round.

**Bonus buy:** 100× total bet, guaranteeing 3–7 scatters land. RTP is unchanged at the operator's configured level (96.50% / 95.50% / 94.50%). The buy is RTP-neutral by design — it compresses variance in time, not in expectation.

---

## 7. Why the math model behaves the way it does

**The compounding curve is the product.** Each free spin, the expected number of newly-marked positions grows as the grid accumulates marks. Once a large fraction of the 49 cells are marked, nearly every subsequent explosion creates or doubles a multiplier rather than merely marking. The payout distribution is therefore heavily **path-dependent**: outcome is driven by how early in the feature you get long tumble chains, not by the average win size.

**Additive stacking is the deliberate governor.** Summing rather than multiplying multipliers is what keeps the cap at 5,000× instead of astronomical. Six positions at ×128 in one cluster gives ×768 — large, but bounded. Multiplicative stacking would blow the model apart. If you're designing an analogue, this is the knob that most directly controls your tail.

**No wilds = clean, tunable hit frequency.** The 34.48% hit rate is a pure function of symbol weights and the 5-connected threshold. There is no wild-substitution term muddying the cluster probability. Very convenient for simulation and LUT optimisation.

**RTP split.** With FS triggering ~1 in 323 spins and a 100× buy price, the free spins feature carries roughly a third of total RTP on its own (100× × (1/323) ≈ 0.31 of a unit bet per spin in expected feature value at breakeven pricing). The base game is intentionally thin — that's the "flat stretches" players describe.

**Distribution shape.** Hit rate 1-in-2.9 but max win 1-in-2.34M, and 1,000×+ at 1-in-37,900. That's a distribution with a dense mass of sub-1× returns (many "wins" pay less than the stake due to the 0.2×–1× floor on 5-clusters), a thin middle, and a very long tail. Standard high-volatility cluster shape.

---

## 8. Variant comparison

| | Sugar Rush | Sugar Rush 1000 | Sugar Rush Super Scatter |
|---|---|---|---|
| Multiplier cap per spot | ×128 | ×1,024 | ×1,024 |
| Max win | 5,000× | 25,000× | — |
| RTP (top) | 96.50% | 96.53% | 96.58% |
| Buys | 100× FS | 100× FS, 500× Super FS (all spots pre-seeded at ×2) | 10× Super Spins (random pre-seeded ×2–×128), plus FS buys |
| Extras | — | — | Super Scatter paying 100× / 500× / 5,000× / 50,000× for 1–4 Super Scatters in a 3+ scatter combo |

*Sugar Rush Xmas* is a pure reskin — mechanically identical to the original.

Note the design pattern across sequels: the **multiplier ceiling** is the primary tuning lever (128 → 1024), and pre-seeded multiplier spots are the standard mechanism for selling premium buy tiers. Neither approach changes the core resolution logic.

---

## 9. Implementation checklist

If you're building something in this family:

- [ ] Flood-fill cluster detection, 4-connectivity, min size 5, scatters excluded
- [ ] Gravity + refill that preserves column order (symbols fall, don't reshuffle)
- [ ] Multiplier state as a separate 7×7 layer, independent of the symbol grid
- [ ] Mark-then-multiply ordering (1st hit marks, 2nd hit creates ×2)
- [ ] Pay clusters using pre-existing multiplier values, upgrade after
- [ ] Additive multiplier summation per cluster
- [ ] Separate persistence scope: per-tumble-chain (base) vs per-feature (FS)
- [ ] Separate reel strips / symbol weights for base vs free spins
- [ ] Scatter counting across the full tumble sequence, not just the initial drop
- [ ] Win cap applied at round level, not per cluster
- [ ] Buy pricing calibrated so buy RTP ≈ base RTP

For simulation: the multiplier layer means round outcomes are strongly autocorrelated within a feature. Don't sample free spins independently — you have to simulate the full feature as one unit to get the tail right.

---

*Compiled from Pragmatic Play's official game page, operator rule pages (Stake, MSport), and independent reviews (BigWinBoard, AskGamblers, SlotCatalog, AboutSlots). Exact intermediate paytable tiers and reel-strip weights are not publicly disclosed and would need to be derived from the in-game paytable or empirically from demo play.*
