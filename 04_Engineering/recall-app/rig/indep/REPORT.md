# Independent break-test of build 20260929h (rig), 2026-09-30

Tester: a separate agent that read only the rulings (DECISIONS / OPEN_ITEMS), never the code. Chromium + WebKit,
390x844 and 375x667, Normal/Large/Largest, the stand-in keyboard, real permission rules on every save.
Scripts: `indep/*_body.js` (built by `indep/mk.sh`); screenshots `indep/shots/<suite>/` (cr- Chromium, wk- WebKit).

## Findings (most harmful first)
1. BUG — After a quick Log then Move, the Log's saved card (with its Undo) is still on screen over the Move toast; its
   timer stops while the camera is open. Tapping that Undo deletes the item. (both engines)
2. BUG — Recognition only ever offers the 4 OLDEST places; newer places (Desk drawer, Craft nook, any made today) are never
   recognised; Move it → photograph the current drawer → "A new place? Drawer" → a duplicate. (both)
3. BUG — Save cut off the right edge of the camera at Largest (390) and at Large on 375 wide ("Sa"). (both)
4. BUG — Renaming a box leaves a ghost place with the old name in Places (its items' location text keeps the old name). (both)
5. BUG — The Move toast is one line ending "…": the Q3 moved line never shows; " · " not the "in" pill. The camera's Q3 line
   is cut off at Large/Largest. (both)
6. BUG/DESIGN — Move it: "Remove this level" on level 1 removes the whole chain; Save goes off with no explanation. (both)
7. BUG (minor, safety) — Double-tap Save in Move it: the second tap opens "Remove your … ?" on the item page under the
   finger; its Remove sits where Save was. The sheet says "Settings → Recently removed"; the menu calls it "Deleted items".
8. BUG (minor) — Places still says "thing" ("1 thing here").
9. BUG (minor) — The saved card's squares use a plain "in", not the pill.
10. DESIGN — A middle level selected says "Tap + to add what the ikea shelf is in" (it already is in something; + adds on top).
11. DESIGN — + looks like "insert here" at 3+ levels.
12. DESIGN (small) — "Place: In the white shoebox" vs "Place: Ikea shelf"; search shows only the first level, lower-cased;
    no Rename on saved levels in the camera; "No, Choose place" then suggests the same place again; the photo badge can
    say 7 when the place keeps 6; a double tap on + opens the new level's sheet; Largest + 375 + keyboard: "Use this name"
    7 px under the keyboard; Largest: the band's long item name clipped at the left.

## Worked (coverage)
Log with 3 levels (box/place/typed) agreeing on every screen; 2nd visit shows every level, + on top, keyboard OK; 3rd
visit changes level 2 → Q3 line, box moves, Undo restores; picking a known box brings its place; Q4 holds; recognition Yes
adds the photo; name gate; 6-photo cap keeps main; Cancel halfway; Undo of a Log; Save + Next; slow AI (4.5 s) and bad
JSON; double taps create no duplicates.

Rig note: WebKit crashed on page.goto late in two long runs (~20 reloads with the live fake-camera canvas) — rig memory.
