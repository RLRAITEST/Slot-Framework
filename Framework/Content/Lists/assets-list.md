# Assets list — `halloween`

Living **todo and QA checklist** for this slot. Update it whenever art or audio is uploaded, replaced, or rejected. It is the process tracker — not a one-time spec.

**What to draw/record** (no status fields): [`assets-to-create.md`](assets-to-create.md). Keep quality notes in **this** file.

Companion to [`../Game Design Documents/cluster-slot-gdd-mapped.md`](../Game%20Design%20Documents/cluster-slot-gdd-mapped.md) and [`parts.txt`](parts.txt). Theme: **classic Halloween / autumn fall**. Not winter. Not candy-shop. Not multiplier bombs. No wilds. Buy Feature in; Ante out.

**Copy destination (when an asset is accepted):** `SlotFolder/web/apps/halloween/` (the path the web-sdk sample already uses for static/spine/audio). Never leave the only copy in `/Framework`. Math and Vite must not import this folder.

---

## How to use this file

1. **This file is the asset process log.** Notes about **lacking** assets (not uploaded, wrong id, wrong format) and **sub-par** assets (wrong theme, too dark for ACP, off-model, unreadable at cell size, bad loop, clip, placeholder still shipping) **must be written here**. Do not leave those notes only in chat, email, or a side doc. If it is not in this file, it is not tracked.
2. When a file is dropped into `Framework/Assets` (or any designer drop), add or update the matching row **the same day**: set Status, check the box only when that deliverable is **accepted**, and write Notes if anything is wrong or incomplete.
3. A checkbox means **accepted for this drop** (quality + theme + format + ingested or ready to ingest). Do **not** check it because a file exists. Placeholders and SDK chrome stay unchecked until a real Halloween asset replaces them *or* you explicitly accept SDK chrome for that part (write that in Notes).
4. Status must be one of: `missing` · `placeholder` (kit sample still in the game) · `uploaded` (in Framework/Assets, not copied yet) · `ingested` (copied into `SlotFolder`) · `fail` · `pass`.
5. **`fail` and `missing` always require Notes** (what is wrong, who noticed, what “done” looks like). `pass` may have a short note (date, filename). If quality is debatable, mark `fail` and write why — do not silently ship.
6. Append every rejection or gap to **§ Quality / gaps log** as well as the row. The log is the running history; the row is the current state.
7. After a re-upload that fixes a `fail`, update the row, add a log line (`fixed:`), then set `pass` and check the box.

---

## Status legend

| Status | Meaning |
|---|---|
| `missing` | Not delivered. Notes: what is needed. |
| `placeholder` | Cluster-sample / SDK art still showing in the game. |
| `uploaded` | File exists under Framework (or drop folder); not yet copied into SlotFolder. |
| `ingested` | Copied into `SlotFolder/web/apps/halloween`. Not yet quality-accepted. |
| `fail` | Delivered but sub-par or wrong. Notes required. Unchecked. |
| `pass` | Accepted. Checkbox on. |

---

## Quality / gaps log

Write dated bullets here. Newest first. Include asset id, status, and the note.

_Example: `2026-09-01 — slot-thumbnail — fail — black night edges; ACP will eat the tile. Need bright autumn orange, no baked title/multipliers.`_

- 2026-09-01 — static icons recut + wired — pass (board/paytable icons) — flood-fill knocked remaining opaque black canvas to alpha. Files moved to `static/assets/sprites/symbolsStatic/`. Background / ramme / logo wired. L5 + H5 added to web `config.ts`, math `game_config.py`, and reel strips.
- 2026-09-01 — drop batch Graphics — ingested — renamed descriptive files to list ids (`mapleleafsymbol.png` → `L1.png`, …) and copied into `SlotFolder/web/apps/halloween/static/assets/sprites/`. Static board icons wired. **Not pass:** PNGs have solid black backgrounds (need transparent). No land/win/burst anims. `L5`/`H5` not in math `config.ts` yet. `slot-background` is harvest-night (OK for board; not for ACP thumbnail).
- 2026-09-01 — L1–L5, H1–H5, S static icons — ingested — files were `*symbol.png` / `ghosticon.png` / `scatter.png`; renamed to `L1.png`–`L5.png`, `H1.png`–`H5.png`, `S.png`.
- 2026-09-01 — slot-background, slot-ramme, slot-logo, slot-multiple_mark, slot-multiple_numbers — ingested — renamed from `background.png`, `frame.png`, `framenobackground.png`, `logo.png`, `xicon.png`, `numbers.png`.

---

## 0. Drop / ingest gate (every batch)

- [x] Files named by symbol id or `parts.txt` id (e.g. `L1`, `slot-thumbnail`)
  Status: `pass` · Notes: 2026-09-01 renamed drop files to `L1`–`L5`, `H1`–`H5`, `S`, `slot-background`, `slot-ramme`, `slot-ramme-nobg`, `slot-logo`, `slot-multiple_mark`, `slot-multiple_numbers`.
- [x] Format usable by the web-sdk sample (PNG/WebP/Spine/audio as that part already loads) — do not invent a new pipeline
  Status: `pass` · Notes: 2026-09-01 PNG sprites load via pixi `sprite` type. Remaining canvas black flood-filled to alpha.
- [x] Theme check: Halloween / fall only (no snow, ice, frost, candy-shop, Sugar Rush clones)
  Status: `pass` · Notes: 2026-09-01 maple/acorn/bat/spider/candy-corn, pumpkin/ghost/hat/coffin/cauldron, FS tombstone.
- [x] Content safety: not offensive; no Stake/Kick branding; no appeal to minors
  Status: `pass` · Notes: 2026-09-01 cartoon Halloween props; no branding.
- [x] Copied into `SlotFolder/web/apps/halloween` (not Framework-only)
  Status: `pass` · Notes: 2026-09-01 in `static/assets/sprites/{symbolsStatic,background,reelsFrame,logo,multipliers}/`.

---

## 1. Low pay symbols — L1–L5

Per symbol, all five rows must reach `pass` before that symbol is done.

### L1 maple leaf

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/L1.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `L1.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes: no animation in this drop; static used for land.
- [ ] Win / highlight (spritesheet or Spine)
  Status: `placeholder` · Notes: kit spine still used for win.
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### L2 acorn

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/L2.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `L2.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### L3 bat

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/L3.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `L3.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### L4 spider

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/L4.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `L4.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### L5 candy corn (Halloween prop, not a candy-game skin)

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/L5.png`. Alpha knockout applied. Now in math + web config and reel strips.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `L5.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

`parts.txt`: `slot-low_paying_symbols`, `slot-symbol_win_animation`.

---

## 2. High pay symbols — H1–H5

Same five deliverables; more detail and FX than lows.

### H1 jack-o-lantern

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/H1.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `H1.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### H2 ghost

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/H2.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `H2.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### H3 witch hat

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/H3.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `H3.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### H4 coffin

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/H4.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `H4.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

### H5 cauldron of witch brew

- [x] Static board icon
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/H5.png`. Alpha knockout applied. Now in math + web config and reel strips.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `H5.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Win / highlight
  Status: `placeholder` · Notes:
- [ ] Cluster burst / explode
  Status: `placeholder` · Notes:

`parts.txt`: `slot-high_paying_symbols`, `slot-symbol_win_animation`.

---

## 3. Scatter — tombstone with FS (Free Spins)

- [x] Static board icon (tombstone, letters **FS** readable on a cell)
  Status: `pass` · Notes: 2026-09-01 `symbolsStatic/S.png`. Alpha knockout applied.
- [x] Paytable / info icon
  Status: `pass` · Notes: same `S.png`.
- [ ] Land / drop
  Status: `placeholder` · Notes:
- [ ] Anticipation (2–3 already on the board)
  Status: `placeholder` · Notes:
- [ ] Trigger / collect burst
  Status: `placeholder` · Notes:

`parts.txt`: `slot-scatter_symbol`, `slot-symbol_anticipation_animation`, `slot-free_spin_trigger_animation`.

---

## 4. Positional multiplier spots (not bombs)

GDD §7: cell marks that upgrade mark → ×2 → double. **No bomb reel symbol.** Do not upload Sweet Bonanza–style bombs.

- [ ] Unmarked / empty cell (if the board needs a plate)
  Status: `placeholder` · Notes:
- [ ] Marked (first hit, no value yet)
  Status: `ingested` · Notes: 2026-09-01 `slot-multiple_mark.png` (was `xicon.png`). Orange ×; black background. Not a bomb.
- [ ] Value overlay art (×2, ×4, ×8 … ×128) or a font that composites cleanly on the cell
  Status: `ingested` · Notes: 2026-09-01 `slot-multiple_numbers.png` (was `numbers.png`). Digit sheet 0–9, not sliced; not yet composited onto spots.
- [ ] Upgrade animation (mark → value → double)
  Status: `placeholder` · Notes:
- [ ] Idle pulse while a valued spot sits on the board
  Status: `placeholder` · Notes:

`parts.txt`: `slot-multiple_symbol`.

---

## 5. Wilds

- [x] **None** — GDD locked, no wild art
  Status: `pass` · Notes: do not upload a wild; if a file arrives, reject here and log it.

`parts.txt`: `slot-wilds` — cut.

---

## 6. Background, frame, environment

- [ ] Base-game background (static or layered)
  Status: `ingested` · Notes: 2026-09-01 `sprites/background/slot-background.png` wired in Background.svelte (also used for FS until a FS variant exists).
- [ ] Free Spins background (higher energy, still autumn Halloween)
  Status: `placeholder` · Notes: reuses base `slot-background.png`.
- [ ] Parallax / extra layers (if used)
  Status: `missing` · Notes:
- [ ] Grid frame / board border (`slot-ramme`)
  Status: `ingested` · Notes: 2026-09-01 `sprites/reelsFrame/slot-ramme-nobg.png` wired in BoardFrame.svelte. `slot-ramme.png` kept (has a 5×5 inner grid; not used on the 7×7 board).
- [ ] Foreground / vignette (keep board readable)
  Status: `missing` · Notes:

`parts.txt`: `slot-background`, `slot-ramme`. Board may be dark harvest-night; **ACP thumbnail must not** (see §8).

---

## 7. Logo, loading, branding

- [ ] Main logo (static) — official title TBD; do not bake a banned or placeholder series name
  Status: `ingested` · Notes: 2026-09-01 `sprites/logo/slot-logo.png` wired on LoadingScreen. Bakes **Halloween Frenzy**; official ACP title still TBD.
- [ ] Animated logo (intro / loading)
  Status: `missing` · Notes:
- [ ] Loading screen
  Status: `placeholder` · Notes:
- [ ] Free Spins banner / logo variant
  Status: `missing` · Notes:
- [ ] Buy Feature banner (Buy is in v1)
  Status: `missing` · Notes:

`parts.txt`: `slot-logo`, `slot-loading_screen`.

---

## 8. Thumbnail / lobby tile (ACP)

Jurisdiction: bright tile; **no dark edges**; **no baked wording or multipliers**; title is a Tile Editor layer.

- [ ] Thumbnail background (bright autumn orange / harvest; not a black night)
  Status: `missing` · Notes:
- [ ] Thumbnail foreground (key art, focus filled)
  Status: `missing` · Notes:
- [ ] No title text in the PNG
  Status: `missing` · Notes:
- [ ] No × multipliers or RTP in the PNG
  Status: `missing` · Notes:
- [ ] Luminance / dark-edge check (`optimize-assets.mjs --thumbnail-only` after ingest)
  Status: `missing` · Notes:

`parts.txt`: `slot-thumbnail`.

---

## 9. HUD / chrome

SDK chrome is allowed until a skin pass. Mark `pass` + Notes `SDK chrome accepted` if we keep it. Mark `fail` if a custom skin is uploaded but worse than the kit.

- [ ] Spin button (idle / hover / pressed / disabled)
  Status: `placeholder` · Notes:
- [ ] Autoplay
  Status: `placeholder` · Notes:
- [ ] Turbo
  Status: `placeholder` · Notes:
- [ ] Bet selector + max bet
  Status: `placeholder` · Notes:
- [ ] Settings
  Status: `placeholder` · Notes:
- [ ] Sound on/off
  Status: `placeholder` · Notes:
- [ ] Paytable / info / explainer entry
  Status: `placeholder` · Notes:
- [ ] Balance / win / bet panels
  Status: `placeholder` · Notes:
- [ ] Free Spins counter
  Status: `placeholder` · Notes:
- [ ] Running multiplier / spot meter
  Status: `placeholder` · Notes:
- [ ] Buy Feature button + confirm modal (v1 includes Buy; no “buy” wording if social/`Stake.US` later)
  Status: `placeholder` · Notes:
- [ ] Ante toggle — **not in v1**
  Status: `pass` · Notes: omit; reject if uploaded.

`parts.txt`: `slot-spin_button`, `slot-autoplay_button`, `slot-bet_selector`, `slot-max_bet_button`, `slot-settings_menu`, `slot-explainer_menu`, `slot-paytable_screen`, `slot-explainer_screen`.

---

## 10. Free Spins screens

- [ ] Intro (“Free Spins awarded”)
  Status: `placeholder` · Notes:
- [ ] Trigger celebration (scatters → transition)
  Status: `placeholder` · Notes:
- [ ] Retrigger celebration
  Status: `placeholder` · Notes:
- [ ] Outro / summary (total win)
  Status: `placeholder` · Notes:

`parts.txt`: `slot-free_spin_trigger_animation`.

---

## 11. Win celebration

Thresholds TBD in web `winLevelMap`; art must not bake numbers that contradict math.

- [ ] Win screen
  Status: `placeholder` · Notes:
- [ ] Big win screen
  Status: `placeholder` · Notes:
- [ ] Mega / super win screen
  Status: `placeholder` · Notes:
- [ ] Coin / particle burst
  Status: `placeholder` · Notes:
- [ ] Count-up number style
  Status: `placeholder` · Notes:

`parts.txt`: `slot-win_screen`, `slot-big_win_screen`, `slot-mega_win_screen`.

---

## 12. Typography

- [ ] Display font (win / multiplier)
  Status: `placeholder` · Notes:
- [ ] UI font (buttons, panels, paytable)
  Status: `placeholder` · Notes:
- [ ] Logo lettering (if not a font)
  Status: `missing` · Notes:

`parts.txt`: `slot-font`.

---

## 13. Audio

- [ ] Base-game BGM loop
  Status: `placeholder` · Notes:
- [ ] Free Spins BGM loop
  Status: `placeholder` · Notes:
- [ ] FS ambient bed (if separate from BGM)
  Status: `missing` · Notes:
- [ ] Tumble / drop (cascade, not classic reel spin)
  Status: `placeholder` · Notes:
- [ ] Symbol land
  Status: `placeholder` · Notes:
- [ ] Cluster burst (optional size tiers)
  Status: `placeholder` · Notes:
- [ ] Spot mark / upgrade / double chime
  Status: `placeholder` · Notes:
- [ ] FS trigger fanfare
  Status: `placeholder` · Notes:
- [ ] FS retrigger
  Status: `placeholder` · Notes:
- [ ] Win jingles per tier
  Status: `placeholder` · Notes:
- [ ] Spin / UI click
  Status: `placeholder` · Notes:

`parts.txt`: `slot-bg_music_base_game`, `slot-bg_music_free_spins`, `slot-reel_spin_lyd`, `slot-symbol_land_lyd`, `slot-win_jingles`, `slot-button_click_lyd`, `slot-free_spin_musik`, `slot-ambient_loop_free_spins`.

---

## 14. Optional marketing

Not required to code the slot. Still log quality if they arrive.

- [ ] Animated preview (gif/webm)
  Status: `missing` · Notes:
- [ ] Extra promo stills
  Status: `missing` · Notes:

---

## Reject on sight (log in § Quality / gaps log)

- Winter / snow / ice / frost
- Multiplier **bomb** reel symbols
- Wild symbol
- Ante Bet chrome
- Dark-edged or text-baked ACP thumbnail
- Competitor likeness, `Bonanza` / `Sugar Rush` / `Megaways` in logo art
- Files that only live in `/Framework` after we intended to ingest
