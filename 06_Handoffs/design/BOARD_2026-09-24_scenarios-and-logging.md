# Who it is for, how it sets itself up, and how fast logging must be (2026-09-24)

**Status: analysis for Ravi and Tanya. Nothing is drawn yet and no code has changed.**

Ravi, 09-24, on the six home-screen mockups (`BOARD_2026-09-23_home-screen.md`):

> *"100% focused on cosmetic layout changes and overall quite useless. The layout variations
> maybe should just be styles available in the settings menu. The real value is in thinking
> about who the customer persona is — a brief questionnaire to understand what type of user
> this is … dozens of distinct scenarios. The tool needs to understand the situation and
> configure itself … and help engage the support network. One super important thing across
> all of this is the incredible ease with which the tool must make logging easy. If the user
> cannot log — a bill, a place for a wrench, an appointment — the user won't even get to Find.
> Based on the scenarios and the speed of operations, the UI can then be intelligently designed
> and then configured."*

**He is right, and the miss was structural, not effort.** H1 took the product as given (one
person, everyday things, a grid) and restyled its front page. The five scenarios below show the
product is not yet defined well enough for a front page to be the right question. The H1
layouts are parked as candidate **styles** for Settings (Ravi's suggestion), to be revisited
once the configurations below exist. Nothing in them is wasted: A's grid, B's list and F's
ask-first each turn out to be the natural home view for one scenario (§6).

---

## 0. The first thing the boards said: this is a scope decision, and it is Tanya's

Every feature in the prioritizer (`01_Needs_and_Prioritization/…2026-07-04.json`, 76 features,
Kano-classified) was derived from one premise: **early-stage memory loss**. Of Ravi's five
scenarios, two fit that premise (the 80-year-old, the 75-year-old). Three do not: the garage
(55, no memory issue), the storage locker (40), the garden (68, ordinary forgetting). Bills,
to-dos, inventory ("do I have #8 galvanized screws?"), boxes and plantings are not in the
Kano analysis at all.

- **Maya:** this is the biggest change to ReCall since the 09-05 board. `PRODUCT_BOARD.md` says
  reopening scope means going back to the Kano work *deliberately*. Doing it by stealth, one
  feature at a time, is what produced v0.1. She is not against it. She wants it done on purpose.
- **Dr Kim (clinical):** broadening *helps* Margaret. A household-memory tool that a 55-year-old
  uses for his garage is not a dementia app on her phone, and that is exactly the stigma the
  identity brief is trying to avoid. Harold agrees: "if my son-in-law uses it for his tools, I'll
  use it for my glasses."
- **Devin:** the risk runs the other way. A tool configured for 400 screws must not make the
  glasses screen worse. §5 is his condition: *configure*, never *accumulate*.
- **Tanya's motivation** (CLAUDE.md: a family member with early-stage dementia) stays the reason
  the product exists and its hardest test. The recommendation below keeps her person as the
  scenario every configuration must still pass.

**Needs Tanya:** broaden ReCall from "memory aid for early memory loss" to "the household's
memory (things, places, papers, dates), with memory loss as the hardest case it must serve"?

---

## 1. The five scenarios, with names

Each needs a persona for the board. Margaret and Robert already exist; four people are new.

| | Person | Situation | What she/he asks the tool | Who else is involved |
|---|---|---|---|---|
| S1 | **Margaret (80)**, with **Robert** | Mostly fine; sometimes forgets where she put things. Robert is alert and intervenes | *Where are my glasses?* | Robert, same house, every day |
| S2 | **Dan (55)** | No memory issue. A garage and crawl space full of tools, fasteners and fixtures; rebuys what he already owns; some things used once every 2–3 years | *Do I have #8 stainless screws, and where?* | Nobody, or a neighbour borrowing the drill |
| S3 | **Leila (40)** | Just moved; house-hunting; everything in boxes in a big storage locker; occasionally needs one specific item | *Which box is the passport folder in, and where is that box?* | A partner; movers; whoever goes to the locker |
| S4 | **June (68)** | Keen gardener; planted seeds and bulbs in the autumn; by spring does not know what is where and pulls up seedlings that look like weeds | *What did I plant here?* | Maybe a spouse; a garden club |
| S5 | **Evelyn (75)**, and daughter **Nisha** | Lives alone; Nisha visits now and then. Things pile up (a bill, a maintenance notice) and Evelyn does not know what needs doing or where the paper is; forgets appointments with the doctor and PT, and Nisha keeps calling to check | *What do I need to do, and when is my next appointment?* | Nisha: remote most of the time, in person sometimes |

Ravi's point is that these are five of dozens. So the design cannot be five apps. It has to be
a small set of **dimensions** that any scenario can be placed on, and a configuration per
region of that space.

## 2. The dimensions: what actually differs between scenarios

Worked out by pulling the five apart. Each row is something that would change the design.

| Dimension | Range across the five | Why it matters to the design |
|---|---|---|
| **What kind of thing** | an object that moves (glasses) · stock with variants (screws) · a container that holds things (box) · a living thing that changes (bulb) · a paper that needs action (bill) · an event in time (appointment) | Six kinds of record, not one. Today the app knows one |
| **The question asked** | *where is it* · *do I have it* · *what's in this box* · *what's planted here* · *what do I need to do* · *when is it* | Find is not one verb. Three of these are Do, not Find |
| **How many** | ~10 (S1) · ~50 boxes × ~20 items (S3) · hundreds of small parts (S2) · ~30 plantings (S4) · a trickle of papers and dates (S5) | Grid vs list vs search-first. The H1 layouts are answers to *this* row |
| **How logging happens** | one at a time, at the moment (S1, S5) · **a burst session** (S3 packing, S4 autumn planting, S2 the day he sorts the garage) | Bursts need a session mode; single logs need zero setup. Different flows |
| **How long until the answer is needed** | minutes (glasses) · months (bulbs, spring) · years (plumbing fixture, 2–3 years) | Long horizons need the record to be self-explaining years later: the label, the spec, the packet |
| **How precise the identity** | "glasses" · "#8 × 1¼" stainless pan-head" vs "#8 galvanized" | Fine variants need the AI to **read the packaging** (text on the label), not just name the object |
| **How deep the place** | room (S1) · garage › shelf 3 › bin B (S2) · locker › back-left stack › box 14 (S3) · north bed › third spot from the fence (S4) · kitchen drawer (S5) | The place hierarchy Ravi designed on 09-16 (`parent`) is not a later nicety. It is S2 and S3's core |
| **Memory of the person** | intact (S2, S3) · ordinary (S4) · early loss (S1, S5) | Sets tolerance for choices, text, and whether anything may ever ask her a question |
| **Who logs, who finds** | the same person (S2, S3, S4) · spouse logs, she finds (S1) · together, in a sitting (S5) | Sets the people model, and whether logging must be possible *for* someone |
| **The network** | none · spouse in the house · a visiting daughter · a remote child | Sets what "invite" means and what the others see |

**Sam:** four of these rows are *data model* questions (kind of thing, place depth, precision,
time), and the model built on 09-16 (Thing · Place · Sighting, with `parent` reserved on
Place) already covers two of them. He adds two concepts and nothing else (§4).

## 3. Logging is the product. Everything else waits on it

Ravi's sharpest line, and the board is unanimous on it (noted, because unanimity is rare):
*if logging is not nearly effortless, nothing is in the tool, and Find has nothing to find.*

### 3.1 What "easy" has to mean, as numbers

Targets the build board would hold itself to. They are measured in the rig and on the phone,
not asserted.

| Log | Target | Today (`20260921b`, taps counted from the code; seconds are an estimate to be measured) |
|---|---|---|
| **One thing, where she put it** (S1) | open → photo → place: **≤ 3 taps, ≤ 5 s**, no typing | Log item → shutter → Done → name arrives → tap place: 4 taps, ~8–12 s (the AI name is the wait) |
| **Each extra item in a burst** (S2, S3, S4) | **1 tap per item, ≤ 2 s**; the place is set once for the session | No session: every item repeats the place question |
| **A paper** (S5: bill, notice) | photo of the paper → it becomes a to-do with the due date and where the paper went: **≤ 3 taps** | Not possible |
| **An appointment** (S5) | photo of the card / letter, or Nisha types it from far away: **≤ 3 taps**, or 0 for Evelyn | Not possible |
| **A planting** (S4) | photo of the packet, photo of the spot: **2 shots**, nothing typed | Possible as two things, but the packet and the spot are not linked |

### 3.2 The mechanisms, in order of leverage

1. **The AI does the typing.** Every field is filled from the photo: name, kind, and
   *text read off the thing*. The screw box says "#8 × 1-1/4 in. stainless steel pan head
   Phillips, 100 ct", the seed packet says "Tulip 'Queen of Night'", the bill says
   "Puget Sound Energy, $84.12, due Oct 9". The person corrects, never composes. (Priyanka: this
   is one prompt change to `tagPhoto` plus a `details` field. The vision model already reads
   text; we have never asked it to.)
2. **Sessions for bursts.** *"I'm in the garage, shelf 3"*: set the place once, then every shot
   is an item there, one tap each, until she says *Done here* or moves. For boxes: *"Packing box
   14"*, shoot what goes in, shoot the box, done. The box is a place that is also a thing (§4).
   This is the single biggest speed gain for S2, S3 and S4.
3. **The place is guessed, not asked.** The last place in this session; the place the thing
   usually lives; the place in the photo (the AI already guesses `placeGuesses`). The question
   *Where is it?* is asked only when the guess is weak. Today it is asked every time.
4. **Labels for containers.** A printable sheet of QR labels ("Box 14", "Bin B"). Stick one on;
   scanning it opens that box's contents, and photographing into it adds to it. For S3 this is
   the whole product. For S2, bins. Cheap: a label is a link with an id. (Sam: the id is the
   place doc's id; no new object.)
5. **Paper and dates come in through the camera too.** A photo of a bill, a notice or an
   appointment card is read, not just stored. It becomes a **to-do** (with a due date and the
   place the paper went) or an **appointment** (with a time). The person confirms one line.
   Later: forwarding an email or text to ReCall. That needs a server address, so it is Phase 2
   of this, not the start.
6. **Somebody else can log it for you.** Nisha adds Evelyn's PT appointment from her own phone,
   and it appears on Evelyn's. Robert logs Margaret's glasses. This already exists for things
   (*Can help*); it has to extend to dates and papers.
7. **Voice, where the platform allows.** *"Tax bill, kitchen drawer."* On iOS web this is the
   keyboard's mic (D9, 09-05). A native app gets Siri, the Action Button, a lock-screen widget
   and the share sheet, **each of which removes the "open the app" step entirely.**

**Priyanka on 7, and it is the round's hard constraint:** the targets in §3.1 for S1 and S5 are
at the edge of what a home-screen web app can do. iOS asks for camera permission on every
launch (DECISIONS 09-15), there are no reliable notifications (so appointment reminders are
impossible), there is no share sheet, and there is no widget. **Logging speed and appointments
both push the native wrapper (Capacitor → TestFlight) from "later" to "next."** Sam agrees;
Maya asks for the cost before the ruling (estimate: 3–5 days to wrap, plus Apple's review
cycle and a developer account, which Apple sign-in also needs).

## 4. What the data model has to gain (Sam)

Built on the 09-16 model (Thing · Place · Sighting). Two additions, both small:

- **Place gets its `parent` for real**, and **a place can be carried**: a box is a Place (things
  are *in* it) that is also sighted at a Place (it is *in* the locker, back-left). One flag,
  `movable: true`. Finding the passport becomes passport → in Box 14 → Box 14 last seen in the
  locker, back-left, and the answer shows both photos. This also covers a toolbox, a bag, a car.
- **A Thing gets a `kind`** — `object` (today) · `stock` (a quantity: "about 40", "a full
  box", never a count she must keep) · `planting` (a date planted, and a *what to expect*: "shoots
  in March") · `paper` (becomes a to-do: `due`, `done`) · `appointment` (a `when`, no place
  photo needed). `details` holds what the AI read off the label.

Everything the UI shows stays a query over sightings. *Do I have #8 galvanized?* is a search
over `details`. *What's due?* is `paper` + `appointment` by date. **Nothing already stored
changes;** every existing doc is `kind: object`.

**Priyanka's objection:** `stock` invites the inventory-app trap of counts that are always
wrong. She wants quantity as words the AI reads ("100 ct box", "half full"), never a number to
keep up to date. **Maya and Dan agree; recorded.**

## 5. The setup conversation: how the tool configures itself

### 5.1 Principles (Devin's conditions, accepted by the board)

- **Five questions, answered once, by whoever sets it up**: Leila herself, or Nisha for
  Evelyn, or Robert for Margaret. Margaret is never quizzed. The "never asks her anything" rule
  survives because the person answering is the one setting it up, and every answer can be
  changed later in one place.
- **Answers turn things on; they never add to one screen.** Each answer enables a *module*
  (things · stock · boxes · garden · papers · appointments). Home shows only enabled modules.
  Margaret's configuration is things only, and her Home is today's Home.
- **The tool keeps listening after setup.** Thirty photos of fasteners → *"Looks like you're
  organising a workshop — show them as a parts list?"*, offered once, never repeated.
  Configuration by evidence beats configuration by questionnaire (Maya).
- **No diagnosis is asked, ever** (Dr Kim). The questions are about *what to keep track of* and
  *who helps*, never about memory.

### 5.2 The questions (draft copy; Devin owns the words)

1. **What would you like help keeping track of?** (choose any)
   Everyday things I put down · Tools and supplies · Boxes in storage · My garden · Papers
   and bills · Appointments
2. **Who is this for?** Me · Someone I help (→ *their name*)
3. **Does anyone help you with this?** Someone I live with · Family who visit · Family far
   away · Not right now
4. **Where are your things?** (choose any; each becomes a top-level place)
   At home · Garage or workshop · A storage unit · The garden · Somewhere else…
5. **How big should the words be?** (three sample lines; tap the one that reads easily)

What each answer sets:

| Answer | Turns on | Home shows | Logging defaults |
|---|---|---|---|
| Everyday things | things | the grid (today's board, H1 A as a style) | single shot → place guessed |
| Tools and supplies | stock, sessions, labels | search-first with a parts list (H1 F/B) | session mode; AI reads labels |
| Boxes in storage | boxes (movable places), labels | a list of boxes, each with its contents count and where it is | "packing a box" session; print labels |
| My garden | plantings | a list or map of beds; *coming up soon* | packet + spot, two shots |
| Papers and bills | papers → to-dos | a **Today** band: what needs doing | photo of the paper → one-line confirm |
| Appointments | appointments | **Today** band: next appointment | photo of the card / helper adds |
| Someone I help | helper setup | — | an invite for the person being helped |
| Someone I live with / family | invites | — | the invite, suggested at the end of setup |

### 5.3 The five, configured

- **S1 Margaret + Robert:** things only. Home = today's board. Robert invited, *Can help*, and he
  logs most of it. Nothing new on her screen. (This is the configuration every other one must not
  break.)
- **S2 Dan:** tools and supplies, garage + crawl space. Home = *Where is my…* first, then shelves and
  bins. Logging = sessions and labels. The killer question, *do I have #8 galvanized?*, is answered
  from the label text, with the photo of the bin.
- **S3 Leila:** boxes, storage unit. Home = the boxes. Logging = one packing session per box,
  labels printed on day one. Her partner can help. The answer names the box *and* where it sits
  in the locker.
- **S4 June:** garden. Home = the beds. Logging = packet + spot in autumn. In spring: *coming up
  soon: tulips, north bed, by the fence* and the packet photo beside the spot. That is what stops
  her pulling the seedling.
- **S5 Evelyn + Nisha:** papers, appointments, everyday things. Home = a **Today** band (next
  appointment, what needs doing) above her things. Nisha invited, *Can help*; she adds appointments
  from far away. When Nisha visits, they open **Together** (§6) and go through the pile.

## 6. The support network: from "invite" to "stitching people together"

Today's model (09-19, Drive-style: owner, *Can see* / *Can help*) is the plumbing. The five
scenarios show what it is *for*:

- **Logging for someone** (Robert, Nisha): exists for things; extends to papers and dates.
- **A shared to-do list with a person on each item** (S5): "Nisha will call the insurer" / "Mum
  will find the notice". Assigning is *Can help*; only the owner removes.
- **Together** (S5, and useful to S1): a sitting-down mode for when Nisha visits. It shows what's
  piled up since last time, one card per item: *done · Nisha takes it · later*. It turns the
  visit Ravi described into a list that is finished at the end of it.
- **Appointments with a second pair of eyes** (S5): Nisha sees Evelyn's appointments *if Evelyn
  shares them* (Dr Kim: her diary is hers; opt-in like the status line). The phone call that
  checks becomes a glance. The reminder itself needs the native app (§3, Priyanka).
- **Lending** (S2): *"Who has the drill?"* A thing can be sighted at a person. That's cheap given
  sightings; it is the one network use that is not family.
- **Must-never, restated** (Dr Kim): no alerts about her to others, no activity reports, nothing a
  helper sees that she didn't choose to share.

**The split:** Maya wants **Together** in the first build, because it is the S5 moment and the most
*visible* network value. Devin wants **appointments first**, because a missed PT appointment has a
real cost and Together is a nice-to-have. Robert and Nisha side with Devin; Linda and Dr Kim with
Maya. **Unresolved; for Ravi.**

## 7. So what happens to the home screen

It stops being one screen. **Home = a Today band (only if papers or appointments are on) + the
view of the enabled modules, each drawn in the shape its scenario needs.** The H1 layouts fall
into place as those views, not as rival designs:

| Module | Natural view | From H1 |
|---|---|---|
| Everyday things | photo grid | A (Album) / today's board |
| Tools and supplies | search-first + list with details | F (Ask First) + B (Index) |
| Boxes | list: box · contents · where it is | B (Index) |
| Garden | beds, then plantings with *expect* dates | new |
| Papers, appointments | the Today band | C's note, without the greeting |

**Whose ReCall** (Ravi, 09-23) still holds in every configuration; the status band (H1 F) is the
board's lead candidate. The styles Ravi suggested (grid density, list vs grid, dark) move to
Settings as per-person preferences, never the thing that decides the product.

## 8. Where the boards disagree (not a consensus)

1. **Broaden at all?** Dr Kim, Harold, Dan and Leila: yes; it destigmatises and grows the market.
   **Devin: yes, only with configure-never-accumulate.** Maya: yes, but through the Kano work, not
   around it. **Priyanka: not yet.** The one loop (log → find) has never been tested by a real
   Margaret for a week; adding five modules before that is building for nobody. She would ship
   *sessions* and *label reading* (they speed up S1 too) and wait on the rest.
2. **Which scenario leads the next build.** Maya: S5 (it has the network, the most daily pain and
   Tanya's person in it). Sam: S3 (boxes + labels exercise the place hierarchy, which everything
   else needs). Robert: S1, finish what exists. Noor: S4 ("the garden is the one people will
   *love*").
3. **Native wrapper now?** Priyanka and Sam: yes, it decides whether §3.1 is reachable at all. Maya:
   yes if under a week. Devin: only after the setup flow is designed, so the wrapper's lock-screen
   entry points are designed too, not bolted on.
4. **Questionnaire vs evidence.** Devin: five questions, then the tool adapts. Maya: skip the
   questions; start everyone on *things* and let evidence switch modules on. Dr Kim: questions,
   because a person who gets a garden screen she didn't ask for feels watched.
5. **Stock as numbers.** Dan wants counts. Priyanka, Maya: words from the label only. Recorded above.

## 9. What I propose to draw next (for approval before drawing)

No layout until you say go. When you do, rendered from the real stylesheet as before:

1. **The five logging flows, timed**: S1 single thing, S2 a garage session with label reading, S3
   packing a box with a QR label, S4 packet + spot, S5 a bill and an appointment. Every tap is
   counted against §3.1, and each flow is a strip of phone frames.
2. **The setup conversation**: the five questions as screens, and the five resulting Homes side by
   side (§5.3), so you can see one app configured five ways.
3. **Together** (S5): one visit, from the pile to the finished list.

Engineering spikes that would de-risk it, in parallel, with no app change: (a) `tagPhoto` reading
label text on real photos of a screw box, a seed packet, a bill and an appointment card, and how
accurate it is; (b) a one-day Capacitor wrap to measure launch-to-shutter time natively.

## 10. Rulings for Ravi (and Tanya)

1. **Broaden ReCall** to the household's memory, with memory loss as the hardest case? (Tanya, §0)
2. **Adopt the dimensions (§2) and the two model additions (§4: movable places, `kind` +
   `details`)** as the basis for design?
3. **The logging targets (§3.1)**: right numbers? And accept that they push the **native wrapper
   to next**?
4. **Setup: five questions (§5.2), or evidence only, or both?**
5. **Which scenario leads the next build** (S1 · S2 · S3 · S4 · S5), and **Together or
   appointments first** (§6)?
6. **Draw §9's three sets next?** And run the two spikes?
7. **The H1 layouts become Settings styles**, parked until the module views exist. Confirm?

---

## Addendum (Ravi, 09-24): S6, cataloguing a home for insurance

A household records what it owns, room by room, so that after a fire, flood or burglary it can
prove what was there. This fits the model with no new object:

- **Logging:** a room-by-room sweep with *Everything in view* (MVP #8; `design/BOARD_2026-09-24_fast-capture-options.md`,
  option 3). Each thing gets its photo and room.
- **Details the AI reads** (#9): brand, model and serial number from the label; a receipt photo
  attached to the thing (purchase date, price).
- **The new part:** an **export**, a dated inventory (PDF, and CSV for the insurer) with photos, rooms
  and any values the person entered. It can be regenerated at any time, and the cloud copy survives
  losing the house.
- **Boards:** Maya: the most *paid-for* scenario of all (people buy inventory apps and services
  for this). Dr Kim: values and serial numbers are sensitive, so export stays owner-only and
  *Only me* applies. Priyanka: the export is ~2 days once #8 and #9 exist. **After the MVP.**
