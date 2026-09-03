# ReCall as a research instrument

**Written 2026-09-02.** Draft for Tanya to take to her NYU mentor. The point of this document is
that the data-gathering is built from day one (v0.1 event schema v2), so that whichever study she
picks, the data will already exist.

Everything below is a *hypothesis for her to test against the literature*, not a claim of novelty.
What makes the app unusual as an instrument is not any one measure but the setting: naturalistic,
in-home, daily, on personally meaningful objects, at minute resolution, over months. Most memory
research on this population is lab-based, word-list or picture-based, and cross-sectional.

## Four candidate studies

### 1. The retrieval ladder as a longitudinal marker
Scaffolded active recall (phase-2 feature) records, for each lookup, the stage at which retrieval
succeeded — free recall, cued recall, recognition among real locations, or reveal — and the latency.
Over weeks this gives a per-person curve of *where on the ladder* retrieval succeeds.
**Question:** does the successful stage drift toward recognition/reveal with progression, and does the
shape differ between amnestic and non-amnestic profiles?
**Needs:** `recall_stage` events (not yet emitted; the feature is phase-2). Schema reserves the field.

### 2. Perseveration on the previous location
The "not there → see earlier photos" path logs which earlier photo the person settled on
(`history_pick`: index and age).
**Question:** when the current answer is wrong, do patients disproportionately choose the
*immediately prior* location (old memory intruding on new — proactive interference) rather than one
further back?
**Needs:** built in v0.1. Confound: the prior location is also the most likely true location; compare
picks against where the item was actually found (the subsequent re-snap's location).

### 3. Repetitive questioning as a time-of-day signal
Every lookup carries an item, an entry mode, and an exact time. Bursts of the same item within a
short window, plotted by hour, test whether repetitive questioning clusters in the late-afternoon /
evening window associated with sundowning, and whether daily burst rate predicts caregiver-rated
bad days.
**Question:** is in-app repetitive questioning a usable, passive proxy for a symptom that is today
measured by caregiver recall?
**Needs:** built in v0.1. Add a one-tap daily caregiver rating (MVP, caregiver device) as ground truth.

### 4. Does self-capture help later retrieval?
Every item records who photographed it (`capturedBy`: self / caregiver / starter). Items the patient
snapped herself versus items logged for her: are the self-captured ones looked up less often, and
found ("found" outcome vs "not_there") more often?
**Question:** does the act of photographing at put-down (an enactment / generation effect) improve
encoding in memory impairment, within-subject?
**Needs:** built in v0.1 for self vs starter; caregiver-captured arrives with the caregiver device.

## Event schema v2 (what v0.1 logs)

Every event: `type`, `at` (ms), `dayKey` (local day, 5am boundary), `hour`, `timeOfDay`
(morning/afternoon/evening/night), `deviceId`, `sessionId`, `role`, `schema`.

| type | fields | serves |
|---|---|---|
| `app_open` | — | activity, study 3 |
| `prompt_shown` | window, routineIds, doneCount | adherence timing |
| `routine_open` | routineId, done | adherence |
| `prompt_capture` | routineId, routineType, claimState, visible, retakes, savedBy | adherence, AI verification quality |
| `prompt_retake` | routineId | photo-instruction usability |
| `check_again` | routineId | re-checking behaviour (Linda) |
| `lookup` | entryMode (tile / tile_other / typed / voice / recent), itemId, itemName, answerAgeMin, matched, latencyMs, question | studies 2, 3, 4 |
| `lookup_outcome` | itemId, outcome (found / not_there), answerAgeMin | studies 2, 4 |
| `history_pick` | itemId, index, ageMin, location | study 2 |
| `capture` | initiatedBy (self / starter / resnap), itemId, itemName, aiFailed, corrected, savedBy (tap / auto), usedChip, locationChanged | study 4, AI accuracy |
| `correction` | itemId, field | AI accuracy, trust |
| `pin` / `unpin` | itemId, result | tile curation |

Reserved for later: `recall_stage` (study 1), `caregiver_rating` (study 3 ground truth).

## Consent and ethics — design now, ship with MVP

- Nothing is shown to the patient as a number. Ever.
- Export is caregiver-side only; anonymised (deviceId is random, no names in events — note
  `itemName` and `question` are free text and must be scrubbed or hashed before export leaves
  the household).
- The consent flow in the backlog (`research-consent-flow`, phase-2) should be designed during MVP
  privacy work, not after: consent collected after the fact is not consent.
- Any study with human participants goes through NYU's IRB; single-case (N-of-1) and small case-series
  designs are legitimate starting points and don't need a large cohort.
