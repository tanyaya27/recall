# Board — 2026-09-14 — Ravi's third round (on build 20260914c)

## Verified cause first (Priyanka)

**The two footer buttons are different sizes again.** My own fix from this morning did it.
To beat `label.file { color: var(--ink) }` I added `label.btn-primary` to the button
rule — specificity (0,1,1). But the footer sizes its children with `.footer-inner > *`
at (0,1,0): the *button* took the footer's bigger font, weight and side padding; the
*label* kept the base rule's smaller ones because (0,1,1) outranks (0,1,0). Two
elements, two cascades. Fix: stop giving the label default a colour at all (`button`
alone gets `color: var(--ink)`), and remove `label.btn-primary` from every selector so
both controls sit at (0,1,0) and take the same footer rule. Lesson for LESSONS.md: a
`<label>` styled as a button must never appear in a selector the `<button>` isn't in.

## Ravi's rulings that override this morning's board

1. **The strip shows the next photo peeking in.** Priyanka's full-width page (Photos-app
   style) is out; Margaret's own line this morning — "I'd never guess to swipe unless I
   could see the next one" — was right and we should have followed it. Pages 86% wide,
   snap to start, the next edge visible.
2. **Photos are taken on the photo card, as many as wanted, before the place is chosen.**
   Each photo appears as a thumbnail in a row under the big photo with a large ✕; a
   camera button takes another; tapping the place saves them all as one log. This
   replaces the *Add another photo* toast action (too late, too small, gone in six
   seconds). For a thing already on the board, the thing card gets **Add a photo** —
   straight into the current log, no card, no question.
   **Devin:** agrees; the thumbnails are the affordance the toast lacked. The big photo
   is whichever thumbnail was tapped last; the first photo stays the cover and the one the
   AI names. ✕ is 2.75rem — a thumb target, not an icon. **Maya:** the card gets busier;
   accepts because the chips still sit right under and nothing is asked twice.
   **Sam:** `logId` per card; extra photos are `extra: true` snaps — as built this
   morning, just written from the card instead of the toast.
3. ***Fix or remove* conflates deleting the item with removing a photo.** Split: the
   quiet control becomes **Fix** (name, place, move to the top) and *Remove this photo*
   stays under the photo. Removing the *item* leaves the thing card entirely — it lives in
   the tile's long-press sheet (4) and in the last-photo path. **Maya:** objection — a
   thing with one photo and a person who never long-presses has no way to remove it
   except through *Remove this photo* → "remove the item?" Devin: that path is exactly
   the one she'd take — "get rid of this picture" — and it asks the right question.
   Accepted.
4. **Press-and-hold on a tile opens a sheet of the item's actions:** *Add a photo* ·
   *Change the place* · *Rename* · *Move to the top* · *Remove* · *Cancel*.
   **Devin:** a long-press is invisible — nothing on the tile says it's there — so it is
   Robert's shortcut, not Margaret's path; every action in it must also be reachable by
   a visible route (the thing card's Fix, Add a photo, Remove this photo), which they are.
   Sheet: same in-app sheet as confirms, big rows, Cancel last and largest. 500 ms hold;
   the tile stops the iOS image callout (`-webkit-touch-callout: none`) or the phone's own
   menu wins. A short tap still opens the thing. **Margaret:** "if I hold it by accident
   and a list pops up I'll just press Cancel" — that is the test.
5. **Recognising a thing already logged has to be rock solid** — the person has, by
   definition, forgotten they logged it. `sameAs` from the naming call (this morning) is
   the model reasoning from *names*; it never sees the old photo. **Sam:** make it look.
   Second call when the first finds no match: the new photo plus the thumbnails of up to
   six candidates — the items whose names are nearest by the search tiers, then the most
   recent — numbered; "which of these, if any, is the same object as the new photo?";
   one index or none, with a certainty. One more round-trip (~3 s) only when the name
   path failed; the D3 machinery already handles a match that lands after the save (*Is
   this your …?*). Thumbnails go down at 320 px for the call (~20 KB each).
   **Priyanka:** and log it — `merge` gets `via: 'name' | 'sameAs' | 'visual'` — so the
   export shows which tier actually catches duplicates on a real phone.
   **Maya:** with visual matching, a wrong match is the new risk (two similar mugs).
   Guardrail stands: the card shows *Your mug — new photo* with *Not your mug?*; and the
   visual call is told to answer *none* unless it is the same individual object, not the
   same kind of object.
6. **The camera's Retake / Use Photo has no Cancel.** That is iOS's own camera sheet
   (`<input capture>`): Cancel is on the camera screen, so backing out is *Retake* → *Cancel*.
   Two ways out: (a) keep the phone's camera and make a bad shot cheap — with (2), *Use
   Photo* lands it as a thumbnail she can ✕ in one tap; (b) an in-app camera
   (`getUserMedia`): our own shutter, our own thumbnails, our own Cancel, and the
   multi-photo flow becomes one screen. **Priyanka:** (b) costs a permission prompt on
   first use, poorer photos (no HDR, no tap-to-focus on some phones), orientation
   handling, and a new surface to test on every iOS release; it works in a home-screen
   app since iOS 13.4, but it is the single most fragile web API on iOS. **Devin:** (b)
   is the better product; (a) is the better week. Recommend (a) now, (b) as a spike once
   the phone test is stable. **Robert:** "the real camera takes better pictures."

## Splits for Ravi / Tanya

- Camera: keep iOS's camera with the ✕-able thumbnail as the escape (rec.) vs in-app camera.
- Long-press sheet: build it (Robert's shortcut; every action also visible elsewhere) —
  Devin's condition is met; no split, noted for Tanya.

## Outcome (2026-09-14, built as `20260914d` and reviewed in the rig before hand-off)

Ravi's rulings 1–5 built as ruled. Camera: (a) — the phone's own camera stays; a bad shot
is one ✕ on the roll. In-app camera is a later spike. Long-press sheet built with Devin's
condition met.

**What the rig showed before you did** (this is the "review the outcome" step that was
missing): the two footer buttons were indeed different — the label was 19 px / 400, the
button 21.8 px / 700 — the `label.file` cascade bug; fixed and re-probed to identical
computed styles. The one-line day line truncated at 390 px next to the Settings control;
now two lines. The visual duplicate check's first version cancelled itself on its own
state change and never delivered a verdict; caught in the rig, fixed. The quiet row on the
thing card wrapped *Fix* onto its own line; shortened to *Add photo · Remove photo · Fix*.

