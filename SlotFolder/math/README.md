# math/

Placeholder until Init. Follow [`../README.md` § Init](../README.md#init): remove this file, clone [math-sdk](https://github.com/StakeEngine/math-sdk) into this directory, then `make setup`.

Your game then lives at `games/<game_id>/` — only after the GDD is `fork-locked`. Do not copy `games/0_0_*` before that.

ACP math upload is **not** this whole tree. After `make run GAME=<game_id>` (with compression/optimize as required), upload:

`games/<game_id>/library/publish_files/`

Isolation: no imports or paths to `/Framework`. Copy specs into this game folder if you need them at sim time.
