# v2 delta — paste this into the existing Design session

For the session that already built mockups v1. Full self-contained brief is `ReCall_MVP_Design_Prompt_v2.md`;
use that for a fresh session. Everything below the rule is the message.

---

Revision to the ReCall brief. Keep the palette, type, photos, card style and the three role homes you
already built — those are right. Restructure as follows; where this conflicts with the original brief,
this wins.

## The problem with the current screens

Two things. First, there is no navigation: every screen is a dead end with a small "Back" text link at
top-left, which a one-handed thumb cannot reach and a person with memory loss will not find. Second,
finding things and checking routines look the same. "Morning pills — not yet" sits above the Keys tile
as another photo card; the nightly Stove row looks like an item. A new user cannot tell whether "Stove"
is a thing to locate or a task to do.

## ReCall does two jobs, and they must look different

- **Find** — "Where is it?" About *things*: keys, glasses, wallet, remote. Permanent records, refreshed
  when someone snaps the thing again. The answer is a photo of a place.
- **Today** — "Did it happen?" About *routines*: morning pills, the stove, the doors at bedtime. These
  reset every day. The answer is a photo taken as proof, the time, and a state of done or not yet.

**Find is photographic.** Big tiles, the object's own photo, its name underneath. Nothing else on the
tile: no dot, no state, no time.

**Today is a list.** Short rows, one per routine, each with a small proof-photo thumbnail on the left when
done (a soft empty square when not), the state in words ("done at 9:40" / "not yet" in amber), and a
chevron. Resets at midnight. Never uses the tile shape.

The two never mix on one surface. A Today row is never a photo tile; a Find tile never carries a state.

## Navigation — two new hard constraints

1. **Every patient screen has the same bottom bar:** three equal buttons, at least 64 pt tall, icon plus
   word, current one filled with the accent — **Find · Today · Camera**. Any deeper screen (an answer, a
   photo, a check) also shows one full-width **Back** button directly above that bar. Never a small text
   link, never top-left. No screen is a dead end.
2. Caregiver screens have the same bar with their own destinations: Robert gets **Log · Today ·
   Margaret's view**; Priya gets **Status · Today · Set up**.

## Screen changes

**A1 Find / Home.** Date line at top, unchanged. Then two clearly separated bands with headings. "Today":
at most three rows — the next routine not yet done, any appointment today, one line "Last night's check
was done" — and a "See all of today" chevron. "Where things are": the pinned photo tiles, two per row.
**Medications are no longer a tile**; they are a Today routine. Under the tiles, "Recent photos" and
"Settings" become bordered buttons, not text links. Then the Ask entry, then the bottom bar. Show
morning and evening states; in the evening the Today band's first row is "Bedtime check — not yet".

**A2 Capture.** You skipped the suggestion card; draw it. After the shot: the photo, the AI's name and
location as large editable text with "Fix" beside them, a short description line, up to five location
chips from this household's history plus a free-text chip, then one large confirm button labelled with
the outcome ("Save — keys on the kitchen counter"). Auto-save after about three seconds shown as a slow
fill of that button, not a countdown. Low-confidence state: name field empty with the keyboard ready, no
warning. Fix the saved-state grammar ("Your keys are saved"). Full-width Back above the bar.

**A5 Ask.** Add the transcript state: while listening, the words appear as large text and then rest on
screen with two buttons, "Ask this" and "Say it again", before anything is sent.

**A7 Today** (full screen, from the bottom bar). Date line, then the routines list in fixed order every
time: morning pills, any appointment, later pills if the household has them, the bedtime check. Row
grammar as above. Under the list, a quiet "Saved recently" strip of two or three Find thumbnails. At
most five rows.

**A8 Routine check.** Tapping a not-yet row: heading with the routine and state, yesterday's proof photo
for reference, one button "Photograph the organiser". Also draw the done state: proof photo large, time,
"Photograph again" with no implication of doubt.

**A9 Bedtime check.** The bedtime row of Today expanded: four routines the household chose, same row
grammar, tonight's proof thumbnail or "not yet". Heading changes with state: "Two things still to check"
→ "Tonight, everything is where it should be". Tapping a row shows the proof photo with "Check again".

**B3 Caregiver Today (new).** Robert's view of the routines list, where he can mark one done on her
behalf with a photo, add or remove a routine ("Feed the cat", evening), and set the bedtime-check hour.
Adding a routine happens here; adding an item happens through capture.

**C1 Status.** Reword the grey indicator: "Quiet so far today", never "Nothing captured yet".

**E2 Voice reminder.** The playback appears as a row in Today, not a tile.

Everything else stays as built.

## Flows to make clickable

1. Find → Camera → shot → thinking → suggestion card → tap a chip → confirm → saved → Find with the new tile.
2. Find → Keys tile → Answer → "Found it? Snap where it is now" → capture → Find. Tap Keys again: identical.
3. Find → Speak → transcript → "Ask this" → Answer; also "Say it again" and no-match.
4. Navigation round trip: Find → Recent → photo → Answer → Back → Recent → Today (bar) → a routine →
   Back → Find (bar). No step may use a top-left control.
5. Morning: Find → "Morning pills — not yet" row → photograph → done → Back → Today shows it done → Find band updated.
6. Bedtime: Find (evening) → "Bedtime check" → A9 with two done, two not → Stove → photo → heading changes.
7. Robert: Log → Today → add "Feed the cat" → switch to Margaret's view → it appears as a row, not a tile.
8. Priya: Status → medication indicator → proof photo and time.

## Output

Every screen must show the bottom bar; a screen without it is incomplete. Show Find in morning and
evening states, and Today fully done and partly done. Keep the showcase screens tagged "Preview".
