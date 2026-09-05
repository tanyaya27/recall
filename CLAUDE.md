# CLAUDE.md — read this first

You are working on **ReCall** with Tanya Angadi (high school student, project owner and builder).
This file is the entry point for every session, on any machine. Read it before doing anything else.

## How work is decided — read this before proposing anything

**As of 2026-09-05, ReCall is built through two boards. Nothing ships without both.**
Full method and cast: **`02_Strategy/PRODUCT_BOARD.md` — read it before any UX or feature
work.** In short:

- **Build board** — Maya (PM), Devin (design lead), Priyanka (engineer), Sam (architect).
  Claude plays all four and they are expected to disagree *in writing*.
- **End-user board** — the 20-persona advisory panel. Standing three: Margaret (patient),
  Robert (caregiver, retention gatekeeper), Priya (remote daughter, adoption driver).
- **Protocol:** propose → build board objects → end-user board reviews → **Tanya decides**.
  Then it goes in `DECISIONS.md`, naming who objected to what.

Claude does not make UX calls alone any more. Patch-by-patch interface changes are what
produced v0.1, and v0.1's interface got so far in the way that the underlying idea could
not be judged.

## Read at the start of every session

1. This file (project state + conventions).
2. `02_Strategy/PRODUCT_BOARD.md` — how decisions get made and who makes them.
3. `06_Handoffs/DECISIONS.md` — why things are the way they are.
4. `06_Handoffs/LESSONS.md` — traps already discovered. Do not re-learn these the hard way.
5. The most recent file in `06_Handoffs/sessions/` — what happened last time.

Older session files are an archive. Do not read them all; search them when you need to
reconstruct history.

## Do this at the end of every session

Tanya will say "wrap up" or similar. Then:

1. Write `06_Handoffs/sessions/YYYY-MM-DD-<short-topic>.md` — what was attempted, what
   worked, what broke, what is half-finished, what to do next.
2. **Promote anything durable**: a decision and its reasoning → `DECISIONS.md`;
   a gotcha, dead end, or "don't do X because Y" → `LESSONS.md`; a change in project
   state → the "Current status" section below.
3. Commit and push. Meaningful commit message, not "update".

Step 2 matters more than step 1. A lesson buried in a session file is lost; a lesson in
`LESSONS.md` gets read every session.

## What ReCall is

A camera-first visual memory vault for people with early-stage dementia. Snap a photo of
where you put something → AI names the item and location → ask in plain language later →
get the photo back.

Personal motivation: a close family member of Tanya's was diagnosed with early-stage
dementia. Treat the subject matter with care; this is not a toy project to her.

Full background lives in the numbered folders — see `README.md` for the index.
`03_Design/ReCall_v0_Spec.docx` is the spec the current code implements.

## Current status (update me)

> **2026-09-05 — THE UX IS BEING REBUILT FROM SCRATCH.** v0.1's interface is judged bad
> enough that it prevents evaluating whether the underlying features work. The engine stays
> (Firebase, `db.js`, `ai/engine.js` — proven working end to end today); **every screen,
> flow and string above it is redesigned by the board and rebuilt.** Do not patch the
> existing screens. See `06_Handoffs/NEXT_SESSION_BRIEF.md`.
>
> The engine is *kept but reviewable*: the architect may flag anything in it that constrains
> the design, and changing it is a recorded decision rather than a quiet refactor.


- **v0.1 is live** (2026-09-02) at **https://tanyaya27.github.io/recall/** — a rebuild of the
  patient side around one idea: *Margaret never navigates.* One home screen shaped by the clock
  (morning routines → things → bedtime routines, evening shape persists until 5am), generic and
  app-prompted capture with honest AI claims, "not there? see earlier photos", pinning with fixed
  slots, routines editable in Settings, research-grade event log (schema v2).
  **Read `06_Handoffs/design/DAY_IN_THE_LIFE.md` first** — it is the story the code implements.
- **Write path proven** (2026-09-02): routines seed into Firestore on first load; no console errors.
- **Not yet exercised:** camera capture with a real API key on a phone. Settings → paste key →
  photograph something → confirm the tile appears; then a bedtime row → photograph → claim shown.
- **Firebase:** project `recall-d9886`, Firestore rules cover `recall_items` and `recall_events`
  only. v0.1 stores snaps/routines/checks in `recall_items` with a `kind` field for that reason.
- **Design-tool mockups** (v1, v2 delta) exist in `06_Handoffs/design/`; they were superseded by
  the day-in-the-life reset. Do not restart from them.
- **Tanya has not yet reviewed v0.1**, the day-in-the-life story, or `05_Research/RESEARCH_PLAN.md`.
  Her review is the next step. Open questions for her are listed at the end of DAY_IN_THE_LIFE.md.
- **Next build after her review:** Robert's device (log-for-her, household join code) and Priya's
  status screen; then Firestore rules per collection and a household ID.

## Repo layout

This whole folder is one git repo. Design thinking and code travel together on purpose —
the reasoning is as valuable as the code.

```
00_Vision/               abstract, advisory panel personas
01_Needs_and_Prioritization/  Kano analysis, interactive feature prioritizer
02_Strategy/             architecture memo, competitive analysis, AI capability scan
03_Design/               v0 spec
04_Engineering/recall-app/    the app source (React + esbuild)
05_Research/             clinical angle (empty for now)
06_Handoffs/             DECISIONS.md, LESSONS.md, sessions/
docs/                    BUILD OUTPUT — GitHub Pages serves this. Not documentation.
```

`docs/` is a confusing name for a folder full of build output in a repo full of actual
documentation, but GitHub Pages requires exactly that name. Never hand-edit `docs/app.js`;
it is generated from `04_Engineering/recall-app/src/`.

## Tech stack

- **React 18**, JSX, modular components, bundled by **esbuild**. React, ReactDOM and
  Firebase load from a CDN import map in `docs/index.html`, so `node_modules` is ~10MB.
- **Firebase** project `recall-d9886`, owned by Tanya's own Google account (NOT the shared
  `tanya-command-center` project — ReCall was deliberately separated, see DECISIONS.md):
  anonymous auth + Firestore. Photos are compressed JPEGs stored inline in Firestore docs.
  Collections: `recall_items` (docs carry `kind`: item | snap | routine | check), `recall_events`.
- **AI is abstracted.** The app only ever calls `engine.tagPhoto()` and
  `engine.answerQuery()` from `src/ai/engine.js`. Providers implement `visionJSON` and
  `textJSON` and register in one map. Anthropic (default, Haiku) and Gemini both ship.
  Every call site passes a `sensitivity` flag — the hook for future on-device routing.

## Working commands

All run from `04_Engineering/recall-app/`:

```
npm install     # esbuild only
npm run dev     # rebuild on change, serve at localhost:8000
npm run build   # bundle → ../../docs/app.js
./deploy.sh     # build + commit + push from the repo root
```

## Conventions

- **Never commit an API key.** Keys live only in the browser's localStorage, entered per
  device in the app's Settings. If you ever see a key in a file, stop and tell Tanya.
- The Firebase web config in `src/lib/firebase.js` is public by design — that one is fine.
- Adding a new AI provider means one file in `src/ai/providers/` plus one map entry.
  Never call a vendor API directly from a component.
- Keep `v0` honest: it is a walking skeleton, not an MVP. Resist scope creep into the
  76-feature backlog. If a feature idea is good, add it to the prioritizer, not the code.
- Tanya works best when pushed. Do not soften plans or pad estimates.
- **Never assert a cause you have not verified.** Today the app told Ravi he had no
  internet while he was online; the real cause was a VPN exiting in another country. A
  confident wrong diagnosis destroys trust in everything else the app — and Claude — says.
  Say what is observed, then go and check.
- **Copy is a design deliverable.** Every string Margaret sees belongs to the design lead
  and goes through the end-user board. Do not write user-facing text while fixing a bug.

## Known constraints (deliberate for v0, fixed at MVP)

- Shared household vault — every device sees the same items, no roles or accounts.
- LLM-over-captions search, no embeddings. Correct at under ~500 items.
- No service worker; offline means the Firestore cache only.
- **Security caveat**: Firestore rules currently allow any authenticated (anonymous) user
  to read and write. Combined with a public Pages URL, anyone with the link can reach the
  vault. Acceptable for test data; must be fixed before real family photos go in.
  See `LESSONS.md`.
