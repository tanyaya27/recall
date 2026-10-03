# Independent tester — round ow2 on the one-where build (10-02 night)

Scripts: `indep2/n1_notes.js` … `n10_self.js` (+ t1–t8 baselines). Run: `PORT=849x node indep2/<script>`.
Round ow1's fixed rows were re-checked: all held (t3 A5 / t5 N4 / t7 F6 outdated by rulings, not bugs).

| # | Find | Kind | What was done | Check |
|---|---|---|---|---|
| 1 | Names not in a–z (Hindi) all normalised to "" → linked to the wrong place, or refused | store | `lib/where.js nameKey()`: normName, else the trimmed lowercase text | n7 H1–H4 |
| 2 | Undo wiped an old words-only where (note, then Move, then Undo) | store | `prevOf()` keeps where-words and the note apart; Undo writes both back | n1 A1 |
| 3 | Undo brought back a note that was no longer showing | store | prev is what was ON SCREEN (`noteOf`), not the newest words entry | n6 Q1 |
| 4 | Undo deleted another phone's newer photo of the item | store | stale if a snap of the item is newer than the save | n2 B1 |
| 5 | Undo deleted a new place another phone had put inside another | store | stale if an edge from a place this save made changed since | n2 B2 |
| 6 | 2-second grace let Undo drop a place photo taken 0.3 s later | store | place photos / updatedAt / edges compared with no grace (own writes finish before `after`) | n2 B3 |
| 7 | "Put items in" toast Undo: no stale check, no note/last-seen restore | store | the same `undoChain` + `prevOf` as everywhere | n6 Q2, n8 R2 |
| 8 | "under the sink" made a NEW place "Sink" though "Under the sink" exists; "behind the couch" → "Couch" | store | only in/on/at/into/onto/inside are stripped; an exact name as typed is tried first | n4 E5a–E6 |
| 9 | Log: "my drill" made the drill its own place; a guess of the item's own name filled the field | store | the new item's own name is "Can’t put it there." | n10 S1, S2 |
| 10 | maxLength 80 cut names; the field stopped growing at 120 px | store/screen | 120 characters; grows to 220 px | n8 R1, n4 E4 |
| 11 | Write it down → "Somewhere else" still saved words as a where; "the garage" didn't link | store | read like the camera field: exact box/place, else a NEW place | n1 A8 |
| 12 | A guess she can't use (an item's name, a password) was still offered | screen | never offered, typed or not | n9 V1, V2 |
| 13 | At 375×667 Largest the guess box pushed the field off screen | simplicity | the note button and the photo strip hide while the guess is up; the card scrolls | n5 G1, G2 |
| 14 | "Your keys?" Yes on a words-only item: its words not shown; no "(previously …)" | screen | its words show in the field; header "(previously: “…”)" | n1 A5h, n8 R4 |
| 15 | "Take it out" named the typed place; the place photo became the item's cover | screen/store | names where it is now; such photos join the item's photos, never as the cover | n3 P4 |
| 16 | Place photos dropped silently by the ~700 KB guard | simplicity | **not changed** — OPEN_ITEMS | n6 Q4 |
| 17 | Hidden "moved" sightings after Move + Undo | store (hidden) | **not changed** (pre-existing) — OPEN_ITEMS | t4 U1c |

Held up (tester): pasted newlines, spaces-only, Enter; the → sheet at 375×667 Largest with 6 levels; pickers never offer the
item / its contents / a box for a place; level-only changes keep the note; note-only items are "Not put away"; Save + Next
never carries a note; box photos go to the box; stale Undo for a moved or renamed box; no page errors.
