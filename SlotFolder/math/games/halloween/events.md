# Book-event catalog — `halloween`

Copied from the cluster kit after fork-lock. Math must emit only these `type`s. Frontend `apps/halloween` handles the same list. Do not import `/Framework`.

Kit names win over the Framework template aliases (`freespinUpdate` → `updateFreeSpin`, etc.).

| `type` | Math emits | Frontend handles |
|---|---|---|
| `reveal` | after draw | show board |
| `winInfo` | after cluster eval | highlight wins |
| `updateTumbleWin` | tumble step wallet | tumble HUD |
| `tumbleBoard` | after cascade | drop/refill |
| `setWin` | spin win | win screen |
| `setTotalWin` | cumulative | HUD |
| `finalWin` | round payout | close HUD / clear grid |
| `freeSpinTrigger` | 4+ scatters in base | FS intro |
| `freeSpinRetrigger` | 4+ scatters in FS | retrigger UI |
| `updateFreeSpin` | each FS spin | FS counter |
| `freeSpinEnd` | FS summary | outro |
| `updateGrid` | after spot mark/upgrade | multiplier overlay |
| `updateGlobalMult` | if kit emits | global mult HUD |
| `wincap` | if cap hit | kit default |
| `enterBonus` | if kit emits | kit default |
| `createBonusSnapshot` | frontend resume helper | `bookEventHandlerMap` |

Custom payload: `updateGrid.gridMultipliers` is `number[][]` (7×7). `0` = unmarked or marked-without-value; `2, 4, 8, …` up to 128 after upgrades.

Do not emit bomb / Sweet-Bonanza multiplier types.
