# Lessons

Traps, dead ends, and hard-won gotchas. Read before starting work; add to it whenever
something costs more time than it should have.

Keep entries short and imperative. The test of a good entry: would it have saved an hour?

---

## Build & repo

- **`docs/` is build output, not documentation.** GitHub Pages requires that exact folder
  name at the repo root. Never hand-edit `docs/app.js` — it is regenerated from
  `04_Engineering/recall-app/src/` and your edit will vanish on the next build.
- **Never put the repo in iCloud, Dropbox, or Google Drive.** Cloud sync corrupts `.git`
  by writing thousands of small files out of order. Use GitHub to sync between machines.
- **Push before you close the laptop.** Work that is committed but not pushed is invisible
  to the other machine and to the next Claude session. This is the single most common way
  to lose a day.
- **`npm install` before the first build on a new machine.** `node_modules/` is gitignored
  by design; `package-lock.json` is committed so the install reproduces exactly.
- **Pushing to someone else's repo needs a *classic* personal access token, not a
  fine-grained one.** A fine-grained PAT is scoped to a single resource owner and cannot
  reach repos owned by another user — even when you are an accepted collaborator. Symptom:
  `403 Permission to tanyaya27/recall.git denied to <you>` that survives accepting the
  invite. Use a classic PAT with `repo` scope, or SSH keys. This bit us on 2026-08-31.
- **Set `git config user.email` per repo before the first commit.** Commits are attributed
  by email match. Use Tanya's GitHub **noreply** address
  (`323371502+tanyaya27@users.noreply.github.com`) — the repo is public and commit emails
  in public history get scraped. `git commit --amend --reset-author --no-edit` fixes an
  already-made commit, but only before it is pushed.

## Security & privacy

- **Firestore rules are currently wide open** — `if request.auth != null` plus anonymous
  auth means anyone who signs in anonymously can read and write the whole vault. Since
  GitHub Pages on a free account requires a public repo, anyone with the URL can do this.
  Fine for test data. **Must be tightened before any real photo of a family member goes
  in.** Fix: scope documents to a household ID and check it in the rules.
- **API keys never go in a file.** They live in the browser's localStorage, entered per
  device via the app's Settings. Re-enter on each new machine — that is expected, not a bug.
- The Firebase web config in `src/lib/firebase.js` being public *is* fine. Security comes
  from the Firestore rules, not from hiding that config. Don't "fix" it.

## App behavior

- The v0 build **compiles but has never run in a real browser with a real key.** Treat the
  first deploy as a debugging session, not a launch. Expect breakage in the capture flow.
- Photos are stored inline in Firestore documents. Firestore has a 1MB per-document limit —
  compression is not optional, it is load-bearing.

## Rejected — do not re-propose

Evaluated and ruled out in the April 2026 AI Capability Scan. Each is the kind of idea that
sounds good enough to keep resurfacing, so the reason is recorded rather than the verdict.

- **Speaker-personalized speech-to-text fine-tuning.** No major vendor (Whisper,
  AssemblyAI, Deepgram) exposes per-speaker tuning in production. Re-evaluate only if one
  ships it.
- **OpenAI Voice Engine.** Still restricted to a small partner set. Build voice cloning on
  ElevenLabs instead.
- **Generative imagery of absent loved ones.** Technically easy, clinically
  contraindicated — dissociation risk in dementia populations. Vetoed by the panel's
  clinical persona. This one is a values call, not a capability gap; do not revisit on the
  grounds that the tech improved.

## Working with AI capability claims

- **Never assert an AI capability from training data.** Every capability in the scan cites
  a named commercial product or research demo verified by web search at the time. Anything
  unverified goes in a "watch" tier with an explicit re-evaluation trigger, never into a
  plan. Same discipline as the professor-verification rule on the college-application side.
- Two claims in the competitive analysis were later corrected this way: Samsung Brain
  Health is a B2B research partnership, not a shipping consumer product, and the Apple ×
  Eli Lilly collaboration is unverified for 2026. Both were overstated on first pass.

## Working style

- Verify things work end to end before declaring them done. "It compiles" is not "it works".
- When something breaks, add logging to find the actual cause before trying fixes.
  Guessing at fixes in sequence wastes more time than one diagnostic pass.
