# The review rig

Runs the real app in headless Chromium at iPhone size with an in-memory Firestore, React
bundled in, and the AI faked by intercepting the Anthropic URL. Built 2026-09-14 after a
build went to Ravi's phone with two layout bugs SSR could not see.

Where: the Cowork cloud container, `/home/claude/rig` (it does not survive the container;
rebuild from this file). Inputs: a tarball of `04_Engineering/recall-app/src` plus
`docs/styles.css` and `docs/index.html`, made on the Mac side with
`tar czf .preview/src.tgz -C 04_Engineering/recall-app src -C ../../docs styles.css index.html`
and staged into the container.

Files:
- `stubs/firestore.js` — collection/doc/addDoc/updateDoc/deleteDoc/onSnapshot/getDocs/
  where/query over a Map; `window.__rig.seed([...docs])` and `__rig.dump()`.
- `stubs/fbapp.js`, `stubs/fbauth.js` — no-ops; `onAuthStateChanged` fires a user.
- `build.sh` — esbuild with `--alias:firebase/*=./stubs/*`, React inlined, → `out/`.
- `run.js` — Playwright: 390×844, DPR 2, iOS UA; seeds five items (one with a two-photo
  log and three places), two saved places; `page.route('https://api.anthropic.com/**')`
  answers naming calls with a canned tag and the same-thing call (detects "NEW PHOTO" in
  the prompt) with `global.SAME`; scenarios: `home thing photo photo-more visual ask
  settings hold large`; screenshots to `shots/<name>.png`.
- `probe.js` — computed font-size/weight/padding/colour of `.footer-inner > *`; the two
  must be identical.

Run: `./build.sh && NODE_PATH=/home/claude/.npm-global/lib/node_modules node run.js`.
Then LOOK at every screenshot. That is the review.

**`audit.js` (2026-09-14)** — the full-path audit: 67 assertions across boot, Home, Log item
(camera, roll, naming, all three identity tiers, save-before-name, merges), the thing card
(old- and new-format items, add/remove photo, Earlier mode, Fix, Found it), press-and-hold,
Find item, the menu screens, Deleted items. Prints PASS/FAIL, writes `shots/audit.json`,
and collects page errors. It seeds an OLD-format item (no logId/photoCount/aliases) on
purpose — that is what is on Ravi's phone. Run it before every hand-off; add a check the
day a path is built. The scripts are committed under `04_Engineering/recall-app/rig/`
(esbuild/React/Playwright come from the container, not the repo).

Sync back: the changed files go to the Mac with `device_commit_files` (staged under
`/mnt/user-data/outputs/recall-sync/`), including `docs/app.js` built with the production
command from `package.json` (externals, minified) and the `?v=` stamp bumped in
`docs/index.html`. Ravi then commits and pushes from the Mac.

## Mockups from the stylesheet (round 7)

`rig/gen_r7.py` writes option pages into `rig/mock/` using the app's `out/styles.css` plus a
few mock-only rules; `rig/render_r7.js` screenshots each at 390×844 (full page) into
`shots/`; a short PIL script composes them side by side into one PNG for Ravi. Label bar at
the top of each page says which option it is. Copy the pattern for the next round.
`rig/shots_r7.js` is the post-build review script (seeds private / no-place things and a
place with photos, walks every new screen, both themes).

## The real rules engine (2026-09-21)

`04_Engineering/firebase/rules-test/` runs `firestore.rules` on the Firestore **emulator**
(Java + `firebase-tools` + `@firebase/rules-unit-testing`) against the exact reads and writes
the app makes: `test.mjs` (the owner on adopted data), `test_grant.mjs` (a whole-ReCall
editor), `test_p2.mjs` (invites, leave, the shared-with-me query). `npm install && npm test`.
It found what the rig's JS permission table could not: a list query is refused unless the rule
is provable from the query's own constraints (`sharedWith array-contains me` needed `me() in
sharedWith` in `canRead` AND a `kind in` filter on the query). Run it whenever the rules or a
listener's shape changes. The rig's `audit_roles.js` (41 checks, six roles, invite/join/
remove/leave/expired flows) stays the UI-level audit; `stubs/fbfunctions.js` runs the four
callables over the in-memory store; `shots_p2.js` makes the Phase 2 review montages.

## Rebuilding in a fresh container (2026-09-23, notes)

- The tarball carries the app's `package.json` (`"type": "module"`), which makes the rig's
  `require()` scripts fail. In the container, move it aside and write `{"private":true}` in its place.
- Install `playwright@1.56.1`: it matches the pre-installed `/opt/pw-browsers/chromium-1194`. The
  latest Playwright wants a newer Chromium and cannot download one. Also `react@18 react-dom@18 esbuild`.
- `chmod +x build.sh` after unpacking (the tar from the Mac drops the bit).

## Home-screen mockups (H1, 2026-09-23)

`rig/gen_h1.py` writes `mock/h1_<concept>_<frame>.html` (six concepts × home frames + carry-through
screens); `node render_h1.js` → `shots/h1/`; `python3 compose_h1.py` → one page per concept, the
montage and the own-title strip in `shots/h1_out/`. Photos: `rig/mock/img/` (Wikimedia Commons,
openly licensed, CREDITS.md — mockups only, never shipped). Fetching from Commons needs a
descriptive User-Agent and ~1.5 s between requests or it answers 429; thumbnails come back at 500 px.
