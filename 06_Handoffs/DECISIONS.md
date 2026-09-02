# Decisions

Running log of choices and the reasoning behind them. Newest at the top.
Add an entry whenever a choice was non-obvious, had a real alternative, or would be
tempting to reverse later without knowing why it was made.

Format: date — decision — why — what would change our mind.

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
