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

- **`node_modules` installed by the Cowork sandbox is Linux-only.** The esbuild binary
  inside it will not run on the Mac: `cannot execute binary file`. Fix: `rm -rf
  node_modules && npm install` on the Mac. If Claude builds in the sandbox, expect to
  reinstall before the first Mac build. Bit us 2026-09-05.
- **Give shell steps as absolute paths.** A relative `cd ../..` assumes the previous step
  ran; when the person skips one, they end up outside the repo with `fatal: not a git
  repository`. Bit us 2026-09-05.
- **Commit from the Mac, not from the Cowork sandbox.** The sandbox can write the repo but cannot
  delete files it didn't create, so git leaves `index.lock` / `HEAD.lock` / `objects/*/tmp_obj_*`
  behind and later git commands fail with "index.lock exists". It also has no GitHub credentials.
  If a sandbox commit is unavoidable: `GIT_INDEX_FILE=/tmp/idx git add -A && git write-tree` …
  `commit-tree` … `update-ref`, then on the Mac `find .git -name "*.lock" -delete; git reset -q;
  git push`. Locks appear in several places (`index.lock`, `HEAD.lock`, `refs/heads/main.lock`,
  `objects/maintenance.lock`) — use `find`, not a glob. Bit us three times on 2026-09-02.
- **GitHub Pages + browser cache:** after a deploy, the page shows the old `app.js` for a while.
  `fetch('./app.js',{cache:'reload'})` then reload, or add a `?v=` query to `app.js` in index.html.

## Design

- **A screen that changes shape on its own is navigation the person doesn't control.**
  v0.1's clock-shaped home was built to avoid navigation and became the hardest kind: the
  screen she learned at breakfast was gone by bedtime. Hand memory needs the same screen
  every open. Change *one band*, never the shape.
- **Make the button the camera.** A `<label>` around the `<input type=file>` opens the
  camera on that tap. Navigating to a screen and then calling `.click()` on a file input
  is not a user gesture on iOS and silently does nothing — that was v0.1's extra tap.
- **Fixed footers and keyboards do not mix.** `position: fixed` jumps when Safari's
  keyboard opens. Fixed action zone only on screens with no text input; everywhere else,
  actions in the flow.
- **Never merge silently.** If the app might treat this photo as "the same thing as X",
  say so on screen before saving, with a way out. If the answer arrives after the save,
  ask; never assume. A wrong merge overwrites the one photo she trusts.
- **Write the stylesheet in rem from the start.** One `--scale` on `<html>` then gives a
  real text-size setting that grows buttons and tap targets with the text. Retrofitting px
  → rem is an hour of tedium; doing it first is free.
- **Don't design from the feature list.** Two rounds of Design-tool mockups built screen-per-feature
  produced an app nobody could navigate. Write the day first (`design/DAY_IN_THE_LIFE.md`), then
  the screens. A feature that needs the patient to *go somewhere* is a design failure.
- **Find and Do must never share a visual grammar.** Things are photo tiles; routines are rows with
  a state in words. Mockups v1 drew "Morning pills" as a tile next to "Keys" and it was unreadable.
- **The Design tool sees only the prompt.** "No tab bar with five icons" became "no navigation at
  all". Say what *is* there, not only what isn't.

## The AI call fails — check these first, in this order

Four hours went into this on 2026-09-05. Two causes, neither in our code.

- **A VPN exiting in another country silently kills every AI call.** Anthropic geo-restricts
  at the edge, so requests from an unsupported exit get a canned 403 before reaching the
  API. The browser sees a preflight rejected without CORS headers and reports a bare
  `Load failed` — which looks exactly like being offline. **The tell:** open
  `https://api.anthropic.com/v1/messages` in the phone's browser. Anthropic's real reply is
  `{"type":"error","error":{"type":"invalid_request_error","message":"Method Not Allowed"}}`.
  Anything with a different JSON shape is an interceptor, not Anthropic. Switch the VPN to a
  US exit and it works.
- **The Model field is not where the API key goes.** Pasting the key's *name* there produces
  `404 not_found_error: model: <whatever>` — after authentication succeeds, so the key was
  fine all along. The field is now hidden behind "change" and defaults to blank.
- **Settings → "Check the key works"** runs both checks in order and names which failed:
  STEP 1 is "can this device reach the service at all" (sends a deliberately invalid key —
  any HTTP answer, 401 included, proves the network path works); STEP 2 is "is this key
  good". Use it before debugging anything else.
- **`Load failed` in Safari means the request never completed** — no status, no response.
  It is *not* evidence of a connection problem. Do not tell the user they are offline
  unless `navigator.onLine` says so.

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

## Testing without a phone

- **The Cowork sandbox can smoke-test React screens without a browser.** Stub the three
  Firebase modules with `--alias`, bundle with esbuild for node, and `renderToString` each
  screen with fake items. It catches reference errors and missing imports in every render
  path in seconds. It does *not* test the camera, the AI call, or Firestore — those still
  need the phone. Recipe in `sessions/2026-09-05-board-and-rebuild.md`.
- **The sandbox disk was full (11MB free) on 2026-09-05** — no Playwright, no Chromium.
  Do not spend time on it; use the SSR smoke test and deploy from the Mac.

## Working style

- Verify things work end to end before declaring them done. "It compiles" is not "it works".
- When something breaks, add logging to find the actual cause before trying fixes.
  Guessing at fixes in sequence wastes more time than one diagnostic pass.
- **Never state a cause you have not verified — in the UI or in conversation.** The app told
  Ravi "No internet just now" while he was online. Everything the app says afterwards is
  discounted once it has been caught inventing one explanation. Report the observation
  (`Load failed`), offer the diagnostic, and go and check.
- **"The photo is safe" — don't write reassurance nobody asked for.** It reads as an answer
  to a question the person never had, and invites worse guesses about what you meant.
- **Frequency sets verbosity.** A screen seen twenty times a day gets three words; one seen
  once a week can afford a sentence; onboarding and hard errors can explain themselves.
  Explanation earns its place only when it changes what the person does next.
- **A sticky element that is the last child of its container has nowhere to stick.** It will
  float over the content instead. Cost one visible layout bug.
