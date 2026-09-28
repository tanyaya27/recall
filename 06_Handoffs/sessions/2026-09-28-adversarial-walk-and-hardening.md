# Session 2026-09-27/28: adversarial walkthrough → requirements → where-camera hardening (build 20260928a)

Ravi's brief (09-27, verbatim in kind): four gaps in `20260927d` — pencil-to-new-location gives one photo per
tier; a recognized place must be confirmed, not merged; a new place should be named right there; "Not put
away" fills with places-that-are-not-things. Then: *"create a new UX, product manager and 3 new user personas
that will act as adversarial personas and walk through every possible click path and screen … produce a very
detailed requirements doc … then execute the changes using Sonnet … automatically by spawning agents without
asking for my feedback."* Run in Fable, implementation agents on Sonnet, per his instruction.

## What happened

1. **Rig rebuilt** in the container from `RIG.md`; baseline **258/258** across the five live suites.
2. **A 90-state walk of every screen and path, both looks** (`rig/walk_f1.js`, inventory in
   `rig/WALK_INVENTORY.md`) confirmed all four gaps and found six more (F1–F10). The worst: a chip-picked
   place is *destroyed and silently renamed* by the next photo; a typed place never becomes a place record
   at all; name collisions merge into existing places with no ask.
3. **New adversarial board** (Grace PM · Tomás UX auditor · Frank 67 · Mei organizer · Sunil 72
   low-vision) wrote `design/REQUIREMENTS_2026-09-27_where-camera-hardening.md`: findings F1–F10 with
   screenshot evidence, requirements R1–R8 with acceptance criteria and an audit map, disagreements
   recorded (Tomás lost confirm-per-photo; Grace lost keeping where-boxes as chores; Mei got 6 place
   photos, not 10).
4. **Implemented by Sonnet agents in three stages**, per Ravi's no-checkpoint instruction:
   - R1 attach-never-replace (a level holds identity + photos; count badge; no naming pass on identified
     levels); R2 typed/picked places become real place docs, photos flow to them at save, PLACE_PHOTOS
     3→6 with a ~700 KB byte guard, typed level stays selected to photograph; R3 per-level rename at
     capture, user name beats a late AI name, "Unnamed — tap to name" on the saved card; R4 name-collision
     ask ("Your kitchen counter?") beside the visual one, distinct-name gate on No, candidate pool 4+4,
     one ask at a time; R5 the chain sheet (rename/replace/remove ONE level) replaces the chain-nuking
     Choice; R6 where-created boxes carry `asWhere` — excluded from Not put away and the amber pill, tile
     shows "N inside"/dash, soft nudge line on the card instead of a chore; R7 both looks.
   - New files: `components/ChainSheet.jsx`; changed: LogCamera, SavedCard, NotPutAway, Board, App, db.js,
     styles.css. New suite `rig/audit_where.js`.
5. **Blind verification** by a fourth agent that saw only the requirements: wrote its own walk
   (`rig/verify_f2.js`), **104/104 own checks, PASS on R1–R7 in both looks**, store-dump confirmation,
   evidence strips in `design/mockups/VERIFY_R1..R6.jpg` + `VERIFY_REGRESSIONS.jpg`. Audits after
   everything: **audit 100 · roles 44 · graph 66 · label 14 · private 34 · where 63 = 321/321.**
6. `docs/app.js` rebuilt with the production flags; both `?v=` stamps → **20260928a**. **Committed to the
   Mac working tree, NOT pushed; nothing deployed.**

## What broke / gotchas

- The rig's build path bundles from `rig/src` (a copy), not the edit tree — sync before every build.
- The rig's localStorage-backed Firestore stub hits the browser's ~5 MB quota after ~15–20 full-res photos
  in one run and then *silently drops writes* (docs vanish on reload). Promoted to LESSONS; reseed between
  scenario groups until the stub reports quota failures.
- One pre-existing audit assertion (G5e) encoded PLACE_PHOTOS=3 and was updated with a comment.

## Half-finished / next

- **Ravi's phone check of 20260928a** (the walk is rendered, but the phone is the judge): log a thing into a
  chip-picked place and add a photo of it; type a new place, then photograph it in the same breath; trigger
  the "Your …?" ask both ways; check Not put away no longer lists the box you used as a where.
- The rig stub's quota fix (small, cosmetic to the rig only).
- Stage-2 deviations to sanity-check on the phone: nudge line only when l2 would be empty; Save gate keyed
  on any still-colliding level.
- Naming and Apple Developer threads unchanged (their own sessions).
