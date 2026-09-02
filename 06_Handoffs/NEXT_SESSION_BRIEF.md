# Next session brief — produce the UI/UX design prompt

**Written:** 2026-08-31, at the end of the repo/deploy session.
**For:** the next Cowork session, on whichever Mac.

## What this session must produce

**One self-contained prompt** that Ravi and Tanya will paste into Claude's **Design** tool
to get reworked screens for ReCall.

The single most important constraint: **the Design tool will not have access to this
repo.** It sees only the prompt text. So the prompt must carry everything it needs —
product context, the user population, the screen inventory, the design constraints, the
feature behavior. A prompt that says "see the spec" produces nothing useful.

Deliver the prompt as a file in `06_Handoffs/design/` so it is version-controlled and can
be revised across sessions.

## Read these first, in this order

1. `../CLAUDE.md` — project state and conventions
2. `../03_Design/ReCall_v0_Spec.docx` — the 8 use cases the current app implements
3. `../01_Needs_and_Prioritization/ReCall_prioritization_2026-07-04.json` — **the most
   useful file.** All 74 features with Kano class, release phase, `shortDesc`,
   `description`, `voicedBy`, and per-feature `designNotes`. The designNotes are written
   for exactly this task; mine them.
4. `../01_Needs_and_Prioritization/ReCall_Unified_Needs_Kano_Analysis_v2.docx` — the
   reasoning behind the classifications, plus Part 6 on Scaffolded Active Recall
5. `../00_Vision/ReCall_Advisory_Panel_Personas.docx` — the 20 personas. Margaret, Robert
   and Priya are the three that matter for MVP.

## Where v0 stands today

Live at https://tanyaya27.github.io/recall/ — React, deployed, Firebase verified.
It implements roughly the capture-and-search core and an onboarding checklist. Ravi's
words: *"it looks terrible and the functionality is very limited."* Treat the current UI as
a functional skeleton to be replaced, not a starting aesthetic to preserve. The screens
that exist: home, onboarding, capture flow, answer view, recent reel, settings.

## Scope — decided, do not relitigate

**The 22-item MVP set, plus two or three showcase features.** Ravi's call: the MVP has to
be attractive enough that the first adopters use it confidently, not just correctly.

MVP must-be (9): photo-based item logging · natural-language search · repeated-query
tolerance · calm non-alarming UI · one-tap confirm on save · always correctable · basic
time/day orientation · caregiver logging mode · multi-device architecture

MVP performance (9): AI recognition accuracy · voice input quality · search speed ·
morning briefing relevance · semantic location suggestions · medication photo confirmation
· caregiver status view · VLM-backed recognition · embeddings-backed search

MVP attractive (4): nightly safety screen · caregiver-driven origination · contextual time
hints · silent structured usage logging

**Showcase candidates** — pick two or three, and say why in the prompt:
voice self-reminders (mvp-plus) · morning voice briefing (phase-2) · scaffolded active
recall (phase-2) · person identification (phase-2) · de-escalation notes (phase-2)

Pick for demo impact on a first adopter, not engineering ease. Flag clearly in the prompt
which are showcase rather than committed MVP, so nobody mistakes a mockup for a promise.

## Design constraints that are not negotiable

These come from the must-be features. A design that violates one of them is wrong no
matter how good it looks.

- **No alarm language, ever.** No red, no urgency, no error states that read as failure.
  A person with dementia who feels they have failed the app stops using it. "Calm,
  non-alarming UI" is a must-be, meaning its absence causes abandonment.
- **Asking the same question fifty times must feel identical the fiftieth time.** No "you
  already asked that", no progressive shortening, no impatience in copy or motion.
- **One tap to save.** No wizards, no confirmation dialogs on the capture path.
- **Every AI output is correctable** by patient or caregiver, and correcting must not feel
  like reporting a fault.
- **Date and time always visible**, unprompted, on the primary surface.
- **Three roles, three different screens.** Margaret (patient, early stage, insightful,
  motivated) needs calm and few choices. Robert (spouse caregiver, the retention
  gatekeeper) needs to log on her behalf without her feeling managed. Priya (remote
  daughter, the person most likely to find and set up the app) needs at-a-glance
  reassurance from another city.
- **Designed for the hand and the eye it will actually meet:** one-handed phone use, large
  touch targets, high contrast, generous type, no reliance on remembering a prior screen.

## What the prompt itself should contain

1. Product one-paragraph context and who it is for
2. The three personas, briefly, with what each needs from the interface
3. The screen inventory to design, named
4. The non-negotiable constraints above, stated as constraints
5. Feature behavior for anything being shown, in enough detail to draw
6. Visual direction — and take a position rather than leaving it open. "Calm" is a
   requirement, not an aesthetic; the prompt should say what calm looks like here.
7. What to output: interactive screens, and which flows must be clickable end to end

## Definition of done

- The prompt file exists in `06_Handoffs/design/`, is self-contained, and someone with no
  knowledge of ReCall could produce sensible screens from it alone
- Showcase features are explicitly separated from committed MVP
- Tanya has read it and agrees with the scope before it gets pasted anywhere
- Session handoff written, durable decisions promoted, committed and pushed

## One caution

Do not let the design session quietly become a feature-scope session. The prioritization
work is done and lives in the JSON. If a real scope question surfaces, raise it with Tanya
rather than resolving it inside a design prompt.
