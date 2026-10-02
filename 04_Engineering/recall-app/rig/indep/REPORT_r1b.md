# Independent tester — release 1, round 2 (2026-10-02)

Spec: DECISIONS 2026-10-01, OPEN_ITEMS (release 1), the mock, REPORT_r1. No app source. Bodies `v1–v3` (verify), `n1–n6`
(new ground); screens `shots/v2/`. Chromium all; WebKit for #1, #3, #4, #5. Robert = editor grant.

## Round-1 fixes
| # | Finding | Verdict |
|---|---|---|
| 1 | "New place: <her box/item/filler>" | FIXED (both engines) |
| 2 | Undo kept added photos | FIXED |
| 3 | "password hunter2" became a place | FIXED for the reported forms; new gaps (B) |
| 4 | In list counted items twice | FIXED (both engines) |
| 5 | Largest cut names | FIXED (both engines) |
| 6 | Put it in re-dated words | FIXED; its Undo re-dated them (A) |

## New findings — and what was done (checks in audit_r1: U1–U3b, S1–S2, W1, G1)
- **A. BUG (store)** — Undo rewrote who said her words and when (Robert's words became Margaret's, dated at the Undo).
  → FIXED: Undo restores the words with their own time and author. U1.
- **B. BUG (privacy, store)** — "passwd hunter2", "pass: hunter2", "user bob pass hunter2", "PIN4821" passed; a search
  made "Pass: hunter2" a place. → FIXED: all blocked; no new place from a search with one. S1, S2.
- **C. BUG (store)** — Write it down → "Somewhere else" made a place named like a sentence ("In the shoebox under the
  bed"); "pantry SHELF" linked to a place spelled that way. → FIXED: typed words are her words (no place); an exact name
  of a place she has (any case) links to that place as it is named; "New place: X" picked in the list makes the place. W1.
- **D. BUG** — an editor never gets Undo (as ruled: Undo is the owner's — it deletes, which only the owner may); his Move
  said "Put away just now" → FIXED ("Moved"). "Remove this place" was offered to an editor and failed silently → FIXED:
  shown to the owner only.
- **E. BUG (store)** — Undo left "last seen" at the Undo time. → FIXED. U2.
- **F. BUG** — a Move that only took it out (✕ → Save) had no Undo. → FIXED: the page note offers Undo. U3, U3b.
- **G. DESIGN** — the part-of-a-name rule hid common words and offered the shorter of two names. → CHANGED: only parts of
  ITEM names are held back; "in the garage cupboard" offers "Garage cupboard"; the longer of two matching names wins
  ("desk drawer" → Desk drawer, not Desk). G1.
- **H. DESIGN** — a removed place is still offered from her words (its name is in items' history). → for Tanya.
- **I. DESIGN** — "Move all to…" offered the place itself and a box that is in the place. → FIXED (neither offered).
  No Undo after Move all / one row → noted.
- **J. Small** — Write it down: summary after a box then a chip (FIXED), "No place yet" button overflow at 390 (noted),
  title now "What is the … in?" (FIXED), "New place: Attic" now makes the place (FIXED); search spacing kept as typed
  (noted); after "Your wallet?" Yes the band says "One you have" (FIXED).

## Held up
New places from words (✕/Cancel leave no stray place; re-use of a just-made place), Write it down picks, a place's page
(Where this place is / Not in anything / no circles / Remove greyed while it holds things / Move all incl. old data),
Undo of a Log with a new place, Undo twice, old data (Move it, words, ✕), two people (Robert's actions allowed; "Robert
said"). No console errors.
