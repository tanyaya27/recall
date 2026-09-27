# Board: a visual walkthrough of capture, place and boxes (2026-09-27)

Ravi, 09-27: *"The sequence is totally wrong … go back to the UX board and walk through every step by step … look at it visually too. For instance, when I want to put it in a place not yet logged, the current sequence of typing a name in another box and then not having the ability to take a picture is just bullshit crap. … The board will know."*

**What was done.** The board walked build 20260927b one screen at a time. It was the real app (the rig), a real photo was in the viewfinder at every shot, and every tap was counted.
- The script is `rig/walk_s9.js`. It photographs every step, records where each element sits, and notes whether a keyboard is up.
- `compose_s9.py` numbers the problems on the screenshots.
- The redesign is drawn in `gen_s9.py` → `render_s9.js` → `compose_s9r.py`.
- No code in the app has changed.

**Pages.** The walkthrough (red numbers = the issues below):
- `mockups/S9_walk_1.jpg`: W1, a thing at a place already used.
- `mockups/S9_walk_2.jpg`: W2, into a box already logged.
- `mockups/S9_walk_3.jpg` and `S9_walk_4.jpg`: W3, into a box NOT logged (your example), then finding it.
- `mockups/S9_walk_5.jpg`: W4 (place later), W5 (a box into a place) and W6 (Several).

The redesign:
- `mockups/S9_redesign_1.jpg`: your example on the camera, in 5 taps.
- `mockups/S9_redesign_2.jpg`: the same camera for every "where".
- `mockups/S9_redesign_3.jpg`: layout A or B, plus the tap table.

## What the board found

**The root cause, which the board owns.** On 09-26 you ruled that the camera asks for the item, then, without leaving the camera, for the place. We didn't build that. Instead, fixes 1 and 2 (09-27a and 09-27b) bolted sheets onto the old photo card: an "In something" sheet, then a typed "New:" row inside it. Each fix answered the words of a complaint and added a screen. No fix took away a screen.

The walk shows the result: **four different screens ask "where"**, each worded differently:
- "Where is it?" on the photo card;
- "What is it in?" in the In-something sheet;
- "Where is it now?" in the card's Edit;
- "Where are they going?" in Put away.

They offer three different kinds of answer (place names, boxes with photos, typed text), and **none of them has a camera**. A place is only ever a name, so the app can never recognise one by how it looks.

## Issues, numbered as on the pages

**W1 · a thing at a place used before** (scissors, kitchen counter). Today: 4 taps.
1. The camera opens with "One thing / Several" under the viewfinder. That's a choice before the first photo, and Q3 ruled every photo is one thing.
2. The camera says nothing. There's no "what is it" and no "now where it is"; the place is asked after she leaves the camera.
3. After the shutter the photo drops into a roll, and she must find "Done (1)". That's an extra tap on every log.
4. "In something" and "No place yet" are small outlined buttons. "No place yet" saves at once, but it looks like a filter.
5. The AI's guess looks like every other place, and tapping a name *is* the save. There's no "Save · Kitchen counter" (Q2).
6. The list runs 1.5 screens:
   - 5 bare place names;
   - 2 boxes with photos;
   - Somewhere else;
   - 2 view links.

   So there are two kinds of "where", and they look different.
7. "Saved · Kitchen counter", but the scissors are nowhere on Home. New things go to the end of Home, below the fold.

**W2 · into a box already logged** (a 1978 diary into the wooden box). Today: 5 taps, plus closing the keyboard.
8. The diary was taken for "Yearbook 1978" because the names share a number: "New photo of Yearbook 1978".
9. The screen stacks four decisions:
   - the usual place, shown as a plain name rather than "In the memorabilia box" with its photo;
   - Next item / Done;
   - In something / No place yet;
   - Somewhere else.
10. **Choosing the wooden box moved the yearbook into it, and the diary was never logged.** The wrong thing moved, silently. This is a bug and gets fixed whatever the redesign; see ruling 6.
11. "What is it in?" opens with the keyboard up, covering the boxes.
12. Everything is offered as a box: scissors, reading glasses, the wallet, a phone charger.
13. The sheet covers the photo card, so she loses sight of the thing she is placing.
14. "Saved · Wooden box", and Home doesn't change. The chain she built is never shown back to her.

**W3 · into a box NOT logged (your example)**: bank locker key → blue tin → a shelf. Today: 14 taps, 2 typed names, 9 screens and sheets, and the shelf can never be photographed.
15. A box she hasn't logged can only be typed. The tin is in her hand, and there's no camera on the sheet.
16. Typing empties the grid, and the sheet drops to the bottom of the screen, under where the keyboard is.
17. The new tin has no photo and no place, and nothing asks for either. "Not put away" goes from 1 to 2: the tin became a chore.
18. Tapping the tin opens a near-empty "inside the tin" page, not the tin.
19. The only way to the tin itself is a small underlined "About this box".
20. Its card says "Written down, no photo yet". She never wrote anything; she's holding the tin.
21. The tin's place is under Edit, below the photo, so she has to scroll.
22. "Where is it now?" is the long list again, and a place's picture is borrowed from whatever thing sits there: Kitchen counter shows the scissors.
23. The shelf is typed into a box at the very bottom of the sheet, where the keyboard opens.
24. Find answers "In the blue tin". Where the tin is appears in small grey text below the photo.

**W4 · log now, place later** (a phone charger, then the desk drawer). Today: 4 taps + 4 taps.
25. The toast says only "Saved": the thing has no name yet, and it isn't on screen.
26. Put away asks "where" from a list of 10 with no camera, so a new place has to be typed.
27. Then a second sheet: tap each thing, then a button whose label is an instruction until something is picked.

**W5 · a box into a place, from its card.**
28. A thing with no place opens with Edit already open, so its card looks unlike every other card.
29. "Where is it now?" runs off the right edge of the screen here. This is a layout bug.
30. "In something" opens a second sheet on top of the first, again offering the phone charger as a box.

**W6 · Several.**
31. Several is still a mode with its own strip and questions; under Q3 it goes.

## The redesign: "where" is answered the way "what" is, with the camera

**One rule:** after the photo of the thing, the camera asks where it goes. She **steps back and shoots what it's in, then where that is**. Each shot is one tap, and each adds a photo to a chain along the bottom of the viewfinder:

key → the blue tin → the linen closet shelf

The Save button always names the place ("Save · in the blue tin"). Known places and boxes sit as chips with their own photos, for when she doesn't want to shoot. She never leaves the camera and never types.

**The same screen is used everywhere "where" is asked:**
- after a photo;
- from a thing's card ("Where is it?");
- when putting things away;
- when a box needs its own place.

Places get their own photos the first time she shoots them. After that, the camera recognises them, and the Find answer is a trail she can walk: closet shelf, then the tin, then the key.

| Flow | Today (walked) | Redesign |
|---|---|---|
| W1 · at a place used before | 4 (+ scroll) | **3**: Log item, shutter, Save · Hall table (the photo shows the table) |
| W2 · into a box already logged | 5 + close the keyboard | **4**: …shutter on the box, "Your wooden box?" Yes, Save |
| W3 · into a new box, and its place | 14 + 2 typed, no shelf photo | **5, nothing typed**: shutter the key, the tin, the shelf, Save |
| W4 · log now | 4 | **3**: Save · no place yet |
| W4 · put away later (1 thing) | 4, a new place typed | **4**, a new place photographed |
| W5 · give a box its place | 4 + typing, via Edit | **3** from its card |

**What goes away:**
- the mode row and Several (Q3);
- the photo card as a required step (tap the thing's chip on the camera to rename it, add a photo, or change private);
- the "In something" sheet;
- "What is it in?";
- the "Where is it now?" list (it survives only behind **More**, with search and typing, as the fallback);
- the "Put things in it" name guess;
- the toast after saving, replaced by a card showing the saved chain with Undo.

**What stays:**
- One photo is one thing (Q3), and "Detect other items" comes later on the thing's chip.
- Nothing is assumed: a recognised box is asked about ("Your wooden box?"), never merged silently.
- Private by default, told on the camera with the lock on the key's chip.
- "Type it" stays for things that can't be photographed.

## Board positions

- **Maya (PM):** The redesign is what your Q1 ruling already said, carried one step further: the place can be *inside* something, so step back again. Recommends it.
- **Devin (design):** Layout **A**. The Save button never moves, the chain photos sit where her eyes already are, and B covers a third of the viewfinder.
  - After Save, go Home with the confirmation card.
  - **Next** keeps the camera open for sweeps and packing a box.
- **Noor (design):** There's no user-facing difference between "a box" and "a place". Both are photos in the chain. The words stay Can see / Can help / Only me.
  - The prompts must be at least 19 px and high contrast on any photo.
  - The chain photos are 84 px.
- **Priyanka (engineer):** The camera already stays live between shots, so this is mostly a new overlay on the existing Camera.
  - Each "where" photo costs one AI call (name it, and "is it one we know?"), which reuses the visual check we already have and stays inside the daily limits.
  - The AI takes 3–8 s. The chip shows the photo at once, and Save works before the name arrives (named in the background, as today).
  - Watch out: "Save · no place yet" as the resting state could make people save without a place by reflex. **Measure it** in the one-user test.
- **Sam (architect):** No model change: edges stay the same.
  - A "where" photo becomes a **thing** if it's something that moves (tin, box, bag) or a **place with a photo** if it's fixed (shelf, drawer, closet, counter). Place docs already hold photos.
  - The AI makes the call; a wrong call is harmless because both show the same way, and the card can fix it.
  - Undo removes the log *and* any box or place created in it.
  - Native mirrors the same screen.
- **Margaret (78):** "I point, it listens. But don't make me photograph the kitchen counter every time." → The photo of the thing usually shows the counter, so Save already says it (W1, 3 taps). The chips are there too.
- **Linda (storage unit):** "Unit 214, Box 14, the blue bag: three shots. Yes."
- **Robert (garage):** Packing a bin: shoot, Next, shoot, Next.
- **Dr Kim (tremor):** Mostly the shutter and one big Save. The Yes / No pills must be at least 44 px.

## Rulings needed

1. **Direction.** Photo-first "where" on the camera: step back to build the chain, and the Save button names the place. **The board recommends it.**
2. **Layout.** A (Save bar, the chain on the photo; board) or B (one answer card)?
3. **After Save.** Go Home with the confirmation card and Undo, with **Next** to keep shooting (board). Or stay in the camera?
4. **Retire.** The mode row and Several; the photo card as a required step; the In-something sheet; the place lists (kept only behind More). Agreed?
5. **Put away later** starts from the same camera ("Where are they going?"), then tap each thing. Agreed?
6. **Two bugs now.** The board recommends fixing both in the next build whatever else is decided:
   - #10: a shared word or number must never make a match that moves something; it goes to the visual check.
   - #29: the sheet runs off the edge.

After your rulings, the build order will be:
1. The two bugs.
2. The where-camera (steps 2 and 3, the chain, the named Save, chips).
3. Places with photos and recognition.
4. The confirmation card and the Find trail.
5. Put away from the camera.
6. Retire the old sheets.

Each step gets its audit, and you see screenshots of every step (the same walk, re-run) before anything is pushed.

---

## Round 2 (Ravi, 09-27): buttons, the Save sentence, A and B both

Ravi agreed:
- photo-first "where";
- rulings 3, 4 and 5;
- ruling 6 is OK.

All of it is **contingent on seeing the fix**. He also raised four points.

1. **"Cancel" and the "Log item" title looked alike**, so both read as buttons, and buttons of similar function should sit together.
2. He likes **B slightly more, and wants both A and B pickable in Settings**.
3. **Where Cancel, Save and Next go.** He laid out three groupings to debate:
   - Next with Cancel: both are item transitions.
   - Cancel with Save: both are about this item.
   - All three together, which is confusing because you can't save and go next at once.
4. **Sentences inside buttons wrap badly all over the product.** Should the button just say "Save", with the operation in smaller text beside it?

Pages:
- `mockups/S9b_buttons.jpg`: the four groupings, all in B at the last step of the example.
- `mockups/S9b_both.jpg`: the fix in A and B, plus the helper case, Settings and Put away.

**1 · Cancel vs. the title.**
- Cancel is now a real button: a pill with ✕, top-left.
- The camera has **no title**; the numbered step prompt says what is happening.
- When helping, whose ReCall shows top-right as a **label** in the helper colour, not a button.

**3 · The grouping: the board's position, and where it disagrees with you.**
- **Group by what happens to the photos.** Cancel throws them away. It stands alone, top-left (every iPhone sheet puts it there), away from the thumb.
- **The two ways to keep them sit together at the bottom:** **Save + next** and **Save**. Naming it "Save + next" rather than "Next" says it saves, which removes the either/or confusion in your third option. It also answers the question in your first: does "Next" keep this item? Yes.
- **The shutter stands alone.** It only takes photos.
- **Capture alternatives sit around the shutter:** "Type it" and the place chips are other ways to capture.

The board **agrees** Next is an item decision. It **disagrees** with putting it next to Cancel, or putting Cancel next to Save. A button that throws work away must not touch one that keeps it:
- a hurried thumb, or Dr Kim's tremor, loses the key;
- in a sweep, "Next" at the top is out of reach of the thumb on the shutter.

**4 · Sentences out of buttons: agreed, and it's product-wide.**
- A button says **one verb**: Save, Save + next, Put away.
- What it applies to is a **two-line sentence directly above it**:
  - line 1 (bold) is where: "In the blue tin";
  - line 2 is what that is in: "on the linen closet shelf".
- Each line is cut short with "…" rather than wrapped. The pencil beside it changes it.
- This replaces Q2's "Save · Hall table". The place is still read at the moment of saving, one line above the button.
- The same treatment goes to every sentence-button in the code:
  - "Put {n} in the {box}", "Put away at {place}", "Put things in {box}";
  - "Pick what goes there" (an instruction used as a label);
  - "Add it to {name} anyway";
  - "Save without a place";
  - "New: {typed}";
  - "Log item · in {name}'s ReCall".

  Short answers to a question ("Yes, the same thing") stay as they are.

**2 · A and B both, in Settings → Look → The camera.**
- Pick by picture: **Photo clear** (A) or **Answer card** (B). Default **B**, per Ravi's lean.
- It lives in Look, not Experimentation, because it stays.
- **Priyanka:** both styles share every part (the chain, the sentence, the buttons, the chips); only the arrangement differs, so the audits run on both.
- **B's cost, seen in the render:** at step 2 the card covers the lower third of the viewfinder while she aims at the tin.

**Rulings needed (round 2):**
1. Is the grouping right: Cancel alone top-left, Save + next beside Save, the shutter alone?
2. Is the label "Save + next" right?
3. One verb per button, with the two-line sentence above it: app-wide?
4. Default B?

After that the build order from round 1 stands. The first build carries:
- the two bugs;
- the new camera in both styles;
- the button rule.

Every step of the walk is re-run and shown to you before anything is pushed.

**Translucency (Ravi, 09-27): every overlay on the camera screen is at least slightly see-through.** Frosted panels let the photo show through behind every overlay, and text stays readable:

| Overlay | Opacity | Blur |
|---|---|---|
| The answer card | 86% | 14 px |
| The step prompt | 50% black | 10 px |
| "Your wooden box?" | 86% | 14 px |
| The Put away sheet | 90% | 16 px |
| The dim behind the sheet | 30% | — |
| The chain photos | 93%, with a softened border | — |

This becomes a rule for the camera in the design notes.

---

## Round 3 (Ravi, 09-27): chain, buttons beside the shutter, icons, preview

Page: `mockups/S9c_round3.jpg`. **Ruled: B is the default.** A stays pickable in Settings → Look.

**The chain (A):**
- The photos line up: every name gets the same two-line space, so a wrapped name no longer pushes its square down.
- "in" is a see-through pill.
- A deeper chain scrolls sideways; a fade and an arrow show there is more.

**Save beside the shutter (A and B):**
- **Save + next** sits on the left of the shutter and **Save** on the right, in space that was wasted.
- **Save has its own icon**, and in "+ Next" the icon stands in for the word.
- In B the card no longer holds the buttons, so it covers less of the photo.

**One meaning per icon:**
- The camera icon means "take a photo" and nothing else (Log item, Add photo, the shutter).
- The empty "where" square gets a **pin with a ?**, not a camera.
- The pencil means change or type.

**B scrolls too (Ravi, mid-round):** when the chain is deeper than the card, B's thumbnails scroll sideways the same way (fade + arrow): baseball card → wooden box → memorabilia box → storage unit.

**The preview:** tapping any photo in the chain (A or B) opens it half-screen, centred, with its name and where it is. Tapping anywhere closes it.

**Board notes for Ravi (disagree if you like):**
- **"Type it" moved** from the left of the shutter to a pill above it ("Type it instead"), shown only before the first photo. Otherwise the same spot would mean "Type it" at step 1 and "Save + next" at step 2, and a thumb that learned one would press the other.
- **The Save icon is a floppy disk.** It's the one icon nearly everyone reads as "save", even people who never used one. The alternative is the check mark.
- **Saves now sit 12 px from the shutter.** A slip while aiming at the tin would save with "no place yet". Undo on the Home card fixes that in one tap, and the Save buttons only appear after the first photo.

**Rulings needed (round 3):**
1. Is the floppy-disk Save icon right, or should it be the check mark?
2. Does "Type it instead" belong above the shutter?
3. Do the earlier round 2 points still stand: Cancel alone top-left, and one verb per button with the two-line sentence, app-wide?

**Shutter spacing (Ravi, 09-27):** should the side buttons be narrower so a thumb aimed at the shutter doesn't hit them? Yes.

The board's version (`mockups/S9c_shutter_gap.jpg`):
- **Narrower buttons:** each is 119 px wide instead of 132.
- **A wider gap:** 27 px of clear space on each side of the shutter, up from 12 px. The gap is what prevents slips.
- **A bigger shutter target:** the shutter answers taps anywhere in a 100 px circle, larger than its 74 px drawn size. That circle never overlaps the buttons.
- **The labels still fit:** "+ Next" and "Save" fit at 17 px, and each button stays 56 px tall (well above the 44 px minimum).

**Ruled (Ravi, 09-27):**
- "Type it instead" sits above the shutter.
- Cancel sits alone, top-left.
- One verb per button, with the two-line sentence above it, across the whole app.
- The shutter spacing: 119 px buttons, a 27 px gap, and a 100 px shutter target.

**The Save icon: "what is the modern solution, fail-safe for older users?"** Three options are drawn in `mockups/S9c_save_icon.jpg`:
1. **Floppy disk.** People still recognise it, but it's a 1990s object that Apple no longer uses.
2. **Check mark, and "✓ + Next".** This is the modern choice: in iOS 26 Apple's own apps replaced the "Done" button with a large check mark. But critics note that an icon standing in for a word makes people stop and decode it.
3. **Check mark plus words (the board's pick).**
   - The right button reads "✓ Save".
   - The left button says **"Save + next"** in words.

   "Save" is written on both buttons, and the check is extra help, never the only clue. For older users the safe rule is that no button relies on an icon alone. Both labels fit in 119 px.
