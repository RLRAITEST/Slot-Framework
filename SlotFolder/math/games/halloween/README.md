# halloween

Stake math game. Forked from `games/0_0_cluster`. Matching web app: `SlotFolder/web/apps/halloween`. This folder does not import `/Framework`.

Design of record: Framework `cluster-slot-gdd-mapped.md` (fork-locked 2026-09-01). Snapshot below is enough to sim without that path.

## One round

1. Base or Buy (100×).
2. 7×7 fill, 4-dir clusters of 5+, tumble until dead or 100 steps.
3. Positional spots: first hit marks, second ×2, then double (cap 128). Base: persist through the tumble chain, clear at end of spin. FS: persist and grow for the whole FS round.
4. 4+ scatters anywhere in the chain → FS (10/12/14/+2). Retrigger same table, max 100 total FS.
5. No Ante. No wilds in the GDD (sample reels still contain `W` until the strip pass).

## Theme

Classic Halloween / autumn: pumpkins, fallen leaves, bats, ghosts. Not winter, not candy-shop.

## Still sample (next math pass)

- Paytable includes GDD L5 + H5; reel strips now mix L5/H5 (seeded from L3/H4). Remaining kit pays for L1–L4 / H1–H4.
- `W` still on FR0/WCAP strips and in `special_symbols`
- RTP 96.50% and 20,000× cap are **targets**; books are not signed off

## Run

From `SlotFolder/math` after `make setup`:

```
make run GAME=halloween
```

`run.py` is set to 100 uncompressed sims, optimizer off (needs Rust). Raise counts before ACP.
