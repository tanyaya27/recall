# Adversarial audit: multi-tier "where" (tier 2 and beyond), logic and screens (2026-09-29)

Ravi, 09-29, from the phone, on build `20260929b`:

> "In the attached, I added the next tier (blue boxes) and named the place but when I hit save, it doesn't store that next
> tier. Can you do a full audit of this multi-tier definition at both the logical and UI levels? Use the adversarial board."

His screenshot showed Move it on *3D model of plant sensor*. Tier 1 was the current place (Desk drawer), and tier 2 was a
new place he named "In air", with 2 photos.

## How it was done

- **Rig:** rebuilt from `RIG.md`, with the baseline green. Then a new suite, `rig/audit_tiers.js`. It drives the camera the
  way a person would, **with the real permission rules on**, through 16 scenarios, and after each save records three
  things:
  - what was stored (places, open edges, the thing's place);
  - what every screen then says (the save card or toast, the Find tile, the thing's page, the Places list);
  - the camera at each step, as screenshots.
- **Scenarios** (T = tier): every kind at every tier.
  - Known place, new photographed place, known box, new box, and the current place in Move it.
  - The same place twice; a circle through places; two unnamed places; old data carrying `parent`.
  - Settings → Version.
- **The room** (the 09-27 adversarial cast, kept together on purpose):
  - Grace Okafor (PM, release gates): "every state reachable, every mutation announced".
  - Tomás Rivera (interaction auditor).
  - Frank, 67: fat thumbs, never reads.
  - Mei, 34: professional organizer; deep chains and duplicate names.
  - Sunil, 72: low vision, largest text, reads every label literally.
- **Real rules engine:** the Firestore emulator ran in the container this time. The new
  `firebase/rules-test/test_place_edges.mjs` passed 10/10, and the existing `test_edges.mjs` still passes. **No rules
  deploy is needed.**

## What the walk found: logic

**T1: A place could not say where it is. This is Ravi's bug.** Boxes are placed by an "is in" edge. A place had only a
`parent` field, written once when the place is first created, and nothing in the app read it.
- *Known place with a tier outside it* (Desk drawer → In air; Kitchen counter → Craft nook; Linen closet → the tin box): the
  outer tier was dropped. The new outer place was still created, orphaned in Places with the photos.
- *New place with a tier outside it* (Top drawer → Desk): `parent` was written but never shown anywhere. The Find tile, the
  thing's page and Places all said only "Top drawer".
- Evidence on the old code, `audit_tiers` S1–S11: the edge is missing in 9 scenarios; the old run is 9/25.

**T2: The screens said it had worked.** The save card read "Kitchen counter · Craft nook" and "Linen closet · Tin box ·
Garage", while nothing about tier 2 was stored. Mei: "The card is the receipt. The receipt lied."

**T3: Move it with tier 1 kept wrote a fake move.** When only a deeper tier changed, the thing still got a new history
line and a new "last seen", as if it had moved.

**T4: Two unnamed places became one.** The AI couldn't name two different spots, so both saved as "A place". The second
save added its photo to the first place doc, and both things then read "at A place". "A place" was then offered as a pill,
which is the pill in Ravi's screenshot. Frank: "I'll never name anything. You just put my toolbox and my sock drawer in one
spot."

**T5: The same place could be used at two tiers** ("Craft nook · Craft nook"), through the ••• list.

**T6: No circle guard for places.** Boxes have one; places had none, because place-in-place was never stored. Once T1 is
fixed, *Pantry shelf in Kitchen counter in Pantry shelf* becomes possible unless it is refused.

**T7: Saying a place is somewhere new moves everything in it.** *Kitchen counter* is in *Craft nook*. A later save of
"Kitchen counter · Pantry shelf" moves the Kitchen counter, and everything on it, to the Pantry shelf, without saying so.
Boxes already work this way (S6: the tin box left the Garage). **A design choice (Q3), not fixed here.**

**T8: A place inside a box** ("Linen closet in the tin box") is accepted. Mei: a front pocket is a place inside a backpack.
Sunil: "a closet in a tin? You made a mistake and let me save it." **A design choice (Q4).**

## What the walk found: screens

**U1: At three tiers the row ran past the card.** On a 390-px phone the 4th square was cut off and ＋ was out of sight (88 px
past the edge). The fade that says "there's more" only turned on above 5 squares. Frank never found tier 4.

**U2: A question about tier 2 can arrive while tier 3 is selected.** For example, "Your filing cabinet?" appears in blue
while the prompt above talks about the Study. Only the colour says which tier the question is about, which fails Sunil and
fails the colour rule (09-27, Noor: "colour is never the only signal"). **A design choice (Q5).**

**U3: The thing's page, Find and Places show only the innermost place.** Even once the tiers are stored, nothing draws
them. **A design choice (Q1, Q2).**

**U4: "Current place: Desk drawer / In air".** Sunil read "In air" as part of the current place. In fact it is a new claim
about where the drawer is. Kept for Q3, since the answer there decides the words.

## Fixed now (bugs), in `20260929c`

| # | Fix | Check (fails on `20260929b`, passes now) |
|---|---|---|
| T1 | A place's "is in" is an **edge from the place doc**, the same record a thing has (DECISIONS 09-25: "is in" is an edge, never a field). Every tier is written: place → place, place → box, known or new, in Log item and in Move it. `parent` is no longer written. The owner's phone turns old `parent` values into edges once, at boot. | S1, S2, S3, S5, S7, S9, S11, S15 |
| T2 | The camera tells the truth about what is stored. A known place picked at a tier now shows where it already is, the same way a box always did: Move it on the plant sensor opens on "Current place: Desk drawer / In air". The Move toast carries the second line too. | S1 (Move it again) |
| T3 | Move it with tier 1 kept does not touch the thing (no history line). | S1 |
| T4 | A new unnamed place waits for a name when an "A place" already exists. It uses the existing collision gate and its words: "'A place' needs its own name — tap it." The first unnamed place still saves as before (R3.3). | S8 |
| T5, T6 | A place or box already on the chain, or one that would make a circle, is not offered for the next tier: not as a pill, not in the ••• list, not as "a new place called …". It is also refused at save. | S12, S13 |
| U1 | The row keeps the selected square, and ＋ right after it, scrolled into view. The fade is measured, not set by a count. | S2 |
| — | Undo on the save card also undoes the place links it made. | S3 |
| — | Settings → Version: the build name is the last line ("Build 20260929c"). | S16 |

## Design choices: rendered options (`mockups/TIERS_Q1..Q5_*.jpg`)

Each option changes only the block in question, on the real screen. The board's positions are below; they disagree, and
the disagreements are left in. **Ravi and Tanya decide.**

### Q1: The thing's page, "Where it is" (Drawer 3, in the Oak cabinet, in the Office)
- **A · the row, continued.** Every tier is a square, with "in" between, and the words below: "Drawer 3 / in the Oak
  cabinet · Office". It is today's pattern for boxes, carried on.
- **B · words only.** One square for the innermost place, the rest in words.
- **C · a ladder.** One row per tier, each tappable to its place.

**Positions:**
- Grace: A. The page must show what the camera showed.
- Mei: A. She wants depth, and can see it at a glance.
- Frank: B. "I read the name; the little pictures are all brown."
- Sunil: B. At the largest text, three 46-px squares squeeze the words to wrap every line. He objects to A.
- Tomás: C, because every tier is reachable. But it costs the most height, and Ravi's standing rule is to maximise
  vertical space, so he'd take A if C is out.

### Q2: The Places list
- **A · "in the …" line.** A flat list; each place says where it is under its name.
- **B · nested.** Inner places are indented under outer ones.
- **Now:** a flat list, with no place saying where it is.

**Positions:**
- Mei: B. Organizers think in trees.
- Grace: A. Search and scan stay as they are, and nothing new is added to the layout.
- Sunil: A. Indents vanish at large text.
- Tomás: B only if a branch can fold; otherwise A.
- Frank: "I use Find."

### Q3: A place that already has a "where" is said to be somewhere else
- **A · it comes in as tier 2.** Picking Kitchen counter fills tier 2 with Craft nook, marked ✓. Tapping another place
  replaces it, and the prompt says so.
- **B · last word wins, and the card says what moved:** "Kitchen counter moved: Craft nook → Pantry shelf · 2 things with
  it". This is how boxes work today.
- **C · ask before save:** "Kitchen counter is in Craft nook. Move it to Pantry shelf?" with Move it / No, keep Craft nook.

**Positions:**
- Mei: C. Moving a place moves its contents, so it must ask.
- Frank: against C. "Another question. I'll tap the green one." He'd take A, because he sees it without having to answer.
- Grace: A, plus B's line on the card: the error is prevented, and the change is announced.
- Tomás: A. It shows the state before the mistake instead of asking after it.
- Sunil: C is the most literal, but only if the buttons say what they do (they do).

U4 (the "Current place" words) follows whichever of these is chosen.

### Q4: A place inside a box (Linen closet in the tin box)
- **A · allowed.** This is the current behaviour and what is stored now.
- **B · after a place, only places are offered** at the next tier.

**Positions:**
- Mei: A. A front pocket is a place, and it's in a backpack. A tote bag is both.
- Grace and Tomás: A, as long as the words read right.
- Sunil: B. "It looks like a mistake."
- Frank: indifferent.

### Q5: A question about tier 2 arrives while tier 3 is selected
- **A · the ask shows its square:** the photo it's asking about, in its tier's colour ring, then "Is this your filing
  cabinet?".
- **B · jump to tier 2.** The camera selects the tier the question is about.

**Positions:**
- Tomás, Sunil and Grace: A. It is the fix for colour-only.
- Frank: against B. "I was photographing the study and it took me away."
- Mei: A.

## What is still open
- Q1–Q5 rulings. Q1 decides when the new links become visible outside the camera. Until then they are stored, and the
  camera shows them.
- Helpers can say where a shared place is (the real rules allow it: `canEdit` on the place). A viewer and a stranger can't.
  Proven on the emulator.
- The handoff's baseline listed audit_where as 83. The suite has 63 checks, and ran 63/63 at the start of this session.
