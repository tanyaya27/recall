# ReCall — MVP design prompt (v2)

**Status:** draft, 2026-09-02. Supersedes v1. Changes from v1 (see `mockups-v1-review.md`): names
the Find / Today split, adds a persistent bottom bar, moves Back out of the top-left, and specifies
the capture suggestion card and the Ask transcript state that v1 mockups skipped.
Not yet reviewed by Tanya. Do not paste anywhere until she has.
**How to use:** copy everything below the horizontal rule into Claude's Design tool as one message. The
Design tool sees nothing but this text, so every fact it needs is here. Do not add "see the spec".
**Source of truth for scope:** `01_Needs_and_Prioritization/ReCall_prioritization_2026-07-04.json`.
If a scope question comes up while designing, raise it with Tanya; do not resolve it in this file.

---

Design the interactive mobile screens for **ReCall**, a camera-first visual memory vault for people with
early-stage dementia and the family members who care for them.

## 1. What ReCall is

A person with early memory loss puts their reading glasses down and, twenty minutes later, cannot find
them. ReCall replaces the search with a photo. When you put something down, you snap a picture; the app
names the object and where it is ("Reading glasses — on the kitchen counter") and saves it. Later you ask,
in plain words, "where are my glasses?" and the app shows you the photo, the place, and when it was taken.
Family members can log items on the person's behalf from their own phones, and a remote relative can see
at a glance whether the day is going fine.

ReCall does exactly two jobs, and they must look and behave differently:

- **Find** — "Where is it?" About *things*: keys, glasses, wallet, remote. A thing's record is permanent
  and gets refreshed whenever someone snaps it again. The answer is a photo of a place.
- **Today** — "Did it happen?" About *routines*: morning pills, the stove, the doors at bedtime. These
  reset every day. The answer is a photo taken as proof, with the time it was taken, and a state of
  either done or not yet.

A user must be able to tell at a glance which of the two they are looking at. Section 5 explains how.

The app is a web app installed to the phone home screen (PWA), used one-handed on a phone, mostly in a
kitchen, hallway or bedroom, often in a moment of mild stress. Design for the phone first. A desktop or
tablet layout is not needed.

## 2. Who it is for — three people, three different screens

**Margaret — the person with memory loss.** Early stage, fully aware of her condition, and actively
trying to compensate. She was a school librarian for thirty years and organized information for a living,
which makes losing that ability especially painful. She loses her glasses, phone and keys several times a
day, re-checks the same drawer knowing she already looked, and feels her confidence eroding week by week.
She will engage with technology if it feels empowering rather than clinical, prefers clean interfaces that
are not dumbed-down, responds to gentle guidance and not to alarms, and will read an instruction once but
not remember it tomorrow. **What she needs from the interface:** very few choices per screen, nothing to
remember from a previous screen, an answer to "where are my keys?" in one tap, and the certainty that she
can ask the same question as many times as she likes without the app ever noticing.

**Robert — her husband, the in-home caregiver.** 71, exhausted, not technical, skeptical of new apps
because he has been burned before. He answers "where are my glasses?" twenty times a day. He measures an
app's value in time saved this week, not next month, and will stop using anything that adds friction within
three days. **What he needs from the interface:** the camera open in under two seconds, a save that is one
tap, a way to log items for Margaret from his own phone without her feeling managed, and a private place
for caregiver notes she does not see by default. He does not want a dashboard; he is in the house.

**Priya — the daughter, two thousand miles away.** Tech-savvy, busy, carrying constant low-grade worry
about her father (in Priya's story the patient is her dad; the screens are the same). She is the one who
finds the app, sets it up, invites the others, and checks in one or two times a day. She wants the answer
to "do I need to be worried?" in five seconds, not a log. She will stop looking at anything that requires
effort every day. **What she needs from the interface:** a single status screen with at most three
indicator colors, tap-through for detail, and no noise.

One more person to design against even though she has no screen of her own: **Linda**, who lives alone
and whose real problem is not memory but the panic that follows every lapse. She reopens the same
information for reassurance, is extremely sensitive to wording and color, and will be a heavy user if the
app makes her feel safe. Every screen should pass the test "would this scare Linda?"

## 3. Non-negotiable constraints

These come from the must-have features. A design that violates one is wrong no matter how good it looks.

1. **No alarm language, ever.** No red anywhere in the app, including errors and missed medication. No
   flashing, no badges, no urgency indicators, no bold "call to action" buttons that shout. Anything that
   would normally be red is warm amber or brown. No error state may read as the person having failed.
2. **Asking the same question fifty times must feel identical the fiftieth time.** No "you already asked
   that", no query history shown to the patient, no progressive shortening of the answer, no impatience in
   copy or in motion. Same tone, same layout, same timing.
3. **One tap to save.** From the capture screen, the AI's suggestion saves with a single tap, and if the
   person does nothing it saves itself after about three seconds. No wizards, no "are you sure?", no
   confirmation dialogs anywhere on the capture path.
4. **Every AI output is correctable, forever.** The name, the location and the description are editable
   text on every card, one tap away, at any time. Correcting must feel like adjusting a label, not
   reporting a fault. No "Sorry, I got that wrong"; a neutral acknowledgement only.
5. **Date and time are always visible on the home screen**, in conversational form: "Wednesday
   afternoon, about 3:15", not "15:15 Wed". Large type. Never collapsed, never dismissed.
6. **Three roles, three home screens.** Patient, in-home caregiver, remote caregiver. Each opens to the
   screen that person needs. Switching is one tap for a caregiver; the patient never sees the caregiver
   surfaces.
7. **Built for the hand and eye it will meet.** One-handed phone use; primary actions in the bottom half
   of the screen; touch targets at least 56 pt; body text no smaller than 18 pt and item names larger;
   contrast at WCAG AAA; no gesture-only interactions (everything reachable by tap); no reliance on
   remembering a previous screen.
8. **There is always a way home, and it is always in the same place.** Every patient screen has the
   same bottom bar: three large labelled buttons, **Find · Today · Camera**, with the current one
   visibly selected. Any deeper screen (an answer, a photo, a check) additionally shows one large
   **Back** button immediately above that bar, full width, never a small text link, never top-left.
   No screen is ever a dead end. Caregiver screens have the same bar with their own three
   destinations (section 5B).
9. **Find and Today never share a visual grammar.** Find things are photo tiles of the object. Today
   routines are rows in a short list with a done / not-yet state. A Today row is never a photo tile and a
   Find tile never carries a state. Section 5 gives the specifics.
10. **Motion is minimal.** No animation longer than 150 ms. No sounds by default.
11. **No numbers thrown back at the patient.** No streaks, counts, scores, or "you've logged 12 items".
    Capability-affirming copy only ("Your keys are saved").

## 4. Visual direction — take this position

"Calm" here is a requirement, so this is what calm looks like for ReCall:

- **Palette:** warm neutrals. An off-white paper background (think unbleached linen, not clinical white),
  a single deep muted green or slate blue as the one accent, warm amber for anything that needs
  attention, soft brown for text. No pure black, no pure white, no red, no neon. Photos supply the color;
  the chrome stays quiet.
- **Type:** a humanist sans with generous x-height (Atkinson Hyperlegible or similar). Large. Item names
  at roughly 28–32 pt, body 18–20 pt, the date line 22–24 pt. Weight does the hierarchy, not color.
- **Shape and space:** rounded cards with soft, low shadows; wide margins; one primary thing per screen.
  If a screen has more than four tappable things, it has too many.
- **Photos dominate.** The thumbnail of the item is the interface. Words support the photo, never the
  reverse.
- **Tone of voice in copy:** warm, plain, adult. Say "Your keys are on the hall table" not "Item located".
  Never childish, never clinical, never jokey. Never apologize, never congratulate.
- **What it is not:** not a medical app, not a productivity app, not a photo-management app. If a screen
  could be mistaken for a hospital portal or a to-do list, redo it. The nearest reference point is a
  well-made recipe app or a gentle weather app: photographs, big type, one job.

## 5. Screen inventory

Design every screen below. Screens marked **[MVP]** are committed. Screens marked **[SHOWCASE — not
MVP]** are demonstrations of later features, included so first adopters see where the product is going;
label them visibly in the mockup itself (a small "Preview" tag is fine) so no one mistakes them for a
commitment.

### How the two domains look

**Find** is photographic. Big tiles, the object's own photo, the object's name underneath. Nothing else on
the tile: no dot, no state, no time. Tapping one answers "where is it?".

**Today** is a list. Short rows, each a routine ("Morning pills", "Stove", "Front door"), each with a
small proof-photo thumbnail on the left when done and a soft empty square when not, a state in words
("done at 9:40" / "not yet", amber), and a chevron. It resets at midnight. It never uses the tile shape.

The two domains never mix on one surface. Home shows the Today list *above* the Find tiles as two clearly
separated bands with their own headings ("Today" and "Where things are"), and the bottom bar lets the
patient jump to either as a full screen.

### The bottom bar

Present on every patient screen, identical everywhere: three buttons of equal width, at least 64 pt
tall, icon plus word, current one filled with the accent. **Find** (home, the tiles) · **Today** (the
routines list, including the morning briefing and the nightly check) · **Camera** (capture). Deeper
screens show a full-width **Back** button directly above this bar. Recent and Settings are reachable from
the Find screen as clearly bordered buttons under the tiles, not as text links.

### A. Patient (Margaret)

**A1. Find / Home [MVP].** The most-used screen and the one the app opens to. Top: the date and time
line, conversational, large, always present. Then the "Today" band: a compact version of A7 — at most
three rows (next routine that is not yet done, then any appointment today, then a single line "Last
night's check was done") with a "See all of today" chevron; the caregiver can trim it to one row but
cannot hide it. Then the "Where things are" band: pinned photo tiles — Keys, Glasses, Wallet, Phone,
Remote, Hearing aids, Bag — two per row. Medications are a Today routine, not a Find tile. Below the
tiles, two bordered buttons: Recent photos, Settings. Then the Ask entry (a text field with a
microphone) and the bottom bar. Show morning and evening states; in the evening the Today band's first
row becomes "Bedtime check — not yet".

**A2. Capture [MVP].** Camera opens full-screen from the Camera button in under two seconds. One large
shutter; a full-width Back above the bar. After the shot, the **suggestion card** (this card was missing
from the v1 mockups; draw it): the photo at the top, then the AI's item name and location in large
editable text ("Keys — on the kitchen counter"), a short description line, then up to five suggested
places from this household's history as tappable chips ("kitchen counter", "hall table", "bedside
drawer") with a free-text chip, then one large confirm button labelled with the outcome ("Save — keys
on the kitchen counter"). "Fix" sits beside the name and location text. If the person does nothing the
card saves itself after about three seconds, shown as a slow fill in the confirm button, not a
countdown. When the AI is not confident the name field is simply empty with the keyboard ready; no
warning. Draw the states: viewfinder, thinking (calm skeleton, no spinner), suggestion card, saved
("Your keys are saved" — plural/singular must be right). Saved returns to Find with the new tile visible.

**A3. Correct [MVP].** A behavior: tap any name or location on any card and it becomes editable in
place, keyboard up, location chips available. Save on blur or one tap. Show this state on the
suggestion card and on the answer card.

**A4. Answer [MVP].** Reached from a tile tap or an Ask query. The photo, large. The location in large
text with "Fix" beside it. A time line in human words ("yesterday morning", "a few minutes ago",
"earlier this week"); long press shows the exact time. If the photo is older than three days, a calm
line: "This photo is from last Tuesday — it may have moved since then." One primary button: "Found it?
Snap where it is now" (opens the camera pre-labelled; the old photo stays in history). Up to two
alternates as small cards if the query was ambiguous. Back above the bar. Identical the first and the
fiftieth time.

**A5. Ask [MVP].** Voice first. A large Speak button; while listening, the transcript appears as large
text as it is recognised, then rests on screen with two buttons — "Ask this" and "Say it again" — before
anything is sent (v1 skipped this state; draw it). Typing is the fallback field. Results in under two
seconds, skeleton not spinner. No match: "I don't have a photo of that yet — want to add one?" with a
camera button, then the recent items. No history, ever.

**A6. Recent [MVP].** Reverse-chronological grid of Find photos with name and location. Tap for A4. No
folders, filters or search. Back above the bar.

**A7. Today [MVP].** The full Today screen, reached from the bottom bar. Date line at top. Then the
routines list for today, in fixed order every time it is opened: morning pills, any appointment, midday
or evening pills if the household has them, the bedtime check (which expands into A9). Each row: proof
thumbnail or empty square, name, state in words, chevron. Under the list, a quiet "Saved recently" strip
of two or three Find thumbnails. At most five rows; the caregiver chooses which. Consistent every time —
Linda will open it ten times.

**A8. Routine check — medication [MVP].** Tapping a not-yet row opens a screen headed with the routine
name and state ("Morning pills — not yet"), yesterday's proof photo for reference, and one button:
"Photograph the organiser". The camera opens pre-labelled; the AI checks whether today's slot is empty
and the row becomes "done at 8:24" with the new photo. Draw the done state too: proof photo large, time,
and a "Photograph again" button that does not imply doubt. Nothing here nags.

**A9. Bedtime check [MVP].** The bedtime row of Today, expanded: four routines the household chose
(stove, front door, back door, windows), same row grammar as A7, each with tonight's proof thumbnail or
"not yet". Tapping a row shows the proof photo full-screen with "Check again". A calm heading that
changes with state: "Two things still to check" → "Tonight, everything is where it should be". Reached
from Today, or shown automatically at a set hour.

### B. In-home caregiver (Robert)

Robert's bottom bar: **Log** · **Today** · **Margaret's view**.

**B1. Log / Caregiver home [MVP].** Date line. A prominent "Log for Margaret" camera button and a
"Log several in a row" secondary button. A list of what was saved today, with who logged it. Bordered
buttons to Items and locations, Household and roles. His captures look identical to Margaret's on her
side; no "logged by Robert" mark appears anywhere she can see.

**B2. Caregiver capture [MVP].** The A2 suggestion card with a private-note field and a several-in-a-row
mode that returns to the viewfinder after each save.

**B3. Caregiver Today [MVP].** The same routines list as A7 but with the ability to mark a routine done
on her behalf (with a photo) and to choose which routines appear and at what hour the bedtime check
opens. This is where the Find/Today distinction is managed: adding a routine happens here, adding an
item happens through capture.

**B4. Items and locations [MVP].** All items and all known locations; rename a location globally; choose
which items are pinned; see which items he logged versus which she did. Nothing here is visible on the
patient side.

**B5. Household and roles [MVP].** Invite another device with a short code; see who is in the household
and their role; remove a device.

### C. Remote caregiver (Priya)

**C1. Status view [MVP].** One screen. Three indicators, each one of exactly three colors (green, amber,
grey for "no information yet"; never red): medication taken today, nightly safety check done last night,
recent activity (something was captured or asked in the last day). Grey wording must be neutral, not
a quiet alarm: "Quiet so far today", never "Nothing captured yet". Below, the last few things logged,
with thumbnails. Tap any indicator for its detail (the medication photo, the safety photos, the recent
items). No push notifications from this screen; it is something she opens, not something that interrupts
her. Shows the date line too, because she should see what day it is for her dad. Priya's bottom bar:
**Status** · **Today** (read-only view of his routines) · **Set up**.

**C2. Remote logging [MVP].** During a visit, Priya sets everything up: the starter checklist (D1) run
from her phone, items pinned to her father's home screen, and locations named. When she leaves, he can
find everything without ever having been told the system exists. Design the flow of doing the checklist
for someone else.

### D. Setup

**D1. First-run starter checklist [MVP].** For the helper (Robert or Priya) with the patient present. A
friendly list of about eight everyday items: keys, wallet, glasses, phone, medications, TV remote, hearing
aids, bag or purse. Tap one → camera → snap → AI suggests → one tap to confirm → next. Any item can be
skipped. Done items become the pinned tiles on the patient's home. Target: five or more items in under
ten minutes. Progress is shown as filled tiles, not a percentage.

**D2. Role choice and join [MVP].** The first screen a new device sees: "Who is this phone for?" —
the person, someone caring for them at home, or family checking in from elsewhere — and a short code to
join an existing household.

**D3. Settings [MVP].** Deliberately small. Household (B5), which Today rows show, bedtime-check hour,
text size, and a caregiver-only area with the AI key entry and a data-export option. Nothing in Settings
is needed for daily use.

### E. Showcase screens — not MVP, label them "Preview" in the mockup

**E1. Scaffolded active recall [SHOWCASE — not MVP].** An opt-in mode a caregiver or therapist turns on
for the patient; default behavior stays instant answer. When on, tapping "Glasses" first shows a gentle
prompt instead of the photo: "Try to remember where you put your glasses." No timer. Two choices: "I
remember" (goes straight to the photo) and "I don't remember". If needed, a cue next: "Think about the
last time you were reading." Still stuck: three or four real locations from this household's recent
history as large tappable options ("Bedside table / Kitchen counter / Reading chair"). Then the photo,
revealed identically whether the guess was right or wrong; no "correct!", no score. A "Just show me"
button is present on every step, in the same place, always. Why it is the showcase: nothing else on the
market treats the person's own memory as worth exercising, and it produces a distinctive "this app
respects my mind" moment for exactly the early-stage, insightful user we are launching with.

**E2. Voice self-reminders [SHOWCASE — not MVP].** Margaret records "Call the dentist tomorrow" in her
own voice, optionally with a photo (the dentist's card). The next morning it appears as a row in her
Today list with a play button; tapping plays her own voice back. Never plays unless she opened the app and
tapped it. Caregivers can see pending reminders. Design: the record screen (one big button, a visible
level meter, a re-record path) and the playback row in Today. Why it is the showcase: her own
voice carries her own intent, which a synthetic prompt never does, and the demo takes ten seconds to
land emotionally.

### Coverage check (for the reader, not the designer)

The committed MVP is 22 features. Nineteen have a screen above: photo logging (A2), natural-language
search (A5), repeated-query tolerance (A4 + constraint 2), calm UI (section 4), one-tap confirm (A2),
always correctable (A3), time/day orientation (A1), caregiver logging (B1–B2), multi-device (B5, D2),
AI accuracy fallback (A2 empty-name state), voice input (A5), search speed (A5 skeleton state), morning
briefing (A1 Today band + A7), semantic location suggestions (A2 chips, B4), medication photo (A8),
caregiver status (C1), nightly safety (A9), caregiver-driven origination (C2, B1), contextual time
hints (A4). The other
three — VLM-backed recognition, embeddings-backed search, silent usage logging — are architecture and
have no screen by design. Nothing else from the backlog belongs in these mockups.

## 6. Flows that must be clickable end to end

1. **Patient find:** Find → tap "Keys" tile → Answer → "Found it? Snap where it is now" → viewfinder →
   suggestion card → auto-save → Find with the tile refreshed. Then tap "Keys" again: identical screen.
2. **Patient capture:** Find → Camera (bottom bar) → shot → thinking → suggestion card → tap a location
   chip → confirm (or wait) → saved → Find with the new tile visible.
3. **Patient ask by voice:** Find → Speak → transcript shown → "Ask this" → Answer. And the "Say it
   again" and no-match branches.
4. **Correct in place:** any card → tap the location text → edit → done.
5. **Navigation round trip:** Find → Recent → a photo → Answer → Back → Recent → Today (bottom bar) →
   a routine → Back → Find (bottom bar). No step may rely on a top-left control.
6. **Morning routine:** Find (morning state) → "Morning pills — not yet" row → A8 → photograph →
   done state → Back → Today shows the row done with its thumbnail → Find shows the band updated.
7. **Bedtime check:** Find (evening state) → "Bedtime check — not yet" → A9 with two done, two not →
   tap Stove → photo → "Check again" → capture → heading changes to "everything is where it should be".
8. **First-run checklist** from the helper's phone, including a skipped item, ending on the patient's
   Find screen with the new tiles.
9. **Caregiver logging:** Log → "Log for Margaret" → suggestion card with note → several-in-a-row →
   "Margaret's view" to confirm the item looks native there.
10. **Caregiver manages Today:** Log → Today → add a routine ("Feed the cat", evening) → it appears on
    Margaret's Today as a row, not a tile.
11. **Remote status:** Status → tap the medication indicator → see the proof photo and time.
12. **Showcase, active recall:** tap "Glasses" with the mode on → all four steps → "Just show me" from
    step two as an alternate path.
13. **Showcase, voice reminder:** record → next-morning Today row → play.

## 7. Output

Produce interactive, phone-sized screens (390 × 844 baseline) for everything in section 5, wired so the
thirteen flows above can be clicked through. Use realistic household photos as placeholders (keys on a
counter, glasses on a bedside table, a pill organizer), not icons or grey boxes; the photo is the
product. Include the empty states (first day, no items yet) and the thinking states. Show the patient
Find screen in both a morning and an evening state, and Today in a fully-done and a partly-done state.
Every screen must show the bottom bar; any screen without it is incomplete. Keep every showcase screen visibly tagged "Preview".

Where this brief is silent, choose the option with fewer elements on screen, larger type, and calmer
color. When in doubt, ask "would this scare Linda?" and "would Robert still be using it on Thursday?"
