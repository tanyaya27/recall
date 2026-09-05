# Next session — convene the board and rebuild the UX

**Written 2026-09-05.** Supersedes the earlier design-prompt brief, which is obsolete: we
are no longer producing a prompt for an external design tool. The board designs, the board
builds.

## The situation

v0.1 works. The AI path is proven end to end, the data layer is solid, capture and find
both function. **The interface is bad enough that it prevents judging whether any of that
is useful** — which is the only question worth answering right now. Ravi's words: "it is
getting in the way of evaluating the benefit of the underlying features."

That is not a styling problem. It is the consequence of interface decisions being made one
patch at a time by whoever was typing, usually mid-debug. Today the Back button moved three
times in an hour.

## What is being rebuilt

**Everything above the engine.** Every screen, every flow, every string.

**Kept:** `lib/firebase.js`, `lib/db.js`, `lib/img.js`, `ai/engine.js`, the Firebase project
`recall-d9886`, the deployment path. These contain no UX and were hard-won.

**Kept but reviewable:** Sam may flag anything in the engine that constrains the design —
the single `recall_items` collection with a `kind` field, photos stored inline against the
1MB document cap, LLM-over-captions search. Changing any of it is a recorded decision in
`DECISIONS.md`, not a quiet refactor.

**Do not patch the existing screens.** They are being replaced.

## Read first, in this order

1. `../CLAUDE.md`
2. `../02_Strategy/PRODUCT_BOARD.md` — **the method. Who the boards are and how a decision
   gets made. This is the point of the session.**
3. `DECISIONS.md` and `LESSONS.md`
4. `design/DAY_IN_THE_LIFE.md` — the story v0.1 implements. **Input to the board, not
   scripture.** Devin and Maya may reject any of it; if they do, that is a decision to record.
5. `../01_Needs_and_Prioritization/ReCall_prioritization_2026-07-04.json` — 76 features with
   Kano class, release phase and per-feature `designNotes`. The feature system of record.
6. `../00_Vision/ReCall_Advisory_Panel_Personas.docx` — the end-user board.

## How the session should run

Convene the board properly. Not a summary of what a board might say — an actual exchange
where four professionals disagree in writing, then the end-user personas react.

1. **Maya opens** with the problem and what a first user session has to achieve.
2. **Devin proposes the interaction model** — the whole thing, not screen by screen. What is
   the shape of this app? What does Margaret do, in what order, with how many decisions?
3. **Priyanka and Sam push back** on feasibility and on what the data model supports.
4. **The end-user board reacts.** Margaret, Robert, Priya at minimum. A screen no persona
   defends does not ship.
5. **Write it down**, objections included, and put the decisions in `DECISIONS.md`.
6. **Then build** — the cut below, not the whole design.

Expect the board to disagree with v0.1's premises. That is what it is for.

## The constraint that shapes everything

**Real users on this within a day or two.** So the board designs the whole app, then builds
only what a first user session touches. Suggested cut, for the board to confirm or reject:

- The home screen, whatever shape it ends up being
- Capture → confirm → saved
- Find one thing, and the "not there" path
- Settings, reduced to what setup genuinely needs

Everything else — routines, pinning, the research log UI, recent photos — stays as-is or
stays hidden until the core is right. **Do not rebuild all of v0.1 before anyone has used
it.**

## Definition of done

- The interaction model is written down and defended, with the objections recorded
- The cut above is built, deployed, and loads clean on a phone
- `DECISIONS.md` names which board raised what, and where Tanya chose between them
- Session handoff written, durable lessons promoted, committed and pushed

## Two things to carry in

Both from today, both now in `LESSONS.md`, both worth remembering while designing:

- **Never state a cause you have not verified.** The app told Ravi he had no internet while
  he was online. One invented explanation discounts everything else the app says.
- **Frequency sets verbosity.** Twenty times a day gets three words. Explanation earns its
  place only when it changes what the person does next.

---

## Prompt to start the session

> Read `CLAUDE.md`, then `02_Strategy/PRODUCT_BOARD.md`, then this brief.
>
> We are rebuilding ReCall's interface from scratch using the board. Keep the engine.
>
> Convene the build board. Have Maya frame the problem, have Devin propose an interaction
> model for the whole app, and have Priyanka and Sam argue with it properly — I want to see
> the disagreements, not a consensus. Then run it past Margaret, Robert and Priya.
>
> Show me the interaction model and the objections before you write any code. Once I have
> approved it, build only the first-session cut in the brief.
