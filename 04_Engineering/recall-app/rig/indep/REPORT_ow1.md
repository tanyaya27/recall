# Independent tester — round ow1 on the one-where build (10-02)

Full report as returned by the tester agent is summarised here with what happened to each find.
Scripts: `indep/lib.js`, `t1_typing.js` … `t8_relog.js` (run `PORT=847x node indep/tN_*.js`).

| # | Find | Kind | Fixed by | Check |
|---|---|---|---|---|
| 1 | Undo deleted another phone's newer photo of a place | store | undoChain: a place this save touched that changed since (photo, updatedAt) → "Not undone · it changed since" | audit_ow T1, t4 U2 |
| 2 | Undo deleted a place it made after another phone added a photo / renamed it | store | same stale check + the name the save gave it | t4 U7, U8 |
| 3 | Undo didn't take back photos a save added to a BOX | store | saveChain records box photos; Undo deletes those snaps, restores photoCount | audit_ow T3, t4 U3 |
| 4 | A note on a words-only item replaced its where | store | notes carry `n: 1`; `wordsWhere()` ignores notes; `noteOf()` for the page | audit_ow T4, t5 K2 |
| 5 | A new item with only a note was saved as a where (not "Not put away") | store | addItem `note` → needsPlace stays true | audit_ow T5, t5 N1 |
| 6 | "the", "on the", "in" alone became a NEW place | store | filler-only text is no place | audit_ow T6*, t1 T1–T2c |
| 7 | A place and a box with the same name: retyping moved it into the box | store | the where it is in now (or picked) wins; → list shows place docs too | audit_ow T7, t7 F3 |
| 8 | Save + Next: carried where, next item's 2nd photo goes to the item | ruling question | **kept** (a run into one box is photos of the things; the strip shows both) | — |
| 9 | Append passed a merged name that repeats | store if tapped | merged names de-duplicated | audit_ow T9, t2 G10 |
| 10 | Hidden "moved" sightings left after Move + Undo | store (hidden) | **not fixed** — predates this build; OPEN_ITEMS | t4 U1c |
| 11 | "Only this photo goes" removed everything | screen | removing the item's only photo keeps the where and the place's photos; Save waits for an item photo | audit_ow T11, t7 F2 |
| 12 | Move of a words-only item didn't show its words | screen | her words show in the field (placeholder) until she types | t5 K1 (reads value only) |
| 13 | An unusable where at rest: no reason, "(new)" | screen | "Can’t put it there." + the reason stay after Done; no "(new)"; a guess that can't be used is never put in the field | audit_ow T13 |
| 14 | A level-only change said "Set place. (previously was …)" | screen | "Set where the Small box is." | audit_ow T14 |
| 15 | + offered up to 5 levels | ruling | + offered while fewer than 3 levels (TIERS_SHOWN); deeper chains still shown and stored | t3 A5 (expects 5) |
| S1 | Guess box covered the field (small phone, Largest) | simplicity | the look and the guess sit in the card above the field | — |
| S2 | → sheet buttons below the fold | simplicity | levels + list scroll, buttons stay on screen | — |
| S3 | Long names cut off | simplicity | not changed | — |
| S4 | "places" counted boxes; "0 items" vs "nothing else here"; stray space | simplicity | "places / boxes / places and boxes"; one wording; names trimmed | audit_ow X3 |
| S5 | Slow engine: a burst got two guesses | simplicity | the wait counts from the shutter tap; no second ask while one is out | t2 (WebKit) |

Held up (tester): exact links for odd typing, password refusals, guess cancel/drop rules, place-photo rotation, private item photos,
level re-parenting and loops, Undo of notes/last seen/new places, Find for every state, no page errors.
