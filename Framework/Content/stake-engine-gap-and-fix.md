# Stake Engine — Gaps and Fix

Working brief for making this Framework ready to develop slots for Stake Engine. Out of scope until later: production art/audio. **Do not lock cluster vs scatter up front.** Designers put mechanics and aesthetics in `Framework/Content/Game Design Documents/` **before** SlotFolder development. The Stake sample pair is an output of that design (`fork-locked` / template §14), not a prerequisite.

Adapted Stake operating docs (currency scales, books, RTP, RGS/replay, approval, events, validators): [`Framework/Content/SkillGuides/`](SkillGuides/README.md). Reference only; never import into `SlotFolder`.

---

## ~~1. Isolation + Stake-compatible submit~~

**Done.** Two-root layout kept. Root `README.md` + `SlotFolder/README.md` document isolation and **two ACP uploads** (math `publish_files/` + assembled frontend static folder). `SlotFolder/{math,web}` exist as empty kit roots. Framework is not a runtime dependency; do not import it into `SlotFolder`.

**Was lacking:** The readme treated `SlotFolder` as one zip. ACP wants two uploads. Framework must not be a runtime dependency.

**Fix (applied):** Keep the two-root layout. `SlotFolder` is a self-contained Stake project (math + web). Framework is reference only (guides, recipes, lists, unused assets). At submit time, upload **build outputs**, not the Framework.

Proposed `SlotFolder` shape:

```
SlotFolder/
  math/                 # math-sdk tree; your game in games/<game_id>/
  web/                  # web-sdk tree; your game in apps/<game_id>/
  README.md             # run locally + two ACP uploads
```

Submit (Stake-compatible):

1. Math: `SlotFolder/math/games/<game_id>/library/publish_files/` → ACP math
2. Frontend: assembled SvelteKit static folder (`index.html`, `_app/`, `assets/`, …) → ACP Files → Publish Front End

Rule: no imports, paths, or scripts from `/Framework` into `/SlotFolder`. Copy assets **into** `SlotFolder` when needed. Dragging the whole `SlotFolder` is a **source** handoff, not the ACP upload.

Official kits:

- [Math SDK](https://github.com/StakeEngine/math-sdk)
- [Web SDK](https://github.com/StakeEngine/web-sdk)

---

## 2. Math game (empty SLOT BACKEND)

**Lacking:** No `GameConfig` / `GameState` / books / lookup tables / optimization.

**Fix:** Do not write a math engine. Copy a Stake sample into `SlotFolder/math`, then specialize.

| Design | Fork |
|---|---|
| Sugar Rush-like (cluster + positional multipliers) | `games/0_0_cluster` |
| Sweet Bonanza-like (pay-anywhere + tumble + bombs) | `games/0_0_scatter` |
| 5×5 hybrid | Start from the closer sample; change grid in `GameConfig`; do not invent a third win type |

Work sequence:

1. Vendor/clone math-sdk into `SlotFolder/math`.
2. Copy `games/template/` or the chosen sample → `games/<game_id>/`.
3. Fill `game_config.py` (id, reels×rows, paytable, RTP, win cap, `BetMode`s: base / ante / buy).
4. Implement `run_spin()` / `run_freespin()` using SDK executables (tumble, cluster/scatter eval).
5. Emit only events listed in the contract (section 4).
6. `run.py`: small uncompressed sims first, then full run + compression + Rust optimize → `library/publish_files/`.

Fill `parts.txt` **SLOT BACKEND** with that file list plus outputs (`books`, `lookup_tables`, `configs`, `publish_files`). Framework recipes describe *how* to change the sample; they are not imported by Python.

---

## 3. Frontend game

**Lacking:** No Svelte/Pixi app, no HUD wiring, no book handlers.

**Fix:** Do not build a custom renderer. Copy the matching web-sdk app into `SlotFolder/web`.

| Math sample | Web app |
|---|---|
| `0_0_cluster` | `apps/cluster` |
| `0_0_scatter` | `apps/scatter` |

Work sequence:

1. Vendor/clone web-sdk into `SlotFolder/web`.
2. Duplicate the sample app → `apps/<game_id>/`.
3. Point it at your math events via `bookEventHandlerMap` (section 4).
4. Skin HUD with copied Framework assets (spin, bet, paytable, loading, etc. — SDK already has the chrome).
5. Wire audio with `utils-sound`; board/tumble with existing slot utils.
6. Develop in **Storybook** (`pnpm run storybook --filter=<game_id>`) against local/random books. No Stake login required.
7. Production: `pnpm run build --filter=<game_id>`, assemble the static `build/` folder, ACP Import.

Framework never ships in the Vite graph. Assets are files inside the web app.

---

## 4. Book-event contract

**Lacking:** Math and frontend can emit/handle different event names and shapes.

**Fix:** One event catalog is the source of truth. Both sides implement that list only.

Put the catalog in Framework as a recipe/spec, and **copy** the same file into `SlotFolder` (e.g. `SlotFolder/math/games/<id>/events.md` plus matching comments/types on the web side). Do not import it from Framework at runtime.

Start from the sample’s existing types; add rows only when a recipe needs a new mechanic:

| `type` | Math emits | Frontend handles |
|---|---|---|
| `reveal` | after draw | show board |
| `winInfo` | after eval | highlight wins |
| `tumbleBoard` | after cascade | drop/refill |
| `setWin` / `setTotalWin` / `finalWin` | wallet | HUD amounts + win screens |
| `freeSpinTrigger` / `freespinUpdate` / `freespinEnd` | FS flow | FS UI |
| custom (e.g. multiplier bomb) | `game_events.py` | new handler + Storybook story |

Rule: if it is not in the catalog, math must not emit it and the UI must not require it.

---

## 5. Docs to write (Recipes + Framework)

**Lacking:** Empty `Recipies`, no Stake-shaped guides, `parts.txt` backend empty.

**Fix:** Write this set before scaling. Do not add more until these exist.

### Framework operating docs

1. ~~Readme — isolation rule, `SlotFolder` layout, two ACP uploads (not “drag folder to Stake”).~~
2. Toolchain / setup — Windows: Python 3.12, Make, Node 22.16, pnpm 10.5, Rust; `make setup` + `pnpm install`.
3. Slot bootstrap — design of record in `Game Design Documents/` (`fork-locked` / §14) names the sample pair; then rename `game_id`, first green Storybook + first 100 uncompressed sims.
4. ~~GDD folder — `Framework/Content/Game Design Documents/` (drop folder + optional template). Mechanic fork is derived, not assumed.~~ Designer uploads specs here before development.
5. Publish checklist — `publish_files/` + frontend `build/` + ACP steps. Start from SkillGuides [02](SkillGuides/02-book-package.md), [05](SkillGuides/05-approval-and-compliance.md), [09](SkillGuides/09-artifact-validators.md), [13](SkillGuides/13-jurisdiction-requirements.md). Copy [`Content/Tooling/`](Tooling/README.md) into the game `tools/` folder after fork-lock.
6. `parts.txt` — complete **SLOT BACKEND** + keep frontend list; mark each as Framework asset vs SDK-provided UI. Backend rows include math publish + Tooling copies (`math-simulate`, `math-optimize-luts`, `math-optimize-assets`, `math-jurisdiction-check`).

### Recipes (mechanic → SDK, not generic slot theory)

7. Tumble / cascade (`tumble_board_event` + frontend tumble).
8. Win model: cluster **or** scatter (whichever the Game Design Documents derived).
9. Free spins trigger / retrigger / counters.
10. Multipliers: positional (cluster) **or** bombs / global (scatter).
11. Bet modes: base, ante, bonus buy (`BetMode` + frontend mode).
12. Adding a bookEvent — math emit + handler + Storybook story. See [07](SkillGuides/07-event-animation-playback.md).
13. Asset ingest — copy from `Framework/Assets` into the web app; Pixi load names, Spine vs sprite, audio via Howler. Pixi host rules: [10](SkillGuides/10-pixi-svelte-lifecycle.md).
14. RTP / optimize / PAR — when to run the Rust optimizer, what “hit target RTP” means. See [03](SkillGuides/03-rtp-signoff.md). Currency ×1e6 vs ×100: [01](SkillGuides/01-currency-scales.md).

Optional later: i18n, win-cap, force-record analysis. Not required to start.

---

## 6. Platform access vs Storybook

**Storybook** runs the frontend on your machine and feeds it **fake or local books** (JSON event sequences). You click spin, animations play, no Stake server. That is enough to build UI and handlers.

**Platform access** is an account on [engine.stake.com](https://engine.stake.com/). You need it only when you want a **real** round:

1. Upload math `publish_files/` so the RGS can pick a weighted simulation.
2. Upload/publish the frontend build.
3. **Start game session** → URL with auth query params.
4. Either play in their staging tab, or paste that query string onto local `pnpm run dev` so the local UI talks to the **live RGS** (`play/` returns real books).

Without an account you can still develop (Storybook + local math JSON). You cannot prove the game works on Stake, and you cannot submit. It is a **publish/e2e gate**, not a coding gate.

---

## Implementation order

1. Designer uploads mechanics, aesthetics, and related specs into `Framework/Content/Game Design Documents/` (`fork-locked` / template §14). Win model + multiplier family derive the sample pair.
2. ~~Rewrite readme (isolation + two uploads).~~
3. Scaffold `SlotFolder/math` and `SlotFolder/web` from the Game Design Documents Stake mapping.
4. Write the event catalog; delete/add handlers until both sides match.
5. Write setup + bootstrap + the recipes above.
6. Fill `parts.txt` backend.
7. Get Storybook + a tiny uncompressed book run green.
8. ACP/e2e when you have Engine access.
