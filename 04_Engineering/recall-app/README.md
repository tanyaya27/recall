# ReCall v0 — Walking Skeleton

Camera-first memory vault for early-stage memory loss. Spec: `../../03_Design/ReCall_v0_Spec.docx`.
Proves one loop: **snap a photo → AI names the item + location → ask later → get the photo back.**

> Project-wide context, conventions and session ritual live in `../../CLAUDE.md` at the
> repo root. Read that first.

## Architecture

- **React 18** (JSX, modular components) bundled by **esbuild** — no heavy toolchain.
  React, ReactDOM and Firebase load from CDN via an import map in `../../docs/index.html`,
  so `node_modules` stays tiny and the source migrates to Vite unchanged later.
- **Firebase** (`recall-d9886` — ReCall's own project, on Tanya's Google account):
  anonymous auth + Firestore. Photos are compressed JPEGs (~100–180KB) stored inline
  in Firestore docs — no Storage bucket / CORS setup needed at v0 scale.
  Offline cache enabled, so browsing works without a connection.
- **`src/ai/engine.js` — the AI abstraction.** The app only calls
  `engine.tagPhoto()` and `engine.answerQuery()`. Vendors implement two methods
  (`visionJSON`, `textJSON`) and register in one map. Anthropic (default) and
  Gemini adapters included; switch provider in the app's Settings, no code change.
  Every call site already passes a `sensitivity` flag — the hook for Phase 2
  on-device routing (MVP architecture requirement #3).

```
ReCall/                        ← the git repo root
  04_Engineering/recall-app/
    src/
      main.jsx, App.jsx        — routing (home | onboarding | capture | answer | recent | settings)
      lib/firebase.js          — app init + anonymous sign-in
      lib/db.js                — recall_items / recall_events collections
      lib/img.js               — photo compression (900px photo + 220px thumb)
      ai/engine.js             — AIEngine + provider registry + prompts
      ai/providers/anthropic.js— Claude adapter (direct-browser header)
      ai/providers/gemini.js   — Gemini adapter
      components/              — Home, Onboarding, CaptureFlow, AnswerView, RecentReel, Settings, EditableText
  docs/                        — index.html + styles.css + built app.js (GitHub Pages serves this)
```

**`docs/` is build output, not documentation.** It sits at the repo root because GitHub
Pages only serves `/docs` from there. Never hand-edit `docs/app.js`.

---

## One-time setup

Do these in order. Steps 1–3 happen once for the project; step 4 repeats on each new machine.

### 1. Create the GitHub repo and push

From a terminal, in the `ReCall` folder (the repo root — **not** this app folder):

```bash
cd "path/to/ReCall"

git init
git branch -M main
git add -A
git commit -m "ReCall v0 walking skeleton + project docs"
```

Then create an **empty** repo named `recall` on github.com — no README, no .gitignore,
no license (an empty repo avoids a merge conflict on the first push). Copy the URL it
shows you, then:

```bash
git remote add origin https://github.com/<your-username>/recall.git
git push -u origin main
```

### 2. Turn on GitHub Pages

On github.com: repo → **Settings** → **Pages** → Source: **Deploy from a branch** →
Branch: **`main`**, Folder: **`/docs`** → Save. The URL appears in about a minute.

*Optional:* custom domain `recall.swiftup.app` — add the DNS record in Cloudflare and a
`docs/CNAME` file containing the hostname, same as satprep.

> **Privacy note.** GitHub Pages on a free account requires a **public** repo, and the
> Firestore rules below allow any anonymous user to read and write. Anyone with the URL can
> therefore reach the vault. That is fine for test photos and not fine for real ones.
> Tanya likely qualifies for the free [GitHub Student Developer Pack](https://education.github.com/pack),
> which allows Pages from a private repo — worth doing before real photos go in.

### 3. Firestore rules

In the [Firebase console](https://console.firebase.google.com/project/recall-d9886/firestore/rules),
replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recall_items/{d}  { allow read, write: if request.auth != null; }
    match /recall_events/{d} { allow read, write: if request.auth != null; }
  }
}
```

Also enable **Authentication → Sign-in method → Anonymous**, or the app cannot boot.

### 4. API key — once per device

Open the deployed app → **Settings** → paste an Anthropic key
(console.anthropic.com → API keys). Stored in that device's localStorage only — never in
code, never synced, never committed. Default model is Haiku (roughly a cent for a day's
heavy use).

---

## Setting up a second machine

```bash
git clone https://github.com/<your-username>/recall.git
cd recall/04_Engineering/recall-app
npm install
npm run dev
```

Then open the deployed app's Settings on that machine and paste the API key again
(step 4 above). Nothing else transfers — and nothing else needs to.

## Developing (any machine)

Run from `04_Engineering/recall-app/`:

```
npm install        # just esbuild (~10MB)
npm run dev        # rebuild on change + serve ../../docs at localhost:8000
npm run build      # minified bundle → ../../docs/app.js
./deploy.sh        # build + commit + push from the repo root (Pages redeploys automatically)
```

**Every working session:** `git pull` at the start, `./deploy.sh` (or commit + push) at the
end. That is the entire cross-machine sync.

## First smoke test after deploying

The app compiles but has never run in a real browser. Run this loop and note what breaks:

1. Open the deployed URL on a phone → onboarding checklist appears
2. Snap a photo of your keys somewhere → AI names item + location
3. Confirm the suggestion → item saves
4. Go home → tap the Keys tile → the photo comes back

## v0 tradeoffs (deliberate — fixed in MVP)

- **Shared household vault**: every device using the app sees the same items
  (anonymous auth, no roles). Fine for one family; MVP adds real accounts.
- API key entered per device; browser-direct AI calls.
- LLM-over-captions search (no embeddings) — right answer at <500 items.
- No service worker; offline = Firestore cache only.
