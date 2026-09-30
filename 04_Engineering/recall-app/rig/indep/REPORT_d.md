# Independent break-test of build 20260930d (rig), 2026-09-30

Tester: a separate agent that read only the rulings (OPEN_ITEMS "NOW — d"/"NOW — c", DECISIONS 09-30), never the code.
Chromium + WebKit, 390x844 and 375x667, Normal/Largest, the stand-in keyboard, rules on for every save.
Scripts `indep/d1_body.js` … `d11_body.js`; shots `indep/shots/d/`, `shots/d_n/`, `shots/d_wk/`.

## Findings (most harmful first)
1. BUG — Choose place with the keyboard up: the matches are hidden (typing "Pan": only "A new place called “Pan”" shows;
   Pantry shelf is under Cancel/keyboard). Largest 375x667: the search itself half under the keyboard; even with no
   keyboard the rows start at 693 px on a 667 px screen. The new header pushes the list down. Risk: duplicate places. (both)
2. BUG — Undo of a Move leaves "moved today … · last seen …" on the item page (history keeps the Pantry line and adds a
   new Hall table line; lastSeenAt moves). After Undo it never moved → "seen". (both)
3. BUG — The camera's viewer removes a photo without asking (the item page's viewer asks); removing a named tier's only
   photo also wipes its name ("Place: not defined"). (both)
4. BUG — A new tier on top, photographed, gets the header "Changing what the Hall table is in — it moves, with everything
   in it." Adding on top is not a move (+ then Choose place says it right: "Choose what … is in."). (Chromium)
5. DESIGN — The viewer's title differs: item photo "Photo 1 of 1 · time"; a place "Name · photo 1 of 1"; a camera tier
   with one photo "Foyer bench" (no count). A known place in the camera has no actions.
6. DESIGN — "Current place" is right, but often below the first screen (the list keeps its order).
7. BUG (minor) — "moved with the wooden box" (lower case; a place keeps its capital).
8. BUG (minor) — level 2 selected: "Tap it again to change it. [+] adds a level on top." reads broken.

## Held up
One viewer in the camera (title in the top bar, all photos of a known place, swipe, Rename, covers the camera, closes
back to the same state); Choose place rings the right tier on each of 3 tiers with the right sentence, "come off" and
the badge; Log mode too; seen vs moved in 8 cases (move, add photo, written, old item, box moved, counter moved, tier on
top, photo time); no photo lands on the wrong place in 4 pick cases; B1 (a pick right after a photo keeps it). No page
or console errors.
