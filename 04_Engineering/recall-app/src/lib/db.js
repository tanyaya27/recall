// Data layer. Two collections, shared by the whole household (v0 tradeoff —
// any signed-in anonymous user of this Firebase project can read/write; real
// roles arrive in the MVP).
//   recall_items:  one doc per item; latest photo inline (compressed JPEG data URL)
//   recall_events: silent usage log for the one-week test
import {
  collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from './firebase.js';

const itemsCol = collection(db, 'recall_items');
const eventsCol = collection(db, 'recall_events');

export function watchItems(cb) {
  const q = query(itemsCol, orderBy('lastSeenAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.error('watchItems', err));
}

export async function addItem({ name, location, description, photo, thumb, pinned }) {
  const now = Date.now();
  const ref = await addDoc(itemsCol, {
    name, location, description: description || '', photo, thumb,
    pinned: !!pinned, createdAt: now, updatedAt: now, lastSeenAt: now,
    history: [{ location, at: now }],
  });
  return ref.id;
}

export async function updateItem(id, patch) {
  await updateDoc(doc(itemsCol, id), { ...patch, updatedAt: Date.now() });
}

// Re-snap: fresh photo + location for an existing item (UC-7)
export async function resnapItem(item, { photo, thumb, location }) {
  const now = Date.now();
  const history = [...(item.history || []), { location, at: now }].slice(-50);
  await updateDoc(doc(itemsCol, item.id), {
    photo, thumb, location, lastSeenAt: now, updatedAt: now, history,
  });
}

export function logEvent(type, meta = {}) {
  // Fire-and-forget; never block or surface errors to the user (silent logging)
  addDoc(eventsCol, { type, ...meta, at: Date.now() }).catch(() => {});
}

export async function exportEvents() {
  const snap = await getDocs(query(eventsCol, orderBy('at', 'asc')));
  return snap.docs.map((d) => d.data());
}
