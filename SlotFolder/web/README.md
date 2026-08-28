# web/

Vendor the [Stake Engine Web SDK](https://github.com/StakeEngine/web-sdk) into this directory (clone or copy the kit here). Your game then lives at `apps/<game_id>/`.

ACP frontend upload is **not** this whole tree. After `pnpm run build --filter=<game_id>`, assemble the static folder (`index.html` + `.svelte-kit/output/client/*`) as described in `../README.md`, then import that folder.

Isolation: Framework never ships in the Vite graph. Copy assets from `/Framework/Assets` **into** `apps/<game_id>/` (or the SDK static/asset path the sample already uses).
