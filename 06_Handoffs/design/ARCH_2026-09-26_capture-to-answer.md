# ReCall: from capture to answer (architecture, 2026-09-26 · v2 with Ravi's rulings)

Answers Ravi's directive of 09-26: **the fewest taps to finish anything**, judged across five stages: adoption, experience, daily use, value (pays), and network. Diagram: `ARCH_2026-09-26_capture_to_answer.jpg`.

**In one line:** the person only ever **shows** or **says**. ReCall keeps what it was shown as evidence, works out where things are, and asks only when it is truly unsure.

**Two rules added by Ravi (09-26, later the same day):**
- **Do as much as possible on one screen**, the camera above all, but never at the cost of clutter or confusion.
- **Voice is welcome only where it never makes her stumble**, in the steps or in the result.

Section 3b shows how the design keeps both.

## Ravi's rulings on Q1–Q9 (09-26, evening): what changed in this version

| Q | Ruling | What it changes |
|---|---|---|
| Two shots | No two-lens native capture yet. On the web, **the camera asks for the item, then, without leaving the camera, for the place**, with a short guide ("Now the place · step back") | §3b, §4 |
| Q1 | **Agreed:** camera-first from the widget/Action button (native); on the web the camera opens first | §4 |
| Q2 | **No silent saves.** **The Save button names the place** ("Save · Hall table"): one tap confirms, the chip changes it. Why: a mistake 1 time in 10 is enough annoyance | §3, §4 |
| Q3 | Not clear yet; re-explained in §10 | open |
| Q4 | **ReCall never moves things on its own.** Tidy up is **its own flow**, started from a "You have things to tidy up" prompt; stale photos must not drive it | §5 |
| Q5 | Native **after one more big web push and one real user's feedback**; build the foundations native needs first | §9 |
| Q6 | **Agreed** (box labels, after native) | §9 |
| Q7 | Sharing "where is" by text: **wait** for a user to ask, or survey at launch | §7 |
| Q8 | Free vs paid: **not yet**, build first | §6 |
| Q9 | **Maybe.** Prototype hold-to-speak in the web push and keep it only if it passes the stumble test on the phone | §3b |

---

## 1. The five stages, and what each one needs from the product

| Stage | She should feel | The number that proves it | What builds it |
|---|---|---|---|
| 1 · Adoption | "Logging costs nothing" | **taps per thing logged** (today 5, goal 2) | one camera with no choices first; place worked out, not asked; launch straight into the camera |
| 2 · Experience | "It just knows" | **seconds to a sure answer** (goal < 5, zero taps with Siri) | say it → answer with photo, how sure, when seen, what it's in |
| 3 · Daily use | "My stuff organizes itself" | **% of things placed without a question** | the resolver: place photos, containers, re-sightings; a short "tidy up" card instead of chores |
| 4 · Value → pays | "I can't do without it" | finds per week that succeed; paid conversion | sharing with family, insurance list, moves and storage, peace of mind for a caregiver |
| 5 · Network | "Others help and get value too" | invites that become owners | helpers who add, "where is…?" answered for others, lending |

The order matters, as you said: if stage 1 fails, nothing after it happens. So stage 1 gets the most work below.

---

## 2. Where I agree, and where I don't

**Agree, without reservation:**
- Tap count is the metric.
- The three logging scenarios are the right cut.
- Edges are first-class.
- Scenario 3 is mostly something the system infers, and it's the way in for power users and businesses.

**Disagree or refine (please push back):**

1. **"One picture of the item and its location" asks one photo to do two jobs it can't do together.** A close-up shows *what*; only a wider shot shows *where*. On 09-14 the wide shot named the can in the background instead of the keyboard. The better goal is **one tap, two frames**:
   - In the **native app**, iPhone can capture from two lenses at once (wide + ultra-wide). One press gives both the close-up and the wide view.
   - In the web app the nearest equivalent is a single photo at arm's length, which costs accuracy on the name.
   - **Ruled 09-26:** not a reason to go native yet. On the web: the item shot, then the place shot, both on the camera (§3b).

2. **The camera modes you asked me for (One · Several · Everything) cost a tap and a thought each time.** Under the new rule, the camera should decide from what's in the frame:
   - one thing close up → one;
   - a drawer or an open box → everything in view;
   - shots in quick succession → a session.

   The mode row stays only as a one-tap override. This reverses part of your 09-24 ruling, so it's question Q3.

3. **"Automatically organized" has to be earned, not imposed.** A wrong silent move sends her to the wrong room. That's worse than no answer, and we learned it on 09-05. So every inference carries a confidence:
   - **Sure:** it's just done, with Undo in the toast and the evidence kept.
   - **Unsure:** one short question now if she's in the flow, otherwise it waits for a weekly **Tidy up** card ("These 6 look like they're in the garage cabinet: Yes / Show me").

   This keeps taps low *and* trust high.

   **Ruled 09-26:** stricter than this. Nothing is saved or moved without her tap: the Save button names the place (Q2), and inferences wait in a separate Tidy up (Q4).

4. **The screens I drew on 09-25 are right about Home but too heavy about putting things away.** "Put away" (P-A/P-B) should be the *fallback*. The fast path for scenario 2 is **showing the destination**: open the box and take one photo, and ReCall recognizes the things you catalogued earlier and places them all. That's zero taps per thing.

5. **Order of work: the tap goals for adoption mostly need the native app.** Web builds can't give us:
   - launching from the lock screen, the Action button or a widget;
   - two lenses at once;
   - no camera-permission prompt on every launch;
   - Siri finding things with zero taps;
   - recognition on the phone itself.

   ~~Start native right after the graph foundation.~~ **Ruled 09-26:** one more big web push, then one real user's feedback, then native. Build what native needs first (§9).

---

## 3. The architecture: evidence → resolver → beliefs → views

**Capture: what she does.** Four gestures only:
- **Show it:** one thing.
- **Show many:** a drawer, box or shelf.
- **Say it:** typed or spoken, e.g. "the passport's in the blue tin".
- **Scan it:** an optional label on a box, for moves and storage.

**Evidence: never changes, append-only.**
- **Sighting:** photo(s), when, who, what the AI saw in it (names, text on labels, and whether private).
- **Statement:** her words, verbatim.
- **Sweep:** one photo that becomes many sightings at one place.
- Evidence is the proof behind every answer ("seen Thu 3:10 PM, here's the photo"), and it's what lets beliefs be rebuilt after a correction.
- It's the snaps we already store, generalized, so it isn't a new cost.

**Resolver: ReCall's filing clerk.** It runs on each new piece of evidence and answers three questions, each with a confidence:
- **Which thing?** Name, name history, look-alike (today's three identity tiers), and "same as before?".
- **Where?** Evidence is ranked: *said* › *this session's place* › **the place's own photos** (a place learns what it looks like from every sighting there) › *usual place* › ask.
- **In what?** A known container seen holding things, or seen in a place: *box in cabinet*, *card in box*.

Then (ruled 09-26: **nothing is saved without her tap**):
- **Sure** → the Save button names it ("Save · Hall table"), and one tap confirms.
- **Unsure** → the likely places as choices, with no place pre-chosen.
- **Something noticed in passing** (another known thing in the frame, somewhere new) → never acted on; it may become a Tidy up suggestion (§5).

**Beliefs: the graph.**
- **Nodes:** things and places. A box is both, so no type needs choosing.
- **Edges:** `rel` (in · lent to · goes with), `from`, `to`, `since`, `until`, `how` (said, seen, session, inferred, confirmed), `confidence`, `evidence` (ids).
- The **open "in" edge** is where it is now; **closed edges** are where it was.
- **Invariants:** one open "in" edge per thing, and nothing ends up inside itself.
- **Derived copies:** the place text on each thing stays as a copy written from the edge, for search, the AI and older builds. No migration day.

**Views: what she sees.**
- **Find:** say it → the answer line, the thing's photo, what it's in (with that photo), when it was seen, and how sure (e.g. "seen there 3 weeks ago").
- **Home:** her things. Tap a box or a place to step in; promote anything to the top.
- **Tidy up:** its own flow, started from a "You have things to tidy up" prompt (§5).
- **Share / Export:** helpers and family, lending, the insurance list.

**Why this shape fits the business**
- **Stage 1** lives in Capture and the Resolver: fewer questions means fewer taps.
- **Stage 2** lives in Find and depends on evidence: a sure answer needs its proof.
- **Stage 3** is the Resolver plus Tidy up, so the organizing gets better with every photo and no extra work.
- **Stages 4–5** are views on the same graph (sharing, lending, export). No second system is needed to make money or to grow.

---

## 3b. The camera as the one screen, and voice that never trips her

**The item-then-place flow (web, ruled 09-26), all on the camera:**
1. Shutter on the item. The strip shows the name as it arrives.
2. Straight away, a compact guide over the viewfinder: **"Now the place · step back"**, with the place chip and a small **Skip**.
   - If the place is already known (this session, or where the thing usually lives), the guide instead offers **Save · Hall table**, and the place shot is optional.
3. Shutter on the place, or tap Save. **The Save button always names what will be saved** ("Save · Hall table"). Tap the chip to pick another.
4. The camera is ready for the next thing, with a small "Saved · Hall table · Undo".

**At rest, the camera shows three things:**
1. the shutter;
2. the place chip at the top ("Hall table · every photo" when a session place is set; nothing when there isn't one);
3. Close / Done.

Everything else appears **only while it's relevant**, and never blocks the next photo:
- The **result strip** (name, place, "Only me") appears after a shot and fades into a small count ("3 saved") when the next shot is taken.
- **A question** (which place? same thing as before?) appears only when the resolver is unsure. It is at most one line with at most three answers. Ignoring it is allowed: the thing is saved, and the question moves to Tidy up.
- **No typing on the camera, ever.** "Type it" stays one tap away.
- The **mode row** is gone at rest (the camera decides, Q3). The override is a single small label that can be tapped ("One · Many").

Rule of thumb for every addition: **if a thing on the camera doesn't change what she does next, it isn't there.**

**Voice that never trips her:**
- **(Q9: maybe, so it's a prototype. It's kept only if it passes the stumble test on the phone.)** **Hold the shutter to speak.** The photo is taken on the press, the words are heard while it's held, and letting go ends it. "In the blue tin." One gesture, no voice mode, no listening at other times.
- **Silence is fine.** Saying nothing is the normal case, and nothing waits for speech.
- **A misheard word never files a thing somewhere wrong.** A spoken place goes through the resolver like everything else. If it matches a known place or container, it's used. If not, the strip shows what was heard as a choice ("Blue tin?") next to the likely places. It's never saved silently.
- **Voice never blocks.** If speech fails ("didn't catch that"), the thing is already saved and the next shot is ready.
- **ReCall never talks back during capture.** No spoken prompts and no waiting for a reply.
- **For Find**, the microphone and typing are equal, side by side. The answer appears as the words arrive, and it forgives a misheard word: nearest matches are shown with their photos, never "no results".
- **The stumble test**, applied to every voice feature before it ships:
  - does the operation still work if she says nothing?
  - if she's misheard, does she lose anything?
  - does she ever have to wait for, or answer, the phone?

  Anything that fails a question doesn't ship.

---

## 4. Logging, scenario by scenario (taps counted from the phone in hand)

| Scenario | Today (web) | Next web build | Native |
|---|---|---|---|
| **S1 · Item now, place now** ("I'm putting the glasses on the hall table") | icon · Log item · shutter · Done · place = **5** | icon · shutter (item) · **Save · Hall table** = **3** when the place is known; icon · shutter · shutter (place) · Save = **4** when it's new (+1 on iOS web: the camera prompt each launch) | the same, later: one press for both frames (two lenses) = **2–3** |
| **S2 · Catalogue now, place later** (a box of cards, a moving day) | per thing: shutter; later, per thing: open, Edit, place ≈ 4 | per thing: **1** (shutter, session); later: **one photo of the destination**, and ReCall shows what it recognized with **Put 6 in the wooden box** (1 tap for all); fallback: pick-then-tap, 1 per thing | the same, with on-phone recognition: faster, works offline |
| **S3 · Place in place** (box → filing cabinet → room) | not possible | photo of the box in the cabinet → **Save · in the filing cabinet** (1 tap); or **say it** once; later noticed in passing → a Tidy up suggestion | the same + optional **labels** (scan the box = step into it, log into it) |
| **Find** | icon · Find item · type · tap result ≈ 4 + typing | icon · Find · **say it** · answer shown = **3** | **Siri: "where's my passport?" = 0**; widget: 1 + say it |

What "place saved without asking when sure" requires, and how we'll know it works:
- The resolver has to recognize a place from its photos.
- The garage session in OPEN_ITEMS (~75 shots) becomes the test set.
- **Target: the place named on the Save button is right ≥ 90% of the time.** Below that, the Save button stays generic and the likely places are shown as choices.

---

## 5. Daily use: the chaos organizes itself

- **Every sighting teaches.** A photo on the hall table updates *where the glasses are*, and also *what the hall table looks like*, *what's usually there*, and *what's in the blue tin if the tin is in frame*.
- **Nothing moves on its own (ruled 09-26).** When a photo taken for one thing happens to show *another* known thing somewhere new (the glasses in the drawer photo), ReCall only **notes it** as a Tidy up suggestion.
- **Tidy up is its own flow**, started from a "You have things to tidy up" prompt on Home. Each suggestion shows its photo and **when it was taken** ("seen Tue"), with Yes / Not now / Wrong. Yes to all is allowed. Things not put away appear there too.
- **Stale photos never drive it** (Ravi's concern). A suggestion **expires after 3 days** without being shown. It's **dropped as soon as newer evidence exists** (the thing was photographed again, or moved by hand). And it always shows its age, so she can judge.
- **Structure appears on its own.** When 12 things are "in Box 14" and Box 14 is "in Storage unit 214", Home shows Storage unit 214 as a place you can step into. Nobody built that tree.

---

## 6. Value that people pay for (hypotheses; **parked 09-26:** build first)

- **Free:** your own ReCall, up to a generous number of things, finding by voice. (Adoption must not hit a wall.)
- **Paid (household):**
  - unlimited things and history;
  - **family and helpers** ("Can help" / "Can see");
  - **insurance list export** (photos, labels, values);
  - moves and storage (boxes, labels);
  - peace of mind for a caregiver (they can see without asking).
- **Later (business):** moving companies, storage units, small offices (inventory with photos and "where").
- Why they won't leave: the history. **Years of "where it was" and the photos behind it can't be moved elsewhere**, and each month makes it more valuable.

## 7. Network growth, built into the same graph

- **Helpers add.** The daughter logs things in Mom's ReCall (built 09-21); she sees the value and starts her own.
- ~~"Where is…?" by text message.~~ **Ruled 09-26: wait** until a user asks for it, or survey at launch.
- **Lending is an edge:** "Lent to Dan" asks Dan to confirm with one tap. Dan meets ReCall, and the drill comes back.
- **Moves and packing:** everyone packing the same boxes logs into the same boxes.

---

## 8. What changes in what's already built

- **Keep:**
  - Several's save-at-shutter;
  - write it down;
  - private by default;
  - Home inside a box (09-25 A);
  - the answer with the container's photo (09-24 B);
  - edges as first-class.
- **Change:**
  - the camera's own **Done** step for one thing: the shutter should go straight to the saved result (−1 tap);
  - the **mode row**: open (Q3);
  - the photo card's "**Where is it?**" becomes the camera's item → place step, with **the Save button naming the place** (Q2);
  - Put away (P-A/P-B): the fallback, after "show the destination".
- **Add:**
  - the Evidence/Resolver/Edges layers;
  - place photos learned from sightings;
  - the Tidy up card;
  - camera-first launch (Q1; on the web the camera opens first).

## 9. Order of work (ruled 09-26): one big web push → one user → native

**A. Foundations that native will need.** Everything below is platform-neutral, so a native app reuses it:
- **Edges** (first-class) with how, confidence and evidence, plus their server rules, tested on the real rules engine.
- **Evidence:** sightings (photo, time, who, what the AI saw) and statements. Today's snaps, generalized.
- **The resolver as a pure module**, with no screens in it: which thing, where, in what, each with a confidence. Unit-tested. A native app calls the same logic, or its port.
- **Place photos learned from sightings**, so a place knows what it looks like.
- **One data API** (today's `db.js`) that every screen goes through, so a native client talks to the same Firestore collections, rules and AI function.

**B. The camera as the one screen:**
- camera-first on the web;
- item → place on the camera with the guide;
- **the Save button names the place**;
- no extra Done;
- the result strip;
- the mode row as decided by Q3;
- hold-to-speak as a prototype (Q9).

**C. Containers:** Home inside a box (A or B, still open) + promote; put away after the fact (showing the destination first, pick-then-tap as the fallback).

**D. Find:** say or type → the answer with its photo, what it's in (with that photo), when it was seen.

**E. Tidy up:** its own flow from a prompt, with expiring, dated suggestions.

**Then:** one real user for a week or two, their feedback, then native. Native starts with lock-screen/Action launch, two lenses, Siri find, on-device labels, labels to scan (Q6), and the App Store.

---

## 10. Still open (after the 09-26 rulings)

- **Q3, said more plainly.** Today she chooses **before** shooting: the row under the viewfinder says *One thing · Several*. The question is whether the camera should **work that out itself**:
  - one close-up and she stops → one thing;
  - a second item shot straight after → it becomes "several", with a count;
  - a wide shot of an open drawer → "these 6 things?", listed.

  Nothing is saved on a guess: the Save button states what will happen ("Save · Glasses", "Save 6 things"), the same principle as your Q2 answer. The row would then disappear, with a small label to force "one" or "many".
  - (a) The camera works it out, as above.
  - (b) Keep the row as it is.
- **Home inside a box (from 09-25):** A (Back + the box as a banner; board) or B (the trail)?
- **Tidy up prompt:** a **card at the top of Home** that stays until dealt with (my lean; a pop-up interrupts whatever she opened ReCall to do), or a pop-up on opening?
- **The one real user** for the web push: Dad's phone?
