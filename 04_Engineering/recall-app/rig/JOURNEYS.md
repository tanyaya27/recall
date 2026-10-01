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

## Also run as their own suite: `audit_p30d.js` (= `tiers_head.js` + `p30d_body.js`) — Ravi's phone test of `c`

| # | Story | Came from |
|---|---|---|
| P1 | Open a place's photos on the item page, then a tier's photos in Move it: the same viewer, "name · photo N of M" in the top bar both times. | Ravi 09-30d |
| P2 | Move the 3D model (logged 2 days ago) without a photo: the page says "moved today · last seen Mon"; the photo still says Mon. A new photo → "seen today". The Kitchen counter moves → the batteries on it say "moved with the Kitchen counter". | Ravi 09-30d |
| P3 | Move it on a 3-tier item: the chain line rings the tier Choose place will change; Choose place shows the whole chain, rings that tier, says what it means and what comes off; "Current place" on that tier's row (level 1 and tier 2). | Ravi 09-30d |
| P4 | Photograph a new top tier (Foyer), then Choose place → "In air" on it: the square shows In air's photo, and at Save the Foyer's photo does NOT go onto In air. | Ravi 09-30d |
| P5 | Choose place: a place that holds another place names it (not "nothing here yet"). | Ravi's screenshot |
| P6 | A place called "In air": "Tap + to add what “In air” is in", never "the in air". | Ravi's screenshot |

## `audit_pick.js` — the 09-30f camera flow (Ravi 1:36 PM + the tester's timeout report)

| # | Story | Came from |
|---|---|---|
| K1 | Move it → shoot the current place: "This photo is…" at once; nothing behind it changes. An empty tier opens Choose place at once. | Ravi 1:36 PM |
| K2 | "Another photo of the White cardboard box" → next shots add without asking (the shutter shows the box, "+"); tap the square → the next shot asks again. | Ravi |
| K3–K4 | "A different place" → Choose place: the old chain in the header, new place first, then search; Cancel puts it all back. | Ravi |
| K5–K9 | A pick (or a new name) shows Before → Now; Back; Use; the photo goes to the place picked. | Ravi |
| K10 | "Photograph a new place" is above the search; the next shot goes straight to naming it (pin shutter, "New"). | Ravi |
| T1–T6 | No timer: a late answer only fills ReCall's slot (no jump, no refused name, no tier set); Cancel leaves no "A place"; a Move that moved nothing says "Saved just now". | tester (timeout) |
| C0–C2 | The marks in "This photo is…" and on the shutter (Ravi's option 1); the fly-in; "Added — 2 photos of …". | Ravi |
