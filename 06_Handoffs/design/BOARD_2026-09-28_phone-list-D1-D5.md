# Board: Ravi's phone list, the design items D1–D5 (2026-09-28)

These are the five design changes from Ravi's 09-28 phone list (OPEN_ITEMS). The four bugs, B1–B4, shipped
separately in `20260928c`.

Each option is drawn from the real stylesheet. Where there is a "Today" panel, it is a live capture of
`20260928c` in the rig:

- `mockups/D1_add-photo.jpg`
- `mockups/D2_viewer.jpg`
- `mockups/D3_captions.jpg`
- `mockups/D4_where-card.jpg`
- `mockups/D5_place-list.jpg`

The generator is `rig/gen_d.py` → `render_d.js` → `compose_d.py`, with the Today captures from `capture_today.js`.
**No app code has changed. This waits for Ravi's picks.**

## D1: a visible way to add a photo

- **A:** an "Add photo" pill on the caption line, right-aligned. This is Ravi's proposal.
- **B:** a dashed "+ Add photo" square at the end of the photo strip.

**Positions:**
- Devin, Maya and Priyanka are for **A**. It is always in view and needs one tap. B's square scrolls away once
  there are two photos, and it covers the edge of the photo.
- Noor liked B's look, but conceded that dashed lines read as "unfinished" (Ravi's own critique in D5).
- **Lean: A.**
- A drawing inconsistency: frames A and B dropped the two switches from the list below the photo. That is a
  drawing shortcut, not a proposal. The list is unchanged.

## D2: the photo viewer

- **A:** a star icon alone, top-left. This is Ravi's proposal.
- **B:** a labelled "★ Main photo" / "☆ Make main" pill and a "Remove" pill. The same viewer opens from the
  place photo in *Where it is*, where it swipes through that place's photos.

**Positions:**
- The board recommends **B** because of Ravi's own rule from 09-27: *no button relies on an icon alone*.
  - Sunil (low vision) and Frank read the bare star as decoration.
  - Dr Kim: "Make main" says what will happen.
- Tomás: a Remove in the viewer means the trash icon on the photo can go later. That is not part of this change.
- **Lean: B.**

## D3: captions

- **A:** one caption per photo. It changes as you swipe and can be edited in the viewer. Each added photo gets
  its own caption from the AI.
- **B:** one note per thing, edited in the Rename sheet ("What is it?" + "Anything to note?").

**For A:**
- Maya, Noor and June: the caption says *where the photo was* ("on the orange carpet"), which is information
  for finding the thing.
- A photo-specific caption can never go stale, which removes the cause of B2 rather than patching it.

**Against A:**
- Priyanka: one more AI call per added photo. This stays inside today's daily limits, and the caption fills
  in a few seconds after the photo.
- Sam: a small new field on each photo. No migration is needed, because old photos simply have no caption.

**For B:**
- Devin: one place to edit, and simpler to explain.
- Margaret would use a note ("the spare is in the car").

**Lean: A**, with B's free-text note kept as a later, separate idea.

## D4: the camera's where-card when the AI thinks it knows the place

- **A:** Ravi's layout. The pills sit inside the card, above "📍 Your desk drawer?"; the pin is amber and starts
  the line. There is no separate place line. Tapping a pill replaces the question with the chosen place.
- **B:** the merged version. There is no Yes/No; the AI's guess is simply the pre-selected pill ("looks like"),
  and another tap changes it.

**For B:** Devin and Dr Kim. One fewer decision, and B can't strand anyone in an unanswered ask.

**For A:**
- Maya and Sam: the explicit Yes keeps the rule from 09-27 that recognition is confirmed, never silent.
- Tomás, speaking for Frank, in Ravi's exact case: the AI wrongly guessed *Desk drawer* for the white box. With
  B, a hurried Save files the lint roller in the desk drawer without a question.

**Lean: A.** Board split: Devin and Dr Kim for B.

## D5: the ••• list

Both options change the wording:
- "Search your places".
- The heading becomes "YOUR PLACES · N", marking these as places already added.
- One list for everything. A thing that moves shows "a box · in Garage" underneath.

The two options differ only in the new-place entry:
- **A:** a solid, rounded "📷 Photograph a new place" button (tinted, no dashes).
- **B:** the first list row: a camera tile with "New place: take its photo".

**Positions:**
- Devin: **A**. The main way to make a place deserves a button; a row reads like an existing place called
  "New place".
- Noor: B, since a list row matches the rows around it.
- **Lean: A.**

**Places vs boxes (Ravi's question).** The user sees one word, **places**. A box is a place that can move.
- The AI guesses which it is when it's photographed.
- "It holds things" on a thing's page remains the manual switch.
- No sub-types (drawers, cupboards and so on). That is the rabbit hole Ravi named.
