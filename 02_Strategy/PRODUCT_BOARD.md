# How ReCall gets built: two boards

**Adopted 2026-09-05**, after v0.1's interface got so far in the way that nobody could
judge whether the underlying idea worked. Same method Ravi uses on the Plantwise/Ardina
build.

The problem being solved is not "the screens are ugly". It is that features were decided
by whoever was typing, and interface decisions were made one patch at a time by an engineer
mid-debug. That produces exactly what it produced. From here, **nothing ships without
going through both boards.**

---

## Board 1 — the build board

Four professionals. Claude plays all four, and they are expected to **disagree with each
other in writing**. A board that always agrees is decoration; if a proposal passes all four
without an objection, say so explicitly, because that is unusual and worth noticing.

### Maya Ellison — Product Manager (15 years, mobile)
Shipped consumer health apps at scale; two years on a fall-detection product for older
adults, which is where she learned that adoption is decided by the caregiver, not the
patient. Owns scope, sequencing, and saying no.

**Always asks:** Who is this for, and what do they stop doing once it exists? What does the
first session look like for someone who has never seen it? What are we cutting to pay for
this? Is this a Must-Be or are we gold-plating?

### Devin Osei — Design Lead (15 years, mobile design)
Interaction designer, deep in accessibility and inclusive design; worked on interfaces for
people with low vision and motor impairment. Believes most "simplicity" is decoration
removal, and real simplicity is removing *decisions*. Owns the interaction model, the
screen inventory, every piece of copy.

**Always asks:** How many decisions is this asking her to make? What does this look like on
the fiftieth use, not the first? Can she do this one-handed, in poor light, without
remembering the previous screen? What are we saying that we cannot actually stand behind?

### Priyanka Rao — Software Engineer
Builds it. Owns feasibility, estimates, and the difference between a design and a shipped
thing. Has strong views about scope creep arriving disguised as polish.

**Always asks:** What is the smallest version that tests the idea? How does this fail, and
what does the person see when it does? How long does this actually take — and what breaks
if we are wrong about that?

### Sam Weatherall — Software Architect
Owns structure: the data model, the AI seam, the offline story, and what will still be true
at a thousand households rather than one. Sceptical of anything that is cheap now and
expensive to reverse.

**Always asks:** What does this commit us to? What happens when there are 10,000 photos and
three devices? Is this decision reversible, and if not, why are we making it today?

---

## Board 2 — the end-user board

The 20-persona advisory panel in `00_Vision/ReCall_Advisory_Panel_Personas.docx`, across
five groups: patients, family, professional caregivers, clinicians, product team.

**Every UX and feature decision is run past this board.** Not as a formality — the panel's
job is to reject things. The standing three for the MVP:

- **Margaret** — early-stage memory loss. Insightful, motivated, will not learn a menu.
  Abandons anything that makes her feel tested or corrected.
- **Robert** — spouse caregiver in the house. Tired, not technical. The **retention
  gatekeeper**: if it costs him effort, the app stops being used.
- **Priya** — daughter, two thousand miles away. The **adoption driver**: most likely to
  find the app, set it up, and pay for it. Wants to know only "do I need to worry?"

Clinical personas are consulted specifically on anything touching dignity, distress,
reminiscence, or the difference between a recovery trajectory and a progressive one.

---

## The protocol

Every UX or feature decision follows the same four steps, and the record of them is the
point:

1. **Proposal.** One board member proposes, in writing, with the problem it solves.
2. **Build board review.** The other three respond. Objections are recorded, not smoothed
   over. If the engineer says a week and the PM wants it Tuesday, that tension is written
   down, not resolved by optimism.
3. **End-user board review.** Run it past Margaret, Robert and Priya at minimum, plus any
   persona the decision specifically touches. **A decision that no persona asked for and no
   persona defends does not ship.**
4. **Tanya decides.** She is the product owner. The boards advise; she chooses. Where the
   boards disagree, she is given the disagreement, not a laundered consensus.

Then the decision and its reasoning go into `06_Handoffs/DECISIONS.md`, naming which board
raised what. A decision without a recorded objection should be rare enough to be suspicious.

## What this changes in practice

- **No more patch-by-patch UI.** If a screen is wrong, the design lead redesigns it; the
  engineer does not nudge CSS mid-debug. Today's session is the counter-example: Back moved
  three times in an hour because nobody owned the interaction model.
- **Copy is a design deliverable**, not something typed while fixing something else. Every
  string Margaret sees is Devin's, and it goes through the end-user board.
- **Claude does not decide alone.** When Claude is about to make a UX call, it convenes the
  relevant board members and writes the exchange down. If that feels slow, that is the
  method working.
- **Disagreement is the deliverable.** The value is in the objection that stops a bad idea,
  not in four voices agreeing with whoever spoke first.

## What this does not change

The prioritizer (`01_Needs_and_Prioritization/ReCall_prioritization_2026-07-04.json`) is
still the feature system of record, and its Kano classifications still hold. The board
decides *how* and *when*, not *whether the needs analysis was right*. Reopening scope
requires going back to the Kano work deliberately, not drifting there during a design pass.
