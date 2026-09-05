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
// new thing. Exact name match, case-insensitive, live things only. Never called silently:
// the photo card shows the match and offers "not your glasses?" before anything merges.
export function findByName(items, name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return null;
  return items.find((it) => !it.deleted && (it.name || '').trim().toLowerCase() === n) || null;
}

// ---------- live data ----------

// One listener; caller gets everything split by kind. Snap photos are heavy, so
// snaps are NOT included here — fetch them per item with loadSnaps().
export function watchAll(cb) {
  const q = query(col, where('kind', 'in', ['item', 'routine', 'check']));
  return onSnapshot(q, (snap) => {
    const out = { items: [], routines: [], checks: [], removed: [] };
    snap.docs.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      if (data.kind === 'routine') out.routines.push(data);
      else if (data.kind === 'check') out.checks.push(data);
      else if (data.deleted) out.removed.push(data);
      else out.items.push(data);
    });
    out.items.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
    out.removed.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    out.routines.sort((a, b) => (a.order || 0) - (b.order || 0));
    out.checks.sort((a, b) => (b.at || 0) - (a.at || 0));
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
export async function addItem({ name = '', location = '', description = '', photo, thumb, by = 'self', restingOn = '', naming = false }) {
  const now = Date.now();
  const ref = await addDoc(col, {
    kind: 'item', household: HOUSEHOLD, name, location, description, photo, thumb, restingOn,
    needsPlace: !location, naming,
    order: now, pinnedOrder: null, createdAt: now, updatedAt: now, lastSeenAt: now, capturedBy: by,
    history: [{ location, at: now }],
  });
  await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId: ref.id, photo, thumb, location, at: now, by });
  return ref.id;
}

export async function nameItem(id, { name = '', description = '', restingOn = '' } = {}) {
  const patch = { naming: false };
  if (name) patch.name = name;
  if (description) patch.description = description;
  if (restingOn) patch.restingOn = restingOn;
  await updateItem(id, patch);
}

export async function updateItem(id, patch) {
  await updateDoc(doc(col, id), { ...patch, updatedAt: Date.now() });
}

// Re-snap: fresh photo + location; the old photo is kept as a snap
export async function resnapItem(item, { photo, thumb, location, by = 'self', restingOn = '' }) {
  const now = Date.now();
  const history = [...(item.history || []), { location, at: now }].slice(-100);
  await updateDoc(doc(col, item.id), {
    photo, thumb, location, restingOn, needsPlace: !location,
    lastSeenAt: now, updatedAt: now, history, capturedBy: by,
  });
  await addDoc(col, { kind: 'snap', household: HOUSEHOLD, itemId: item.id, photo, thumb, location, at: now, by });
}

// A thing saved before its name arrived turned out to be one already on the board, and
// the person confirmed it. Its photo becomes a new photo of the existing thing and the
// provisional doc (and its snap) goes away.
export async function absorbInto(existing, provisionalId, { photo, thumb, location, restingOn = '', by = 'self' }) {
  await resnapItem(existing, { photo, thumb, location, restingOn, by });
  await purgeItem({ id: provisionalId });
}

// Earlier photos of one item, newest first (the "not there?" scroll).
// Fetches every snap (a limit() query needs a composite index — on Tanya's console list),
// prunes beyond SNAPS_KEEP in the background, returns at most SNAPS_SHOW + the current one.
export async function loadSnaps(itemId) {
  const snap = await getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', itemId)));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.at - a.at);
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

export function knownLocations(items, limit = 5) {
  const counts = new Map();
  items.forEach((it) => {
    (it.history || [{ location: it.location, at: it.lastSeenAt }]).forEach(({ location, at }) => {
      if (!location) return;
      const c = counts.get(location) || { n: 0, last: 0 };
      c.n += 1; c.last = Math.max(c.last, at || 0);
      counts.set(location, c);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => (b[1].last - a[1].last) || (b[1].n - a[1].n))
    .slice(0, limit).map(([loc]) => loc);
}

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
function deviceId() {
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
