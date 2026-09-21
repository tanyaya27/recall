# Decisions

Running log of choices and the reasoning behind them. Newest at the top.
Add an entry whenever a choice was non-obvious, had a real alternative, or would be
tempting to reverse later without knowing why it was made.

Format: date — decision — why — what would change our mind.

## 2026-09-19 — Multi-user Phase 1 built: owner on every doc, roles, the rules, identity

Ravi: "proceed" — the plan's recommendations taken as rulings (Can see / Can help; *added by*
on by default; two ReCalls + guard; *Give*; identity first). Built and audited, nothing visible:

- **Every doc carries `owner` and `by`; every thing `private` (boolean), `roles`, `sharedWith`.**
  `household`/`visibility`/device-id owner are no longer written. `me()` (`lib/auth.js`) is
  the uid from Firebase auth.
- **watchAll merges four listener shapes** (mine · shared-with-me · grants → one per grantor ·
  legacy) so a person's grid is everything they own or hold a role on; private arrives only
  through the owner's own listener.
- **Legacy adoption on boot, not an admin script** (deviating from tech split 5): Ravi is the
  one user, so `adoptLegacy()` on his phone gives every pre-09-19 doc `owner = his uid`, private
  from the old `visibility`. Settings → Account shows *Legacy docs left: n*; the rules flip at 0.
- **Rules** (`04_Engineering/firebase/firestore.rules`) mirror the rig's permission table
  (`rig/stubs/firestore.js`); *change both or neither*. Snaps borrow their item's access via
  `get`; editors are limited to a field allow-list; transfer is impossible from a client.
- **Functions** (`firebase/functions/index.js`): createInvite · acceptInvite (transactional,
  single-use, 7 days, provider sign-in required) · transfer · ai (owner's key, server-side) ·
  setAiKey. Not deployed — needs Blaze and Apple Sign-In (steps in `firebase/README.md`).
- **Identity**: anonymous → `linkWithRedirect` (Apple/Google) in place; the redirect result is
  picked up on boot; `credential-already-in-use` falls back to signing in as the existing uid
  and flags the orphaned anonymous data for Phase 3's `claimAnonymous`.
- **Rig**: `audit_roles.js` boots the app as six people over one persisted store with rules on
  — owner, viewer-by-grant, editor-by-grant, direct viewer, stranger, legacy anonymous — and
  proves reads and refused writes (16 checks). The main audit still passes (92).

---

## 2026-09-19 — Multi-user reset: Margaret owns her things and invites people; the Drive model

Ravi rejected the 09-14 plan's premise (a "patient" slot on a phone, helpers as proxies,
her phone never naming another person): "that implies Margaret is not legally in charge of
her own life." Reset in `design/BOARD_2026-09-19_multi-user_reset.md`: Margaret is a
competent adult and the **owner** of her things; Robert and Peter are people she invited at a
role she chose, listed on her phone. §10: ownership is per **thing** (the Drive model) —
roles *Can see / Can help* per thing, a whole-ReCall grant as the common case, *Only me* =
no roles, *Give* transfers a thing with its photos. Peter must sign in (Apple/Google) to hold
a role; Margaret stays anonymous until her first share or second device. Three boards
reviewed the settled premise (`TECH_/UX_/PERSONA_BOARD_2026-09-19.md`); sixteen screens drawn
(`mockups/MU1_*.png`, `MU2_*.png`); the reconciled plan and rulings are in
`design/PLAN_2026-09-19_multi-user.md`. `PLAN_2026-09-14_multi-user.md` is superseded.
Nothing built yet.

---

## 2026-09-16 (round 8b) — Place picker in Edit; tidy-up; earlier count = places; the "was" pin

- **Edit → Where it is opens the place list** (`PlacePicker.jsx`): the household's places with
  their pictures, the current one excluded, *Somewhere else* to type — the same list as
  "Where is it?" after a photo. Typing alone was "very poor and incomplete" (Ravi).
- **Tidy up** (`TidySheet.jsx`, design §6a): a *Tidy up… · n photos* row in Edit, shown only
  when there is something to tidy → *Keep only the newest photo at each place (removes n)*
  and *Forget where it was before (removes n places · m photos)*. Soft-deletes with one
  Undo. The AI look-alike suggestion is still out (Sam). The thing's name is only in the
  sheet's title — a long name made the row a sentence.
- **The number on *Show earlier places* is the number of earlier PLACES**, not photos.
- The switch's words are amber like the earlier-place line; the "was" glyph is a HISTORY icon
  (circular arrow with clock hands) — a different shape from the title's pin, not just a
  colour (Ravi: colour alone won't be enough). The title's pin is a step bigger than the
  body's. The number after *Show earlier places* is the same size as the words, on their
  baseline; in the sheet a two-line choice keeps its icon on the first line.
- **Alignment is asserted**, not eyeballed: the audit measures that icon, text and number
  share a centre line in the title, the place line and every switch row (`rig/align.js`
  prints the centres at Normal and Largest).
- **Title: option C** — line 2 (pin · place · context) in a soft accent band under the name; Ravi: "go with 3 now but know we may pick 4" (D = whole title in a card plus the band).
- *Forget where it was before* → **Delete its earlier places** ("forget" is the one thing this app is meant to help with — Ravi). The button is *Remove old photos…* (amber, trash) — "tidy up" read as editing the photos, and a bare number read as nothing (Ravi); the sheet is *Remove old photos of <name>* with *deletes n older photos* / *deletes n photos from m earlier places — the thing stays*.

---

## 2026-09-16 (round 8) — Things, places, sightings: the thing card rebuilt; "earlier photos" retired; *place* everywhere

Design of record: `design/DESIGN_2026-09-16_things-places-sightings.md` (§2 model, §13 the
card as finally agreed, after seven rendered passes with Ravi) and `design/mockups/r8_T_*.png`.

**Model.** Thing, Place, Sighting (a photo of a thing at a place at a time). A place photo
is a property of the Place, never a sighting. A *stay* is the run of newest sightings at
the current place — derived from the sightings at read time, never stored; `logId` is still
written but nothing in the UI reads it. **A move (Edit → place) writes a sighting** — the
cover photo at the new place, now — so a new stay always has a photo and history never has
a row without one. Adding a place to a thing that had none is not a move.

**The card.** Title: chevron Back (36 px) · name, never wraps · lock icon if private; line 2,
tight: pin · current place · context — the current place lives up here so an older photo can
never sit under it in big type. Roll: sightings newest first, the current stay by default.
On each photo: the time bottom-left at a fixed 13 px on a 38 % black, blurred label (Ravi:
"a bit less dark"); the trash top-right at a fixed 36 px — nothing on a photo scales with the
text setting. Under a photo from another place: the place name only, amber, dashed pin, on
the same left edge as the title's pin. Dots + *n of m* when more than one. Three switches,
label left, switch right: *Keep this private* · *Show times on photos* (per phone) · *Show
earlier places (n)* (absent when nothing is earlier). Bar: *Add photo · Edit · Remove*.
Gone: the *Earlier* mode, *Where it has been*, *Not there? Earlier photos*, the when line,
the big place line under the photo, tap-to-expand.

**Time label formats** (`photoStamp`): *Today 5:52 PM* · *Sat 3:10 PM* · *Sep 5, 9:41 AM* ·
*Sep 5, 2024* — shorter as the photo ages, always one line.

**Words.** *Place* everywhere; the menu row and screen are *Places*; *Add a place*, *New
place*, *Remove this place*. (Ravi's 09-15 question, answered 09-16.)

**Parked, in the design note:** tidy-up (in Edit, in the thing's name, after this ships);
the *Usually on* row; the place hierarchy.

---

## 2026-09-16 (round 7c) — The thing card's actions are a fixed bottom bar; *Earlier photos* is always there, live only when there are some

**Decision (Ravi):** *Add photo · Edit · Shared/Private · Remove* move out of the card into a
bar fixed to the bottom of the screen — same padding, gradient and button height as Home's
*Log item · Find item* (both bars now 3.5 rem). The row had sat at a different height on every
card depending on the photo and the text under it. Icons-only measurement is unchanged. The
Edit fields open in a second card under the first. Known trade-off (Priyanka, 09-05): a fixed
bar rides up over the content when the keyboard opens for Edit; watch it on the phone.

**Earlier photos, explained and fixed.** *Earlier* means photos from BEFORE the current log —
the thing was logged again, or moved (Edit → place). The roll shows only the current log.
The button was shown whenever the item had a history row, even when no earlier photo existed
(Ravi's folders: one photo, live button). Now snaps load on open, the button keeps its place,
reads *Not there? 2 earlier photos* when there are some and *No earlier photos*, disabled,
when there are none.

---

## 2026-09-16 (round 7b) — Ravi's 5/10: flipped label instead of the pin badge; real photo times; AM/PM; pin on the place line

Three of the four complaints were one deploy mistake — `styles.css?v=` was not bumped, so
the phone ran round-7 JS with the 09-14 stylesheet (huge Locations pictures, an unstyled pin,
the clock not centred). Fixed by bumping both stamps (LESSONS). The rulings that stand:

- **No place: no badge.** The tile's label block flips to reverse colours (amber block,
  card-coloured text) and says **No place assigned**. The pin badge is gone.
- **The place line carries a pin** (aligned to the text) on the thing card, including
  *No place assigned*.
- **Times keep AM/PM** — *today, 1:09 PM*, *yesterday, 6:40 PM*, then the weekday, then the
  date. "this afternoon, 1:09" (no AM/PM) was "terrible".
- **A photo added to a log keeps its real capture time**, so the when line changes as the
  roll is swiped. The 09-14 "same time as the log" shortcut is reversed; photos added
  before 09-16 still carry the log's time and cannot be recovered.

---

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

## 2026-09-14 (round 6) — Thing card layout A: trash on the photo, labelled action row under the details

**What went wrong first:** in round 5 I moved the card's actions into the footer and
dropped the quiet row on my own — no rendered review, no ruling. Ravi opened the card
to a photo, a place, one underlined link far below, and two footer buttons: nothing
said what could be done, and *Remove this photo* sat nowhere near the photo. That is the
third time today a layout went to the phone unreviewed. Rule, now in LESSONS: **no
layout change without rendered options shown to Ravi first.**

**Decision (Ravi, from three rendered options — `design/mockups/2026-09-14_thing-card-options.png`):**
layout A. A translucent trash sits ON the photo it removes (top right; confirm sheet
stays). The place stays directly under the photo (Maya: that is the answer she came
for). Under the details, one row of four labelled icon buttons: **Add photo** (filled) ·
**Edit** · **Share/Private** · **Remove** (amber). No fixed footer on this card.
Press-and-hold on the photo remains a shortcut to the same sheet, never the only path
(Devin: the 10% know it; the 90% need it visible).

**Ravi's addendum:** the row must never wrap — past the size where a word fits, the row
is icons only. Built like the footer: the words are measured in an offscreen probe at
the row's font; if any cannot fit its column, all four drop to icons (words stay in the
accessible name). Verified in the rig: words at Normal on 390 and 430 px, icons at Large
on 390, icons at Largest — `design/mockups/2026-09-14_thing-card-A-sizes.png`.

**Rejected:** B (Photos-app toolbar at the bottom — Harold: too small and light); C
(action row directly under the photo — the place drops below the fold; Maya).

**Same evening, Ravi's corrections (built as `20260914o`):** the third button reads
*Shared* with an open lock, *Private* with a closed one — not one glyph for both states;
the trash sits on EACH photo page (bottom left) so it swipes with the photo it removes,
and the remove sheet shows that photo; private tiles carry a large translucent lock
watermark over the photo; press-and-hold on a tile offers *Make private* / *Share with
the household*; the hamburger glyph's left edge is flush with the tiles' left edge.

---

## 2026-09-14 (round 5) — The thing card's verbs are Add photo · Edit; *Found it* is gone; a wrong photo gets a question

**Decision (Ravi):** *Found it — new photo* read as "I found it and am putting it somewhere
else, take a new photo" and then behaved like logging a new item from inside another
item's page. Removed. The card's footer is **Add photo** (into the current log) and
**Edit** (was *Fix* — "edit" is the word every other app uses). Editing the place by hand
now counts as a move: it goes into *Where it has been* with a time and the thing is seen
there now. Moving a thing with a photo is done from Home: *Log item* recognises it (D4)
and asks the place afresh — that was the only real job *Found it* had.

**Guard (Ravi):** a photo added to a thing is checked against that thing first
(`engine.looksLike`). A coffee cup added to the folder gets *This looks like a coffee
cup, not your folder* with *Log it as a new item* / *Add it to folder anyway* / *Don't add
it*. ~3 s per add; logged as `add_check`. **Maya:** the first guard of its kind; more
belong on the list below, not in this build.

**Press-and-hold on the photo** in the thing card opens the same item sheet as a tile
hold, plus *Remove this photo*; the phone's own image menu is suppressed.

**Footer:** buttons 17% shorter (3.125 rem), bottom padding is the phone's safe-area
inset only.

**Other guards the boards want considered (Ravi's question "what else like this?"):**
a photo with no discernible object (dark, blurred, a floor) → *I can't see a thing in this
photo — take it again?*; a face or a person → don't log it, say so; a chosen place the
photo plainly contradicts (kitchen tiles under "Bedroom") → one gentle question; the same
photo twice in one log → drop the duplicate silently; renaming a thing to another thing's
name → offer to merge; a *Remove* on a thing logged minutes ago → the Undo toast already
covers it. Each is one AI question or one string compare; none is built yet.

---

## 2026-09-14 (round 5b) — The subject, not the background: every shot names the thing; visual matches must be sure

**What happened (Ravi):** two shots of a keyboard — a close-up and a wide one. The wide
shot alone went to the AI; it said *keyboard*; then the visual duplicate check, shown only
that wide shot, matched the sparkling-water can in the background and the card flipped to
*New photo of My favorite sparkling water*.

**Decision:** (1) naming and the identity check are given EVERY shot of the log, told they
show the same thing, that a close-up shows what it is and a wide shot where it is, and to
name the subject in front, never a background object; when a shot is added on the card
the naming runs again with all of them. (2) The identity check is told what the subject
is (the name just given) and to answer *none* if the only match is a background object.
(3) Only a *sure* visual match may take over the card; an unsure one is dropped (Maya's
guardrail from round 3, now enforced). Historical photos are already the candidates'
side of the comparison; more per candidate if the export shows misses.

**Copy:** *Not your my favorite sparkling water?* — a name starting with my/the/our drops
that word inside a sentence.

**Would change our mind:** the close-up still losing to the background in the export
(`identity_check` events carry the verdict) — then send the close-up alone to the
identity check.

---

## 2026-09-14 (round 5) — In-app camera; the 09-14 "keep iOS's camera" call is reversed

**Decision (Ravi, asked twice and deferred once without his agreement — that deferral was
wrong):** photos are taken in the app's own camera: full-screen rear view, a shutter,
every shot as a thumbnail along the bottom with a large ✕, *Done (n)* and *Cancel*, up to
four. iOS's camera sheet had no Cancel and took one photo at a time. Every camera entry
point uses it: *Log item*, *Another* on the photo card, *Found it — new photo*, *Add
photo* on the thing card and in the tile sheet. If the camera cannot start (permission
refused, unsupported), the same screen offers *Use the phone's camera* — the old file
input — so there is no dead end.

**Costs (Priyanka, still true):** a camera-permission prompt the first time (a home-screen
web app may ask again after a while); no HDR; orientation and focus are the phone's
defaults; it is the most iOS-version-sensitive API we use. Watch the first phone test.

**Would change our mind:** photos visibly worse than the phone's own, or the permission
prompt confusing Margaret — then the fallback becomes the default for her phone only.

---

## 2026-09-14 (round 4, later) — Hamburger menu; Settings becomes the developer's screen

**Decision (Ravi, overruling the 09-05 board's rejection of a hamburger):** a hamburger at
the left of the day line opens a drawer with *Look and feel* (text size, colours, and a
new *Density: Roomy / Compact*), *Locations* (was Places — "Places sounds like cities"),
*Deleted items* (put back / delete for good / *Empty the list*; in Compact, swipe a row
right to put back, left to delete), and *Research log*. The gear stays at the right with
only *Version* (now first, so the reload lands on it without scrolling — the regression
Ravi hit) and *AI key*, for the developer, and is slated for removal.

**Objection on record (Devin, Margaret, from 09-05):** a hamburger is a hidden door for
Margaret; nothing in it is hers, which is the argument for it — everything behind it is
Robert's or the developer's. Home itself is unchanged for her: the board, two verbs.

**Why compact is a setting, not the default:** Ravi's own framing — swipe actions are
denser but invisible; the two-button rows stay for Margaret's screen.

**Would change our mind:** Margaret opening the drawer by accident and not finding
*Close*; a swipe row triggering Delete on a scroll (the row only arms on a horizontal
drag past a third of the action width, and Delete still asks).

---

## 2026-09-14 (round 4) — The Version card says what happened; footer hugs the home indicator

**Decision (Ravi):** after *Get the latest version* the app must say outright whether a
new version was installed or not. Built: the card remembers the build it had, and on
return shows a filled banner *New version installed — built <time>* or *No newer version
was found. This phone already has the latest, built <time>*. On every visit it also
fetches `index.html` (cache-bypassed) and compares stamps: *This is the latest version* or
an amber *A newer version is available* with the button relabelled *Get the newer
version*. **Why:** "Reloaded just now — if the time didn't change…" made the person do the
comparison; twice today Ravi could not tell whether a deploy had reached the phone.

**Amended the same day (Ravi):** no *This is the latest version* — one check is not proof
and a cached or failed check would make it a lie. The card states facts: *Build: <time>*,
*Installed on this phone: <time>* (recorded the first time a build runs on the phone), and
*Server checked <time> — no newer version seen then*. The amber *A newer version is
available* banner stays: that one is positive evidence from the server.

**Footer:** bottom padding is the phone's own safe-area inset plus 0.25 rem (was 0.75 rem).
The rest of the space under the buttons on an iPhone is the home indicator's 34 pt, which
stays.

---

## 2026-09-14 (round 3) — The roll; the AI looks; Fix without remove; press-and-hold; peek

Full exchange: `design/BOARD_2026-09-14_phone-feedback-round-3.md`. All Ravi's rulings.

**The roll.** On the photo card she takes as many photos as she wants before the place:
thumbnails under the big photo, a large ✕ on each, a camera tile for another, up to four;
tapping the place saves them all as one log. Replaces the *Add another photo* toast action
(too late, too small). The thing card and the tile sheet get *Add photo* into the current
log — no card, no question.

**The AI looks.** Identity is three tiers: the naming call's `sameAs` › name/alias/head
noun/shared word › a second call with the new photo beside the photos of up to six
candidates ("is this the very same object?"). Save-before-verdict (D3) covers the wait;
*Is this your …?* covers a late match. `merge` events carry `via`. **Objection (Maya):**
a wrong visual match on look-alikes; guardrail is the *Not your …?* line and the prompt's
"same individual object, not the same kind".

**Fix, not Fix or remove.** Removing a photo and removing the item were one control; now
*Fix* is words only (name, place, move to the top); the item is removed from the tile's
press-and-hold sheet or via the last photo. **Objection (Maya):** a person who never
long-presses reaches item removal only through *Remove photo*; accepted — that path asks
the right question.

**Press-and-hold on a tile** opens the item sheet (Add a photo · Change the place · Rename
· Move to the top · Remove · Cancel). Devin's condition: every action also has a visible
route. 500 ms, movement cancels, iOS callout suppressed.

**The strip peeks.** Pages 86% wide so the next photo shows; Margaret was right.

**Camera:** the phone's own camera stays (Retake/Use Photo is iOS's sheet; Cancel is one
Retake away, and a bad *Use Photo* is one ✕ on the roll). In-app camera = later spike.

**Would change our mind:** visual matches wrong on look-alikes in the export (`via:
'visual'`, `result: 'declined'`) — then require `sure: true`; Margaret opening the sheet
by accident and not finding Cancel.

---

## 2026-09-14 (late) — The AI decides "same thing"; name matching is the fallback

**Decision:** `tagPhoto` now answers a fourth question, `sameAs` — the exact saved name if
the photo shows a thing already on the board, with the instruction that a different
angle, place, lighting or wording is *still* the same thing. The photo card's match is
`findMatch`: the AI's `sameAs` › exact name/alias › shared head noun › any shared
meaningful word (colours, sizes and containers excluded — "black folder" ≠ "black hat";
"sparkling soda" = "soda can") › the AI's alternatives. Each fallback only fires when it
points at exactly one item.

**Why:** Ravi: two tiles for one can of sparkling soda. String rules will always miss a
naming the model invents ("La Croix" vs "sparkling soda"); the model has seen both the
photo and the list, so it should say so outright — the catalogue was already in the
prompt, only the verdict was missing. Ravi's test (Tanya agreed the timing on
appointments in the same message).

**Guardrails unchanged (D4):** the card names the match and offers *Not your …?*; a
name arriving after the save asks *Is this your …?*; nothing merges silently. A wrong
match costs one tap; a missed one costs a duplicate tile and a confused board.

**Would change our mind:** wrong soft matches on the phone — then drop the shared-word
tier and keep `sameAs` + head noun. The `merge` event records `soft: true` for these.

---

## 2026-09-14 — Appointments: after the helper phone, before the join code (Tanya)

**Decision (Tanya):** build appointments as the board recommended — a today-only line on
Margaret's board, a list on the helper phone, a visible list with no reminders (iOS web
has no reliable push without a service worker, which v0 has ruled out). Sequenced after
*This phone is used by* and before the household join code. Added to the prioritizer.

**Objection recorded (Maya):** Phase 2 — let the first user test judge the one idea v0
exists for. Overruled on the strength of Margaret's and Robert's reactions.

---

## 2026-09-14 — Second phone round: photo strip with a history mode, multi-photo logs, remove a photo, ranked search, aliases, places

Full exchange and Ravi's rulings: `design/BOARD_2026-09-14_phone-feedback-round-2.md`.

**Thing card (Ravi's model):** the photo is a swipeable strip of *this log's* photos
(close-up, wide shot). *Where it has been* rows appear only once a thing has been in more
than one place; a row, or *Not there? Earlier photos*, switches the strip to **Earlier**
mode — every older photo, newest first, each with its place and time; *Back to now*
returns. Dots show there is more. Under the centred photo: *Remove this photo* → confirm
sheet → toast with Undo; the newest remaining photo becomes the cover; the last photo
routes to the item's own remove sheet. **Objection (Maya):** a delete control next to a
photo Margaret is looking at. Answer: the sheet is the guard, and the control two screens
away would not be found (Ravi could not find the history that was already there).

**One log, several photos:** after a save the toast reads *Saved · Kitchen counter* with
*Add another photo*; the next photo joins the same log — same place, same time, no
question, no AI — up to 4. **Why in the toast:** tapping the place stays the whole save
(D2). **Objection (Maya):** scope; withdrawn once *Found it — new photo* was shown to be
the wrong tool (asks the place again, stamps a new time).

**Search:** ranked tiers — name › similar name (edit distance ≤ 2 or shared first letters)
› description › place; every word must land; two-letter queries search names only. Ask no
longer re-sorts results into board order (that was throwing the ranking away).
**Objection (Devin):** no visible tier labels; Margaret reads every word. Order only.

**Merge after a rename:** items carry `aliases[]` — every name the AI or a person has
given them; the match is exact-on-any-name, then head-noun-on-exactly-one ("glasses" ↔
"reading glasses"). The AI is told the aliases. The D4 guardrails (*not your glasses?*,
*Is this your glasses?*) stand.

**Editable fields:** pencil at the right, accent hairline under; the photo card's name is a
bordered field. **Objection (Maya):** the answer becomes a form; conceded for the photo
card only. **Objection (Harold):** too many pencils — only on fields, never tiles.

**Day line:** *Sunday evening · September 14*; night from 10 pm. **No calendar** —
unanimous; different product. **Objection (Sam):** the date is a number she can't check;
overruled by Ravi.

**Places:** Settings → Places — add, rename (updates every item), remove; chips show saved
places first. First piece of the helper phone (§2).

**Would change our mind:** Margaret hesitating at the dots (then the second photo peeks);
a name that never soft-matches (widen to any shared noun); Robert not finding Places.

---

## 2026-09-14 — Footer verbs are *Log item* · *Find item*; the screen is *My items*

**Decision (Ravi):** the two Home buttons read *Log item* and *Find item*. Home, and every
string that named it, says *My items*. The Ask screen's title is *Find item*; its field
prompt keeps *Where is my…* because there the input box completes the sentence.

**Why:** *Where is my…* looked cut off on the phone. The ellipsis is the truncation glyph on
the header title and the day line two inches above, so on a button it reads as a clipped
label, not an invitation (Devin). *Add item* was wrong for a re-photograph of a known item
(D4); *Log item* covers both. One noun app-wide once both buttons said *item*.

**Objection recorded:** Devin and Margaret — *log* and *item* are not Margaret's words;
hers were *things* and *Where is my…* ("the sentence I already say"). Kept on record for
the phone test with a real user. Full exchange: `design/BOARD_2026-09-14_where-is-my-label.md`.

**Would change our mind:** Margaret (or Tanya) hesitating at *Log*. Then *Save item*, the
board's runner-up, before anything with dots.

---

## 2026-09-14 — Tile thumbnails: 600-px centre square, rebuilt for old items on load

**Decision:** `lib/img.js` stores the thumb as a centre-square crop, 600 px a side, JPEG
0.8 (~40–60 KB); item docs carry `thumbV: 2`. `App.jsx` rebuilds any item's thumb whose
`thumbV` is missing, from its stored 900-px photo, one at a time, once per item.

**Why:** Ravi saw blurry tiles. The old thumb was 220 px on its *longest* side, so a portrait
photo's short side was ~165 px, stretched across a ~170-CSS-px square tile at 3× device
pixels — three times upscaled. Verified from the source, not the phone: the thing card
(900-px photo) should look sharp while the tile does not. Downscaling now steps by halves
(one 4000→220 drawImage aliases). Docs stay far under Firestore's 1 MB.

**Would change our mind:** item counts in the hundreds (then the photo moves to Storage and
the thumb becomes the only inline image), or a phone wider than ~200 CSS px per tile.

---

## 2026-09-05 (late) — Footer: side by side, or floating icons; never stacked

**Decision (Ravi):** the action zone on Home and the thing card is two buttons side by side,
one line each. When a label cannot fit on one line at the current text size and screen
width, the whole footer becomes two floating translucent icon buttons in the bottom-right
corner (camera, search) with the words in the accessible name. Stacked full-width buttons —
the fix the build board shipped an hour earlier under "controls never wrap" — are out.

**Why:** the stack solved wrapping by taking ~20% of the screen height on a phone. Height is
the scarce resource; floating icons are the ordinary phone paradigm for exactly this case.

**How it decides:** `Footer.jsx` measures the label text in an offscreen probe at the bar's
font and compares it with the room a bar button would have. Measured on the device, never
guessed; the result is left on the element (`data-measure`) so a wrong shape can be read on
a phone. Verified in a browser rig at 375 / 390 / 430 px × Normal / Large / Largest: 375
goes to icons at every size; 390 is a bar at Normal, icons above; 430 is a bar at Normal and
Large.

**Objection recorded (Devin):** icon-only controls lose the word, and Margaret's
population reads words better than glyphs. Answer: the words are the default; icons are the
fallback only where the alternative was a wrapped or stacked bar. Tanya can reverse.

**Would change our mind:** if the phone test shows Margaret hesitating at the icons. Then
shorten the labels through the end-user board rather than bring the stack back.

## 2026-09-05 — The board model: one constant home, two verbs, depth one

**First decision made through the two boards.** Full exchange, objections and personas:
`design/BOARD_2026-09-05_interaction_model.md`. Approved by Ravi/Tanya the same day.

**Decision:** Home is *the board* — her things as photos in first-photographed order, never
rearranged by the app — with two fixed buttons at the bottom every time it opens: *Take a
photo* · *Where is my…*. Every other screen is one card that returns to Home (depth one).
The photo card asks one question, *Where is it?*, and **tapping the place is the save** —
no countdown, no Done (D2). The thing card shows photo · place · when, offers *Not there?
Earlier photos* and *Found it — new photo*, and never shows a sentence the model wrote
(D8, unanimous). Routines are not seeded and not on Home; they return as one band with the
helper's device.

**This supersedes the 2026-09-02 "clock-shaped home" and "8 fixed pin slots" decisions.**
Devin (design): a home screen that changes shape three times a day *is* navigation, just
not hers; hand memory needs the same screen every time. Order is now a property of every
thing; *Move to the top* is the only pin (D6).

**Objections recorded:**
- Maya (PM) objected to merge-by-name (D4: a new photo of a known thing updates that
  thing) as scope creep with a new failure mode — a hat overwriting the glasses tile.
  Robert and Margaret insisted; Ravi chose merge. Guardrails: the card names the match
  and offers *not your glasses?*; if the name arrives *after* the save it asks *Is this
  your glasses?* rather than merging silently; leaving unanswered keeps it a new thing.
- Sam (architect) objected to saving before the AI names the thing (D3). Priyanka: six
  seconds of nothing after a tap reads as broken. Compromise: write immediately with
  `naming: true`, clear on answer or failure. Sam predicts unnamed tiles will be common on
  VPN'd phones — `naming_failed` events are logged; look at the number.
- Priyanka (engineer) would have shipped without *Fix* (D10). Must-be; stays.
- Priyanka: "voice" on iOS is the keyboard's mic key, not ours (D9). James loses; recorded
  as a gap.
- Maya vs Devin on the day line: kept (must-be), made one quiet line, no clock.

**Engine changes (recorded, not quiet):** `household: 'default'` on every new doc (D7,
unanimous); `order` field with `boardKey()` folding legacy `pinnedOrder`; earlier photos
show 10 / keep 30 / prune on load (D5 — a real `limit()` needs a composite index, on
Tanya's console list with the rules); `naming` flag; `absorbInto()` for confirmed merges.
Event schema → v3.

**Would change our mind:** if the first-week testers cannot find something on a board of
30+ things. Then a "More things" fold, not a second grid and not recency sorting.

---

## 2026-09-05 — Where is my… matches as she types or speaks; iOS uses the keyboard's mic

**Decision (Ravi's proposal, adopted as is):** from the second letter, things whose name,
place or notes start with what she has typed or said appear as tiles under the field —
local, instant, no AI. Spoken filler ("where are my…") is ignored. Nothing opens by itself;
she taps. The AI *Find it* remains for what the tiles cannot answer, offered when the list
is empty or as *Not one of these? Find it*.

**Why:** "search when she stops talking" cannot be timed for a slow speaker without either
cutting her off or making her wait; live narrowing makes the question moot (Linda, James).
It is also what every search field on the phone does before any server is asked (Maya,
platform audit N5 — and it settles most of that split without a second field on Home).

**Mic:** the Web Speech mic on iPhone home-screen apps is known to start and never call
back ("sometimes it hangs") and iOS re-prompts for permission on every launch — nothing
in our code requests it on load, and nothing can persist it. On iOS our mic button no
longer renders; the field says *Tap the microphone key on the keyboard to say it* (system
dictation: no prompt, no hang). On Android the button stays, with a watchdog: no start
within 3 s or no words for 8 s stops it. Devin and Priyanka for; nobody against; James
loses nothing because the keyboard mic is what he'd have used anyway (D9).

**Would change our mind:** if a native wrapper ever ships, the app's own mic returns on iOS.

---

## 2026-09-05 — Platform conventions audit: eleven adopted, three splits decided, six rejected

**Decision (Ravi, after "what else have you not covered that every app should have?"):**
Devin audited 35 conventions from the apps a senior already uses against the build. Full
table with verdicts and who objected: `design/BOARD_2026-09-05_platform_conventions.md`.

**Adopted and built:** the phone's own back gesture works (every card is a history entry;
finishing a card goes all the way home); pressed states; in-app confirmation sheet with
verbs (never the browser's OK/Cancel, never red); *Looking…* indicator on Find; a "No
connection" line **only** when the browser reports offline; clear (×) on the ask field;
places shown in sentence case; the system font on purpose (the stylesheet had named a font
that never loaded); SVG glyphs with words on the two buttons and Settings; Settings as
grouped sections; labels and focus states.

**Splits Ravi decided:** S2 search field on top — *not yet* (Devin's side; Maya and James
wanted it). S3 toasts — *yes*, fact-only ("Saved · Kitchen counter", "Removed · Undo").
S4 dark — *yes*: a Dusk palette and *Match my phone*; Linen stays the default (Linda).

**Rejected, with reasons in the file:** login/accounts, onboarding carousel, hamburger,
badges/counts, push (for now), share sheet (→ prioritizer candidate).

**Density pass (Ravi: "horizontal space is premium, so is vertical"):** photos shown 4:3
cropped and capped at 42% of the screen so the place — or the chips — is above the fold;
tap to see the whole photo. Tile names two lines max at 16px then ellipsis (one line
truncated "Reading gla…" in the preview). Card padding and gaps tightened.

**Would change our mind:** S2 — if testers look at the top of My things for a search
field, add it. S3 — if the toast ever covers a tile someone is about to tap, move or drop it.

---

## 2026-09-05 — Sticky title bar; "Fix or remove"; no hamburger, no accounts

**Decision (Ravi's second round of phone feedback):** the header (Back · title) and the
day line stay pinned while scrolling, like every iOS nav bar. The thing card's quiet
control reads **Fix or remove** — Ravi could not find delete, and Robert's test is five
seconds. Remove stays behind it (a confused tap must never destroy a photo).

**Rejected: a hamburger menu holding Settings, account/username/password, caregivers.**
Devin: a menu behind an icon is exactly what Margaret's persona will not learn; the
common-app pattern for this is one Settings control top-right, which we have. Sam: there
are no accounts — anonymous auth, the household is the unit, caregivers join by a short
code (`multi-device-arch`). A username/password screen for a dementia patient is an
architecture decision with real downside and is not on the roadmap; if wanted, it is a
recorded decision, not a menu item. Maya: *Set up a helper* goes inside Settings with the
next build, where a helper goes once.

**Would change our mind:** testers repeatedly hunting for a menu top-left. Then a labelled
*Menu* button — never an unlabelled icon.

---

## 2026-09-05 — "no place yet" in amber on the tile; the screen is called "My things"

**Decision (Ravi, after first phone use):** a thing saved without a place shows *no place
yet* under its name on the board, in the app's amber. One element, not a caption plus a
dot. The main grid is *the board* in code and docs and **My things** on screen (already
the Back label); it has no title of its own — the day line is its header.

**Why:** caregivers need to spot unplaced things to follow up; Margaret may too. Devin's
constraint: the board never asks her for anything, so the cue is a *fact* in words, not a
badge. Ravi asked for caption *and* marker; the board's merge is the caption carrying the
colour — amber has meant "not yet, no alarm" since v0.1. Margaret and Linda accepted a
sentence; both rejected a dot or badge. Robert scans for the colour.

**Also:** Settings gained a *Version* card; "Get the latest version" now returns to
Settings and says whether the build time changed — a reload that lands on Home tells the
person nothing (Ravi's first bug report).

**Would change our mind:** if Margaret's phone should show *nothing* caregiver-facing — then
the caption moves to helper phones only, once *This phone is used by* exists.

---

## 2026-09-05 — Header bar + fixed footer; palette and text size are settings

**Decision (Tanya's addendum, §9 of the board file):** every card gets a header — *‹ Back ·
title* — where every phone app puts it, **and** keeps the fixed footer for the primary
action. Settings → *Look* offers three palettes (Linen · Slate · High contrast) and three
text sizes (Normal · Large · Largest). Both per phone, in localStorage; the stylesheet is
in rem so buttons and tap targets grow with the text.

**Why:** Tanya asked for the structure of the most common apps so seniors find it familiar,
and for end-user text and control sizes. Devin: familiarity comes from conventions that
carry meaning (a title, a Back that says Back, photos of real things), not from cloning a
tab bar; the common iOS structure is top bar + bottom toolbar, which the model already had
half of. Devin's reservation stands: a top-left Back is the one control a thumb cannot
reach one-handed, so the primary action must stay in the footer.

**Palette is a product decision Tanya makes once** — the picker exists so she can compare
on a real phone (and in the static preview). Text size is a user preference forever.

**Would change our mind:** if the header's Back and the footer's action get confused in
testing, drop one — the footer, never the header (Tanya's familiarity call wins).

---

## 2026-09-02 — The patient never navigates: one home screen shaped by the clock

> **Superseded 2026-09-05** by the board model above. Kept for the reasoning.

**Decision:** the patient side has no tabs, no menu, no "Back" as a corner link. One home screen
whose shape follows the time of day (morning routines, then things; bedtime routines from a set
hour until 5am), plus camera, answer, and a full-width Back button near the bottom of deeper screens.

**Why:** two rounds of Design-tool mockups built from the 22-feature list produced screens Ravi
could not navigate ("vertigo"). Walking through a real day showed Margaret does three things —
snap, tap a tile, answer what the app asks at a fixed time — and never *goes* anywhere. Screens that
exist because a feature exists, rather than because she needs to go there, are the source of the
confusion. Full story: `design/DAY_IN_THE_LIFE.md`.

**Would change our mind:** if the one-week test shows she cannot find Recent or Settings when she
needs them. Then add a single persistent "More" — not a tab bar.

---

## 2026-09-02 — Two capture modes, one gesture; the app never claims more than the photo shows

**Decision:** self-initiated snaps are generic (AI names whatever it sees). App-initiated snaps
(routines at a fixed time) carry a one-line photo instruction and are verified: the AI states only
what it can see ("Wednesday morning slot is empty"), asks once for a retake if it can't see, and
otherwise saves with "Photographed at 8:12" and no claim. The photo is the mark; there is no
"done" tap and no checkbox anywhere.

**Why:** Ravi's point that "one photo for both find and check" only works if the photo shows the
open organiser, which can't be guaranteed. Medication is daily, universal, and high-stakes enough
to earn a guided capture. Honesty over confidence is the stale-answer principle applied to checks.

**Would change our mind:** nothing on the honesty rule. The retake count (one) is tunable.

---

## 2026-09-02 — Tiles are fixed positions, curated by people, never auto-reordered

> **Partly superseded 2026-09-05:** the 8-slot cap and "Other things" are gone; the
> principle (never auto-reordered, a person moves things) is kept as board Rule 2.

**Decision:** up to 8 pinned tiles in fixed slots; "Keep at the top" / "Take off the top" on every
thing, available to the patient (not caregiver-only); overflow under "Other things", ordered by
recency. Usage data may *suggest* pins to a caregiver; it never rearranges the patient's screen.

**Why:** a screen that reorders itself cannot be learned by hand memory. Memory impairment varies —
Ravi's point — so the patient must be able to curate if she can; the caregiver curates if she can't.

---

## 2026-09-02 — Research logging is a day-one requirement, with a fixed schema

**Decision:** every capture, lookup, outcome, history pick, correction, prompt and pin is logged
with exact time, day bucket, entry mode and device, schema-versioned (v2). Nothing is ever shown
to the patient as a number. Four candidate studies and the schema are in
`05_Research/RESEARCH_PLAN.md`.

**Why:** Tanya's NYU neuroscience work. Retrofitting instrumentation loses the baseline weeks.

---

## 2026-09-02 — v0.1 keeps one Firestore collection with a `kind` field

**Decision:** snaps, routines and checks live in `recall_items` alongside items, distinguished by
`kind`, rather than in their own collections.

**Why:** the published rules cover exactly `recall_items` and `recall_events`, and changing rules
needs the console on Tanya's account. This let v0.1 be testable the same day. **Split into real
collections when rules are rewritten for the household ID** — that work is already required.

---

## 2026-09-05 — Every decision goes through two boards

**Decision:** adopt the Plantwise/Ardina method. A **build board** of four professionals
(PM, design lead, engineer, architect — Claude plays all four, and they disagree in writing)
proposes and critiques; the **end-user board** of 20 advisory personas reviews every UX and
feature decision; Tanya decides. Full method: `02_Strategy/PRODUCT_BOARD.md`.

**Why:** v0.1's interface was decided one patch at a time by whoever was typing, usually
mid-debug. The result got so far in the way that it became impossible to judge whether the
underlying features were any good — which is the only question that matters right now.
Today's session is the evidence: the Back button moved three times in an hour because
nobody owned the interaction model, and user-facing copy was written while chasing a bug.

**Would change our mind:** if the process starts producing meeting minutes instead of
shipped screens. The board exists to catch bad decisions, not to generate documents.

---

## 2026-09-05 — Rebuild the UX from scratch; keep the engine

**Decision:** every screen, flow and string is redesigned by the board and rebuilt.
Firebase, `lib/db.js` and `ai/engine.js` stay. Do not patch the existing screens.

**Why:** everything that is wrong lives above the engine — the engine files contain no UX
at all. The AI path was also proven working end to end today after a long debug, and
rebuilding it would mean re-entering that swamp with users waiting. Ravi wants real users
on this within a day or two, which rules out re-deciding the architecture first.

**Caveat that makes this safe:** the engine is kept but **reviewable**. Sam may flag
anything in it that constrains the design — the single `recall_items` collection with a
`kind` field, photos stored inline against Firestore's 1MB document cap, LLM-over-captions
search. Changing any of it is a recorded decision, not a quiet refactor.

**Would change our mind:** if the design the board lands on cannot be built on this data
model. Then the model changes and it gets written down here.

---

## 2026-04-16 — Four architectural commitments that must hold through the MVP build

From the AI Capability Scan (`02_Strategy/ReCall_AI_Capability_Scan.docx`). These are locked
because each is expensive to retrofit and cheap to build in from the start.

1. **Use a multimodal VLM for object recognition, not a plain image classifier.** Default
   Claude, with a Gemini fallback. A classifier gives labels; ReCall needs "reading glasses
   on the kitchen counter", which is a reasoning task.
2. **Embeddings-backed semantic search from day one**, indexed in Firestore vector search —
   not keyword matching. v0 deliberately ships LLM-over-captions instead, which is correct
   below ~500 items and must be replaced before that.
3. **All LLM calls behind a single client with a `sensitivity` flag.** Already built in
   `src/ai/engine.js`. This is what makes Phase-2 on-device routing additive rather than a
   rewrite. Do not let any component call a vendor directly.
4. **Voice-cloning consent scaffolding designed during MVP privacy work**, even though the
   feature itself ships Phase 2+. Consent collected after the fact is not consent.

**Would change our mind:** #1 and #2 only if cost per capture becomes prohibitive at scale.
#3 and #4 are not negotiable.

---

## 2026-04-16 — Multi-device architecture: Option B, cloud-first from MVP

**Decision:** Firebase Firestore from day one, with Patient and Caregiver roles in the MVP.
Facility / multi-patient deferred to Phase 3.

**Why:** Priya (remote daughter) and Robert (spouse caregiver) are named must-be users, and
their value proposition requires each person using their own device. Retrofitting
multi-device later was estimated at 4–6 weeks, landing concurrently with the college
application sprint.

**Status:** still needs Tanya's explicit sign-off on three points — approve Option B,
confirm MVP roles are Patient + Caregiver only, and confirm data residency. Note the third
point is now settled differently: data lives in ReCall's own `recall-d9886` project, not
`tanya-command-center` as the original memo proposed.

---

## 2026-08-31 — MVP scope: the 22 committed features plus a few showcase ones

**Decision:** design and build to the agreed 22-item MVP set (9 must-be, 9 performance,
4 attractive), plus two or three features pulled forward from mvp-plus/phase-2 purely for
demo impact.

**Why:** Ravi's framing — the MVP has to be attractive enough that the first adopters use
it *confidently*, not just correctly. A strictly minimal MVP risks being technically
complete and emotionally unconvincing, which for a dementia app means abandonment.

**Guardrail:** showcase features must be labelled as such wherever they appear, so a
mockup is never mistaken for a commitment. Feature scope stays owned by the prioritizer
JSON, not by design documents.

**Would change our mind:** if showcase work starts displacing must-be work, cut the
showcase features. The 9 must-be items are the ones whose absence causes abandonment.

---

## 2026-08-31 — ReCall gets its own Firebase project, on Tanya's Google account

**Decision:** new Firebase project `recall-d9886` (Spark plan, us-west1), owned by Tanya's
own Google account. ReCall no longer shares `tanya-command-center` with SwiftUp and the
SAT tools.

**Why:** three reasons. Ownership — it is her project and she should not need a parent's
login to administer it. Separation — ReCall's data is far more privacy-sensitive than SAT
practice questions, and entangling them makes any future clinical-advisor or research
involvement painful to untangle. Timing — there was zero data in the old project's
`recall_*` collections, so the move cost exactly one config object. That price only rises.

**Alternative rejected:** staying on `tanya-command-center` and transferring ownership
later via IAM. Possible, but leaves ReCall's data mixed into an unrelated project forever,
and the project ID would still read `tanya-command-center`.

**Would change our mind:** nothing. Do the same for any future app.

---

## 2026-08-31 — One git repo for the whole ReCall folder, not just the app

**Decision:** the repo root is `ReCall/`, so design docs, strategy, spec and code all
travel together. Pages build output moved to `ReCall/docs/`.

**Why:** Tanya works across two machines. If the repo were only `recall-app/`, cloning it
on a second machine would deliver the code without the thinking behind it — and the app
README's reference to `../../03_Design/ReCall_v0_Spec.docx` would break. The reasoning is
as valuable as the code, so it belongs in the same repo.

**Alternative rejected:** separate repos for docs and app, or a GitHub Actions workflow to
publish a nested subfolder. Both add moving parts a solo student builder has to maintain.

**Would change our mind:** if the design folder grows huge with binary assets and slows
clones, split the media out rather than the documents.

---

## 2026-08-31 — GitHub is the only sync mechanism; no iCloud/Dropbox on the repo

**Decision:** each machine keeps an ordinary local clone outside any cloud-synced folder.

**Why:** file-sync services corrupt `.git` — they sync thousands of small files out of
order, create "conflicted copy" duplicates inside `.git`, and can evict files to the cloud.
GitHub already does this job correctly.

**Would change our mind:** nothing. This one is settled.

---

## 2026-08-30 — Photos stored inline in Firestore, not Firebase Storage

**Decision:** compress to ~100–180KB JPEG and store in the Firestore document.

**Why:** avoids Storage bucket setup and CORS configuration entirely at v0 scale. Fewer
things to get wrong before the first working demo.

**Would change our mind:** item counts in the hundreds, or a need for full-resolution
originals. Then move to Storage.

---

## 2026-08-30 — esbuild instead of Vite

**Decision:** bundle with esbuild; React and Firebase load from a CDN import map.

**Why:** pivoted mid-build when the sandbox ran out of disk installing Vite. The source is
standard React and migrates to Vite unchanged if we ever need the richer dev server.

**Would change our mind:** needing HMR, environment variables, or a plugin ecosystem.

---

## 2026-08-30 — AI vendor behind a two-method abstraction

**Decision:** components call only `engine.tagPhoto()` / `engine.answerQuery()`. Providers
implement `visionJSON` and `textJSON`.

**Why:** vendor choice is a settings toggle, not a refactor. Also creates the seam for
future on-device/private routing via the `sensitivity` flag — a real requirement for an
app handling dementia patients' home photos.

**Would change our mind:** nothing foreseeable. Keep this seam intact.
