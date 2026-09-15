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
