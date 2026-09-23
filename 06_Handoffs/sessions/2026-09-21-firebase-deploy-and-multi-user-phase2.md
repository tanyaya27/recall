# Session 2026-09-19 → 09-23 — Firebase deploy, multi-user Phase 2, Google sign-in

## What happened
- **Firebase deployed (09-21)** from Ravi's Mac. The console account is **tangadi.biz@gmail.com**
  (NOT tanya.angadi@gmail.com). Blaze via a Google Cloud free trial ($300, ends 2026-12-21).
  Google sign-in enabled (public name *ReCall*). Indexes, rules (with legacy clauses), five
  Cloud Functions on Node 22 (Node 20 is decommissioned 2026-10-30; a runtime-only change
  needs a source edit + `--force`). Artifact Registry had to be enabled by hand (the CLI's
  enable call kept 503-ing). Old Firebase CLI on the Mac produced Google's "400 malformed"
  login page; `sudo npm install -g firebase-tools` fixed it.
- **Legacy adoption ran on Dad's phone**, so Dad owns every pre-09-19 doc; Ravi's phone
  could read (legacy clause) but not write. Ravi chose to fix it through the app (Phase 2's
  invite) rather than a hand-made console grant.
- **Phase 2 built and LIVE (`20260921a`)**: People, invite link, join page, helper's view by
  role, owner tag, added-by on stamps, Shared with me + Leave, switcher, removed card, Account
  card rewritten. The real Firestore rules engine (emulator) caught two list-query refusals the
  rig could not; harness in `04_Engineering/firebase/rules-test/`.
- **Google sign-in did nothing on Dad's iPhone**: Firebase's redirect needs cross-site storage,
  blocked by Safari 16.1+ on GitHub Pages. Replaced with our own same-origin OpenID redirect
  (`20260921b`, LIVE). Needed the OAuth web client to list origin `https://tanyaya27.github.io`
  and redirect URI `https://tanyaya27.github.io/recall/` (Ravi added both; first try gave
  `redirect_uri_mismatch` until then). **Dad's phone is now signed in as
  ravi.bizlogix@gmail.com** (Dad's Google account; name shows as "Ravi Angadi").
- **Not done:** the invite test (Dad → Can help → Ravi's phone). Ravi set it aside ("Ignore")
  and moved on to the home-screen rethink.

## Ravi's feedback carried forward
- The home screen "is not a great opening screen" — wants a complete UX + artistic rethink,
  six mockups (next session).
- "It is very difficult to know the ReCall perspective. Is it my ReCall or the ReCall of
  someone I am a guest for or a full editor on? No way to know." — the day line on one's own
  grid gives no owner, and a helper's title (*X's ReCall ▾* + role in small grey) is too quiet.
