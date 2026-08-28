# 02 — Book package (`publish_files`)

## Why

ACP math upload is not the math-sdk tree. It is `library/publish_files/`: `index.json`, lookup CSV(s), compressed books. If IDs, weights, or mode costs drift, the RGS picks the wrong round or rejects the import. Upstream `book-generator` describes that package; this guide rewrites it onto math-sdk output.

## How it maps here

```
SlotFolder/math/games/<game_id>/library/publish_files/
  index.json
  books_<mode>.jsonl.zst
  lookUpTable_<mode>_0.csv
```

`<game_id>` exists only after GDD status is `fork-locked` (template §14). Until then there is no package to validate.

Bet modes in GDD §10 must become math-sdk `BetMode`s. Each mode in `index.json` has a cost (× total bet) that must match GDD and the frontend mode selector.

## When

After Init (`SlotFolder/README.md` § Init), fork-lock, sample copy to `games/<game_id>/`, and a successful `make run GAME=<game_id>` that emits `publish_files/`. Run a **small uncompressed** sim first; then full run + compression + Rust optimize.

## Instructions

### 1. Produce the package from the kit, do not hand-write books

From `SlotFolder/math`:

```sh
make run GAME=<game_id>
```

Use small `num_sim_args` first (see the sample’s `run.py`). Full publication run: compression + optimizer as the math-sdk README requires. Output must land in `games/<game_id>/library/publish_files/`.

### 2. `index.json` contract

Minimum shape (mode names and filenames follow **your** `game_id` and `BetMode` names; do not copy this literally if the kit uses different prefixes):

```json
{
  "modes": [
    {
      "name": "base",
      "cost": 1,
      "events": "books_base.jsonl.zst",
      "weights": "lookUpTable_base_0.csv"
    }
  ]
}
```

Rules:

- Every `events` and `weights` path is **relative** to `publish_files/` and the file exists.
- `cost` matches GDD §10 (base `1`, ante/buy as specified).
- Mode `name` is the same string the frontend and RGS use.

If the kit’s generated `index.json` uses different keys, **keep the kit’s keys**. This contract is the semantic requirement (modes, cost, book file, weight file), not a demand to rename kit fields.

### 3. Book rows (`books_*.jsonl` / `.jsonl.zst`)

Each line/object must have:

| Field | Meaning |
|---|---|
| `id` | Unique simulation id; stable for that generation run |
| `events` | Ordered array of book events (catalog in gap-brief §4 / GDD §12) |
| `payoutMultiplier` | Integer ×100 scale ([01-currency-scales.md](01-currency-scales.md)) |

Rules:

- No duplicate `id` inside a mode.
- `events` must be a sequence the frontend can play without recomputing wins.
- Last events in a round must include the wallet totals the sample already emits (`setWin` / `setTotalWin` / `finalWin` as in the catalog). Do not append upstream `roundResult` unless the **kit** emits it.

### 4. Lookup tables (`lookUpTable_*.csv`)

Columns (kit may add more; first three are the contract):

| Col | Name | Rule |
|---|---|---|
| 0 | `id` | Same id as a book row |
| 1 | `weight` | Positive number; selection frequency |
| 2 | `payoutMultiplier` | Same ×100 value as that book row |

Rules:

- Every lookup `id` exists in the book file (full coverage both ways).
- No zero or negative weights.
- Weighted RTP for the mode: `sum(weight * (payoutMultiplier/100)) / sum(weight)` is the book-empirical RTP. Compare to GDD §11 in [03-rtp-signoff.md](03-rtp-signoff.md).

### 5. Integrity pass before ACP

On the `publish_files/` folder:

1. List files. Every path in `index.json` exists.
2. For each mode: unique book ids, unique lookup ids, set equality of ids.
3. `payoutMultiplier` on the lookup row equals the book row.
4. Spot-check 10 book `events` arrays against GDD §12 (no unknown `type`s).

Then follow [09-artifact-validators.md](09-artifact-validators.md) if you copy a checker into `SlotFolder`.

### 6. Upload

ACP → Files → import the **contents** of `publish_files/` (not `SlotFolder/math`, not `/Framework`). Publish Game → Math.

## Do not

- Do not author `config.yml` paylines. Math-sdk uses `game_config.py` and cluster/scatter executables.
- Do not zip the whole `math/` tree for ACP.
- Do not leave Framework paths inside generated JSON.
- Do not regenerate books with a new seed and keep old lookup files.

## Source

Upstream: `book-generator` (`SKILL.md`, `references/data-contract.md`)  
Kit: [math-sdk](https://github.com/StakeEngine/math-sdk) `make run` / `publish_files`
