# Independent tester — release 1, round 3 (2026-10-02)

Spec only (DECISIONS top, OPEN_ITEMS top, mock, REPORT_r1b). Chromium all; WebKit for A, B, C, Move all, stale Undo.
Bodies a1–a2, y1–y7 (mk5.sh + v3lib.js); screens shots/v3/.

## Round-2 items: A FIXED (both engines) · B FIXED (both; 2 forms left, #6) · C FIXED (both) · D FIXED · E FIXED · F FIXED ·
G CHANGED as stated · I NOT FIXED (Recent ignored the exclusions) · J FIXED (the "No place yet" button still 4 px wide at 390).

## Findings — and what was done (checks in audit_r1: V1, V2, V2b, S3)
1. **BUG (store)** — an Undo still on screen rolled back a NEWER move made on another phone (Robert's edge ended, his words
   hidden, "last seen" rolled back). → FIXED: Undo checks the item; if anything changed after the save it would undo, it
   changes nothing and says "Not undone · it changed since". V1.
2. **BUG (store)** — "Move all to…" still offered the place itself and a box in it, under Recent; picking them re-dated
   "last seen" or moved things into a box inside the same place. → FIXED: Recent obeys the same exclusions. V2b.
3. DESIGN — renaming a place rewrites its name in old history lines; her old words then offer "New place: <old name>". → Tanya.
4. DESIGN — Save while "Naming…" (before "Your wallet?") makes a second wallet — matches what the screen said. → Tanya.
5. DESIGN — old data (place as text only) becomes a real place and link on any save; Undo restores it as a link. → as built.
6. Privacy — "p/w hunter2", "login bob hunter2" passed. → FIXED (Save blocked). S3.
7. Small — the caption on an editor's screen credits him for a photo he didn't take after a Move; Move all search
   "tin" offers "New place: Tin" without saying why Tin box isn't there. → noted.

## Held up
Double taps (Save, Undo, New place); Save + Next into a new place (one place, three links; Undo keeps it for the others);
leaving the camera with the list open; a box moved twice then Undo; words on an item inside a moved box; Write it down
in any order; no Undo after reload; people (no Undo for an editor's move, none for the editor); slow AI. No page errors.
