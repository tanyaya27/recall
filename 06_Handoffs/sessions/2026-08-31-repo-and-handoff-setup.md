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

## Shipped later the same day

- **Repo created under Tanya's own GitHub account: `github.com/tanyaya27/recall`.**
  Deliberately not under Ravi's `raviancv` — the commit history and URL should carry her
  name, since this is part of her college-application spike. Ravi added as a collaborator.
- Commit authorship set to Tanya via her GitHub **noreply** address
  (`323371502+tanyaya27@users.noreply.github.com`) — the repo is public, and commit emails
  in public git history get scraped. `git config user.email` is set locally in this repo.
- First push: 61 objects, 45 files, `main` tracking `origin/main`.
- GitHub Pages enabled: `main` / `/docs`. **Live at https://tanyaya27.github.io/recall/**

### Gotcha that cost time: fine-grained tokens can't push to someone else's repo

Ravi's push kept failing with `403 Permission to tanyaya27/recall.git denied to raviancv`
even after the collaborator invite was accepted. Cause: a **fine-grained** personal access
token is scoped to a single resource owner and cannot reach repos owned by another user,
even when you are a collaborator. Outside collaborators need a **classic** PAT (or SSH).
Promoted to LESSONS.md.

## First browser run — the app boots

Loaded the live URL: `index.html`, `styles.css` and `app.js` all return 200, React renders,
Firebase anonymous auth succeeds, and the onboarding checklist paints correctly (Keys,
Wallet, Glasses, Phone, Medications, TV remote, Hearing aids, Bag or purse). Better than
expected for a build that had never run.

**One error, and it is the expected one:**
`watchItems FirebaseError: Missing or insufficient permissions` — the Firestore rules for
`recall_items` / `recall_events` have not been added yet.

## Firebase moved to Tanya's own account, and verified

Created project `recall-d9886` under Tanya's Google account (Spark plan), rather than
continuing on the shared `tanya-command-center`. Rationale in DECISIONS.md — the short
version is that the `recall_*` collections were still empty, so the move cost one config
object today and would have cost a data migration later.

Setup: Firestore `(default)` database in **us-west1** (permanent), Production mode,
rules published for `recall_items` / `recall_events`; Authentication → Anonymous enabled.
`src/lib/firebase.js` updated, rebuilt, pushed.

**Verified on the live URL:** zero console errors, anonymous sign-in returns a uid
(`isAnonymous: true`, no provider data), and the `watchItems` Firestore listener attaches
without the earlier `permission-denied`. Auth and the read path are confirmed end to end.
The **write path is still unproven** — that needs a real camera capture.

Minor note: a browser that loaded the app before the config swap keeps a stale
`firestore/[DEFAULT]/tanya-command-center/main` IndexedDB cache. Harmless and browser-local
(both projects' collections were empty), but that is why an old tab may look odd.

## Still pending

- Add the two Firestore rules in the Firebase console. Nothing saves or loads until then.
- Paste the Anthropic API key into the deployed app's Settings (per device).
- Run the first-capture smoke test: onboarding → snap keys → confirm → tap the Keys tile.
- Claim the GitHub Student Developer Pack (school email) → free Pro → private repo with
  Pages, before real photos go in.
- The root `README.md` folder index was refreshed; 03 and 04 are no longer described as empty.

## Open question flagged to Ravi

The Firestore rules plus a public Pages repo mean anyone with the URL can read the vault.
Fine for test data, not for real photos. Tanya likely qualifies for the GitHub Student
Developer Pack, which allows Pages from a private repo. Decision pending.
