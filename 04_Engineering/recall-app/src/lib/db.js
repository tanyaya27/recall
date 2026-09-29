// Data layer, v0.1.
//
// ONE Firestore collection for household data (`recall_items`) with a `kind` field,
// plus `recall_events` for the silent research log. Why one collection: the
// published Firestore rules cover exactly these two names, and v0.1 must be
// testable without a console change. Split into real collections at MVP.
//
//   kind: 'item'    — a thing. latest photo inline, pinnedOrder = fixed slot (0-7) or null
//   kind: 'snap'    — one historical photo of an item (itemId, photo, thumb, location, at)
//   kind: 'routine' — something the app asks for at a fixed time of day
//   kind: 'check'   — one photo taken in answer to a routine on a given day
//
// Shared household vault: any anonymous user of this Firebase project can read/write.
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDocs, where, getDoc, setDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { me } from './auth.js';
import { call } from './functions.js';
import { dayKey, timeOfDay } from './format.js';
import { THUMB_V } from './img.js';
import { hasSecret } from './sensitive.js';

const col = collection(db, 'recall_items');
const eventsCol = collection(db, 'recall_events');

// Multi-user Phase 1 (2026-09-19, PLAN_2026-09-19_multi-user.md): every doc carries
//   owner      — the uid whose ReCall it is in ("a ReCall is every doc whose owner is me")
//   by         — the uid that wrote it
// and every THING also carries
//   private    — boolean, always present; true = shared with no one (rules refuse roles on it)
//   roles      — { uid: 'viewer' | 'editor' } per-thing shares (Can see / Can help)
//   sharedWith — keys of roles, for the array-contains query
// A whole-ReCall share is one doc in `recall_grants/{grantor}_{grantee}`; the rules resolve it
// with exists(), nothing is copied. `household` is legacy (pre-09-19) and no longer written.
export const HOUSEHOLD = 'default'; // read-only legacy marker; see adoptLegacy()
const grantsCol = collection(db, 'recall_grants');
const usersCol = collection(db, 'recall_users');
const invitesCol = collection(db, 'recall_invites');
export const ROLE_WORDS = { viewer: 'Can see', editor: 'Can help' };
// The fields every new thing gets (Phase 1). `owner` defaults to me; a helper logging into
// Margaret's ReCall passes her uid.
export function ownership(owner = me()) { return { owner, by: me(), private: false, roles: {}, sharedWith: [] }; }

export const MAX_PINNED = 8;

// Board decision 2026-09-05 (D5): "earlier photos" shows at most SNAPS_SHOW, keeps at most
// SNAPS_KEEP per thing, and prunes the rest when they are loaded. Re-snaps are the dominant
// write in the new model and were unbounded.
export const SNAPS_SHOW = 10;
export const SNAPS_KEEP = 30;

// Board decision 2026-09-05 (D6): the board is in first-photographed order and never
// rearranges itself. `order` is the sort key; "Move to the top" is the only pin. Legacy
// v0.1 docs carry `pinnedOrder` (0-7) or nothing; both fold into the same key.
export function boardKey(it) {
  if (it.order != null) return it.order;
  if (it.pinnedOrder != null) return it.pinnedOrder;
  return it.createdAt || 0;
}
export function boardOrder(items) {
  return [...items].sort((a, b) => boardKey(a) - boardKey(b));
}
export async function moveToTop(item, items) {
  const min = Math.min(...items.map(boardKey), Date.now());
  await updateItem(item.id, { order: min - 1, pinnedOrder: null });
}

// Rule 6: a new photo of a thing that is already on the board is a new photo of it, not a
// new thing. Never called silently: the photo card shows the match and offers "not your
// glasses?" before anything merges.
//
// 2026-09-14 (Ravi: a renamed item was duplicated on the next photo): the match was an
// exact string compare between the AI's name this time and the stored name. Now:
//   1. exact — name or any alias (every name the AI or a person has given the thing);
//   2. head noun — the AI's name and exactly ONE item's name/alias share their last word
//      ("glasses" ↔ "reading glasses"); a wrong soft match costs one tap on the card.
// Names are normalised: lowercase, "your/the/my" dropped, trailing s dropped.
import { normName } from './names.js';
import { setGraph, graph, openEdge, destOf, wouldLoop, contentsOf, placeWouldLoop } from './graph.js';
export { normName };
function namesOf(it) { return [it.name, ...(it.aliases || [])].map(normName).filter(Boolean); }
export function findByName(items, name, { strict = false } = {}) {
  const n = normName(name);
  if (!n) return null;
  const live = items.filter((it) => !it.deleted);
  const exact = live.find((it) => namesOf(it).includes(n));
  if (exact || strict) return exact || null;
  const head = n.split(' ').pop();
  if (head.length >= 3) {
    const soft = live.filter((it) => namesOf(it).some((x) => x.split(' ').pop() === head));
    if (soft.length === 1) return soft[0];
  }
  //   3. any shared meaningful word ("sparkling soda" ↔ "soda can") with exactly one item.
  //      Colours and qualifiers don't count — a "black folder" is not a "black hat".
  const words = n.split(' ').filter((w) => w.length >= 3 && !QUALIFIER.has(w));
  if (words.length) {
    const loose = live.filter((it) => namesOf(it).some((x) => x.split(' ').some((t) => words.includes(t))));
    if (loose.length === 1) return loose[0];
  }
  return null;
}
const QUALIFIER = new Set(['black', 'white', 'red', 'blue', 'green', 'grey', 'gray', 'brown', 'pink', 'yellow', 'orange', 'purple', 'silver', 'gold',
  'small', 'big', 'large', 'little', 'old', 'new', 'reading', 'pair', 'set', 'bottle', 'can', 'box', 'bag', 'cup', 'tin', 'pack', 'piece']);

// What the photo card asks. The AI's own verdict ("sameAs", 2026-09-14 — Ravi: two logs of
// one can of soda) comes first: it saw the photo and the list; name matching is the fallback
// for when it names the thing but forgets to say so. Alternatives get a turn too.
// Bug #10 (walk 09-27): a "1978 diary" matched "Yearbook 1978" on the shared word, and saving MOVED the
// yearbook. A match that can move something must be exact: the AI's own sameAs, or the very same name or
// alias. A shared word is only a hint — it makes the thing a candidate for the visual check (tier 3).
export function findMatch(items, tag) {
  if (!tag) return null;
  const strict = { strict: true };
  return findByName(items, tag.sameAs, strict) || findByName(items, tag.name, strict)
    || (tag.alternatives || []).map((a) => findByName(items, a, strict)).find(Boolean) || null;
}

// ---------- live data ----------

// One listener; caller gets everything split by kind. Snap photos are heavy, so
// snaps are NOT included here — fetch them per item with loadSnaps().
export function watchAll(cb) {
  // Four listener shapes, merged by id (tech board 2026-09-19 §5):
  //   L1  owner == me                       — my ReCall, including private things
  //   L2  sharedWith array-contains me      — things shared with me one by one
  //   L0  grants where grantee == me        — whose ReCalls I am in, at what role
  //   L3ₙ owner == grantor && private==false — one per grant
  //   Lx  legacy docs with no owner (household == 'default') — until adoptLegacy() runs
  const uid = me();
  const parts = new Map(); // key -> docs[]
  const unsubs = new Map();
  let grants = [];          // ReCalls I am in (grantee == me)
  let people = [];          // people in MY ReCall (grantor == me) — Phase 2
  let invites = [];         // my open invitations (from == me, unused, unexpired) — Phase 2
  let grantsReady = false;  // the grants snapshot has arrived at least once (the removed card waits for it)
  const emit = () => {
    const seen = new Map();
    parts.forEach((docs, key) => docs.forEach((d) => { if (!seen.has(d.id)) seen.set(d.id, d); if (key.startsWith('g:')) seen.get(d.id).grantRole = grants.find((g) => g.grantor === d.owner)?.role || null; }));
    const out = { items: [], routines: [], checks: [], removed: [], places: [], edges: [], grants, people, invites, grantsReady };
    seen.forEach((data) => {
      if (data.kind === 'place') out.places.push(data);
      else if (data.kind === 'routine') out.routines.push(data);
      else if (data.kind === 'check') out.checks.push(data);
      else if (data.kind === 'edge') out.edges.push(data);
      else if (data.kind !== 'item') return;
      else if (data.deleted) out.removed.push(data);
      else out.items.push(data);
    });
    out.items.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
    out.removed.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    out.routines.sort((a, b) => (a.order || 0) - (b.order || 0));
    out.checks.sort((a, b) => (b.at || 0) - (a.at || 0));
    out.places.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    setGraph(out.items, out.edges, out.places); // the pure graph module reads the same snapshot (lib/graph.js)
    cb(out);
  };
  const listen = (key, q) => {
    if (unsubs.has(key)) return;
    unsubs.set(key, onSnapshot(q, (snap) => { parts.set(key, snap.docs.map((d) => ({ id: d.id, ...d.data() }))); emit(); }, (err) => console.error('watchAll', key, err)));
  };
  const KINDS = ['item', 'routine', 'check', 'place', 'edge'];
  listen('mine', query(col, where('owner', '==', uid), where('kind', 'in', KINDS)));
  listen('shared', query(col, where('sharedWith', 'array-contains', uid), where('kind', 'in', KINDS))); // the kind filter is what makes the rule provable for a list (real engine, 2026-09-21)
  listen('legacy', query(col, where('household', '==', HOUSEHOLD), where('kind', 'in', KINDS)));
  unsubs.set('people', onSnapshot(query(grantsCol, where('grantor', '==', uid)), (snap) => { people = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); emit(); }, (err) => console.error('watchAll people', err)));
  unsubs.set('invites', onSnapshot(query(invitesCol, where('from', '==', uid)), (snap) => { invites = snap.docs.map((d) => ({ id: d.id, code: d.id, ...d.data() })).filter((i) => !i.usedBy && i.expiresAt > Date.now()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); emit(); }, (err) => console.error('watchAll invites', err)));
  unsubs.set('grants', onSnapshot(query(grantsCol, where('grantee', '==', uid)), (snap) => {
    grants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    grantsReady = true;
    const want = new Set(grants.map((g) => 'g:' + g.grantor));
    [...unsubs.keys()].filter((k) => k.startsWith('g:') && !want.has(k)).forEach((k) => { unsubs.get(k)(); unsubs.delete(k); parts.delete(k); });
    grants.forEach((g) => listen('g:' + g.grantor, query(col, where('owner', '==', g.grantor), where('private', '==', false), where('kind', 'in', KINDS))));
    emit();
  }, (err) => console.error('watchAll grants', err)));
  return () => unsubs.forEach((u) => u());
}

// Legacy docs (before 2026-09-19) have `household: 'default'` and no `owner`. The only person
// who can see them is the one anonymous user of this project — Ravi — so the client adopts
// them on first load: owner = me, private from the old `visibility`. Bounded per call; runs
// until nothing is left. (Tech split 5 chose an admin script; with one user, lazy adoption
// is the same cut with no console step. The rules flip only after `legacyCount()` is 0.)
export async function adoptLegacy(limitN = 40) {
  const uid = me(); if (!uid) return 0;
  const snap = await getDocs(query(col, where('household', '==', HOUSEHOLD)));
  const todo = snap.docs.filter((d) => !d.data().owner).slice(0, limitN);
  for (const d of todo) {
    const data = d.data();
    const patch = { owner: uid, by: data.by && data.by !== 'self' ? data.by : uid };
    if (data.kind === 'item') Object.assign(patch, { private: data.visibility === 'private', roles: {}, sharedWith: [] });
    else if (data.kind !== 'snap') patch.private = false; // places/routines/checks: the per-grant listener filters on it
    await updateDoc(doc(col, d.id), patch);
  }
  return todo.length;
}
// 2026-09-21: docs adopted before this fix (Dad's phone) lack `private` on places, routines and
// checks, so a grant holder's listener (owner == X && private == false) never sees them. The
// owner's phone repairs its own docs as they arrive; nothing repeats (the write comes back
// with the flag set). Returns how many it patched.
// Ravi, 09-27: "Fix the pencil item so that it doesn't hold a cabinet!" Bug #8/#12 put his filing cabinet INSIDE his
// pencil. One repair, on the owner's phone: the cabinet's open edge to the pencil is closed and the cabinet goes back to
// "No place yet" (it waits under Not put away; Move it gives it its real place). Only that exact record — a thing whose
// name has "cabinet" in it, owned by this person, in the thing called "pencil". Nothing else is touched; the pencil's own
// place is left as it is. Safe to run again: once the edge is closed there is nothing to find. Returns what it fixed.
export async function repairPencilCabinet() {
  const g = graph(); const mine = me();
  if (!g.edges.length) return null; // the edges have not arrived yet: try again on the next snapshot
  const fixed = [];
  for (const e of g.open.values()) {
    if (!e || !e.to || e.to.t !== 'thing') continue;
    const from = g.byId.get(e.from); const to = g.byId.get(e.to.id);
    if (!from || !to || from.deleted || (from.owner || mine) !== mine) continue;
    if (normName(to.name) !== 'pencil' || !/cabinet/i.test(from.name || '')) continue;
    await changeLocation(from, '', 'chosen', null); // closes the open edge; no new one; location '' and needsPlace
    fixed.push(from.id);
  }
  if (fixed.length) logEvent('repair_pencil_cabinet', { n: fixed.length });
  return fixed;
}

export async function repairPrivateFlags(data) {
  const uid = me(); if (!uid) return 0;
  // fix 2026-09-29: the real rules' consistent() needs `sharedWith` + `roles` on any owner update, so this repair was
  // itself refused in production on every place (the rig's old stub allowed it). It now writes the pair too, and also
  // backfills the owner's places/routines/checks that lack it — so every later write to them (a photo, a rename) passes.
  const noPair = (d) => !(Array.isArray(d.sharedWith) && d.roles);
  const todo = [...(data.places || []), ...(data.routines || []), ...(data.checks || [])].filter((d) => d.owner === uid && (d.private === undefined || noPair(d)));
  for (const d of todo) {
    try { await updateDoc(doc(col, d.id), { ...(d.private === undefined ? { private: false } : {}), ...(noPair(d) ? { sharedWith: [], roles: {} } : {}) }); }
    catch (err) { console.error('repairPrivateFlags', d.id, err); } // one refused doc must not stop the rest (or the boot)
  }
  return todo.length;
}
export async function legacyCount() {
  const snap = await getDocs(query(col, where('household', '==', HOUSEHOLD)));
  return snap.docs.filter((d) => !d.data().owner).length;
}

// The People list reads names here; each person writes their own row on sign-in.
export async function upsertUser(user) {
  if (!user) return;
  await setDoc(doc(usersCol, user.uid), { name: user.displayName || null, photo: user.photoURL || null, anonymous: !!user.isAnonymous, lastOpenedAt: Date.now() }, { merge: true });
}
export async function readUser(uid) { const d = await getDoc(doc(usersCol, uid)); return d.exists() ? { id: uid, ...d.data() } : null; }

// ---------- people (multi-user Phase 2, 2026-09-21 — MU1·2–7, MU2·4–8) ----------
//
// Names come from recall_users, read once per uid per session and cached; `firstName` is
// what the screens show (Google gives "Margaret Hale"; the tiles say "Margaret's").
const userCache = new Map(); // uid -> { name, photo, anonymous } | null
const userSubs = new Set();
export function userOf(uid) { return uid ? userCache.get(uid) || null : null; }
export function firstName(uid) { const u = userOf(uid); const n = u && u.name ? String(u.name).trim().split(/\s+/)[0] : ''; return n || ''; }
export function watchNames(cb) { userSubs.add(cb); return () => userSubs.delete(cb); }
// Ask for names the screens will need; each uid is fetched once. Calls back when any arrive.
export function wantNames(uids) {
  const missing = [...new Set(uids.filter(Boolean))].filter((u) => !userCache.has(u));
  if (!missing.length) return;
  missing.forEach((u) => userCache.set(u, undefined)); // in flight
  Promise.all(missing.map((u) => readUser(u).then((d) => userCache.set(u, d), () => userCache.set(u, null))))
    .then(() => userSubs.forEach((cb) => cb()));
}
export function possessive(name) { return name ? `${name}’s` : ''; }

// The invite: createInvite (a callable — the client never writes recall_invites) → a link.
// The text is what the system share sheet sends; the page it opens is JoinScreen.
export function joinUrl(code) { return `${location.origin}${location.pathname}?j=${encodeURIComponent(code)}`; }
export async function createInvite(role, itemId = null) {
  const r = await call('createInvite', { role, itemId });
  return { code: r.code, expiresAt: r.expiresAt, url: joinUrl(r.code) };
}
export function inviteText(role, url, myName) {
  const who = myName || 'Someone';
  const verb = role === 'editor' ? 'help with' : 'see';
  return `${who} has invited you to ${verb} ${myName ? 'their' : 'a'} ReCall — the photos of where ${myName ? 'their' : 'the'} things are. Open this on your phone: ${url}\nIt works for 7 days.`;
}
// Whoever holds the link may read the invitation (the code is the secret); the join page
// needs the inviter's uid for the name and the role for its sentence.
export async function readInvite(code) {
  const d = await getDoc(doc(invitesCol, code));
  if (!d.exists()) return null;
  const inv = { code, ...d.data() };
  inv.expired = !!inv.usedBy || inv.expiresAt < Date.now();
  return inv;
}
export async function acceptInvite(code) { return call('acceptInvite', { code }); }
export async function cancelInvite(code) { await deleteDoc(doc(invitesCol, code)); }
// The owner's People screen: change a person's role, or remove them. A helper leaves a
// ReCall by deleting the same grant (rules: grantor or grantee may delete).
export async function setGrantRole(grant, role) { await updateDoc(doc(grantsCol, grant.id), { role }); }
export async function removeGrant(grant) { await deleteDoc(doc(grantsCol, grant.id)); }
export const ROLE_BLURB = { viewer: 'Sees your things and where they are. Cannot change anything.', editor: 'Can also add photos, move things and fix names.' };
// The board only shows items whose `kind` is item and that are not removed. Routines
// and checks are still read (they exist in test data) but the 09-05 board does not
// render them; they return with the helper's device.

// ---------- items ----------

// `restingOn` is what the photo actually showed the thing sitting on ("on a pair of black
// shorts"). `needsPlace` marks an item saved before anyone said which room — it is findable
// by photo but not by place, and is a queue for a caregiver to finish later.
// `naming: true` (D3) means the photo was saved before the AI named it. The name is
// patched in by nameItem(); if naming fails the flag is cleared and the thing stays
// unnamed — a legitimate state. Nothing on the board ever asks her to name it.
// A thing may have NO photo (MVP #10, 09-24): written down, not photographed. Then photo/thumb are
// null, there is no cover snap and photoCount is 0; the first photo added later becomes the cover.
// `private` (09-24): a thing that looks private starts private — only the owner may start one so
// (a helper's is refused by the rules' own logic: they could never see it again). `privateAuto`
// keeps the reason ReCall gave ("looks like passwords"); '' when she chose it herself.
export async function addItem({ name = '', location = '', description = '', photo = null, thumb = null, by = 'self', restingOn = '', naming = false, aliases = [], extras = [], owner = me(), placeSource = '', details = '', private: priv = false, privateAuto = '', dest = null, holds = undefined, asWhere = false }) {
  location = placeText(location, null);
  const now = Date.now();
  const logId = `log_${now}`;
  const keep = !!priv && owner === me();
  const ref = await addDoc(col, {
    kind: 'item', ...ownership(owner), ...(keep ? { private: true, privateAuto: privateAuto || '' } : {}), name, aliases, location, description, photo, thumb, thumbV: THUMB_V, restingOn,
    needsPlace: !location, naming, placeSource: location ? (placeSource || 'chosen') : '',
    order: now, pinnedOrder: null, createdAt: now, updatedAt: now, lastSeenAt: now, capturedBy: by,
    history: [{ location, at: now }], logId, photoCount: photo ? 1 + extras.length : 0, details: details || '', written: !photo,
    ...(holds === undefined ? {} : { holds: !!holds }),
    // REQUIREMENTS_2026-09-27 R6.1: a box made because it was named as WHERE something else goes (the camera's
    // outward chain) is not a chore to put away — it's marked so Not put away and the board can leave it alone.
    ...(asWhere ? { asWhere: true } : {}),
  });
  if (location) await recordMove({ id: ref.id, owner, private: keep }, location, placeSource || 'chosen', dest);
  if (!photo) return ref.id;
  // D3 (Ravi 09-28): the cover photo keeps its own caption — what it shows the thing resting on ("on the orange carpet").
  await addDoc(col, { kind: 'snap', owner, by: me(), itemId: ref.id, logId, photo, thumb, location, at: now, caption: restingOn || '' });
  await writeExtras(ref.id, logId, extras, location, now, by, owner);
  return ref.id;
}

// The other photos of one log (a wide shot after the close-up), in the order taken.
async function writeExtras(itemId, logId, extras, location, at, by, owner = me()) {
  for (let i = 0; i < extras.length; i++) {
    await addDoc(col, { kind: 'snap', owner, by: me(), itemId, logId, photo: extras[i].photo, thumb: extras[i].thumb, location, at: at + i + 1, extra: true });
  }
}
// REQUIREMENTS_2026-09-27 R2: photos the camera attached to a thing that was already logged (picked as a
// known link on the chain, not photographed fresh) — appended the same way any other extra shot of a log
// joins it (writeExtras), then photoCount is bumped to match so Add photo / earlier-photos counts stay true.
export async function addItemPhotos(item, extras = []) {
  if (!extras || !extras.length) return 0;
  const now = Date.now();
  const logId = item.logId || `log_${item.lastSeenAt || now}`;
  await writeExtras(item.id, logId, extras, item.location || '', now, item.capturedBy || 'self', item.owner || me());
  await updateDoc(doc(col, item.id), { photoCount: (item.photoCount || (item.photo ? 1 : 0)) + extras.length, logId, updatedAt: now });
  return extras.length;
}

// Every name a thing has been called stays with it, so the next photo still matches.
function withAlias(item, name) {
  const cur = item.aliases || [];
  const n = (name || '').trim();
  if (!n || normName(n) === normName(item.name) || cur.some((a) => normName(a) === normName(n))) return cur;
  return [...cur, n].slice(-8);
}
// A person renamed it: keep the old name as an alias.
export async function renameItem(item, name) {
  // Compare the OLD name against the NEW one (audit D13: it was compared with itself and never kept).
  await updateItem(item.id, { name, aliases: withAlias({ ...item, name }, item.name) });
}
// The AI called it something on a later photo: remember that too.
export async function noteAlias(item, aiName) {
  const aliases = withAlias(item, aiName);
  if (aliases !== (item.aliases || [])) await updateDoc(doc(col, item.id), { aliases });
}

export async function nameItem(id, { name = '', description = '', restingOn = '', aliases, details = '' } = {}) {
  const patch = { naming: false };
  if (details) patch.details = details; // what the label says (MVP #9, 09-24)
  if (name) patch.name = name;
  if (aliases && aliases.length) patch.aliases = aliases;
  if (description) patch.description = description;
  if (restingOn) patch.restingOn = restingOn;
  await updateItem(id, patch);
  if (restingOn) await captionCoverSnap(id, restingOn);
}
// D3 (Ravi 09-28): a thing saved before its name arrived (naming: true) gets its first photo's caption when the AI's
// answer lands — the same words that go on the item. Best effort: a helper's rules may refuse the snap write, and the
// page then falls back to item.restingOn for the cover photo, so nothing is lost.
async function captionCoverSnap(itemId, text) {
  try {
    const d = await getDoc(doc(col, itemId));
    if (!d.exists()) return;
    const cover = d.data().photo;
    const all = await getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', itemId)));
    const hit = all.docs.find((x) => { const v = x.data(); return v.photo === cover && !v.deleted && !v.caption; });
    if (hit) await updateDoc(doc(col, hit.id), { caption: text });
  } catch (err) { console.error('caption cover', err); }
}

// Editing the place by hand IS a move: it goes into the history with a time, and the thing
// counts as seen there now (round 5 — Edit replaces *Found it*).
// Since 2026-09-16 (design §5, ruling 6) a move also writes a SIGHTING: the cover photo, at
// the new place, now — so the new stay has a photo and the history never has a row without
// one. Adding the place to a thing that had none is not a move: no sighting is written.
export async function changeLocation(item, location, placeSource = 'chosen', dest = null) {
  // Never a loop (bug #8, 09-27: the pencil went into the cabinet that was inside the pencil). Refused here, where every move passes.
  const to = dest || (location ? destOf(location, graph().byId.get(item.id) || item) : null);
  if (to && to.t === 'thing' && wouldLoop(item, to)) { logEvent('loop_refused', { itemId: item.id, to: to.id }); return false; }
  if (!dest) location = placeText(location, item);
  const now = Date.now();
  const history = [...(item.history || []), { location, at: now }].slice(-100);
  const moved = !!item.location && !!location && item.location.toLowerCase() !== location.toLowerCase();
  const patch = { location, needsPlace: !location, history, lastSeenAt: now, updatedAt: now, placeSource: location ? placeSource : '' };
  if (moved && item.photo) {
    const logId = `log_${now}`;
    await addDoc(col, { kind: 'snap', owner: item.owner || me(), by: me(), itemId: item.id, logId, photo: item.photo, thumb: item.thumb || null, location, at: now, moved: true });
    Object.assign(patch, { logId, photoCount: 1 });
  }
  await updateDoc(doc(col, item.id), patch);
  await recordMove(item, location, placeSource, dest);
  return true;
}

// Private = shared with no one (Only me), on every device of the owner. Making a thing private
// clears its per-thing roles; the rules refuse a private thing that still has roles. The
// owner's whole-ReCall grants skip private things by query. Only the owner may call this.
export async function setVisibility(item, visibility) {
  const priv = visibility === 'private';
  const patch = { private: priv, updatedAt: Date.now() };
  if (priv) Object.assign(patch, { roles: {}, sharedWith: [] });
  if (!item.owner) Object.assign(patch, { owner: me(), by: item.by || me(), roles: {}, sharedWith: [] }); // legacy doc adopted on the way
  await updateDoc(doc(col, item.id), patch);
  await syncEdgePrivacy(item.id, priv);
}
export function isPrivate(it) { return it.private === true || it.visibility === 'private'; }
export function isMine(it) { return it.owner === me(); }
export function roleOn(it) { if (!it) return null; if (isMine(it) || !it.owner) return 'owner'; /* a legacy doc not yet adopted is mine */ return (it.roles || {})[me()] || it.grantRole || null; }
export function canEditThing(it) { const r = roleOn(it); return r === 'owner' || r === 'editor'; }
// What THIS phone may show: everything shared, plus what it logged itself.
export function visibleHere(items) {
  // Private things arrive only through the owner's own listener; this is belt and braces.
  return items.filter((it) => !isPrivate(it) || isMine(it) || !it.owner);
}
export async function updateItem(id, patch) {
  await updateDoc(doc(col, id), { ...patch, updatedAt: Date.now() });
}

// The AI's verdict arrived AFTER the thing was saved (Several; One thing when she tapped before
// the name came). v = verdictOf(...) from lib/sensitive. Returns what was done, for the notice:
//   'private' — made private (owner only);  'photo' — a readable secret: the photo is not kept;
//   'helper'  — looks private but a helper saved it (they can't make it private).
// A secret photo is taken off the thing and its snaps deleted (a helper can only soft-delete).
export async function applyVerdict(id, v, owner = me()) {
  if (!v || (!v.private && !v.secret)) return [];
  const mineNow = owner === me();
  const done = [];
  const patch = {};
  if (v.secret) { Object.assign(patch, { photo: null, thumb: null, photoCount: 0, written: true }); done.push('photo'); }
  if (mineNow) { Object.assign(patch, { private: true, roles: {}, sharedWith: [], privateAuto: v.why || 'looks private' }); done.push('private'); }
  else done.push('helper');
  await updateItem(id, patch);
  if (mineNow) await syncEdgePrivacy(id, true);
  if (v.secret) await dropSnapsOf(id, mineNow);
  return done;
}
async function dropSnapsOf(itemId, mineNow) {
  const snap = await getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', itemId)));
  await Promise.all(snap.docs.map((d) => (mineNow ? deleteDoc(doc(col, d.id)) : updateDoc(doc(col, d.id), { deleted: true, deletedAt: Date.now() }))));
}

// The place text copy: when the words name a thing ("in the wooden box"), the copy is that thing's own
// name ("Wooden box"), so the place lists never grow a second spelling of the same box (09-27).
function placeText(location, item) {
  if (!location) return location;
  const d = destOf(location, item ? (graph().byId.get(item.id) || item) : null);
  return d && d.t === 'thing' && d.name ? d.name.charAt(0).toUpperCase() + d.name.slice(1) : location;
}

// ---------- edges (DECISIONS 2026-09-25/26; lib/graph.js has the model) ----------
// Every place write goes through here: close the thing's open "in" edge, open a new one. The words
// decide the destination (graph.destOf): an exact name of another thing makes it a container;
// anything else is a place by name. Nothing is inferred behind her back — this runs only on a save
// she made. `how`: chosen · session · usual · guess · put · typed. Returns the new edge's id or null.
export async function recordMove(item, location, how = 'chosen', dest = null) {
  try { return await writeMove(item, location, how, dest); } catch (err) { console.error('recordMove', err); logEvent('edge_failed', { itemId: item && item.id, code: err.code || '' }); return null; } // the place copy already saved; the edge never blocks a move
}
async function writeMove(item, location, how, dest) {
  if (!item || !item.id) return null;
  const now = Date.now();
  const cur = openEdge(item.id);
  const to = dest || (location ? destOf(location, graph().byId.get(item.id) || item) : null);
  if (to && to.t === 'thing' && wouldLoop(item, to)) { logEvent('loop_refused', { itemId: item.id, to: to.id, at: 'edge' }); return null; }
  const same = cur && to && cur.to && cur.to.t === to.t && (to.t === 'thing' ? cur.to.id === to.id : (cur.to.name || '').toLowerCase() === (to.name || '').toLowerCase());
  if (same) return cur.id;
  if (cur) await updateDoc(doc(col, cur.id), { until: now, closedBy: me() });
  if (!to) return null;
  const owner = item.owner || me();
  const ref = await addDoc(col, { kind: 'edge', rel: 'in', from: item.id, to, since: now, until: null, how,
    owner, by: me(), private: !!item.private && owner === me(), roles: {}, sharedWith: [] });
  return ref.id;
}
// 09-29 (Ravi: "I added the next tier … when I hit save, it doesn't store that next tier"). Where a PLACE is — the
// same "is in" edge a thing has, from the place doc's id (DECISIONS 2026-09-25: "is in" is an edge, never a field).
// Closes the place's open edge when it changes; `to` null just closes it. Refuses a circle. Returns what it replaced
// (for Undo) or undefined when nothing changed.
export async function placeIn(place, to) {
  if (!place || !place.id) return undefined;
  const cur = openEdge(place.id);
  if (to && to.t === 'place' && !(to.name || '').trim()) to = null;
  if (to && placeWouldLoop(place.name, to)) { logEvent('loop_refused', { placeId: place.id, at: 'place' }); return undefined; }
  const same = cur && to && cur.to && cur.to.t === to.t && (to.t === 'thing' ? cur.to.id === to.id : (cur.to.name || '').toLowerCase() === (to.name || '').toLowerCase());
  if (same || (!cur && !to)) return undefined;
  const now = Date.now();
  if (cur) await updateDoc(doc(col, cur.id), { until: now, closedBy: me() });
  if (to) {
    const t = to.t === 'thing' ? { t: 'thing', id: to.id || (to.item && to.item.id), name: to.name || (to.item && to.item.name) || '' } : { t: 'place', name: to.name };
    await addDoc(col, { kind: 'edge', rel: 'in', from: place.id, to: t, since: now, until: null, how: 'chosen', owner: place.owner || me(), by: me(), private: false, roles: {}, sharedWith: [] });
  }
  logEvent('place_in', { placeId: place.id, to: to ? to.t : null, replaced: !!cur });
  return { place: { id: place.id, name: place.name, owner: place.owner }, prev: cur ? cur.to : null };
}
// Places made before 09-29 by a new-place chain carry `parent` (a place id) that nothing read. The owner's phone turns
// each into the edge above, once (a place that already has an open edge is left alone). Returns how many.
export async function repairPlaceParents(data) {
  const uid = me(); if (!uid) return 0;
  const g = graph(); let n = 0;
  for (const p of data.places || []) {
    if (!p.parent || p.owner !== uid || openEdge(p.id, g)) continue;
    const par = (data.places || []).find((x) => x.id === p.parent);
    if (!par || par.id === p.id) continue;
    try { if (await placeIn(p, { t: 'place', name: par.name })) n++; } catch (err) { console.error('repairPlaceParents', p.id, err); }
  }
  if (n) logEvent('repair_place_parents', { n });
  return n;
}
// "What is it in?" → a box not logged yet (Ravi 09-27: "I need the option to create it … right at the top").
// It is made as a written thing with no place (so it shows under "Not put away" until it has one), and the
// caller links the item to it by id — never by a name that could match something else.
export async function newContainer(name, owner = me()) {
  const n = (name || '').trim();
  if (!n) return null;
  const id = await addItem({ name: n, owner, placeSource: '' });
  logEvent('container_new', { itemId: id });
  return { id, name: n };
}
// Put things into a container (Put in, 09-25 P-B; the fallback put-away). One save per batch.
// Refuses a circle. Returns how many went in.
export async function putInto(things, container, how = 'put') {
  if (!container) return 0;
  let n = 0;
  for (const t of things) {
    if (!t || t.id === container.id || wouldLoop(t, container)) continue;
    await changeLocation(t, container.name ? container.name.charAt(0).toUpperCase() + container.name.slice(1) : 'In a box', 'chosen', { t: 'thing', id: container.id, name: container.name || '' });
    n += 1;
  }
  logEvent('put_into', { container: container.id, things: n, how });
  return n;
}
// ---------- the camera's chain (09-27): the thing, then what it is in, then where that is ----------
// `chain` runs outward: chain[0] is what the thing is in or at, chain[1] is where chain[0] is, and so on.
// Each link is one of:
//   { known: { t:'thing', item } }   a box already logged (its own place is kept unless a link follows it)
//   { known: { t:'place', name } }   a place already known by name
//   { photo, thumb, placePhoto, name, moves }   new from a photo: a box (moves) or a place (fixed)
// Written outermost first, so every new box has its place the moment it exists. Returns what Undo needs.
const capName = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// 09-29: a place on the chain with a link outside it is IN that link (an edge from the place). Before this, only a
// brand-new place got a `parent` (read by nothing) and a known place's outer tier was dropped. Never the same place
// twice on one chain, never a circle (placeIn checks the saved graph; `inChain` the links outside this one).
async function placeOuterLink(place, outer, inChain, made) {
  if (!place || !place.id) return;
  const key = 'p:' + (place.name || '').toLowerCase();
  if (outer && !inChain.has(key)) { const r = await placeIn(place, outer.dest); if (r) made.placeMoves.push(r); }
  inChain.add(key);
}
export async function saveChain(chain = [], { owner = me(), places = [] } = {}) {
  const made = { items: [], places: [], moved: [], links: [], placeMoves: [] };
  const inChain = new Set(); // the places already on this chain, outside the link being saved
  let outer = null; // { text, dest, placeId } — where the link just outside this one is
  for (let i = chain.length - 1; i >= 0; i--) {
    const l = chain[i];
    let here;
    if (l.known && l.known.t === 'thing') {
      const it = l.known.item;
      if (outer && !(outer.dest && outer.dest.t === 'thing' && outer.dest.id === it.id)) {
        made.moved.push({ item: it, location: it.location || '', dest: openEdge(it.id) ? openEdge(it.id).to : null });
        await changeLocation(it, outer.text, 'chosen', outer.dest);
      }
      // REQUIREMENTS_2026-09-27 R2: photos the camera attached to an already-logged thing on this
      // chain (l.extraPhotos, Stage 2) join it as extra photos — same mechanism as any other extra shot.
      if (l.extraPhotos && l.extraPhotos.length) await addItemPhotos(it, l.extraPhotos);
      here = { text: capName(it.name || 'A box'), dest: { t: 'thing', id: it.id, name: it.name || '' } };
      made.links[i] = null; // an already-known link never needs the "Unnamed" marker (R3.3)
    } else if (l.known) {
      // REQUIREMENTS_2026-09-27 R2: a typed or picked PLACE becomes a real place doc too, not just words
      // on the item — same call the photographed branch below makes, so it nests (parent) the same way.
      const name = l.known.name;
      const known = placeNamed(name, places);
      const id = await addPlace(name, places, l.placePhotos || [], owner, null);
      if (!known && id) made.places.push(id);
      await placeOuterLink(known || { id, name, owner }, outer, inChain, made);
      here = { text: name, dest: { t: 'place', name }, placeId: id };
      made.links[i] = null;
    } else if (l.moves) {
      const name = l.name || 'A box';
      const id = await addItem({ name, photo: l.photo, thumb: l.thumb, extras: l.extras || [], owner, location: outer ? outer.text : '', dest: outer ? outer.dest : null, placeSource: 'chosen', holds: true, asWhere: true });
      made.items.push(id);
      logEvent('container_new', { itemId: id, via: 'camera' });
      here = { text: capName(name), dest: { t: 'thing', id, name } };
      // REQUIREMENTS_2026-09-27 R3.3: a new box saved with no real name (still "A box"/empty) is
      // marked so the confirmation card can offer "Unnamed — tap to name" on the doc just made.
      made.links[i] = { id, kind: 'thing', unnamed: !!l.unnamed };
    } else {
      const name = capName(l.name || 'A place');
      const known = placeNamed(name, places);
      const id = await addPlace(name, places, l.placePhotos || (l.placePhoto ? [l.placePhoto] : []), owner, null);
      if (!known && id) made.places.push(id);
      await placeOuterLink(known || { id, name, owner }, outer, inChain, made);
      here = { text: name, dest: { t: 'place', name }, placeId: id };
      made.links[i] = { id, kind: 'place', unnamed: !!l.unnamed };
    }
    outer = here;
  }
  return { first: outer, made };
}
// "It holds things" (Ravi 09-27). It can't be switched off while something is in it.
export async function setHolds(item, on) {
  if (!on && contentsOf(item).length) return false;
  await updateItem(item.id, { holds: !!on });
  logEvent('holds', { itemId: item.id, on: !!on });
  return true;
}
// Undo a camera save (the Home card): the thing goes (or, if it was already logged, goes back where it
// was), and every box and place made in the same save goes with it. Owner only — a helper can't delete.
export async function undoChain({ itemId = null, isNew = false, prev = null, made = { items: [], places: [], moved: [] } } = {}) {
  const g = graph();
  const drop = async (id) => {
    const it = g.byId.get(id) || { id };
    for (const e of g.edges.filter((x) => x.from === id)) await deleteDoc(doc(col, e.id)).catch(() => {});
    await purgeItem(it);
  };
  if (itemId && isNew) await drop(itemId);
  else if (itemId && prev) { const it = g.byId.get(itemId); if (it) await changeLocation(it, prev.location || '', 'chosen', prev.dest || null); }
  for (const m of made.moved || []) { const it = g.byId.get(m.item.id) || m.item; await changeLocation(it, m.location, 'chosen', m.dest); }
  for (const id of made.items || []) await drop(id);
  for (const pm of [...(made.placeMoves || [])].reverse()) await placeIn(pm.place, pm.prev).catch(() => {});
  for (const id of made.places || []) { for (const e of graph().edges.filter((x) => x.from === id && !x.until)) await deleteDoc(doc(col, e.id)).catch(() => {}); await deleteDoc(doc(col, id)).catch(() => {}); }
  logEvent('camera_undo', { isNew, made: (made.items || []).length + (made.places || []).length });
}

// A thing's edges follow its privacy, so a private thing never shows up in a box's count for a helper.
async function syncEdgePrivacy(itemId, priv) {
  const mine = graph().edges.filter((e) => e.from === itemId && e.owner === me() && !!e.private !== !!priv);
  for (const e of mine) await updateDoc(doc(col, e.id), { private: !!priv });
}
// Promote a thing inside a box back onto Home (Ravi 09-25). Owner-only, like pinning.
export async function setPromoted(item, on) { await updateItem(item.id, { promoted: !!on }); logEvent('promote', { itemId: item.id, on: !!on }); }


export async function resnapItem(item, { photo, thumb, location, by = 'self', restingOn = '', extras = [], placeSource = 'chosen', dest = null }) {
  location = placeText(location, item);
  const now = Date.now();
  const logId = `log_${now}`;
  const history = [...(item.history || []), { location, at: now }].slice(-100);
  await updateDoc(doc(col, item.id), {
    photo, thumb, thumbV: THUMB_V, location, restingOn, needsPlace: !location, placeSource: location ? placeSource : '',
    lastSeenAt: now, updatedAt: now, history, capturedBy: by, logId, photoCount: 1 + extras.length,
  });
  await addDoc(col, { kind: 'snap', owner: item.owner || me(), by: me(), itemId: item.id, logId, photo, thumb, location, at: now, caption: restingOn || '' }); // D3: its own caption
  await writeExtras(item.id, logId, extras, location, now, by, item.owner || me());
  await recordMove(item, location, placeSource, dest);
}

// 2026-09-14 (Ravi): one log can hold several photos — a close-up and a wide shot. A later
// photo joins the CURRENT log: same place, same time, no question, no AI. Cap LOG_MAX.
// Where a thing's place came from (DECISIONS 2026-09-24, Sam): 'chosen' (the person tapped or typed it),
// 'session' (the place set for a run of photos), 'usual' (where this thing lives), 'guess' (the AI, sure of it).
// A guess nobody corrected stays findable as a guess instead of looking like a fact.
export const PLACE_SOURCES = ['chosen', 'session', 'usual', 'guess'];
export const LOG_MAX = 6; // cover + up to 5 more (Ravi 09-15: "only 2 in one go" was 4 - cover - 1)
// D3 (Ravi 09-28): `caption` is what THIS photo shows the thing resting on or beside — from the add-photo check's
// looksLike answer, '' when the check was skipped. It lives on the snap; the page shows the caption of the photo in view.
export async function addSnapToLog(item, { photo, thumb, by = 'self', caption = '' }) {
  if (!item.photo) { // a written-down thing's first photo becomes its cover (MVP #10, 09-24)
    const now = Date.now(); const logId = `log_${now}`;
    await addDoc(col, { kind: 'snap', owner: item.owner || me(), by: me(), itemId: item.id, logId, photo, thumb, location: item.location || '', at: now, caption: caption || '' });
    await updateDoc(doc(col, item.id), { photo, thumb, thumbV: THUMB_V, photoCount: 1, logId, written: false, lastSeenAt: now, updatedAt: now, ...(caption ? { restingOn: caption } : {}) });
    return true;
  }
  const count = item.photoCount || 1;
  if (count >= LOG_MAX) return false;
  // Things logged before 2026-09-14 have no logId (audit D2: Add photo silently did nothing
  // on every one of Ravi's items). Give the current log one now; the cover stays the cover.
  const logId = item.logId || `log_${item.lastSeenAt || Date.now()}`;
  // Real capture time (2026-09-16, Ravi: the when line must change as the roll is swiped —
  // photos in one log can be days apart). Before this the time was faked to the log's own,
  // so photos added before 09-16 all show the day they were first logged.
  const at = Date.now();
  await addDoc(col, { kind: 'snap', owner: item.owner || me(), by: me(), itemId: item.id, logId, photo, thumb, location: item.location || '', at, extra: true, caption: caption || '' });
  await updateDoc(doc(col, item.id), { photoCount: count + 1, logId, updatedAt: Date.now() });
  return true;
}

// D2 (Ravi 09-28): "Make main" — this photo becomes the one on the Home tile and the top of the page. DISPLAY only:
// the thing's place, when it was last seen and its log stay exactly as they were (a photo taken at an earlier place
// must not move the thing back there). The main photo's caption is the thing's restingOn (D3), so "In this photo: …"
// under the tile keeps agreeing with the picture. `prev` (optional) is the snap that WAS the cover: a photo from before
// captions existed keeps what the thing said it rested on as its own caption instead of losing it. Best effort.
export async function setMainPhoto(item, snap, prev = null) {
  if (!snap || !snap.photo || snap.photo === item.photo) return false;
  if (prev && prev.id && !prev.caption && item.restingOn) {
    try { await updateDoc(doc(col, prev.id), { caption: item.restingOn }); } catch (err) { console.error('keep caption', err); }
  }
  await updateItem(item.id, { photo: snap.photo, thumb: snap.thumb, thumbV: THUMB_V, restingOn: snap.caption || '' });
  return true;
}
// D3: edit what one photo shows. A secret typed here is refused, as in a name (hasSecret). Returns false when refused.
export async function setSnapCaption(snap, text) {
  const t = (text || '').trim();
  if (!snap || !snap.id || hasSecret(t)) return false;
  await updateDoc(doc(col, snap.id), { caption: t });
  return true;
}

// Remove one photo from a thing (Ravi, 2026-09-14). Soft: the snap keeps its data under
// `deleted` so Undo can bring it back; purgeItem sweeps it with the rest. If the removed
// photo was the cover, the newest remaining photo becomes the cover. Returns what changed,
// so Undo can put it back exactly.
export async function removeSnap(item, snap, snaps) {
  const rest = snaps.filter((s) => s.id !== snap.id && !s.deleted).sort((a, b) => b.at - a.at);
  const patch = {};
  // D2 (Ravi 09-28): the cover is the snap whose photo IS item.photo — Make main can point it at any snap, so the old
  // "first photo of the log" test only applies to a thing whose cover has no snap of its own (very old data).
  const hasCoverSnap = snaps.some((s) => s.photo === item.photo && !s.deleted);
  const wasCover = snap.photo === item.photo || (!hasCoverSnap && snap.logId && snap.logId === item.logId && !snap.extra);
  if (wasCover && rest[0]) {
    const next = rest[0];
    Object.assign(patch, { photo: next.photo, thumb: next.thumb, thumbV: THUMB_V, location: next.location || item.location, lastSeenAt: next.at, logId: next.logId || next.id });
    // fix 2026-09-28 (phone, B2): "In the photo: …" described the REMOVED cover ("White wall" under a photo on orange
    // carpet). It follows the new cover's own caption if that photo has one, else it goes: no caption beats a wrong one.
    // D3: the caption is now the snap's own `caption` (it was never a field on the snap before, so this was always '').
    patch.restingOn = next.caption || '';
  }
  if (snap.logId && snap.logId === item.logId) patch.photoCount = Math.max(1, (item.photoCount || 1) - 1);
  await updateDoc(doc(col, snap.id), { deleted: true, deletedAt: Date.now() });
  if (Object.keys(patch).length) await updateDoc(doc(col, item.id), { ...patch, updatedAt: Date.now() });
  const before = {};
  Object.keys(patch).forEach((k) => { before[k] = item[k] === undefined ? null : item[k]; });
  return { undo: async () => {
    await updateDoc(doc(col, snap.id), { deleted: false, deletedAt: null });
    if (Object.keys(before).length) await updateDoc(doc(col, item.id), { ...before, updatedAt: Date.now() });
  } };
}

// A thing saved before its name arrived turned out to be one already on the board, and
// the person confirmed it. Its photo becomes a new photo of the existing thing and the
// provisional doc (and its snap) goes away.
export async function absorbInto(existing, provisionalId, { photo, thumb, location, restingOn = '', by = 'self', extras = [], placeSource = 'chosen' }) {
  await resnapItem(existing, { photo, thumb, location, restingOn, by, extras, placeSource });
  await purgeItem({ id: provisionalId });
}

// Earlier photos of one item, newest first (the "not there?" scroll).
// Fetches every snap (a limit() query needs a composite index — on Tanya's console list),
// prunes beyond SNAPS_KEEP in the background, returns at most SNAPS_SHOW + the current one.
export async function loadSnaps(itemId) {
  const snap = await getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', itemId)));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => !s.deleted).sort((a, b) => b.at - a.at);
  const extra = all.slice(SNAPS_KEEP);
  if (extra.length) Promise.all(extra.map((s) => deleteDoc(doc(col, s.id)))).catch(() => {});
  return all.slice(0, SNAPS_SHOW + 1);
}

// Pinning: fixed slots 0..MAX_PINNED-1. Returns 'pinned' | 'full'.
export async function pinItem(item, items) {
  const used = new Set(items.filter((i) => i.pinnedOrder != null && i.id !== item.id).map((i) => i.pinnedOrder));
  for (let slot = 0; slot < MAX_PINNED; slot++) {
    if (!used.has(slot)) { await updateItem(item.id, { pinnedOrder: slot }); return 'pinned'; }
  }
  return 'full';
}
export async function replacePinned(item, victim) {
  await updateItem(victim.id, { pinnedOrder: null });
  await updateItem(item.id, { pinnedOrder: victim.pinnedOrder });
}
export async function unpinItem(item) { await updateItem(item.id, { pinnedOrder: null }); }

// Removing a thing.
//
// A tap from a confused person must never destroy a photo. So "remove" is a soft delete:
// the thing leaves the tiles and the search immediately, and sits in Settings → Recently
// removed until a person deliberately empties it. Only `purgeItem` actually destroys
// anything, and it takes the item's snaps with it so photos don't orphan in Firestore.
export async function softDeleteItem(item) {
  await updateDoc(doc(col, item.id), { deleted: true, deletedAt: Date.now(), pinnedOrder: null });
}
export async function restoreItem(id) {
  await updateDoc(doc(col, id), { deleted: false, deletedAt: null });
}
export async function purgeItem(item) {
  const snaps = await getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', item.id)));
  await Promise.all(snaps.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(col, item.id));
}

// Saved places (Settings → Places, Robert's list) come first, most recently used first;
// then places only seen on items. 2026-09-14.
export function knownLocations(items, limit = 5, places = []) {
  const counts = new Map();
  places.forEach((p) => counts.set(p.name, { n: 0, last: 0, saved: true }));
  items.forEach((it) => {
    (it.history || [{ location: it.location, at: it.lastSeenAt }]).forEach(({ location, at }) => {
      if (!location) return;
      const key = [...counts.keys()].find((k) => k.toLowerCase() === location.toLowerCase()) || location;
      const c = counts.get(key) || { n: 0, last: 0, saved: false };
      c.n += 1; c.last = Math.max(c.last, at || 0);
      counts.set(key, c);
    });
  });
  // A name that IS a thing (the wooden box) is offered as that thing — by its photo, "In the wooden box" —
  // never a second time as a place of the same name (09-27: both showed, both ticked).
  const thingNames = new Set(items.filter((x) => !x.deleted && x.name).map((x) => normName(x.name)));
  return [...counts.entries()]
    .filter(([loc]) => !thingNames.has(normName(loc)))
    .sort((a, b) => ((b[1].saved ? 1 : 0) - (a[1].saved ? 1 : 0)) || (b[1].last - a[1].last) || (b[1].n - a[1].n))
    .slice(0, limit).map(([loc]) => loc);
}

// ---------- places (Settings → Places; the helper's list) ----------

// A place doc: { kind:'place', name, photos:[{photo, thumb, at}] (≤ PLACE_PHOTOS), order, createdAt }.
// Photos (round 7, Ravi): "drawer 2, at the very back" as a picture, shown when logging and,
// later, given to the AI as reference images so it can pre-answer "where is it?".
// Future (Ravi 09-15, architecture note): places will form a hierarchy — back of drawer ⊂
// third drawer ⊂ filing cabinet ⊂ office ⊂ home — built by the system in the background,
// never by the user. Reserve `parent` (place id | null) on this doc for it; nothing reads it yet.
// REQUIREMENTS_2026-09-27 R2: 3 → 6 (the camera can now attach a photo at every level of a chain, not
// just the top two or three places used most).
export const PLACE_PHOTOS = 6;
// REQUIREMENTS_2026-09-27 R2: a place doc's photos are approximated by summing their base64 string
// lengths and kept under ~700 KB serialized, so one place can't blow up the document past Firestore's
// per-doc size in practice. Approximate, not exact — good enough to keep a place doc small.
const PLACE_PHOTOS_BYTES = 700 * 1024;
const photoBytes = (p) => (p ? (p.photo || '').length + (p.thumb || '').length : 0);
// fix 2026-09-29 (phone): the real Firestore rules let an owner update a doc only when consistent() holds, and
// consistent() reads `sharedWith` and `roles`. Place docs never had either field, so EVERY update to a place was
// refused in production — adding a photo, Make main, removing a photo, renaming — while the rig's stub treated
// the missing fields as empty and passed. Ravi's move got stuck on exactly this (photos onto White cardboard box:
// refused, caught, nothing on screen). A place is never shared on its own, so it carries the empty pair; old
// places gain it on their first write. No rules deploy needed.
const PLACE_SHARE = { sharedWith: [], roles: {} };
// Only the owner adds the pair: a helper may change just the editor keys, and on an old place the pair would be a
// change of two more keys, which the rules refuse for a helper (a helper's rename must keep working).
const placeShare = (place) => (place && place.owner === me() && !(Array.isArray(place.sharedWith) && place.roles) ? PLACE_SHARE : {});
export async function addPlace(name, places = [], photos = [], owner = me(), parent = null) {
  const n = name.trim();
  if (!n) return null;
  const dup = places.find((p) => p.name.toLowerCase() === n.toLowerCase());
  if (dup) { if (photos.length && (dup.photos || []).length < PLACE_PHOTOS && dup.owner === me()) await addPlacePhotos(dup, photos); return dup.id; }
  const now = Date.now();
  const ref = await addDoc(col, { kind: 'place', owner, by: me(), private: false, ...PLACE_SHARE, name: n, order: now, createdAt: now, parent,
    photos: photos.slice(0, PLACE_PHOTOS).map((p) => ({ ...p, at: now })) });
  return ref.id;
}
export async function addPlacePhotos(place, photos) {
  const now = Date.now();
  const have = place.photos || [];
  let total = have.reduce((n, p) => n + photoBytes(p), 0);
  const room = [];
  for (const p of photos) {
    if (have.length + room.length >= PLACE_PHOTOS) break; // the count cap still applies first
    const b = photoBytes(p);
    if (total + b > PLACE_PHOTOS_BYTES) continue; // over the byte budget: skip this one, silently keep what fits
    room.push(p); total += b;
  }
  const next = [...have, ...room.map((p) => ({ ...p, at: now }))].slice(0, PLACE_PHOTOS);
  await updateDoc(doc(col, place.id), { photos: next, updatedAt: now, ...placeShare(place) });
  return next.length - have.length;
}
export async function removePlacePhoto(place, index) {
  const next = (place.photos || []).filter((_, i) => i !== index);
  await updateDoc(doc(col, place.id), { photos: next, updatedAt: Date.now(), ...placeShare(place) });
}
// D2 (Ravi 09-28): "Make main" on a place photo puts it first — first is the one shown as the place's picture.
export async function setPlaceMainPhoto(place, index) {
  const have = place.photos || [];
  if (index <= 0 || index >= have.length) return false;
  await updateDoc(doc(col, place.id), { photos: [have[index], ...have.filter((_, i) => i !== index)], updatedAt: Date.now(), ...placeShare(place) });
  return true;
}
// The saved place with this name, if any (case-insensitive).
export function placeNamed(name, places = []) {
  const n = (name || '').toLowerCase();
  return n ? places.find((p) => p.name.toLowerCase() === n) || null : null;
}
// The picture that stands for a place: its own first photo, else the thumb of the thing most
// recently seen there, else null (the UI shows a camera placeholder).
export function placeThumb(name, places = [], items = []) {
  const p = placeNamed(name, places);
  if (p && p.photos && p.photos.length) return { src: p.photos[0].thumb, own: true };
  const n = (name || '').toLowerCase();
  const here = items.filter((it) => (it.location || '').toLowerCase() === n).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
  return here.length ? { src: here[0].thumb, own: false } : null;
}
// Every place the household knows: saved ones (with photos) and ones only used on things —
// one list, most recently used first, saved-with-photo never hidden. Used by the Locations screen.
export function allPlaces(items = [], places = []) {
  const names = knownLocations(items, 999, places);
  return names.map((name) => {
    const saved = placeNamed(name, places);
    const things = items.filter((it) => (it.location || '').toLowerCase() === name.toLowerCase());
    return { name, saved, things, count: things.length };
  });
}
// Rename updates every item that uses the place, so Robert can fix a typo once.
export async function renamePlace(place, name, items = []) {
  const n = name.trim();
  if (!n || n === place.name) return;
  await updateDoc(doc(col, place.id), { name: n, ...placeShare(place) });
  const hits = items.filter((it) => (it.location || '').toLowerCase() === place.name.toLowerCase());
  await Promise.all(hits.map((it) => updateDoc(doc(col, it.id), {
    location: n, updatedAt: Date.now(),
    history: (it.history || []).map((h) => (h.location || '').toLowerCase() === place.name.toLowerCase() ? { ...h, location: n } : h),
  })));
}
// One toast shape for both directions (Ravi 09-15: the two were 'terrible and inconsistent';
// and 'only this phone' was wrong — private means private to the person, on every device).
export const VISIBILITY_TOAST = { private: 'Now private · only you see it', household: 'Now shared · everyone at home sees it' };
export async function removePlace(place) { await deleteDoc(doc(col, place.id)); }

// ---------- routines (what the app asks for, and when) ----------

export const DEFAULT_ROUTINES = [
  { name: 'Morning pills', window: 'morning', type: 'medication', order: 0,
    instruction: 'Open the lid and show me today’s row.' },
  { name: 'Stove', window: 'evening', type: 'stove', order: 10,
    instruction: 'Show me the dials.' },
  { name: 'Front door', window: 'evening', type: 'door', order: 11,
    instruction: 'Show me the lock.' },
  { name: 'Back door', window: 'evening', type: 'door', order: 12,
    instruction: 'Show me the lock.' },
];

// Not called since 2026-09-05: routines are set by a helper, never seeded. Kept for that build.
export async function seedRoutinesIfEmpty(existing) {
  if (existing.length) return;
  for (const r of DEFAULT_ROUTINES) await addDoc(col, { kind: 'routine', owner: me(), by: me(), active: true, ...r, createdAt: Date.now() });
}
export async function addRoutine(r) {
  await addDoc(col, { kind: 'routine', owner: me(), by: me(), active: true, createdAt: Date.now(), ...r });
}
export async function updateRoutine(id, patch) { await updateDoc(doc(col, id), patch); }
export async function deleteRoutine(id) { await deleteDoc(doc(col, id)); }

// A check is a photo taken for a routine. claim = what the AI could honestly say.
export async function addCheck({ routineId, photo, thumb, claim, retakes = 0, by = 'self' }) {
  const now = Date.now();
  const ref = await addDoc(col, {
    kind: 'check', owner: me(), by: me(), routineId, photo, thumb, claim, retakes, at: now, dayKey: dayKey(new Date(now)),
  });
  return ref.id;
}
export function todaysCheck(checks, routineId) {
  const today = dayKey();
  return checks.find((c) => c.routineId === routineId && c.dayKey === today) || null;
}

// ---------- silent research log ----------
//
// Every event carries: type, at (ms), dayKey, hour, timeOfDay, deviceId, sessionId,
// role, schema. Never surfaced to the patient as a number.
// Schema 3 (2026-09-05): adds `household`; new event types for the board model —
// capture.savedBy ∈ chip|typed|not_sure, lookup.entryMode ∈ tile|typed|voice,
// merge (result: confirmed|declined|unseen), naming_failed, move_to_top.
export const EVENT_SCHEMA = 3;
const DEVICE_KEY = 'recall-device-id';
// This phone's stable id — the event log's, and (until real sign-in) what a private item is private TO.
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return 'unknown'; }
}
const SESSION_ID = Math.random().toString(36).slice(2, 10);
const ROLE = (() => { try { return localStorage.getItem('recall-role') || 'patient'; } catch { return 'patient'; } })();

export function logEvent(type, meta = {}) {
  const now = new Date();
  addDoc(eventsCol, {
    type, ...meta, owner: me(),
    at: now.getTime(), dayKey: dayKey(now), hour: now.getHours(), timeOfDay: timeOfDay(now),
    deviceId: deviceId(), sessionId: SESSION_ID, role: ROLE, schema: EVENT_SCHEMA,
  }).catch(() => {});
}

export async function exportEvents() {
  const snap = await getDocs(query(eventsCol, orderBy('at', 'asc')));
  return snap.docs.map((d) => d.data());
}

// The rig (never the app): audits call the write functions directly to prove the loop guard at write time.
// __RIG__ is defined only by rig/build.sh; in the app this line does nothing.
if (typeof __RIG__ !== 'undefined' && typeof window !== 'undefined') window.__rigdb = { changeLocation, putInto, setHolds, saveChain, addItem, addPlace, addPlacePhotos, addItemPhotos };
