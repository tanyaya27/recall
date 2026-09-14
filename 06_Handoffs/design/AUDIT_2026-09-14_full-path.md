# Full-path audit — 2026-09-14 (build 20260914j → k)

Ravi: "walk through all paths — there are some big bugs; adding a photo from the item
detail view is very weird." Run by the product board: Maya (PM) leading, Devin (design),
Priyanka (eng) at the keyboard, and the end-user board — Margaret, Robert, Priya — reading
every screen. Method: `04_Engineering/recall-app/rig/audit.js` drives the real app in
Chromium at phone size through 67 checks across every screen and transition, with an
OLD-format item seeded exactly as the ones on Ravi's phone (logged on the 09-05 build: no
`logId`, no `photoCount`, no `aliases`). Screenshots in the rig's `shots/audit-*.png`.

## The paths walked

A. Boot: no key → setup card, footer disabled, Set up → Settings (Version first) · with key
→ empty board prompt.
B. Home: tiles, old thumbnails rebuilt, *no place yet*, day line at 390 and 430.
C. Log item: camera Cancel · two shots → roll · ✕ a shot · AI name as a field · rename on
the card → alias kept · Somewhere else → typed place, capitalised · Back before save
saves nothing · save before the name arrives → finished later · name tier match → *New
photo of* + *Not your …?* → *Not your* makes it new · unsure visual match ignored · sure
visual match → *New photo of* · late match after save → *Is this your …?* → Yes merges,
no extra tile.
D. Thing card: old item opens · **Add photo on an old item** · Add photo on a new item ·
strip and dots · *Where it has been* rows → Earlier mode → Back to now · Remove photo
(sheet, Undo restores) · Fix → rename keeps alias, header updates, panel has no Remove ·
Found it → camera → resnap card → save → Home, tile count unchanged, *Saved* toast.
E. Press-and-hold: sheet opens without navigating · Cancel · Change the place → Fix open
· Remove → confirm → Undo puts it back.
F. Find item: field focused · live tile while typing · tile → thing card · no live match →
Find it (AI) · AI says none → *No photo of that yet* + *Take a photo of it* → camera.
G. Menu: each of the four screens opens with its title · Back returns to the drawer ·
Locations add / rename / remove · text size, colours and density apply at once · Close.
H. Deleted items: removed item listed · Put back → gone from the list, tile returns.

## What the audit found (first run: 61 of 66)

1. **Add photo on an old item did nothing** (D2–D4) — Ravi's "very weird behaviour".
   `addSnapToLog` returned false when the item had no `logId`, which every item logged
   before 09-14 lacks; the toast then said *That log already has four photos*. **Maya:**
   a silent failure with a false explanation is the worst class of bug for this user —
   she will believe the app, not herself. **Fix:** an item without a log gets one on the
   spot; the cover stays the cover.
2. **A photo added on the thing card never appeared** until the card was reopened (D9) —
   the card cleared its photo list but nothing told it to reload. **Robert:** "I added
   it, nothing happened, so I added it again" — two extra photos. **Fix:** the card
   re-reads its photos whenever the photo count changes.
3. **Rename never kept the old name** (D13) — the alias check compared the old name with
   itself. Every rename since this morning lost the alias, so the duplicate guard was
   weaker than recorded. **Fix:** compare old against new.
4. **Find item → *Take a photo of it* was a dead end** (F5): it still used the phone's
   file input and handed one file to a photo card that now expects a list — the card
   showed "…" forever. **Margaret:** "that's the moment I most need it to work." **Fix:**
   it opens the in-app camera like every other camera button.
5. (Audit script, not the app) the *Take a photo of it* offer only appears after the AI
   has said no — the check was corrected to submit first.

Second run after fixes: **67 of 67**, no page errors.

## Board notes that are not bugs (for Tanya's list)

- **Devin:** *Change the place* and *Rename* in the tile sheet both open the same Fix panel
  with both fields; fine for now, but the row says one thing and shows two. Focus the
  tapped field when the panel opens.
- **Maya:** the *Saved · place* toast after a merge does not say it merged. *Saved · Kitchen
  counter · your glasses* would close the loop Ravi opened this morning.
- **Priya:** after *Add photo* the strip stays on the cover; a person who took the photo
  wants to see it — slide to the new page.
- **Margaret:** the Earlier mode's *Back to now* is the only way out besides Back — fine,
  but the words *Earlier* in small capitals are the hardest text on the card to read.
- **Priyanka:** the rig has no Firestore latency; on the phone, the listener update after
  *Add photo* arrives ~100–300 ms after the toast. Watch for a flash of the old count.

## Standing rule (Maya)

`audit.js` runs before every hand-off, and a new path gets a check the day it is built.
The audit is the review; the screenshots are the second review.
