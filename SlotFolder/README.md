# SlotFolder

**Init and game copies belong in a fork of Slot Framework, not in the upstream template checkout.**

Self-contained Stake Engine project. Math SDK lives in `math/`. Web SDK lives in `web/`. This folder does not import, path to, or depend on `/Framework`.

Copy assets **into** this tree when needed. Dragging `SlotFolder` is a **source** handoff. ACP gets **build outputs** only (two uploads).

## Layout

```
SlotFolder/
  math/                 # math-sdk clone; your game in games/<game_id>/
  web/                  # web-sdk clone; your game in apps/<game_id>/
  README.md             # this file
```

Replace `<game_id>` with the Stake game id once the sample is copied. Do **not** copy `games/0_0_*` or `apps/cluster|scatter` until the design of record in `Framework/Content/Game Design Documents/` is `fork-locked` (template §14 or equivalent in uploaded docs). Until then, `math/` and `web/` are kit roots only.

Kits:

- [Math SDK](https://github.com/StakeEngine/math-sdk)
- [Web SDK](https://github.com/StakeEngine/web-sdk)

## Isolation

Do not add imports, workspace packages, Make includes, Vite aliases, or scripts that reach `../Framework` or `/Framework`. Framework recipes describe *how* to change the sample; they are not imported by Python or the Vite graph.

## Init

`math/` and `web/` ship as empty kit roots (placeholder READMEs only). Run Init only in a game fork. Init vendors the official SDKs into those folders and installs dependencies. This does **not** create your game. Do not copy `games/0_0_*` or `apps/cluster|scatter` to a `<game_id>` until the design of record in `Framework/Content/Game Design Documents/` is `fork-locked` (template §14).

### 1. Toolchain (Windows)

| Tool | Version / notes |
|---|---|
| Git | Required to clone the kits |
| Python | 3.12+ ([math-sdk](https://github.com/StakeEngine/math-sdk) requires `>= 3.12`) |
| Make | Required for `make setup` / `make run`. Install via Chocolatey (`choco install make`) or use Git Bash / WSL |
| Node | **22.16.0** ([web-sdk](https://github.com/StakeEngine/web-sdk)). On Windows use [nvm-windows](https://github.com/coreybutler/nvm-windows) or the Node installer |
| pnpm | **10.5.0** (`npm install pnpm@10.5.0 -g`) |
| Rust / Cargo | Only needed for the math optimizer, not for a first uncompressed book run |

Confirm:

```powershell
python --version    # 3.12.x
node -v             # v22.16.0
pnpm -v             # 10.5.0
make --version
```

Official kit docs: [math-sdk README](https://github.com/StakeEngine/math-sdk) · [web-sdk Get started](https://github.com/StakeEngine/web-sdk#getStarted).

### 2. Vendor the SDKs

`git clone` refuses a non-empty directory. Remove the placeholders, then clone **into** `math/` and `web/` (from this `SlotFolder/` directory):

```powershell
Remove-Item -Force math\README.md, web\README.md

git clone --depth 1 https://github.com/StakeEngine/math-sdk.git math
git clone --depth 1 https://github.com/StakeEngine/web-sdk.git web

# Drop nested repos so SlotFolder stays one tree (recommended for source handoff)
Remove-Item -Recurse -Force math\.git, web\.git
```

Git Bash equivalent: `rm -f math/README.md web/README.md`, then the same `git clone` lines, then `rm -rf math/.git web/.git`.

After this, `math/` is the math-sdk tree (`games/`, `Makefile`, …) and `web/` is the web-sdk monorepo (`apps/`, `packages/`, `package.json`, …). Kit samples such as `games/0_0_cluster` and `apps/cluster` come with the kits; leave them in place. Do not duplicate them to `games/<game_id>` / `apps/<game_id>` until fork-lock.

### 3. Install kit dependencies

```powershell
# Math — from SlotFolder/math
make setup

# Web — from SlotFolder/web
pnpm install
```

Init is done when both commands finish without error. You still cannot produce **your** books or spin **your** slot until a `<game_id>` exists. Optionally, `pnpm run storybook --filter=cluster` (from `web/`) only proves the web toolchain; it is the Stake sample, not this project.

Then continue with **Run locally** after fork-lock and the sample copy.

## Run locally

Math (from `math/`, after Init):

```sh
make setup
make run GAME=<game_id>
```

Uncompressed / small `num_sim_args` first. Full run + compression + Rust optimize produces `games/<game_id>/library/publish_files/`.

Web (from `web/`, after Init):

```sh
pnpm install
pnpm run storybook --filter=<game_id>   # UI vs local/random books; no Stake login
pnpm run dev --filter=<game_id>         # RGS only after a live session query string
pnpm run build --filter=<game_id>
```

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
