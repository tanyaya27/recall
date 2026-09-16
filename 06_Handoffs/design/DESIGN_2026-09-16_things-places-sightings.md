# Things, places, sightings — replacing "earlier photos" (design, nothing built)

Ravi, 2026-09-16: *"Earlier photos" is getting harder to understand. Now that a logged item
can have many photos, does it even make sense? What is the primary object — the item or the
location? Is a location change the same item with a new property, or a new thing? Should
both be nodes in a graph — every location a thing has had, every thing a location has held?
Instead of "now" vs "earlier": show all photos, filtered; a photo whose place or day differs
from the header gets its own caption; two links — "older photos in this location", "prior
locations". Design it architecturally, then visually, before anything is built.*

This note is the architecture. The one picture at the end draws what Ravi described so the
words have a shape; the visual round comes after the rulings.

---

## 1. What the data already is

Two kinds of document carry the app today:

- **item** — name, aliases, `location` (the current place, a string), `photo`/`thumb` (the
  cover), `lastSeenAt`, `history[]` of `{location, at}`, `logId`, `photoCount`, visibility.
- **snap** — `itemId`, `photo`/`thumb`, `location`, `at`, `logId`. One per photo, including
  the cover for anything logged since 09-14.

Plus **place** docs since 09-14 (`name`, `photos[]`, a reserved `parent`).

So a snap is already a *sighting*: this thing, at this place, at this time, and here is the
photo. The item's `location` is the latest sighting's place; `history[]` is the sightings'
places de-duplicated; `logId` groups sightings taken "together". **"Earlier" was never a
property of a photo — it was "not in the current logId".** That is why it stopped making
sense the moment a log could hold several photos taken days apart (yesterday's fix), and
why the folders showed a live *Earlier* button with nothing behind it (a history row without
a sighting).

## 2. The primary objects

Ravi's question — item or location? — has a clean answer: **neither is primary; the sighting
is.** Three nodes and one edge:

- **Thing** — identity: name, aliases, cover, visibility. It never changes because it moved.
- **Place** — identity: name, its own photos, (later) `parent` for the hierarchy Ravi
  described on 09-15.
- **Sighting** — the edge *Thing was at Place at Time, and here is the photo.* Immutable
  once taken.

Two kinds of photo, then (Ravi's correction, 09-16): a **sighting photo** shows a thing at a
place at a time; a **place photo** shows the place itself and belongs to the Place node
(`place.photos[]`, added from the Locations screen). A place photo says nothing about any
thing and never appears in a thing's roll; a sighting photo is never offered as a picture
of the place except as a fallback thumbnail when the place has none of its own.

Everything the UI shows is a query over sightings:

| Question | Query |
|---|---|
| Where is it now? | the thing's latest sighting → its place |
| When was it last seen? | the same sighting's time |
| Every place it has been | its sightings grouped by place, newest first, with counts |
| Everything at this place now | things whose *latest* sighting is here |
| Everything that has ever been here | things with *any* sighting here |
| The photos to show on the card | its sightings, filtered (§4) |

**A location change is the same thing with a new sighting** — not a new thing, not a new
property overwritten. The thing's "current place" is derived, not stored; we keep a
denormalised copy on the item doc for the grid (one read, no join), exactly as `location`
and `lastSeenAt` are today.

**A "stay", in plain words:** the stretch of time a thing sat in one place. Your glasses
were on the bedside table for a week, then on the kitchen counter since Tuesday — two
stays. Every photo taken while they were on the counter belongs to the counter stay, whether
you took four at once or added one on Thursday. Moving them starts a new stay. It is not
stored anywhere; it is read off the sightings by walking them newest-first and stopping at
the first one with a different place. Today the app stores something like it as `logId`, and
that stored group is what broke: a photo added later got the log's old time, and a history
row without a photo made a live *Earlier* button. Reading stays off the sightings instead
means nothing has to be migrated and nothing can drift.

Tech board: Priyanka — derive stays at read time; the card already loads every snap since
09-16, so nothing gets slower. Sam — keep writing `logId` for one release so a rollback is
possible; the *Add photo* cap becomes "per stay" (six), computed from the sightings, and
`photoCount` goes away. The rig audit seeds both formats already, so old items (cover only,
no snaps) are a first-class case: the cover is the only sighting.

## 3. The graph Ravi asked about

Yes, and it is small: Things and Places are nodes, Sightings are the edges, `parent` on
Place is the only other edge. The two screens that already exist are the two directions of
the graph — the thing card (a thing's edges, grouped by place) and the one-location screen
(a place's edges, grouped by thing). Nothing new is needed to "see all locations an item had"
and "all items in a location"; they fall out of the same query with the filter flipped. The
hierarchy, when built, is a third grouping (a place's children), not a new object.

## 4. What replaces "now / earlier" on the card

Ravi's description, made precise:

- **One roll, every sighting of the thing, newest first.** No modes.
- **The header under the roll is the *current* answer** — latest place, its pin, the latest
  time pill, Private — and does not change as the roll is swiped. (Today the place and time
  under the roll follow the centred page; that is what made "Sunday" look stuck.)
- **A photo whose place or day differs from the header gets a caption of its own**, right
  under that photo inside the roll: *Sofa · Saturday*. Photos of the current stay carry no
  caption — nothing to say.
- **The default filter is the current stay** (the photos of where it is now). Two links
  under the roll, replacing the *Earlier* button:
  - **Older photos in this place** — widens the filter to every sighting at the current
    place, any stay. Shown only when there are some, with the count.
  - **Prior places** — a short list of the other places it has been, newest first, each with
    a count and its last date. Tap one → the roll filters to that place. Shown only when
    there are some.
- A small filter line above the roll says what you are looking at when it is not the default:
  *Showing: Sofa · 3 photos · Back to now.*

This keeps Margaret's screen identical to today's for the common case (one stay, one place,
no links, no captions — the links appear only when there is something behind them, which
was Ravi's rule yesterday) and gives Robert the whole history without a mode.

## 5. Where the board splits

1. **Default filter: current stay (Devin, Margaret) vs everything (Robert, Maya).** Maya:
   the one-roll idea is only honest if the roll really shows everything; captions carry the
   rest. Devin: a thing with twelve sightings would open on a roll twelve long; the current
   stay first keeps the answer on one screen. **Recommendation: current stay by default; the
   links widen it.**
2. **Prior places as a list (Devin, Robert) vs a filtered roll straight away (Maya).**
   Robert wants the dates; a list gives them without swiping. **Recommendation: list, then
   the roll filtered on tap.**
3. **Captions only when they differ (Ravi's description) vs always (Sam — "always is
   simpler and never wrong").** **Recommendation: only when they differ** — the roll stays
   quiet for the common case.
4. **Does *Add photo* ever change the place?** Today it inherits the current place, so it
   can never start a new stay. Priyanka: keep it that way — moving a thing is Edit → place,
   which will create a sighting (with the cover photo) so the history is never a row without
   a picture. **Recommendation: keep; Edit → place writes a sighting.**
5. **The one-location screen's *Things here now* gains *Things that were here*** (the past
   edges) — cheap, and the mirror of *Prior places*. Maya wants it now; Devin after the card.
   **Recommendation: same build.**

## 6a. Keeping it from getting overwhelming (Ravi's question on ruling 4)

Three limits, then a tool:

- The card opens on the current stay only; the links carry counts, so a long history is one
  number, not a long roll.
- *Prior places* is a short list (at most five, newest first, then *All places…*).
- A stay is capped at six photos already (*Add photo* stops), so no roll is ever longer than
  six unless the person asked to widen it.

**Tidy up** — a helper's tool, in Edit, never on Margaret's default screen (Devin, Margaret):
one row, *Tidy up this thing…*, opening a sheet with two plain choices, each with a count:
*Keep only the newest photo at each place (removes 7)* and *Forget places it has not been
since <date> (removes 2 places, 4 photos)*. The AI can add a third, quieter suggestion —
*These 3 photos look alike — keep the sharpest* — only when it is sure; Sam wants it off
until the visual check has a track record. Everything removed goes through the existing
soft-delete and Undo. Drawn in `mockups/r8_ux_tidy.png`.

## 6. Rulings before the visual round

1. Thing / Place / Sighting as the model; a move = a new sighting of the same thing? (§2)
2. Stays derived, `logId` retired from the UI, cap per stay? (§2)
3. Header = current answer, fixed while swiping; captions on differing photos only? (§4, split 3)
4. Default filter current stay; links *Older photos in this place* / *Prior places*? (split 1)
5. Prior places as a list first? (split 2)
6. Edit → place writes a sighting; *Things that were here* on the location screen? (splits 4–5)

After these: rendered options for the card (roll with captions, the two links, the filter
line, the prior-places list) at Normal and Largest, both themes, then code.

---

*Picture: `mockups/r8_sketch_sightings.png` — what §4 looks like with the app's own
stylesheet, for orientation only; the visual round will offer alternatives.*

---

## 7. Ravi's pushback on the eight-state card (09-16, later) — and two simpler options

Three faults, all fair:

- **Scope.** *Older photos in this place* and *Prior places* read as *every photo in the
  app*; so did the tidy-up sheet's *Forget places not visited since…*. Nothing on the card
  said "of the glasses". Any label on this card must carry the thing's name.
- **The filter line above the roll** pushed the photos down — jarring. Nothing above the
  roll may move.
- **Confusion.** Two links widening a roll in two different directions is a feature pushed
  into something that was clean. Fair challenge: is the history worth the UI at all?

To be explicit on the question asked: no screen ever shows photos of a place where the
thing was not. The roll is always *this thing's* sightings. A place's own photos are a
different object (§2) and live only on the Locations screen.

**Two options, both with the thing's name in every label and nothing above the roll
(`mockups/r8_ux_XY.png`):**

**X — one roll, no links.** Every photo of the glasses, newest first. A photo that is not
from the current stay carries a one-line caption under it — *Sofa · Saturday*. The header
under the roll is where the glasses are now and never changes. No list, no links, no modes.
Overwhelm is handled by the caps (six per stay) and the tidy-up in Edit. Devin and Margaret:
this is the honest version of "just show me the pictures". Robert: he has to swipe to learn
where it has been; the dots tell him how far.

**Y — roll = now, one list.** The roll is the current stay only. Under the header, one list
titled *Where the glasses have been* — one row per earlier stay: place · when · photos
(this list exists today as *Where it has been*; the rows gain the count and become the
only way in). Tap a row → the roll shows that stay's photos, the header goes soft and reads
*Sofa — then* with *Back to now* beside the time, and nothing above the roll moves. Maya and
Robert: one list, one gesture, dates without swiping. Sam: it is today's *Earlier* mode with
the ambiguity removed — entry only through a row that names the place and count.

**Board recommendation: Y.** X is cleaner but hides where it has been behind swipes, and a
roll of twelve photos with captions is the overwhelm Ravi asked about. Y keeps the default
screen exactly as it is today and adds nothing until there is somewhere else it has been.

**Tidy up** is re-labelled in the thing's name — *Tidy up the glasses* — and the second
choice reads *Forget where the glasses were before <date>*. Otherwise unchanged; ship after
Y, not with it (Devin).

## 8. "Place" or "location"? (Ravi asked on 09-15; unanswered until now — sorry)

Today the app says both: *Locations* on the menu and the screen, *place* in every sentence
Margaret reads (*Where is it?*, *No place assigned*, *Add the place*, *Where it has been*).
That inconsistency is worse than either word.

Board: Maya — **place**, everywhere: one syllable, works in the sentences the app actually
says (*put it back in its place*, *a photo of the place*), and "location" is the word on a
form. Devin — *Locations* as a screen title is the more recognisable noun for a helper
scanning a menu, but he would not keep two words for one idea. Margaret: "I'd say *where I
keep it*; of the two, *place*." Priyanka: the code says `location` on the item doc and
`place` for the saved docs; the field name is invisible to users and stays.

**Recommendation: *place* everywhere; the menu row and screen become *Places*.** (Robert's
09-05 list was called Places before it was renamed on 09-14.)

## 9. Ravi's layout (09-16, third pass) — drawn, with the one-line question answered

Ravi's proposal, in his words: the time stamp under every photo, left; *Private* up to the
place line, right, dropping to the lock alone when the place is long; the place and context
move out of the card into the title (*Reading glasses* / *Kitchen counter · on a wooden
table*) so an older photo can never sit under the current place in big type; an older photo
gets *previously at <place>* beside its time; one button under the roll shows or hides the
earlier places. Drawn in `mockups/r8_Z_ravi-layout.png` (Z1–Z4) and
`mockups/r8_Z56_one-line.png` (Z5–Z6).

**Can time + prior place share one line without wrapping? Measured: not in full.** At
Normal on a 390-px phone a roll page is ~318 px wide; *Saturday, 3:10 PM* + *previously at
Sofa* needs ~360. Two changes make it fit for the common case (Z5): older photos use the
short day (*Sat 3:10 PM*, *Sep 2, 9:41 AM*), and the prior-place pill says *was at Sofa* —
amber, because amber already means "the past" on this card (*Where it has been*). When the
place name is long (Z6) the pill truncates with … and a tap on it shows the whole name; it
never wraps and never changes the roll's height. At Largest (Z4) the pill keeps only the
pin and the place. The toggle reads *Show earlier places* / *Hide earlier places* — the
longer *Show where the glasses were before* truncated at Normal (Z1), so the thing's name
has to live in the title, not the button.

The board's only reservation (Devin): the title area grows to three lines with a long
place at Largest (Z4), pushing the photo down on the one screen where the photo is the
answer. Ravi's trade — the current place can never be mistaken for the old one — is worth
it; Maya agrees. Sightings model, stays, captions-only-when-different, tidy-up-after and
*place* everywhere are unchanged by this layout.

## 10. Header, states vs operations, overlays (Ravi's questions, 09-16, fourth pass)

Drawn in `mockups/r8_W_header-chips-overlays.png` (W1–W5).

**Header.** *Back* and the thing's name share the first line; the lock is an icon only,
right-justified on that line; *place · context* is the second line at full width, under the
Back button, wrapping if it must. Back is drawn as plain text — the boxed button was the
space-eater.

**States vs operations — Ravi is right, and the split is clean.** The bottom bar keeps the
three operations: *Add photo · Edit · Remove*. The three things that are *states of the
card* live in one row of chips under the dots, each chip both showing the state and
switching it: **Private/Shared**, **Times** (the time overlays on or off), **Earlier places ·
N** (the roll widens to the earlier stays or not). A chip is absent when it would be
meaningless (no earlier places → no chip). The chip row is remembered per thing for
Earlier places and per phone for Times.

Private is both an operation and a state — that is exactly what a toggle is, and the same
widget should do both. The board splits on *where*: Maya — a chip beside the other two
states (W1), one row for everything that can be switched. Devin — it is a setting changed
once, so the indicator (the lock in the title) and the switch (in Edit, W4) can be
different things, and Margaret's default card then has one fewer control. **Recommendation:
W1 for now** — the chip is the state and the switch in one place, colour-blind safe (open
vs closed lock plus the word), and Edit stays about words; revisit when the use-case session
decides who may make things private.

**Photo count.** *3 of 5* beside the dots, only when there is more than one photo; dots alone
were the count before and were easy to miscount past four.

**Overlays.** Time on the photo, top-left, in a translucent dark pill — the same pill the
camera roll uses for ✕. The prior place bottom-right in amber, the corner opposite the trash,
so it can never collide with the time at Largest (the first draft had it top-right and it
did collide, W5 before the fix). Both are hidden by the *Times* chip together with the line
under the photo, which no longer exists — the card is roll · dots · chips and nothing else.
Sam's reservation: an overlay covers a corner of the photo; at 4:3 on a 390-px phone that is
about 6% of the image, top-left, where the subject rarely is. Margaret: "the time on the
picture is how my camera does it".

## 11. Fifth pass (Ravi, 09-16): tight header, chevron Back, no overlays, segmented toggles

`mockups/r8_V_tight-header-segments.png` (V1–V5).

- **Back is a chevron only**, a 44-px square, no word. The name shares its line, never wraps
  (truncates with …); the lock icon sits at the right of that line. Line 2 (*place ·
  context*) is set tight under line 1 — same block, not a new paragraph — either indented
  under the name (V1) or flush left under the chevron (V2); Ravi to pick.
- **Overlays are gone** (too cluttered). Under each photo one plain line, no pills: the
  time, then *· was at Sofa* in amber only on an older photo. It truncates, never wraps,
  never changes the roll's height. Hidden by *Times*.
- **The three states are one segmented control** — the app's own `.seg` shape — one row
  that cannot wrap: *Private/Shared · Times · Earlier · 2*. A segment is filled when on. At
  Largest the segments go icons-only, measured the same way as the bottom bar (V5). The
  *Earlier* segment is absent when there is nothing earlier (V3).

## 12. Sixth pass (Ravi, 09-16): a toggle list, smaller Back, fixed-size time overlay, amber prior place

`mockups/r8_U_toggles-overlay.png` (U1–U5).

- **The three states are a list of switches** — label left, switch right, worded as actions:
  *Keep this private* · *Show times on photos* · *Show earlier places (2)*. The third row is
  absent when there is nothing earlier. Reads as controls, never wraps.
- **Back** is a 36-px chevron square (was 44).
- **Time as an overlay on the photo, bottom-right, at a fixed 13 px** that does not scale
  with the text setting. Prototyped with the longest form, *Sep 5, 2024, 9:41 AM*, at
  Largest (U4): one line, no wrap. Hidden by *Show times on photos*.
- **Prior place under the photo**, flush left, amber, with a *dashed* pin — a different
  glyph and colour from the solid accent pin of the current place in the title. The
  *Show earlier places* row uses the same dashed amber pin, so the switch and what it
  reveals match.
- Build note (found while drawing): a `nowrap` line inside a roll page widens the page
  through flex's `min-width:auto` — `.strip-page` needs `min-width:0; overflow:hidden`, and
  the *was at* line truncates with …; the rig's Largest screenshot must cover a long place
  name (U4) before this ships.

## 13. Seventh pass (Ravi, 09-16): one left edge, nothing on the photo scales, place name only

`mockups/r8_T_aligned-fixed-overlays.png` (T1–T4).

- The title's pin and the prior-place pin under the photo share **one left edge** — the
  card's inner padding — at every text size (T1, T2).
- **Nothing on the photo scales with the text setting:** the trash is a fixed 36-px circle,
  now **top-right**; the time is a fixed 13-px label, now **bottom-left**, so it sits
  directly above the prior-place line and both are left-justified.
- **Time formats, longest to shortest**, chosen so the label stays one line: today → *Today
  5:52 PM*; this week → *Sat 3:10 PM*; this year → *Sep 5, 9:41 AM*; older → *Sep 5, 2024*
  (the clock time is dropped once the year matters). T3 shows the two long ones.
- The prior-place line is the **place name only** — the dashed amber pin says "was"; the
  words *was at* are gone.
