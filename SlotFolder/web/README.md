# web/

Placeholder until Init. Follow [`../README.md` § Init](../README.md#init): remove this file, clone [web-sdk](https://github.com/StakeEngine/web-sdk) into this directory, then `pnpm install`.

Your game then lives at `apps/<game_id>/` — only after the GDD is `fork-locked`. Do not copy `apps/cluster` or `apps/scatter` before that.

ACP frontend upload is **not** this whole tree. After `pnpm run build --filter=<game_id>`, assemble the static folder (`index.html` + `.svelte-kit/output/client/*`) as described in `../README.md`, then import that folder.

Isolation: Framework never ships in the Vite graph. Copy assets from `/Framework/Assets` **into** `apps/<game_id>/` (or the SDK static/asset path the sample already uses).
