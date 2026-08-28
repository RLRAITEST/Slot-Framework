# 06 — Mechanics state graph (GDD overlay)

## Why

Upstream `slot-mechanics-designer` converts features into explicit states, transitions, and loop caps. This Framework already has a stronger GDD (`Game Design Documents/TEMPLATE.md`) and fork-lock. What the GDD can still miss is an **unbounded retrigger** or a feature with no exit. Use this overlay before setting status to `fork-locked`.

## How it maps here

Fill these **inside** the existing GDD, not a second spec format:

| Overlay | GDD section |
|---|---|
| One-round loop + persistence | §3 |
| Win model | §5 |
| Multipliers | §7 |
| Tumble | §8 |
| Feature / FS | §9 |
| Bet modes | §10 |
| Book events | §12 |
| Sample pair | §14 |

Do not create `mechanics_spec.json` unless you later copy a validator into `SlotFolder` ([09](09-artifact-validators.md)). Markdown in the GDD folder is enough.

## When

Before fork-lock. After identity/fantasy are drafted. **Required** before copying `games/0_0_*` or `apps/cluster|scatter`.

## Instructions

### 1. Draw states (minimum)

Always include:

- `idle` / waiting for bet
- `base_spin` (grid fill through tumble chain)
- `terminal` (round done; RGS may `end-round`)
- `free_spins` if §9 is enabled

Optional only if GDD actually has them: `ante_pending`, `buy_pending`, `hold_and_spin`, etc. Do not add respin/pick states because an inspiration report mentioned them.

Every non-terminal state must have:

- **Entry** trigger (player action or event)
- **Exit** to a named state
- **Cap** if the state can loop (tumble chain, FS retrigger)

### 2. Feature patterns (only if §9/§7 say so)

Use as checklists, not as features to add:

**Free spins**

- Trigger: symbol + count, base and/or ante (GDD §9).
- Actions: award N spins, optional start multiplier.
- Guards: retrigger extra spins, **max total FS**, **max retriggers**. If either is missing, stop fork-lock.

**Tumble**

- What is removed vs stays (scatters, bombs, multipliers).
- Gravity/refill.
- Chain cap: unlimited only if you accept long rounds; still need a **practical** safety cap in math if the SDK has one.

**Multipliers**

- Family must agree with §5 (positional vs bombs). If they fight, resolve in GDD; do not fork both samples.

**Failure patterns to hunt**

- Transition to a state that does not exist.
- Trigger with no transition.
- Feature state with no exit.
- Retrigger with no cap.
- Action without a numeric payload (spins, multiplier, count).

### 3. Persistence table (GDD §3)

For symbols, multipliers/marks, scatter count, meters: fill **within tumble**, **cleared at end of base spin**, **persists in FS**. Math and frontend must implement the same table. If a meter persists between **rounds**, that is a jackpot-style restriction — not allowed ([05](05-approval-and-compliance.md)).

### 4. Event mapping

For each state transition, name the book `type` from gap-brief §4 / GDD §12. If you need a new type, add a GDD §12 row **and** plan a handler ([07](07-event-animation-playback.md)). If it is not in §12, math must not emit it.

### 5. Fork-lock gate (extends template §14)

In addition to the template checkboxes:

- [ ] State list written; every loop capped.
- [ ] FS retrigger cap numeric.
- [ ] Persistence table complete.
- [ ] §5 win model ≠ `other`.
- [ ] §7 family agrees with §5.
- [ ] §12 catalog closed (keep / drop / add decided).
- [ ] Math sample and web app are the matching pair.

Then set Status to `fork-locked`.

### 6. After fork, copy a snapshot if math needs it

Copy GDD §3/§9/§12 (or this overlay) into `SlotFolder/math/games/<game_id>/` as a readme. Do not import Framework at runtime.

## Do not

- Do not add bonus-pick / respin / collect because the upstream pattern list includes them.
- Do not leave “retrigger yes” without a cap.
- Do not start a third win type (`other`) and then invent a sample.

## Source

Upstream: `slot-mechanics-designer` (`SKILL.md`, `references/mechanics-patterns.md`)  
This repo: `Framework/Content/Game Design Documents/TEMPLATE.md`
