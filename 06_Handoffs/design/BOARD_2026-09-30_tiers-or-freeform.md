# Tiers or freeform? — two new boards (2026-09-30) · for Ravi and Tanya to decide

Ravi, 09-30 (after his phone test of `20260930c`): *"Are we making this too complex and is there a more freeform mechanism
that is more likely to remain accurate that should be adopted? … what if it is moved to tier-2 (glove-box) of tier-3
(tesla car) in tier-4 (outside street parking spot). Then changing tier-2 makes the original tier-3 and tier-4
nonsensical."* Then: *"I want you to run it by a brand new technical and end-user board so there are fresh
perspectives."* Both boards are new people (no earlier names), briefed with the same neutral brief
(`design/BOARD_2026-09-30_tiers-brief.md`), and met separately. The options on the real screens:
`design/mockups/OPTIONS_2026-09-30_tiers-or-freeform.jpg`.

## Ravi's direct question, answered plainly

**Does changing tier 2 make tiers 3 and 4 invalid?** Not in what is stored. "The red bookshelf is in the garage" is a
fact about the bookshelf, and stays true. When the 3D model goes into the glove box, the tiers above it become the glove
box's own chain (Tesla, street). The bookshelf and garage are not wrong. They are simply no longer above this item.
**On the screen, yes, it looks that way.** Today's Move it lets you edit other things' places from inside one item's
Move. It also doesn't say which one you are changing. That is the flaw Ravi hit, and both boards agree it is real.

## Both boards at a glance

| | Tech board (5) | User board (6) | Total first choices |
|---|---|---|---|
| **A · one question per Move** | Rosa (PM), Olu (data) | Marcus (parent, 2 cars), Carmen (moving house) | **4** |
| **B · editable tiers, labelled** (built in `d`) | Kenji (design) | Oscar (storage unit + crew) | 2 |
| **C · freeform** (Ravi's idea) | Walt (QA, skeptic) | Doris (78, mild memory loss), Aiyana (dorm student) | 3 |
| **D · a hybrid** | Hannah: A + an optional note | Tobias (sets it up for his mom): say it, ReCall builds the chain, tap ✓ | 2 |

D was the second choice of 5 of the 11 members (Rosa, Olu and Walt on the tech board, Doris and Aiyana on the user board).

**Where both boards agree:**
- Moving a box or a car once, with everything in it following, is the thing freeform can't do. With C, a car of 21
  things goes stale in 21 places at once. Moving house is when ReCall is needed most, and it's exactly when text goes
  stale in bulk (Carmen).
- Changing a car's place by tapping a square on some OTHER item's Move is backwards (Marcus, Rosa). Even the builder
  did it by mistake.
- "Place vs box" confuses everyone. The two boards couldn't agree whether the Tesla has to be a place or a box. (In
  today's model it can be either, and a place moves with its contents too.) All six users think a car is simply "a
  thing that holds things".

**Where they split:**
- **Stale outer tiers.** Walt: nobody will Move the Tesla, so A says "in the garage" confidently and wrongly. Olu:
  then it's wrong in one record, with a date, not in 21 sentences. Marcus: the stale part is the part I already know.
  Oscar and Tobias: for my crew and my mom, the outer part IS the answer.
- **Own words.** Doris: *"I remember my own words. I don't remember what I named a shelf."* The users who would speak
  or type fast chose C. Tobias's D keeps their words on screen and builds records underneath.
- **Where to fix it.** Oscar: fix it where you notice it (B, clearly labelled). Marcus: *"A label I have to read is a
  label I skip."*

## Claude's recommendation (the boards didn't converge; this is mine)

1. **Now (`d`):** keep B's labels. They fix the bug Ravi hit today: the tier is ringed, and Choose place shows the
   whole chain and says what comes off.
2. **Next:** **A**, plus Hannah's **optional note**. Move it asks one thing: what is it in now. A NEW place asks once
   "what's the glove box in?", and Skip is fine. A box, car or room is moved from its own page, and everything in it
   follows. The note holds what a chain can't ("under the spare cables, at the back"). The data stays as it is, so
   nothing needs migrating.
3. **Later, on top of A:** Tobias's **"say it"** (D). It suits Doris-type users, and it writes into the same records.
   Walt's staleness worry is answered by the dates we just built. The item page now says "moved … · last seen …" and
   "moved with the White cardboard box"; the same could go on each tier.
4. **Not C.** It loses carry-along, "what's in the garage?", the place pages, merge and camera recognition of places.
   Going back would mean re-reading every sentence.
5. **Separate question:** drop "place vs box" for people. There would be one idea, "it can hold things", and ReCall
   keeps the difference to itself.

## What Ravi and Tanya decide

1. **Records or sentences:** keep "move the box or car once, everything inside follows" (A/B/D), or switch to
   freeform (C)?
2. **What Move it changes:** only what the item is directly in, with outer tiers changed from that place's own page
   (A/D)? Or the whole chain on one screen, labelled (B, as in `d`)?
3. **Words:** add an optional note? Later, "say it and ReCall builds it"? And drop the place-vs-box split for users?

---

## Tech board: keep the chain of places, or go freeform? (2026-09-30)

Ravi's 09-30 challenge (BRIEF.md): Move it doesn't say which tier you're changing, and changing a middle tier can make
the outer tiers "nonsensical". Should an item just have free text plus photos? A new board; earlier boards read for
context only.

**What we saw in the screenshots.** Shots 3 and 4 (Choose place for tier 2 and tier 1) are the same sheet except for a
small "Current place" tag; neither says which tier it is for. Shot 4 lists the White cardboard box
as "nothing here yet" while the 3D model is in it. The Places list holds test leftovers ("A place", "Desk dra",
"In air"). Shot 1 says "Tap + to add what the in air is in" on the 3D model's own Move, so a Move of one
item is asking about a fifth object. Shots 1–2: rooms inside rooms, unchallenged.

### The board

- **Rosa Albrecht, product manager.** Ten years on consumer photo and notes apps. "Every extra question on a logging
  screen costs you a user."
- **Kenji Morimoto, interaction designer.** Camera and checkout flows. "Show the whole state; never hide the lever."
- **Olu Adeyemi, data and sync engineer.** Offline-first apps and shared family calendars. "Store each fact once, in
  the record it belongs to."
- **Hannah Lindqvist.** Four years on a home-inventory app for insurance claims, then bin tracking for a moving
  company.
- **Walt Brennan, QA lead and the skeptic.** "Count the bugs a design lets in, not the ones it fixes."

**D, Hannah's hybrid ("A plus a note").** A's one-question Move, plus an optional free-text line on the item ("behind
the owner's manual"), shown under the answer and searched by Find. A chain deeper than 3 asks "Living room is inside
Dining room — right?" before it saves.

### The example, walked through every option

In the model, the 09-29 rule "outside a place there are only places" forces the Tesla to be a *box*, because it moves
with what's in it. So is the glove box, because it's inside the Tesla. The street is a place.

| Step | A · one question | B · clear editable tiers | C · freeform | D · A + note |
|---|---|---|---|---|
| **2. 3D model → glove box, Tesla, street (first time)** | 3D model → Move it → photograph the glove box → name it → "What's the glove box in?" → photograph the Tesla → name it → "What's the Tesla in?" → pick Street → Save. About 8 taps and 2 short names. The tin box is untouched and stays true. | Move it → square 1 (tin box) selected, labelled "changing: what the 3D model is in" → photograph the glove box. The old tiers vanish → + Tesla → + Street → Save. Same taps as A. Trap: tap square 2 and the *tin box* moves to the Tesla; only the warning line stops it. | Move it → type or say "glove box of the Tesla, parked on the street" (about 45 letters) → optional photo → Save. About 3 taps. The fastest first time. | As A, plus optional words. |
| **3. A week later: Tesla into the garage; 20 things in the trunk** | Open the Tesla → Move it → pick Garage → Save. 4 taps, and all 22 things follow. Putting 20 things in: one put-away batch (09-25), about 23 taps. | As A, or from any item by changing its Tesla-level square. That works if you understand it. | No Tesla record. 21 texts still say "street"; fixing means 21 edits, so nobody does. The 20 trunk items need 20 texts. | As A. |
| **"Where's the 3D model?"** | "Glove box, in the Tesla, in the garage", with photos. **True.** | True. | "…parked on the street". **Outer part false.** | True, plus the note. |
| **"What's in the garage?"** | Garage page: the red bookshelf and the Tesla, each with "N inside". **True.** | True. | Search finds texts saying "garage"; misses the 21 Tesla items and anything typed as just "tin box". **Incomplete.** | True. |
| **"What's in the Tesla?"** | Tesla page: glove box (3D model) and 20. **True.** | True. | A search for "Tesla" misses "the car" and "Model 3". **Depends on spelling.** | True. |
| **Camera: photo of the glove box** | Compares it with the glove box's own photos: "Is this the glove box?" Knows its chain. | Same. | No place records; matching every item's photos is new work and brings back old text. | Same as A. |
| **True without extra work?** | Yes, except the car's own outermost spot. It is one record, with a "seen" date. | Yes, if nobody taps the wrong square. | No. Every container move leaves copies of old text behind. | As A. |

**Existing data.** A, B and D need no migration, because only screens change. Ravi's rooms-in-rooms test chain needs clean-up. C is a one-way flatten: each chain becomes a sentence, and place photos are copied onto each
item. The Places list, merge, "what's in" pages and camera recognition go. Going back later means re-reading every
sentence with the AI.

**Build work (rough).** B is smallest (labels, a chain on the Choose place sheet) but keeps the most complex
screen. A is a few days: one-question Move it, read-only chain, the "what's it in?" prompt, tap-through. D is A plus
about a day. C is the largest: migration, new Find, removing Places and pages, rebuilding or dropping camera
recognition, and redoing most rig audits.

### Positions

**Rosa: A.**
- *Strongest argument:* Move asks the question a person is actually asking: "I put it in the glove box." Where the
  Tesla is was never the 3D model's business.
- *What she'd lose:* building a whole chain in one go from any item.
- *What would change her mind:* testers told "the car is in the garage now" re-Moving items instead of opening
  the car.

**Kenji: B.**
- *Strongest argument:* Ravi's own words: "both pages should show the current tier hierarchy and be clear which tier is
  being changed." A hides the lever two screens away. "Where do I go to fix the Tesla?" is a new way to get lost, and
  09-27 already counted 6 screens that set "where".
- *What he'd lose:* Move it stays the hardest screen in the app.
- *What would change his mind:* if 1 person in 5 still wipes a chain in a hallway test of B with labels.

**Olu: A.**
- *Strongest argument:* Ravi's "nonsense" is on the screen, not in the data. Tiers 3 and 4 belong to the tin box. When
  the 3D model moves, those tiers come from the glove box's record instead, so they can't go stale. C is the only
  option where facts are copied, and copies rot.
- *What he'd lose:* nothing in data. He accepts A's extra hop.
- *What would change his mind:* if real logs show containers almost never move.

**Hannah: D.**
- *Strongest argument:* In her insurance app freeform came first; 400 items said "garage", so Find answered
  "garage". The top question after a move was "what's in X?", which free text can't answer. But people also wanted
  "behind the manuals", which no chain holds.
- *What she'd lose:* a little screen space for the note.
- *What would change her mind:* if nobody uses the note in two weeks. Then it's plain A.

**Walt: C.**
- *Strongest argument:* Count them: T1–T8 on 09-29, the loop bug on 09-27, "A place", "Desk dra", "In air", rooms in
  rooms, and a current place that says "nothing here yet". Structure invites wrong structure, and the app then states
  it confidently. A freeform line is stale in *your own words, with a date*, and you judge it.
- *What he'd lose:* "what's in the Tesla" and the carry-along. He admits it.
- *What would change his mind:* if A ships and after two weeks of Ravi's real use the Places list is clean and no
  chain is wrong.

### The disagreements

**1. Is a stale car still a lie? (Walt vs Olu and Rosa)**
- **Walt:** "The Tesla moves daily. Nobody will Move the Tesla. So A says 'in the garage' with a photo and a
  confident chain, and it's wrong. That's exactly C's staleness, dressed up."
- **Olu:** "In A it's wrong in *one* record with one 'seen 9 days ago'. In C it's wrong in 21 sentences, with no single
  place to fix it."
- **Rosa:** "And the durable part, 'in the Tesla', is right in A. The street is the least useful tier."
- **Walt:** "Then don't store the street at all. That's my point: store less."

**2. Where does the lever live? (Kenji vs Rosa)**
- **Kenji:** "A's rule, 'to move the Tesla, go to the Tesla', is correct and invisible. The user is looking at the 3D
  model."
- **Rosa:** "B's rule, 'tap square 3 on a different item to move a car', is visible and baffling. Ravi made the error
  B relies on people not making, on his first try, as the builder."
- **Kenji:** "He made it because nothing was labelled." **Rosa:** "Labels were the answer on 09-29 too."

**3. Glove box as an "item that holds items". (Hannah vs Olu)**
- **Hannah:** "The 09-29 rule makes the user log a glove box as an item. Nobody thinks of it that way. Let fixed
  places ride inside a moving thing."
- **Olu:** "Then a place can move, and 'place' stops meaning anything. Show the word 'box' less; don't change the rule."
- This is unresolved.

**4. Sharing a house. (Walt vs Olu)**
- **Walt:** "Tanya moves the Tesla and Ravi's 3D model moves without Ravi knowing. That's a surprise, not a feature."
- **Olu:** "It moved *because it's in the car*. Tell Ravi on his next Find ('moved with the Tesla, by Tanya'); don't
  block it."
- **Walt:** "In C, nobody's text changes under them." **Hannah:** "And nobody's text is right."

**5. Does "freeform with auto-links" rescue C? (Walt vs Olu)**
- **Walt** floats it: free text, and if it names a known box, link it.
- **Olu:** "That was 09-24. Matching names broke on a thing called 'Desk', and 09-25 moved to stored links for that
  reason."

### Vote

| Member | First choice | Second choice |
|---|---|---|
| Rosa | A | D |
| Olu | A | D |
| Kenji | B | A |
| Hannah | D | A |
| Walt | C | D |

**First choices: A 2, B 1, C 1, D 1.** No majority. D is the second choice of three members; C's only vote is
Walt's.

### What Ravi and Tanya must decide

1. **Is "move the box, everything inside follows" worth keeping?** The Tesla carries 21 things in 4 taps. If yes, C is
   out. If no, C is back on the table, with the staleness walked through above.
2. **Where do you change where a container is?** Only from the container itself, with one question per Move (A or D).
   Or also from inside any item's Move, with every tier labelled (B)?
3. **How much should a "where" hold?** Should there be a free-text note beside the place (D)? And should things that
   move all the time, like a car or a bag, stop at "in the Tesla" instead of asking where the Tesla is?


---

## User board: tiers or freeform? (2026-09-30)

Six new users, each walked through the Tesla example and their own life on shots 1–5. Ravi and Tanya decide.

**Option D (added by Tobias): say it, ReCall builds it.** Move it takes one sentence, typed or said ("glove box of the
Tesla, on the street"). ReCall splits it into Glove box ▸ Tesla ▸ Street, matching places you already have. You see
the result and tap ✓. Moving afterwards works like A.

### The Tesla example, as the board saw it

- **A.** Step 2: Move it → photograph the glove box → name it → "What's the glove box in?" → pick or photograph Tesla →
  skip "What's the Tesla in?", or pick Street. (4–6 taps, one name typed). Step 3: tap *Tesla* in the model's
  chain → Tesla's page → Move → photograph the garage → "Is this the Garage?" → Yes. The 20 trunk items follow with no
  extra work. Step 4: every answer is true. The camera knows the glove box. **Catch:** under the 09-29 rule ("outside a
  place, only places") the Tesla has to be a *place*, even though it drives away.
- **B.** Step 2: the same as A, and the screen warns "Red bookshelf and Garage leave this item's where." Step 3: to move
  the car you open some item in it, select the **Street** square, and change it to Garage. The screen says "changes
  where the Tesla is". The answers stay true.
- **C.** Step 2: type the sentence and take a photo. Step 3: nobody edits 21 sentences, so all 21 still say "street".
  Step 4: "where's the model?" gets a stale but usable answer. "What's in the Tesla?" finds only items where they
  typed "Tesla", not "the car" or "Model 3". "What's in the garage?" misses the car. The camera can't say "Is this the
  glove box?" because there are no place records.
- **D.** Step 2: one sentence, then ✓. After that, the same as A.
- **Existing data.** A, B, D: no change. C flattens every chain to a sentence and drops place pages, merging and photo
  matching, one way.

### The members

**Doris Achterberg, 78.** Lives alone in a condo and has mild memory loss. Her daughter set up ReCall.
- *Own life:* the spare key is in the blue bowl on the hall table. On shot 2 she read "Tap + to add what the foyer at
  the front door is in" three times. "The foyer is in the foyer." She'd never tap +.
- *Position:* **C**, because she'd *say* it, not type it. "I remember my own words. I don't remember what I named a
  shelf."
- *Strongest argument:* hearing her own sentence back is the cue that brings the memory back. A list of places isn't.
- *What she'd lose:* the camera's reassuring "Is this the kitchen drawer?".
- *Would change her mind:* D, if ReCall repeated her words back instead of its tidy chain.
- *Stale answers:* she wouldn't notice.

**Marcus Oyelaran, 41.** Three kids, a garage, a minivan and a Civic. He shares ReCall with his wife.
- *Own life:* the soccer bag lives in the minivan's trunk, and the minivan is in the garage or at practice. Under A he
  logs "Trunk" once, answers "what's the trunk in?" with Minivan, and skips "what's the minivan in?". "I know where my
  van is." He'd never type a sentence.
- *Position:* **A**.
- *Strongest argument:* the thing you tap is the thing that moves. When his wife moves the kids' bin to the attic,
  every cleat in it follows.
- *What he'd lose:* nothing, as long as the outer question can be skipped.
- *Would change his mind:* if "Is this the glove box?" keeps mixing up the two cars' glove boxes.

**Aiyana Redcloud, 19.** Sophomore in a dorm. She packs out every May and August, and her stuff goes to her mom's
basement.
- *Own life:* on shot 3 she spotted "Desk dra", "A place" and "In air" in Ravi's list. "That's my list by October,
  times ten." In May her dorm places are dead, and nobody deletes them. She types fast: "blue bin, under bed."
- *Position:* **C**.
- *Strongest argument:* places churn. Text never needs cleaning up, and her photos show the bin.
- *What she'd lose:* "what's in the blue bin?" when she's packing, and she admits she wants that.
- *Would change her mind:* A, if she could retire a whole place ("dorm room 314") in one go and move what's in it
  with a single Move.

**Tobias Grünewald, 52.** He sets ReCall up for his mother across town and checks it on Sundays.
- *Own life:* his mom's hearing aids, pills organiser and checkbook. He built "Top drawer ▸ Dresser ▸ Bedroom" for her.
- *Position:* **D**.
- *Strongest argument:* people talk in sentences, and search needs records. D takes her words, stores the records,
  and lets him fix the dresser once from his own phone.
- *What he'd lose:* in D, a wrong split ("Tesla parked" as a place name) that his mom accepts without reading.
- *Would change his mind:* if the split is wrong more than once in ten, he'd fall back to A.
- *Stale answers:* he'd notice them first, on Sunday, and wants to fix them in one place, not in 30 sentences.

**Carmen Ibarra, 36.** Moving house in three weeks. She has boxes inside boxes.
- *Own life:* the chargers are in a shoebox, in Box 12, in Box 3 (a wardrobe box), on the truck, then in the new
  garage. Under A the truck day is one Move: Box 3 → Truck, and 40 things follow. She understands "a place inside a place" instantly: "that's what a box is."
- *Position:* **A**.
- *Strongest argument:* moving is when you most need ReCall, and it's exactly when text goes stale in bulk.
- *What she'd lose:* nothing. She finds B's editable ladder frightening. "I changed one square and lost two."
- *Would change her mind:* nothing on the example. She would reconsider if "place" versus "box" blocks her from
  putting a place (the closet shelf) into a box (the truck).

**Oscar Mensah, 58.** Runs an event-rental business (linens and chafing dishes) with storage unit 118 and a van.
He has two part-time crew.
- *Own life:* bin 4 on shelf C, in unit 118. When he finds bin 4 on shelf A, he wants to fix
  it from the *linen's* screen, where he is standing, without hunting for the bin's page.
- *Position:* **B**.
- *Strongest argument:* the fix happens where you notice it. With every tier shown and the changing tier named ("You
  are changing where BIN 4 is"), one screen does it.
- *What he'd lose:* nothing, if labels are literal.
- *Would change his mind:* watching his crew use it. If they break the chain twice, A.
- *Stale answers:* he notices them, but his crew don't know which unit, so a stale outer level costs him a drive.

### The disagreements

**1. Text or records: Aiyana vs Carmen.**
- Carmen: "Truck day, 40 things. You retype 40?"
- Aiyana: "I don't retype. It says 'blue bin' and I know where the blue bin is."
- Carmen: "Until you have six blue bins."
- Aiyana: "Then your list has six 'Blue bin' places, plus 'Desk dra'."
- Neither moved.

**2. Whose words: Doris vs Tobias.**
- Tobias: "Mom will say 'the drawer'. Which drawer?"
- Doris: "The one I use. I know which."
- Tobias: "You won't in March, and then I can't find it either."
- Doris: "Then let me say it, and you tidy it." That's D, but Doris wants her words to stay what she sees.
- Tobias is fine with that as long as the records exist underneath.

**3. Which square moves what: Oscar vs Marcus.**
- Marcus: "In B, to move the car I tap *Street*. That's backwards. Ravi built this and still changed the wrong
  square."
- Oscar: "Label it and it's fine."
- Marcus: "A label I have to read is a label I skip."
- Carmen sided with Marcus.

**4. Does a stale outer level matter?**
- Marcus: "The out-of-date bit is always the car or the room, and that's the bit I already know." So skipping the
  outer levels is fine, and C's staleness is harmless too.
- Oscar: "My crew don't know which unit. For them the outer level *is* the answer."
- Tobias: "Mom doesn't know which room the bowl got moved to. The outer level matters to her."
- This splits by who is asking: the person who put it there, or someone else.

**5. Should "what's in the garage?" include the Tesla's glove box?**
- Carmen: yes. On moving day the truck's contents *are* "in the new garage".
- Marcus: no. The car leaves in the morning, so "in the garage" is true for an hour.

**6. Place or box?**
- The 09-29 rule makes the Tesla a *place* and the soccer bag a *box*. All six think a car is "a thing that holds
  things", and nobody could say why it isn't a box.
- Carmen: "Don't make me choose, ever."

**7. What they saw on the real screens.**
- Shots 1–2: the chain is five tiers, but only two squares show. Nobody could tell which square "Choose place" would
  change.
- Shot 4 marks "Current place" and shot 3 doesn't. That badge is the only clue to the tier, and it's easy to miss.

### Vote

| Option | Votes | Who |
|---|---|---|
| A · one question per Move | 2 | Marcus, Carmen |
| B · editable tiers, labelled | 1 | Oscar |
| C · freeform | 2 | Doris, Aiyana |
| D · say it, ReCall builds the chain | 1 | Tobias (second choice for Doris and Aiyana) |

Only Oscar picked B first. Counting second choices, D has the widest support. C's two votes come from people who would *speak* or *type*.

### What Ravi and Tanya must decide

1. **Records or sentences?** Is "move the box or the car once and everything inside follows" worth keeping place
   records (A, B or D)? Or are clutter and churn worse than 21 stale sentences (C)?
2. **What can Move it change?** Only what the item is directly in (A and D, with outer levels changed from that
   place's own page)? Or the whole chain on one screen (B)? And may outer levels be skipped and left blank by default?
3. **Can people say it in their own words?** If so, does ReCall turn the words into records (D)? And whose wording
   does the answer show: theirs, or the tidy chain? Related: drop the "place vs box" split for things that move
   (cars, trucks, bags)?

