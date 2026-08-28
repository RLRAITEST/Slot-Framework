# 08 — Game info and disclaimer

## Why

Approval requires player-facing rules: paytable, modes, FS, RTP, max win, and a malfunction disclaimer. Upstream `game-info-author` is a section template. Their headings are Russian; use English (and later i18n) here. Map onto `parts.txt`: `slot-paytable_screen`, `slot-explainer_screen`, `slot-explainer_menu`.

## How it maps here

Write copy from the **GDD**, not from inspiration reports. After fork, put the text in the web app (SDK game-info / paytable component). Skin with assets copied from `Framework/Assets` if needed.

Social mode wording: [05-approval-and-compliance.md](05-approval-and-compliance.md). Default build uses normal casino terms unless `social=true`.

## When

After GDD §5–§11 are stable enough to not lie. Update again after RTP sign-off ([03](03-rtp-signoff.md)) so advertised RTP/max-win match math.

## Instructions

### 1. Produce these sections (English)

Use this outline in the explainer/paytable UI. If a section does not apply, say so explicitly (“This game has no bonus buy.”).

1. **About** — theme, one-round loop (GDD §1–§3).
2. **Features** — tumble, FS, multipliers (GDD §7–§9). No competitor names as clone claims.
3. **Symbol pays** — table from GDD §6, multiples of **total bet**.
4. **Special symbols** — wild, scatter, bombs, etc.
5. **How wins are evaluated** — cluster vs scatter in **plain language** matching GDD §5 (adjacent? min count?).
6. **Game modes** — base / ante / buy: cost × bet and what changes (GDD §10).
7. **Free spins** — trigger count, award, retrigger, cap.
8. **RTP and max win** — per mode if they differ; numbers from signed-off math.
9. **Controls** — bet levels from RGS config, autoplay confirm, sound, spacebar.
10. **Disclaimer** — use the text below (or the web-sdk’s existing equivalent if it is already present; do not duplicate two conflicting disclaimers).

### 2. Mandatory disclaimer (keep meaning; punctuation may match kit)

Use this English text unless the vendored web-sdk already ships Stake’s official string — then **keep the kit string**.

> Malfunction voids all pays and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted bets. The expected return is calculated over many spins. Animations are not representative of any physical device, and are for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © Stake Engine.

Upstream variants say “wins” vs “pays and plays” and include a year on the TM line. Prefer **whatever Stake’s current frontend checklist / SDK** shows. Do not invent a third variant.

### 3. Wire into the app

1. Find the sample’s game-info / help / paytable route or modal in `apps/cluster` or `apps/scatter`.
2. After copy to `apps/<game_id>/`, replace sample paytable numbers with GDD §6.
3. Mark `parts.txt`: SDK chrome vs copy-from-Assets vs cut.
4. Confirm RTP/max-win strings are not hardcoded in a second place that can drift.

### 4. Checks

- [ ] Every paying symbol in math appears in the paytable.
- [ ] FS trigger text matches math (`3 scatters = N spins` or whatever GDD says).
- [ ] Buy/ante cost matches `index.json` / `BetMode` cost.
- [ ] Disclaimer visible.
- [ ] Social build (if any) passes the word list in [05](05-approval-and-compliance.md).

## Do not

- Do not copy Sweet Bonanza / Sugar Rush paytables.
- Do not advertise RTP before [03](03-rtp-signoff.md) pass.
- Do not keep the Russian section titles from the upstream skill in the player UI.

## Source

Upstream: `game-info-author/SKILL.md`, approval checklist game-rules section  
This repo: GDD §6–§11, `Framework/Content/Lists/parts.txt`
