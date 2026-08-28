# 10 — Pixi + Svelte lifecycle

## Why

Upstream `pixi-svelte-integrator` is about mount/destroy, resize, and not leaking tickers. You will not write a new Pixi renderer. Web-sdk already hosts Pixi inside Svelte. This guide is the **do not break the sample** checklist when you skin `apps/<game_id>/`.

## How it maps here

Gap-brief §3: duplicate `apps/cluster` or `apps/scatter`, then change assets and `bookEventHandlerMap`. Lifecycle stays with the kit.

## When

After Init (`pnpm install` in `SlotFolder/web`) and fork-lock sample copy. Not before.

## Instructions

### 1. Find the kit’s Pixi host

In `apps/cluster` or `apps/scatter` (and then `apps/<game_id>`):

- Search for `Application`, `pixi`, `onMount`, `onDestroy`, `destroy(`.
- Note which component owns the canvas.

Do not create a second `new Application()` in a HUD component.

### 2. Rules when you edit

1. Create / attach Pixi only in the same lifecycle hook the sample uses.
2. On teardown: destroy the application, unsubscribe tickers, remove window resize listeners. If you add a listener, you add a matching remove.
3. Resize: use the sample’s resize path (container size → renderer.resize). Do not hardcode 1920×1080 as the only layout.
4. High-DPI: keep the sample’s `resolution` / `autoDensity` policy unless you have a measured reason to change it.
5. Scene mutations go through the same board/tumble utils the sample uses. Random Svelte components must not poke sprite trees.

### 3. Assets

Copy graphics into the app’s asset pipeline (the path the sample already uses). Pixi load names must match. Spine vs sprite: follow the sample. Isolation: files physically inside `SlotFolder/web`, not linked to `Framework/Assets`.

### 4. Verification

- [ ] Storybook: open, spin, navigate away from the story, come back — no duplicate canvases, no console error on destroy.
- [ ] Resize desktop ↔ mobile width; board stays in the frame.
- [ ] Fast story remount (HMR or clicking stories) does not leak WebGL contexts (performance panel / GPU process growing).

If you add a custom overlay, still destroy it on unmount.

## Do not

- Do not `npm create vite@latest` a new Pixi app. The frontend checklist in the upstream skill says that; **this repo uses web-sdk**.
- Do not keep Pixi ticking after Svelte unmount.
- Do not import Framework images by URL.

## Source

Upstream: `pixi-svelte-integrator`  
Kit: [web-sdk](https://github.com/StakeEngine/web-sdk) sample apps
