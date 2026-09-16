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
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDocs, where,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { dayKey, timeOfDay } from './format.js';
import { THUMB_V } from './img.js';

const col = collection(db, 'recall_items');
const eventsCol = collection(db, 'recall_events');

// Board decision 2026-09-05 (D7): every new document carries a household so the rules can
// be scoped later without migrating. One household until join codes exist.
export const HOUSEHOLD = 'default';

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
const DROP = new Set(['your', 'the', 'my', 'a', 'an', 'her', 'his', 'our']);
export function normName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w && !DROP.has(w)).map((w) => w.replace(/s$/, '')).join(' ');
}
function namesOf(it) { return [it.name, ...(it.aliases || [])].map(normName).filter(Boolean); }
export function findByName(items, name) {
  const n = normName(name);
  if (!n) return null;
  const live = items.filter((it) => !it.deleted);
  const exact = live.find((it) => namesOf(it).includes(n));
  if (exact) return exact;
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
export function findMatch(items, tag) {
  if (!tag) return null;
  return findByName(items, tag.sameAs) || findByName(items, tag.name)
    || (tag.alternatives || []).map((a) => findByName(items, a)).find(Boolean) || null;
}

// ---------- live data ----------

// One listener; caller gets everything split by kind. Snap photos are heavy, so
// snaps are NOT included here — fetch them per item with loadSnaps().
export function watchAll(cb) {
  const q = query(col, where('kind', 'in', ['item', 'routine', 'check', 'place']));
  return onSnapshot(q, (snap) => {
    const out = { items: [], routines: [], checks: [], removed: [], places: [] };
    snap.docs.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      if (data.kind === 'place') out.places.push(data);
      else if (data.kind === 'routine') out.routines.push(data);
      else if (data.kind === 'check') out.checks.push(data);
      else if (data.deleted) out.removed.push(data);
      else out.items.push(data);
    });
    out.items.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
    out.removed.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    out.routines.sort((a, b) => (a.order || 0) - (b.order || 0));
    out.checks.sort((a, b) => (b.at || 0) - (a.at || 0));
    out.places.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    cb(out);
  }, (err) => console.error('watchAll', err));
}

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
export async function addItem({ name = '', location = '', description = '', photo, thumb, by = 'self', restingOn = '', naming = false, aliases = [], extras = [] }) {
  const now = Date.now();
  const logId = `log_${now}`;
  const ref = await addDoc(col, {
    kind: 'item', household: HOUSEHOLD, name, aliases, location, description, photo, thumb, thumbV: THUMB_V, restingOn,
    owner: deviceId(), visibility: 'household', // Ravi, 2026-09-14 (stage 1 must-have): private = only the phone that logged it
    needsPlace: !location, naming,
    order: now, pinnedOrder: null, createdAt: now, updatedAt: now, lastSeenAt: now, capturedBy: by,
    history: [{ location, at: now }], logId, photoCount: 1 + extras.length,
  });
  await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId: ref.id, logId, photo, thumb, location, at: now, by });
  await writeExtras(ref.id, logId, extras, location, now, by);
  return ref.id;
}

// The other photos of one log (a wide shot after the close-up), in the order taken.
async function writeExtras(itemId, logId, extras, location, at, by) {
  for (let i = 0; i < extras.length; i++) {
    await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId, logId, photo: extras[i].photo, thumb: extras[i].thumb, location, at: at + i + 1, by, extra: true });
  }
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

export async function nameItem(id, { name = '', description = '', restingOn = '', aliases } = {}) {
  const patch = { naming: false };
  if (name) patch.name = name;
  if (aliases && aliases.length) patch.aliases = aliases;
  if (description) patch.description = description;
  if (restingOn) patch.restingOn = restingOn;
  await updateItem(id, patch);
}

// Editing the place by hand IS a move: it goes into the history with a time, and the thing
// counts as seen there now (round 5 — Edit replaces *Found it*).
export async function changeLocation(item, location) {
  const now = Date.now();
  const history = [...(item.history || []), { location, at: now }].slice(-100);
  await updateDoc(doc(col, item.id), { location, needsPlace: !location, history, lastSeenAt: now, updatedAt: now });
}

// Private: only this phone shows it; the household's other phones never receive it (the
// Firestore rules enforce that from multi-user stage 1; until then it is a field).
// Exclusion model: everything is shared unless she says otherwise (board, 2026-09-14).
export async function setVisibility(item, visibility) {
  await updateDoc(doc(col, item.id), { visibility, owner: item.owner || deviceId(), updatedAt: Date.now() });
}
export function isPrivate(it) { return it.visibility === 'private'; }
// What THIS phone may show: everything shared, plus what it logged itself.
export function visibleHere(items) {
  const me = deviceId();
  return items.filter((it) => !isPrivate(it) || it.owner === me || !it.owner);
}

export async function updateItem(id, patch) {
  await updateDoc(doc(col, id), { ...patch, updatedAt: Date.now() });
}

// Re-snap: fresh photo + location; the old photo is kept as a snap
export async function resnapItem(item, { photo, thumb, location, by = 'self', restingOn = '', extras = [] }) {
  const now = Date.now();
  const logId = `log_${now}`;
  const history = [...(item.history || []), { location, at: now }].slice(-100);
  await updateDoc(doc(col, item.id), {
    photo, thumb, thumbV: THUMB_V, location, restingOn, needsPlace: !location,
    lastSeenAt: now, updatedAt: now, history, capturedBy: by, logId, photoCount: 1 + extras.length,
  });
  await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId: item.id, logId, photo, thumb, location, at: now, by });
  await writeExtras(item.id, logId, extras, location, now, by);
}

// 2026-09-14 (Ravi): one log can hold several photos — a close-up and a wide shot. A later
// photo joins the CURRENT log: same place, same time, no question, no AI. Cap LOG_MAX.
export const LOG_MAX = 6; // cover + up to 5 more (Ravi 09-15: "only 2 in one go" was 4 - cover - 1)
export async function addSnapToLog(item, { photo, thumb, by = 'self' }) {
  const count = item.photoCount || 1;
  if (count >= LOG_MAX) return false;
  // Things logged before 2026-09-14 have no logId (audit D2: Add photo silently did nothing
  // on every one of Ravi's items). Give the current log one now; the cover stays the cover.
  const logId = item.logId || `log_${item.lastSeenAt || Date.now()}`;
  // Real capture time (2026-09-16, Ravi: the when line must change as the roll is swiped —
  // photos in one log can be days apart). Before this the time was faked to the log's own,
  // so photos added before 09-16 all show the day they were first logged.
  const at = Date.now();
  await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId: item.id, logId, photo, thumb, location: item.location || '', at, by, extra: true });
  await updateDoc(doc(col, item.id), { photoCount: count + 1, logId, updatedAt: Date.now() });
  return true;
}

// Remove one photo from a thing (Ravi, 2026-09-14). Soft: the snap keeps its data under
// `deleted` so Undo can bring it back; purgeItem sweeps it with the rest. If the removed
// photo was the cover, the newest remaining photo becomes the cover. Returns what changed,
// so Undo can put it back exactly.
export async function removeSnap(item, snap, snaps) {
  const rest = snaps.filter((s) => s.id !== snap.id && !s.deleted).sort((a, b) => b.at - a.at);
  const patch = {};
  const wasCover = snap.photo === item.photo || (snap.logId && snap.logId === item.logId && !snap.extra);
  if (wasCover && rest[0]) {
    const next = rest[0];
    Object.assign(patch, { photo: next.photo, thumb: next.thumb, thumbV: THUMB_V, location: next.location || item.location, lastSeenAt: next.at, logId: next.logId || next.id });
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
export async function absorbInto(existing, provisionalId, { photo, thumb, location, restingOn = '', by = 'self', extras = [] }) {
  await resnapItem(existing, { photo, thumb, location, restingOn, by, extras });
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
  return [...counts.entries()]
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
export const PLACE_PHOTOS = 3;
export async function addPlace(name, places = [], photos = []) {
  const n = name.trim();
  if (!n) return null;
  const dup = places.find((p) => p.name.toLowerCase() === n.toLowerCase());
  if (dup) { if (photos.length) await addPlacePhotos(dup, photos); return dup.id; }
  const now = Date.now();
  const ref = await addDoc(col, { kind: 'place', household: HOUSEHOLD, name: n, order: now, createdAt: now, parent: null,
    photos: photos.slice(0, PLACE_PHOTOS).map((p) => ({ ...p, at: now })) });
  return ref.id;
}
export async function addPlacePhotos(place, photos) {
  const now = Date.now();
  const next = [...(place.photos || []), ...photos.map((p) => ({ ...p, at: now }))].slice(0, PLACE_PHOTOS);
  await updateDoc(doc(col, place.id), { photos: next, updatedAt: now });
  return next.length - (place.photos || []).length;
}
export async function removePlacePhoto(place, index) {
  const next = (place.photos || []).filter((_, i) => i !== index);
  await updateDoc(doc(col, place.id), { photos: next, updatedAt: Date.now() });
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
  await updateDoc(doc(col, place.id), { name: n });
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
  for (const r of DEFAULT_ROUTINES) await addDoc(col, { kind: 'routine', household: HOUSEHOLD, active: true, ...r, createdAt: Date.now() });
}
export async function addRoutine(r) {
  await addDoc(col, { kind: 'routine', household: HOUSEHOLD, active: true, createdAt: Date.now(), ...r });
}
export async function updateRoutine(id, patch) { await updateDoc(doc(col, id), patch); }
export async function deleteRoutine(id) { await deleteDoc(doc(col, id)); }

// A check is a photo taken for a routine. claim = what the AI could honestly say.
export async function addCheck({ routineId, photo, thumb, claim, retakes = 0, by = 'self' }) {
  const now = Date.now();
  const ref = await addDoc(col, {
    kind: 'check', household: HOUSEHOLD, routineId, photo, thumb, claim, retakes, by, at: now, dayKey: dayKey(new Date(now)),
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
    type, ...meta, household: HOUSEHOLD,
    at: now.getTime(), dayKey: dayKey(now), hour: now.getHours(), timeOfDay: timeOfDay(now),
    deviceId: deviceId(), sessionId: SESSION_ID, role: ROLE, schema: EVENT_SCHEMA,
  }).catch(() => {});
}

export async function exportEvents() {
  const snap = await getDocs(query(eventsCol, orderBy('at', 'asc')));
  return snap.docs.map((d) => d.data());
}
