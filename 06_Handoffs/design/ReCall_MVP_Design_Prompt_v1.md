# ReCall — MVP design prompt (v1)

**Status:** draft, 2026-09-02. Not yet reviewed by Tanya. Do not paste anywhere until she has.
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
at a glance whether the day is going fine. That is the whole product. Everything in this brief serves that
loop.

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
8. **Motion is minimal.** No animation longer than 150 ms. No sounds by default.
9. **No numbers thrown back at the patient.** No streaks, counts, scores, or "you've logged 12 items".
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

### A. Patient (Margaret)

**A1. Home [MVP].** The most-used screen. Top: the date and time line, conversational, large, always
present. Then a short morning briefing block (see A7; at most five tiles, collapsible to two by the
caregiver but never hidden). Then pinned item tiles: large photo-thumbnail tiles labelled with the item
name — Keys, Glasses, Wallet, Phone, Medications, Remote, Hearing aids, Bag — two per row. Tapping a tile
answers "where is it?" immediately (A4). Bottom: one large camera button, and one "Ask" entry (a text
field that also has a microphone). Also reachable but visually quiet: Recent (A6) and a small settings
entry. No tab bar with five icons; this screen has one job.

**A2. Capture [MVP].** Camera opens full-screen from the home button in under two seconds. One large
shutter. After the shot, a single card: the photo, the AI's item name and location in large editable
text ("Keys — on the kitchen counter"), and a short description line. Below the location, up to five
suggested places drawn from what this household has used before ("kitchen counter", "hall table",
"bedside drawer") as tappable chips, plus a free-text option. One large confirm button, and a visible
"Fix" affordance on the text. If the person does nothing, the card auto-saves after about three seconds
with a quiet progress cue, not a countdown that feels like pressure. When the AI is not confident, the
name field is simply empty and waiting for typing; no warning, no "couldn't recognize". Design the
states: capturing, thinking (a calm skeleton, never a spinner), suggestion shown, saved.

**A3. Correct [MVP].** Not a separate screen so much as a behavior: tap any name or location on any card
and it becomes editable in place, with the keyboard up and the location chips available. Save is
implicit on blur or one tap. Show this state on the capture card and on the answer card.

**A4. Answer [MVP].** Reached from a tile tap or an Ask query. The photo, large. The location in large
text. A time line in human words: "yesterday morning", "a few minutes ago", "earlier this week"; long
press shows the exact time. If the photo is more than three days old, a calm note: "This photo is from
last Tuesday — it may have moved since then." Never blocks the answer, never implies fault. One button:
"Found it? Snap where it is now", which opens the camera pre-labelled with this item (a re-snap keeps the
old photo in history). Below, up to two alternates as small cards if the query was ambiguous. The screen
must look exactly the same whether this is the first time or the fiftieth time the question was asked.

**A5. Ask [MVP].** A text field with a microphone. Voice is the primary path: tap the mic, speak, see the
transcript appear as large text before anything is sent, with a clear re-record path. Typing is the
fallback. Results appear in under two seconds; show the skeleton state, not a spinner. No match is
gentle: "I don't have a photo of that yet — want to add one?" with a camera button, followed by the
recent items so there is always something to look at. No query history is shown, ever.

**A6. Recent [MVP].** A reverse-chronological grid of photos with name and location captions. Tap any
for the full answer card (A4). No folders, no albums, no filters, no search within.

**A7. Morning briefing [MVP].** Lives at the top of Home; also openable full-screen. At most five tiles,
ordered by recency and importance: today's date and day-part; any appointment today; medication status
for the morning (taken, or not yet, in amber, never red); the two or three most recently saved items;
a nightly-check summary if last night's was done. Consistent every time it is opened; Linda will open it
ten times. Caregiver can choose which tiles appear.

**A8. Medication confirmation [MVP].** A photo, not a checkbox. From the briefing's medication tile: the
camera opens with the medication name; the person photographs the pill organizer or the empty slot; the
AI checks whether the slot for this time of day is empty and confirms. Design the "confirmed" state and
the "not yet" state (amber, patient wording: "Morning pills — not yet"). Nothing here nags.

**A9. Nightly safety screen [MVP].** One tap from Home in the evening, or shown automatically at a set
hour. Four items the household chose (typically stove, front door, back door, windows), each with its
most recent confirmation photo thumbnail and a time ("checked at 9:40 tonight"). Tapping one shows the
photo full-screen. A "check again" path that re-opens the camera pre-labelled. This is the screen that
lets someone go to sleep without walking back to the kitchen; make it feel settled.

### B. In-home caregiver (Robert)

**B1. Caregiver home [MVP].** Robert's version of Home. Same date line. A prominent "Log for Margaret"
camera button; captures made here look identical to Margaret's on her side (no "logged by Robert" mark
on the patient surfaces). A notes field on his capture card that she does not see. A one-tap switch to
see the patient view. A short list of what was saved today. No charts.

**B2. Caregiver capture [MVP].** The A2 card with two additions: a private note field and a "log several
in a row" mode that returns to the camera after each save instead of going home, so he can do the whole
kitchen in one pass.

**B3. Item management [MVP].** A list of all items and all known locations; he can rename a location
globally ("the drawer" → "hall drawer"), choose which items are pinned as tiles on Margaret's home, and
see which items he logged versus which she did. Nothing on this screen is visible on the patient side.

**B4. Household and roles [MVP].** Invite another device with a short code; see who is in the household
and their role (patient, caregiver, remote caregiver); remove a device. Plain, minimal.

### C. Remote caregiver (Priya)

**C1. Status view [MVP].** One screen. Three indicators, each one of exactly three colors (green, amber,
grey for "no information yet"; never red): medication taken today, nightly safety check done last night,
recent activity (something was captured or asked in the last day). Below, the last few things logged,
with thumbnails. Tap any indicator for its detail (the medication photo, the safety photos, the recent
items). No push notifications from this screen; it is something she opens, not something that interrupts
her. Shows the date line too, because she should see what day it is for her dad.

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

**D3. Settings [MVP].** Deliberately small. Household (B4), which briefing tiles show, nightly-check hour,
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
own voice, optionally with a photo (the dentist's card). The next morning it appears as a tile in her
briefing with a play button; tapping plays her own voice back. Never plays unless she opened the app and
tapped it. Caregivers can see pending reminders. Design: the record screen (one big button, a visible
level meter, a re-record path) and the playback tile on the briefing. Why it is the showcase: her own
voice carries her own intent, which a synthetic prompt never does, and the demo takes ten seconds to
land emotionally.

### Coverage check (for the reader, not the designer)

The committed MVP is 22 features. Nineteen have a screen above: photo logging (A2), natural-language
search (A5), repeated-query tolerance (A4 + constraint 2), calm UI (section 4), one-tap confirm (A2),
always correctable (A3), time/day orientation (A1), caregiver logging (B1–B2), multi-device (B4, D2),
AI accuracy fallback (A2 empty-name state), voice input (A5), search speed (A5 skeleton state), morning
briefing (A7), semantic location suggestions (A2 chips, B3), medication photo (A8), caregiver status
(C1), nightly safety (A9), caregiver-driven origination (C2, B1), contextual time hints (A4). The other
three — VLM-backed recognition, embeddings-backed search, silent usage logging — are architecture and
have no screen by design. Nothing else from the backlog belongs in these mockups.

## 6. Flows that must be clickable end to end

1. **Patient find:** Home → tap "Keys" tile → Answer → "Found it? Snap where it is now" → Capture →
   auto-save → back to Home. Then tap "Keys" again and get an identical screen.
2. **Patient capture:** Home → camera → shot → suggestion card → tap a location chip → confirm (or
   wait) → Home with the new item visible.
3. **Patient ask by voice:** Home → mic → transcript shown → Answer. And the no-match branch.
4. **Correct in place:** any card → tap the location text → edit → done.
5. **First-run checklist** from the helper's phone, including a skipped item.
6. **Caregiver logging:** Caregiver home → "Log for Margaret" → capture with note → several-in-a-row →
   switch to patient view to confirm the item looks native there.
7. **Remote status:** Status view → tap the medication indicator → see the confirmation photo.
8. **Nightly check:** Home (evening) → nightly screen → tap stove → photo → "check again" → capture.
9. **Showcase, active recall:** tap "Glasses" with the mode on → all four steps → "Just show me" from
   step two as an alternate path.
10. **Showcase, voice reminder:** record → next-morning briefing tile → play.

## 7. Output

Produce interactive, phone-sized screens (390 × 844 baseline) for everything in section 5, wired so the
ten flows above can be clicked through. Use realistic household photos as placeholders (keys on a
counter, glasses on a bedside table, a pill organizer), not icons or grey boxes; the photo is the
product. Include the empty states (first day, no items yet) and the thinking states. Show the patient
Home in both a morning and an evening state. Keep every showcase screen visibly tagged "Preview".

Where this brief is silent, choose the option with fewer elements on screen, larger type, and calmer
color. When in doubt, ask "would this scare Linda?" and "would Robert still be using it on Thursday?"
