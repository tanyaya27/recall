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

- **Control labels never wrap — and measure it, don't eyeball it.** Two buttons side by side
  on a 375-px phone give each ~165px; "Where is my…" plus an icon needs ~180 at Normal.
  It wrapped at every size and shipped. Test every screen at the *Largest* text size on a
  375-px frame before deploying (the static preview does this). Rule in `styles.css`:
  `white-space: nowrap` + `font-size: min(Xrem, Yvw)` on every control. When that is not
  enough, the footer switches to floating icons (measured, `Footer.jsx`); elsewhere,
  shorten the label. **Never stack** — the stacked footer cost 20% of the screen and was
  pulled the same evening. Content may wrap; controls may not.
- **Measure layout with a ResizeObserver, but never mutate what you observe inside the
  callback.** `Footer.jsx` rewrote its probe span on every measurement; the observer
  re-fired, the browser's loop guard dropped the notifications, and the footer stuck in the
  shape of its *first* measurement — which ran at zero width. Two rules: only touch a node
  when its content actually changed, and treat a zero-width layout as "no evidence yet",
  retrying next frame. Also prefer `window.innerWidth` to `documentElement.clientWidth`
  for viewport width; the latter read 0 in an embedded render after layout.
- **A requirement phrased as a principle gets an audit, not a feature.** "Look and feel of
  the most common apps" was answered with one header bar and Ravi caught it. The right
  response is a table: every convention in a named reference set (Phone, Messages, Photos,
  Mail, Camera, Settings) against what we built, with a verdict each. See
  `design/BOARD_2026-09-05_platform_conventions.md`.
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

## "Opening ReCall…" hangs

- **Seen 2026-09-05** after Settings → *Get the latest version* (a `location.reload()`),
  several times; killing the page and reopening always worked. **Cause not verified.**
  Instrumentation added rather than a guess: the boot now names its stage on screen after
  4s (*Still signing in*), `index.html` says if the script never ran at all after 6s, and
  Settings → Version shows *Last open: script 0.0s → auth 0.1s → signed-in 1.2s → ready*.
  **Read that line on the phone after the next hang before changing anything.** Two
  mitigations shipped alongside, each aimed at one candidate cause: sign-in falls back to
  in-memory persistence after 6s (if IndexedDB is what hangs), and "latest version" is now
  a fresh navigation with a new query rather than `reload()`. If the hang survives both,
  the stage line says where.

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
- **Layout can be verified without a phone: a private artifact rig.** Bundle the real
  component with esbuild (React external, import map to jsdelivr `+esm`), inline
  `styles.css`, and put one `srcdoc` iframe per width × text size on a page, each printing
  its own measurements. Publish as an artifact and screenshot it. Caveat: with the browser
  pane hidden, timers in the frames are throttled and readouts freeze — a `window.scrollTo`
  via `javascript_tool` wakes them. `node_modules` in the repo is Mac-only; install a
  scratch esbuild under `/tmp` with `npm_config_cache=/tmp/…`.

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

- **2026-09-14 — the Mac's `node_modules` is macOS-only, the mirror of the sandbox trap.**
  `npm run build` from the Cowork Linux VM fails with `esbuild: Exec format error`. Install
  esbuild into `/tmp` on the VM (`$HOME` on the VM was out of disk) and call that binary
  with the same flags as `package.json`; never `npm install` inside the repo from the VM.

- **2026-09-14 — never `label.file`, never `label.btn-primary`.** The camera button is a
  `<label>` around a file input; its twin is a `<button>`. Any selector at (0,1,1) on the
  label outranks every class rule that sizes both (`.footer-inner > *` at (0,1,0)) — for the
  label only — and the pair ends up different sizes or colours. It happened three times in
  one day. Use `.file` (0,1,0), keep it above the class rules, and run the rig's footer probe.
- **2026-09-14 — review the outcome in the rig before handing Ravi a build.** SSR "renders
  without throwing" is not a review. The rig (`~/rig` in the Cowork cloud container:
  `build.sh` bundles the app with an in-memory Firestore and React inlined; `run.js` drives
  Chromium at 390×844 through every screen and a fake AI, screenshots to `shots/`;
  `probe.js` prints computed styles of the footer pair). Look at the screenshots. Three
  layout bugs and one logic bug were caught this way that SSR had passed. Recipe lives in
  `06_Handoffs/RIG.md`.
- **2026-09-14 — a React effect that sets the state it depends on cancels itself.** The
  visual duplicate check had `visual` in its deps and called `setVisual('pending')` inside;
  the re-run's cleanup set `alive = false` on the first run and the verdict was dropped.
  Guard "started" with a ref, not with state in the dep list.
- **2026-09-14 — the rig's fixture masked a layout bug.** `space-between` with three
  children centred the day line; the rig's "Monday morning · September 14" was wide enough
  to hide the gap that "Sunday night" showed on Ravi's 430-px phone. Screenshot at BOTH
  390 and 430 (`run.js wide`), and with the shortest realistic content, not just the
  fixture's. A screenshot only proves the case it shows.
- **2026-09-14 — never defer an explicit request on my own recommendation.** Ravi asked for
  camera Cancel and multi-shot-in-the-camera; the board recommended "later", I presented
  it as a split, then built the recommendation without waiting for his answer. He asked
  again, angrier. Either get the ruling or build what was asked. Keep a per-round checklist
  in OPEN_ITEMS.md and tick it before hand-off.
- **2026-09-14 — no layout change without rendered options shown to Ravi first.** The rig
  can render a candidate layout from the real stylesheet in a minute (`rig/mock/`), so
  there is no excuse: two or three options, one composite PNG, his pick, then code. Round 5
  moved the thing card's actions into the footer on my own judgement and he opened a card
  with no visible actions. Bug fixes don't need this; anything that moves a control does.
- **2026-09-15 — when Ravi says "I have no clue what you are suggesting", the fix is a
  picture with the thing circled, not a longer paragraph.** Two of four questions in round 7
  came back that way (the "age pill", the "Lives on" row). A second sheet with the element
  arrowed and one sentence of *why* got clear rulings in one pass. Explain in his words,
  show it on the real stylesheet, ask again.
- **2026-09-15 — check an attachment is what it claims before spending time on it.** The
  "phone video" in round 7 was a 6½-minute desktop recording of an unrelated web app. Pull
  a contact sheet of frames first (ffmpeg, 1 frame / 8 s) and say so if it does not match.
- **2026-09-15 — "only this phone" was the wrong model, not just the wrong words.** Private
  is per person across all their devices. Write user-facing strings from the person's point
  of view, and keep one string per state in one place (`VISIBILITY_TOAST`) so three call
  sites cannot drift — Ravi called the drift "terrible and inconsistent".
- **2026-09-15 — the approach note before the build worked.** Options rendered from the
  real stylesheet, board positions and splits written down, his rulings via one question
  set, then code: no regressions, no "what crap". Keep the order: bugs fixed outright,
  everything that moves a control waits for a ruling.
- **2026-09-16 — bump BOTH cache stamps: `app.js?v=` AND `styles.css?v=` in `docs/index.html`.**
  Round 7 shipped new JS with the old stylesheet — giant Locations pictures, an unstyled
  pin, a misaligned clock — three of Ravi's four "5/10" items were one missed sed. The
  deploy block in OPEN_ITEMS now bumps both; the rig can't catch this (it has no cache).
- **2026-09-16 — a faked timestamp always surfaces.** `addSnapToLog` set a photo's time to
  the log's time ("same place, same time") so photos added days later showed the wrong day
  and the when line never changed while swiping. Store the real time; derive grouping from
  `logId`, never from a made-up `at`.
- **2026-09-16 — design in rendered passes, with the real stylesheet, until Ravi says "ready
  to go".** The thing card took seven passes (`design/mockups/r8_*.png`) and every one
  moved something he could only judge by looking: the toggles read as labels, the overlays
  cluttered, the Back button ate space, the pins did not align. Each pass was ~10 minutes in
  `rig/gen_r7.py`; the build was one pass. Never skip to code on a screen he has opinions
  about.
- **2026-09-16 — a `nowrap` line inside a flex page widens the page.** Flex items default to
  `min-width:auto`, so a no-wrap caption under a roll photo silently made the page wider
  than the strip and clipped the overlay. `.strip-page { min-width: 0; overflow: hidden }`.
  The mock caught it before the build did — one more reason to draw first.
- **2026-09-16 — measure the roll's page step; never assume it is the strip's width.** The
  pages are 86 % of the strip plus a gap; `scrollLeft / clientWidth` pointed the dots at
  the wrong page as soon as there were more than two. Read `children[1].offsetLeft -
  children[0].offsetLeft`.

## Firebase & sign-in (2026-09-21)

- **The console account is tangadi.biz@gmail.com.** `firebase login:list` shows which account
  the CLI holds; `firebase use recall-d9886` failing = wrong account.
- **An old firebase-tools gives Google's "400 malformed request" on login.** Update with
  `sudo npm install -g firebase-tools` (the global folder is root-owned on this Mac).
- **Firebase's redirect sign-in does not work on GitHub Pages in Safari** (third-party storage
  blocked since 16.1). We do Google's OpenID redirect ourselves back to our own URL; the OAuth
  web client must list the page as a redirect URI, exactly, trailing slash included.
- **A sign-in button must never fail silently.** Every start error shows under the button and
  in Settings' *For support* line.
- **The rig's JS permission table is not the rules engine.** A list query is refused unless the
  rule is provable from the query's constraints; only the emulator
  (`04_Engineering/firebase/rules-test/`) shows that. Run it whenever rules or a listener change.
- **A runtime-only change to Cloud Functions is "no changes detected".** Edit the source
  (a comment will do) and deploy with `--force`.
- **Legacy adoption runs on whichever phone opens the new build first** — that phone's person
  owns the old data. Decide who that should be before shipping a migration like it.

- **2026-09-24 — a well-specified brief can still ask the wrong question; test the premise before
  executing it.** The home-screen round delivered exactly what the prompt asked for (six layouts,
  boards, montage) and Ravi called it "100% cosmetic … useless". The premise underneath it (one kind
  of user, one kind of thing, a grid) had never been checked against the scenarios the product has
  to serve. Before drawing a screen, ask: who uses it, what they log, how often, and how fast logging
  has to be. The layout falls out of those answers. See `design/BOARD_2026-09-24_scenarios-and-logging.md`.

- **2026-09-24 — mockup PNGs are heavy; the 09-24 push was 35 MB, mostly nine ~5 MB composites.** The repo is
  public and every clone carries them forever. Save review composites as JPEG (quality ~85) or at half size;
  keep full-resolution PNGs only in the rig's `shots/`, which is not committed.

- **2026-09-24 — checking an app name: the USPTO, the App Store and RDAP all answer from the cloud sandbox;
  Google Play doesn't.** `05_Research/naming/name_check.py` screens any list of names in about a minute (live
  USPTO marks via the tmsearch backend, Apple's App Store search, RDAP for .com/.app). Play blocks automated
  search (robots.txt), so check finalists by hand in the Play app. Justia's search page works through a web
  fetch but not with curl. And the "find my stuff" category is crowded: check a real English word first, it's
  usually taken.
- **2026-09-24 — Apple's Developer Program needs the legal age of majority (18 in WA).** A minor can't
  hold the membership; Apple's route is a parent's account shared with them. The seller name on the App Store
  is the account holder's legal name (or the organization's). Apps can only be transferred after one App Store
  release. Details and sources: `06_Handoffs/APPLE.md`.

- **2026-09-26 · A grid of `overflow:hidden` tiles inside a height-limited flex child squashes its rows** (an
  overflow-hidden item has no min-content height), so the names under the photos vanished in the Put in sheet.
  Give such grids `grid-auto-rows: max-content; align-content: start`. The audit now asserts every label shows.
- **2026-09-26 · Put new-record writes behind a try/catch when the old field still carries the truth.** An edge
  that fails to write (old rules, a role edge case) must never block the move itself; the place text copy is saved
  first and the failure is logged (`edge_failed`).
- **2026-09-27 · A new path that lives at the bottom of a list does not exist.** "In something…" shipped as the last
  chip; on the phone it was below the fold and Ravi called it very poor. Parallel choices go at the top, and the
  audit now asserts the path row is on screen under the question. Also: a picker that can only pick what exists is
  half a feature — offer "New: <typed>" as the first row.
- **2026-09-27 · Walk the whole flow on screen, with a real photo, before shipping a fix to one step of it.** Two quick fixes
  answered the words of Ravi's complaints (a path at the top; a "New:" row) and each added a screen; neither checked the
  sequence around it, and neither built the camera ruling (09-26 Q1) that already solved it. The walk (`rig/walk_s9.js`:
  every step screenshotted, taps counted, keyboard marked, real photos in the viewfinder via a canvas getUserMedia) found 31
  issues in an hour, including a shared number that moved the wrong thing. A fix that adds a screen and removes none is a
  warning sign; count taps before and after.
- **2026-09-27 · A callback that fires after its screen closed reads the state of the moment it was made.** The late privacy
  verdict (named after Save) used the camera's `privacyNotice`, which still thought the camera was open, so the notice went to a
  toast instead of the Home card. Anything a promise calls later reads live state through a ref (`savedRef`, `logRef`).
- **2026-09-27 · Rewrite an audit's steps when the flow changes, but keep what each check protects.** The Log item checks moved
  from the photo card to the camera one by one (name, rename, place, cancel, identity tiers, save-before-name); only checks of
  retired features (the mode row, Several, place views) were dropped, and each drop is written in the audit.
- **2026-09-27 · Test in the person's theme, with the person's data, before shipping.** Build 1 passed 41 checks in the light
  theme with tidy data; on Ravi's phone (dark theme) the card was white text on white, and his real data held a pencil containing
  a filing cabinet. A crawl that taps every button on every screen (`rig/crawl_s11.js`) in his theme found 29 issues, three of
  them writing bad data. Every build is now crawled in Dusk AND Linen, with messy data, before screenshots go to Ravi.
- **2026-09-27 · Words that point both ways are dangerous.** "Put things in" on the pencil's page was read as "put the pencil
  in", and did the reverse. Only offer the direction the person is standing in: from a thing's page, "where is THIS".
- **2026-09-27 · When the app cannot know the person's intent, give her a control, not a guess.** Build 1 guessed that every
  photo after the first was the next "where", so a second close-up of a spoon became a place called "Desk surface". Build 2
  makes the target visible (the outlined square, the shutter ring in its colour) and the next level one tap (＋). One tap of
  intent costs less than one wrong record.
- **2026-09-27 · Old data can keep a retired rule alive.** "Only containers hold things" still showed the pencil as a
  container, because the filing cabinet was in it — the rule has to (never hide what is inside), so the fix is to repair
  the record, not to bend the rule. Name the record, repair only it, make the repair safe to run twice, and prove it in the
  walk (R0: nothing else moved; R6: a reload does not repeat it).
- **2026-09-27 · Prove a write-time guard with a direct write, not only the UI.** Once the lists stop offering a loop, the UI
  can no longer test the guard behind them. The rig exposes the write functions to the audit (`window.__rigdb`, defined only
  when `__RIG__` is), and L2 calls them directly.

- **2026-09-28 — the rig's Firestore stub silently loses writes past ~5 MB of photos.** `rig/stubs/firestore.js`
  persists to localStorage and swallows `QuotaExceededError`; after ~15–20 full-res photos in one continuous
  run, saves LOOK fine on screen but vanish on reload. In long walks, reseed (`__rig.reset()`) between
  scenario groups, and don't diagnose a "lost" doc as an app bug until you've checked
  `localStorage.getItem('rig-store').length`. Fix worth making: have `save()` surface quota failures.
- **2026-09-28 — the rig bundles from `rig/src`, a COPY of the app source.** Editing `rig-src/src` (or the
  repo src) does nothing until you copy it over; `diff -rq` the two trees when a change refuses to appear.
- **2026-09-28 — an audit can encode yesterday's constant.** audit.js G5e asserted the add-photo slot vanished
  at 3 place photos — true only while PLACE_PHOTOS was 3. When a requirement changes a constant, grep the
  audits for the old value before trusting green.
- **2026-09-28 — a phone check without a visible build stamp is worthless.** The Version card was trimmed out of
  Settings on 09-27; the next phone test ran on a stale bundle (the app was open across the push) and an hour went
  into "debugging" code that was fine. The menu drawer now shows *Build <stamp>*; read it before trusting anything
  a phone shows. And a home-screen web app that is already open keeps its old JS across a push — close it fully.

- **2026-09-29 — the rig's permission stub must fail the way the real rules fail, and the phone-path tests must run
  with permissions ON.** `consistent()` in firestore.rules reads `sharedWith`/`roles`; a doc without them makes the
  rule error, and an erroring rule DENIES. The stub defaulted missing fields to empty and allowed, and most rig runs
  had rules off — so "every owner update to a place is refused" shipped with every suite green, twice looking like a
  UI freeze on Ravi's phone. Rules: (1) every new doc kind gets the fields the rules read; (2) any flow that writes
  must be tested once with `__rig.rules(true)`; (3) a write that can be refused must never fail silently on screen.

- 2026-09-29 — **Check icon/text alignment on the pixels, not the boxes.** The camera pin was "centred" by its box three builds running and Ravi kept seeing it low: a font with deep descender space puts the capitals above the middle of the line. Fix = stand the icon on the baseline and lift it by half the capital height (`1cap`); the check (`rig/repro_f3.js` H) compares the ink centre of the icon with the ink centre of the capitals.

- **2026-09-29 (evening) — A field that is written and never read is a bug that looks like storage.** Places got `parent`
  on 09-27 ("reserved; nothing reads it yet") and the save card read the chain back from the camera, not from the store —
  so Ravi's tier 2 "saved" on screen and was gone. When a flow writes something, some screen must read it back from the
  store, and the audit must check the store, not the card.
- **2026-09-29 (evening) — The audit encoded the bug.** `audit_where` A5 asserted `drawer.parent === office.id` — the
  write-only field — so the suite was green over the exact defect. Assert the behaviour (the edge exists; a screen shows
  it), not the mechanism.
- **2026-09-29 (evening) — Take a baseline number from the suite's own output, never from a handoff.** The prompt said
  audit_where 83; the suite has 63 checks. Copying a number forward turned a typo into a "regression" to chase.
- **2026-09-29 (evening) — Multi-tier needs its own walk.** The 09-27 walk wrote "＋ (blue, level 2) — would add a further
  level" and stopped there; no suite ever saved a place at tier 2. Every combination (known/new × place/box × Log/Move),
  saved with the rules on, then read back on every screen: `rig/audit_tiers.js`.
- **2026-09-29 (night) — Put a question to Ravi as a story about his own things, not as a label.** "Q3 re-parent", "place
  inside a box", "an ask for another tier" meant nothing to him ("so cryptic, I can't figure out what you are asking me").
  What worked: two short paragraphs each — what happens today in plain words (Kitchen counter, Craft nook, the glue), why
  it matters, and one recommendation — and he answered "OK to both" in one line. Explain the words "box" and "place"
  every time they carry the question.
- **2026-09-29 (late) — Measure a solid button by its box, text by its ink.** probe_cap first read the pill's top from pixels
  at a low-contrast edge (dark theme) and reported the text 3.5 px high when it was level. A filled pill's visible top IS its
  box; only glyphs need the ink scan.
- **2026-09-29 (late) — A colour that means "press me" must only be used on things that can be pressed.** The pin placeholder
  shared the Move it button's colours; Ravi pressed it.
- **2026-09-29 (evening) — repro_f3's visual-ask checks (A/B) are timing-sensitive under heavy parallel load** (the fake
  naming call plus thumbnail shrinking can pass 2 s when ten suites share the CPU). Failed with 10 suites running, 50/50
  alone. Rerun it alone before calling it a regression.
- **2026-09-29 (evening) — A copy change breaks the audits that match words.** The things→items sweep failed six checks that
  matched "No, a new thing", "Put things in", "2 things", "The thing", "where things are". Grep the audits for the old words
  in the same change.
- **2026-09-29 (late night) — A redesign can drop a rule the old screen kept.** The old card showed one question at a time
  (R4.4/F7); the new card rendered the item's "Your X?" and the place's "Is this the Y?" together. The old suite's check
  caught it only after it was migrated to the new controls — migrate the checks, don't retire them with the screen.
- **2026-09-29 (late night) — Five Playwright suites at once ran the container out of memory** (the run was killed, and a
  timing check read 4.0 s for a 3 s timer). Run at most three browser suites at a time; rerun a timing failure alone.
- **2026-09-29 (late night) — Look at the built screen at 2+ levels and at Largest, not just the first state.** Every check
  passed while ☰ Choose place had dropped under the squares at 2 levels (and the selected square was clipped 3 px at
  Largest). `rig/probe_row.js` now measures the row.
- **2026-09-29 (night) — Test the second visit, not just the first.** Every tier suite built a chain and saved it; none
  opened Move it again on that item. The camera then showed only tier 1, and Ravi's next tier re-parented the box.
  `rig/audit_chain.js` runs his exact sequence: build → Save → Move it again → add on top → Save → read it back.
- **2026-09-29 (night) — A bottom sheet with a text field needs the keyboard in the test.** On an iPhone the keyboard
  covers the bottom ~380 pt; the rig's Chromium has none, so every sheet "passed" while the field was hidden on the
  phone. audit_chain installs a stand-in visual viewport and checks the field and what it offers sit above it.
- **2026-09-29 (night) — "Settle" helpers must wait for what they settle.** `settleWhere` waited a fixed 300 ms after the
  look; under load the Choose place sheet opened later and the next step clicked into it (audit_graph K1, flaky). It now
  polls for the sheet or the question.
- **2026-09-30 — The rig can lie.** Its store silently stopped persisting past ~5 MB, so an item saved before a reload
  "vanished" — it looked exactly like an app bug. Test tools must fail loudly (the store now dedupes photos and logs an
  error if a save ever fails, which every suite's error check catches).
- **2026-09-30 — Run the phone's engine.** WebKit found three things Chromium hid: + scrolled out of reach (a tap
  missed), the caption 4–5 px low (Safari ignores `text-box` on a clamped box), the 3 s wait running 4 s. Chromium passing
  is not the phone passing.
- **2026-09-30 — An independent tester finds what the builder can't.** A separate agent that read only the rulings
  found 9 bugs in a build that passed 551 checks, including one that deleted an item. Every build gets one.
- **2026-09-30 — Check screens against the store, not against each other.** Renaming a place updated every screen's
  words, so they all agreed — and all were wrong about the link underneath. Only the oracle (truth from the store) saw it.
- **2026-09-30 — A check that visits every screen leaves you somewhere else.** The oracle opens the item page, Find and
  Move it; a journey that then clicked on "the place page" was on another page (J15). After an oracle run, open the
  screen you mean again — and scroll to the top before measuring (audit D16 failed on a scrolled page, not on the app).
- **2026-09-30 — Two copies of one control drift.** The camera had its own photo viewer, written before the app's
  viewer existed; the app's got Ravi's rulings, the camera's never did. When a second copy exists, delete it — a
  checklist line ("every photo viewer") can't keep two in step.
- **2026-09-30 — A time on the screen must name its event.** "seen 10:18" was the time of the last write, whatever the
  write was. The oracle now checks the words against the store: "seen" only after a photo newer than the last move.
- **2026-09-30 — Check what a pick did to the store, not just the screen.** Choose place on a photographed tier left
  the old photo on the square — and then saved it onto a different place. Only reading the place's photos after Save
  showed the damage (audit_p30d P4).
