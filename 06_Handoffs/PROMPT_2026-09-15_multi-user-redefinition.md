# Prompt — redefine ReCall's multi-user use cases (separate session)

Paste everything below the line into a new Cowork session with the ReCall folder connected.

---

You are working on **ReCall**, a camera-first "where did I put it" app for a person with
early-stage dementia. Read, in this order, before you say anything:

1. `CLAUDE.md` — how work is decided here (the product-board method, the standing rules).
2. `06_Handoffs/LESSONS.md` and `06_Handoffs/DECISIONS.md` (top entries first).
3. `06_Handoffs/design/BOARD_2026-09-05_interaction_model.md` — the design of record.
4. `06_Handoffs/design/PLAN_2026-09-14_multi-user.md` and the three board files beside it
   (`BOARD_2026-09-14_multi-user_customer.md`, `_ux.md`, `_tech.md`).
5. `04_Engineering/recall-app/src/lib/db.js` — the data model as built: `household`,
   `visibility: 'household' | 'private'` + `owner` (a device id), `kind: 'place'` docs with
   `photos[]` and a reserved `parent`, `history[]`, `logId` / `photoCount`.

**Why this session exists.** On 2026-09-15 Ravi (product owner, with Tanya) suspended the
multi-user plan: he *totally disagrees with the boards about how the various users need to
be treated and how the features manifest across them*. Treat the plan and the three board
files as the boards' opinion, not as decisions. Nothing from stages 0–4 has been built.
One thing from that work IS decided and must be kept: **private means private to the
person, not to a device** — a person may use an iPad, two iPhones and a watch; "only this
phone" is wrong wording and a wrong model.

**What is being asked of you — in this order, stopping for Ravi at each step.**

**Step 1 — Listen before proposing.** Ask Ravi to describe, in his words, the people who
will use ReCall and what each of them does with it. Do not offer the boards' personas
(Margaret / Robert / Priya) unless he uses them. Capture what he says verbatim into
`06_Handoffs/design/USECASES_<date>_ravi.md` under headings he agrees to. Ask one question
at a time. Things to make sure you understand before moving on, because the last plan got
them wrong in his view:

- Who the *users* are versus who *helps* — and whether those are different people, the
  same person on different devices, or roles that one person switches between.
- Whether the person with dementia ever signs in, joins anything, or sees anyone else's
  name; whether a helper's phone shows the same board or a different one.
- What "private" means to him across a person's devices, and who can override it.
- Which features exist for whom: logging, finding, editing, removing, places and place
  photos, the *put it back* answer, appointments, the status card, the AI key.
- What one household is, whether a person can be in more than one, and what happens at
  the boundary (a professional carer, a second family).
- Installation and identity: web app on the home screen versus a native wrapper
  (TestFlight / App Store) — note that the camera-permission prompt on every launch is an
  iOS limit for home-screen web apps and cannot be fixed from web code; a native wrapper
  fixes it and also solves remote setup. Ask whether that is on the table.
- The location hierarchy he described on 2026-09-15 (*back of drawer ⊂ third drawer ⊂
  filing cabinet ⊂ office ⊂ home*, built by the system in the background, shown later as
  a map) — how it relates to households and helpers, if at all.

**Step 2 — Write the use cases back to him**, one page, in his terms, as numbered
scenarios ("Ravi opens the app on his iPad and …"). Each scenario names the person, the
device, what they see, what they can do, what they cannot. Get his corrections. Only then
convene the boards.

**Step 3 — Boards, on his use cases, not theirs.** Build board (Maya, Devin, Priyanka, Sam)
and persona board — but the personas are the people *he* described in step 1. The boards'
job is to find holes and costs in his use cases, not to substitute theirs. Record every
disagreement with the use cases as a split for Ravi to rule on; never resolve a split by
recommendation alone (see LESSONS: *never defer an explicit request on my own
recommendation*).

**Step 4 — Only after rulings: the plan.** Stages, agents, interfaces, the rig's test plan
per role, mockups for anything that moves a control (LESSONS: *no layout change without
rendered options shown to Ravi first* — the rig renders from the real stylesheet:
`06_Handoffs/RIG.md`, `04_Engineering/recall-app/rig/gen_r7.py` is the latest example).
Stage-by-stage mockups, not a wall of text (Ravi on the last plan: "confusing — almost
total crap"). Update `DECISIONS.md`, `OPEN_ITEMS.md`, `CLAUDE.md` status, and the
*Deploy commands* block at the end of `OPEN_ITEMS.md`.

**Standing rules for this session (from LESSONS.md — do not relearn them):** walk him
through the approach and, where it helps, a mockup before implementing anything; when he
says he does not understand, explain in plain words with a picture, not with a longer
paragraph; every deliverable is written to his folder *and* posted as a file card; keep
`OPEN_ITEMS.md` running; no build reaches the phone without the rig audit
(`04_Engineering/recall-app/rig/audit.js`, currently 84 checks) and screenshots he has seen;
git on the Mac starts with `find .git -name "*.lock" -delete`; commands are given with full
paths.

**Do not** start with a plan, a data model, or Firestore rules. Start by asking him who the
users are.
