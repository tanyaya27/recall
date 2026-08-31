# 2026-08-31 — Repo restructure and cross-machine handoff setup

**Machine:** Dad's Mac. **Working with:** Ravi (setting things up for Tanya's own MacBook).

## Why this session happened

Tanya is getting her own MacBook. The v0 app currently exists only on Dad's machine, and
he travels in a few weeks. Goal: make the project machine-independent so any session, on
any Mac, starts fully informed.

## What changed

1. **Repo scope.** The git repo is now the whole `ReCall/` folder, not just
   `04_Engineering/recall-app/`. Design docs and code travel together.
2. **Build output moved** from `04_Engineering/recall-app/docs/` to `ReCall/docs/`, because
   GitHub Pages only serves `/docs` at the repo root.
   - `package.json` build and dev scripts now output to `../../docs/app.js`
   - `dev` serves `../../docs`
   - `deploy.sh` builds in the app dir, then commits and pushes from the repo root
3. **New context files:** `CLAUDE.md` (repo root), `06_Handoffs/DECISIONS.md`,
   `06_Handoffs/LESSONS.md`, and this `sessions/` folder.
4. **Root `.gitignore`** added, covering `node_modules/`, `.DS_Store`, and secret patterns.

## Verified

`npm install && npm run build` from `04_Engineering/recall-app/` regenerates
`../../docs/app.js` (18.0kb) with no errors. Byte-identical to the pre-move bundle, which
confirms the restructure changed paths only, not the build.

## Not done — still pending for the next session

- Git repo has **not** been initialized or pushed yet. Ravi is running the setup steps by
  hand (git init, GitHub repo, first push, Pages config).
- Firestore rules for `recall_items` / `recall_events` not yet added in the Firebase console.
- App has still **never been run in a browser**. First-deploy debugging is the next real task.
- The root `README.md` still says folders 03–05 are empty; 03 and 04 are now populated.
  Worth a refresh.

## Open question flagged to Ravi

The Firestore rules plus a public Pages repo mean anyone with the URL can read the vault.
Fine for test data, not for real photos. Tanya likely qualifies for the GitHub Student
Developer Pack, which allows Pages from a private repo. Decision pending.
