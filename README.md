# Slot Framework

Two-root layout. Framework is reference only. The slot is a self-contained Stake Engine project under `SlotFolder`. ACP takes **two uploads of build outputs**, not this repo and not a zip of `SlotFolder`.

## Repository layout

```
/SLOT-FRAMEWORK
├── /Framework     ← reference only; never a runtime dependency
└── /SlotFolder    ← Stake project: math + web (source). ACP gets build outputs from here
    ├── math/      ← math-sdk tree; game in games/<game_id>/
    ├── web/       ← web-sdk tree; game in apps/<game_id>/
    └── README.md  ← local run + ACP upload steps
```

- **`/Framework`** — Guides, recipes, lists, mechanics reports, unused assets. Do not build the slot here. Do not import this path from math or web.
- **`/SlotFolder`** — The actual game. All code, config, and **copied** assets live here. Self-contained: it must run without `/Framework`.

## Isolation rule

`/Framework` must not be a runtime dependency of `/SlotFolder`.

- No Python/JS/TS imports from `/Framework`.
- No relative or absolute paths into `/Framework` in scripts, Vite, or Make.
- No npm/pnpm workspace links, git submodules, or env vars that point at `/Framework`.
- When the slot needs an asset or a spec, **copy it into** `SlotFolder` (e.g. into `web/apps/<game_id>/`). Do not reference the Framework original at build or run time.

Dragging the whole `SlotFolder` out of this repo is a **source handoff** (to another machine or teammate). It is **not** the ACP upload.

## How to work

1. **Context & guides** — Read from `/Framework` (Content, recipes, lists). Do not treat Framework as part of the deliverable.
2. **Assets** — Copy from `/Framework/Assets` (Graphics, Music, SoundEffects) into the web app under `/SlotFolder/web` as needed.
3. **Build** — Develop only inside `/SlotFolder` (`math/` and `web/`). Official kits: [Math SDK](https://github.com/StakeEngine/math-sdk), [Web SDK](https://github.com/StakeEngine/web-sdk).
4. **Submit** — Upload the two ACP artifacts below. Leave `/Framework` and the rest of this repo off the platform.

## Submit (Stake-compatible)

ACP expects **two** imports, then **Publish Game** for each, then **two** approval requests (math and frontend).

1. **Math** — After sims + compression + optimize, upload the contents of:

   `SlotFolder/math/games/<game_id>/library/publish_files/`

   That folder must include `index.json`, lookup CSV(s), and compressed books (`.jsonl.zst`). ACP Files → import math → Publish Game → Math.

2. **Frontend** — From `SlotFolder/web`, `pnpm run build --filter=<game_id>`, then assemble a static folder (`index.html`, `_app/`, `assets/`, …) as described in `SlotFolder/README.md`. ACP Files → import that **assembled** folder → Publish Game → Front End.

Do not upload `/Framework`. Do not upload the raw `SlotFolder` tree as a single zip.

Full local-run and assemble steps: [`SlotFolder/README.md`](SlotFolder/README.md).
