# Tooling (reference copies)

JS helpers for math publish, LUT weighting, asset encode, and **Stake jurisdiction / approval gates**. They live in `/Framework`. Python, Vite, and pnpm must never import this folder.

Official math path remains [math-sdk](https://github.com/StakeEngine/math-sdk) `make run` + Rust optimizer. These scripts are templates: copy them into `SlotFolder` after fork-lock if you need a JS LUT pipeline or a checker against sim/LUT reports.

Official jurisdiction page: [Jurisdiction requirements](https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements)

Guides: [05-approval-and-compliance.md](../SkillGuides/05-approval-and-compliance.md), [13-jurisdiction-requirements.md](../SkillGuides/13-jurisdiction-requirements.md)

## Copy destination (after fork-lock)

```
SlotFolder/math/games/<game_id>/tools/
```

Copy the **whole** `Tooling/` directory (not a single file). Isolation: no `../Framework` paths.

Optional: also copy `optimize-assets.mjs` + `jurisdiction.*` into the web app if thumbnail checks should run next to `public/`.

## Files

| File | Role |
|---|---|
| `jurisdiction.config.json` | RTP band, title bans, social dictionary, thumbnail luminance |
| `jurisdiction.mjs` | Checker CLI + library (`--self-test`, `--title`, `--report`, `--copy --social`, `--thumbnail`) |
| `math-adapter.mjs` | Constants + `createEngine()` stub. Prefer math-sdk; implement only for JS sim/build |
| `simulate.mjs` | Per-mode RTP / hit / vol report, then jurisdiction math gate |
| `build-stake-engine-math.mjs` | Writes `publish_files/` (uniform LUT weights), then jurisdiction math gate |
| `optimize-luts.mjs` | Power-law LUT re-weight; then jurisdiction math gate |
| `optimize-assets.mjs` | WebP encode + thumbnail brightness / dark-edge check |

## Jurisdiction gates encoded here

From the [approval guidelines](https://stake-engine.com/docs/approval-guidelines) / jurisdiction page (confirm if Stake drifts):

- Title: unique; no Megaways, Xways, Enhanced/Boosted RTP, `Gates of …`, `… Bonanza`
- Math: RTP 90%–98%; modes within 0.5%; max win 1 in 20,000,000 or more frequent; base >0-win hit-rate not rarer than 1 in 20
- Thumbnail: generally bright; no dark edges; no baked wording or multipliers (manual for text)
- Social / Stake.US: restricted-word list + SC/GC without `$` (only when `--social`)

Prechecks that stay **live QA** (not in these scripts): RGS authenticate on launch, bet → `play`, spacebar → bet. See [04](../SkillGuides/04-rgs-and-replay.md) and [12](../SkillGuides/12-qa-before-acp.md).

## Run after copy

```sh
node tools/jurisdiction.mjs --self-test
node tools/jurisdiction.mjs --title="Working Title"
node tools/jurisdiction.mjs --report=library/publish_files/configs/lut_optimization_report.json
node tools/jurisdiction.mjs --copy=path/to/en.json --social
node tools/optimize-assets.mjs --thumbnail-only
```

Do not run these from `/Framework`. There is no game engine here.
