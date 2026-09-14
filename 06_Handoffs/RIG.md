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

Sync back: the changed files go to the Mac with `device_commit_files` (staged under
`/mnt/user-data/outputs/recall-sync/`), including `docs/app.js` built with the production
command from `package.json` (externals, minified) and the `?v=` stamp bumped in
`docs/index.html`. Ravi then commits and pushes from the Mac.
