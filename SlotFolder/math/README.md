# math/

Vendor the [Stake Engine Math SDK](https://github.com/StakeEngine/math-sdk) into this directory (clone or copy the kit here). Your game then lives at `games/<game_id>/`.

ACP math upload is **not** this whole tree. After `make run GAME=<game_id>` (with compression/optimize as required), upload:

`games/<game_id>/library/publish_files/`

Isolation: no imports or paths to `/Framework`. Copy specs into this game folder if you need them at sim time.
