# Skill Guides (adapted)

Operating docs derived from [egorfedorov/Slot-Casino-Game-Developer-Skills-for-Stake-Engine](https://github.com/egorfedorov/Slot-Casino-Game-Developer-Skills-for-Stake-Engine). That repo is a pack of AI skills, not game code. These files rewrite the useful parts for **this** Framework: two-root isolation, GDD fork-lock, math-sdk + web-sdk samples, and the book-event catalog in `stake-engine-gap-and-fix.md` §4.

## Isolation

These files live in `/Framework`. Python, Vite, Make, and pnpm must never import or path to this folder. If a game needs a snapshot (event catalog, disclaimer text, validator script), **copy** it into `SlotFolder` after fork-lock.

Do not install the upstream skill pack as Cursor skills until these guides have been followed. Upstream event names (`spinStart`, `reelsStop`, `winLine`, `roundResult`) and paths (`games/Darumas`, `config.yml` paylines) are **wrong** for this repo.

## Read order

| # | File | Use now? | Gap-brief item |
|---|---|---|---|
| 01 | [currency-scales.md](01-currency-scales.md) | Yes, before any HUD money | — (missing from brief) |
| 02 | [book-package.md](02-book-package.md) | Yes, math publish | 2, 5 |
| 03 | [rtp-signoff.md](03-rtp-signoff.md) | Yes, after first sims | 14 |
| 04 | [rgs-and-replay.md](04-rgs-and-replay.md) | After Storybook; required for ACP | 3, 6 |
| 05 | [approval-and-compliance.md](05-approval-and-compliance.md) | Before publish | 5 |
| 06 | [mechanics-state-graph.md](06-mechanics-state-graph.md) | During GDD, before fork-lock | 4, 9 |
| 07 | [event-animation-playback.md](07-event-animation-playback.md) | When wiring handlers | 4, 12 |
| 08 | [game-info-and-disclaimer.md](08-game-info-and-disclaimer.md) | Paytable / explainer | 5, `parts.txt` |
| 09 | [artifact-validators.md](09-artifact-validators.md) | Before ACP math upload | 2, 5 |
| 10 | [pixi-svelte-lifecycle.md](10-pixi-svelte-lifecycle.md) | After web-sdk is vendored | 3 |
| 11 | [autoplay-and-turbo.md](11-autoplay-and-turbo.md) | HUD polish; SDK chrome first | later |
| 12 | [qa-before-acp.md](12-qa-before-acp.md) | After Storybook + books | 6, 8 |

## Skipped on purpose

Do not port these upstream skills: `cpp-engine-core`, `cpp-performance-engineer`, `wasm-integration`, `low-latency-systems`, `parallel-computing`, `rng-crypto-specialist`, `ai-game-developer`, `ai-slot-game-developer`, `freud-detection-ai`, `studio-scaling`, `multi-agent-orchestrator`, `telemetry-analytics`, `provider-integration`, `ux-retention-designer`. They assume a custom C++/WASM engine, client RNG, in-game AI, or studio ops. This project forks Stake samples.

## Source

Upstream: https://github.com/egorfedorov/Slot-Casino-Game-Developer-Skills-for-Stake-Engine

Official kits (always win if a guide disagrees with the kit):

- [Math SDK](https://github.com/StakeEngine/math-sdk)
- [Web SDK](https://github.com/StakeEngine/web-sdk)
- [Stake Engine docs](https://stake-engine.com/docs)
