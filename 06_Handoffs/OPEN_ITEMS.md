# Open items

Running list of outstanding to-dos. Newest at the top of each section; strike or move to
*Done* when closed. Updated 2026-09-29 (evening).

## NOW — `20260929c`: tier 2 and beyond are stored (Ravi 09-29: "it doesn't store that next tier") — adversarial audit

- [x] Ravi 09-29 (phone on `20260929b`): Move it → Desk drawer kept at tier 1 → ＋ → 2 photos named "In air" → Save: tier 2 not
  stored. **Root cause: a place could not say where it is.** A known place's outer tier was dropped; a new place got a
  `parent` field that nothing read; the save card claimed both. Audit with the adversarial board (Grace, Tomás, Frank, Mei,
  Sunil): `design/BOARD_2026-09-29_tiers-audit.md` — T1–T8 logic, U1–U4 screens.
- [x] Fixed in `20260929c` (all with the real rules on; `rig/audit_tiers.js` 26 checks, 16 fail on `20260929b`):
  a place's "is in" is an EDGE from the place doc (every tier, known or new, Log and Move); old `parent` values become edges
  once at boot; the camera shows a known place's own where (Move it opens on "Current place: Desk drawer / In air"); the
  Move toast carries the second line; Move with tier 1 kept writes nothing to the thing; a second unnamed place waits for a
  name instead of merging into "A place"; a place/box already on the chain, or a circle, is not offered or saved; the row
  keeps the selected square and ＋ in view at 3+ tiers; Undo also undoes the place links.
- [x] Real rules engine (the emulator now runs in the cloud container): `firebase/rules-test/test_place_edges.mjs` 10/10;
  `test_edges.mjs` still green. **No rules deploy.**
- [x] Next build item: Settings → Version ends with "Build 20260929c" (the ☰ menu's stamp). Check S16.
- [x] Suites: repro_f3 50 · audit 100 · audit_roles 44 · audit_graph 66 · audit_label 14 · audit_private 34 · audit_d 117 ·
  audit_where 63 · **audit_tiers 26**. (The handoff said audit_where 83; the suite has 63 checks and was 63/63 at the start.)
- [ ] **Ravi + Tanya: rule on Q1–Q5** (renders `design/mockups/TIERS_Q1..Q5_*.jpg`; board positions in the audit file):
  Q1 how the thing's page shows the tiers (A row · B words · C ladder) — until then the tiers are stored and shown in the
  camera only; Q2 Places list (A "in the …" line · B nested); Q3 a place that already has a where is said to be elsewhere
  (A it comes in as tier 2 · B last word wins, said on the card · C ask) — today B without the words; Q4 a place inside a box
  (A allowed, today · B places only); Q5 a question about another tier (A the ask shows its square · B jump to that tier).
- [ ] **Ravi: phone check of `20260929c`** (menu → Build 20260929c; Settings → Version's last line says the same): on the
  plant sensor, Move it → ＋ → photograph the drawer's surroundings → Save → Move it again: the line under "Current place:
  Desk drawer" names tier 2. Your earlier "In air" is an orphan place from `20260929b` — re-do the move and pick it from •••.

## NOW — `20260929b`: Move it opens on the current place; the pin lines up; the prompt sits with the card (Ravi 09-29)

- [x] Ravi 09-29: **Move it opens on the thing's current place** — level 1 is the current place (amber square, its photo),
  the line reads **Current place: Kitchen counter**. Pick or photograph another → **New place: …**; tap the current place
  (now the first pill) → back to **Current place**. Save with nothing changed closes and writes nothing. A photo taken while
  the current place is selected starts a NEW place (it never adds photos to the old one).
- [x] Colours: "Current place:" / "New place:" and the pin are level 1's amber; the place name stays white. In the prompt,
  "Where are the" is grey and the thing's name is bold white.
- [x] **The pin is centred on the text** — measured on the pixels, not the boxes (the old code centred the boxes, and in
  the rig's font that still left the pin 3px low). The pin now stands on the baseline and is lifted by half the capital
  height (`1cap`), so it lands on the middle of the capitals in any font or text size. Same fix in the note card and the
  "put in" sheet. Check in `rig/repro_f3.js` (H) at normal and large text; `rig/probe_pin.js` dumps the geometry.
- [x] Ravi 09-29: **the step prompt moved from the top of the picture into the card, just above the squares** (look B);
  above the chain in look A. Before the first photo there is no card, so it stays at the top then.
- [x] Suites: 50 · 100 · 44 · 66 · 14 · 34 · 117 · 83. Screens: `design/mockups/MOVE_2026-09-29b_prompt-in-card.jpg`,
  `PIN_2026-09-29b_before-after.jpg`.
- [x] (`20260929c`) **Next build (Ravi 09-28):** Settings → Version box: add the build name ("Build 20260929b", the same stamp as the ☰ menu) as the last line of the box, so the time-stamp and the name are in one place.
- [x] **Ravi 09-29: more bugs found on the phone after `20260929b`** → this session (the tier bug; see the section above).
- [ ] **Ravi: phone check of `20260929b`** (menu → Build 20260929b): Move it on a thing that has a place — the pin sits in
  line with "Current place: …", the question sits in the card above the squares.

## NOW — `20260929a`: the move got stuck again (Ravi 09-29) — root cause found in the RULES, fixed

- [x] 09-29 **Root cause:** the real Firestore rules let an owner update a doc only if `consistent()` holds, and
  `consistent()` reads `sharedWith` + `roles`. **Place records never had those fields, so every update to an
  existing place was refused in production** (add a photo, Make main, remove a photo, rename, the boot-time
  private-flag repair). Moving the lint roller into *White cardboard box* with 2 photos = an update to that place →
  refused → caught → nothing on screen. The rig never saw it: its permission stub treated missing fields as empty,
  and most rig runs have permissions OFF.
- [x] Fix (no rules deploy needed): place records carry `sharedWith: []`, `roles: {}` (owner writes only, so a helper's
  rename still passes); the boot repair backfills them on the owner's places/routines/checks; a failed camera save
  now SAYS so above the buttons and keeps the photos (never silent again).
- [x] The rig's stub now mirrors the real rule exactly (missing fields = refused). New check in `rig/repro_f3.js`
  (G): move → pill → 2 photos → Save **with permissions ON** — proven to fail on the old code (camera stays open,
  nothing moves) and pass on the new. All suites: 100 · 44 · 66 · 14 · 34 · 117 · 83 · 36.
- [x] Ravi 09-29: when moving a thing, its **current place is not offered as a pill**; in the ••• list it's there,
  tagged **Current place**.
- [ ] **Ravi: phone check of `20260929a`** (menu → Build 20260929a): Move it → pick a place → 2 photos → Save must
  close and the photos appear on the place; the current place isn't among the pills; ••• shows "Current place".
- [ ] Still open (rules): helpers can't change place photos or photo captions (the rules' editor keys). Owner-only for now.

## NOW — Ravi's phone list (09-28, build 20260928b) — triage

**Bugs — all four fixed in `20260928c`; regression checks in `rig/repro_f3.js` (31 checks):**
- [x] 09-28 `20260928c` B1 **A where-photo is thrown away when a chip is tapped after it.** `LogCamera.pickKnown()` sets `photos: []`
  on the level. So: shoot the white box → AI wrongly asks "Your desk drawer?" → tap the *White cardboard box* chip
  → the photo is discarded; the place stays photo-less (thing page + ••• list). R1 fixed shot-after-pick, not
  pick-after-shot. Fix: a pick keeps the level's photos (they attach to the picked place/box at save).
- [x] 09-28 `20260928c` B2 **"In the photo: …" is stale.** (Interim fix: when the cover photo is removed, its caption goes with it — no caption beats a wrong one. The real answer is D3.) `restingOn` is stored once per thing from the first photo; deleting that
  photo or adding new ones never updates it ("White wall" under a photo on orange carpet). Fix depends on D3.
- [x] 09-28 `20260928c` B3 **"What is it?" rename sheet: the title touches the text box** (spacing; now 14 px, and applies to every sheet with a field).
- [x] 09-28 `20260928c` B4 **No progress while a photo is added (1–3 s)** (now: a working toast with a spinner at once, replaced by the result; a second add while one runs is ignored) — nothing says it's working, invites double taps / leaving.

**Design changes (Ravi 09-28) — RULED 09-28 (DECISIONS; renders `design/mockups/D1..D5_*.jpg`), BUILT as `20260928d` (in the tree; audits 100·44·66·14·34·83·31 + new `rig/audit_d.js` 117): D1·A · D2·B · D3·A · D4·A · D5·A. Screens: `design/mockups/BUILD_2026-09-28d_*.png`.**
- [ ] **Ravi: phone check of `20260928d`** (menu → Build 20260928d first): Add photo pill; tap a photo → viewer (Make main, Remove, Edit caption); swipe the strip → caption follows; tap the place photo in Where it is → that place's photos; camera where-step: pills on one line inside the card, "📍 Your …?" with Yes/No, tap a pill instead; ••• list wording and button.
- [ ] Open (rules): helpers (Can help) can't edit photo captions or place photos — the Firestore rules only let editors mark snaps deleted and don't allow `photos` on place docs. Owner-only for now; a rules change + deploy if helpers should.
- [ ] D1 A visible **add-photo (camera +)** under the thing's photo, on the caption line, right-aligned — not only in
  press-and-hold.
- [ ] D2 **Photo viewer:** tap a photo → near-full-screen; ✕ or tap outside to close; swipe through the photos; a
  **★ on the top-left to make it the main photo** (used everywhere). Same viewer for the place photo in *Where it is*
  (swipe that place's photos, ★ there too).
- [ ] D3 **Captions:** per-photo (changes as you swipe, editable in the viewer) or one per thing (editable in Rename).
  New photos currently get no caption at all.
- [ ] D4 **Camera where-card order:** the place pills belong inside the photo card, ABOVE "Your desk drawer?", so
  picking a pill changes what's below it; drop the redundant last "Desk drawer" line; move the pin icon to the front
  of "Your ___?", centred on that line, in the level's colour. ("There are more bugs in this area" — Ravi.)
- [ ] D5 **The ••• list:** "Search places and boxes" (do we really distinguish? if so, auto-detect + a toggle to
  change it; is a box not a place?); say these are places *already added*; restyle the dashed yellow "New place"
  button (clear but less rough); heading "PLACES" → e.g. "Your places". Then walk new-place creation + its photo
  end to end — B1 may apply there too.

## NOW — where-camera hardening shipped to the tree (adversarial session 09-27/28); Ravi's phone check

- [x] 09-27 Adversarial walk (new cast) of `20260927d`: 90 states, both looks → F1–F10 confirmed Ravi's four
  gaps + six more. Requirements + evidence: `design/REQUIREMENTS_2026-09-27_where-camera-hardening.md`,
  `rig/WALK_INVENTORY.md`.
- [x] 09-28 **R1–R7 implemented and verified (`20260928a`, committed to the tree, NOT pushed, NOT deployed):**
  attach-never-replace; typed/picked places are real place docs (photos flow at save; cap 6 + byte guard;
  typed level photographable immediately); per-level rename at capture + "Unnamed — tap to name";
  name-collision ask + distinct-name gate; chain sheet (edit ONE level) replaces the chain-nuking Choice;
  `asWhere` boxes off Not put away/pill, "N inside" tile, soft nudge; both looks. Audits **321/321**
  (new `rig/audit_where.js` 63); blind re-walk `rig/verify_f2.js` **104/104**; strips
  `design/mockups/VERIFY_R*.jpg`.
- [ ] **Ravi: phone check of `20260928a`** (Safari private tab first): (1) chip-pick a known place → shoot 2
  more photos → name must survive, place gains the photos; (2) type a brand-new place → photograph it in the
  same flow; (3) force "Your …?" both ways (shoot a known box; let the AI name something like an existing
  place) — Yes merges, No demands a new name; (4) save a new box with no outer level → it must NOT appear in
  Not put away; card shows the nudge; (5) chain sheet: replace/remove one middle level only. Then commit +
  push from the Mac (commands in the session log / chat).
- [x] 09-28 **Phone scare on `20260928a` resolved — no code bug.** The stuck "Yes then Save" state was the phone
  running the PREVIOUS bundle (the app was open across the push). The rig proved the shipped code sound in all four
  recognition variants; the old verification's hole (it only checked "no duplicate doc" after Yes-save, which passes
  even when the save never happens) is closed by `rig/repro_f3.js` — 21 checks, now a committed suite: Save must
  CLOSE the camera, WRITE the item, and drop the confirmed chip. Run it with the other audits.
- [x] 09-28 **`20260928b`: the build is readable again** — the menu drawer's foot shows *Build <stamp>* (the ?v=
  deploy stamp). The Version card left Settings in the 09-27 trim and the very next phone check had no way to tell
  old build from new. Phone-check rule from here: open the menu, read the build, THEN test.
- [ ] Rig stub quota fix: `rig/stubs/firestore.js` `save()` should report, not swallow, QuotaExceededError
  (LESSONS 09-28).
- [ ] Fold the four-week plan forward: fast-capture renders and the one-user test now run against the
  hardened camera.

## NOW — Apple Developer sign-up (its own session from 09-26; Ravi as an individual, Tanya 09-24)

- [x] 09-24 **Tanya: Ravi enrolls as an individual; Tanya is credited** (DECISIONS 09-24). Details, and moving to an LLC
  later: `APPLE.md`. The naming-and-Apple session continues as the Apple session only (09-26).
- [ ] **Ravi: enroll** (Apple Developer app on the iPhone, or developer.apple.com/programs/enroll). You'll need an Apple
  Account with two-factor on, your legal name as on your ID, and a street address. Ravi pays the $99/yr and accepts the
  agreements himself.
- [ ] **Waiting on Apple** (a day or two, sometimes longer), then:
  1. Team ID → `APPLE.md` §4.
  2. Bundle ID `com.<neutral-owner>.recall` (confirm the exact string with Ravi; it's permanent).
  3. Sign in with Apple: App ID → Services ID → key → Firebase console (`.p8` never in the repo).
  4. Add Tanya in App Store Connect.
  - `APPLE_SIGNIN` in `People.jsx` stays false until the MVP session turns it on.
- [ ] Then **MVP step 4 is unblocked** (Capacitor → TestFlight), except the App Store Connect app record, which needs a name.
- [ ] Later, if wanted: move to Nova Camino Ventures LLC. Either Apple's individual → organization request (founder +
  D-U-N-S; ask whether the Team ID and apps carry over), or an app transfer after the first App Store release.

## PARKED — the name (Tanya/Ravi 09-24: "we need more time") → its own session: `PROMPT_2026-09-26_naming.md`

- [x] 09-24 Naming board: criteria (7 from the brief + 4 added; splits recorded), 19 candidates, every one checked (USPTO live
  marks, App Store, RDAP domains, Play via web search, web), 35 more screened out. `design/BOARD_2026-09-24_naming.md`.
- [ ] **Tanya + Ravi: pick when ready** (board §5): Wherly · Thingspot · Wherewell · Hither · *ReCall: Where I Put It*.
  The board leans Wherly, with Thingspot as the safe plain alternative. Before picking (Devin): say each once to three
  people and have them write it down; render the finalists under an icon on a home screen.
- [x] 09-26 **Rechecked** (script + Google Play in Ravi's Chrome + web): Wherly, Thingspot, Hither unchanged; **Wherewell
  worse** (the sound-alike *WearWell: Daily Outfit Planner* is now live on Play). `design/BOARD_2026-09-26_naming_clerk.md` §3.
- [x] 09-26 **Ravi's "clerk" idea checked** (MyClerk + 18 variants + 16 adjacent roles): MyClerk, Clerkly, Clerky, Clerkwell
  out; CLERK is registered twice in cl. 42. Clerk finalists: **Clerkit · Heyclerk · Clerkspot · Thingclerk** (all four domains
  free for Thingclerk). Same file §1–4; raw results `05_Research/naming/name_checks_2026-09-26.json`.
- [ ] **Tanya + Ravi:** does any clerk name join Wherly/Thingspot on the shortlist?
- [ ] Before picking: a native Spanish and a Hindi speaker glance at the finalists (Hindi: *clerk* = the low-ranked office
  clerk); Devin's two tests on the combined finalists.
- [ ] After picking: **attorney clearance search** (board §7), then the domain(s) with Ravi's OK (they cost money),
  the DECISIONS entry, and reserving the name in App Store Connect.
- [ ] **If the name changes, the list of places it appears is for the MVP session** (no app code changed in the naming
  session). User-visible "ReCall" is in:
  - `docs/index.html` (`<title>`, `apple-mobile-web-app-title`) and `docs/manifest.webmanifest` (`name`, `short_name`).
  - Strings in `src/App.jsx` (8), `components/Board.jsx` (9), `People.jsx` (6), `Settings.jsx` (5), `PhotoCard.jsx` (2),
    and `MenuScreens.jsx`, `ThingCard.jsx`, `Join.jsx` (1 each).
  - The AI prompts in `ai/engine.js` (7) and `ai/providers/anthropic.js` (4).
  - `lib/db.js` (10), `lib/firebase.js` (2), `lib/auth.js` and `lib/prefs.js` (1 each), and
    `firebase/functions/index.js` (5).
  - Invite links and emails, the icon label, the identity brief, README and CLAUDE.md.
  - Counts are lines containing "ReCall", and some are comments; Devin reviews every visible string.
  - **Do NOT rename identifiers:** Firestore collections (`recall_*`), localStorage keys (`recall-*`), the Firebase
    project `recall-d9886`, or the repo / Pages URL.

## NOW — scenarios, setup and logging speed (Ravi 09-24)

- [x] 09-24: Ravi on H1: "100% cosmetic … quite useless". The layouts become candidate Settings styles, parked.
  The real work is who it's for (dozens of scenarios), a setup that configures the tool, the support network,
  and logging that is nearly effortless. Analysis: `design/BOARD_2026-09-24_scenarios-and-logging.md`.
- [x] 09-24 **Tanya ruled: a general memory app for anyone; the logging clock starts at the phone** (DECISIONS 09-24).
- [x] 09-24 **MVP sequence approved** (PLAN_2026-09-24_generic-mvp.md §3): 1) #1 #2 #5 no key · neutral · no setup card;
  2) #6 #9 #10 capture without questions · label text · log without a photo; 3) #7 #8 nested places · many things per photo;
  4) #3 #4 native app, then App Store privacy/account requirements; 5) #11–13 when outside testers arrive.
- [ ] **Plan for the next 4 weeks:** `design/PLAN_2026-09-24_next-steps.md` (step 1 now; capture renders + step 2 in week 2;
  step 3 in week 3; native + App Store from week 4).
- [ ] **Ravi, still open (09-24):** Apple Developer sign-up in progress (naming session). NOT yet done: the garage photo session (~75 shots, table in next-steps §3, with the true answers written down);
  the invite test (15 min); attach real billing + budget alert BEFORE step 1 ships (AI moves onto ReCall's key);
  enrol in the Apple Developer Program.
- [ ] **Ruler sizing (Ravi 09-24):** length likely (~⅛ in); gauge (#8 vs #10, ~0.6 mm) not reliable from a photo alone.
  Recommended: a printed ReCall sizing card (markers + scales + labelled holes). Test C in week 3. Photos are stored at
  900 px (`img.js`), so measuring must use the full capture. Add to the prioritizer (trades scenario, performance).
- [x] **Step 1 (#1 #2 #5) BUILT 09-24 — `20260924a`, on the Mac, NOT pushed.** AI goes through the `ai` Cloud Function with
  ReCall's own key (secret `ANTHROPIC_KEY`), or the owner's stored key; the function clamps model/size (Haiku, ≤700 tokens,
  one message, ≤8 images) and limits 150 calls/person/day and 3000/day for the project (params `AI_DAILY_PER_PERSON`,
  `AI_DAILY_TOTAL`). Prompts neutral (no "memory loss"). No setup card on a fresh phone. Settings → *AI*: "Nothing to set up",
  *Check it works*, own key folded away. Rig: audit 98/98, audit_roles 42/42; functions on the real emulators 11/11
  (`rules-test/run_ai_test.sh`). Screenshots: `design/mockups/S1_first_run_options.png`, `S1_settings_ai.png`.
- [x] 09-24 Ravi/Tanya: first-run line **C**, Settings → AI card OK. Built into `20260924b` (both stamps bumped; rig 98/98 + 42/42).
- [x] 09-24 **Pushed: `160ceb3`** — `20260924b` is on GitHub Pages. The `ai` function is NOT yet deployed with ReCall's key, so a phone with no key of its own saves photos unnamed until deploy steps 1–3 below are done.
- [x] 09-24 (see the naming section above) **Naming + Apple Developer sign-up — its own session:** `06_Handoffs/PROMPT_2026-09-24_naming-and-apple.md`
  (findings so far: `06_Handoffs/NAMING_2026-09-24_findings.md`). To run it on another machine, the repo must be pushed first.
- [ ] **Deploy step 1, IN THIS ORDER** (the function must be live before the web build):
  1. Real billing + a budget alert on `recall-d9886` (Firebase console → Billing). Also set a monthly spend limit in the
     Anthropic console on the key below — a second brake.
  2. A new Anthropic API key just for the ReCall service (console.anthropic.com → API keys, name it "ReCall service").
  3. `cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall/04_Engineering/firebase"`
     `firebase use recall-d9886` · `firebase functions:secrets:set ANTHROPIC_KEY` (paste the key; say yes if it offers to
     enable Secret Manager) · `firebase deploy --only functions:ai`
  4. `cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall"` · `find .git -name "*.lock" -delete`
     · `git add -A && git commit -m "MVP step 1 (20260924b): AI through ReCall's service, neutral prompts, no setup card, first-run line C; naming + Apple session prompt"` · `git push`
  5. Phone check: open the site in a **Safari private tab** (no key there) → Log item → the photo gets a name. Settings → AI →
     *Check it works* → ✓ Working — through ReCall's service. Phones that already have a key keep using it; *Stop using my key*
     switches them to the service.
- [ ] Follow-up (#4): **App Check** — today anyone with the URL can sign in anonymously and use up to 150 calls/day each; the
  3000/day project breaker bounds the total. App Check (App Attest in the native app, reCAPTCHA on the web) closes that.
- [ ] **Fast capture: three options RENDERED 09-24:** `design/BOARD_2026-09-24_fast-capture-options.md`, `mockups/C1_*.jpg`.
  Rulings needed: (1) option 1 "the camera never leaves" for step 2; (2) option 3's list in step 3, labels after the test,
  sweep things on Home as ONE place tile; (3) option 2 as an everyday-things setting or not at all; (4) `placeSource` stored.
- [x] **Step 2 part 1 BUILT 09-24 — `20260924c`, on the Mac, NOT pushed:** capture modes (One thing · Several) with the mode
  row under the viewfinder (gone once a photo is taken), hold *Log item* → *Log item as…*, Settings → *Taking photos* (opens in
  Last used; which modes show; one mode = no row). **Several**: saved at the shutter, name + place stream into the frosted strip,
  place from the session / usual place / a sure AI guess, else three choices; ＋ = another angle; a saved thing is ASKED
  ("Your reading glasses?"), never merged; Close/Done → review of 2+ things. **One thing**: the place used in the last 10 min
  (or where the thing usually lives) is already chosen, with *Next item* · *Done* right under it. `placeSource` stored on every
  save; rules: editors may write it. Tests: audit 98/98 · audit_roles 42/42 · **audit_modes 25/25** · rules engine (test,
  test_grant incl. the new placeSource checks, test_p2) all as expected. Screenshots: `design/mockups/S2_modes_built.jpg`.
- [ ] **Ravi: look at `S2_modes_built.jpg`** before this goes to the phone.
- [x] 09-24 **DEPLOYED:** rules (placeSource) · `ai` function with ReCall's key (secret `ANTHROPIC_KEY` v2, Anthropic key
  "ReCall service" on Ravster's account, Default workspace) and limits 150/person/day · 3000/day (`functions/.env.recall-d9886`
  — commit it) · web `20260924c` pushed (`56d6225`). v1 of the secret was a mis-paste (the deploy command text) — destroy it:
  `firebase functions:secrets:destroy ANTHROPIC_KEY@1`.
- [x] 09-24 **Phone check passed:** Ravi's phone switched to ReCall's service (Stop using my key) → Check it works → "Working —
  through ReCall's service". The function uses the real key (v1 of the secret is a dead value the CLI still calls "in use";
  harmless, leave it — don't `-f`). Dad's phone still uses its own key: switch it the same way when convenient.
- [ ] (remaining phone checks)
  Log item → the photo gets a name; the mode row; Several + a chosen place carries to the next photo; hold Log item.
- [ ] **The Anthropic key expires in October 2027** (Ravi 09-24). A scheduled task reminds Ravi on 2027-09-24 (push + email, trig_01DyKpevUkVik28gKmPahfRv); rotate before it lapses (`firebase functions:secrets:set
  ANTHROPIC_KEY`, then `firebase deploy --only functions:ai`). Ask Claude for a reminder.
- [ ] Later: a separate "ReCall" workspace in the Anthropic console with its own monthly spend limit (before outside testers).
- [ ] Later: identity federation (the function on Google Cloud gets short-lived Anthropic tokens; no stored key).
- [ ] Later: `firebase-functions` is outdated (deploy warning); upgrade with care (breaking changes) and re-run run_ai_test.sh.
- [x] (done) **Deploy 20260924c — ORDER MATTERS:** (a) step 1's deploy first if not done (billing → key → `functions:secrets:set
  ANTHROPIC_KEY` → `deploy --only functions:ai`); (b) `firebase deploy --only firestore:rules` (adds `placeSource` for helpers;
  without it a helper's Several/One-thing save is refused); (c) then commit + push.
- [x] **Step 2 part 2 LIVE 09-24 — `20260924d` (pushed `a103267`, rules deployed first):** **#9** the AI copies what's printed on the thing
  (label, packet, bill, stamp) into `details` (≤200 chars); shown on the thing card as a tag line; searched by Find item at the
  description tier (quotes ignored: 'Queen of Night' matches). One thing and Several both save it. **#10** camera → *Type it* →
  *Write it down*: What is it? · Where is it? (usual places, or typed) · Keep this private · Save (or Save without a place);
  the place used a moment ago is chosen. No photo: `written: true`, photoCount 0, no snap; a note tile on Home; the card says
  "Written down, no photo yet"; the first Add photo becomes the cover. Rules: editors may write `details`, `written`.
  Tests: audit 98/98 · roles 42/42 · modes 25/25 · **audit_label 15/15** · rules engine as expected. Screenshots:
  `design/mockups/S2b_label_write_built.jpg`. **Deploy: rules first, then push** (commands in the chat 09-24).
- [x] **BUILT 09-24 (20260924e): things that look private start private.** A typed name like "password", or a photo of a password,
  bank/ID card or medical/health paper (HIPAA-type), is saved *Only me* by default, and the person is told at or right after the
  photo, with one tap to share it instead. Owner only (a helper can't make things private; they get told instead). Build in step 3.
- [ ] **CONTAINERS LIVE 09-26 (20260926a, pushed 22e3cb2; edge rules deployed first).** Ravi: phone check, then pick
  A or B.
- [ ] **09-27 Ravi: "The word 'log' doesn't make sense anymore."** Replace "Log item", "Log something in" and "+ Next"'s
  sense of logging with a better word — Ravi to decide after checking build 2 on the phone (options to be drawn, not guessed).
- [ ] **BUILD 2 (20260927d) — rules DEPLOYED 09-27 (Ravi). Next: push, then the phone check.** Everything in
  `design/BOARD_2026-09-27_every-path.md`, as ruled (DECISIONS 09-27 late): camera levels by intent (colours, shutter ring,
  ＋, per-level swipe preview, Type it instead on the photo, dark glass card, pin aligned); one page per thing (inside view
  and its experiment retired); only containers hold things (`holds`, It holds things switch); one way to say where (the
  camera + one ••• list, also in Write it down); Not put away = a list; hold sheet trimmed; loop guard at write; Show times
  → Settings. **Your pencil: the filing cabinet is taken out of it once, when the app opens** (it then waits under Not put
  away; Put it somewhere gives it its place).
  Tests: walk_s12 56/56 in Dusk and in Linen · main 100 · graph 66 · roles 44 · private 34 · label 14 · graph unit 19 ·
  nest 14 · rules engine: test_holds 7/7, test_edges 21/21, the other suites unchanged. Crawl of every screen and every tap
  in Dusk and Linen: `mockups/S12_crawl_dusk.pdf`, `S12_crawl_linen.pdf`; the walks: `S12_camera.jpg`, `S12_pages.jpg`.
  **Rules change (`holds` in editorKeys): deploy the rules BEFORE the push.** Retired, not deleted: PlacePicker,
  InThingSheet, WhereSheet (no longer used); `walk_s10.js` (build 1's walk; `walk_s12.js` replaces it).
  Next: put several away at once on the camera; the Find trail; PhotoCard's remaining uses.
- [x] **09-27 EVERY PATH — Ravi: rulings 1–6** (`design/BOARD_2026-09-27_every-path.md`). Ravi's phone test of build 1 found serious
  errors. Crawl (`rig/crawl_s11.js`): 28 screens, 206 taps, his dark theme, his data shape → 29 numbered issues
  (`mockups/S11_evidence.jpg`, `S11_crawl_every_screen.pdf`, `S11_map_now.jpg`). Data bugs live now: #8 a loop can be saved
  (pencil in cabinet in pencil), #12 "Put things in" on every thing (how the cabinet got inside the pencil), #14. Fix drawn
  (`S11_fix_camera.jpg`, `S11_fix_pages.jpg`, `S11_map_new.jpg`): camera levels by intent, one colour per level, shutter ring
  matches; tap a level's photo → half-screen, swipe through THAT level's photos only; dark glass card; one page per thing
  (every tile opens it; reverses 09-25 "Home follows the box"); one way to say where (the camera, from Put it somewhere / Move
  it); "Put things in" gone; no bottom bars; loop guard at write. Rulings: 1 levels · 2 one page per thing (reversal) ·
  3 only a container holds things (Ravi: "It holds things" switch / photographed as a where that moves; Put things in only on containers; where-lists offer only places + containers; rules change) · 4 the page · 5 safe fix build now (loop guard, card, pin, remove Put things in) · 6 repair his
  pencil/cabinet or Move it himself. No code changed.
- [ ] **BUILD 1 (20260927c) LIVE — pushed a0c5d7b 09-27. Ravi: phone check (Log item → shoot the thing → step back → Save; try A in Settings → Taking photos).** The camera
  answers "where": step back and photograph what it's in, then where that is (a chain of photos); the AI names each and says box
  or place, recognises a saved box/place and ASKS; Save / + Next beside the shutter (floppy icon, 27 px gap); the sentence above;
  Cancel alone top-left; B (Answer card) default, A in Settings → Taking photos; Home card with the saved chain + Undo (owner);
  a late privacy verdict shows on that card with Share it. Bug #10 fixed (only exact names or the AI's own "same as" match; a
  shared word goes to the visual check). Bug #29 fixed (a button row widened the page). One verb per button: Put away / Put in /
  Write it down Save. Retired: the mode row and Several (Q3), the capture-mode settings. No rules change (helpers creating a box
  and a place from photos pass on the rig's rules). Audits: walk_s10 41 · main 96 · roles 44 · label 14 · private 34 · graph 58 ·
  graph/nest unit tests pass. `audit_modes.js` retired with Several. Build 2: put away from the camera, the Find trail, retire
  the old sheets (In something, Where is it now?, WhereSheet), PhotoCard for "new photo".
- [ ] **09-27 ROUND 3 — Ravi: rulings R3-1..3** (board note "Round 3"; `mockups/S9c_round3.jpg`). Drawn from Ravi's notes: the chain
  lines up (fixed 2-line names), "in" pills, scrolls sideways when deeper; **Save + next | shutter | Save** in one row; a Save icon
  (floppy disk) reused in "+ Next"; camera icon = take a photo only (empty "where" = pin with ?); tap a chain photo → half-screen
  preview, tap anywhere to close. Overlays translucent; deep chains scroll sideways in A **and B**. **B is the default (ruled; DECISIONS 09-27).** Shutter spacing ruled (119 px buttons, 27 px gap, 100 px shutter target). To rule: floppy vs check icon · "Type it
  instead" above the shutter · round-2 points still stand. Still no code; build starts after these rulings.
- [ ] **09-27 ROUND 2 — Ravi: rulings R2-1..4** (same board note, "Round 2"; `mockups/S9b_buttons.jpg`, `S9b_both.jpg`). Ravi agreed
  photo-first where + rulings 3, 4, 5, 6 — **contingent on seeing the fix**. He wants A and B both pickable in Settings (leans B),
  Cancel as a real button (it looked like the title), buttons grouped by function, and no sentences inside buttons. Board: Cancel
  alone top-left; **Save + next** beside **Save**; shutter alone; one verb per button with a two-line sentence above it, app-wide;
  Settings → Look → The camera (default B). To rule: grouping · the "Save + next" label · the button rule app-wide · default B.
- [ ] **09-27 UX BOARD WALKTHROUGH — Ravi: rulings 1–6** (`design/BOARD_2026-09-27_walkthrough.md`). Ravi: "The sequence is
  totally wrong." The board walked build 20260927b screen by screen with real photos in the viewfinder (`rig/walk_s9.js`): 31 issues,
  numbered on `mockups/S9_walk_1..5.jpg`. Root cause: the 09-26 Q1 ruling (item → place on the camera) was never built; fixes 1–2
  bolted sheets onto the old photo card, so 4 different screens ask "where" and none has a camera. Redesign
  (`mockups/S9_redesign_1..3.jpg`): the camera asks where, she steps back and shoots what it's in and where that is (a chain of
  photos), and the Save button names the place. Ravi's example: 14 taps + 2 typed → 5 taps, nothing typed. Rulings:
  1 direction · 2 layout A/B · 3 after Save (Home + card, Next keeps shooting) · 4 retire the old sheets, Several, the
  mandatory photo card · 5 put away from the camera · 6 fix bugs #10 (a shared word moved the wrong thing) and #29 (a sheet
  off the edge) now. **No code changed; nothing to push.** Fixes 1–2 below are superseded by this once ruled.
- [ ] **FIX 2 09-27 (20260927b) LIVE — pushed d7ff200; Ravi: phone check (pencil → In something → New: tin box).** "In something" + "No place yet" at the top; "New: <typed>" makes
  the box in "What is it in?". `mockups/S8_in_something_top.jpg`. Audits: graph 58 · main 98 · roles 42 · modes 25 · label 15 · private 37.
- [ ] **FIXES 09-27 (20260927a) LIVE — pushed 3dcc073; Ravi: phone check + A or B.** a box by its photo wherever a place is asked + In something…;
  "Put things in it" on box-like cards; "No place yet" always one tap; Home "Not put away · N" → where → tap each.
  `mockups/S7_inbox_fixes.jpg`. Audits: graph 55 · main 98 · roles 42 · modes 25 · label 15 · private 37 · logic 14. No rule change. Phone check: Settings → Experimentation → try **Back + banner** and **Trail**;
  pick a winner (then I delete the loser and, when empty, the section). Audits: graph 34/34 · edges on the real engine
  21/21 · graph logic 14/14 · main 98 · roles 42 · modes 25 · label 15 · private 37.
  Existing things have no links yet: they show as before until moved or put in a box (no migration).
- [ ] **Web push, next:** the camera — item → place on the camera ("Now the place · step back"), **the Save button names
  the place**, every photo = the dominant thing, then **Detect other items** (labels/list, tap to add); then Tidy up
  (its own flow; card vs pop-up to go into Experimentation); then Find. Then the test user on their own iPhone (first run
  from nothing), then native. Hold-to-speak: prototype only (Q9 maybe).
- [ ] **Step 3: RULED 09-24** (DECISIONS "Step 3 rulings"). Done in the rig: **private by default + refusing
  secrets** — build `20260924e`, audits private 37/37 · main 98/98 · roles 42/42 · modes 25/25 · label 15/15;
  screenshots `mockups/S3b_private_built.jpg`. **Ravi: look at the screenshots, then push; phone check:** Log item →
  photo a closed notebook → the card says *Kept private: this looks like passwords* → Done → the tile has a lock;
  photo an open page of passwords → *This photo won't be kept*; Write it down "PIN 4821" → Save greyed.
  **LIVE c86fcce.** Places inside places: **B chosen 09-25, and widened** (DECISIONS 09-25: edges as first-class records;
  contents off Home + promote; Home follows the container tapped; log first, put away later, very fast). Approach walked
  through in chat; **DRAWN 09-25 — RULINGS NEEDED:** Home inside a box **A (Back + banner; board) or B (trail)**; put away
  **P-A + P-B now, drag later (board)?** — `design/BOARD_2026-09-25_containers-graph.md`, `mockups/S5_home_inside.jpg`, `S5_put_away.jpg`.
  Fixed places open on Home too (Ravi: agreed). Prototype — `design/BOARD_2026-09-24_nesting-natural.md`, `mockups/S4_nesting_options.jpg`.
  Logic in `src/lib/nest.js` (rig only until the ruling; tests `rig/tests/nest.test.js` 14/14). No data or rule change.
  Then: **places inside places** as ruled,
  then **Everything in view** (one tile per sweep). Known gap: a helper who saves a readable-secret photo BEFORE
  the name arrives can only soft-delete its snap (rules) — the owner's app should purge it; rare.
- [ ] **"On this phone only" — RULED: waits for the native app** (shown greyed now, "coming soon")., a third level beyond Only me: the thing never leaves the device,
  and other devices show only a count. Board: yes, in step 4 (native; web storage on iPhone isn't a safe ten-year home, and
  naming must happen on the phone), with end-to-end encryption considered alongside. Does NOT change 09-15's "Only me =
  private to the person".
- [ ] Noticed (not new): at Largest the thing card's switch labels ("Keep this private") wrap to two lines.
- [ ] Step 2 leftovers: #9/#10 Step 2 part 2 was: #9 label text (`details`, searchable) and #10 logging without a photo. Not in Several yet: the AI "looks"
  check (tier 3) for duplicates — Several asks only on a name match; the one-time "Taking several?" suggestion; Largest review.
- [x] 09-24 RULED (board's recommendations) — **Capture MODES** — `design/BOARD_2026-09-24_capture-modes.md`, `mockups/C2_modes.jpg`.
  One camera, three modes (One thing · Several · Everything), switched under the viewfinder or by holding Log item; Settings →
  Taking photos sets where it opens (last used) and which modes show; one mode on = no row (Margaret unchanged). ~7 d for all
  three. Rulings: (1) modes as drawn; (2) open in last used; (3) the names; (4) step 2 = row + One thing + Several, Everything
  in step 3. Supersedes the "pick one" rulings in the options note.
- [ ] **S6 insurance inventory (Ravi 09-24):** added to the scenarios note (addendum). A sweep + label details + a PDF/CSV
  export. After the MVP; add it to the prioritizer.
- [ ] **Fast capture (#6/#8):** brainstorm `design/BOARD_2026-09-24_fast-capture-brainstorm.md`. Next: render its three
  camera options (§7) + the label-position spike (Gemini boxes / Apple subject lift / Claude) on 20 real drawer photos.
- [ ] #4 order matters: strip the rules' legacy clauses only AFTER the invite test (Dad → Can help → Ravi), or Ravi's
  phone loses access to the old data.
- [ ] Re-run the Kano analysis for the general user (Maya), alongside the MVP.
- [ ] Spikes: 20 real drawer/shelf photos → "one photo, many things" accuracy; label text on a screw box, seed packet, bill.
- [ ] Tanya to go through the scenarios note §10 after the MVP call.
- [x] (superseded) **Needs Tanya (§0):** broaden ReCall from memory aid to "the household's memory", with memory loss as the
  hardest case? The Kano work covers only the memory-loss premise, so reopen it deliberately if yes.
- [ ] **Rulings for Ravi (§10):** dimensions + model additions (movable places, `kind` + `details`); logging
  targets (and so native wrapper next?); setup questions vs evidence; lead scenario; Together vs appointments
  first; draw the three sets in §9; run the two spikes (label reading, Capacitor launch-to-shutter).

## PARKED — home screen rethink (Ravi 09-23)

- [ ] **Home screen: a complete rethink**, UX and artistic — "not a great opening screen". Six
  mockups from the real stylesheet, product board + a senior mobile graphic designer persona
  (20 years). Prompt: `06_Handoffs/PROMPT_2026-09-23_home-screen-rethink.md`. No code until
  Ravi picks.
- [ ] **Whose ReCall am I looking at?** (Ravi 09-23): "No way to know" whether it is my ReCall,
  one I can see, or one I can help with. Today: own grid = day line only; a helper's grid =
  *X's ReCall ▾* + role in small grey. Every one of the six home mockups must answer it at a
  glance, and the thing card / photo card / camera must carry it too.

- [x] 09-23: approach note written (`design/BOARD_2026-09-23_home-screen_approach.md`); rig rebuilt,
  93/93 + 41/41 on `20260921b`; today's home rendered (`design/mockups/H0_today.png`).
- [x] 09-23: go-ahead given (Commons photos; draw both own-titles; six as listed; "accommodate the pipeline").
- [x] 09-23: six concepts drawn — `design/BOARD_2026-09-23_home-screen.md`, `design/mockups/H1_montage.png`,
  `H1_A_album` · `H1_B_index` · `H1_C_note` · `H1_D_prints` · `H1_E_two-doors` · `H1_F_ask-first`, `H1_own_title.png`.
  Generator: `04_Engineering/recall-app/rig/gen_h1.py` + `render_h1.js` + `compose_h1.py` (photos in `rig/mock/img/`, CREDITS.md).
- [ ] **Rulings for Ravi (BOARD §10):** (1) which concept or combination; (2) colour = role or = person;
  (3) her own title: her name or *My ReCall*; (4) Settings off Home into the menu; (5) one more pass with his own photos?
- [ ] After the pick: rendered pass of the winner (+ carry-through screens) → then code, both cache stamps, audit.js +
  audit_roles.js (+ new perspective checks), screenshots before the phone.
- [ ] If C or D wins: settle the wordmark's type direction first (identity brief step 4). If E wins: native wrapper first.

## Multi-user — where it stands (09-23)

- [x] `20260921b` LIVE: Phase 2 + same-origin Google sign-in. Dad's phone signed in as
  ravi.bizlogix@gmail.com (his account) — sign-in proven on a real iPhone.
- [ ] **The invite test** (set aside 09-23): Dad's phone → People → Invite someone… → Can help
  → Send a link… → Ravi's phone opens it → Continue with Google (a DIFFERENT Google account
  from Dad's) → lands in Dad's ReCall → Add photo saves. Until then Ravi's phone is read-only.
- [ ] After the invite works: strip the `legacy()` clauses from `firestore.rules`, run
  `04_Engineering/firebase/rules-test` (npm test), `firebase deploy --only firestore:rules`.
- [ ] Phase 3 (Shared with sheet per thing, Only me confirm, Give, claimAnonymous) and Phase 4
  (status line) — PLAN_2026-09-19_multi-user.md.
- [ ] A helper logging into someone else's ReCall still uses their OWN phone's AI key; the `ai`
  callable (owner's key) is deployed but unused by the client.
- [ ] Apple sign-in: needs an Apple developer account; `APPLE_SIGNIN` in People.jsx stays false.

## Needs a phone / the Mac (Ravi)

- [ ] **`20260921b`:** Google sign-in as a same-origin OpenID redirect (Firebase's redirect is blocked by Safari 16.1+ on GitHub Pages — DECISIONS 09-21); errors now show on the button and in Settings' *For support* line. Needs on the Google Cloud OAuth web client: origin `https://tanyaya27.github.io`, redirect URI `https://tanyaya27.github.io/recall/`.
- [x] **Review `20260921a` (Phase 2) from the montages** (pushed 09-21) `06_Handoffs/design/mockups/MU3_built_{owner,join_settings,helpers}.png` — committed on the Mac, NOT pushed. On approval: `git push origin main`, then in `04_Engineering/firebase`: `firebase deploy --only firestore:indexes` (new sharedWith+kind index) and `firebase deploy --only firestore:rules` (Phase 2 rules, legacy clauses still in). Then the real test: **Dad's phone** → Settings → *Sign in with Google* (keeps his ID) → hamburger → People → Invite someone… → Can help → Send a link… → send it to Ravi; **Ravi's phone** opens the link → Continue with Google → lands in Dad's ReCall as Can help → Add photo works. Then step 7 (strip the legacy clauses, redeploy rules).
- [ ] Phone-check Phase 2 beyond the invite: Dad's grid unchanged until he invites; People rows and dates; the added-by name on a photo Ravi adds; Places on Ravi's phone once Dad's phone has opened once (repair); *Remove* from Dad's People → Ravi's phone shows the removed card; the switcher only when there is something to switch to.
- [x] **Firebase deployed 2026-09-21** — CLI as **tangadi.biz@gmail.com**, project `recall-d9886`; Google sign-in on (public name *ReCall*); indexes; five functions on **Node 22** (`firebase.json` sets the runtime; a runtime-only change needs a source edit + `--force`); rules live WITH the legacy clauses. Build `20260919a` pushed. Adoption ran on **Dad's phone** (uid `sGHftCNWC4Tf7G4uHcEgkTGJWU92`) — he owns every pre-09-19 doc; Ravi's phone (`eTbA20pGnfSWFZ8ZkqNwrMkUvvF3`) reads through the legacy clause and cannot write (Add photo silently fails; rolls show the cover only). Ravi 09-21: leave it — Phase 2's invite is the fix (Dad → *Can help* → Ravi). Proven on the real rules engine (rig `rules-test/`): a grant holder can add photos, move, rename, add things/places, tidy snaps; cannot make private, remove or delete.
- [ ] **Rules step 7 waits for Phase 2:** strip the `legacy()` clauses ONLY after Ravi holds the grant (they are what lets his phone read today). Same redeploy: add `me() in d.sharedWith` to `canRead` (the *shared with me* listener is refused by the real engine as written).
- [x] (in `20260921a`) adopted places repaired on the owner's boot; Account card rewritten; Apple hidden until enabled.
- [ ] **Billing:** the project runs on a Google Cloud free trial ($300, expires **2026-12-21**). Before then, attach a real billing account (Firebase console → Billing card → *Upgrade*) or Cloud Functions stop. Set a $10/month budget alert when doing so.
- [ ] **Deploy `20260916f`** (8c: title band, *Remove old photos…* sheet) from the Mac — 8b: place picker in Edit, tidy-up sheet, earlier count = places, amber words + distinct pin, alignment asserted; round 8: the thing card on the sightings model (title carries the place; fixed-size time label and trash on the photo; earlier places as a switch; three-button bar; *place*/*Places* everywhere); 7c: thing-card actions in a fixed bottom bar (same height as Home's), *Earlier photos* only live when earlier photos exist (count in the label); 7b fixes (flipped *No place assigned* label, pin on the place line, AM/PM, real photo times, BOTH stamps bumped) on top of round 7: when pill + Private on one line (no "this phone"
  anywhere; one toast shape both ways), amber pin badge for *no place yet* (tap → place field),
  *Text size & colours*, Locations as a list with photos → one-location screen (photos ≤3 via
  the camera, rename, things here, remove), *Add a location* = camera then name, "Where is it?"
  in three views with links, up to 4 shots per *Add photo* (log holds 6), the roll expands as
  one. Rig: 84/84. Screenshots Ravi reviewed: `06_Handoffs/design/mockups/r7f_combo_*.png`.
  Commands at the end of this file.
- [ ] Title: C chosen 09-16; D (card + band) kept in reserve — `06_Handoffs/design/mockups/r8b_title_options.png`.
- [ ] Phone-check `20260916f`: line 2 of the title sits in a soft band; Edit → *Where it is* → the place list with pictures; pick one → toast *Now at …*, title updates, roll shows one photo there; Edit → *Remove old photos…* → sheet with counts → *Forget where it was before* → toast with Undo → Undo brings them back. *Show earlier places* number = places. Then: open a thing → chevron Back, name on one line, place · context tight under it; time label bottom-left of the photo (same size at Largest), trash top-right; *Keep this private* switch → lock appears beside the name; *Show earlier places (n)* only on things that moved → older photos show their place in amber under the photo, title unchanged; Edit → change the place → the roll shows one photo at the new place, earlier count grows by the old ones; hamburger says *Places*. Then the 7c/7b checks: thing card → the four actions sit in a bar at the bottom at the same height as Home's buttons; tap Edit → fields open in a card under; with the keyboard up the bar should not cover the field being typed in (if it does, tell me). *Blue and red folders* → *No earlier photos*, greyed. *Reading glasses* (moved once) → *Not there? N earlier photos*. Locations rows have SMALL square pictures (if still huge, hard-refresh — the stylesheet stamp). A thing without a place: amber label block reading *No place assigned*; card shows a pin before the place line. Open a private thing → clock pill (icon centred) left, lock + *Private* right on ONE line; time reads *today, 1:09 PM*; add a photo, swipe to it → the time changes; tap *Private* → toast *Now shared · everyone at home sees it*; tap again → *Now private ·
  only you see it*. Home: a thing without a place has an amber pin badge top-right (and a private
  one keeps its lock too); tap it → card opens in Edit with the place field. Thing card → *Add
  photo* → the shutter allows 4 → Done → 5 dots. Tap the big photo → every page grows to the same
  height; swipe — no jump. Hamburger → *Text size & colours* (renamed). Hamburger → Locations →
  a list with pictures → *Add a location* → camera → 2 shots → Done → name → *Save this place* →
  row shows your photo. Tap it → photos + *Add photo* slot, rename with the pencil, *Remove this
  location* asks first. *Log item* → Where is it? shows *Smaller photos* automatically (a place has
  a photo) with the place's own photo beside its name; links *Names only* / *Bigger photos* switch
  and the choice sticks after a restart.
- [ ] **Camera permission on every launch** — iOS limit for home-screen web apps, no web fix
  (DECISIONS 2026-09-15). Decide on a native wrapper (Capacitor/TestFlight) in the multi-user
  session.
- [ ] Deploy `20260914p` from the Mac (p: a little more space above the Home buttons; o: Shared/Private open/closed lock, trash per photo
  bottom-left + photo in the remove sheet, lock watermark, hold → private, hamburger flush; n: thing card layout A — trash on the photo, labelled
  action row, icons-only when words don't fit; m: private items — field, toggle, lock, filtering; l: Add photo · Edit replace Found it/Fix; wrong-photo
  guard; hold on the photo → sheet; shorter footer; k: full-path audit fixes — Add photo on older items,
  added photo shows at once, rename keeps the alias, Find item → Take a photo opens the camera;
  j: naming + identity use every shot and the
  subject, sure-only visual matches; i: the in-app camera — Cancel, several shots with
  ✕ thumbnails, Done; h: day line hugs the hamburger; Back from a menu screen returns to the
  drawer) (g: Version card shows facts only — build time,
  installed-on-this-phone time, when the server was last asked; no "latest" claim) (adds: hamburger menu — Look and feel with Compact,
  Locations, Deleted items with swipe + Empty the list, Research log; Settings = Version first
  + AI key; the Version-card update banners; tighter footer bottom) — everything from today (labels, thumbnails, and
  the second-round build). Commands at the end of this file.
- [ ] Phone-check `20260914p`: thing card shows the trash on the photo and the row *Add photo ·
  Edit · Share · Remove* with words at Normal; switch to Largest → icons only, one row. *Share*
  → *Private* → lock on the tile. Then: thing card footer is *Add photo · Edit*; Edit the place → it
  appears under *Where it has been*; add a photo of something else → the question sheet;
  hold the big photo → the app's sheet, not iOS's. Then: open any of your existing items → *Add photo* → shoot → Done →
  the strip shows the new photo at once with dots. Find item → nonsense → Find it → *Take a
  photo of it* → camera. Keyboard close-up + wide shot with the can behind → card says
  *Keyboard*, stays *Keyboard*. Then: *Log item* opens the app's own camera (allow the permission
  once) → shutter twice → two thumbnails → ✕ one → *Done* → photo card. *Cancel* returns to
  Home with nothing saved. Thing card → *Add photo* → shoot → *Done* → toast *Added*. If the
  camera fails to start, *Use the phone's camera* appears. Then: hamburger left of the day line → drawer → each row opens its
  card and Back returns. Look and feel → Compact → Deleted items: swipe a row left → Delete,
  right → Put back; *Empty the list* asks first. Settings → Version is at the TOP; *Get the
  latest version* returns to it without scrolling. Version shows *A newer version is available* before
  you tap, then *New version installed — built 9/13 10:5x PM* after; tap again → *No newer
  version was found*. Space under the footer buttons is only the home-indicator strip.
  Then round 3: footer buttons identical (rig-verified); day line
  two lines, never cut; Log item → take one, tap *Another*, take a second → two thumbnails
  with ✕ → tap a place → one tile; open it → swipe, next photo peeks. Photograph the soda
  can from a new angle with any name → *New photo of sparkling soda* (name tier) — or, if
  the AI names it something new, "Checking it isn't already saved…" then the same header
  (visual tier; ~3 s more). Thing card: *Add photo · Remove photo · Fix*. Hold a tile 0.5 s
  → sheet → Cancel. Then the earlier checks: footer — both buttons the same size and
  weight, white on green / green on white, bigger than before; still one row at Largest
  on a 390-px phone. Home: *Sunday evening · September 14*. Log an item, then tap *Add
  another photo* in the toast → second photo saved silently, tile unchanged; open the
  thing → swipe between the two photos, dots under. Rename a thing, photograph it again
  → header says *Your <new name> — new photo*, no duplicate. Move a thing to a second
  place → *Where it has been* row appears; tap it → Earlier mode; *Back to now*. *Remove
  this photo* → sheet → toast → Undo brings it back. Search "folio" → folder first;
  "table" shows things whose *name* has table before things merely *on* a table. Settings
  → Places: add one, log a photo → it is the first chip; rename it → items follow.
- [ ] Phone-check `20260914a`: footer says *Log item* · *Find item* on one line at Largest
  on a 390-px phone; Home tiles sharpen within a few seconds of opening (each old item is
  rebuilt once — watch the Firestore console if unsure); a new photo's tile is sharp at
  once; thing card photo unchanged; Ask screen title *Find item*, prompt *Where is my…*.
- [ ] Phone-check the last deploy (stamp `20260905l`, pushed 2026-09-05 20:45):
  Home footer is one row on a 430-px phone at Normal, two round icons bottom-right at
  Largest; Settings → Recently removed shows name, place line, two buttons on one line;
  *Where is my…* matches locally as she types or speaks, AI only when nothing matches.
- [ ] Before the next git command on the Mac: `find .git -name "*.lock" -delete` — the
  sandbox left `.git/index.lock` behind again on 2026-09-14.

## Later

- [ ] Remove the Settings gear once the AI key has a home (helper phone / join code).

## Audit of the last two feedback rounds (2026-09-14, at Ravi's request)

Round 2 (ten items): history visible ✓ · several photos per log ✓ · remove a photo ✓ ·
duplicate after rename ✓ · button size/contrast ✓ (after two regressions) · search ranking ✓
· editable-field affordance ✓ · day line ✓ (+ date) · locations manager ✓ · appointments —
decided with Tanya, scheduled after the helper phone (not built, by agreement).
Round 3 (six + camera): peek ✓ · footer sizes ✓ · **multi-shot in the camera with ✕
thumbnails — MISSED until build i** (built on the card, not in the camera) · Fix/remove
split ✓ · press-and-hold sheet ✓ · duplicate recognition ✓ (AI looks) · **camera Cancel —
MISSED until build i** (deferred without agreement).

## Needs Tanya

- [ ] Labels — *Log item* / *Find item* / *My items* (Ravi, 2026-09-14). Devin and Margaret
  objected that these aren't her words; Tanya can reverse (three strings).
- [ ] S1 — header + footer (built) vs footer only. Confirm or reverse.
- [ ] Palette — pick Linen / Slate / High contrast / Dusk from the *ReCall Board Preview*
  artifact; then decide whether the Look picker stays in Settings.
- [ ] Firebase console: tighten rules by `household`; composite index (kind, itemId, at)
  so earlier photos can use `limit()`.

## Multi-user — reset 2026-09-19; plan and 16 screens ready for rulings

- [ ] **Ravi: the six rulings** at the end of `06_Handoffs/design/PLAN_2026-09-19_multi-user.md`
  (words *Can see / Can help*; *added by* on by default; two ReCalls + guard on Log; *Give*;
  phase order; any screen changes) — screens: `design/mockups/MU1_a_people.png`, `MU1_b_peter.png`,
  `MU2_a_card.png`, `MU2_b_roles.png`.
- [x] Phase 1 built (2026-09-19): model, listeners, legacy adoption, auth upgrade, rules,
  functions, rig permission table + role audit (16/16). Build `20260919a` on the Mac, not pushed.
- [ ] **Deploy `20260919a`** — nothing visible; on first open it adopts your docs. Then Settings →
  Account should read *Legacy docs left: 0* and show your ID.
- [ ] **Firebase console steps** (`04_Engineering/firebase/README.md`): Blaze + budget alert; Apple
  and Google sign-in; deploy indexes and functions; after *Legacy docs left: 0*, deploy the rules;
  then drop the legacy clauses and deploy rules again.
- [ ] Phase 2 (6 d): People, invite, join, guest views. Phase 3 (3.5 d): Shared with, Only me,
  Give. Phase 4 (1.5 d): status line.
- [ ] Tanya: a lawyer's read of the sharing/consent model before a second family (reset note §2).
- [ ] Firebase: Blaze billing for functions; Apple Sign-In configuration (the slow part).

## (superseded) Multi-user — SUSPENDED 2026-09-15

- [ ] **Ravi: run the use-case redefinition in a separate session** — paste
  `06_Handoffs/PROMPT_2026-09-15_multi-user-redefinition.md`. Until then nothing from
  `PLAN_2026-09-14_multi-user.md` (stages 0–4, the six splits, stage 0's hamburger question)
  is decided or built. Kept from that work: private = per person, not per device.
- [ ] On that session's agenda too: native wrapper (camera permission, remote install);
  *put it back* (the derived *Usually on* row was parked); the location hierarchy
  (`parent` reserved on place docs — DECISIONS 2026-09-15); place photos as AI reference
  images (the prompt's "known places" block is not built yet).

## Next build (board first, then code)

- [ ] Robert's helper phone — *This phone is used by* setting, *Another?* after save, note
  field, routines editor. Designed in BOARD_2026-09-05 §2; Places (built 09-14) is its first piece.
- [ ] **Appointments** (Tanya, 2026-09-14: agreed) — right after the helper phone. Today-only
  line on her board + list in Settings on the helper phone; visible list, no reminders.
  Add to `01_Needs_and_Prioritization/ReCall_Feature_Prioritizer.html` (MVP, Performance).
- [ ] Priya's one-card status — *did anything happen today?* Designed in §2, not built.
- [ ] Household join code (after the two above).

## Board notes from the audit (not bugs; Tanya's call)

- [ ] Tile sheet: *Change the place* / *Rename* should focus the tapped field in Fix (Devin).
- [ ] Merge toast should say it merged: *Saved · Kitchen counter · your glasses* (Maya).
- [ ] After *Add photo*, slide the strip to the new photo (Priya).
- [ ] *EARLIER* eyebrow is the hardest text on the thing card (Margaret).

## Docs

- [ ] `RESEARCH_PLAN.md`: new events today — `photo_removed`, `photo_restored`, `capture`
  with `initiatedBy: 'add_another'`, `merge.soft`. Still describes event schema v2; v3 adds `merge`, `naming_failed`,
  `move_to_top`, `capture_leave`, `lookup_failed`, `capture.beforeName`. Update before
  the first export is analysed.
- [ ] `CLAUDE.md` "Current status" still says v0.2 is not deployed — it is (`20260905l`).
  Rewrite after the phone check.

## Done

- [x] 2026-09-15 — round 7 built and rig-audited (84/84); mockups → rulings → code.

- [x] 2026-09-05 — v0.2 board model built, deployed, three rounds of phone fixes.
- [x] 2026-09-05 — Footer side-by-side / floating icons; removed-row layout. Deployed.
- [x] 2026-09-05 — *Where is my…* live local matching. Deployed.

## Deploy commands (Mac)

```
cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall"
find .git -name "*.lock" -delete
git add -A && git commit -m "Round 8c: title band (C), Tidy as a button, Delete its earlier places; Round 8b: place picker in Edit, tidy-up, earlier count = places, alignment asserted; Round 8: thing card on things/places/sightings — title carries the place, fixed-size time + trash on the photo, earlier places switch, three-button bar, place everywhere; a move writes a sighting; round 7 + 7b + 7c: actions in a fixed bottom bar, Earlier photos live only with earlier photos; No place assigned label, pin on the place line, AM\/PM, real photo times, both cache stamps; when pill + Private on one line, one toast shape (private = per person, never 'this phone'); pin badge for no place yet; Text size & colours; Locations list with place photos + one-location screen; Where is it? in three views; 4 shots per Add photo; roll expands as one; multi-user plan suspended + redefinition prompt; docs" && git push origin main
```
