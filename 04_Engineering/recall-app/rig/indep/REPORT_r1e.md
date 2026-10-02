# Independent tester — release 1, round 5 (2026-10-02)

Verification: N1 loops — partly (one phone fixed; place loops / loops via the moved item from another phone not) · N2 FIXED ·
N3 FIXED · N4 FIXED · N5 FIXED · N6 FIXED · N7 unchanged (result = screen). No legitimate Undo refused wrongly
(UG1–UG11, LP1, LP5).

Findings — and what was done (audit_r1 Q1–Q4):
1. **BUG (store)** — a place loop made on another phone while the camera was open: Save wrote the item and dropped the
   looping row silently. → FIXED: before anything is written, the whole chain is checked against the store (boxes and
   places alike, and a place under a box); a loop → "Not saved — that would put something inside itself". Q1.
2. **BUG (store)** — Undo deleted a new place that another phone had used since (the hoe pointed at nothing). → FIXED: a
   place a save made is kept when anything else is in it. Q3.
3. **BUG/DESIGN (store)** — her "in" row for a box another phone had just placed: Save overwrote the other phone's newer
   place. → FIXED: "Not saved — the Crate was just put in the Linen closet (another phone). Take off its “in” row…". Q2.
4. **BUG (screen)** — a loop through the item being moved (another phone) failed silently. → FIXED: "Not saved". Q4.
5. Robustness — a place-in-box link from old data/another client made a real loop. → FIXED by the same chain check (never
   offered; refused at Save).
6. Small — loop refusals logged console errors (no longer); a restored link says by=margaret, how=undo (as built); Save
   tapped with the tier list open only closes the list (safe).
