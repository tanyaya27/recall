# Independent tester — release 1, round 4 (2026-10-02)

Round-3 items: #1 stale Undo refused — FIXED (both engines; but not for boxes moved by a tier, N3) · #2 Move all incl.
Recent — FIXED (both) · #6 p/w, login — FIXED.

New since round 3: tiers 2–3 on the camera ("+ What is the … in?"). Findings — and what was done (audit_r1 L1–L5):
- **N1 BUG (store)** — a tier offered a box inside the item or inside a tier below; Save dropped the loop link silently and
  wrote the rest. → FIXED: never offered; a loop is refused before anything is written ("Not saved — that would put a box
  inside itself"). L1.
- **N2 BUG (store)** — after Save + Next the carried In (a box that had just got a place) still offered "+", and Save moved
  that box. → FIXED: the chip reads the box's place from the store. L2.
- **N3 BUG (store)** — the stale-Undo guard ignored boxes and places moved by a tier; Undo wiped Robert's newer move. →
  FIXED: the guard covers every box and place the save moved. L5.
- **N4 BUG (store)** — Undo restored a tier box from a stale copy (link back, but "No place yet"), and re-dated its last
  seen. → FIXED: the store's own copy; last seen restored. L4.
- **N5 BUG (store)** — the same new place twice in one chain made two places. → FIXED: never offered again (words or
  search); and one save makes one place per name. L3.
- N6 (screen) — Largest + keyboard with 3 tiers: the words field scrolled off; the tier list's long title took the room. →
  FIXED: while typing, the tier rows step aside; the list's title is one line. NEW badge no longer wraps.
- N7 small — double tap on a tier's New place lands on the chip (result = screen); history lines from a tier now say who;
  "Attic shelf." → the Attic shelf.

Held up: normal 3-tier chains of places/boxes/mixed; a place's list offers no boxes; nothing past tier 3; a saved chain
read-only; tier lists leave out the item, the In and the chain; ✕ on a middle row; changing the In drops the tiers; new
places at every tier + Undo; Move it with tiers + Undo; Save + Next + camera Undo; Robert (editor) with the rules on; her
words help the tier list; round-3 regressions (A1–A3, E, F, y2, y7). No page or console errors.
