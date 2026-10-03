# Fresh-eyes walk of `20261001a` — 2026-10-02

Rig, 390×844, empty house, as Margaret on day one: log three things, find one, move it twice. Judged against
"Simplicity must rule everything", not the tests. Screens: `design/mockups/WALK_2026-10-02_release1.jpg`.
Rig script: `rig/walk_m1.js`, `rig/walk_m2.js`.

## Ravi's report (10-02, Walgreens brochure)
- R1. Move it → typed "on my lab desk" → Save. "In: Workbench or desk" was not replaced.
- R2. Not asked to photograph the new place (the lab desk).
- R3. Item page shows two wheres: "Workbench or desk" and "on my lab desk".
- R4. Tapping the In chip changes tier 1 only; he expects to change what it is in there too, with each next tier appearing below.

## Claude's walk (same root as R1/R3 = W1–W3)
- W1. Every camera asks "where" twice: a text box and "What is it in?". They are stored apart and nothing says which wins.
- W2. A Move by words only keeps the old place. The store says Kitchen counter; her words say dining table.
- W3. **Find then answers the wrong place** ("Kitchen counter"). This is the app's one job.
- W4. The card after that Move says "Your words saved", not "Moved". The page still says "seen today" at the old place.
- W5. One sentence gives two "New place" buttons (Kitchen counter / Toaster); she has to choose what she already said.
- W6. A Log with both filled saves the same place twice: "In: Kitchen counter · 'on the kitchen counter by t…'" (truncated).
- W7. "+ What is the Kitchen counter in?" sits under the chip on every Log and Move. It's a question nobody asked.
- W8. The item page shows the chain as three empty pin boxes, then "moved … · last seen …" wrapped onto two lines.
- W9. A words-only item has both "Move it" and "Put it in a place or a box". They do the same job.
- W10. "In this photo: white surface" under every photo. Noise. So is the label text (Ravi's "Walgreens · 4255543-5635 · ©2024 …").
- W11. Home's first-run line says "Take a photo of where you put something". The camera photographs the item.
- W12. "It holds items" is the first row of the item's settings (jargon, rarely used).
- W13. In the chip list the current place says "nothing here yet" while this item is in it.
- W14. Ravi's live list has junk places from older builds: "A place", "Desk dra", "In air", two empty cardboard-box places.

## Diagnosis
The problem is the model, not a bug. Release 1 made "where" two independent answers (words + In) with no rule between
them. The checks prove the store matches that ruling. The ruling itself produces a wrong answer in Find.
