# 01 — Currency and multiplier scales

## Why

Stake uses **two integer scales**. Mixing them produces payouts that are 10,000× too small or too large, and ACP will still accept the files. This Framework did not document the split. The upstream `stake-game-developer` skill’s `currency-rules.md` is the piece that matters.

## How it maps here

| Layer | Scale | Where it lives |
|---|---|---|
| RGS / wallet API | × **1,000,000** (micro-units) | `pnpm run dev` talking to live RGS; authenticate / play / end-round |
| Books / math events | × **100** | `SlotFolder/math/games/<game_id>/library/publish_files/` and Storybook playback |

Frontend HUD money = `bet * (bookPayoutMultiplier / 100)`. Never apply 1e6 to a book field.

GDD §11 lists RTP/max-win as **targets**. Those are ratios (96%, 5000×), not API units. Conversion happens only at the wallet and HUD.

## When

Before writing or copying any code that displays balance, bet, or win. Before the first live `play/` call. Storybook with fake books still uses the ×100 book scale.

## Instructions

### 1. Treat book values as ×100 integers

In math-sdk, `setWin` / `finalWin` / `payoutMultiplier` on a book row are integers where `150` means `1.50×` the total bet.

- Display multiplier: `payoutMultiplier / 100`
- Display win in currency: `wageredBet * (payoutMultiplier / 100)`

Example: bet `$1.00`, book `payoutMultiplier` `150` → show `$1.50`.

### 2. Treat RGS wallet values as ×1e6 integers

Authenticate, play amount, end-round win, and balance from the RGS are micro-units.

- Display: `apiAmount / 1_000_000`
- Send bet: `Math.floor(displayBet * 1_000_000)` (must be integer)

Example: player bet `$1.00` → `amount: 1000000`. Sending `amount: 1` is `$0.000001`.

### 3. After web-sdk is vendored, find the existing helpers — do not reimplement

In `SlotFolder/web`, search for `1_000_000`, `1e6`, `/ 100`, `payoutMultiplier`, `formatCurrency`, `amount`. The sample apps (`apps/cluster`, `apps/scatter`) already convert. When you duplicate to `apps/<game_id>`:

1. Keep those helpers. Do not add a third conversion.
2. Confirm authenticate balance is divided by 1e6 before HUD.
3. Confirm play `amount` is multiplied by 1e6.
4. Confirm win screens use book ×100, not API ×1e6.

Typical files (names may differ slightly in the kit; search, do not invent):

- `Authenticate` / wallet bootstrap
- `rgs-requests` (or equivalent play/end-round client)
- amount / currency util
- `Win` / HUD win display

### 4. Never mix the two in one formula

Wrong:

```text
win = bet * (bookPayoutMultiplier / 1_000_000)
apiAmount = bookPayoutMultiplier          // sending 150 as $0.000150
```

Right:

```text
winDisplay = betDisplay * (bookPayoutMultiplier / 100)
apiBet     = floor(betDisplay * 1_000_000)
apiWin     = floor(winDisplay * 1_000_000)   // only when the RGS asks for a money field
```

### 5. Integer discipline

- Floor or round to integer **before** any RGS POST body.
- Do not accumulate floats across tumbles for the API; use the event totals math already emitted (`setTotalWin` / `finalWin`).
- Frontend must **not** recompute cluster/scatter payouts. Display the event payload.

### 6. Verification checklist

- [ ] Storybook: a book with `payoutMultiplier` 100 on a 1-unit bet shows 1×, not 0.0001× and not 1e6×.
- [ ] Live session: authenticate balance matches the cashier-scale number, not 1e6× larger.
- [ ] Ten known wins: HUD amount equals `bet * (bookPayoutMultiplier / 100)` and matches GDD pay sketch intent.
- [ ] `end-round` is only called with API-scale integers.

## Do not

- Do not copy upstream TypeScript snippets that assume their file names (`Authenticate.svelte`, `amount.ts`) until you have confirmed those files exist in **this** web-sdk clone.
- Do not store GDD RTP as `960000` or `96`. RTP is a percentage target; books stay ×100 multipliers.
- Do not apply ×100 to wallet balance.

## Source

Upstream: `stake-game-developer/references/currency-rules.md`  
Official: [Stake Engine docs](https://stake-engine.com/docs) (wallet amounts)
