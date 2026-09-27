# Board: places inside places, the natural way (2026-09-24)

Follows Ravi's ruling (DECISIONS 09-24, "Step 3 rulings"): *"When users store or find they don't think about it in a nested way."*

Drawing: `mockups/S4_nesting_options.jpg`. These are screenshots of the real app in the rig, with both options built behind a prototype switch.

## What's the same in A and B

- **Storing doesn't change.** She picks the usual place, or types or says one, e.g. "blue tin, top shelf of the bedroom wardrobe".
- **A container is just a thing.** She logged the blue tin like anything else. Wherever a thing's place names another thing, ReCall links the two. The match is on the whole place or its first part ("blue tin", "in the blue tin"), and only on an exact name or a name the thing was called before; a loose match would send her to the wrong tin.
- **The link is computed, never stored.** Moving the tin means logging it somewhere new, and the key's answer follows (frame 4). A place typed before the tin was ever logged links as soon as the tin is logged. There's no data migration and no rule change.
- **The answer line on the thing's card** reads "In the blue tin". A name with a number reads as a name: "In Box 14". Two levels read as one phrase: "In the red pouch, in Box 14".
- **The tin's own card shows "In it · 2 things"**, as small tiles you can tap.
- **Find item's list** says "In the blue tin" under each result, and the AI answer is told the same.
- **No tree, no Places hierarchy, no "Move this box" screen.**

## The choice

- **A · In words.** Under "In the blue tin", one quiet line gives the tin's own place: "**Blue tin**: Top shelf, bedroom wardrobe". The tin's name is a link to its card.
- **B · With the container's photo.** Under the key's photo, a row shows the tin itself: its photo, its place, when it was last seen, and a › to open it.

## Positions

- **Devin (design): B.** ReCall's promise is "see it and you'll know it". A photo of the tin answers "which tin?" faster than its name, and matches how the Home screen works.
- **Maya (PM): B.** It also shows *when* the tin was last seen, which is the question after "where": "is that still true?"
- **Priyanka (engineer):** same cost either way. Both are built in the rig; the loser is deleted.
- **Sam (architect):** no preference on looks. **One risk, in both options:** if someone logs a thing whose name is also a place (the desk as a thing called "Desk"), everything "at Desk" will read "In the desk". The meaning is still right but the wording is off. He suggests leaving it and watching the events.
- **Margaret (persona): B.** "I know my tin when I see it. I don't remember what I called it."
- **June (persona, lives alone): A.** Less on the screen; the name is enough for her.
- **Robert (garage): B.** "Box 14" says nothing; its photo shows which box.

**Board recommendation: B.** A is the fallback if Ravi finds B too busy.

## Ruling needed

**A or B?** After that, the build is finished and checked with the rig audits (plus a new nesting audit; the logic tests already pass 14/14), and you see screenshots before any push.
