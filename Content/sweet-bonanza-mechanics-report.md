# Sweet Bonanza — Full Mechanics & Math Report

*Pragmatic Play, released 25 June 2019. Reference build: 96.51% RTP.*

---

## 1. Spec sheet

| Property | Value |
|---|---|
| Grid | 6 reels × 5 rows = 30 positions |
| Win model | Scatter pays / "pay anywhere" — 8+ matching symbols anywhere on grid |
| Paylines | None |
| Wilds | None |
| Symbols | 9 paying + 1 scatter + 1 free-spins-only multiplier = 11 |
| Core mechanic | Tumble (cascade), unlimited chain length |
| Feature | Free Spins, 10 spins, triggered by 4+ scatters |
| Feature multipliers | Multiplier bombs, 2x–100x, **additive**, applied once per tumble sequence |
| Retrigger | 3+ scatters during FS → +5 spins, no cap |
| Bet modifiers | Ante Bet (1.25× stake), Buy Free Spins (100× stake) |
| Max win | 21,100× total bet (some sources quote 21,175×) |
| Volatility | High (Pragmatic rates it 5/5) |
| Hit rate (base) | ≈ 1 in 3 spins produce some win |
| Feature frequency | ≈ 1 in 180–250 base spins natural; roughly 2× with Ante |
| RTP variants shipped | 96.51% / 96.00% / 95.47% / 94.49% (operator-selectable) |

The RTP variant matters enormously and is *not* visible from the game name — only from the in-game paytable. Every number in this report assumes the 96.51% build.

---

## 2. The win model: scatter pays

There are no paylines and no adjacency requirement. The engine simply **counts occurrences of each symbol type across all 30 visible positions**. If a count ≥ 8, that symbol pays according to a three-tier schedule:

- Tier 1: 8–9 symbols
- Tier 2: 10–11 symbols
- Tier 3: 12 or more symbols

Multiple symbol types can pay simultaneously on the same grid state (e.g. 9 apples *and* 8 plums both pay).

**Why 8 on a 30-cell grid is the right threshold.** With ~9 symbol types and roughly uniform-ish weights, the expected count per symbol is ~3.3. Requiring 8 puts you well into the right tail of a binomial-ish distribution — frequent enough to feel alive (~30% hit rate), rare enough that the tail (12+, which pays 4–5× the tier-1 value) is genuinely exciting. The three-tier step function is deliberately convex: it converts a linear increase in symbol count into a superlinear increase in payout, which is what makes long tumble chains feel dramatic.

This is the single most important design decision in the game. Because position doesn't matter, the tumble refill only has to satisfy a *count* condition, not a *geometry* condition. That makes chains far more likely than in a true cluster-pays game (where refilled symbols must land adjacent to survivors) and it makes the math massively cheaper to simulate.

---

## 3. Symbol set and paytable

Payouts are expressed as a multiple of **total bet**, not coin value. They scale linearly with stake.

### High-pays (candies) — well corroborated

| Symbol | 8–9 | 10–11 | 12+ |
|---|---|---|---|
| Red heart | 10× | 25× | 50× |
| Purple square | 2.5× | 10× | 25× |
| Green pentagon | 2× | 5× | 15× |
| Blue oval | 1.5× | 2× | 12× |

### Low-pays (fruits) — top tier confirmed, lower tiers approximate

| Symbol | 8–9 | 10–11 | 12+ |
|---|---|---|---|
| Apple | ≈1.5× | ≈2× | 10× |
| Plum | ≈1× | ≈1.5× | 8× |
| Watermelon | ≈0.8× | ≈1.2× | 5× |
| Grapes | ≈0.5× | ≈1× | 4× |
| Banana | ≈0.25× | ≈0.75× | 2–3× |

> Note the disagreement across public sources on the fruit tier-1/tier-2 values — several review sites have them shifted by a row. Treat the fruit low tiers as indicative shape, not gospel. The 12+ column is consistent everywhere.

### Special symbols

| Symbol | Function |
|---|---|
| **Lollipop (Scatter)** | Pays 3× / 5× / 100× for 4 / 5 / 6 anywhere. Also triggers Free Spins at 4+. Present on all reels, does not tumble away as part of a win. |
| **Multiplier bomb** | Free-spins only. Carries a value from the set {2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100}×. Does not itself form winning combinations. |

**Observation on paytable shape:** the ratio between the best symbol (red heart, 50×) and the worst (banana, ~2×) is ~25:1 in the top tier, but the *scatter* pays 100× for six — the scatter is the highest single-symbol payout in the entire base game, on top of being the trigger. That's a deliberate double-reward: the trigger event itself pays, so the transition into the feature feels like a win, not just a state change.

---

## 4. The tumble engine

Official wording: after every spin, winning combinations are paid, winning symbols disappear, remaining symbols fall to the bottom of the screen, and empty positions are filled with new symbols from above. Tumbling continues until a tumble produces no new winning combination. There is **no limit** to the number of tumbles.

### Algorithm

```
function resolveSpin(grid, mode):
    sequenceWin = 0
    tumbleCount = 0

    loop:
        wins = []
        for each paying symbol type S:
            n = count(grid, S)
            if n >= 8:
                wins.push({ symbol: S, count: n, pay: paytable[S][tier(n)] })

        if wins is empty: break

        sequenceWin += sum(wins.pay)          # in base-bet units
        emit(WIN_EVENT, wins)

        removePositions(grid, positionsOf(wins))
        applyGravity(grid)                     # survivors fall, scatters + bombs stay
        refillEmptyPositions(grid, mode)       # fresh weighted draw per position
        tumbleCount += 1

    if mode == FREE_SPINS:
        m = sum(values of all multiplier bombs currently on grid)
        if m > 0:
            sequenceWin *= m
            emit(MULTIPLIER_EVENT, m)

    return sequenceWin
```

### Key properties

1. **Memoryless refill.** Each vacated position gets an independent draw from the same position-weight configuration as the initial fill. There is no "hot symbol" carry-over and no adjustment based on what was just removed. This is what makes the game cheap to simulate and impossible to card-count.

2. **Gravity is cosmetic.** Because pays are position-independent, whether survivors fall down or teleport makes zero difference to the math. It exists purely for the visual read. If you're implementing this, you still need gravity for the animation, but your RTP model doesn't care.

3. **Scatters persist.** Lollipops are not consumed by wins, so scatter count accumulates *across* a tumble sequence. This is how retriggers happen: you can pick up scatters over several tumbles within one free spin.

4. **Chain length distribution.** Base game: 3–5 consecutive tumbles is common on a winning spin. Free spins: 8+ chains are where the multipliers compound. The chain is self-terminating with a per-tumble continuation probability of roughly 0.3–0.35, so the length distribution is approximately geometric — thin but very long-tailed.

---

## 5. Free Spins

**Trigger:** 4, 5, or 6 lollipop scatters anywhere on the grid. Award is **10 free spins regardless of scatter count** — 5 and 6 scatters pay more (5×, 100×) but do not grant more spins.

**Retrigger:** 3 or more scatters landing during a free spin awards +5 spins. Uncapped in theory, so unlimited free spins are theoretically possible.

**Special reels:** the feature uses a different symbol weight configuration than the base game — Pragmatic's own text confirms "special reels are in play during the feature." Practically this means bomb symbols are injected into the weight table and the scatter/symbol distribution is retuned.

---

## 6. Multiplier bombs — the actual engine of the game

This is the mechanic that defines Sweet Bonanza and it's subtler than most people describe it.

**Rules:**
- Bombs only appear during Free Spins.
- Each bomb takes a random value from {2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100}× on landing.
- Bombs do **not** participate in wins and do **not** get removed by tumbles.
- When the **entire tumble sequence ends**, all bombs currently visible have their values **summed**, and the **total accumulated win of the whole sequence** is multiplied by that sum, once.

**Three consequences worth internalising if you're building something similar:**

1. **Additive, not multiplicative.** Two 20× bombs give 40×, not 400×. This caps the ceiling hard and is what makes the max win reachable-but-rare rather than unbounded. Multiplicative stacking would blow up the variance beyond anything a certifier would sign off on.

2. **Applied once, at the end, to the sum.** Not per-tumble. This means a bomb that lands on tumble 1 and a bomb that lands on tumble 7 contribute identically, and both apply retroactively to wins that were already "paid" earlier in the sequence. Mechanically the player is being paid for the sequence, not for individual tumbles — the intermediate win counter is an animation, not a settlement.

3. **This creates the game's signature tension curve.** Every additional tumble is two lottery tickets at once: another chance at a win *and* another chance at a bomb that retroactively multiplies everything before it. That coupling is why the free spins round feels qualitatively different from the base game, which is otherwise identical machinery.

**Worked example:**

```
Free spin, tumble sequence:
  Tumble 0: 9 red hearts        → 10.0×
  Tumble 1: 10 apples           →  2.0×   [25× bomb lands]
  Tumble 2: 8 plums             →  1.0×
  Tumble 3: 12 green candies    → 15.0×   [8× bomb lands]
  Tumble 4: no win → sequence ends

  Accumulated: 28.0×
  Bombs on screen: 25 + 8 = 33×
  Payout: 28.0 × 33 = 924× total bet
```

---

## 7. Bet modifiers

| Option | Cost | Effect |
|---|---|---|
| **Ante Bet** | 1.25× stake | More lollipops injected into the reel weights. Roughly doubles natural trigger frequency. RTP essentially unchanged (~96.5%). |
| **Buy Free Spins** | 100× stake | Guarantees 4+ scatters on the triggering spin, straight into the feature. RTP essentially unchanged. Not available in the UK under UKGC rules, and banned in several other jurisdictions. |

The two are mutually exclusive. Both are engineered to be **RTP-neutral** — this is a regulatory requirement in most licensed markets, and it's the hard constraint that shapes the pricing. The buy price of 100× is not arbitrary: it's set so that `E[feature win] ≈ 100 × RTP`, meaning the expected return of a bought feature is ~96.5× stake against a 100× cost.

What the buy *does* change is variance per unit of time. Buying compresses ~200 base spins of grind into one event, so the session-level variance goes up sharply even though long-run RTP is flat.

---

## 8. RTP decomposition and volatility

Approximate split for the 96.51% build:

| Source | Share of RTP |
|---|---|
| Base game tumble wins | ~25–30% |
| Scatter pays (4/5/6 lollipops) | small, ~2–3% |
| Free spins round | ~65–70% |

That is a **feature-heavy distribution**. The base game is intentionally quiet — Sweet Bonanza has no random base-game multipliers (unlike Gates of Olympus), so non-feature spins return small tumble wins or nothing. Almost all the money lives in the bonus.

**Practical variance profile of a free spins round:**

| Outcome | Typical return |
|---|---|
| Dead round | 5–20× |
| Average round | ~30–60× |
| Strong round | 200–500× |
| Exceptional round | 1,000–5,000× |
| Max-win territory | 21,100× (astronomically rare) |

The distribution is extremely right-skewed. The median free spins round returns well below the mean — which is the defining signature of high-volatility feature-driven design.

**How the max win is actually reached:** you need (a) a long retrigger chain to get enough spins, (b) a single spin with a very long tumble chain, (c) that chain hitting high-pay symbols in tier 3 repeatedly, and (d) multiple large bombs (a 100× plus several others) on screen when the sequence terminates. All four have to coincide. A 12+ red heart cluster (50×) with a 100× bomb is 5,000× on one sequence — so the 21,100× cap requires roughly four such sequences' worth of value, or one monstrous chain.

The cap itself is a hard ceiling: if the math would exceed 21,100×, the win is truncated. Most modern slots implement this as an explicit clamp in the settlement layer.

---

## 9. Why the design works

Worth separating the math from the psychology, because both are being engineered:

- **Removal of spatial reasoning.** Pay-anywhere means the player never has to evaluate geometry. They just watch for "a lot of one colour." This is why it works so well on mobile and why the four high-pays are colour-coded rather than shape-coded.
- **Continuous partial reinforcement.** ~30% hit rate with mostly sub-1× returns means the player is "winning" constantly while losing steadily. Classic losses-disguised-as-wins structure.
- **The tumble as suspense generator.** Each cascade is a free re-roll of the entire outcome. The player has no agency but the animation grants a sense of unfolding.
- **Bombs as retroactive multipliers.** Because the multiplier applies to the whole accumulated sequence, the player's mental model during a chain is "everything so far could still be worth 30× more." That is a much stronger hook than a per-win multiplier.
- **Two-track access to the feature.** Ante and Buy give the player a sense of agency over the only outcome they actually care about, without changing expectation.

None of this is accidental. Pragmatic's whole post-2019 catalogue (Gates of Olympus, Starlight Princess, Sugar Rush, Big Bass) is variations on this same core loop.

---

## 10. The family — how the variants differ

| Title | Key differences |
|---|---|
| **Sweet Bonanza** (2019) | Baseline. 6×5, bombs 2–100×, max 21,100×, RTP 96.51%. |
| **Sweet Bonanza Xmas** | Pure re-skin. Same math, RTP ~96.49%, scatter becomes a candy cane. |
| **Sweet Bonanza Dice** | Re-skin with dice-styled symbols, same engine. |
| **Sweet Bonanza 1000** (2024) | 6×**6** grid (36 positions), bombs extend to **1000×**, max win 25,000×. Higher-stake framing, and includes a **Super Free Spins buy at 500×** alongside the normal 100× buy. Many operator builds run at ~94.5% RTP. |
| **Sweet Bonanza 2500** | Further-escalated multiplier ceiling and max win; special bets push max stake far higher. |
| **Sweet Bonanza Super Scatter** (2025) | Adds a Super Scatter symbol that can award up to 50,000× directly. Retains 6×5 and the tumble core. |
| **Sweet Bonanza CandyLand** | Not a slot at all — a live-dealer money-wheel game show using the IP. |

The pattern across the family is instructive: Pragmatic never changes the core loop. They change **the multiplier ceiling** and **the grid size**, because those are the two levers that move max win and variance without requiring a new certification of the fundamental mechanic.

---

## 11. Implementation notes

If you're building a game on this pattern, here's how the pieces map to an actual math engine.

### 11.1 Symbol generation

Two viable approaches, and the choice matters:

**(a) Reel strips.** Six strips, each a long ordered array of symbol IDs. A spin picks a random stop index per reel and reads N consecutive entries. Tumbles continue reading further down the same strip. This is what most certified engines use because the strip *is* the auditable artifact — a regulator can inspect it directly.

**(b) Per-position weighted draw.** Each cell drawn independently from a weight table. Simpler, but harder to control the distribution of counts, and you lose the reel-level correlation that makes "near miss" visuals possible.

Sweet Bonanza's behaviour (scatter present on all reels, position-independent pays) is consistent with per-reel strips where each reel has its own weight profile. Recommended: **strips per reel, separate strip sets for base game and free spins**, with the bomb symbol only present in the FS strips.

### 11.2 Data model

```ts
type SymbolId = 'H1'|'H2'|'H3'|'H4'|'L1'|'L2'|'L3'|'L4'|'L5'|'S'|'M';

interface Paytable {
  [k: string]: [number, number, number]; // [8-9, 10-11, 12+] in bet units
}

interface Cell { symbol: SymbolId; multiplier?: number; }

interface TumbleEvent {
  index: number;
  wins: { symbol: SymbolId; count: number; positions: number[]; pay: number }[];
  gridAfter: Cell[][];
}

interface SpinBook {
  id: number;
  mode: 'base' | 'freespin';
  tumbles: TumbleEvent[];
  bombs: number[];
  multiplierTotal: number;
  payout: number;   // in bet units, post-multiplier, post-cap
}
```

### 11.3 Tuning to a target RTP

The workflow is: simulate → measure → adjust weights → repeat.

1. **Isolate the levers.** For this game family they are: scatter weight (controls trigger frequency), high-pay weight (controls base RTP), bomb weight and bomb value distribution (controls feature RTP and variance).
2. **Bomb value distribution is the big one.** The 100× entry probably appears with probability on the order of 10⁻³ per bomb draw, and the expected value of a single bomb is likely in the 4–8× region. Shifting mass from 2×–5× toward 20×–100× barely changes RTP but massively changes the shape of the win distribution. This is your primary variance dial.
3. **Run ≥ 10⁷ spins per configuration.** With a 21,100× tail you need large N before the mean stabilises. Track the running RTP and check that the last 20% of the run doesn't move it by more than ~0.1pp.
4. **Split RTP by source** in your sim output — base tumbles, scatter pays, feature — so you can see which lever moved.
5. **Price the buy last.** Once feature RTP is locked, buy cost = `E[feature] / target_RTP`.

### 11.4 Metrics to report

- RTP, split by base / scatter / feature
- Hit frequency (base and FS)
- Feature trigger rate (natural, and with ante)
- Tumble chain length distribution
- Win distribution percentiles: p50, p90, p99, p99.9, p99.99
- Max observed win vs. cap, and the frequency of cap hits
- Standard deviation per spin (this is your volatility index input)

### 11.5 Gotchas

- **Clamp at the cap in the settlement layer**, not in the tumble loop. If you clamp per-tumble you distort the distribution.
- **Scatters must survive tumbles.** Easy to get wrong and it changes retrigger rates significantly.
- **Bombs must survive tumbles too**, and must not be counted as paying symbols. Also decide explicitly whether a bomb landing occupies a cell that could otherwise have been a paying symbol — it does, and that dilution measurably lowers base win frequency inside the feature.
- **Separate presentation from math.** The tumble sequence is a replay of a pre-computed outcome. If your renderer is deriving payouts, you have an architecture bug.
- **The intermediate win counter is not a settlement.** In free spins the player sees a number climbing that gets multiplied at the end. Make sure the ledger only commits once.

---

## 12. Caveats

- Pragmatic Play does not publish reel strips, symbol weights, or bomb value probabilities. Everything in sections 8 and 11.3 about probabilities is **inference from published RTP, max win, and observed behaviour**, not disclosed data.
- Fruit tier-1 and tier-2 payouts vary across public sources; the 12+ column is consistent and reliable.
- Operators choose among multiple RTP builds. Any analysis tied to 96.51% does not transfer to the 94.49% build — the weights differ, not just a flat scalar.
- Max win is quoted as both 21,100× and 21,175× depending on source; the discrepancy likely reflects different builds or rounding in the cap.

---

*Compiled August 2026. For game-design reference.*
