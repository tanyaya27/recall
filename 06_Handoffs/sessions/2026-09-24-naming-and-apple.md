# Session 2026-09-24: the name, and the Apple Developer Program (no app code changed)

Prompt: `06_Handoffs/PROMPT_2026-09-24_naming-and-apple.md`. It ran alongside the MVP session.

## What happened

- **Job 1: the name.** The boards plus Noor agreed the criteria first. Two splits are recorded: Devin wants
  ≤ 9 letters and a rendered home-screen check, and Priyanka wants a domain we can get without a broker.
  The session generated **19 candidates** across five strategies and **checked every one**: live USPTO marks
  in classes 9/42, the App Store, domains (RDAP, then a fetch of each registered site), Google Play via web
  search, and the web. **35 more names** were screened out on the way. Everything is in
  `design/BOARD_2026-09-24_naming.md`, with a source link for each result.
- **Result:** the "find my stuff" category is crowded. Cubby, WhereBox, Thingly, Nookly, TuckAway, Kept,
  PutAway and Stowly are all apps for exactly this job, so nearly every real "keep/find" word is taken.
  RECALL turned out to be **registered** in classes 9 and 42, not only pending as the findings note said.
  **Shortlist:** Wherly · Thingspot · Wherewell · Hither · *ReCall: Where I Put It*. The board leans
  Wherly, with Thingspot as the safe plain alternative. **This is Tanya and Ravi's call.**
- **Job 2: Apple.** Apple's current pages were re-read. The who-enrolls options and their consequences are
  in `APPLE.md` §1:
  - Ravi as an individual, Tanya as an individual, Nova Camino Ventures LLC, or a new entity.
  - Tanya can hold the membership only if she's 18 or older. If she isn't, Apple's route is a parent's
    account shared with her.
  - Apps can move between accounts only after one App Store release.
  - Sign-up steps and the after-approval steps are in `APPLE.md` too. The sign-up waits on that decision.
- The name-check script and trimmed results are in `05_Research/naming/`. It reruns in about a minute for
  new names.

## What broke

- The link to the Mac dropped several times, and Chrome (Claude in Chrome) wasn't reachable, so Google Play
  couldn't be searched in the browser. Play results come only from web search; OPEN_ITEMS has the manual check.

## Tanya's rulings at the end (DECISIONS 09-24)

- **The name is paused**: "I and my dad need more time". The shortlist stays open (OPEN_ITEMS, PARKED).
- **Ravi enrolls as an individual, and Tanya is credited.**
- **09-26 (Tanya): the two jobs split.** From here this session is only the Apple Developer sign-up; the name moves to
  its own session, `PROMPT_2026-09-26_naming.md`.
- The move to an LLC later is documented in `APPLE.md` §2: Apple's own individual-to-organization request, or an
  app transfer after the first release. So the bundle ID must be neutral (`com.<neutral-owner>.recall`, to be
  confirmed with Ravi).

## Half-finished / next

1. Ravi enrolls (this session, from 09-26). Then: Team ID, bundle ID, Sign in with Apple, and Tanya added in App Store
   Connect (`APPLE.md` §3).
2. The name, in its own session (`PROMPT_2026-09-26_naming.md`), when Tanya and Ravi are ready: Google Play by hand, native-speaker glance, rerun the check script,
   attorney clearance, then domains with Ravi's OK.
3. If the name changes, the list of places it appears is in OPEN_ITEMS, for the MVP session.
4. **A stale `.git/index.lock` was left on the Mac**: a `git status` run from the session's shell couldn't remove
   its lock. Ravi's usual first command, `find .git -name "*.lock" -delete`, clears it.
