# Tech board, 2026-09-19 — the Drive model, as it will be built

Priyanka (Firebase) and Sam (data integrity). Premise settled (`BOARD_2026-09-19` §10); this
note is the plumbing.

## 1. Data model

A "ReCall" is not a document: it is **everything whose `owner` is one uid**. Nothing to
create, nothing to join. `recall_items` stays the data collection (kinds `item` · `snap` ·
`place`); four small collections join it. `household`, `visibility` and `owner = deviceId()` go.

| Doc | Fields that matter for access |
|---|---|
| `recall_items` kind `item` | `owner: uid` · `private: bool` (always present) · `roles: {uid: 'viewer'\|'editor'}` (per-thing shares) · `sharedWith: [uid…]` (= keys of `roles`, for the query) · `by: uid` (who logged it) · existing fields |
| kind `snap` | `itemId` · `owner: uid` (copy of the item's, for export/purge only — access comes from the item) · `by: uid` |
| kind `place` | `owner: uid` · name, photos, parent — **places belong to a ReCall**, never to a per-thing share |
| `recall_grants/{grantor}_{grantee}` | `grantor, grantee, role: 'viewer'\|'editor', createdAt, via: inviteCode` — the ReCall-level rule |
| `recall_invites/{code}` | `from: uid, role, createdAt, expiresAt, usedBy: uid\|null, usedAt` |
| `recall_users/{uid}` | `name, photo, providers[], lastOpenedAt, shareStatus: bool` — the People list reads names here |
| `recall_secrets/{uid}` | `aiKey` — no client read ever; functions only |

The doc id `{grantor}_{grantee}` is what lets rules "join": `exists()` on a computed path, no
query. **Private** = `private: true` *and* `roles == {}`; the rule refuses a private doc with
roles, so private cannot leak through a stale per-thing share. **Transfer** = item `owner` →
new uid, `roles[old] = 'editor'`, every snap's `owner` rewritten; place names travel as strings.

Indexes (three composites, all on `recall_items`): `(owner, private, kind)`,
`(sharedWith array-contains, kind)`, `(kind, itemId)` — the last already exists for snaps.

**Migration of Ravi's data** (one admin script, run after his phone upgrades so the uid is
final): every `household == 'default'` doc gets `owner: <Ravi uid>`; items also get
`private: visibility == 'private'`, `roles: {}`, `sharedWith: []`. Order: ship code that
writes the new fields → run the script → publish the new rules. Old rules stay live until
then, so a half-migrated store never locks him out.

## 2. Security rules

```
me()          = request.auth.uid
grantRole(o)  = exists(grants/$(o+'_'+me())) ? get(grants/$(o+'_'+me())).data.role : null
canRead(d)    = d.owner==me() || d.roles[me()] in ['viewer','editor']
                || (d.private==false && grantRole(d.owner)!=null)
canEdit(d)    = d.owner==me() || d.roles[me()]=='editor'
                || (d.private==false && grantRole(d.owner)=='editor')
consistent(d) = d.sharedWith.toSet()==d.roles.keys().toSet() && (!d.private || d.roles.size()==0)
item(s)       = get(recall_items/$(s.itemId)).data          // a snap borrows its item's access
editorKeys    = [name, aliases, location, history, photo, thumb, thumbV, restingOn,
                 description, needsPlace, lastSeenAt, updatedAt, logId, photoCount, order, naming]

match recall_items/{id}
  read:   kind=='snap' ? canRead(item(resource)) : canRead(resource)
  create: kind=='snap' ? canEdit(item(new)) && new.by==me()
                       : (new.owner==me() || grantRole(new.owner)=='editor') && consistent(new) && new.by==me()
  update: (resource.owner==me() && new.owner==me() && consistent(new))            // owner: anything but transfer
       || (canEdit(resource) && changedKeys().hasOnly(editorKeys))                // editor: never deleted/roles/private/owner
       || (kind=='snap' && canEdit(item(resource)) && changedKeys().hasOnly([deleted, deletedAt]))  // tidy
  delete: resource.owner==me() || (kind=='snap' && item(resource).owner==me())
match recall_grants/{id}   read: grantor==me() || grantee==me();  update/delete: grantor==me(), only `role`;  create: false
match recall_invites/{c}   read, write: false                                     // functions only
match recall_users/{u}     read: signed in;  write: u==me()
match recall_secrets/{u}   read, write: false
```

A query's rule is evaluated once, with `owner`, `private` and `itemId` bound by the query's
equality filters — so `exists`/`get` cost **one read per query**, not per document, and no
grant expansion is denormalised anywhere. A write costs one extra read (the grant or the
parent item). Transfer changes `owner`, which no client rule allows: Admin SDK only.

What the client must keep consistent: `sharedWith` whenever `roles` changes, `roles: {}` +
`sharedWith: []` when going private, `by` on every create. The rule refuses anything
inconsistent, so drift is impossible rather than unlikely.

## 3. Identity

Anonymous stays the day-one path. **Upgrade in place**: `linkWithCredential(currentUser,
GoogleAuthProvider | OAuthProvider('apple.com'))`, via `linkWithRedirect` on iOS Safari
(popups are unreliable in a PWA). The uid does not change, so no doc is touched. Triggers:
*Invite someone…*, *Use ReCall on another phone*, accepting an invite.

**The second-device trap.** An iPad installed before upgrading gets a fresh anonymous uid and
an empty ReCall; signing in there later fails `link` with `credential-already-in-use`, she
falls back to `signInWithCredential`, and the iPad's anonymous uid is abandoned with whatever
it logged. Mitigations: the first screen offers *I already use ReCall on another phone → Sign
in* (no anonymous session is made), and a `claimAnonymous` callable takes the abandoned uid's
ID token as proof and rewrites `owner`/`by` for the rare case where things were logged first.

**Invite link.** `https://<pages>/#/join/<code>`; code = 128 random bits, base64url (22
chars) = the doc id; `expiresAt = +7 days`; single use. The client never touches invites.
Callable `acceptInvite({code})`: caller must be signed in **non-anonymously**; a transaction
reads the invite, checks unexpired, unused, `from != me`; writes `recall_grants/{from}_{me}`,
marks the invite used, upserts `recall_users/{me}` from the token. `createInvite({role})` and
`revokeInvite` are callables too; People shows pending links with *Cancel*.

≤ 3 taps: the link opens a card *Margaret shared her ReCall with you* with one button
*Continue with Apple / Google* (1) → provider sheet (2) → redirect returns with the code kept
in `sessionStorage`, the callable runs, the grid appears with her things tagged *Margaret's*.
Sign-in after the link, never before, so a stale link fails on a clear card.

## 4. AI key

Callable `ai({ownerUid, itemId?, request})`: checks the caller may edit under that owner
(owner, grant editor, or thing editor via `itemId`), reads `recall_secrets/{ownerUid}.aiKey`,
calls the provider, returns the text. The key leaves the phone once (Settings → `setAiKey`).
Billing follows the owner because the thing is hers even when Robert photographs it. Blaze is
required (outbound network). Cost: the functions free tier covers ~2M calls/month, a few
hundred ms each — under $1/month for a family; the provider bill stays the owner's. The rig
keeps the direct-provider path behind a flag so `audit.js` can still stub the API.

## 5. The "mine and shared" query

`watchAll` becomes four listener shapes on one merged map keyed by id:

| # | Query on `recall_items` | Rule branch | Count |
|---|---|---|---|
| L0 | `recall_grants where grantee == me` | grantee | 1 |
| L1 | `owner == me, kind in [item, place]` | owner (includes private) | 1 |
| L2 | `sharedWith array-contains me, kind in [item, place]` | per-thing role | 1 |
| L3ₙ | per grant in L0: `owner == g.grantor, private == false, kind in [item, place]` | grant | one per grant |

Private stays correct without client filtering: private things are only ever in L1; L2 cannot
hold them (`consistent()` empties `roles`); L3 excludes them by filter, and the rule rejects
the query without it. A thing shared both ways merges by id; role = max(thing, grant).
Listeners = 3 + grants, typically 3–5; L3ₙ start and stop with L0, so a revoke empties the
guest's grid live. `visibleHere()` goes; `loadSnaps` is unchanged (rules do the item lookup).
Every doc is tagged in memory with `myRole` for the screens.

## 6. What the rig needs

`stubs/firestore.js`: `getDoc`, `setDoc`, `writeBatch`, `runTransaction`, `arrayUnion/Remove`,
`where` op `array-contains` (multi-clause `where` already works); a **permission table** — §2
ported to JS, run on every read/query/write with the current uid, throwing `permission-denied`
like the SDK (the point: the audit proves the rules, not the UI). Store synced across pages by
`BroadcastChannel`, so two Playwright pages are **two phones over one store**. `stubs/fbauth.js`
gains `__rig.auth.as(uid, {anonymous})`, `linkWithCredential` (failing `credential-already-in-use`
when bound), redirect result. `stubs/fbfunctions.js`: fake `httpsCallable` running
`createInvite/acceptInvite/setGrant/transfer/ai/claimAnonymous` against the same store.

Audit matrix, one row per action, run as each column with expected allow/deny and a screen
assertion:

| Action | stranger | grant viewer | grant editor | thing viewer | thing editor | owner |
|---|---|---|---|---|---|---|
| see thing / snaps / search | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| see a private thing | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| add photo / move / rename | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| remove a photo (tidy) | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| remove thing / restore | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| share, change role, private | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| transfer | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| see the owner's places | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |

Plus flows: invite reused, expired, self-accepted; revoke empties the grid live; private
toggle under a grant; transfer (old owner still edits, snaps follow); anonymous upgrade keeps
every doc; the second-device trap.

## 7. Effort and splits

| Phase | Days | Notes |
|---|---|---|
| 1 Model, rules, migration, identity | 7 | rules + emulator tests 2 · stub/permission table 1.5 · db.js/watchAll 1.5 · migration 0.5 · sign-in (Apple config is the slow part) 1.5 |
| 2 Invite, People, guest views | 6 | functions + invites 2 · People 1.5 · guest title/footer/tags 1.5 · audit matrix 1 |
| 3 Per-thing sheet, transfer | 3.5 | sheet 2 · transfer callable + audit 1.5 |
| 4 Status line | 1.5 | `lastOpenedAt`/counts on `recall_users`, gated by `shareStatus` |

Splits:

1. **Roles map alone vs map + `sharedWith` array.** Priyanka: duplication; query `roles.<uid>`.
   Sam: map-key queries need a listener per role value and are hard to prove in rules; an
   array checked by `consistent()` cannot drift. **Rec: both, rule-checked.**
2. **Snap access by `get(item)` vs copying `private/roles` onto snaps.** Priyanka: copies save
   a read per snap write. Sam: copies must be rewritten on every share/private/transfer — the
   classic leak. **Rec: `get(item)`; revisit on cost.**
3. **Transfer as client batch vs callable.** Priyanka: a batch under rules works offline. Sam:
   N snaps plus the roles change must be atomic, and rules cannot express "old owner becomes
   editor". **Rec: callable.**
4. **Grants: all mutations via callables vs create-only.** Sam: one path, one audit. Priyanka:
   an owner's role change/remove is a safe direct write. **Rec: create via callable;
   update/delete by the grantor under rules.**
5. **Migration lazy in-app vs admin script.** Priyanka: no Tanya step. Sam: lazy means rules
   accept two shapes for a release; script + rules flip is one clean cut. **Rec: script.**
6. **`claimAnonymous` now vs never-anonymous-on-second-device.** Priyanka: people will hit it.
   Sam: a uid rewrite doubles the audit. **Rec: the *Sign in* choice first; claim in Phase 3.**
7. **AI key per owner vs one project key with quotas.** Priyanka: shorter remote setup. Sam:
   then Tanya pays for every family. **Rec: per owner now.**

---

**Summary.** A ReCall is "every doc whose `owner` is me"; no ReCall document. Per-thing
`roles` + `sharedWith`, `private` as a required boolean, ReCall grants as one doc per
(grantor, grantee) that rules resolve with `exists()` — no denormalised expansion. Four
listener shapes merge into one grid; private lives only in the owner's listener. Invites,
grants, transfer and AI go through callables; everything else is direct writes under rules
the rig re-implements as a permission table. Eighteen days across four phases.
