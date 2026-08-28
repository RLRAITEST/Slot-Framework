# 09 — Artifact validators

## Why

Upstream ships `validate-books-index.mjs`, `validate-rgs-events.mjs`, `check_books_package.py`, and `audit-checklist.mjs`. They are useful **as a pattern**: fail the publish if `index.json`, books, and lookup tables disagree. Their event-name lists and `config.yml` assumptions are not ours. Do not drop those scripts into `SlotFolder` unchanged.

## How it maps here

Validators that run at sim/publish time must live **inside** `SlotFolder` (copied files), because Framework cannot be a runtime dependency. Until you copy them, run the **manual** checks in this file.

Suggested copy destination after fork-lock (you create it):

```
SlotFolder/math/games/<game_id>/tools/
```

or a `SlotFolder/math/tools/` folder that only takes `<game_id>` as an argument. No path to `/Framework`.

## When

Before every ACP math upload. Optional: after every `make run` that regenerates `publish_files/`.

## Instructions

### 1. Manual gate (required even without scripts)

From `SlotFolder/math/games/<game_id>/library/publish_files/`:

1. Parse `index.json`. For each mode:
   - `events` file exists.
   - `weights` file exists.
   - `cost` is a positive number matching GDD §10.
2. Load books (decompress `.zst` if needed with the kit’s tools).
3. Each book row: unique `id`, `events` is a non-empty array, `payoutMultiplier` is a number.
4. Each event: has `type` (and whatever index/fields the **kit** uses). `type` ∈ GDD §12 catalog.
5. Lookup CSV: unique ids, weights > 0, id set equals book id set, `payoutMultiplier` matches the book row.
6. No file in `index.json` missing from disk; extra files are a warning, not necessarily a fail.

Fail = do not upload.

### 2. Event stream extra checks

For a sample of rounds (all, if small; else 1k random ids):

- Event order is the math order (do not sort).
- No unknown `type`.
- FS: if `freeSpinTrigger` appears, a later `freespinEnd` appears before the round finishes (if GDD has FS).
- Wallet: a terminal total exists (`finalWin` or kit equivalent).
- Do **not** require upstream `spinStart` / `roundResult`.

### 3. If you copy upstream scripts

1. Download from the GitHub repo into `SlotFolder/.../tools/` (not Framework).
2. Change default event allow-list to GDD §12 names.
3. Point `--index` at `games/<game_id>/library/publish_files/index.json`.
4. Delete checks for `config.yml` paylines.
5. Run:

```sh
# examples — adjust to the copied filenames
node tools/validate-books-index.mjs --index games/<game_id>/library/publish_files/index.json --format text
python tools/check_books_package.py --index games/<game_id>/library/publish_files/index.json
```

Non-zero exit = blocker.

Social copy audit (`audit-checklist.mjs` + `compliance-rules.json`): only when you are shipping a social build. Copy `compliance-rules.json` next to the script. Target the **assembled frontend strings**, not Framework markdown.

### 4. What “adapted” means

| Upstream check | Keep? |
|---|---|
| Missing index / missing files | Yes |
| Duplicate ids | Yes |
| Weight coverage | Yes |
| RTP formula `sum(w*payout)/sum(w)` | Yes, with payout as ×100 ([01](01-currency-scales.md), [03](03-rtp-signoff.md)) |
| Symbols must exist in `config.yml` | No — use `game_config.py` / kit symbol list if you automate |
| First event `spinStart` | No |
| Restricted phrases in UI | Yes for social; optional otherwise |

### 5. Frontend assemble check

Not in the upstream book scripts, required here:

- Assembled folder has `index.html` at root.
- `_app/` and `assets/` present (`SlotFolder/README.md`).
- No `../Framework` strings in built JS (search the assemble output).

## Do not

- Do not `require()` or `import` scripts from `Framework/Content`.
- Do not fail CI on upstream event names.
- Do not treat a validator pass as RTP sign-off ([03](03-rtp-signoff.md) still required).

## Source

Upstream: `book-generator/scripts/check_books_package.py`, `stake-game-developer/scripts/validate-books-index.mjs`, `validate-rgs-events.mjs`, `audit-checklist.mjs`
