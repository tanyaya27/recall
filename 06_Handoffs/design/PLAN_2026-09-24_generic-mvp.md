# A memory app for anyone: what the MVP is missing (2026-09-24)

**Status: gap list for Tanya. Nothing is built.** This follows
`BOARD_2026-09-24_scenarios-and-logging.md`. Tanya still has to go through its §10.

## Tanya's rulings (09-24)

1. **ReCall is a general memory app for people from all walks of life, with or without an
   ailment.** Memory lapses happen to everyone, and the more complex the situation (a tradesman
   with hundreds of tools, a family that has just moved), the more common they are. The app has
   to be targetable to each situation so it appeals broadly. Mild dementia was where we started;
   it is not the boundary. Example from Ravi's parents: they still can't find their bank locker
   key after ten years of looking.
2. **The logging clock starts when the person reaches for the phone, not when our app opens.**
   Counting taps inside the app lets us ignore the slowest parts: unlocking, finding the icon,
   the app starting, the camera permission prompt, and waiting for the AI.

This resolves §0 of the scenarios note. The Kano work in `01_Needs_and_Prioritization/` was built
on the memory-loss premise, so it needs a deliberate re-run for the general user (Maya). That can
run alongside the MVP; it doesn't block it.

---

## 1. The stopwatch, from reaching for the phone

One log of *"I'm putting the key in the blue tin"*, stage by stage. The web column is based on
how the app is built today (`20260921b`). The seconds are **estimates to be measured on the
phone**, not measurements.

| Stage | Web app today | Native app, target |
|---|---|---|
| Phone locked → unlocked | Face ID, ~1 s | same |
| Find ReCall on the home screen | 1–3 s (which page, which folder?) | **0**: a lock-screen / Control Centre button, the Action Button, or "Hey Siri, ReCall this" goes straight to the camera |
| App starts and signs in | a cold boot every time iOS evicts the web app; not yet measured on the phone | native launch, straight into the camera |
| Camera permission | **iOS asks on every launch** of a home-screen web app (DECISIONS 09-15) | asked once, ever |
| Tap *Log item* | 1 tap | 0 |
| Shoot, then *Done* | 2 taps | 1 tap (the shutter; leaving the camera means done) |
| Wait for the name, then answer *Where is it?* | AI naming (a few seconds) + 1 tap | 0 when the place is guessed confidently; the name fills in afterwards |
| **Total** | **~6 taps and a permission prompt, 10 s+ (estimate)** | **1 tap, a few seconds** |

**What this shows:** most of the time goes *before* our first screen (finding the icon, the cold
start, the permission prompt) and *after* the shutter (waiting for the AI, then the place
question). Polishing the screens between those two points was the wrong target, which is Tanya's
point exactly.

How we'll measure it: (a) a native App Intent can record when the trigger fired, so the app can
log trigger-to-saved on every capture; (b) until then, a stopwatch protocol: ten real logs on
Ravi's phone, filmed, from pocket to saved.

---

## 2. What's missing, in three tiers

### Tier 1: a stranger can't use ReCall at all without these

| # | Missing | Why it blocks a general user | Rough cost |
|---|---|---|---|
| 1 | **AI with no API key** | Every phone has to paste its own Anthropic key into Settings (`engine.js`, `recall-ai-config`). No ordinary person can do that. The server-side `ai` callable is already deployed but the app doesn't use it. Route every AI call through it, with a per-person daily cap so one account can't run up the bill | 2 d |
| 2 | **Neutral AI prompts and copy** | Five prompts in `engine.js` begin *"someone with memory loss…"*. That changes how the model names things and the tone of its answers, and it is wrong for Dan's garage. Rewrite neutral; Devin reviews every string | 0.5 d |
| 3 | **Get to the camera in one step: the native app** | The stopwatch above. Capacitor wrap → TestFlight; lock-screen/Control Centre control, Action Button, Siri shortcut, share sheet; camera permission asked once. Needs an Apple developer account (Apple sign-in needs one too) | 4–6 d + Apple review |
| 4 | **Safe for strangers' homes** | Strip the legacy rules clauses (`firestore.rules`: any signed-in device can read, and claim, any document that has no owner yet) and re-run the rules engine tests. Before the App Store: a privacy policy, **in-app account deletion** (App Store rule 5.1.1(v)), data export, and **Sign in with Apple or an equivalent private login**, because rule 4.8 requires one when Google sign-in is offered | 3 d |
| 5 | **A first run with no setup** | Today a fresh phone sees *"One-time setup — this phone needs its AI key"*. With #1 that card goes; first run becomes one welcome line and the camera | 0.5 d |

### Tier 2: the core memory features a general user needs

| # | Missing | Who it serves | Rough cost |
|---|---|---|---|
| 6 | **Capture without questions.** Save the moment the shutter is pressed; guess the place from the photo, the last place used, or where the thing usually lives; ask *Where is it?* only when the guess is weak, and let it be answered later. A **session** option: set the place once ("garage, shelf 3", "box 14") and every shot after it goes there | everyone; bursts for moving house, the garage, the garden | 2 d |
| 7 | **Places inside places, and containers that move.** `parent` is reserved on places but nothing reads it. A box, a tin or a toolbox is a place that can itself be moved. The answer then shows the chain: *Bank locker key → blue tin → top shelf, bedroom wardrobe*, each with its photo | the bank key; storage; garage bins; anyone who hides valuables | 3 d |
| 8 | **One photo, many things.** A photo of an open drawer, a shelf or a box's contents logs every item the AI can see in it, all at that place. One shot can log twenty things; after that, *"where's the tape measure?"* searches inside the drawer photos | the biggest logging-speed gain for everyone; the "sweep the house" case | 2 d + an accuracy spike |
| 9 | **Read the text on things.** Labels, packets, documents: *"#8 × 1¼" stainless"*, *"Tulip 'Queen of Night'"*, *"Bank of …, locker 214"*. Stored as `details` and searchable | the garage; the garden; papers | 1 d |
| 10 | **Log without a photo.** Typed or dictated: *"Bank locker key, blue tin, top of the wardrobe."* For the dark cupboard, the hiding place you'd rather not photograph, or when the camera is simply slower | everyone | 1 d |

### Tier 3: needed before the app grows, not for the MVP loop

| # | Missing | When it starts to hurt | Rough cost |
|---|---|---|---|
| 11 | **Photos out of Firestore documents** into Cloud Storage. Today JPEGs sit inside documents (1 MB limit), and the Home listener carries every thumbnail | past a few hundred things (a tradesman, a move) | 2 d |
| 12 | **Search that scales.** Asking the AI over captions is correct up to ~500 things (CLAUDE.md); beyond that, embeddings or a server index | the same users as #11 | 2–3 d |
| 13 | **Measuring time-to-log in the app** (trigger → saved, per capture, in the research log) | from the first external tester | 0.5 d |

### Deliberately *not* in the MVP

These have value and wait until the find loop is proven with general users: appointments, bills
and to-dos (the *Do* side); *Together*; plantings; stock; the setup questionnaire (for now the
app starts everyone on everyday things and suggests more as they log); the H1 layouts as
Settings styles.

---

## 3. The MVP, as one sentence and one sequence

**Anyone can install ReCall, point it at where they put something with one tap from the lock
screen, and later ask for it and get the photo, the place and the containers it's inside, with
no key, no setup and no question asked unless the app is unsure.**

Suggested order (Priyanka; Sam agrees on 1 → 4 first):

1. **#1, #2, #5**: no key, neutral, no setup card (web, about 3 days). The app becomes usable by
   a stranger.
2. **#6, #9, #10**: capture without questions, label text, logging without a photo (about 4
   days, web). Logging gets faster before any native work.
3. **#7, #8**: nested places and many things per photo (about 5 days). The bank-key case and
   the sweep.
4. **#3, #4**: native app, then the App Store's privacy and account requirements (about 7–9 days
   plus Apple review).
5. **#11–13** when the first testers outside the family arrive.

About four weeks of build, each step shown as rendered screens before it's coded (the standing
rule), with the rig audits extended per step.

## 4. Where the boards disagree

- **Native first or last?** Sam and Noor: first. The stopwatch says it saves the most seconds,
  and designing capture for the web and then redesigning it for the lock screen does the work
  twice. Priyanka and Maya: last. It costs the most, depends on Apple's review timing, and steps
  1–3 make the app better on the phones we already have. **Recommendation: step 1 first either
  way** (without it nobody else can try the app), then Tanya picks.
- **One photo, many things (#8) in the MVP?** Devin: it changes what a *thing* is; a drawer photo
  with twenty guessed names is twenty chances to be wrong. Maya and Dan: it is the only feature
  that makes logging a whole house feasible. **An accuracy spike first** (twenty real drawer and
  shelf photos from Ravi's house) decides it.
- **The bank-key story, stated honestly (Dr Kim):** ReCall finds what was logged after installing
  it. It can't find a key lost ten years ago. #8's sweep (photograph each drawer, tin and box once)
  is the closest it comes, and the board agrees the copy must never promise more.

## 5. Needs Tanya

1. Is the MVP sentence in §3 the right one?
2. Accept Tiers 1–2 as the MVP and Tier 3 plus the *Do* side as after it?
3. Native app: first, or after step 3?
4. Start step 1 now (no key, neutral prompts, no setup card)? It moves no control, so it
   doesn't need a rendered option first; the new first-run line does, and it's one screen.
