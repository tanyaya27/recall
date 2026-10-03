# One where, photo first — the boards on Ravi's 10-02 report · for Ravi and Tanya to decide

**Why.** Release 1 (`20261001a`) saved "where" twice: her words and the In chip, with no rule between them. Ravi moved the
brochure by typing "on my lab desk". The In stayed "Workbench or desk", the page showed both, and Find answered the
old place (walk W1–W3, `WALK_2026-10-02_release1.md`). His four expectations: (R1) what he gives as the new where
replaces the old; (R2) he's offered a photo of the new place; (R3) the page shows one where; (R4) tapping the where
edits every level, and the next level appears under the last one set.

**Fixed rule from Ravi (10-02):** "this is a photo-first app. Typing should be augmentation of the photo(s)."

Screens: `mockups/OPTIONS_2026-10-02_one-where.jpg`.

## What both options share
- **One where per item: the In link.** It is what the page shows and what Find answers. Nothing else is ever a where.
- **Typing never makes a second where.** Words are either a place's name (typed into the place search) or a **note**
  ("behind the detergent"). The note sits under the photo, in small type. Find searches notes but never answers
  "where" from one.
- **A new where replaces the old at once.** The chip shows the new one. "Was: Workbench or desk" shows until Save,
  and Undo works afterwards.
- **Levels (R4):** tapping the where opens one sheet with every level stacked, outward. Each level can be changed, and
  "+ What is the Lab desk in?" appears only under the last level set. This replaces both today's single-level list and
  "go to that place's own page".
- **Item page and Find:** one where, with the place's photo, its chain ("Lab desk · in Office"), and when it was moved.
  The note goes under it. One "Move it" button.
- **Old data (Sam):** a words-only item with no link keeps showing her words as its where, because no link means no
  conflict. Once a place is set, older words stay in the history, not on the page.

## The choice
- **A — Pick or type the place.** After the item's photo comes one row, "Where is it?". Typing searches her places in
  place: "lab desk" offers "+ New place: Lab desk" first, then any match. A tap sets it. A new place then asks
  "Photograph the Lab desk?" (Take its photo / Not now). "+ Add a note" is separate and closed by default.
- **B — Photograph the place.** After the item's photo, the shutter's next job is "Now photograph where it is". Then
  comes "Which place is this?": her places as photos, recent first, and "New place" with a name field (typed or
  said). A known place can be tapped without taking a new photo ("Skip — pick from your places"). The place photo goes
  on the place and on this sighting.

## Build board
- **Maya (PM):** A ships fastest and fixes R1, R3 and R4. B is what the product promises and what R2 asks for. B's
  cost is a second photo on every log, and logging speed is measured from reaching for the phone. *Wants:* B, with
  the place photo skippable for a known place.
- **Devin (design):** A's box takes a place name, not a sentence. If she types "behind the detergent on the dryer
  shelf", A has to guess which part is the place, which is W5 again (two "New place" buttons). So in A the box is
  labelled "Which place?" and takes names only. In B the photo answers "where" with no decision. Count of decisions:
  B is two shutters and one tap; A is one tap, typing and one pick. Margaret will recognise a photo of the place
  before she recalls its name. *Wants:* B.
- **Priyanka (engineer):** A is about a day: InList inline, words become a note, the same saveChain. B is about two
  days: a second camera step, then the place photo on `place.photos` and on the sighting. *Objection to B:* the c–f
  bugs came from a photo on a level ("This photo is…"). B must never let a place photo change anything until she
  taps a place, and there's no AI matching in this release. *Objection to both:* the levels sheet is the old tier
  editor in a new coat. It has to stay one list, outward only, with no squares.
- **Sam (architect):** the store already has what's needed: one open edge is the where; a note is a field on the
  history entry; place photos already exist. No migration. *Objection:* words-only items keep words as their where,
  which is a small second path. It's acceptable only because it applies when there's no link at all.

## End-user board
- **Margaret:** "I'd point it at the table. Typing 'lab desk' is a test." She prefers B. *Risk:* she forgets the
  second photo, so the shutter itself has to ask for it, in words, every time.
- **Robert (retention):** Move has to be fast. With B a known place costs one tap on its photo, and he won't retake
  it. He's fine with either as long as Skip is one tap.
- **Priya (remote):** "From 2,000 miles a photo of the place tells me more than a name." She prefers B.
- **Occupational therapist (clinical):** recognition beats recall for memory loss, and a place photo is the stronger
  cue. Supports B, and photo-first is right.

## Still split (for Tanya)
1. **A or B.** Devin, Maya, Margaret, Priya and the OT prefer B. Priyanka prefers A (half the work, fewer ways to
   fail). Robert is neutral. *Claude:* B. It's photo-first, it answers R2, and A's box still invites sentences.
2. **In B, does a known place ask for a new photo every time?** Maya and Robert: no, skippable. Devin: yes, as the
   default, because a fresh photo shows how the place looks today. *Claude:* the place photo is the default step,
   and Skip is one tap.
3. **A new place in B with no photo taken** (she skipped): ask once, "Photograph the Lab desk?", or never? *Claude:*
   ask once, on the card after Save.

---

## Round 2 — Ravi chose A (10-02), with four changes · screens `mockups/OPTIONS_2026-10-02_one-where-A2.jpg`

What Ravi said:
1. On screen 2 it wasn't clear that "lab desk" can become a new place in her list, that the new place can have a
   different name, or that she can pick an existing place below.
2. **Order doesn't matter: type first or photograph first.** With an existing place selected, photos add to that
   place's photos. With a new place, photos are the new place's, and **ReCall's guess shows in a translucent box on
   the photo**. It can replace what she typed or be appended to it, and fills the box if she hasn't typed anything.
3. Screen 4 said "tap the chip", but screen 3 showed no chip.

As drawn:
- **The place row** (amber, with a ›) is the where. Tapping it opens the levels (frames 1 and 6). "Chip" is gone from
  the captions. "Somewhere else? Type or say the place" sits under it.
- **A strip over the shutter says where photos go:** "📷 Photos go to Workbench or desk", or "… Lab desk (new)".
- **Typing opens two labelled parts:** ADD A NEW PLACE (the name, editable, and "＋ Add 'Lab desk' to my places") and
  OR PICK ONE OF YOUR PLACES (matches first, then all 15).
- **A new place replaces the old one at once:** "Was: ~~Workbench or desk~~ · Undo".
- **ReCall's guess, on a photo of a new place:** "ReCall thinks this is *Lab bench with a laptop*", with *Use this*,
  *Add to "Lab desk"* and *✕ Keep "Lab desk"*.

Build board:
- **Sam:** the photos stay on the camera until Save and go to the place shown **at Save**. That way the order really
  doesn't matter: photograph, then change the place, and they follow. No new data. A place's photos already exist,
  and this move's photo also goes on the item's history as "where it was".
- **Priyanka:** *objection.* This puts the AI back on the camera. The 10-01 boards kept it off until two clean tester
  rounds, because a late answer acting on the wrong thing caused build f's worst bugs. Her conditions:
  - the guess belongs to the photo it came from;
  - it's dropped if she deletes that photo, switches place, or Cancels;
  - it **never** overwrites typed text without a tap;
  - nothing waits for it, so Save works with or without it.
  About a day more than A.
- **Devin:** *objection to the empty-box fill.* Tanya's 10-01 ruling was "chips she taps, never typed for her". If the
  guess fills an empty name, it should look like a guess ("ReCall's guess · tap to change", in italics) until Save,
  not like her words. *Objection to "Add to":* appending gives "Lab desk lab bench with a laptop" as a place name.
  He'd store the guess as the place's description instead. Ravi asked for it, so it's drawn.
- **Maya:** sending photos of her home to the AI service was a release-2 gate (a privacy statement and switches
  first). This pulls that gate forward. Ship the statement with it, or leave the guess out of this build and add it
  next.

End-user board:
- **Margaret:** "I like that it says where my photos go." The "Use this / Add to" box is one more decision, but she
  can ignore it and Save.
- **Robert:** "+1 photo for the Workbench or desk" with no question is what he wants.
- **Priya:** wants the privacy line before her mother's photos go anywhere.

Still open (for Tanya and Ravi):
1. **The AI guess in this build or the next?** *Claude:* the next. Ship one where now (frames 1–4, 6, 7). The guess
   (frame 5) follows with the privacy statement and Priyanka's conditions as checks.
2. **An empty name filled by the guess:** as Ravi said (it fills the box), or shown as a marked guess until Save?
   *Claude:* the marked guess.
3. **"Add to":** append to the name, or keep the guess as the place's description? *Claude:* the description.
4. **Log item (a new item):** the first photos are the item's. When does the shutter switch to the place?
   *Claude:* when she sets or types a place. The strip says so, and tapping the item's photo at the top points the
   shutter back to the item.

---

## Round 3 — Ravi (10-02): type on the camera, → for the rest, each name once · `mockups/OPTIONS_2026-10-02_one-where-A3.jpg`

What Ravi said about round 2:
- A sheet that opens on the first typed letter is weird. Typing should stay on the camera, so she can photograph the
  new place right after typing, and ReCall's guess comes then. A **→** button at the right of the box opens the
  sheet, to refine the text or pick another place.
- On the sheet, "lab desk" appeared three times. Merge the first two.

As drawn:
- **One field on the camera, "Where is it now?".** It starts as where the item is now, with that place's photo and a →
  (frame 1). She types over it. Typing stays on the camera, and a line under the field says what will happen:
  - a new name is a NEW place, added on Save, and shows "Was: Workbench or desk";
  - "2 of your places have 'desk' — → to see them" (frame 2).
- **A name she already has links to that place** ("One of your places · 1 item"). Nothing new is made (frame 5).
- **The shutter photographs the place in the field.** ReCall's guess sits on the photo with *Use this · Add to mine ·
  ✕ Not this* (frame 3). The place's name is not repeated in the buttons.
- **→ opens one sheet** (frame 4): the name **once** (✎ to edit), "which is in" with ＋ under the last level, and
  "Or pick one of your places instead". The › on the place row from round 2 is gone; → does both jobs.

Build board:
- **Devin:** typing over a place's name could read as renaming it. The line under the field must say "NEW place …
  Was: Workbench or desk" the moment she types. A real rename lives on the place's own page. The first tap in the
  field selects all of its text, so typing replaces it.
- **Priyanka:** only an exact name (ignoring case and "the/my") links to a place she has. Anything else is new, plus
  the "→ to see them" line. No fuzzy match ever links by itself.
- **Sam:** no data change from round 2.
- **Margaret:** "One box. I can do that."
- **Robert:** opening Move it and pressing Save without changing anything should do nothing. Save stays off until
  something changes (kept).

Open items 1–4 from round 2 still stand.

---

## Round 4 — Ravi's corrections (10-02) · `mockups/OPTIONS_2026-10-02_one-where-A4.jpg`

- **At rest:** the header reads "Where is it now? *(type to set new place)*", with the bracket in amber italics. The
  field has a solid border and there is no text under it.
- **Once she taps into the field:** the border turns **dashed**, meaning "about to change the place". The header
  becomes "Set NEW place. *(previously was: Workbench or desk)*", with the bracket in grey italics. For a name she
  already has, it reads "Set place. *(previously was: …)*". The border stays dashed until Save or Cancel.
- **ReCall's guess:** *Use this · Append to mine · ✕ Not this*. Appending joins with " · ", giving "Lab desk · Lab
  bench with a laptop".
- **Icons:** Lucide (`lucide-static`) — x, save, camera, plus, map-pin, arrow-right, pencil, check, chevron-left.
- **Kept, not ruled on:** "2 of your places have 'desk' — → to see them" under the field while she types (frame 2).
  It's the only line left under the field, and it's the only way she learns that a match exists.
