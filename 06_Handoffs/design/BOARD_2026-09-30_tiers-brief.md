# Brief for a new board: should ReCall keep a structured chain of places ("tiers"), or go freeform?

## The product
ReCall is a phone web app (becoming a native iPhone app later) for remembering where you put things. Tanya (a student)
designed it and Ravi (her dad) builds it with her. It started with people who have mild memory loss; since 09-24 it's
for anyone. You photograph an item and say where it is. Later you ask "where's my passport?" and get the answer with
photos. Several people can share one house. Logging speed is measured from the moment you reach for the phone.

## How "where" works today (the structured model)
- A **place** is a record with a name and up to 6 photos (e.g. "Desk drawer", "Garage shelf"). A **box** is an item
  that holds items (e.g. a "White cardboard box" you logged).
- Everything has at most ONE "is in" link: an item is in a place or box. A box or place can be in another place.
  So an item's full where is a CHAIN, e.g. *3D model* → in **White cardboard box** → in **Ikea shelving unit** → in
  **Living room**. Each link belongs to the object it starts from. "The Ikea shelving unit is in the Living room" is a
  fact about the shelving unit, not about the 3D model.
- Consequences that exist today: move a box and everything in it moves with it (nothing else to edit). A place has
  its own page listing what's in it; it can't be removed while it holds things; two places can be merged (with a photo
  check). When you photograph a place, the camera compares the photo with your saved places' photos and asks "Is this
  the Desk drawer?". Find answers with the whole chain.
- **Move it** (the camera, on an item): the squares show every tier of the chain, level 1 = what the item is directly
  in. You pick a square and change it (photograph a place, or "Choose place" from a list), or + a new tier on top.
  - Changing **level 1** puts the item in a new place; the tiers that were above the old level 1 disappear from the
    screen, and the new place's own known chain (if any) appears instead.
  - Changing **level 2 or higher** changes where the tier BELOW it is — i.e. it moves that box/place (and everything
    in it) somewhere else.

## Ravi's report (09-30, on his phone) — verbatim
> "Choose a place" is as-built a real mess. For one, it is very unintuitive to know when user clicks "Choose a place"
> what tier location they are about to pick or change. I opened up the move page for an item that had three tier
> location structure and first clicked "Choose a place". I did not realize that the first tier thumbnail was selected
> and when i picked a new place and returned, the prior 3-tier structure was gone and the tier 1 place was changed.
> Luckily we have a cancel. So, there is no clear indication in both the move page and in the "pick a new place" page.
> both pages should show the current tier hierarchy and then be clear which tier is being changed. I have a serious
> issue with our tier-based storage mechanism…
>
> About the flaw in the multi-tiered location approach... It is back to the question: Are we making this too complex
> and is there a more freeform mechanism that is more likely to remain accurate that should be adopted? Here is why I
> am challenging it. Imagine an item with a 4-tier place hierarchy. Now we change the tier-2 place, does that mean that
> tier-3 and tier-4 are no longer valid? If tier 2 was a box that changed from cardboard box to tin box and the tin box
> is in the same tier-3 (red book shelf) in tier-4 (garage) then it is fine but what if it is moved to tier-2
> (glove-box) of tier-3 (tesla car) in tier-4 (outside street parking spot). Then changing tier-2 makes the original
> tier-3 and tier-4 nonsensical. So, should we eliminate the notion of structured place hierarchy and instead have a
> free form text description of where an item is and just have a group of photos that show the item and the places?
> Then, if the item is moved, user has to provide new freeform text of the places with possibly some or all new photos
> of the places?

His screenshots are in this folder (shot1–shot5). In shot1/shot2 he built a test chain *White cardboard box in Ikea
shelving unit in Living room in Dining room in Foyer / In air* — rooms inside rooms, which the model allowed.

## Earlier boards (for context — you are NOT bound by them; challenge them if you disagree)
`BOARD_2026-09-24_nesting-natural.md`, `BOARD_2026-09-25_containers-graph.md` (why the graph was chosen),
`BOARD_2026-09-27_every-path.md`, `BOARD_2026-09-29_tiers-audit.md` (the last audit of tiers).

## Options on the table (add your own if you have a better one)
- **A · One question per Move.** Move it asks only "what is it in now?" (photograph or pick ONE place). What that place
  is in is shown read-only as context, from the place's own record; to change it you move THAT place/box (tap it in
  the chain → its page → Move). If the place is new, ReCall may ask once "what's the glove box in?" (skippable).
  The data model stays as it is.
- **B · Keep editable tiers, make them clear.** Today's Move it, but both screens show the full chain and mark which
  tier is being changed, and say what happens to the tiers above.
- **C · Freeform (Ravi's idea).** An item has a free-text "where" ("glove box of the Tesla, parked on the street") plus a
  set of photos of the item and the places. Moving it = new text (and maybe new photos). No place records.
- (D… your own — e.g. a hybrid.)

## Walk this example through every option
1. Today: *tin box* in *red bookshelf* in *garage*; the 3D model is in the tin box.
2. The 3D model goes into the *glove box* of the *Tesla*, parked on the *street*.
3. A week later the Tesla is parked in the *garage*. Also, 20 other items are in the Tesla's trunk.
4. Then: "where's the 3D model?", "what's in the garage?", "what's in the Tesla?", and the camera: photograph the glove
   box — does ReCall know it?
Say what the person has to do at each step (taps/typing), and whether the answers stay TRUE without extra work.
Also: what happens to everyone's existing data if we change model.

## What to write
Named members (invent NEW names — do not reuse Maya, Devin, Priyanka, Sam, Margaret, Robert, Priya, James, Harold,
Evelyn, Linda, Elena, Leila, Noor, Kim, June, Dan, Peter, Sunil, Rivera), each with a role and a real point of view.
Each member: position (which option), the strongest argument for it, what they'd lose, and what would change their mind.
Then **the disagreements** — do NOT converge to a consensus; Ravi wants the splits. End with a vote tally and the 2–3
questions Ravi and Tanya must decide. Plain words, no jargon an owner wouldn't use. ≤ 1,800 words.
