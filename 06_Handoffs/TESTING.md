# How ReCall is tested (from 2026-09-30)

Ravi, 09-30: "I keep finding bugs … We have done several full audits and this has not been caught. What do you suggest
we do differently?" — and approved everything below except the iPhone Simulator and a paid device service (those come
with the native app).

## Why the old audits missed things

- **The same person wrote the code and its tests.** The tests checked the design as intended, so the blind spots were
  in both (the tier-2 audit that asserted the write-only field; two questions at once after the redesign).
- **One pass, never a second visit.** Build → save → check → stop. Ravi comes back the next day and moves it again.
- **Chromium on a desktop.** No iPhone keyboard, not Safari.
- **Each screen checked alone.** Nothing checked that every screen says the same thing the same way.
- **A tidy sample house.** Shallow chains, no old data.
- **The rig could fail silently.** Its store stopped saving past ~5 MB and dropped writes after a reload — it looked
  like an app bug (found 09-30; now it dedupes photos and says so loudly if it ever fails).

## What runs now (all in `04_Engineering/recall-app/rig/`, `./run_all.sh` runs everything)

| # | What | File | Catches |
|---|---|---|---|
| 1 | **The oracle** — one truth for "where is it", from the store; the item page, the Find tile, Move it (squares and chain line) and the card after Save must all say it, the same way ("in" pill); plus the store's own rules (one "in" each, no circles, no place in a box, ≤ 6 photos a place). | `oracle.js` | screens disagreeing; data that breaks the model |
| 2 | **Journeys** — stories over "days" in plain words, the oracle after every step. Add one for every bug a story would have caught. | `JOURNEYS.md`, `journeys_body.js` | second and third visits; rename, undo, move-the-box… |
| 3 | **The monkey** — random real actions in random order (log, move, add on top, change a tier, rename, undo, cancel halfway), the rules after every step, the oracle on what it touched. Same seed = same run: `SEED=303 STEPS=40 node monkey.js`. | `monkey_body.js` | sequences nobody scripted |
| 4 | **An independent tester per build** — a separate agent that reads only Ravi's messages and rulings (never the code) and tries to break the build at phone size, in both engines, with the keyboard up and big text. Its report goes to `rig/indep/REPORT.md`; every real bug gets a failing check before the fix. | (agent) | what the builder can't see |
| 5 | **Safari's engine** — WebKit runs the camera suites (`ENGINE=webkit node -r ./engine.js audit_chain.js`). The iPhone keyboard is stood in for (a visual viewport that shrinks by 380 pt) wherever a field is typed into. | `engine.js` | Safari-only layout and tap bugs |
| 6 | **Your real house** — menu → Research log → "Download a copy of my house" saves a file on the phone (items, places, links, small photos; nothing is sent). Drop it in the folder and every build runs the oracle over it: `REAL=/path/recall-house-….json node realhouse_suite.js` (add `ALL=1` for every item). | `realhouse.js`, `realhouse_body.js` | old data, deep chains, real names |
| 7 | **"Who else shows this?"** — the checklist below, before any build ships. | this file | the change that fixes one screen and leaves another |

Still to come with the native app: the iPhone Simulator, a real-device service.

## "Who else shows this?" — before every build

For the data the change touches, go through every screen that shows it:

- [ ] Camera (Log and Move it): squares, Place line, chain line, the question, the Choose place list
- [ ] Item page: Where it is (squares and words), In it (for a box)
- [ ] The card after Save (a Log and a Move)
- [ ] Home tiles and Find tiles
- [ ] Places list and a place's own page
- [ ] …at Normal / Large / Largest, 390 and 375 wide, with the keyboard up where there's a field
- [ ] …on a second visit (open it again after saving) and after Undo
- [ ] …in WebKit

## When Ravi finds a bug

1. Reproduce it in the rig with a failing check (never fix blind).
2. Ask which gap let it through (the list at the top) and add to the right place: a journey, a monkey action, an oracle
   screen, the checklist.
3. Fix, see the check pass, run everything (`./run_all.sh`), look at the screens.
