# What to create — `halloween`

Plain make-list. One line = one file (or one animation). Theme: **classic Halloween / autumn**. Pumpkins, leaves, bats, ghosts. No snow. No ice. No wilds. No bomb symbols.

Quality notes and pass/fail live in [`assets-list.md`](assets-list.md). This file is only **what to make**.

Drop files in `Framework/Assets`, then copy accepted ones into `SlotFolder/web/apps/halloween`.

---

## Do not create

- Wild symbol
- Multiplier bombs
- Ante Bet button
- Title or `×` / RTP text on the lobby thumbnail
- Winter, snow, frost, candy-shop skin

---

## 1. Low symbols — board icons + animations

For **each** of these five, create **all five** items below.

| Id | Subject |
|---|---|
| L1 | maple leaf |
| L2 | acorn |
| L3 | bat |
| L4 | spider |
| L5 | candy corn |

Create for L1, then copy the same five for L2–L5:

- [x] Create the **board icon** (square, reads small on a 7×7 cell, transparent PNG)
- [x] Create the **paytable icon** (small, same character, used in info/paytable)
- [ ] Create the **land / drop animation** (hits the cell)
- [ ] Create the **win animation** (cluster highlight)
- [ ] Create the **burst / explode animation** (symbol leaves the board)

---

## 2. High symbols — board icons + animations

Same five items, more detail than lows.

| Id | Subject |
|---|---|
| H1 | jack-o-lantern |
| H2 | ghost |
| H3 | witch hat |
| H4 | coffin |
| H5 | cauldron of witch brew |

- [x] Create the **board icon**
- [x] Create the **paytable icon**
- [ ] Create the **land / drop animation**
- [ ] Create the **win animation**
- [ ] Create the **burst / explode animation**

---

## 3. Scatter — tombstone with **FS**

This is the Free Spins symbol. Create a tombstone with the letters **FS** on it (readable at cell size).

- [x] Create the **board icon** (tombstone + FS)
- [x] Create the **paytable icon** (same, smaller)
- [ ] Create the **land / drop animation**
- [ ] Create the **anticipation animation** (2–3 already on the board, waiting for one more)
- [ ] Create the **trigger burst** (Free Spins start)

---

## 4. Multiplier spots (on the cell, not a reel symbol)

- [x] Create a **marked cell** (first hit, no number yet)
- [x] Create the **value look** (×2, ×4, ×8 … ×128 — numbers can be a font on top of the mark)
- [ ] Create the **upgrade animation** (mark → ×2 → double)
- [ ] Create an **idle pulse** (valued spot sitting on the board)

---

## 5. World

- [x] Create the **base-game background** (Halloween night / harvest)
- [ ] Create the **Free Spins background** (same world, more energy)
- [x] Create the **board frame** (the ramme around the 7×7 grid)
- [ ] Create optional **foreground / vignette** (must not hide symbols)

---

## 6. Logo and loading

Official title is still TBD. Do not letter a banned name (Bonanza, Sugar Rush, Megaways, …).

- [x] Create the **game logo**
- [ ] Create an **animated logo** (loading / intro)
- [ ] Create the **loading screen**
- [ ] Create a **Free Spins banner**
- [ ] Create a **Buy Feature banner**

---

## 7. Lobby thumbnail (ACP tile)

Must look **bright** (autumn orange / harvest). No dark edges. **No words. No multipliers.** Title is added later in Stake’s tile editor.

- [ ] Create the **thumbnail background**
- [ ] Create the **thumbnail foreground** (one clear hero: pumpkin / coffin / tombstone — no FS text on the lobby tile)

---

## 8. Free Spins screens

- [ ] Create the **intro screen** (“Free Spins awarded”)
- [ ] Create the **trigger celebration** (scatters land → go to bonus)
- [ ] Create the **retrigger celebration**
- [ ] Create the **summary / outro** (total win)

---

## 9. Win screens

Do not bake payout numbers into the art.

- [ ] Create the **win** banner/screen
- [ ] Create the **big win** banner/screen
- [ ] Create the **mega win** banner/screen
- [ ] Create a **particle / coin burst**
- [ ] Create (or pick) a **count-up number style**

---

## 10. Type

- [ ] Create or pick a **display font** (wins and multipliers)
- [ ] Create or pick a **UI font** (buttons, paytable)
- [ ] Create **logo lettering** if the logo is hand-drawn

---

## 11. Sound

- [ ] Create **base-game music** (loop)
- [ ] Create **Free Spins music** (loop)
- [ ] Create **Free Spins ambient** (optional extra bed)
- [ ] Create **tumble / drop** sfx
- [ ] Create **symbol land** sfx
- [ ] Create **cluster burst** sfx
- [ ] Create **spot mark / upgrade** chime
- [ ] Create **Free Spins trigger** fanfare
- [ ] Create **retrigger** sfx
- [ ] Create **win jingles** (small / big / mega)
- [ ] Create **button click** sfx

---

## 12. Buttons and HUD (only if you skin them)

The Stake kit already has these. Skip this section if you keep kit chrome.

- [ ] Create **spin** (idle, hover, pressed, disabled)
- [ ] Create **autoplay**
- [ ] Create **turbo**
- [ ] Create **bet + / −** and **max bet**
- [ ] Create **settings**
- [ ] Create **sound on/off**
- [ ] Create **paytable / info**
- [ ] Create **balance / win / bet** panels
- [ ] Create **Free Spins counter**
- [ ] Create **multiplier meter**
- [ ] Create **Buy Feature** button + confirm popup

---

## 13. Optional (not needed to build the game)

- [ ] Create an **animated preview** (gif/webm)
- [ ] Create extra **promo stills**
