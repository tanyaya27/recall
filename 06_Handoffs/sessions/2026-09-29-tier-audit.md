# Session 2026-09-29 (evening): tier 2 wasn't stored — adversarial audit of multi-tier places (build 20260929c)

Started from `PROMPT_2026-09-29_bugfix.md`. Rig rebuilt; baseline green (audit_where is 63, not 83 as the prompt said).

## Ravi's report
Phone on `20260929b` (the screenshot showed "Current place:" and the prompt in the card, both only in `b`). Move it on the
plant sensor → Desk drawer kept at tier 1 → ＋ → two photos named "In air" → Save → tier 2 not stored. He asked for a full
logic + UI audit of multi-tier with the adversarial board.

## What was done
- Reproduced in the rig with the real rules on. Root cause: a place could not say where it is — a known place's outer tier
  was dropped, a new place got a `parent` field nothing read, and the save card read the camera, not the store.
- `rig/audit_tiers.js`: 16 scenarios, 26 checks; 16 fail on `20260929b`, all pass on `20260929c`.
- Board write-up `design/BOARD_2026-09-29_tiers-audit.md` (T1–T8, U1–U4, positions and disagreements).
- Fixes (bugs): place edges (every tier), boot repair of old `parent`, the camera shows a known place's own where, Move
  toast second line, Move with tier 1 kept doesn't touch the thing, unnamed places don't merge, no same-place/circle,
  the row keeps the selected square and ＋ in view, Undo covers place links, Settings → Version ends with the build name.
- Real rules engine ran in the container for the first time: `test_place_edges.mjs` 10/10. No rules deploy.
- Options rendered on the real screens for Q1–Q5 → `design/mockups/TIERS_Q*.jpg`; before/after strip
  `design/mockups/BUILD_2026-09-29c_tiers-before-after.jpg`.

## Suites at `20260929c`
repro_f3 50 · audit 100 · audit_roles 44 · audit_graph 66 · audit_label 14 · audit_private 34 · audit_d 117 ·
audit_where 63 (A5 now asserts the edge, not `parent`) · audit_tiers 26.

## Open
- Ravi/Tanya: Q1–Q5. Until Q1, the stored tiers show in the camera only (thing page, Find, Places show tier 1).
- Ravi's phone check of `20260929c`. His "In air" from `b` is an orphan place; re-doing the move fixes it.

## Later the same night: Ravi's rulings → `20260929d`
Ravi pushed `c`, then ruled: Q1 A with the squares scrolling and the words wrapping (a separator between tiers), Q2 A, Q5 A.
Q3 and Q4 he found cryptic; re-explained in plain words with one recommendation each ("say it, don't ask"; "outside a place,
only places") — "OK to both". Built as `20260929d`; audit_tiers 40/40; all eight suites green again
(50 · 100 · 44 · 66 · 14 · 34 · 117 · 63). Screens: `design/mockups/BUILD_2026-09-29d_tier-rulings.jpg`.

## 09-29 (late): `20260929e` and the camera card redesign
- Ravi (phone, `d`): the camera card is "jam packed" for an elderly person — proposed: question in the empty band beside
  Cancel, the thing's photo out of the row, a borderless +, + as the only chooser (no pills), a status line and a text chain.
  Mockups `design/mockups/MV_2026-09-29_camera-card-redesign.jpg` (gen_mv.py/render_mv.js/compose_mv.py); he likes B if
  Cancel moves beside the shutter → `MV_2026-09-29_cancel-bottom.jpg`. Awaiting his call on + Next (L1/L2).
- Fixed in `e`: caption/Add photo top alignment + 2-line cap (probe_cap 14/14), pin placeholder not in button colours.
  Suites: 50 · 100 · 44 · 66 · 14 · 34 · 117 · 63 · tiers 40.

## 09-29 (evening): `20260929f` and the camera card rulings
- Ravi worked the camera-card mockups through four rounds (set a level; formatting; "in" pills + hold Save; Choose button
  and the saved flash). All rulings on one sheet: `design/mockups/MV_2026-09-29_camera-card-all-rulings.jpg`; DECISIONS.
- `f`: "thing" → "item" everywhere. Suites: 50 · 100 · 44 · 66 · 14 · 34 · 117 · 63 · tiers 40 · probe_cap 14.
- Next: build the camera card once the recognise wait and the 6-photo cap are answered.

## 09-29 (late night): `20260929g` — the camera card built
- Ravi ruled the last two: the recognise wait is **3 s** (later maybe "wait 3 more seconds"), and a place's 7th photo
  **replaces the oldest** (the main photo stays). Built the whole ruled card (see OPEN_ITEMS `g`, DECISIONS late night).
- Migrating the suites to the new controls found three real defects, fixed: two questions on screen at once (item + place),
  "what the a place is in", and ☰ Choose place dropping under the squares at 2+ levels (plus a 3 px clip at Largest).
  Also removed the dead "The camera" A/B picker from Settings.
- New suites: audit_card 31, probe_row 9. Suites: audit 100 · roles 44 · graph 66 · label 14 · private 34 · d 83 ·
  where 53 · repro_f3 45 · tiers 43 · probe_cap 14 · card 31 · row 9 = 536, all green.
- Screens: `design/mockups/BUILD_2026-09-29g_camera-card.jpg`.

## 09-29 (night): Ravi's phone test of `g` → `20260929h`
- Move it on "3D model of plant sensor": the Ikea shelf (tier 2) was not shown on the next Move it, so tier 3 couldn't be
  added on top; typing a new tier's name, the keyboard hid the field and the "A new place called …" row (the tier was never
  picked, and closing the sheet removed it); the item page had no "in" pill. All three reproduced in the rig
  (`audit_chain.js`, failing first), fixed, and the page shows the chain with "in" pills. Screens:
  `design/mockups/BUILD_2026-09-29h_move-chain.jpg`. Suites 551 green.

## 09-30: a new way of testing → `20260930a`
- Ravi asked why the audits keep missing bugs; he approved `06_Handoffs/TESTING.md` (all but the iPhone Simulator and a paid
  device service). Built the oracle, journeys, monkey, WebKit runs, the house copy, `run_all.sh`, and ran an independent
  tester twice (it read only the rulings). They found ~20 real bugs, one of which deleted an item; all fixed with failing
  checks first. Screens: `design/mockups/BUILD_2026-09-30a_testing-fixes.jpg`. 728 checks green (incl. WebKit).
- Open for Ravi: 4 design questions (OPEN_ITEMS), and his house copy for the rig.

## 09-30 (later): Ravi's answers → `20260930b`, `20260930c`
- `b`: Save + Next gets an Undo (a line at the top of the picture). J14.
- `c`: Ravi agreed with Claude's picks (mockups `OPTIONS_2026-09-30_move-card-remove-merge.jpg`) and added a photo review
  for "merge · keep all photos". Built: the Move note on the item page (no card), the place page as the worklist (Move /
  Move all; Remove waits), merge with a photo check (`engine.samePlace`) and the review with a confirmed ✕ per photo.
  Screens: `design/mockups/BUILD_2026-09-30c_move-note-remove-merge.jpg`. 745 checks green (incl. WebKit).
- `a`, `b`, `c` pushed together (commit a8416a1); live as Build 20260930c.

## 09-30 (night): Ravi's phone test of `c` → `20260930d`; the tier question
- Four bugs from his screenshots, each reproduced first (`rig/audit_p30d.js`, 2/14 at the start → 15/15): one photo
  viewer; "seen" vs "moved" (+ the photo's own time); Choose place names the tier it changes (camera and sheet); the
  square after Choose place on a photographed tier (and the photo that leaked onto another place). Plus "nothing here
  yet" and "the in air". Screens: `design/mockups/BUILD_2026-09-30d_phone-fixes.jpg`.
- The tier question went to two new boards (Ravi asked): `design/BOARD_2026-09-30_tiers-or-freeform.md` and
  `design/mockups/OPTIONS_2026-09-30_tiers-or-freeform.jpg`. Awaiting Ravi and Tanya.

## 09-30 (late night) → `20260930e`
- Ravi's phone (12:32): typing in Choose place hid the text box — the same as the independent tester's #1 on `d`
  (`rig/indep/REPORT_d.md`, 8 finds). All 8 reproduced in `audit_p30d.js` (T1–T8) and fixed. Ravi's colour idea
  (critiqued, drawn, he chose "build both") built: only the focused tier coloured; Choose place wears its colour.
