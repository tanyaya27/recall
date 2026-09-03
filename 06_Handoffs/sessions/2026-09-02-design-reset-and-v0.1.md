# 2026-09-02 — Design prompts, a design reset, and v0.1

**Machine:** Dad's Mac. **Working with:** Ravi.

## What was attempted

1. Wrote the self-contained Design-tool prompt the brief asked for
   (`design/ReCall_MVP_Design_Prompt_v1.md`, 22 MVP features + showcase: active recall, voice
   self-reminders). Ravi ran it. Mockups came back with no navigation and with Find (keys) and
   Check (pills, stove) drawn identically. Review in `design/mockups-v1-review.md`.
2. Wrote v2 (full) and a v2 delta for the existing Design session: Find/Today split, bottom bar.
   Ravi ran it and still couldn't make sense of the app — "vertigo". Concluded the problem was
   upstream: designing screen-per-feature.
3. **Reset.** Walked the day hour by hour (morning pills, find loop, wrong answer, evening check,
   2am). Result: `design/DAY_IN_THE_LIFE.md` and four decisions in DECISIONS.md. Key idea:
   Margaret never navigates; the clock is the navigation.
4. **Built v0.1** from the story, patient side, one device. Deployed; boots clean; routines seeded
   into Firestore (write path proven); evening shape and prompted capture verified in a browser.
5. Added `how-to-videos` to the prioritizer (Ravi's third class: How, after Find and Do).
6. Wrote `05_Research/RESEARCH_PLAN.md`: four candidate studies for Tanya's NYU work and the event
   schema v0.1 logs from day one.

## What is half-finished

- **Camera capture with a real key has still not been run.** Everything up to the file picker is
  verified; `tagPhoto`, `verifyRoutinePhoto`, chips, auto-save, the earlier-photos scroll and pinning
  are untested against real photos. Expect bugs there. That is the smoke test.
- Two commits (`d28e733`, `e38abf0`) were made from the sandbox and pushed by Ravi from the Mac.
  Lock files were left behind twice; see LESSONS.
- `DAY_IN_THE_LIFE.md`, the research plan and v0.1 are **unreviewed by Tanya**.

## What to do next

1. Tanya reads DAY_IN_THE_LIFE.md, opens the live app on her phone with a key pasted in, runs the
   smoke test (photograph keys → tile → "not there" → earlier photos; set bedtime hour to now →
   photograph the stove → see the claim). She answers the four open questions in the doc.
2. Fix whatever the smoke test breaks.
3. Then Robert's device: role choice, household join code, log-for-her, caregiver Today; and Priya's
   status screen. That build needs Firestore rules rewritten per collection with a household ID —
   do the `kind`→collections split at the same time.

## Things worth knowing

- The published artifact link Ravi shared for the mockups was never updated with the v2 rework, so
  the v2 mockups were not reviewed. Doesn't matter now.
- `watchAll` filters `kind in [item, routine, check]`; pre-v0.1 docs without `kind` are invisible.
  There were none.
- Evening hour lives in localStorage (`recall-evening-hour`, default 20.5). To test the evening
  shape in daytime, set it below the current hour.
