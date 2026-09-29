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
