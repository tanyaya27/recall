# Two ways to say "where": the boards on Tanya's 10-01 proposal · for Ravi and Tanya to decide

Tanya's proposal: an unstructured way (photo + her words; ReCall's analysis on the side, never acting) and a structured
way (containers, up to 3 levels shown), chosen item by item, on one store, so switching rewrites nothing. Two boards
critiqued it: the regular boards (Maya, Devin, Priyanka, Sam; Margaret, Robert, Priya — a first pass, then an addendum
after Tanya's clarifications) and the adversarial board (Grace, Tomás, Frank, Mei, Sunil). Full texts follow below.

## What Ravi and Tanya decide (Claude's recommendation first)

1. **Is a "mode" anything more than "is it in something?"** Both boards: no mode setting, ever. An item with an open
   "in" link is structured; one without is words. Nobody is asked to choose a mode.
   *Recommend:* agree — drop the word "mode" from the app; the camera's one **In:** chip is the switch.
2. **When she logs words on an item that's in a box — does it leave the box?** (Adversarial: yes, a new log closes the
   old link unless she picks one. Regular: or ask "Still in the Wooden box?" — Devin: that's a camera question again.)
   *Recommend:* neither rule nor question. A boxed item's camera opens with **In: Wooden box** already set; Save keeps
   it; she taps ✕ on the chip to take it out. What she sees is what is saved.
3. **Where does ReCall's analysis show, and when does it ship?** Most of both boards (Maya dissenting): after Save, on the
   item page, tied to its photo — not on the camera, because a late answer on the camera *is* build f's worst bug. It reaches the camera
   only after two clean tester rounds.
   *Recommend:* release 1 without any AI; the analysis is release 2 on the item page; the camera later, earned by the
   tester. This holds back part of Tanya's "as much as possible on the camera" — deliberately, for now.
4. **Photos of her home sent to the AI.** Both boards: the analysis names what's in the background (pill bottles,
   passports, mail). Before it ships: a plain statement of which photos go to the AI service and whether they're kept;
   a house switch; "Don't look" per item; private items analysed for their owner only. "Training" means her
   corrections kept as notes in her house, never a model trained on her photos.
   *Recommend:* agree; Claude checks the AI provider's retention terms before release 2.
5. **The 3-level cap.** 8 of 12 (Robert and Mei: no cap; Priyanka: hard cap; Frank abstains): show 3 (+ "+2 more"),
   store any depth; never refuse a move. Moving the
   Tesla into a garage that's in "House" makes a 4th level nobody built.
   *Recommend:* agree.

## What both boards would ship

**Release 1 — "Words, and one pick"** (Priyanka: mostly removal; about 4–5 builds, ~150 new checks; no data migration)
- **Camera:** shutter · + photo · words (typed or said) · one optional **In:** chip (recent, search, new by name) · Save.
  The chain shows read-only. **Off the camera:** the tier row and +, editing any level above the first (it's on each
  box's/place's own page), "This photo is…", photo matching, Before → Now (becomes "✓ In the Wooden box · Undo").
- **Containers** are built and moved on their own pages; contents follow.
- **Find:** a linked item → its chain; a words item → "You said '…' · Sep 30" with the photo. "What's in the garage?" →
  *Linked*, then *Mentioned in your notes*.
- **Data (Sam):** her words and photos kept as given (a log entry per capture, never rewritten); links made only by
  people; existing items read as structured with their old place text as the first entry.
- *Gate:* two builds in a row with no tester find that changes the store; every camera control visible at Largest on a
  small phone; Undo also removes added photos (tester's f #5); two phones, newest by time taken, with who and when shown.

**Release 2 — "ReCall's take"** (read-only): a card per photo after Save ("Looks like a car glove box · also in the photo:
…"), with *Not right* (her typed fix) and *Hide*; one-tap hints ("Your note says the Tesla's glove box — put it there?
**Yes**"); converting an item by tapping suggestion chips (never pre-typed text — tester's f #2); the privacy switches.
*Gate:* 100 cancel/retake/fast-next runs with zero answers on the wrong item; 5 of 5 hallway testers (one 70+ at
Largest) read a guess as a guess.

**Later:** chat-to-correct and a "What ReCall knows about your home" list she can delete from; converting many at once
as a reviewed list; "Is this the glove box?" on the camera; a read-only house outline; a drag-and-drop tree on a laptop
or iPad.

**Cut (both boards):** a mode picker; any AI write; a draggable tree on the phone; "suggestions on how to improve the
organization" (Margaret: "don't tell me how to keep my house"; Mei: "that's my job"; Maya alone: later, opt-in).

## Where they still split

- **The default for a new item.** Regular 5–2: words + photo, In: closed. Adversarial 2–2: Grace and Frank (In: closed)
  vs Tomás and Mei (In: open, with Skip). *Recommend:* In: closed for a new item, open (pre-set) for a boxed one.
- **The analysis in release 1.** Tomás and Maya: read-only after Save is harmless and gives the AI a reason to exist on
  day 1. Grace and Priyanka: not until trust and privacy have a gate.
- **Chat.** Margaret would chat all day ("that's the worry"); Robert never would. Frank: "If I told it, it's done" —
  Grace: "then the AI acted; it needs a Yes."
- **Words-only items in a structured box go stale** when the box moves (the card's note still says "crawl space").
  Margaret: "Don't fix it, just tell me" → Find adds "The memorabilia box moved to the Garage, Oct 4 (Daniel)". Release 2
  can offer "put it in the box? Yes".

## What it does to the bug pattern

Every bad tester find on c–f sat where three things met on the camera: a photo arrives, the AI answers late, any tier is
editable. Release 1 removes two of the three (no AI on the camera; one chip, no tiers). Release 2's late answer lands on
the item page, keyed to its photo: it can show something odd, never file something wrong. (Grace, Priyanka, Devin.)

---

# Appendix A — Adversarial board


Grace (PM), Tomás (auditor), Frank (67), Mei (34, organizer), Sunil (72, Largest text). Replaces our earlier pass.

## What's strong now
- **"Guesses never act."** This kills our worst earlier attack, the unwatched background writer.
- **One store, two views.** No migration: existing items are linked items, and `how:` and her place words already exist.
- **Per item, not per person.** One house, one truth about the car.
- **Analysis pre-fills conversion.** It saves taps and decides nothing.

## The attacks

**1. The sidebar is the late answer's new home. *(Grace)***
"Put the analysis on the camera and build f's finding 1 comes back word for word: photo 1 is cancelled, then its answer
lands beside photo 2. It can't file anything, but she reads it and taps."
- Analysis shows only after Save, on the item page.
- Every answer is keyed to its photo.
- If the photo is gone, the answer is thrown away.

**2. There is no "side". *(Sunil)*** At Largest on a 375-wide phone it's a card under the photo. "In my words' type,
I believe it." Every line needs: *ReCall's guess, not what you said.*

**3. Chat corrections that don't stick. *(Tomás)***
"I type 'the Tesla's glove box, not a love box.'
- Kept only as chat history, the next photo is a love box again.
- If the chat replies 'done, it's in the glove box', the AI acted.
- If it won't, Frank asks why Find still says street."

So a correction is stored as her dated words, and a change of where is a button ("Put it in Glove box? **Yes**").

**4. "Training" can't be shown. *(Grace)*** Nothing is trained; her corrections ride along with the next look. Show
them as *What ReCall knows about your home*, each deletable.

**5. Photos of her home. *(Grace, Sunil)***
- "Also in the photo" names what she never logged: passport, pill bottles, a cash envelope.
- Tanya's closet photo tells her sidebar about Ravi's private things.
- The "knows" list is a burglar's map.

Before any analysis ships:
- a plain statement of which photos go to the AI service and whether they're kept;
- a per-house Off switch;
- private items analysed for their owner only.

**6. A structured box full of unstructured things. *(Mei, Tomás)***
- **Mei:** "My tackle box is linked. I log a lure 'in the tackle box', words only. When the box moves, the lure stays
  behind, and 'what's in the tackle box?' misses it. Unless ReCall matches the words, and then the AI acted."
- **Tomás:** "So per-item mode is one question: *did she pick a container?* A pick is structured, no pick is not. The
  camera's **In:** pick *is* conversion."
- **Find:** a linked item answers with its chain. A words-only item answers "You said: … · date".
- **"What's in the garage?"** Linked things, then *Mentioned in your notes: 6*.
- **Move:** linked, a new container (contents follow); words-only, new words and photos, old words kept. Same button.
- **Credit:** a chain can end in her words: "Front pocket ▸ Backpack ▸ 'by the door', Sep 3".

**7. Converting one item at a time. *(Tomás, Frank)***
- Pre-fill as text in a field is build f's finding 2 (typing adds to the guess). Use chips she taps.
- The conversion screen reads the stored analysis and never waits on a live call. That removes the late leg entirely.
- A "Glove box" chip when Tanya has "Glovebox" must ask: "Same as Tanya's *Glovebox*?"
- **Frank:** "Forty items, one by one? Never." Later: "20 notes mention the Tesla trunk. Put all 20 there?", with the
  list shown, one Yes, one Undo.

**8. "Newest wins" against what? *(Tomás)***
Her note about the model (Sep 30) and Ravi moving the Tesla (Oct 7) don't conflict. Two cases do:
- **Words after a link.** She says "in my purse" without picking. The old link must close, or "what's in the Tesla?"
  still lists the model. Rule: *a new log closes the old link unless she picks one.*
- **An offline phone.** Newest means the time taken, not the time it arrived. The screen names who and when: "Tanya,
  Oct 6, 9:12".

**9. The 3-level cap. *(Mei)***
- Glove box ▸ Tesla ▸ Garage ▸ House is 4, and moving the Tesla made it, not a person.
- Her front pocket ▸ backpack ▸ hall closet ▸ bedroom is 4.
- Refusing the move makes the app lie.
- What holds: build up to 3 at a time, show 3 plus "+1 more", store any depth.

**10. "Unless it complicates" has no referee. *(Grace)*** Write the camera down; changes need Tanya's sign-off.
- **Words-only:** shutter, item photo, + photos, words (type or mic), Save.
- **With a container:** the same, plus one **In:** chip (recent, search, new by name, or skip).
- **Off the camera:**
  - every level above the first (on the container's page);
  - "This photo is…";
  - AI place matching;
  - the analysis;
  - rename.

**11. Is the bug cluster gone? *(Grace, Tomás)*** The cluster needs three legs: a photo arrives, the AI answers late,
and tiers can be edited.
- **Release 1:** no AI on the camera, and one In chip. Two legs removed, so yes.
- **With the analysis:** the late leg moves to the item page. There it can mis-*display*, never mis-file, if answers
  are keyed to their photo.
- **With chat:** it's a new camera. Same rule: no change of where without a Yes.

## The examples, with failure points

| Step | Words only | With containers |
|---|---|---|
| **Card: log it** | Photo, + box photo, mic: "wooden box in the memorabilia box in the crawl space", Save. ~4 taps. Voice may write "memory bill ya box". | Photo, In: new "Wooden box", Save; box page → Where → new "Memorabilia box"; its page → Crawl space. ~12 taps, 3 screens. **Fails if** Frank stops early: "Wooden box · where: not said". |
| **Memorabilia box → garage** | **Fails.** Nothing links card to box; Find says crawl space. (Release 2 could hint: "Your card's note mentions the memorabilia box, now in the garage. Update?") | Box page → Move → Garage, 4 taps; the card follows. **Holds.** |
| **3D model → glove box ▸ Tesla ▸ street** | Move it, photo, one sentence, Save. 3 taps. | ~10 taps over 3 pages. **Fails for Sunil:** under the 09-29 Q4 rule the Tesla must be a box, so he reads "Item: Tesla". |
| **Tesla → garage, 20 in trunk** | **Fails.** No car record; 21 notes say "street", "trunk", "the car". | Tesla page → Move → Garage; 21 follow. **Holds.** |
| **"Where's the 3D model?"** | "You said … on the street · Sep 30." Stale but honest. | Glove box ▸ Tesla ▸ Garage, "+1 more". **True.** |
| **"What's in the garage? / the Tesla?"** | Garage misses all 21. Tesla finds the notes saying "Tesla", and misses "the car" and "Model 3". | Both **true**. |
| **Photograph the glove box** | Release 2 card: "Looks like a car glove box, like Sep 30's photo." Acts on nothing. | Release 1: no recognition; it's top of the recent list, 1 tap. |

**A mixed house** (model words-only, Tesla linked): one Yes on "Your note says the Tesla's glove box. Put it there?" is
the whole conversion. Credit.

**Their lives:** Frank's "keys, truck seat" is fine until the truck moves. Mei builds the front pocket in two passes.

## The members

**Grace (PM): one camera; structure is picking a container; no AI on the camera.**
- *Strongest argument:* every build's worst find was something late changing the screen. Release 1 has nothing late.
- *What she'd lose:* "photograph the glove box and it knows", for now.
- *What would change her mind:* two tester rounds with zero wrong-photo answers on a camera chip.
- *Ships first:* release 1 below.

**Tomás (auditor): drop the word "mode"; ask "what's it in?" per item.**
- *Strongest argument:* per-item modes in mixed boxes double the paths, unless the mode *is* the link.
- *What he'd lose:* Tanya's framing.
- *What would change his mind:* words-only items in linked boxes passing Move, Find and Undo identically.
- *Ships first:* release 1 with In open by default, and Skip.

**Frank (67): never make him choose.**
- *Strongest argument:* "Every choice, I get wrong once. That once is my car keys."
- *What he'd lose:* nothing.
- *What would change his mind:* nothing he'd read.
- *Ships first:* photo, talk, Save.

**Mei (34): structure first; analysis off for her.**
- *Strongest argument:* "Organizers *are* the structure. Don't make me fight a guesser."
- *What she'd lose:* nothing, if guesses never touch links.
- *What would change her mind:* a per-house "always ask what it's in". Then she drops "two modes".
- *Ships first:* release 1, plus "+N more" depth.

**Sunil (72): my words and photo first; guesses only as Yes/No.**
- *Strongest argument:* "A guess in the same type as a fact is a fact to me."
- *What he'd lose:* the chat.
- *What would change his mind:* reading the guess label right, 5 of 5, at Largest.
- *Ships first:* Find at Largest: "You said: 'glove box of the Tesla' · Sep 30", with the photo.

## The disagreements

**The default (Mei vs Frank)**
- **Mei:** "Ask what it's in, every time."
- **Frank:** "Then I tap the top place, wrong."
- **Tomás:** "Open, with Skip."
- **Grace:** "Closed, 'In: add'." 2–2, unresolved.

**The analysis in release 1 (Tomás vs Grace)**
- **Tomás:** "Read-only after Save. Harmless."
- **Grace:** "Not to trust or privacy, and neither has a gate yet."

**Depth (Sunil vs Mei)**
- **Mei:** "Show all five."
- **Sunil:** "I can't read five."
- **Grace:** "Store all, show 3 plus '+2 more'." Both accept it; neither likes it.

**Chat (Frank vs Grace)**
- **Frank:** "If I told it, it's done."
- **Grace:** "Then the AI acts. A Yes button."
- **Frank:** "A big one."

## Scope

**Release 1: "Words, and one pick."**
- The camera contract in attack 10. No AI on the camera.
- Containers built and moved on their own pages.
- Rule 8: a new log closes the old link unless she picks one.
- Find shows the chain plus her dated words and photos.
- "What's in": linked things, then "Mentioned in your notes".
- Show 3 plus "+N more"; store any depth.
- Today's data, nothing migrated.

*Gate:*
- Zero store-changing tester finds in two builds in a row.
- All camera controls visible at Largest at 375 wide.
- Undo restores photos too (build f's finding 5).
- Offline phone: newest by time taken, with who and when shown.
- A words-only item in a linked box behaves as shown under Move, Find and Undo.

**Next: "ReCall's take", read-only.**
- A card after Save, keyed to its photo, with Wrong and Hide.
- One-tap Yes hints.
- Conversion chips from the stored analysis.
- The privacy statement and the per-house Off switch.

*Gate:*
- 100 cancel, retake and fast-next runs, with zero answers on the wrong item.
- Never edits text she typed.
- 5 of 5 hallway testers (one 70+ at Largest) read the guess as a guess.
- Private items analysed for their owner only.

**Later.**
- Chat corrections and the *knows* list.
- Bulk conversion as a reviewed list.
- A camera chip tied to its photo.
- A read-only house outline.
- A laptop drag tree.

*Gate:*
- A correction changes the next answer 10 of 10 times and survives a restart.
- A deleted fact stops appearing.
- Chat never changes where without a Yes.

**Cut.**
- The mode picker.
- Any AI write.
- The word "training".
- A drag tree on the phone.
- Organization suggestions (Frank: "don't tell me how to keep my house"; Mei: "that's my job").

## Votes

| Question | Result | Who |
|---|---|---|
| **1. Two modes or one** | Per item, no mode setting **4**; visible mode **1** | Grace, Tomás, Frank, Sunil; Mei (per house) |
| **2. Default** | Words-first (In closed) **2**; In asked, with Skip **2**; abstain **1** | Grace, Frank; Tomás, Mei; Sunil |
| **3. 3-level cap** | Build and show 3, store any depth **3**; no cap **1**; abstain **1** | Grace, Tomás, Sunil; Mei; Frank |

## What Ravi and Tanya must decide
1. **Is a "mode" more than "did she pick a container"?** If not, may the app drop the word, so nobody ever chooses one?
2. **When does the analysis ship?** After release 1's gate, or in it? May it ever appear on the camera?
3. **Privacy.** Which photos go to the AI service, and are they kept? Is the analysis on by default in a shared house?
   Are private items analysed?
4. **Newest wins.** Does a words-only log take the item out of its old container (out of the Tesla)?

---

# Appendix B — Regular boards, addendum (after the clarifications)


Same cast as the first pass. They advise; Ravi and Tanya decide.

## 1. What's settled, what stands, what's new

**Settled by Tanya:** a guess never moves a link (so "never-guess" items are moot); modes are per item; switching rewrites nothing.

**Where each member stands now:**
- **Maya:** "My 'one flow with an optional step' is now the design. Still open: what is the AI *for* on day 1?"
- **Devin:** "Per-item doors are fine. Still open: Tanya said 'sidebar', and a phone has no side."
- **Priyanka:** "The AI only offers, so I drop my one-mode objection. The late-answer bug stays until the AI's answers leave the camera."
- **Sam:** "My rules are Tanya's now. My 'guess' tag on links goes unused. Guesses get their own record."
- **Margaret:** "Nothing changes behind my back. Good. Still no tips on keeping my house, please."
- **Robert:** "No guessing in my garage: resolved. The cap: still stands."
- **Priya:** "Two truths about one car: still stands."

**New objections:**
1. **Per-item modes in one box (Priyanka).** The memorabilia box is structured; the card inside it is words only. Move the box and the card still says "crawl space". That's a stale answer inside one box.
2. **Find across both (Sam).** "What's in the memorabilia box?" must list two groups, *Linked* and *Mentioned in your words*. Otherwise the items logged in words vanish from the answer.
3. **Chat-to-correct (Maya, Priyanka).** A chat is a product of its own. Corrections must be stored as her words, and "teach it her home" must mean notes kept in her house, never model training on her photos.
4. **A sidebar on the camera (Devin).** "ReCall sees: …" landing 3 s after the shutter is REPORT_f finding 1 rebuilt as a panel.
5. **Home photos sent to the AI (Priya, Margaret).** The analysis names the background: pill bottles, addressed mail, a passport page, the kids' rooms.
6. **Two people in one house (Priya).** He says "in the car"; she picks "Odyssey ▸ trunk". Newest wins; each must see who changed it.

## 2. Realistic scope

**Release 1, the smallest useful and safe version**

**Camera, words (the default for a new item):**
- shutter, "+ photo", "Where is it?" (typed or mic), Save, and a "Put it in…" button;
- nothing from the AI.

**Camera, structured (after "Put it in…", or for an item already in something):**
- shutter;
- one chip, "In: Wooden box ▾": a searchable list, or a new place by name;
- the chain, read-only ("Wooden box ▸ Memorabilia box ▸ Crawl…");
- Save;
- no tier squares, no "+", no tier editing.

**Pushed off the camera:**
- building and editing the chain ("This is in…" on each box's or place's page);
- moving a container, and renaming;
- the AI analysis;
- "This photo is…", and matching a photo to a place;
- Before → Now, which becomes a toast: "✓ In the Wooden box · Undo".

**Also in release 1:**
- **Item page.** Her words and photos as given, dated; the chain, if any; a **"ReCall sees"** panel per photo, computed after Save and tied to that photo's id, with "Not right" (she types the fix) and "Hide".
- **Converting, item by item.** "Put it in a place" opens the list with up to 3 suggestion chips, taken from her words and the analysis. Nothing is ever pre-typed into a field (finding 2).
- **Find.** Structured: the chain. Words: "You said '…', Sep 30" with the photo. "What's in here": *Linked* and *Mentioned*.
- **Privacy.** A house setting "Let ReCall look at photos"; "Don't look" on any item; nothing seen in a private item is shown to others.
- **Cap.** The camera shows 3 levels; storage has no limit.

**Next:** chat-to-correct; "Is this the glove box?" on the camera, tied to its photo; "Say it, ReCall splits it, tap ✓"; converting many at once; an indented tree with Back.

**Later:** a draggable tree on a laptop or iPad; recognising things in photo backgrounds; power-user batches; "improve your organization" (Margaret and Robert: cut it; Maya: later, opt-in).

**Cut:** the tier row and "+" on the camera; a draggable graph on the phone; a mode setting per person or house; a cap that blocks a move; inferred structure shown as fact.

**Priyanka: build size and tests.** "Release 1 is mostly removal. The camera rewrite is smaller than f's: the tier strip, the modal and the camera look all go. There are three new pieces: the panel, the convert picker, and Find's two groups. About two weeks of Ravi's evenings, 4–5 builds.

"The camera cases roughly halve, because no AI answer can land there. One new rule to hammer: photo X's analysis shows only on X, and never writes. Then:
- Find's 4 states: words only, link only, both with words newer, both with the link newer;
- two-person crossings;
- 'look off' means zero AI calls.

Roughly 150 new checks. Most of f's 883 still apply."

**Sam: data changes.**
- **Kept:** things, places and dated "in" links. Only people make links: `how: typed | said | picked`, plus `from: suggestion` when she taps a chip.
- **New:**
  - a **log entry** for each capture (item, who, when, words, photo ids), never rewritten;
  - an **analysis record** for each photo (what it sees, when, model, status, her correction).
- **Mode:** "No stored flag. An open link means structured; none means words. A flag can disagree with the data."
- **Migration:** none. Existing items read as structured, and their old place text shows as entry zero.
- Check the AI provider's retention terms first.

## 3. The personas walk release 1

**The baseball card.**
- **Margaret (words).** Photo, then "in the wooden box, in the memorabilia box, down in the crawl space": 3 taps; Find reads it back with her photo. Her son moves the structured memorabilia box to the garage. Find shows her words plus one line: "The memorabilia box moved to the Garage, Oct 4 (Daniel)." *"Don't fix it for me. Just tell me."*
- **Robert (structured).** "Put it in…" → Wooden box: 5 taps once the chain exists; building it first costs about 12 taps on the box pages, once. Box page → Move → Garage, and the card follows. True.

**The Tesla.**
- **Robert.** 3D model → "Put it in…" → new "Glove box"; its page → "This is in" → new "Tesla" → "Street". A week later, Tesla page → Move → Garage: 21 things follow.
  - "Where's the 3D model?" Glove box ▸ Tesla ▸ Garage, with photos.
  - "What's in the Tesla?" 21 things.
  - Garage sits in "House": 4 levels. Camera shows 3; Find shows all.
- **Priya.** Her husband's "in the car" cleats aren't under the Tesla; "car" finds them under *Mentioned*.
- **Glove box photo.** The camera doesn't know it in release 1; its page panel says "a car glove box", and she corrects it: "the Tesla's".

**Their own moments.**
- **Margaret: reading glasses on the nightstand.** The panel reads "reading glasses, a lamp, two pill bottles." *"Why is it telling me about my pills? My daughter reads this."* She'd switch "look" off.
- **Robert: M6 bolts, 5 levels deep.** The chip shows 3; Find shows all 5. He has two blue organizers, so he names them "L" and "R". *"I name things, it doesn't."*
- **Priya: passports in the fire safe.** "Don't look" before the first photo. *"If it reads the passport page once, we're done."* She converts the cleats; her husband sees "Priya put it in the Odyssey trunk, Oct 2 (newer than your words)."

## 4. Disagreements, votes, questions

**Where does the analysis go?**
- **Maya:** "Tanya wants as much as possible on the camera. A panel after Save hides her idea."
- **Devin:** "He also said push it off if it complicates. A late panel *is* the bug history."
- **Priyanka:** "Item page first. Two clean tester rounds earn the camera."

**A stored mode flag?**
- **Sam:** "Derive it from the link."
- **Priyanka:** "Then words on a boxed item must close its link. She says 'still here' and it's unboxed."
- **Sam:** "Or ask 'Still in the Wooden box?'"
- **Devin:** "That's a question on the camera again."

**Chat in release 1?**
- **Maya:** "Without it, the panel is a label maker."
- **Priyanka:** "'Not right' plus a typed fix is the same data."
- **Robert:** "I'd never chat."
- **Margaret:** "I'd chat all day. That's the worry."

**Photos to the AI**
- **Priya:** "Off by default in a shared house."
- **Maya:** "Then nobody sees the feature."
- **Sam:** "On, with 'Don't look' per item."

**Votes**

| | Votes |
|---|---|
| **Per-item modes** | Yes: Maya, Devin, Sam (mode read from the link), Robert, Priya (**5**). No, just one camera with an optional "Put it in…": Priyanka, Margaret (**2**) |
| **Default for a new item** | Words and a photo: Maya, Devin, Priyanka (changed: "no AI on the camera makes it cheapest to test"), Sam, Margaret (**5**). Each person's last choice: Robert, Priya (**2**) |
| **3-level cap** | On screen only: Maya, Devin, Sam, Margaret, Priya (**5**). Camera and convert build at most 3, moves can go deeper: Priyanka (**1**). None: Robert (**1**) |

**For Ravi and Tanya**
1. **Where does "ReCall sees" go in release 1?** On the item page after Save (the majority), or on the camera?
2. **How is the mode decided?** Read from the link, or a stored flag? And does logging words on a boxed item unbox it, or does ReCall ask?
3. **Photos to the AI.** Is "look" on or off by default per house, with "Don't look" per item? And does "train our system" mean notes kept in her house only, never model training?
4. **When does chat-to-correct ship?** Release 1, or next?

---

# Appendix C — Regular boards, first pass (before the clarifications)


Build board: Maya (PM), Devin (design), Priyanka (engineer), Sam (architect). Persona board: Margaret, Robert, Priya.
They advise. Ravi and Tanya decide.

## What's good, and what's weak

**Good.** "Simplicity rules, even at a few extra taps" is the right rule; nobody argued. Planning for any number of
levels while showing few is right. "Move the box and everything follows" is kept. Own words answer yesterday's
strongest user point (Doris: "I remember my own words"), and "ReCall builds the structure underneath" is yesterday's
option D, the widest second choice.

**Weak.**
- Two modes are two capture flows, two kinds of Find answer, and every mix of the two in a shared house.
- "We construct the hierarchy in the background" is a promise with no plan yet for wrong guesses.
- A draggable tree on a phone at Largest text is the hardest screen we could build.
- A cap of 3 breaks the moment someone moves a box.
- "Push it off the camera", applied strictly, is yesterday's option A. That part is the real fix.

## The examples, walked through

| | Structured (3 levels, edits off the camera) | Unstructured (photo + words, structure built behind) |
|---|---|---|
| **Baseball card, logged** | Photograph the card → "In?" photograph the wooden box → + memorabilia box → + crawl space → Save. That is 3 levels, at the cap. | Photograph the card and the wooden box, then say "wooden box, in the memorabilia box, in the crawl space". Saved as said. ReCall later proposes the chain. |
| **Memorabilia box → garage** | Open the memorabilia box → Move → Garage. The card follows. **True.** | She has to *say* the box moved. That only works if ReCall already made the box a record. Otherwise the card still says "crawl space". **Stale.** |
| **3D model into the glove box, Tesla on the street** | About 8 taps and 2 names, 3 levels. The tin box is untouched. | One sentence and a photo, about 3 taps. The fastest. |
| **Tesla → garage, 20 things in the trunk** | Tesla's page → Move → Garage: 4 taps, and 21 things follow. **But** if Garage sits in "House", the 3D model now has 4 levels above it. A move made somewhere else has broken the cap. | Nobody tells ReCall the car moved. 21 sets of words still say "street". |
| **"Where's the 3D model?"** | Glove box ▸ Tesla ▸ Garage, with photos. **True.** | Her words, with the date. The outer part is stale. |
| **"What's in the garage?" / "in the Tesla?"** | Both **true**. | Only as good as the guessed records. "The car" vs "Tesla" vs "Model 3" decides it. |
| **Photo of the glove box** | "Is this the glove box?" It's a record with photos. | Only if inference made one and filed her extra photos on it. |

**Ravi's 09-30 Tesla problem:** structured mode with edits off the camera answers it. Unstructured brings back option
C's staleness unless inference makes a Tesla record *and* someone moves it.

## The members

**Maya (PM): one mode.** The default capture is a photo, one "what's it in?" and optional words.
- *Strongest argument:* Tanya's two modes are two *halves* of one good flow: capture fast in your own words; the
  structure lives on the box's own page. "Structured or unstructured?" on day 1 is a question nobody can answer.
- *What she'd lose:* Robert's tree on day 1.
- *Would change her mind:* if in a hallway test, people given one flow keep asking for "just let me type".

**Devin (design): two entry points, chosen per moment, not per person.** "Snap it" and "Put it in…" sit on one camera.
- *Strongest argument:* the same person is unstructured at the kitchen counter and structured while packing the
  garage. A setting chosen once is wrong half the time.
- *Camera, as he'd draw it:* shutter, one chip "In: Glove box ▾", a mic. No row of squares. Chain, rename and moving
  a container all go to the item's and the place's pages.
- *Tree:* an indented list you step into with Back (the 09-25 pick), **not** a graph you drag. At Largest text a
  drawn tree fits 1.5 boxes across a 375-wide phone.
- *Would change his mind:* if the two buttons confuse Margaret in a test.

**Priyanka (engineer): one mode; structured first; hard cap of 3 in release 1.**
- *Strongest argument:* in all five builds the bugs lived where a photo arrives, the AI answers late and the tiers can
  be edited. Taking the tier editing off the camera removes one of those three. Background inference turns the
  late-answer bug from something a tester sees into a wrong link written at 2 a.m. Build f's top finding (a cancelled
  photo's guess landing on the next photo) becomes a quiet mis-filing.
- *Rough cost:* two modes is about 1.8× the test surface: each flow needs its own late-answer, cancel and undo cases,
  plus mixed-house cases.
- *What she'd lose:* the fast first-time logging that unstructured gives.
- *Would change her mind:* if every AI answer is tied to the photo it was asked about and can only *offer*, never write.

**Sam (architect): one set of records; "modes" are just screens.**
- *Strongest argument:* the 09-25 link record already has `how: typed | said | picked | guess`. Her raw words become a
  note on the item. A guessed link is a link marked `guess`. Nothing new needs storing, and nothing needs migrating.
  Existing items stay as stated links.
- *Rules he'd insist on:*
  - A guess never moves anything, and never carries other things along.
  - Find shows a guess as "ReCall thinks…, from your words on Sept 30".
  - Private items never feed guesses about another person's things.
- *On the cap:* data has no cap. Refusing to move a real box because of depth makes the app lie.
- *Would change his mind:* nothing on the data. He doesn't mind which screens go first.

**Margaret (78): two modes; her daughter picks.**
- *Own life:* reading glasses, on the nightstand or the windowsill. *Unstructured:* she taps the camera, photographs
  them and says "on my nightstand by the lamp". Asked "where are my glasses?", she hears her own words and sees her
  photo. "That's how I remember." *Structured:* the row of squares and the "+". She'd never tap +. At Largest text
  the third square is hidden (build f, finding 8).
- *Where she gives up:* a "?" beside "Bedroom ▸ Nightstand" makes her think she did something wrong. And "suggestions
  on how to improve the organization" means "don't tell me how to keep my house."
- *Strongest argument:* her daughter wants the tidy version and Margaret wants the talking one, both on one house.
- *Would change her mind:* if one flow lets her talk and never shows her the chain.

**Robert (garage): two modes; no cap.**
- *Own life:* M6 bolts → drawer 4 → blue organizer → shelf 3 → steel rack → garage. That is 4 levels above. With a
  cap of 3 he'd name a place "Rack shelf 3 blue organizer", and a cap that forces bad names is worse than no cap.
  Jumper cables go between the truck and the Subaru, which is one Move from the cables.
- *Unstructured:* he says "drawer 4 of the blue organizer". He has *two* blue organizers, so inference makes one and
  files both under it.
- *Tree:* he'd drag things around on the laptop on a Sunday. Not on the phone, with greasy hands.
- *Strongest argument:* don't guess in his garage. He wants a mode where nothing is inferred.
- *Would change his mind:* if guesses stay as offers and never change his stated links.

**Priya (shared house): one mode for the house.**
- *Own life:* the passports are in the fire safe in the bedroom closet. The kids' cleats are "in the car", and there
  are two cars. Her husband would use unstructured and type "in the car". She has a stated "Odyssey ▸ trunk".
  Inference must choose a car, and Find gives two answers.
- *Where she gives up:* when her 12-year-old types "idk my room" and ReCall builds a "My room" place.
- *Strongest argument:* "A guess about the passports is worse than no answer." She wants to mark items "never guess".
- *Would change her mind:* if the mode is set per item ("important: stated only") instead of per person.

## The disagreements

**1. Two modes for two people? (Margaret vs Priya and Priyanka)**
- **Margaret:** "My daughter and I aren't the same person. Give us each our own."
- **Priya:** "Then our house has two truths about one car."
- **Priyanka:** "Plus every crossing: she says it, the daughter moves the box, and whose answer wins?"
- **Devin:** "So choose per moment, not per person." **Maya:** "Then it's one flow with an optional step. Say that."

**2. Background inference (Sam vs Maya vs Robert)**
- **Sam:** "Store guesses as guesses, and they can never move anything."
- **Maya:** "If a guess can't move anything, what is it for on day 1?"
- **Sam:** "Find says 'probably the glove box', and the camera can say 'Is this the glove box?'"
- **Robert:** "Not in my garage." **Margaret:** "I'd believe it, whatever it says." That's the trust problem in one
  line.

**3. The tree (Robert vs Devin)**
- **Robert:** "Let me drag it."
- **Devin:** "On a laptop, later. On the phone it's a list with Back."
- **Margaret:** "Neither, please."

**4. The cap (Priyanka vs Sam and Robert)**
- **Priyanka:** "Release 1 needs a boundary I can test."
- **Sam:** "Moving the Tesla into a garage that's in a house makes level 4 without anyone building it. Then you'd
  block the move?"
- **Priyanka:** "Warn and allow." **Sam:** "Then it's a display cap. Call it one."

**5. Does "push it off the camera" fix the bugs? (Priyanka vs Devin)**
- **Priyanka:** "It fixes one leg of three. The late AI is still there in both modes."
- **Devin:** "Not if the AI only puts up a chip she taps, and the chip belongs to its own photo."
- **Priyanka:** "Then build *that*, and test it before any background guessing."

## What ships first

- **Maya:** one camera with photo, "In: ___" (pick, photograph or skip) and optional words, typed or said, saved
  exactly as given. Containers move from their own page. No modes, no tree, no inference. Next: "say it, ReCall splits
  it, you tap ✓".
- **Devin:** the same camera, plus a read-only "What's in here" on each place, reached with Back.
- **Priyanka:** first, take tier editing off the camera and tie every AI answer to its photo. Inference only after two
  clean tester rounds.
- **Sam:** add the note and `how: guess` to the existing link. No new collections and no migration.
- **Robert and Priya:** a draggable tree on a big screen, later; a "never guess" flag on important items.

## Votes

| | Votes |
|---|---|
| **1. Two modes or one** | One: Maya, Priyanka, Sam, Priya (**4**). Two: Margaret, Robert, and Devin as per-moment buttons (**3**) |
| **2. Default** | Photo + own words: Maya, Devin, Sam, Margaret, Priya (**5**). Structured: Priyanka, Robert (**2**) |
| **3. The 3-level cap** | A display cap only, with no limit on what's stored: Maya, Devin, Sam, Margaret, Priya (**5**). A hard cap of 3: Priyanka (**1**). No cap anywhere: Robert (**1**) |

Tanya's cap gets support only as a *screen* limit. Nobody wants a move refused because the chain got too deep.

## What Ravi and Tanya decide

1. **Modes or doors?** Is there a setting, chosen per person or per house, or one camera where words and "what's it
   in?" are both optional?
2. **What may a guess do?** May a guess only be shown ("ReCall thinks…") and offered on the camera? Or may it ever set
   or move a link? Can some items be marked "never guess"?
3. **The cap:** is 3 a limit on what the camera shows (moves can go deeper), or a hard limit that blocks a move?
4. **Order:** first take tier editing off the camera and tie each AI answer to its photo, and only then build any
   background inference and any tree?
