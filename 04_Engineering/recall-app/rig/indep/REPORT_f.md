# Independent tester — build 20260930f (2026-09-30)

Tester read only OPEN_ITEMS (f, e), DECISIONS 09-30 and REPORT_timeout — no app source. Bodies `f1…f16_body.js`, `fw_body.js`
(WebKit), helpers `flib.js`, build script `mk3.sh` (mk2 without the test adapter; `__noAuto` set too). Screens in
`shots/f/` (cr- = Chromium, wk- = WebKit; not committed). Seed: baseball card → wooden box → memorabilia box → crawl space, rules on.
Chromium ran everything; WebKit ran the viewer, the field append, sticky adds and Largest — not finding 1.

## Findings, most harmful first

1. **BUG — a cancelled photo's late look becomes the suggestion for the NEXT photo; one tap + Use + Save files photo 2
   on that place and moves the item.** (Chromium)
   Move it → shoot level 1 → "A different place" (look will answer "Kitchen counter, sure" at 4 s) → Cancel at ~1 s →
   shoot again → "A different place" (this look answers "not recognised" at 0.3 s). Slot says "Not one ReCall recognises",
   field "Zz". ~3 s later the FIRST photo's answer lands: slot flips to "Kitchen counter · your photo looks like this one"
   for photo 2; behind the sheet the tier flips to Kitchen counter. Tap it → Use → Save → "✓ Moved just now".
   Store: card → Kitchen counter, Kitchen counter has photo 2. Old timeout #5 in a new shape.
   `cr-01-f16-before-stale.png`, `cr-02-f16-stale-suggestion.png`, `cr-03-f16-stale-bn.png`.
2. **BUG — ReCall's guess pre-fills the name field; typing appends to it.** (Chromium + WebKit)
   A non-matching guess ("hall closet") lands at 0.3 s, fills the field ("ReCall's guess — type to change it"); tap the
   field, type "Attic" → "Hall closetAttic", "Use this name" live. Old #4 through a new path. (A guess landing while she
   is already typing does not overwrite.) `cr-03-f9-b2-typed.png`, `wk-02-fw-prefill-append.png`.
3. **BUG — "This photo is…" truncates the place name** — at Largest (375×667) "Another photo of th…", "It's still there
   — the photo …"; at normal size mid-length names too ("…of the Memorabili…"). She can't see which place she's asked
   about. `cr-01-f13-xl-l1-modal.png`, `wk-04-fw-xl-modal.png`, `cr-01-f7-l2-ask.png`.
4. **BUG — the viewer opened from Before → Now is boxed inside the sheet and see-through** (y≈319 to the bottom; camera
   above it; "BEFORE/NOW" and "Back to the list" show through its bars). Breaks "one photo viewer". (Chromium + WebKit)
   `cr-02-f4-viewer.png`, `wk-01-fw-bn-viewer.png`.
5. **DESIGN-QUESTION (leans BUG) — Undo keeps the added photos.** Add-only save → Undo: "Undone · back where it was",
   but the wooden box keeps the photo, and the item's history gains an undo line though nothing moved. A real move →
   Undo restores the chain but the Pantry shelf keeps the photo. If she undid because she picked wrong, that place now
   carries a photo of somewhere else. `cr-08-f8-l2-undo.png`.
6. **BUG (latent) — the look still sets the tier behind Choose place** ("Kitchen counter", "Zz", "A place" on garbled,
   "Naming…" while it looks; outer tiers vanish; Save flips with each answer). Every exit tested restores it exactly and
   nothing reaches the store — but it's what lets finding 1 retarget the tier, and one missed restore from old #1/#3.
7. **BUG (minor) — Escape / Android Back don't close "This photo is…" or Choose place;** Back navigates the page under
   the camera (item page → "Find item") while the camera and sheet stay. `cr-03-f6-choose-closed-back.png`,
   `cr-06-f6-modal-closed-back.png`.
8. **BUG (visual) — at 390 wide the camera's tier strip hides level 3** (level 2 half-clipped, level 3 under "Choose
   place"); a tap where level 3 should be opens Choose place for the selected tier. `cr-01-f1-move-open.png`.
9. **DESIGN-QUESTION — the modal pre-highlights "Another photo of the X"** with the tier-colour border, so it reads as
   the default; Ravi's ruling was "nothing assumed". `cr-02-f1-after-shot.png`.
10. **DESIGN-QUESTION — a look that never answers says "Looking at your photo…" forever;** no "couldn't look" state
    (choosing still works). `cr-01-f11-t-never.png`.
11. Small: "Shutter: the new place. Photograph it." reads oddly; in Move it, camera Cancel still says "Nothing from this
    item is saved"; Before → Now for the current place says "will be in the Wooden box" when it already is; any Save on
    this item makes a "Crawl space" place doc with 0 photos (gone on Undo, no duplicates); WebKit at Largest: the sheet is
    translucent (maybe the rig's Linux WebKit lacking backdrop blur — check on the phone).

## Old timeout finds #1–#8

| # | Old find | Now | Evidence |
|---|---|---|---|
| 1 | late sure answer applied silently & saved | FIXED (see new #1) | answers after Cancel / Use / camera Cancel / Save left the store unchanged |
| 2 | Save during an unanswered ask = Yes | FIXED | no timed ask; modal covers Save; Save off until a change |
| 3 | late answer in Choose place sets tier, fills name, jumps list | PARTLY | name never an existing one, list doesn't move; tier behind still set (#6) |
| 4 | field pre-filled, typing appends | NOT FIXED (new path) | #2 |
| 5 | first look's late answer takes the second photo | NOT FIXED (variant) | #1 |
| 6 | Cancel + Save stores "A place" | FIXED | garbled only behind the sheet; store clean |
| 7 | AI guess becomes the name unaccepted | FIXED in effect | needs "Use this name" + "Use the …" |
| 8 | "Moved" when nothing moved | FIXED | "✓ Saved just now · 3 photos added to the Wooden box · …" |

## Held up

Sticky answers and shutter marks (3 shots L1, 2 on L2, 1 on inherited L3 — counts and store right; mark always matched
the next shot; any tier tap or + resets; Retake changes nothing). Dashed/solid borders. Cancel restores exactly (before
or after the suggestion, backdrop too). Cycles blocked (level 2 omits the wooden box; level 3 the memorabilia box).
A typed existing name in odd case/spaces is refused. Before → Now sentences (level 1; level 2 "it moves, with everything
in it"; a new name "NEW · a new place, with your photo"); Use + Save, Undo of a move restores the chain. Log of a new item
end to end. Largest + keyboard up: field and "Use this name" stay in sight. Answers at 0.3/3/9 s and garbled never touched
the store. No page errors. After every Save: no duplicate places, no lost tiers, no place inside its own child.
