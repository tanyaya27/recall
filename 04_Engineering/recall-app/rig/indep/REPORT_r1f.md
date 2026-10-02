# Independent tester — release 1, round 6 (2026-10-02) — **no store-changing bug: the gate is met**

Round-5 items #1–#5 FIXED (both engines where run): place loops from another phone refused with nothing written; Undo
keeps a new place someone else used since; her "in" row for a box another phone just placed is refused; a loop through the
moved item is refused; a place-in-box link from old data is never offered and refused at Save. Regression of rounds 1–5:
all held. No page or console errors.

"Does the chain check refuse a legitimate save?" — no, across 1-, 2- and 3-tier saves (places, boxes, mixed, new), re-picks
with a tier, Move it on boxes that hold things (up to a 6-deep chain), Save + Next, an editor with the rules on (incl. into
a box inside a PRIVATE box), old text-only places, and other-phone changes that are not conflicts (rename, unrelated move,
logging into the same box) — except:

1. BUG (blocks, not store-changing, rare) — the other phone put the box in the SAME place she chose: "Not saved". → FIXED
   (the same place is no conflict; audit_r1 Q2b).
2. DESIGN (blocks a save) — a box and a place with the same name ("kitchen" box, "Kitchen" place): the place can't be picked
   while the box is in the chain ("'Kitchen' is one of your items, not a place"). → for Tanya.
Notes: re-picking the same place with no photo leaves Save off (as ruled); a new item named like a box asks "Is this your
cookie tin?"; the tier list echoes her words incl. a secret (not stored); Undo sets needsPlace=true on a tier box that had
it undefined.
