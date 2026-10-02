# Independent tester — release 1 "Words, and one pick" (20261001a), round 1 (2026-10-01)

Read only DECISIONS 2026-10-01, OPEN_ITEMS (release 1), the mock, REPORT_f; no app source. Bodies `r1…r18_body.js`, helpers
`rlib.js`, build `mk4.sh`. Screens in `shots/r*/` (not committed). Chromium everything; WebKit: log with a new place, Move it,
camera + In list at Largest. Two people: Robert given an editor grant (as audit_roles does).

## Findings (most harmful first) — and what was done

1. **BUG — "From what you said" offered "New place: <one of her boxes or items>"**, even the box the loop rule hid, and
   filler ("New place: Egg timer is", "It is there", "Zzz qqq", "1978"). One tap + Save made a PLACE named like her box.
   → FIXED: a new place is offered only from what follows a where-word ("in the …", "under …"), never a name (or part of a
   name) of any item, box or place she has, never numbers or filler; a search for a name she has that can't be picked
   says why ("“Wooden box” is inside Memorabilia box — it can’t go in there"). Checks T1, T1b, T1c (audit_r1).
2. **BUG — Undo kept the photos a Move added** (and a new cover stayed the cover). → FIXED: Undo removes the photos taken
   in that save and puts the old cover back. Check T2.
3. **BUG (privacy) — "password hunter2" became a place** through "New place" (the words guard caught "password is …" but
   not "password hunter2", "pw hunter2", "login: bob / hunter2"). → FIXED: those are caught (Save blocked), and no new
   place is ever offered from words with a secret, or from a search with one. ("password notebook" is still fine.) T3, T3b.
4. **BUG — the In list counted each item twice** ("Kitchen counter · 2 items" for 1). → FIXED (T4).
5. **BUG — at Largest the In list cut names** ("Memorabil…"). → FIXED: names and second lines wrap; "you said it" sits in
   the second line; the chip's chain shows 3 lines.
6. **DESIGN — "Put it in a place or a box" saved at once and re-dated her words.** → FIXED: her words keep their own time
   and who said them; a toast "In the Pantry shelf · Undo". T6, T6b.
7. **DESIGN — a place and a box with the same name** ("Linen closet"): only the box is offered from her words. → for Tanya.
8. **DESIGN — "Your wallet?" Yes sets the chip to the wallet's old place**; if she then types a new spot and keeps the chip,
   the link and her words disagree. → as ruled (a known item's camera opens with where it is, ✕-able); for Tanya.
9. **DESIGN — her words can say where a box is ("tin box on the kitchen counter"), nothing acts.** → as ruled (release 1:
   nothing acts on words); release 2's hints ("…put it there? Yes").
10. Small: one-line field at Largest shows the end of a long sentence; no length limit (now 240 characters); ✕-only Move
    clears her last words (newest wins); the search box's inner rectangle (fixed); WebKit see-through sheet (rig's Linux
    WebKit); spoken words untested in the rig.

## Held up
The chip is what's saved; ✕ and pick again; Cancel leaves the chip; "in the blue folder in the desk drawer" as in the mock;
existing places found in any case/spacing; whitespace-only words not stored. Move it: chip set, Save off until a change,
changes undone turn it off again, Cancel asks. Newest wins; Undo restores place and words. A box moved from its own page
takes its contents (and their words); the box inside it is never offered; places can't make a circle. "Your wallet?" Yes/No.
Save + Next keeps the In. Two people: "You said" / "Robert said"; Not put away the same for both. Home, Not put away, Find.
PIN guard on PIN/code/passcode/combination/password. Largest 375×667, keyboard up, Linen and Dusk: no control cut off.
No page or console errors.
