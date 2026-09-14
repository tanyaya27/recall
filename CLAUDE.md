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
6. `06_Handoffs/OPEN_ITEMS.md` — the running to-do list. `06_Handoffs/RIG.md` — how to look at
   a build before handing it over. **No build goes to the phone unreviewed:** run
   `04_Engineering/recall-app/rig/audit.js` (74 checks, every path) and look at the shots.
   **No layout change without rendered options shown to Ravi first** (`rig/mock/`).

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
`03_Design/ReCall_v0_Spec.docx` was the v0 spec; the design of record since 2026-09-05 is
`06_Handoffs/design/BOARD_2026-09-05_interaction_model.md`.

## Current status (update me)

> **2026-09-14 — v0.2 is LIVE (stamp `20260905l`); build `20260914o` is BUILT, NOT YET
> DEPLOYED** (n: thing card layout A, chosen by Ravi from rendered options)** (m: private items — exclusion model, one switch; rules enforce it in multi-user stage 1)** (l: thing card = Add photo · Edit, no *Found it*; wrong-photo guard; hold on the
> photo; shorter footer. **Multi-user:** three boards met in parallel — customer, UX, tech —
> reconciled in `06_Handoffs/design/PLAN_2026-09-14_multi-user.md`; six splits await Ravi/Tanya)** (k: the full-path audit — `06_Handoffs/design/AUDIT_2026-09-14_full-path.md` —
> found four real bugs incl. Add photo failing on every pre-09-14 item; all fixed, 67/67)** (i: in-app camera — `Camera.jsx` — replaces iOS's capture sheet everywhere)** (d is live; e/f add the Version-card update banners, a tighter footer, and the
> hamburger menu — Ravi overruled the board: Look and feel, Locations, Deleted items,
> Research log live there; Settings is the developer's Version + AI key, slated for removal).** Everything from 2026-09-05 is on the phone. Today, from two rounds of Ravi's
> phone feedback (`06_Handoffs/design/BOARD_2026-09-14_*.md`): footer verbs *Log item* ·
> *Find item*, screen *My items*; 600-px thumbnails (old ones rebuilt on load); the thing
> card's photo strip with an *Earlier* mode and *Where it has been* rows; several photos
> per log via the *Saved* toast; *Remove this photo*; ranked search; `aliases[]` so a
> renamed thing still merges; pencil on every editable field; day + date on the day line;
> Settings → Places. Deploy commands and the phone check: `06_Handoffs/OPEN_ITEMS.md` —
> **the running to-do list; read and update it every session.** Round 3 (`BOARD_2026-09-14_phone-feedback-round-3.md`): the roll (several photos before
> the place), the AI *looks* at candidates' photos to catch a re-logged thing, *Fix* split
> from remove, press-and-hold item sheet, the strip peeks. **Every build is now reviewed in
> the rig first — `06_Handoffs/RIG.md`.** Tanya agreed appointments go right after the
> helper phone.
>
> **The design of record is `06_Handoffs/design/BOARD_2026-09-05_interaction_model.md`.**
> `DAY_IN_THE_LIFE.md` is now history: its rules 2, 3, 5 and 7 survive; the clock-shaped
> home does not. Open for Tanya: S1 (header + footer, built as recommended), the palette,
> and whether to keep Ravi's 09-14 labels (Devin/Margaret objected).

- **v0.2 — the board model.** Home = her things as photos in first-photographed order, never
  rearranged, with *Log item* · *Find item* (since 09-14; were *Take a photo* · *Where is my…*) fixed at
  the bottom. Every other screen is
  one card with a header (*‹ Back · title*) that returns home. Tapping the place saves the
  photo. A new photo of a known thing updates that thing (asked, never silent). Thing card:
  photo · place · when · *Not there? Earlier photos* · *Found it — new photo* · quiet *Fix*.
  Settings: AI key + check, **Look** (3 palettes, 3 text sizes — per phone), recently
  removed, research export. Routines exist in the data but are not shown or seeded.
- **Platform-conventions audit (late 09-05)** — `06_Handoffs/design/BOARD_2026-09-05_platform_conventions.md`:
  history-backed routing (edge swipe works), pressed states, in-app confirm sheet, toasts with
  Undo, offline line (strict), icons, grouped Settings, Dusk + *Match my phone*, 4:3 cropped
  photos above the fold. Built, compiles, SSR-tested; **needs the phone.**
- **Components:** `Camera` (in-app, multi-shot) `Board` (press-and-hold) `PhotoCard` (the roll, identity tiers) `ThingCard` (strip + Earlier mode)
  `ItemSheet` `Ask` `MenuScreens` (drawer, Look, Locations, Deleted, Research) `SwipeRow` `Settings` (Version + AI key)
  `Header` `Footer` `Confirm` `Toast` `Icons` `EditableText`. v0.1's `Home/CaptureFlow/AnswerView/Onboarding/PlaceChooser/RecentReel`
  are deleted (git has them). `lib/prefs.js` is new. `docs/styles.css` is in rem.
- **Engine changes (all in DECISIONS.md):** `household`, `order`/`boardKey`, snap cap 10/30,
  `naming` flag, `absorbInto`, event schema v3; 09-14: `aliases[]`, `logId`/`photoCount`,
  `thumbV`, soft-deleted snaps, `kind: 'place'` docs, `findMatch` (AI `sameAs` › name › head noun › shared word).
- **Footer (late 09-05, Ravi):** side-by-side buttons that become floating translucent
  icons when a label cannot fit — measured on the device by `Footer.jsx`, never stacked.
  Built, rig-verified at 375/390/430 px × 3 sizes; deployed 2026-09-05 (`20260905l`).
- **Live site:** https://tanyaya27.github.io/recall/ — check the Version card in Settings
  against the `?v=` stamp in `docs/index.html` before assuming anything is deployed.
- **Firebase:** project `recall-d9886`, rules cover `recall_items` and `recall_events` only,
  wide open to anonymous auth. **Tanya's console list:** tighten rules by `household`;
  composite index (kind, itemId, at) so earlier photos can use `limit()`.
- **Next build:** multi-user stage 0 (*This phone is used by*), then appointments, then the
  staged household work — see `PLAN_2026-09-14_multi-user.md`; each stage is two agents in
  parallel with the boards reconvening on screenshots.
- **Preview for Tanya:** a static render of every screen with the palette/size switcher is
  published as the *ReCall Board Preview* artifact (also `recall-board-preview.html` in
  the session outputs).

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
  Collections: `recall_items` (docs carry `kind`: item | snap | routine | check | place), `recall_events`.
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
