# Game Design Documents

Designer drop folder **in a game fork**. Do not upload a slot GDD into the upstream template. In the fork, **all specs for that slot live here** — mechanics, aesthetics, audio, HUD, paytable, and anything else that defines the game. Development in `/SlotFolder` does not start until the design of record is in this folder.

Put files here as you author them (Markdown, PDF, Word, images, sheets). Do not put them in `SlotFolder`, `Lists`, `Recipies`, or `MechanicsInspiration`.

## What belongs here

| Kind | Examples |
|---|---|
| Mechanics | Grid, win evaluation, tumble, free spins, bet modes, math targets, event list |
| Aesthetics | Theme, art direction, symbol style, HUD look, screens, colour |
| Audio | Music / SFX intent (actual files still copy from `Framework/Assets` into the web app later) |
| UX / copy | Paytable text, explainer, loading, win screens |

`MechanicsInspiration/` is competitor teardowns (question banks), not this game. `Framework/Assets/` is unused production media, not a spec.

## Before development

1. Designer uploads documents into this folder.
2. Optional: copy `TEMPLATE.md` and fill it (or map uploaded docs onto its sections).
3. When win model + multiplier family + Stake mapping are decided (`fork-locked` on the template, or equivalent in uploaded docs), math/web samples may be copied into `SlotFolder`.

Until then: kits may be cloned into `SlotFolder/math` and `SlotFolder/web`; do **not** copy `games/0_0_*` or `apps/cluster|scatter`.

## Isolation

These files are reference only. Python and Vite never import this folder. After fork, copy a snapshot into `SlotFolder/math/games/<game_id>/` if the math tree needs a local readme. ACP still gets `publish_files/` and the assembled frontend, not this folder.
