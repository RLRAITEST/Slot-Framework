# 03 — RTP sign-off

## Why

GDD §11 is targets only. Proof is simulation. Upstream `senior-game-math-engineer` and `rtp-optimizer` define gates this repo was going to write as recipe 14: theoretical vs simulated vs book-weighted RTP, sample size, mode consistency, max-win reachability.

## How it maps here

You do **not** run `Engine/scripts/verify_rtp.py` or `games/Darumas/` (those paths are another studio). You run math-sdk:

```
SlotFolder/math  →  make run GAME=<game_id>
```

then the kit’s compression + **Rust optimizer**. Compare three numbers per `BetMode`:

1. **Target** — GDD §11 / `game_config.py`
2. **Simulated** — spin engine output from the run
3. **Book-weighted** — from lookup CSV ([02-book-package.md](02-book-package.md) §4)

All three must agree within tolerance or you do not upload.

## When

- Directional: after first full-ish sim (≥ 1e6 spins if the machine allows; smaller only to debug crashes).
- Sign-off: after optimizer, before ACP math publish. Prefer ≥ 20e6 spins for the number you quote in game info.

Fork-lock first. Do not tune RTP on `games/0_0_cluster` and then copy; tune `games/<game_id>/`.

## Instructions

### 1. Lock targets in one place

In GDD §11 and `game_config.py`, same values:

| Target | Typical Stake band (from upstream approval skill; confirm on [engine docs](https://stake-engine.com/docs) if they change) |
|---|---|
| RTP default | 90%–98% ([13](13-jurisdiction-requirements.md)) |
| Mode-to-mode RTP | within **0.5%** absolute of each other |
| Max win (× stake) | advertised cap; must be **achievable** (1 in 20,000,000 or more frequent) |
| Hit frequency / feature frequency | intent bands, not copied from a competitor; base >0-win typically 1-in-3–8, not rarer than 1 in 20 |

If a field is still TBD, write `TBD` and do not sign off.

### 2. Decompose EV before changing strips

When tuning, change **one lever family** per run:

- Paytable (symbol multiples of total bet)
- Reel / cell weights (what the sample uses instead of classic strips)
- Feature trigger rates (scatter count, FS award)
- Multiplier distribution and caps
- Retrigger caps (unbounded FS will blow RTP and round length)

Record: seed (if any), `num_sim_args`, config version, lever changed, expected RTP direction.

### 3. Run sizes

| Purpose | Spins | Verdict |
|---|---|---|
| Crash / event-shape debug | hundreds–thousands, uncompressed | not an RTP number |
| Directional | ≥ 1,000,000 | may retune; quote as preliminary |
| Sign-off | ≥ 20,000,000 | required for advertised RTP |

Report mean RTP **and** a confidence interval. If the CI crosses the tolerance band, run more spins; do not “average two short runs” in a slide.

### 4. Tolerances (defaults; override in GDD if you set tighter)

- RTP: **≤ 0.20%** absolute from target (e.g. 96.00% target → 95.80%–96.20%).
- Hit rate: ≤ 1.00% absolute from intent if you published an intent.
- Book-weighted vs simulated: treat unexplained drift as a **blocker** (broken id/weight join or mutated events after generation).

### 5. Max win

- Configured cap must match GDD and game-info text.
- Advertised max win must occur at least as often as claimed (upstream gate: hit-rate **1 in 20,000,000 or more frequent**). If you claim 10,000× and sims never hit it, change the claim or the math.
- If sims hit the cap far more often than design, volatility/RTP are wrong.

### 6. Mode pack

For base / ante / buy:

1. Simulate each mode.
2. Check each RTP vs its target.
3. Check pairwise RTP within 0.5%.
4. Confirm `index.json` `cost` matches the extra price (ante, buy).

### 7. Sign-off report (paste into GDD or a math folder readme **copy**)

Copy a short report into `SlotFolder/math/games/<game_id>/` (not imported by Python). Include:

1. Assumptions (bet unit, modes, seed).
2. EV decomposition (base vs FS vs multipliers).
3. Table: target / sim / book-weighted / delta / pass-fail per mode.
4. Max-win observed vs advertised.
5. Commands run (`make run …`, optimizer invocation from the kit).
6. Open risks.

### 8. Optimizer

Use the **Rust optimizer the math-sdk documents**, after books exist. “Hit target RTP” means: after optimize, simulated and book-weighted RTP are inside tolerance **and** event streams still match GDD §12. Do not optimize by editing lookup weights by hand.

If you copied [`Tooling/optimize-luts.mjs`](../Tooling/README.md) into the game folder, it is an optional JS LUT weighter — still run `jurisdiction.mjs --report` on its output. Official path stays the kit’s Rust optimizer.

## Do not

- Do not paste a competitor’s RTP sheet into GDD.
- Do not sign off from a 10k-spin Storybook session.
- Do not change math and frontend paytable text in different commits without re-sim.
- Do not use upstream commands that point at `Engine/scripts` or `games/Darumas`.

## Source

Upstream: `senior-game-math-engineer`, `rtp-optimizer`, `references/metrics-and-thresholds.md`  
Approval numbers also in `stake-game-developer/references/game-approval-checklist.md`  
Kit: math-sdk run + optimize
