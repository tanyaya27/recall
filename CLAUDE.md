# CLAUDE.md — read this first

You are working on **ReCall** with Tanya Angadi (high school student, project owner and builder).
This file is the entry point for every session, on any machine. Read it before doing anything else.

## Read at the start of every session

1. This file (project state + conventions).
2. `06_Handoffs/DECISIONS.md` — why things are the way they are.
3. `06_Handoffs/LESSONS.md` — traps already discovered. Do not re-learn these the hard way.
4. The most recent file in `06_Handoffs/sessions/` — what happened last time.

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

- **v0 walking skeleton is built**: all 8 spec use cases, in `04_Engineering/recall-app/`.
- **DEPLOYED and booting cleanly** (2026-08-31) at **https://tanyaya27.github.io/recall/**
  Repo: `github.com/tanyaya27/recall` (Tanya's own account; Ravi is a collaborator).
  First load verified: HTML/CSS/JS all 200, React renders, Firebase anonymous auth
  succeeds, onboarding checklist paints correctly.
- **Firebase fully wired and verified** (2026-08-31): project `recall-d9886` on Tanya's own
  Google account, Spark plan, Firestore in `us-west1` (default database), Anonymous
  sign-in enabled, rules published. Live app loads with **zero console errors**; anonymous
  auth returns a uid and the `watchItems` listener attaches cleanly, so the auth + read
  path is confirmed end to end.
- **Write path still unproven.** Nothing has been saved yet — that needs a real camera
  capture, which is the smoke test below.
- **API key not yet entered.** Per device, via the app's Settings.

Next up: paste the Anthropic API key, then run the first-capture smoke test on a phone
(onboarding → snap keys → confirm → tap the Keys tile) and fix whatever breaks.

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
  Collections: `recall_items`, `recall_events`.
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
  74-feature backlog. If a feature idea is good, add it to the prioritizer, not the code.
- Tanya works best when pushed. Do not soften plans or pad estimates.

## Known constraints (deliberate for v0, fixed at MVP)

- Shared household vault — every device sees the same items, no roles or accounts.
- LLM-over-captions search, no embeddings. Correct at under ~500 items.
- No service worker; offline means the Firestore cache only.
- **Security caveat**: Firestore rules currently allow any authenticated (anonymous) user
  to read and write. Combined with a public Pages URL, anyone with the link can reach the
  vault. Acceptable for test data; must be fixed before real family photos go in.
  See `LESSONS.md`.
