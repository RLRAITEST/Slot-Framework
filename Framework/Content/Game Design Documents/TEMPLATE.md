# GDD — \<working title\>

Optional markdown scaffold. Copy this file (do not fill the template in place). Designers may instead upload PDF/Word/images into `Game Design Documents/`; map those onto these sections before development.

Inspiration reports in `MechanicsInspiration/` are questions, not numbers to copy.

| Field | Value |
|---|---|
| Status | `draft` / `rules-locked` / `fork-locked` |
| Owner | |
| Date | |
| `game_id` | (Stake id; set by §14, may stay TBD until then) |

---

## 1. Identity

- Working title:
- One-sentence thesis (what *one* rule does the emotional work):
- Inspiration (names only; not clone targets):
- Explicitly out of scope (paylines, extra bonuses, etc.):

---

## 2. Fantasy and feel

- Theme / setting:
- What the player wants on each spin:
- Volatility intent (drip vs drought-and-spike):
- Signature moment (the clip that is the game):

---

## 3. One round

Numbered loop. All tumbles belong to one spin unless you say otherwise.

1. Player commits a bet mode (§10).
2. Grid fills.
3. …
4. Round awards / ends (what RGS `end-round` waits on).

Persistence (fill each):

| State | Within tumble sequence | Cleared at end of base spin | Persists in free spins |
|---|---|---|---|
| Symbols | | | |
| Multipliers / marks | | | |
| Scatter count | | | |
| Feature meters | | | |

---

## 4. Grid

| Field | Value |
|---|---|
| Reels × rows | |
| Why this size (hit threshold vs cell count) | |
| Reel / position restrictions (who can land where) | |
| Wilds | yes/no + rules |
| Scatter | yes/no + rules |

---

## 5. Win evaluation (decision, not a sample name)

Answer before naming cluster/scatter.

| Question | Answer |
|---|---|
| Must matches be adjacent to pay? | yes / no |
| If adjacent: connected component of N+ same symbol? | yes / no / n/a |
| Connectivity | 4-dir / 8-dir / none |
| Minimum count or cluster size | |
| Can several symbol types pay on the same grid state? | |
| Do wilds substitute into pays? | |

**Derived win model** (only after the table): `cluster` | `scatter` | `hybrid-from-cluster` | `hybrid-from-scatter` | `other (stop)`

If `other`, do not fork a sample. Write why.

---

## 6. Symbol set

Payouts as multiples of **total bet**. Sketch bands; exact table can wait for math.

| Id | Role (pay / scatter / wild / special) | Pay sketch | Notes |
|---|---|---|---|
| | | | |

How many paying symbols, how many specials:

---

## 7. Multipliers

| Field | Value |
|---|---|
| Family | none / positional spots / bombs / wild multipliers / other |
| Base game | appear? rules |
| Free spins | appear? rules |
| Stacking | add / multiply / take-max |
| Cap | |
| Persistence | matches §3 table |

If family fights §5 (e.g. bombs + cluster with no justification), resolve here. Do not leave both “because inspiration”.

---

## 8. Tumble

| Field | Value |
|---|---|
| Enabled | yes / no |
| What is removed | |
| What stays (e.g. scatters, bombs) | |
| Gravity / refill | |
| Chain cap | unlimited / N |

---

## 9. Feature (free spins)

| Field | Value |
|---|---|
| Trigger | symbol + count, base and/or ante |
| Award | N spins |
| Retrigger | yes/no, extra spins, cap |
| What is different vs base | |
| Feature win cap vs game win cap | |

---

## 10. Bet modes

Must map to Stake `BetMode` later. Costs in × total bet.

| Mode | Cost | What changes vs base |
|---|---|---|
| Base | 1× | — |
| Ante | | |
| Buy | | |

---

## 11. Math targets

Targets only. Proof is sims. Do not paste a competitor’s RTP sheet.

| Target | Value | Notes |
|---|---|---|
| RTP (default) | | |
| Max win (× stake) | | |
| Hit frequency intent | | |
| Feature frequency intent | | |
| Volatility intent | | |

---

## 12. Book events

Start from the gap-brief catalog. If it is not in this table, math must not emit it and the UI must not require it.

| `type` | Math emits | Frontend handles | Ours? (keep / drop / add) |
|---|---|---|---|
| `reveal` | after draw | show board | |
| `winInfo` | after eval | highlight wins | |
| `tumbleBoard` | after cascade | drop/refill | |
| `setWin` / `setTotalWin` / `finalWin` | wallet | HUD + win screens | |
| `freeSpinTrigger` / `freespinUpdate` / `freespinEnd` | FS flow | FS UI | |
| (custom) | | | |

Custom events: name, when emitted, payload shape (short).

---

## 13. Frontend / `parts.txt`

For each frontend part: SDK already provides chrome, copy from `Framework/Assets`, or cut.

| Part | SDK chrome / copy asset / cut | Notes |
|---|---|---|
| slot-ramme | | |
| slot-logo | | |
| slot-thumbnail | | |
| slot-background | | |
| slot-win_screen | | |
| slot-big_win_screen | | |
| slot-mega_win_screen | | |
| slot-low_paying_symbols | | |
| slot-high_paying_symbols | | |
| slot-scatter_symbol | | |
| slot-font | | |
| slot-multiple_symbol | | |
| slot-wilds | | |
| slot-symbol_win_animation | | |
| slot-symbol_anticipation_animation | | |
| slot-free_spin_trigger_animation | | |
| slot-spin_button | | |
| slot-autoplay_button | | |
| slot-bet_selector | | |
| slot-max_bet_button | | |
| slot-settings_menu | | |
| slot-explainer_menu | | |
| slot-paytable_screen | | |
| slot-loading_screen | | |
| slot-bg_music_base_game | | |
| slot-bg_music_free_spins | | |
| slot-reel_spin_lyd | | |
| slot-symbol_land_lyd | | |
| slot-win_jingles | | |
| slot-button_click_lyd | | |
| slot-free_spin_musik | | |
| slot-ambient_loop_free_spins | | |
| slot-explainer_screen | | |

---

## 14. Stake mapping (fork gate)

Fill last. This section is the only authorization to copy samples into `SlotFolder`.

| Field | Value |
|---|---|
| `game_id` | |
| Math sample | `games/0_0_cluster` / `games/0_0_scatter` |
| Web app | `apps/cluster` / `apps/scatter` |
| Grid delta vs sample | (e.g. 5×5 on a 6×5 scatter kit) |
| Event delta vs sample | (from §12) |
| Config work | `game_config.py` fields that must change first |

**Fork lock checklist**

- [ ] §5 derived win model is not `other`
- [ ] §7 multiplier family agrees with that model
- [ ] §12 has no event the other side does not list
- [ ] Math and web rows above are the matching pair

When all boxes are checked, set Status to `fork-locked`. Then gap items 2–3.

---

## 15. Aesthetics

Theme, art direction, symbol treatment, HUD, screens. Attach or drop separate art/audio briefs in this folder if they are not written here.

- Look / palette:
- Symbol style:
- HUD / chrome:
- Screens (loading, paytable, win, FS):
- What must be original art vs SDK chrome:

---

## 16. Open questions

- 
