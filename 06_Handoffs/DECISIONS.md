# Decisions

Running log of choices and the reasoning behind them. Newest at the top.
Add an entry whenever a choice was non-obvious, had a real alternative, or would be
tempting to reverse later without knowing why it was made.

Format: date — decision — why — what would change our mind.

## 2026-09-02 — The patient never navigates: one home screen shaped by the clock

**Decision:** the patient side has no tabs, no menu, no "Back" as a corner link. One home screen
whose shape follows the time of day (morning routines, then things; bedtime routines from a set
hour until 5am), plus camera, answer, and a full-width Back button near the bottom of deeper screens.

**Why:** two rounds of Design-tool mockups built from the 22-feature list produced screens Ravi
could not navigate ("vertigo"). Walking through a real day showed Margaret does three things —
snap, tap a tile, answer what the app asks at a fixed time — and never *goes* anywhere. Screens that
exist because a feature exists, rather than because she needs to go there, are the source of the
confusion. Full story: `design/DAY_IN_THE_LIFE.md`.

**Would change our mind:** if the one-week test shows she cannot find Recent or Settings when she
needs them. Then add a single persistent "More" — not a tab bar.

---

## 2026-09-02 — Two capture modes, one gesture; the app never claims more than the photo shows

**Decision:** self-initiated snaps are generic (AI names whatever it sees). App-initiated snaps
(routines at a fixed time) carry a one-line photo instruction and are verified: the AI states only
what it can see ("Wednesday morning slot is empty"), asks once for a retake if it can't see, and
otherwise saves with "Photographed at 8:12" and no claim. The photo is the mark; there is no
"done" tap and no checkbox anywhere.

**Why:** Ravi's point that "one photo for both find and check" only works if the photo shows the
open organiser, which can't be guaranteed. Medication is daily, universal, and high-stakes enough
to earn a guided capture. Honesty over confidence is the stale-answer principle applied to checks.

**Would change our mind:** nothing on the honesty rule. The retake count (one) is tunable.

---

## 2026-09-02 — Tiles are fixed positions, curated by people, never auto-reordered

**Decision:** up to 8 pinned tiles in fixed slots; "Keep at the top" / "Take off the top" on every
thing, available to the patient (not caregiver-only); overflow under "Other things", ordered by
recency. Usage data may *suggest* pins to a caregiver; it never rearranges the patient's screen.

**Why:** a screen that reorders itself cannot be learned by hand memory. Memory impairment varies —
Ravi's point — so the patient must be able to curate if she can; the caregiver curates if she can't.

---

## 2026-09-02 — Research logging is a day-one requirement, with a fixed schema

**Decision:** every capture, lookup, outcome, history pick, correction, prompt and pin is logged
with exact time, day bucket, entry mode and device, schema-versioned (v2). Nothing is ever shown
to the patient as a number. Four candidate studies and the schema are in
`05_Research/RESEARCH_PLAN.md`.

**Why:** Tanya's NYU neuroscience work. Retrofitting instrumentation loses the baseline weeks.

---

## 2026-09-02 — v0.1 keeps one Firestore collection with a `kind` field

**Decision:** snaps, routines and checks live in `recall_items` alongside items, distinguished by
`kind`, rather than in their own collections.

**Why:** the published rules cover exactly `recall_items` and `recall_events`, and changing rules
needs the console on Tanya's account. This let v0.1 be testable the same day. **Split into real
collections when rules are rewritten for the household ID** — that work is already required.

---

## 2026-09-05 — Every decision goes through two boards

**Decision:** adopt the Plantwise/Ardina method. A **build board** of four professionals
(PM, design lead, engineer, architect — Claude plays all four, and they disagree in writing)
proposes and critiques; the **end-user board** of 20 advisory personas reviews every UX and
feature decision; Tanya decides. Full method: `02_Strategy/PRODUCT_BOARD.md`.

**Why:** v0.1's interface was decided one patch at a time by whoever was typing, usually
mid-debug. The result got so far in the way that it became impossible to judge whether the
underlying features were any good — which is the only question that matters right now.
Today's session is the evidence: the Back button moved three times in an hour because
nobody owned the interaction model, and user-facing copy was written while chasing a bug.

**Would change our mind:** if the process starts producing meeting minutes instead of
shipped screens. The board exists to catch bad decisions, not to generate documents.

---

## 2026-09-05 — Rebuild the UX from scratch; keep the engine

**Decision:** every screen, flow and string is redesigned by the board and rebuilt.
Firebase, `lib/db.js` and `ai/engine.js` stay. Do not patch the existing screens.

**Why:** everything that is wrong lives above the engine — the engine files contain no UX
at all. The AI path was also proven working end to end today after a long debug, and
rebuilding it would mean re-entering that swamp with users waiting. Ravi wants real users
on this within a day or two, which rules out re-deciding the architecture first.

**Caveat that makes this safe:** the engine is kept but **reviewable**. Sam may flag
anything in it that constrains the design — the single `recall_items` collection with a
`kind` field, photos stored inline against Firestore's 1MB document cap, LLM-over-captions
search. Changing any of it is a recorded decision, not a quiet refactor.

**Would change our mind:** if the design the board lands on cannot be built on this data
model. Then the model changes and it gets written down here.

---

## 2026-04-16 — Four architectural commitments that must hold through the MVP build

From the AI Capability Scan (`02_Strategy/ReCall_AI_Capability_Scan.docx`). These are locked
because each is expensive to retrofit and cheap to build in from the start.

1. **Use a multimodal VLM for object recognition, not a plain image classifier.** Default
   Claude, with a Gemini fallback. A classifier gives labels; ReCall needs "reading glasses
   on the kitchen counter", which is a reasoning task.
2. **Embeddings-backed semantic search from day one**, indexed in Firestore vector search —
   not keyword matching. v0 deliberately ships LLM-over-captions instead, which is correct
   below ~500 items and must be replaced before that.
3. **All LLM calls behind a single client with a `sensitivity` flag.** Already built in
   `src/ai/engine.js`. This is what makes Phase-2 on-device routing additive rather than a
   rewrite. Do not let any component call a vendor directly.
4. **Voice-cloning consent scaffolding designed during MVP privacy work**, even though the
   feature itself ships Phase 2+. Consent collected after the fact is not consent.

**Would change our mind:** #1 and #2 only if cost per capture becomes prohibitive at scale.
#3 and #4 are not negotiable.

---

## 2026-04-16 — Multi-device architecture: Option B, cloud-first from MVP

**Decision:** Firebase Firestore from day one, with Patient and Caregiver roles in the MVP.
Facility / multi-patient deferred to Phase 3.

**Why:** Priya (remote daughter) and Robert (spouse caregiver) are named must-be users, and
their value proposition requires each person using their own device. Retrofitting
multi-device later was estimated at 4–6 weeks, landing concurrently with the college
application sprint.

**Status:** still needs Tanya's explicit sign-off on three points — approve Option B,
confirm MVP roles are Patient + Caregiver only, and confirm data residency. Note the third
point is now settled differently: data lives in ReCall's own `recall-d9886` project, not
`tanya-command-center` as the original memo proposed.

---

## 2026-08-31 — MVP scope: the 22 committed features plus a few showcase ones

**Decision:** design and build to the agreed 22-item MVP set (9 must-be, 9 performance,
4 attractive), plus two or three features pulled forward from mvp-plus/phase-2 purely for
demo impact.

**Why:** Ravi's framing — the MVP has to be attractive enough that the first adopters use
it *confidently*, not just correctly. A strictly minimal MVP risks being technically
complete and emotionally unconvincing, which for a dementia app means abandonment.

**Guardrail:** showcase features must be labelled as such wherever they appear, so a
mockup is never mistaken for a commitment. Feature scope stays owned by the prioritizer
JSON, not by design documents.

**Would change our mind:** if showcase work starts displacing must-be work, cut the
showcase features. The 9 must-be items are the ones whose absence causes abandonment.

---

## 2026-08-31 — ReCall gets its own Firebase project, on Tanya's Google account

**Decision:** new Firebase project `recall-d9886` (Spark plan, us-west1), owned by Tanya's
own Google account. ReCall no longer shares `tanya-command-center` with SwiftUp and the
SAT tools.

**Why:** three reasons. Ownership — it is her project and she should not need a parent's
login to administer it. Separation — ReCall's data is far more privacy-sensitive than SAT
practice questions, and entangling them makes any future clinical-advisor or research
involvement painful to untangle. Timing — there was zero data in the old project's
`recall_*` collections, so the move cost exactly one config object. That price only rises.

**Alternative rejected:** staying on `tanya-command-center` and transferring ownership
later via IAM. Possible, but leaves ReCall's data mixed into an unrelated project forever,
and the project ID would still read `tanya-command-center`.

**Would change our mind:** nothing. Do the same for any future app.

---

## 2026-08-31 — One git repo for the whole ReCall folder, not just the app

**Decision:** the repo root is `ReCall/`, so design docs, strategy, spec and code all
travel together. Pages build output moved to `ReCall/docs/`.

**Why:** Tanya works across two machines. If the repo were only `recall-app/`, cloning it
on a second machine would deliver the code without the thinking behind it — and the app
README's reference to `../../03_Design/ReCall_v0_Spec.docx` would break. The reasoning is
as valuable as the code, so it belongs in the same repo.

**Alternative rejected:** separate repos for docs and app, or a GitHub Actions workflow to
publish a nested subfolder. Both add moving parts a solo student builder has to maintain.

**Would change our mind:** if the design folder grows huge with binary assets and slows
clones, split the media out rather than the documents.

---

## 2026-08-31 — GitHub is the only sync mechanism; no iCloud/Dropbox on the repo

**Decision:** each machine keeps an ordinary local clone outside any cloud-synced folder.

**Why:** file-sync services corrupt `.git` — they sync thousands of small files out of
order, create "conflicted copy" duplicates inside `.git`, and can evict files to the cloud.
GitHub already does this job correctly.

**Would change our mind:** nothing. This one is settled.

---

## 2026-08-30 — Photos stored inline in Firestore, not Firebase Storage

**Decision:** compress to ~100–180KB JPEG and store in the Firestore document.

**Why:** avoids Storage bucket setup and CORS configuration entirely at v0 scale. Fewer
things to get wrong before the first working demo.

**Would change our mind:** item counts in the hundreds, or a need for full-resolution
originals. Then move to Storage.

---

## 2026-08-30 — esbuild instead of Vite

**Decision:** bundle with esbuild; React and Firebase load from a CDN import map.

**Why:** pivoted mid-build when the sandbox ran out of disk installing Vite. The source is
standard React and migrates to Vite unchanged if we ever need the richer dev server.

**Would change our mind:** needing HMR, environment variables, or a plugin ecosystem.

---

## 2026-08-30 — AI vendor behind a two-method abstraction

**Decision:** components call only `engine.tagPhoto()` / `engine.answerQuery()`. Providers
implement `visionJSON` and `textJSON`.

**Why:** vendor choice is a settings toggle, not a refactor. Also creates the seam for
future on-device/private routing via the `sensitivity` flag — a real requirement for an
app handling dementia patients' home photos.

**Would change our mind:** nothing foreseeable. Keep this seam intact.
