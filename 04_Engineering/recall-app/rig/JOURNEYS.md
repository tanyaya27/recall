# Journeys — how a person really uses ReCall, over days

Each story is run by `rig/journeys.js` (= `tiers_head.js` + `journeys_body.js`). After EVERY step, the consistency
oracle (`rig/oracle.js`) works out where the item is from what is stored and checks that the item page, the Find
tile, Move it and the card after Save all say the same thing, the same way — and that the store never breaks its own
rules (one "in" per thing, no circles, no place inside a box, 6 photos a place at most).
Since release 1 (10-01, "Words, and one pick") the camera has no tiers: Move it is checked by its ONE "In" chip
("In: <first>", and "in the … · in the …" for the rest of the chain), and the item page by her words ("You said") too.
(oracle.js itself still reads the old squares; journeys_body.js and monkey_body.js carry the chip version until it moves
into oracle.js.) "+ a tier" in a story is now: pick the first one in the camera, then that box's or place's OWN page —
a box: Move it; a place: ☰ → Places → the place → "Where this place is".

Add a story whenever Ravi or Tanya finds a bug a story would have caught. Write it here in plain words first.

| # | Story | Came from |
|---|---|---|
| J1 | Log the headphones on the Kitchen counter. Next day, move them to the Pantry shelf. | basics |
| J2 | Ravi's 3D model: it's in the White cardboard box. The box's own "Where this place is" → the Ikea shelving unit (a new place, by name). Next day Move it → the chip shows the box "in the Ikea shelving unit" → the shelf's own where → Office (typed). Then a Move with her words only ("top shelf, at the back"), and Undo it from the page: the words go, the chain stays. | Ravi 09-29 (g) |
| J3 | Log a White shoebox on the Linen closet, say it holds items, log scissors into it. Rename the box "Shoebox". | tester #4 |
| J4 | Rename a place (Kitchen counter → Counter) in Places; everything in it follows. | renamePlace |
| J5 | The box moves: the wooden box goes from the memorabilia box to the Pantry shelf; the baseball card inside goes with it. | boxes |
| J6 | Save + Next: log two things in a row onto the Linen closet; the second starts with the same In on the chip. | hold Save |
| J7 | Log a thing into a new place (Desk tray), then Undo it: the thing and the place made for it are gone. | Undo |
| J8 | The usb stick goes on the Kitchen counter; the counter's own where → the Craft nook, then → the Pantry shelf (everything on it goes too). | Q3 |
| J9 | The Desk drawer is in the Linen closet. Move it → a different In (Kitchen counter): the Linen closet is gone from the chip; the drawer keeps its own where. | h |
| J10 | Move it with nothing changed: Save is off. A new photo of it, the In unchanged: Save on; nothing moves, and the photo is the item's — the Desk drawer's photos are untouched. | tester #2 (the place-photo ask is gone, 10-01) |
| J11 | An old item with only a place written on it (no link), whose place is inside another place. | old data |
| J12 | Log quickly, then Move it within 8 seconds, then Undo from the card on screen: it goes back, it is never deleted. | tester #1 |
| J13 | Rename the Kitchen counter to "pantry SHELF" — a name already used: it asks (merge, or its own name); "its own name" keeps both. | tester round 2, Ravi 4 |
| J14 | Save + Next, then Undo from the line at the top of the camera: the item is gone, the camera stays for the next one. | Ravi 09-30 |
| J15 | Remove the Craft nook: its page lists the tote bin and the filing cabinet, each with Move; Remove waits until both are moved. | Ravi 3B |
| J16 | "Move all to…" the Pantry shelf from the Craft nook's page. | Ravi 3B |
| J17 | Rename the Kitchen counter to "Pantry shelf" — same photos: merge into one Pantry shelf with both photos. | Ravi 4 |
| J18 | Rename the Kitchen counter to "Linen closet" — different photos: said so; keep all photos → review, remove one (asked first), merge. | Ravi 4 |
| J19 | Her words only ("in the blue basket under the stairs"), no In: not counted in "Not put away"; the page says "You said …" and offers "Put it in a place or a box". Then Move it → In the Linen closet. | release 1 (10-01) |

## Also run as their own suite: `audit_p30d.js` (= `tiers_head.js` + `p30d_body.js`) — Ravi's phone test of `c`

| # | Story | Came from |
|---|---|---|
| P1 | Open a place's photos on the item page, then the item's photos in Move it (the camera's viewer): the same viewer, "name · photo N of M" in the top bar both times. | Ravi 09-30d |
| P2 | Move the 3D model (logged 2 days ago) without a photo: the page says "moved today · last seen Mon"; the photo still says Mon. A new photo → "seen today". The Kitchen counter moves → the batteries on it say "moved with the Kitchen counter". | Ravi 09-30d |
| P3 | Move it on a 3-deep item: the In list marks where it is now "Current place". (The tier parts — chain-line ring, Choose place header, tier 2 — retired 10-01.) | Ravi 09-30d |
| P4 | A photo in Move it + a new place (Foyer); the Foyer's own where → "In air": the photo goes onto neither place. (The tier square part retired 10-01.) | Ravi 09-30d |
| P5 | The In list: a place that holds another place is not "nothing here yet" ("a place · 1 item"). | Ravi's screenshot |
| P6 | A place called "In air": never "the in air" — on the In chip of something in a place inside it, and on that place's "Where this place is". | Ravi's screenshot |
| T1–T7, S1 | Keyboard up: the In list's search + row and her words field stay above it; Largest at 375: the first In row is on screen; "Current place" is the first row; Move then Undo is not a move; the camera viewer's "photo 1 of 1" and its Remove asks first; "moved with the Wooden box"; Move it opens with Save off until something changes. (T3b, T4, T8, F1, F2 — tier-only — retired 10-01.) | tester 09-30d, Ravi |

## `audit_pick.js` — the 09-30f camera flow (Ravi 1:36 PM + the tester's timeout report) — RETIRED 10-01 (rig/retired/; the tier camera is gone)

| # | Story | Came from |
|---|---|---|
| K1 | Move it → shoot the current place: "This photo is…" at once; nothing behind it changes. An empty tier opens Choose place at once. | Ravi 1:36 PM |
| K2 | "Another photo of the White cardboard box" → next shots add without asking (the shutter shows the box, "+"); tap the square → the next shot asks again. | Ravi |
| K3–K4 | "A different place" → Choose place: the old chain in the header, new place first, then search; Cancel puts it all back. | Ravi |
| K5–K9 | A pick (or a new name) shows Before → Now; Back; Use; the photo goes to the place picked. | Ravi |
| K10 | "Photograph a new place" is above the search; the next shot goes straight to naming it (pin shutter, "New"). | Ravi |
| T1–T6 | No timer: a late answer only fills ReCall's slot (no jump, no refused name, no tier set); Cancel leaves no "A place"; a Move that moved nothing says "Saved just now". | tester (timeout) |
| C0–C2 | The marks in "This photo is…" and on the shutter (Ravi's option 1); the fly-in; "Added — 2 photos of …". | Ravi |
