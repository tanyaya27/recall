# Home screen rethink — the approach (2026-09-23, before any drawing)

Ravi's brief: `06_Handoffs/PROMPT_2026-09-23_home-screen-rethink.md`. Live build `20260921b`.
Rig rebuilt from `RIG.md` in the cloud workspace: **audit 93/93, audit_roles 41/41** on the live
source. Today's home, as it renders (Normal, Largest, owner, Can see, Can help, switcher, thing
card): `mockups/H0_today.png`.

## 1. What is wrong with today's home, stated plainly

- **It has no top.** The first thing on screen is *Wednesday night · September 23* in grey, a
  hamburger and a small *Settings*. Nothing says whose this is, and nothing on it is hers.
- **The tiles are all the same weight.** Eight squares with a label strip read as inventory,
  not as her things. The photos are the only beautiful thing in the app and they are cropped
  into identical boxes with a bar of UI under each.
- **Perspective is invisible.** Own ReCall = the day line only. Someone else's = *Margaret's
  ReCall ▾* in the same grey weight as the day line, with *Can see* / *Can help* in 11-px grey.
  The camera, the photo card and the thing card say nothing at all (only the Log button has
  *in Margaret's ReCall*, in 9-px type).

## 2. Who is in the room

Build board: **Maya** (PM), **Devin** (design lead), **Priyanka** (engineer), **Sam** (architect).
Persona board: **Margaret** (owner), **Robert** (spouse, Can help, lives in her ReCall), **Peter**
(son, remote, Can see), **Dr Kim** (clinical, dignity), **Linda** (calm), **James** (lower bound),
**Harold** (refuses anything that looks like a memory aid).

New for this round — **Noor Haddad, graphic designer, 20 years.** Started in magazine art
direction, moved to mobile in 2008; led design on a photo-sharing app and a banking app whose
fastest-growing users were over 65. Owns composition, type, colour, imagery, motion and the first
second. Her point of view, in her words:

> "The photographs are the only beautiful thing this app has, and today they're boxed and labelled
> like stock in a warehouse. The first second should feel like opening a drawer of your own
> things — not like opening an app about your memory. And the one piece of type that belongs on
> this screen above all others is her name. Everything else earns its place or leaves."

She will argue with Devin (who wants fewer decisions, not more beauty) and with Priyanka (who
prices every shadow). She reads `03_Design/ReCall_Identity_Design_Prompt.md` and says which
mockups, if any, need the icon/wordmark settled first.

## 3. The six concepts I intend to draw (different ideas, not colourways)

| | Concept | The idea in one line | Who I expect to fight |
|---|---|---|---|
| A | **The Album** | Her name as a masthead; photos edge to edge, three across, like her Photos app; names in one quiet line under each | Devin/James: small targets at Largest |
| B | **The Index** | One row per thing: photo, name, and *where it is* — the answer on Home without a tap | Noor: "a spreadsheet of her life" |
| C | **The Note** | A greeting and one band: *the last thing you put down*, then her things below | Devin: a band that changes; Dr Kim: "is it testing her?" |
| D | **The Prints** | Her things as printed photographs on the linen, place and time written under each like the back of a print | Priyanka: cost; Sam: density |
| E | **The Two Doors** | The two verbs are the screen — *Put something down* / *Where is my…* as big picture doors — things on a shelf strip below | Margaret: "where did my things go?" |
| F | **Ask First** | Her name, then a big *Where is my…* field at the top, her things small below, the camera a round button | Robert: he logs, not asks; James: typing |

Every one keeps: first-photographed order, nothing on a photo scaling with text, one-line
controls, no new words, her screen no busier because other people exist.

## 4. The perspective problem — one rule, drawn six ways

**Rule: every screen says whose ReCall it is, in the owner's name, at the top — including her
own.** Her own says *Margaret* (or *My ReCall*, a split for the board) whether or not anyone else
exists, so it never gets busier when people are added. Someone else's says *Margaret's ReCall*
**plus the role in words and an icon, at body size, in its own colour band** — *Can help* / *Can
see* — never grey, never small.

Each concept draws that rule its own way (masthead, tinted frame, tab, ribbon…) and each mockup
page shows the same five frames so they compare:

1. Home — her own, Normal, Linen
2. Home — Robert in Margaret's ReCall (**Can help**)
3. Home — Peter in Margaret's ReCall (**Can see**)
4. Home — her own at **Largest**
5. Home — her own in **Dusk**
6. The carry-through strip: thing card, photo card and camera as Robert, plus the switcher

Switching: the owner's name is the switch (tap → a sheet of ReCalls, each with a cover photo and
the role), shown only when there is something to switch to — unchanged in principle, redrawn per
concept.

## 5. The same seeded things in all six

Eight things, identical everywhere: reading glasses, car keys, wallet, the black folder (tax
papers), phone charger, library book, sparkling soda (**no place yet**), garden scissors
(**Robert's** — the owner tag), plus one **Only me** thing on her own screen.

**The photographs matter here more than in any round so far.** An artistic judgement on
colour-block fixtures is meaningless. Options in §6.

## 6. Deliverables

`06_Handoffs/design/BOARD_2026-09-23_home-screen.md` (the boards, the disagreements, per concept:
idea · champions · objectors · Largest · Dusk · cost · identity-brief verdict), one PNG per
concept (`mockups/H1_A_album.png` … `H1_F_ask.png`), one montage of the six homes
(`mockups/H1_montage.png`). All drawn by `rig/gen_h1.py` + `rig/render_h1.js` from the app's own
`styles.css` plus mock-only rules. No app code changes. OPEN_ITEMS updated.
