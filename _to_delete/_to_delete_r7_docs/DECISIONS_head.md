## 2026-09-15 (round 7) — The when pill and Private on one line; pin badge; Locations with photos; "Where is it?" in three views; multi-user plan SUSPENDED

Ravi's seventh phone round, run the new way: approach and rendered options first
(`design/BOARD_2026-09-15_round7.md`, `design/mockups/r7*_*.png`), his rulings, then code.

**Plain bugs, fixed without a ruling.** A log now holds the cover plus five photos
(`LOG_MAX = 6`); *Add photo* opens the camera for up to four shots at once (it allowed two:
the cap counted the cover twice). Tap-to-expand applies to every page of the roll at one
shared height (60 vh, letterboxed), so nothing jumps while swiping.

**Camera permission on every launch — not fixable from the app.** iOS treats a home-screen
web app as a fresh visitor each launch; every `getUserMedia` asks again and nothing persists
it. Keeping the stream open would show the green camera dot the whole time. The real route is
a native wrapper (Capacitor → TestFlight), which also answers "how does Priya install it from
another city". Parked on the multi-user session's agenda.

**When line (Ravi, from two rendered options):** the time is a soft pill with a clock, left;
**lock + "Private"** sits on the same line, right. No extra row (Ravi: "I don't like
unnecessary vertical space"). The card's Private button stays as the control.

**"Only this phone" was wrong.** Private means private to the *person* — on their iPad, both
iPhones, the watch — not to a device. Every string that said "this phone" is gone:
`VISIBILITY_TOAST` in `db.js` is the one shape both ways — *Now private · only you see it* /
*Now shared · everyone at home sees it* — used by the card, the tile sheet and the row.

**Age pill: not added.** The when line already changes as the roll is swiped; a label on
each photo would say the same thing twice.

**Grid: "no place yet" is an amber pin-with-question badge** in the photo's top-right corner,
replacing the amber words of 09-05. The tile stays one line tall and the two overlays are one
rule — lock (centre watermark) = private, pin (corner badge) = needs a place — both shapes,
not colours, so they read colour-blind and can show together (Ravi asked). Tapping such a
tile opens the card with the place field ready.

**Menu label:** *Look and feel* → **Text size & colours** (Ravi: "a bad name").

**Locations (replaces the text blob):** one list of every place used or saved — its picture
(the place's own photo, else the last thing seen there, else a camera placeholder), the name,
how many things are there, a chevron. *Add a location* opens the camera first and asks the
name after (same shape as logging a thing). One-location screen: up to three photos with
add/remove, rename (updates every thing there), the things there now, *Remove this location*
behind a confirm (things keep their place text). Place photos live in the place doc
(`photos[]`, ≤3, compressed smaller than thing photos) — they are what the AI will be given
as reference images later.

**"Where is it?" has three views** — *Names only* · *Smaller photos* · *Bigger photos* —
switched by two links under the list (the two you are not in), remembered on the phone.
Until a choice is made, *Smaller photos* comes on by itself once any place has a photo of
its own. The hamburger's Locations screen does not get the toggle: one list view is enough.

**"Put it back" (the reverse of Find): not now.** Three ideas were put to Ravi (nothing new /
a derived *Usually on* row on the card / a third Home verb). He rejected the third verb (the
footer gets crowded) and parked the *Usually on* row for the use-case session.

**Architecture note, from Ravi (design now, build later):** places will form a hierarchy —
*back of* (4) ⊂ *third drawer* (3) ⊂ *filing cabinet* (2) ⊂ *office* (1) ⊂ *home* (0). Too
much for a user to construct; the system should build it in the background to enrich the AI
and, later, for a graphical location map. Reserved: `parent` (place id | null) on the place
doc, written as `null` today, read by nothing.

**Multi-user plan SUSPENDED.** Ravi "totally disagrees with the board about how the various
users need to be treated and how the features manifest across them". `PLAN_2026-09-14_multi-user.md`
and its three board files stand as the boards' opinion only; nothing in them is decided.
The use cases are to be redefined in a separate session — prompt in
`06_Handoffs/PROMPT_2026-09-15_multi-user-redefinition.md`. Nothing from stages 0–4 is built.

**Would change our mind:** a second family on the app (the badge/pin vocabulary would then
be tested by someone who was not in the room); place photos pushing a doc near 1 MB (move
place photos to Storage first); the use-case session reversing "private = per person".

---

