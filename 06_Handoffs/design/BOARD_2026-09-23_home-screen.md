# Home screen, rethought: six concepts (2026-09-23)

**Status: waiting on Ravi's pick. No app code has changed.** The rig on the live source still
passes 93/93 (`audit.js`) and 41/41 (`audit_roles.js`).

Brief: `06_Handoffs/PROMPT_2026-09-23_home-screen-rethink.md`. Approach: `BOARD_2026-09-23_home-screen_approach.md`.
Today's home as it renders: `mockups/H0_today.png`.

**Pictures**

| File | What it shows |
|---|---|
| `mockups/H1_montage.png` | All six side by side. Top row: her own ReCall. Bottom row: Robert in hers (*Can help*) |
| `mockups/H1_A_album.png` … `H1_F_ask-first.png` | One page per concept, ten frames each. Row 1: her own at Normal, Robert (*Can help*), Peter (*Can see*, with the Phase 4 status line), Largest, Dusk. Row 2: thing card, photo card, camera and switcher as Robert, plus *Later* (an appointment and a routine due) |
| `mockups/H1_own_title.png` | Her own screen titled with her name vs *My ReCall*, the top of each concept |

Everything is drawn from `out/styles.css` (the app's stylesheet) plus mock-only rules in
`rig/gen_h1.py`, at 390 × 844 in Chromium. `rig/render_h1.js` screenshots the pages and
`rig/compose_h1.py` lays them out. The seed is the same everywhere: nine things in the order
first photographed. *Coffee can* has no place yet, *Garden shears* are Robert's, and *Address
book* is *Only me*, so a guest never sees it. Photos are openly licensed Wikimedia Commons images
(`rig/mock/img/CREDITS.md`). They are used only in the mockups and never shipped.

> Two honest limits. The rig has no San Francisco font, so type renders in a close substitute;
> proportions hold, texture doesn't. The Commons photos are cleaner than a phone photo of a real
> hall table, so Ravi's own photos are the next test of whichever concept wins.

---

## 1. Who was in the room

**Build board:** Maya (PM), Devin (design lead), Priyanka (engineer), Sam (architect).
**Persona board:** Margaret (owner), Robert (spouse, *Can help*), Peter (son, remote, *Can
see*), Dr Kim (clinical, dignity), Linda (calm), James (lower bound), Harold (refuses anything
that looks like a memory aid).

**New for this round: Noor Haddad, graphic designer (20 years).** She came from magazine art
direction and has worked in mobile since 2008. She led design on a photo-sharing app and on a
banking app whose fastest-growing users were over 65. She owns composition, type, colour,
imagery, motion and the first second.

> *"The photographs are the only beautiful thing this app has. Today they're boxed and labelled
> like stock in a warehouse. The first second should feel like opening a drawer of your own
> things, not like opening an app about your memory. And the one piece of type that belongs on
> this screen above all others is her name."*

On motion, which a still can't show: every concept opens with the photos *already there*. No
skeletons and no cascade. Nothing moves over 150 ms (the stylesheet's rule). The only motion
Noor wants is a 120 ms cross-fade when a new photo replaces a tile. Devin agrees. Priyanka notes
it is free, because the tile re-renders anyway.

## 2. The perspective problem: one rule, drawn six ways

**The rule: every screen names whose ReCall it is at the top, her own included. A guest also
sees the role, in words and with an icon, at body size.** Her own screen carries the title
whether or not anyone else exists, so inviting people never makes it busier. That was the
constraint, and today's day line breaks it the other way by saying nothing at all.

- *Can help* uses a hand-with-plus icon.
- *Can see* uses a framed picture. It is never an eye, because Margaret and Linda both heard
  "being watched" in an eye.
- *Only me* stays the lock.
- No new words: *Can see*, *Can help*, *Only me* and *People* only.

**Carry-through, in every concept.** The thing card, the photo card and the camera all carry
the same identity mark as Home (§4 shows how each concept draws it). The camera matters most,
because it is where a helper's photo goes into someone else's ReCall. Each concept puts the
owner's name on the viewfinder itself, not only on the Log button.

**Switching.** In every concept the owner's name (or the band) is the switch. It opens a sheet
listing each ReCall with its cover photo and the role. The switch is shown only when there is
something to switch to, as today.

### The split the whole round turns on: does colour mean *what I can do*, or *whose it is*?

| | Colour = the role | Colour = the person |
|---|---|---|
| Concepts | A (role band), F (status band), E (the camera door) | B (the spine), D (the paper) |
| Champions | **Devin**, Robert, Dr Kim: "the thing that changes what you may do must be the loudest thing. Clay means *you are changing someone else's things*." | **Noor**, Margaret, Peter: "people have colours, roles don't. Margaret's ReCall is green on everyone's phone, the way a contact has a photo. Her own screen looks the same to her, to Robert and to Peter, which is what makes it *hers*." |
| Against | Noor: two ReCalls you can help in look identical. The colour answers *what*, not *whose*. | Devin: Robert in Margaret's ReCall and Robert in his own look different only by hue. The words carry the role, and he may not read them. |
| Sam | Role colour is two fixed values. | Person colour needs a stored colour per ReCall (one field on `recall_users`), picked by the owner or assigned. |

C takes neither side. Words come first and colour is only a thin rule on the note.

**Recommendation: none.** This is Ravi's call. The montage's bottom row shows both side by
side.

## 3. The six concepts

Estimates are Priyanka's and include the rig audit and screenshots. **The carry-through**
(identity on the thing card, photo card, camera and switcher) is **+1.5 days** on top of any
concept, and it is the same work whichever concept wins.

### A · The Album
**The idea:** her name as a masthead, then her photos edge to edge, three across, like her own
Photos app, with a quiet caption under each.

- **Champions:** Noor ("the photos finally get the width of the phone"), Harold ("looks like my
  pictures, not a medical thing"), Peter.
- **Objections:**
  - James and Devin: three across is a ~128-px target, and captions truncate (*Reading glas…*).
  - Linda: edge to edge feels busy.
  - Maya: the day line demoted to a caption is still a must-be, but it is smaller than today.
- **Largest:** drops to two across, and the captions grow. Nothing on the photos scales. The
  masthead stays one line; *Margaret's ReCall* at Largest truncates before it wraps (drawn).
  Devin: that's the trade, since the photo is recognised first and the name second.
- **Dusk:** strongest of the six. Full-bleed photos on near-black read like a gallery.
- **Perspective:** a guest gets *Margaret's ReCall ▾* in the masthead plus a full-width role
  band in the role's colour, e.g. *Can help · what you add goes to her*. A thin version of the
  band sits at the top of the thing card and photo card. The camera gets a clay chip, *Into
  Margaret's ReCall*, on the viewfinder. The switcher is two album covers.
- **Pipeline:**
  - An appointment line sits under the day in the masthead.
  - A routine due is an amber row above the grid (text, not a tile, so Find and Do never share
    a grammar).
  - Scale is best of the six: 12 things per screen, where today shows 6.
- **Cost:** 1.5 days. It is a grid-template change, a masthead, and a caption instead of a label
  block.

### B · The Index
**The idea:** one row per thing (photo, name, where it is, when), so Home answers "where is it"
without a tap.

- **Champions:** Robert ("I can check the whole house in one look"), Maya ("the question the app
  exists for, answered on the first screen"), Priya's role (Peter).
- **Objections:**
  - Noor: "a spreadsheet of her life. The photos are thumbnails again."
  - Devin: it is **a second screen of information she didn't ask for**. The thing card becomes
    redundant for most taps, and every place shown is a place that can be stale, which Rule 7
    wants her to judge on the card, not in a list.
  - Dr Kim: a list of where everything is reads as inventory taken *about* her.
- **Largest:** the rows grow, the 72-px thumbnails don't, and place names wrap to two lines.
  Nine things fit per screen at Normal and six at Largest.
- **Dusk:** calm; the spine glows.
- **Perspective:** colour = the person. A 7-px spine runs down the left edge of *every* screen,
  the camera included, in the owner's colour. Beside the title a *Can help* chip in words
  shows the role. The switcher rows carry each owner's spine colour.
- **Pipeline:**
  - Appointments and routines are text rows at the top (the Do grammar), which is B's
    natural strength.
  - The place hierarchy (*Office › Filing cabinet › third drawer*) will make B's place line long
    (Sam), so B would be the first concept to need place abbreviation.
- **Cost:** 1.5 days, plus the per-person colour field (0.5 days, Sam).

### C · The Note
**The idea:** a note at the top, a greeting, the date, and one band showing *the last thing you
put down*. Below it, her things exactly as today.

- **Champions:** Maya ("the must-be day orientation, done properly"), Linda ("it talks to
  me"), Priyanka ("the cheapest change that feels new").
- **Objections:**
  - **Dr Kim:** "*Good evening, Margaret* is fine once; twenty times a day it is a nurse's
    voice." She wants the date without the greeting.
  - Harold won't open an app that greets him.
  - **Devin:** the band changes on its own. Only one band changes, which LESSONS allows, but
    *Last put down* could show something she didn't put down (Robert logged it). The copy needs
    a ruling.
  - **Sam, the catch of the round:** for a *guest*, *last put down* reveals when Margaret last
    used the app, which is exactly what the Phase 4 status line keeps opt-in. So guests see no
    band unless she has turned the status line on. It is drawn that way: Peter's note shows the
    status line and Robert's shows none.
- **Largest:** the note grows to about a third of the screen before a single photo, and the
  first row of things starts below the fold on a 390-px phone. The worst Largest of the six.
- **Dusk:** the serif greeting in warm white on the dark card is lovely (Noor).
- **Perspective:** words first. A guest's note reads *Good evening, Robert. You're in Margaret's
  ReCall*, then *Can help* with a one-line sentence of what that allows. A left rule in the role
  colour is the only colour. A slim *In Margaret's ReCall · Can help* line opens the thing card
  and photo card, and a dark translucent chip sits on the camera.
- **Pipeline:** appointments and routines go inside the note, their natural home and the best
  fit of any concept.
- **Cost:** 1.5 days (the note, and a *last put down* query over sightings).

### D · The Prints
**The idea:** her things as printed photographs on paper that is hers, with the place written
under each like the back of a print.

- **Champions:** Noor ("the only one of the six that looks like it was *designed*"), Margaret
  ("these are my pictures"), Harold.
- **Objections:**
  - Priyanka: "the most CSS per pixel of anything we've shipped, and the paper tint has to be
    checked in four palettes."
  - Devin: the borders cost width, so each photo is ~10% smaller than today's for decoration.
  - Sam: showing the place under every print has B's staleness problem, and a long place wraps
    the caption.
  - Noor wanted a ±1° tilt on each print. It was vetoed by the house rule that icons, text and
    numbers line up horizontally, and she accepted.
- **Largest:** the captions grow and the prints stay two across; four things per screen.
- **Dusk:** the prints stay light on the dark paper. Noor loves it; Linda finds bright prints on
  black "loud".
- **Perspective:** colour = the person. Every screen is on Margaret's paper, a sage tint of the
  linen, and Robert's own ReCall is on clay paper. The title is set like an album title, and
  the role is a pill under it (*Can help ▾*), which is also the switch. The camera is framed in
  her colour. The switcher shows the two ReCalls as two prints on their own papers.
- **Pipeline:** appointments and routines are a paper slip above the prints. A *Shared with* row
  (Phase 3) fits under a print's place line if ever needed on Home.
- **Cost:** 2.5 days (the print component, paper tints in four palettes, the per-person colour).
- **Identity brief:** needs its serif settled (below).

### E · The Two Doors
**The idea:** the top half of Home is a live camera window, so tapping it logs. The bottom half
is *Where is my…* and her things.

- **Champions:** Robert ("I open it to log; the camera is already open"), Peter (setting it up
  remotely).
- **Objections:**
  - **Priyanka, a blocker:** a live camera on Home means iOS asks for camera permission **on
    every launch** of a home-screen web app. This is the known limit (DECISIONS 09-15), and
    under this concept it would be the first thing she sees, twenty times a day. E is only
    buildable after the native wrapper.
  - **Margaret:** "where did my things go?" They are a 4-across strip at the bottom and
    truncated. Hand memory survives (the order is fixed), but the board is no longer the screen.
  - Devin: it reverses *the board is the product* (09-05 §5).
  - Dr Kim: a live camera on open, before she has chosen to take a photo, feels like being
    filmed.
- **Largest:** the grid drops to three across, and the door keeps 38% of the height. Things
  start below the fold.
- **Dusk:** the viewfinder dominates. Fine.
- **Perspective:** the identity lives in the doors. *Into Margaret's ReCall · Can help* is
  painted on the camera window itself. A *Can see* guest has **no camera door at all**: a blue
  *Can see* panel explains why in one sentence. That is the clearest role signal of the six,
  and Robert and Devin both like it.
- **Pipeline:** a routine due becomes the camera's own instruction (*Front door · photo before
  bed* on the viewfinder), the most natural home for routines of any concept. The appointment
  is a line above the door.
- **Cost:** 4 days *after* the native wrapper, or not at all before it.

### F · Ask First
**The idea:** her name, then a big *Where is my…* field with the mic; her things smaller
below; the camera one round *Log item* button.

- **Champions:** Maya ("asking in words is the product" — her 09-05 position), James through
  voice, once the mic works.
- **Objections:**
  - Priyanka: the mic on iOS web is the keyboard's mic key (D9, 09-05). The big mic in the field
    promises more than Safari gives, and it is honest only after the wrapper.
  - Robert: the floating button is smaller than today's footer, and he logs more than he asks.
  - Devin: the floating button covers the last row at Largest (drawn).
  - Noor: "a search engine with photos under it."
- **Largest:** two across; the floating button overlaps a photo.
- **Dusk:** good.
- **Perspective:** colour = the role, as a **status band** across the top of every screen, like
  the phone's own in-call bar: *Margaret's ReCall · Can help ▾*. It stays on the thing card,
  the photo card and *on the camera*, the only concept where the camera's own top bar changes.
  The band is the switch. Robert and Peter found it the least ambiguous signal of the six:
  "it's the green-bar-means-you're-on-a-call thing".
- **Pipeline:** appointments and routines are lines under the field.
- **Cost:** 2 days, plus the mic caveat.

## 4. Carry-through, concept by concept

| | Thing card | Photo card | Camera | Switching |
|---|---|---|---|---|
| A | thin clay role band on top | same band | clay chip on the viewfinder | two album covers |
| B | green spine + *Margaret's ReCall* + *Can help* chip | same | spine + green chip | rows, each with its owner's spine |
| C | *In Margaret's ReCall · Can help* line | same | dark translucent chip | *Switch* link → rows |
| D | sage paper + title + pill | same | viewfinder framed in her colour | two prints on their own papers |
| E | clay pill | same | clay chip; *Can see* has no camera | name ▾ → rows |
| F | status band | status band | status band above the camera bar | tap the band → rows |

## 5. Her own screen: her name or *My ReCall*? (`H1_own_title.png`)

- **Her name** (Noor, Maya, Dr Kim): the same form a guest sees, so everyone shares one
  vocabulary for a ReCall. "It's her name on her things." Dr Kim adds that it is how you would
  label a person's own album.
- ***My ReCall*** (Devin, Margaret): she doesn't need to read her own name. "My" is the fastest
  signal that this is hers. Margaret: "my name on my own phone is a bit like a name tag."
- **Harold:** neither. He'd want no title at all, which is today's problem.

**No recommendation;** the strip shows both in every concept.

## 6. What the designer says about the identity brief

Noor read `03_Design/ReCall_Identity_Design_Prompt.md`. **None of the six needs the icon
settled first:**

- A, B, E and F use the system font and her name, never a wordmark.
- **C and D use a serif** for her name and the greeting (drawn with Charter, which ships on
  every iPhone). That is a typographic decision the wordmark will also make. If C or D wins,
  settle the wordmark's type direction first (step 4 of the brief), so Home and the wordmark
  don't pick two different serifs. Two weeks of Claude Design, in parallel, is her estimate.
- The one thing the brief should add: **a colour per person**, if Ravi rules for colour = the
  person (§2). The palette table in the brief has no second accent, and B and D need one that
  passes 3:1 in all four palettes.

## 7. Cross-cutting objections, recorded

- **Settings leaves Home in all six** (Noor, Devin). Today's small *Settings* link moves into
  the menu. Priyanka: that is a code change in the menu (+0.25 days). Sam: the AI key still needs
  a home until the helper phone lands. OPEN_ITEMS already says the gear should go.
- **The day line.** A, B, D and F keep it as a caption; C makes it a sentence; E shrinks it to a
  word. Maya holds that it is a must-be in every concept. Devin accepts it as long as it never
  pushes the first photo below the fold at Largest, **which C fails.**
- **Nothing is ever asked of her.** Checked in all six: no concept adds a prompt, a badge or a
  count on her own screen. *Or tap one of your 9 things* (F) was challenged by Devin as a
  number she didn't ask for. It stays in the mock and is flagged.
- **First-photographed order** holds in all six. Only B and E show a different *number* of
  things per screen from today.

## 8. Pipeline check (Ravi: "the design needs to accommodate what's coming")

| Coming | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Appointments (today-only line) | masthead | text row | in the note | paper slip | above door | under field |
| Routines (one band, only when due) | amber row | text row | in the note | paper slip | **the camera's instruction** | amber line |
| Status line (Phase 4, opt-in) | under band | under head | in the note | under title | in panel | under field |
| *Shared with* / *Only me* / *Give* (Phase 3) | card row, no Home change | same | same | same | same | same |
| Place hierarchy (long place names) | not on Home | **wraps** | band only | **wraps** | not on Home | not on Home |
| 100+ things | 12 per screen | 9 | 6 | 4–6 | 16 (small) | 9 |
| Native wrapper (camera permission) | — | — | — | — | **required** | helps the mic |

## 9. Where the board lands (advice, not a decision)

- **Devin:** A for the board and F's status band for the identity. "The photos get the width
  and the band can't be missed."
- **Noor:** D, or A if D's cost is too much. Colour = the person.
- **Maya:** C's note carries the pipeline best, but A is the better screen. She would take A
  with C's appointment and routine lines.
- **Priyanka:** A (the cheapest real change). E not before the wrapper.
- **Sam:** anything but B and D until the place hierarchy exists.
- **Margaret:** D ("my pictures"). **Robert:** E, then B. **Peter:** F's band.
  **Dr Kim:** no greeting (not C as drawn), no live camera (not E).

**The mix most voices would accept:** A's album grid, F's status band for guests on every screen,
and C's lines for appointments and routines. That's Devin's and Maya's combination, and nobody
vetoed it. Noor dissents on colour (she wants it per person) and on the band ("it's chrome,
not design").

## 10. Rulings for Ravi

1. **Which concept?** A · B · C · D · E · F, or a combination (e.g. A + F's band).
2. **Colour means** *what I can do* (the role) or *whose ReCall* (the person)? (§2)
3. **Her own title:** her name or *My ReCall*? (§5)
4. **Settings** off Home and into the menu, in whichever concept wins?
5. **Next step:** one more rendered pass of the pick with your own photos from the phone, before
   any code?
