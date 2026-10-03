# Usability pass 1 on `20261002a` — the boards · for Ravi and Tanya to decide

**Design only. No code until a few passes are agreed.** Screens: `mockups/OPTIONS_2026-10-03_usability-1.jpg`.

Ravi's first set (10-03), on the live build:
- **U1.** Home doesn't show which items have no place.
- **U2.** The item page's Where box doesn't read like English ("in" a desk; "in" instead of "which is in"). Wants a
  pill per preposition, maybe each place on its own line starting with its pill. This box gets its own UX board.
- **U3.** Move it: "Add a note" is hard to leave. Cancel exits all of Move it. It should be a modal with its own
  Cancel, with nothing else reachable. The place field has the same problem. While editing it, other controls are
  easy to hit, and "Photos go to" shows the old place until a letter is typed.
- **U4.** The → sheet: "which is in" ignores on/in. No level below the top can be removed. Change and Delete should be
  stacked text buttons that are hard to hit by mistake. "Take it out of the Lab desk" acted with no warning. A place
  that doesn't exist yet can't be made here; she can only pick from the list.
- **U5 (Ravi, later the same day).** She should be able to tap ReCall's guess and fix its words before using them, so
  "Lab desk with electronics and water bottle" becomes "Lab desk with electronics".

## What's drawn
- **H1 / H2: Home.** An item with no place gets an amber circle with Lucide `map-pin-off`, at the top right (H1) or
  the top left (H2). Nothing else changes.
- **W1–W4: the Where box.** All four show the first level's photo, one where, "Moved today 6:52 PM" and Move it.
  - **W1:** one line per level, each starting with its pill: `on` Lab desk… / `which is in` Craft room /
    `which is in` Bedroom.
  - **W2:** one sentence: "It's `on` the Lab desk…, `which is in` the Craft room, `which is in` the Bedroom."
  - **W3:** a stacked path. Each level has its own small photo, and the pills sit on a dashed connector.
  - **W4:** tapping a pill opens on / in / under / behind / next to. "ReCall guessed 'on' because it's a desk." It
    changes only the words.
- **E1–E4: Move it, editing as a modal.**
  - **E1:** tapping the place opens a sheet over a dimmed camera. The shutter, Save and the camera's Cancel can't be
    reached. It has the field with its text selected, the list of her places, and its own **Cancel** (puts everything
    back as it was) and **Done**, above the keyboard. The hint reads "Nothing changes until Done".
  - **E2:** typing changes the header to "Set NEW place. *(previously was: …)*". "+ Add 'Lab' as a new place" is
    first, then matches.
  - **E3:** "Add a note" uses the same modal: one box and Cancel / Done.
  - **E4:** after Done, the camera comes back with the field showing "Lab" (dashed: changed, not saved), "Note: … ·
    Edit", and the strip "Photos go to Lab (new)". The strip only changes on Done, so it is never stale.
- **S1–S4: the → sheet.**
  - **S1:** "It's `on`" heads the list. Each level is a card with two **stacked text buttons** on the right. Level 1
    has *Change* and *Take it out*. Every level below it has *Change* and *Remove*. The connectors carry their pills
    (`which is in`), and the pills are tappable here (W4's picker).
  - **S2:** Remove asks first: "Remove the Craft room? The Lab desk will no longer be in the Craft room. It will be in
    the Bedroom." If the place holds other things: "This changes it for everything on the Lab desk (2 items)." The
    buttons are *Keep it* and *Remove*.
  - **S3:** Take it out asks first: "Take it out of the Lab desk? The brochure will have no place. It will show with
    the pin-off icon on Home until you put it somewhere." The buttons are *Keep it there* and *Take it out*.
  - **S4:** Change or + opens "What is the Bathroom in?" with a search box. "+ Add 'Upstairs' as a new place" is
    first, then her places that match, then all her places.

- **G1–G2: ReCall's guess can be fixed first.**
  - **G1:** the guess on the camera now looks like a field (italic, with a pencil): "Tap the words to fix them
    first." The buttons are *Use this · Append · ✕ Not this*. "Append to mine" is now just "Append" (Ravi, 10-02).
  - **G2:** tapping the words opens the same kind of modal as E1–E3, titled "Fix ReCall's words", with the cursor at
    the end. Under the field: "ReCall said: … ~~and water bottle~~". The buttons are Cancel, Append and Use
    this; Append is shown only if she has typed something. Use this and Append use her fixed words. Append still
    doesn't repeat what she typed.

- **T1–T3: pick a word like a text reaction (Ravi, 10-02 late).** Tapping a pill pops a bar above it, like
  tapbacks on a text message: on · in · under · behind · next to, with the current word lit. One tap picks a word
  and closes the bar. Tapping anywhere else closes it with no change, and the rest of the page dims while it's open.
  - **T2:** after a pick, a toast reads "Now 'under the Lab desk' · Undo".
  - **T3:** on a lower level, the bar says who else it changes ("For everything in the Craft room · 3 items"), because
    that word is shared.
  This replaces W4's sheet, and it works the same way in the → sheet.

## Build board (Maya PM, Devin design, Priyanka engineer, Sam architect)
- **Sam:** the preposition is a word on the link, so the edge gets an optional `prep` field. The item's own link
  holds "on the Lab desk". The place's link holds "the Craft room is in the Bedroom", and that one is **shared**:
  changing it changes it for every item on that place, so the picker on a lower level must say so. When `prep` is
  missing, it's inferred at display time from the name: desk, table, shelf, counter, bench, bed, floor, windowsill or
  top give "on", and everything else gives "in". When she typed "on my lab desk", the "on" that `bareWhere` already
  strips is kept as `prep`. No migration, and Find answers with the same words.
- **Sam, on Remove (S2):** there are two meanings. **Splice:** the Lab desk is now in the Bedroom. **Cut:** the Lab
  desk is in nothing. Splice keeps what she knows and is what "remove the Craft room from this list" means. Cut loses
  the Bedroom. *Wants:* splice. Nothing hits the store until Save, and Save's Undo covers it.
- **Priyanka:** the modal fixes a whole class of bugs. The camera's focus, dashed and strip states move into one
  sheet with one Cancel. *Objection:* that sheet (E1) and the → sheet (S1) are now two sheets with a place list each.
  She'd keep them apart: the modal edits the first level's name, and → edits the levels. Merging them puts the level
  editor in front of every rename. Rough cost: badge ~1 h; W1 with prep ~½ day; the modals ~1 day; the → sheet with
  Remove, confirms and new place ~1 day. Each gets failing checks first.
- **Devin:** *conflict with round 3.* Ravi asked then for typing to stay on the camera, so she could photograph right
  after typing. The modal costs one tap (Done) before the shutter. He thinks that's worth it: the slip-proofing is
  what Ravi asked for now, and Enter = Done. **Two text buttons stacked** need at least 44 pt each and an 8 pt gap,
  with the destructive one in red text and on the bottom. Margaret's thumb lands on the top one, which is the safe
  one.
- **Priyanka, on G2:** her fixed words are hers, not a guess. Once she edits, the guess is never re-asked or replaced
  for that photo, and Not this still drops it. Rough cost ½ day, inside the modal work.
- **Devin, on G2:** the strike-through under the field shows what she removed, so she can't lose ReCall's words by
  accident. Cancel restores them.
- **Sam, on G2:** this fixes the guess **before** a place is made. A place already saved with a long guessed name (her
  "Lab desk with electronics and water") needs **Rename**, which today lives on the place's own page. *Suggests:*
  tapping the name on a level card in the → sheet (S1) renames it, with a pencil next to the name. It isn't drawn
  yet.
- **Maya:** U1 and U4's silent "Take it out" are the cheapest wins and the scariest bugs. Ship those two first,
  whatever the Where-box choice is.

## UX board on the Where box (U2) — Devin, an outside senior mobile designer, an accessibility specialist, Margaret, the OT
- **Senior mobile designer:** W2 reads best as English but breaks as a layout. Pills mid-sentence wrap badly with
  long names (see the "the / Bedroom." orphan), and you can't scan it. W1 is the pattern people know from addresses
  and breadcrumbs: one fact per line, read top-down from closest to widest. W3 is the richest, but it's tall and
  pushes Move it below the fold on a small phone. *Wants:* W1.
- **Accessibility specialist:** the pills are low-contrast, small text. On the item page they must be words, not
  buttons. A screen reader should read the box as one sentence (W2's text), whatever the layout. Tappable pills on
  a read-only page (W4) are an accidental-edit trap, and Ravi named that class of problem in U3/U4. *Wants:* W1 for
  the eye, W2's sentence for the ear, and pills tappable **only** in the → sheet.
- **OT (clinical):** recognition beats recall. A photo per level (W3) helps when "Craft room" doesn't ring a bell,
  but the first level's photo carries most of that. *Accepts* W1 if a level without a photo shows the pin and a level
  with one shows a thumbnail.
- **Margaret:** "On the lab desk, in the craft room, in the bedroom. That's how I'd say it." She reads W1 fastest. W2
  "looks like a paragraph I have to read."
- **Devin:** W1, with W3's small thumbnail per lower level when that place has a photo. W4's picker lives in the →
  sheet only.

## For Tanya and Ravi to decide
1. **Home badge: top right (H1) or top left (H2)?** *Claude:* top right. Top left is where the eye starts, so it
   would make every un-placed item shout.
2. **Where box: W1, W2 or W3?** Both boards and Margaret prefer W1, with the OT's thumbnails per level. *Claude:* W1
   plus thumbnails, with W2's sentence read aloud.
3. **Changing the preposition: Ravi's tapback bar (T1–T3) instead of W4's sheet.** *Claude:* yes, on the item page
   and in the → sheet. Nothing changes until she taps a word, and Undo covers a mis-tap. That answers the
   accessibility specialist's worry, as long as each word in the bar is at least 44 pt and the screen reader treats
   the pill as a button ("on, change"). *Still open:* should lower levels (shared, T3) be changeable from the item
   page, or only from the → sheet? *Claude:* both, with T3's line.
4. **Prepositions offered:** on, in, under, behind, next to. Is anything missing?
5. **Two sheets or one?** The place modal (E1) for the first level's name, and → (S1) for all levels. *Claude:* two,
   as Priyanka says.
6. **Remove a middle level:** splice (S2) or cut? *Claude:* splice, always with the confirm.
7. **The modal costs one tap before the shutter** (it reverses round 3's "typing on the camera"). Is that OK?
8. **The guess: fix it in a modal (G2), or edit it in place on the camera?** *Claude:* the modal, the same as the
   place field and the note (U3).
9. **Rename a saved place from the → sheet** (tap its name), as Sam suggests? *Claude:* yes. I'll draw it next pass
   if you agree.

---

## Ruled (10-02, Tanya)
- **Home badge: top left (H2).** This isn't Claude's pick (top right); Tanya's call stands.
- **Where box: W3, the first level only.** One row shows the first level's photo, its pill and its name. Under it,
  "↳ What the Lab desk is in · 2 more ⌄" opens the rest of the path, and "Show less" closes it (X1, X2). With no
  second level, the row isn't shown. W1, W2 and W4's sheet are dropped. The pills use the tapback bar (T1–T3).
- **Words: on, in, under, behind, next to (Tanya).** Add more only if feedback asks for them, because too many is
  its own problem. The bar is **context-aware**: it shows only the words that fit the place, with the likeliest
  first.
  - A desk, table, shelf or counter offers on, under, behind and next to.
  - A box, drawer, bag or cupboard offers in, on and next to.
  - Room to room offers only in, so no bar.
  - When ReCall can't tell, it offers all five.
- **Changing or removing a middle level cuts outward (Tanya).** Removing the Craft room from Lab desk → Craft room →
  Bedroom leaves the Lab desk (and everything closer to the item) as it was. Every level outward goes from this
  path: the Lab desk is now in nothing. The Craft room place itself is untouched and stays in the Bedroom. The same
  goes for *Change*: the new place brings its own outer levels. This overrides Sam's splice. S2 has been redrawn to
  read "…no longer be in the Craft room or the Bedroom."
- **Rename a saved place by tapping its name in the → sheet: yes (Tanya).** Drawn as R1–R2.
  - **R1:** each name has a pencil.
  - **R2:** the rename sheet has the name, "Was: … ~~and water~~", and "The new name shows everywhere this place is
    used: 2 items on it". It has its own Cancel and Done.
- **No view (Tanya), so Claude's pick stands:** edit sheets cost one tap (Done) before the next photo. ReCall's guess
  is fixed in a sheet (G2).

- **Claude's picks taken (Tanya, "go with your assumptions"):**
  - A shared lower-level word (T3) can be changed from the item page, and the bar says who else it changes.
  - The place sheet (E1) and the levels sheet (S1) stay separate.

**Pass 1 is fully ruled.** No code until more passes are agreed.
