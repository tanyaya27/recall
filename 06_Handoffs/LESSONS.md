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

## Working style

- Verify things work end to end before declaring them done. "It compiles" is not "it works".
- When something breaks, add logging to find the actual cause before trying fixes.
  Guessing at fixes in sequence wastes more time than one diagnostic pass.
