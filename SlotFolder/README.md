# SlotFolder

Self-contained Stake Engine project. Math SDK lives in `math/`. Web SDK lives in `web/`. This folder does not import, path to, or depend on `/Framework`.

Copy assets **into** this tree when needed. Dragging `SlotFolder` is a **source** handoff. ACP gets **build outputs** only (two uploads).

## Layout

```
SlotFolder/
  math/                 # math-sdk clone; your game in games/<game_id>/
  web/                  # web-sdk clone; your game in apps/<game_id>/
  README.md             # this file
```

Replace `<game_id>` with the Stake game id once the sample is copied (see repo gap brief, items 2–3). Until then, `math/` and `web/` are empty trees ready for the official kits.

Kits:

- [Math SDK](https://github.com/StakeEngine/math-sdk)
- [Web SDK](https://github.com/StakeEngine/web-sdk)

## Isolation

Do not add imports, workspace packages, Make includes, Vite aliases, or scripts that reach `../Framework` or `/Framework`. Framework recipes describe *how* to change the sample; they are not imported by Python or the Vite graph.

## Run locally

Math (from `math/`, after the SDK is vendored):

```sh
make setup
make run GAME=<game_id>
```

Uncompressed / small `num_sim_args` first. Full run + compression + Rust optimize produces `games/<game_id>/library/publish_files/`.

Web (from `web/`, after the SDK is vendored):

```sh
pnpm install
pnpm run storybook --filter=<game_id>   # UI vs local/random books; no Stake login
pnpm run dev --filter=<game_id>         # RGS only after a live session query string
pnpm run build --filter=<game_id>
```

Tooling expected by the kits (Windows): Python 3.12, Make, Node 22.16, pnpm 10.5, Rust/Cargo for the optimizer.

## Assemble frontend static folder

`pnpm run build` does **not** emit a single folder you can upload as-is. Assemble one:

1. Create an empty folder (e.g. `SlotFolder/web/apps/<game_id>/build/`).
2. Copy `apps/<game_id>/.svelte-kit/output/prerendered/pages/index.html` into it.
3. Copy everything from `apps/<game_id>/.svelte-kit/output/client/` into the same folder (`_app/`, `assets/`, favicon, loader gifs, …).

Upload **that** assembled folder. Typical contents: `index.html`, `_app/`, `assets/`.

## ACP submit (two uploads)

On [engine.stake.com](https://engine.stake.com/), open the game → **Files**.

| Upload | Source | Then |
|---|---|---|
| Math | `math/games/<game_id>/library/publish_files/` (`index.json`, lookup CSV, `.jsonl.zst` books) | Import → **Publish Game** → Math |
| Front end | Assembled static folder above | Import the **whole folder** → **Publish Game** → Front End |

Approval is two separate requests (math and frontend), not one zip of this directory.

After publish: **Developer** → Start game session → Launch. That URL’s query string is what you paste onto local `pnpm run dev` to talk to the live RGS.

## Source handoff vs ACP

| Action | What you move |
|---|---|
| Teammate / backup | This whole `SlotFolder` (source) |
| Stake ACP | `publish_files/` **and** assembled frontend `build/` only |
