# Journeys — how a person really uses ReCall, over days

Each story is run by `rig/journeys.js` (= `tiers_head.js` + `journeys_body.js`). After EVERY step, the consistency
oracle (`rig/oracle.js`) works out where the item is from what is stored and checks that the item page, the Find
tile, Move it (its squares and chain line) and the card after Save all say the same thing, the same way — and that the
store never breaks its own rules (one "in" per thing, no circles, no place inside a box, 6 photos a place at most).

Add a story whenever Ravi or Tanya finds a bug a story would have caught. Write it here in plain words first.

| # | Story | Came from |
|---|---|---|
| J1 | Log the headphones on the Kitchen counter. Next day, move them to the Pantry shelf. | basics |
| J2 | Ravi's 3D model: it's in the White cardboard box. Move it → + the Ikea shelving unit (photographed, named) → Save. Next day Move it again → the shelf is there → + Office (typed, keyboard up) → Save. Then Undo the last one. | Ravi 09-29 (g) |
| J3 | Log scissors into a new box photographed as "White shoebox" on the Linen closet. Rename the box "Shoebox". | tester #4 |
| J4 | Rename a place (Kitchen counter → Counter) in Places; everything in it follows. | renamePlace |
| J5 | The box moves: the wooden box goes from the memorabilia box to the Pantry shelf; the baseball card inside goes with it. | boxes |
| J6 | Save + Next: log two things in a row onto the Linen closet. | hold Save |
| J7 | Log a thing, then Undo it: the thing and the box made for it are gone. | Undo |
| J8 | The spare batteries are on the Kitchen counter, which is in the Craft nook. Move it → change tier 2 to the Pantry shelf (the counter moves; everything on it goes too). | Q3 |
| J9 | Move it → pick a different tier 1: what was above the old one goes; the old place keeps its own where. | h |
| J10 | Move it → photograph the place it's already in → "Is this the Desk drawer?" → Yes: nothing moves, the drawer gets the photo. | tester #2 |
| J11 | An old item with only a place written on it (no link), whose place is inside another place. | old data |
| J12 | Log quickly, then Move it within 8 seconds, then Undo from the card on screen: it goes back, it is never deleted. | tester #1 |
| J13 | Rename the Kitchen counter to "pantry SHELF" — a name already used: it asks (merge, or its own name); "its own name" keeps both. | tester round 2, Ravi 4 |
| J14 | Save + Next, then Undo from the line at the top of the camera: the item is gone, the camera stays for the next one. | Ravi 09-30 |
| J15 | Remove the Craft nook: its page lists the tote bin and the filing cabinet, each with Move; Remove waits until both are moved. | Ravi 3B |
| J16 | "Move all to…" the Pantry shelf from the Craft nook's page. | Ravi 3B |
| J17 | Rename the Kitchen counter to "Pantry shelf" — same photos: merge into one Pantry shelf with both photos. | Ravi 4 |
| J18 | Rename the Kitchen counter to "Linen closet" — different photos: said so; keep all photos → review, remove one (asked first), merge. | Ravi 4 |
