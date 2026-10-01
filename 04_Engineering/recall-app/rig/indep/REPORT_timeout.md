# Independent break-test of the camera's 3-second look (rig build of e + Save fix), 2026-09-30

Tester read only DECISIONS/OPEN_ITEMS; scripts indep/tlib.js + t2…t9_body.js (mk2.sh); logs indep/out_t*.txt; shots indep/shots/t/.
Timing: the request leaves ~0.15–0.3 s after the shutter; the sheet opens ~3.1–3.2 s after — an answer at 2.9 s already loses.

1. BUG — A late sure answer for a tier she has LEFT is applied silently; Save saves it: an existing place (Kitchen counter,
   with the spare batteries) got put inside a new place. Breaks "no question for a level you've left" and "confirmed, never merged". (both)
2. BUG — Save while "Is this the X?" is unanswered counts as Yes for a sure match (item moved, photo added) — a not-sure
   match greys Save. (both)
3. BUG — A late sure answer while Choose place is open: sets the tier behind the sheet (square, Place:, header) unconfirmed;
   fills the name field AND refuses it ("You already have…"); inserts a suggestion row that jumps the list ~91 px (a tap
   lands on the wrong row).
4. BUG — "No, ☰ Choose place" fills the field with the name she just rejected; typing appends → a place named
   "Kitchen counterAttic trunk". (both)
5. BUG — A second shot on a timed-out tier doesn't look again; the first look's late answer then takes BOTH photos onto
   Kitchen counter. (both)
6. BUG/DESIGN — Cancel on the 3-s sheet + Save stores a place named "A place"; afterwards the 3-s sheet stops opening
   ("'A place' needs its own name").
7. DESIGN — The AI's guess becomes the tier's name without acceptance (Cancel keeps it; typed text dropped; a left tier renamed).
8. BUG (minor) — The Move note says "Moved just now · Before: …" when nothing moved (Yes on the current place; + only).
9. DESIGN — Shooting the highlighted current place: adds a photo only if the answer is in time and she says Yes; while it
   looks, the outer squares vanish; after a timeout "A new place?" (Ravi's expectation: add a photo to that place).
10. Small — a Save tap at the instant the sheet opens hits the sheet's Cancel; boxes asked in lower case ("Is this the
    wooden box?"); in Move it Cancel says "Nothing from this item is saved"; holding Save delays the sheet.

Held up: everything waits during the look; Cancel during the look asks first; an answer after Save changes nothing;
typing is never overwritten and focus never stolen; picks/names made before a late answer hold; garbled answer safe;
Yes puts the photo on the right place; not-sure keeps Save grey; no page errors.
