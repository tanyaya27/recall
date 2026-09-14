// In-memory Firestore for the review rig. Enough of the API for db.js: collection/doc/
// addDoc/updateDoc/deleteDoc/onSnapshot(query(where kind in [...]))/getDocs(query(where ==)).
const store = new Map(); // id -> data
const listeners = new Set();
let seq = 0;
export const initializeFirestore = () => ({ __rig: true });
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
export const collection = (dbx, name) => ({ __col: name });
export const doc = (col, id) => ({ __doc: id || `d${++seq}` });
export const query = (col, ...clauses) => ({ __q: clauses.filter(Boolean) });
export const where = (field, op, value) => ({ field, op, value });
export const orderBy = () => null;
export const limit = () => null;
function matches(data, q) {
  return (q.__q || []).every(({ field, op, value }) => {
    const v = data[field];
    if (op === '==') return v === value;
    if (op === 'in') return value.includes(v);
    return true;
  });
}
function docsOf(q) {
  return [...store.entries()].filter(([, d]) => matches(d, q)).map(([id, d]) => ({ id, data: () => ({ ...d }), ref: { __doc: id } }));
}
function notify() { listeners.forEach((l) => l()); }
export async function addDoc(col, data) {
  const id = `d${++seq}`;
  store.set(id, { ...data });
  notify();
  return { id };
}
export async function updateDoc(ref, patch) {
  const cur = store.get(ref.__doc) || {};
  store.set(ref.__doc, { ...cur, ...patch });
  notify();
}
export async function deleteDoc(ref) { store.delete(ref.__doc); notify(); }
export async function getDocs(q) { return { docs: docsOf(q) }; }
export function onSnapshot(q, cb) {
  const fire = () => cb({ docs: docsOf(q) });
  listeners.add(fire);
  setTimeout(fire, 0);
  return () => listeners.delete(fire);
}
// Rig helpers
export function __seed(list) { list.forEach((d) => { store.set(d.id || `d${++seq}`, { ...d }); }); notify(); }
export function __dump() { return [...store.entries()].map(([id, d]) => ({ id, ...d })); }
if (typeof window !== 'undefined') window.__rig = { seed: __seed, dump: __dump };
