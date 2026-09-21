# Firebase — multi-user Phase 1 (2026-09-19)

**Console account: tangadi.biz@gmail.com** (project `recall-d9886`). `firebase login` must use this account.

What is here: `firestore.rules` (the roles model; mirrors `recall-app/rig/stubs/firestore.js`),
`firestore.indexes.json` (four composites), `functions/` (createInvite · acceptInvite ·
transfer · ai · setAiKey). Nothing is deployed until the steps below.

## Steps for Ravi / Tanya (console + terminal, ~30 min once)

1. **Blaze billing** on project `recall-d9886` with a $10/month budget alert — functions need it.
2. **Apple Sign-In**: Apple Developer → Identifiers → Services ID for `recall-d9886.firebaseapp.com`;
   Firebase console → Authentication → Sign-in method → Apple (paste Services ID, Team ID, Key
   ID, private key). Google: same page → Google → enable. (This is the slow part of Phase 1.)
3. In this folder: `npm i -g firebase-tools && firebase login && firebase use recall-d9886`
   `cd functions && npm i && cd ..`
4. Deploy indexes first: `firebase deploy --only firestore:indexes` (wait for "ready" in the console).
5. Deploy functions: `firebase deploy --only functions`.
6. **Open the app on your phone once** on build ≥ `20260919a` — it adopts your existing docs
   (they get `owner = your uid`). Settings → Version shows *Legacy docs left: 0* when done.
7. Then, and only then: `firebase deploy --only firestore:rules`. Until step 7 the old rules are
   live and nothing changes for you.
8. After the rules are live, remove the two `legacy(...)` clauses in `firestore.rules` and
   deploy rules once more.

Phase 2 (People, invite link) needs steps 1–5 done; Phase 1 on the phone needs only step 6.
