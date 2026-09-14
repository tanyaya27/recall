# Technical board — from one anonymous vault to a multi-role household

**Convened:** Sam (architect, leads), Priyanka (engineer). **Date:** 2026-09-14.
**Question:** Margaret's phone (no login, ever), Robert's phone (caregiver, same house), Priya's phone (remote, other city), with roles and permissions; rules that stop being wide open; the AI key off the device.

**Today:** `lib/db.js` stamps `household: 'default'` on every doc in `recall_items` (kinds item | snap | routine | check | place) and every `recall_events` row; photos and thumbs are inline base64; `firebase.js` signs in anonymously; `engine.js` reads the key from localStorage; rules are `request.auth != null`. Role is a localStorage string nobody sets.

---

## 1. Data model

Sam: D7's `household` field was the promise that this day would not need a migration, and it mostly holds. We add three collections and one field, and do **not** split `recall_items` by kind — rules can discriminate on `resource.data.kind`, and a split has no user-visible payoff.

```text
households/{hid}
  name, createdAt, createdBy (uid), aiProvider: 'anthropic', aiEnabled: true
  members: { [uid]: { role: 'person' | 'carer' | 'remote' | 'owner', name, joinedAt } }
  ai:     { keyRef: 'secret:recall-anthropic' }        # never the key itself

households/{hid}/invites/{code}      # 6 chars, upper, no 0/O/1/I
  role, createdBy, expiresAt (24 h), usedBy: null | uid, usedAt

users/{uid}                          # one per Firebase user, any auth type
  households: [hid], displayName, deviceRole (client-set label only)
  devices: { [deviceId]: { ua, lastSeenAt, buildStamp } }

recall_items/{id}    unchanged, plus `by: uid` (was 'self')
recall_events/{id}   unchanged, plus `uid`; `role` now comes from members[uid].role
```

`members` is a map on the household doc, not a subcollection, because rules read it on **every** access and one `get()` per request is the price we can afford. Owner is the account that created the household — Ravi's phone, for now.

**Roles:** `person` (Margaret — read all, write item/snap/place, no delete-for-good, no invites, no export), `carer` (Robert — plus routines, purge, invites), `remote` (Priya — as person, no purge), `owner` (plus export and AI settings). Rules enforce; UI hides.

**Migration for Ravi's phone.** Sam: create `hh_default` in the console; a one-shot function `migrateDefault` rewrites `household: 'default'` → `hh_default` across both collections (batched 400 per commit) and creates `users/{ravi-anon-uid}` as `owner`. The anonymous uid needs one new line in Settings → Version. Order matters: rules deploy **after** the migration and after the new build is on his phone, or the phone goes blank mid-migration. Priyanka: agreed, plus the app treats a missing `users/{uid}` doc as "not joined" and shows the join screen, so a bad migration is visible, not silent.

---

## 2. Auth

Margaret's phone stays **anonymous**, bound by a join code. DECISIONS 09-05 already rejected a username screen for her.

**Join-code binding, safely.** The device signs in anonymously (it already does), then calls a callable function `joinHousehold(code)`. Running as admin, it checks the invite is unexpired and unused, then in one transaction writes `members[uid] = {role}`, `usedBy` on the invite, and `users/{uid}.households`. The client never writes `members`; rules forbid it. Codes are single-use, 24 h, six characters from a 32-symbol alphabet (10^9 space) with a 5-attempt-per-uid limit in the function. Robert reads it off his phone and types it on hers.

**Split 1 — Robert: anonymous plus code, or real auth?**
Sam: Robert and Priya get **Google sign-in** (email-link fallback). An anonymous carer who clears Safari's site data loses his identity, role and event history, and re-joining needs someone with a live code — Priya, in another city, has nobody to hand her one.
Priyanka: anonymous-plus-code for **everyone** in stage 2. The join flow must exist for Margaret anyway; the same path ships the whole household with one screen and zero OAuth setup — `signInWithRedirect` on an iOS home-screen web app loses the result on return, documented, still true. Upgrade later with `linkWithCredential`; the uid does not change.
**Board position:** Priyanka's sequence, Sam's end state. Anonymous for all in stage 2; Google link for carer/remote in stage 3; the proxy checks `members[uid]`, not the provider, so nothing else moves.

---

## 3. Firestore rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function hh(hid) { return get(/databases/$(db)/documents/households/$(hid)).data; }
    function member(hid) { return request.auth != null && request.auth.uid in hh(hid).members; }
    function role(hid) { return hh(hid).members[request.auth.uid].role; }
    function isCarer(hid) { return role(hid) in ['carer', 'owner']; }

    match /households/{hid} {
      allow read: if member(hid);
      allow create: if request.auth != null
        && request.resource.data.members[request.auth.uid].role == 'owner'
        && request.resource.data.members.size() == 1;
      // members map changes only via the joinHousehold function (admin SDK).
      allow update: if member(hid) && role(hid) == 'owner'
        && request.resource.data.members == resource.data.members;
      match /invites/{code} {
        allow read: if false;                       // function only
        allow create: if isCarer(hid) && request.resource.data.usedBy == null;
      }
    }

    match /users/{uid} {
      allow read, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.households == resource.data.households;
      allow create: if request.auth.uid == uid && request.resource.data.households.size() == 0;
    }

    match /recall_items/{id} {
      allow read: if member(resource.data.household);
      allow create: if member(request.resource.data.household)
        && request.resource.data.by == request.auth.uid
        && (request.resource.data.kind in ['item','snap','place']
            || isCarer(request.resource.data.household));  // routine, check
      allow update: if member(resource.data.household)
        && request.resource.data.household == resource.data.household;
      allow delete: if isCarer(resource.data.household);   // purge, prune, removePlace
    }

    match /recall_events/{id} {
      allow create: if member(request.resource.data.household)
        && request.resource.data.uid == request.auth.uid;
      allow read: if role(resource.data.household) == 'owner';   // export
      allow update, delete: if false;
    }
  }
}
```

Consequences for the code. `loadSnaps()` prunes with `deleteDoc` on **every** phone; under these rules it fails on Margaret's — guard it by role (Priyanka: one line) or move it to a scheduled function (Sam). `removeSnap`'s soft delete is an update, still allowed, so Undo works on her phone. Every query — `watchAll`, `loadSnaps`, `purgeItem`, `exportEvents` — must add `where('household', '==', hid)` or the rules reject it outright; that needs the `(household, kind)` index already on Tanya's console list, plus `(household, kind, itemId)`.

---

## 4. The AI key off the device

A callable function `ai` (2nd gen, us-west1, Node 20) holds the Anthropic key in Secret Manager, verifies the ID token (callables do this for free), checks `members[uid]`, and forwards `visionJSON` / `textJSON` / `visionJSONMulti` bodies unchanged. Client side it is `src/ai/providers/proxy.js` — one file, one map entry, the convention CLAUDE.md wants. `engine.ready` becomes "the household has `ai.keyRef`", not "this phone has a key".

Cost: Blaze plan required. At 200 calls/day with ~1.2 MB payloads: invocations free, egress ≈ $0.80/month, compute under $1. Cold start is 1–3 s; `minInstances: 1` removes it for about $6/month — buy it, because D3 already established that a six-second wait reads as broken.

**CORS and "Load failed".** The LESSONS history was Anthropic's geo-edge rejecting the preflight without CORS headers. Behind the proxy the phone never talks to Anthropic; the function runs in Oregon, so a VPN exiting abroad stops killing naming. That is a stronger argument than the key itself. `probeReach` points at the function; STEP 1 stays meaningful.

**Split 2 — proxy now or later?**
Priyanka: **stage 1**, parallel with rules. Priya cannot be set up remotely without it; the per-device key blocks the premise of this board. Two days.
Sam: **stage 3.** Blaze billing on a student's card, Secret Manager, a deploy pipeline that does not exist, and a rig that cannot exercise a function — three new failure surfaces before rules are even tightened. Interim: the key in `households/{hid}.ai.key`, readable by rules for carers only — except Margaret's phone names photos, so `person` would need to read it and the rules protect nothing. Sam withdraws the interim, not the objection.
**Board position:** stage 1. It is the one piece that must be phone-tested before anything depends on it.

---

## 5. Photos

**Split 3 — Storage now or later?**
Sam: **now.** Three phones hold `onSnapshot` on `recall_items`; every changed item doc ships its 900-px inline photo to every phone. Move `photo` to `households/{hid}/photos/{snapId}.jpg` with Storage rules on a custom claim set by `joinHousehold`; keep the 600-px thumb inline.
Priyanka: **later.** Storage adds a second auth surface (claims need `getIdToken(true)` after join — a known bite), a bucket CORS config, a migration for every existing snap, and offline gets worse: the Firestore cache serves a photo offline, Storage does not. Firestore diffs per changed doc, not per touch of any doc, so the real waste is the cover photo riding on the item doc. Move it onto the cover snap (`coverSnapId`) so the board listener carries thumbs only.
**Board position:** `coverSnapId` in stage 2; Storage at stage 4 or when a household passes ~150 items, whichever first. Sam's objection stands on record.

**Realtime and offline.** Each phone keeps its persistent cache; Robert's writes reach Margaret's phone within a second. Last-write-wins stays (architecture memo §4). `renamePlace` reads-then-writes across items and can interleave across two phones — wrap it in `runTransaction`; leave `moveToTop` (worst case a tile lands second, not lost).

---

## 6. Event log and export

Every event gains `uid` and the real `role` from the household doc; `deviceId` stays as the device axis. Schema bumps to 4. Export becomes owner-only per household, joins `displayName` client-side ("Robert · carer · phone-a1b2"), and hashes `uid` to a per-household token — a Firebase uid in a research CSV is a linkable identifier.

---

## 7. Staged plan

| Stage | Work | Days | Parallel? |
|---|---|---|---|
| **1. Ground** | Rules + `households`/`users` model + `where(household)` on every query + index (Sam). AI proxy function + `proxy.js` provider + Settings "AI comes from the household" (Priyanka). Migration function. | 4 | Two agents; strictly before 2. Rules deploy last. |
| **2. Join** | `joinHousehold` function; join screen; invite screen on carer phone; `coverSnapId`; prune guard; `linkWithCredential` scaffold. | 4 | Join + invite (agent A) ‖ `coverSnapId` migration (agent B). |
| **3. Roles in the UI** | *This phone is used by* becomes the role from `members`; carer screens (routines, places, purge) hidden for `person`; Priya's one-card status; Google link for carer/remote. | 5 | Per-role UI (agent A) ‖ Google link (agent B). Needs 2. |
| **4. Storage** | Photos to Storage, custom claims, second migration. | 4 | After 3, only if triggered. |

**Test plan per stage.** The rig's in-memory Firestore stub must grow: `where` chains with `in` plus equality on two fields; `getDoc` for the household lookup; a small `allow(uid, op, doc)` table so a `person` uid calling `deleteDoc` throws `permission-denied` like the SDK; a fake `httpsCallable` that records calls and returns canned JSON; and two "phones" over one store with listener fan-out, so stage 2 can show a save on phone A landing on phone B. Stage 1 also gets the Rules emulator with `@firebase/rules-unit-testing` — the sketch above is only real once a test proves `person` cannot delete and a non-member cannot read. Stage 3 runs the 67-check audit per role. One stage-1 test cannot be faked: the proxy from Ravi's phone on his usual VPN.

**Risks.** Blaze billing on a student account (alert at $10). A query nobody scoped — the app goes blank, not wrong; the boot line must name `permission-denied`. `getIdToken(true)` forgotten after join — every stage-2 bug will look like this. Migration order. Anonymous identity loss on Robert's phone before stage 3.

---

## Splits for Ravi/Tanya

1. **Robert and Priya: anonymous-plus-code first, Google link later (Priyanka), or real auth from the start (Sam)?** Board leans Priyanka.
2. **Proxy in stage 1 (Priyanka) or stage 3 (Sam, withdrawn)?** Board: stage 1. Requires Blaze on Tanya's card.
3. **Storage now (Sam) or `coverSnapId` now, Storage at 150 items (Priyanka)?** Board leans Priyanka; Sam's egress arithmetic is on record.
4. Prune snaps: scheduled function (Sam) or carer-phone guard (Priyanka).

## Recommendation

Do stage 1 as two parallel agents this week — rules and model on one, proxy on the other — and deploy the rules only after Ravi's phone runs the migrated build and names a photo through the proxy. Stage 2 the following week gives the three-phone household with one code screen. Real accounts and Storage wait for evidence: a lost carer identity or a 150-item board. Nineteen days of work in total, thirteen before Priya's phone is real.
