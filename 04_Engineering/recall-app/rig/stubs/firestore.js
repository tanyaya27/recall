// In-memory Firestore for the review rig — Phase 1 (2026-09-19): several collections, the
// query operators db.js uses, getDoc/setDoc/writeBatch/runTransaction, and a PERMISSION TABLE
// that mirrors firestore.rules so the audit can prove what each role can and cannot do.
// Writes that the rules would refuse throw { code: 'permission-denied' }, like the SDK.
const stores = new Map(); // collection name -> Map(id -> data)
const listeners = new Set();
let seq = 0;
// The store survives a page reload (localStorage) so the audit can boot the app "as" several
// people over ONE store — two phones, one Firestore. `__rig.reset()` clears it.
const LS = 'rig-store';
function load() { try { const raw = localStorage.getItem(LS); if (!raw) return; const obj = JSON.parse(raw); Object.entries(obj.cols).forEach(([n, m]) => stores.set(n, new Map(Object.entries(m)))); seq = obj.seq || 0; } catch { /* fresh */ } }
function save() { try { const cols = {}; stores.forEach((m, n) => { cols[n] = Object.fromEntries(m); }); localStorage.setItem(LS, JSON.stringify({ cols, seq })); } catch { /* quota: the rig's photos are small */ } }
if (typeof window !== 'undefined') load();
let enforce = (typeof localStorage !== 'undefined' && localStorage.getItem('rig-rules') === '1'); // the audit turns rules on once it seeds; the default rig runs open
const S = (name) => { if (!stores.has(name)) stores.set(name, new Map()); return stores.get(name); };
const auth = () => (typeof window !== 'undefined' && window.__rig && window.__rig.auth) ? window.__rig.auth.me() : 'rig';

export const initializeFirestore = () => ({ __rig: true });
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
export const collection = (dbx, name) => ({ __col: name });
export const doc = (colOrDb, a, b) => (colOrDb && colOrDb.__col) ? { __col: colOrDb.__col, __doc: a || `d${++seq}` } : { __col: a, __doc: b || `d${++seq}` };
export const query = (col, ...clauses) => ({ __col: col.__col, __q: clauses.filter(Boolean) });
export const where = (field, op, value) => ({ field, op, value });
export const orderBy = () => null;
export const limit = () => null;
export const arrayUnion = (...v) => ({ __arrayUnion: v });
export const arrayRemove = (...v) => ({ __arrayRemove: v });
export const deleteField = () => ({ __delete: true });

function matches(data, q) {
  return (q.__q || []).every(({ field, op, value }) => {
    const v = field.includes('.') ? field.split('.').reduce((o, k) => (o || {})[k], data) : data[field];
    if (op === '==') return v === value;
    if (op === '!=') return v !== value;
    if (op === 'in') return value.includes(v);
    if (op === 'array-contains') return Array.isArray(v) && v.includes(value);
    return true;
  });
}
function docsOf(q) { return [...S(q.__col).entries()].filter(([, d]) => matches(d, q)).map(([id, d]) => ({ id, data: () => ({ ...d }), ref: { __col: q.__col, __doc: id } })); }
function notify() { save(); listeners.forEach((l) => l()); }
function applyPatch(cur, patch) {
  const next = { ...cur };
  Object.entries(patch).forEach(([k, v]) => {
    if (v && v.__arrayUnion) next[k] = [...new Set([...(cur[k] || []), ...v.__arrayUnion])];
    else if (v && v.__arrayRemove) next[k] = (cur[k] || []).filter((x) => !v.__arrayRemove.includes(x));
    else if (v && v.__delete) delete next[k];
    else next[k] = v;
  });
  return next;
}

// ---------- permission table = firestore.rules, in JS ----------
const deny = (why) => { const e = new Error('permission-denied: ' + why); e.code = 'permission-denied'; throw e; };
const EDITOR_KEYS = new Set(['name', 'aliases', 'location', 'history', 'photo', 'thumb', 'thumbV', 'restingOn', 'description', 'needsPlace', 'lastSeenAt', 'updatedAt', 'logId', 'photoCount', 'order', 'pinnedOrder', 'naming']);
const grantRole = (owner, me) => { const g = S('recall_grants').get(`${owner}_${me}`); return g ? g.role : null; };
const canRead = (d, me) => d.owner === me || ['viewer', 'editor'].includes((d.roles || {})[me]) || (d.private === false && !!grantRole(d.owner, me));
const canEdit = (d, me) => d.owner === me || (d.roles || {})[me] === 'editor' || (d.private === false && grantRole(d.owner, me) === 'editor');
const consistent = (d) => { const keys = Object.keys(d.roles || {}).sort().join(','); const arr = [...(d.sharedWith || [])].sort().join(','); return keys === arr && (!d.private || keys === ''); };
const itemOf = (s) => S('recall_items').get(s.itemId) || null;
function checkCreate(colName, data, me) {
  if (!enforce) return;
  if (colName === 'recall_events') return;
  if (colName === 'recall_grants' || colName === 'recall_invites') deny('functions only');
  if (colName === 'recall_users') return;
  if (colName !== 'recall_items') return;
  if (data.kind === 'snap') { const it = itemOf(data); if (!it || !canEdit(it, me) || data.by !== me) deny('snap: not an editor of its item'); return; }
  if (data.kind === 'place') { if (data.owner !== me && grantRole(data.owner, me) !== 'editor') deny('place: not owner/editor'); return; }
  if (!(data.owner === me || grantRole(data.owner, me) === 'editor')) deny('create: not owner/editor');
  if (!consistent(data)) deny('create: roles/sharedWith/private inconsistent');
  if (data.by !== me) deny('create: by must be me');
}
function checkUpdate(colName, cur, next, patch, me) {
  if (!enforce) return;
  if (colName === 'recall_grants') { if (cur.grantor !== me || Object.keys(patch).some((k) => k !== 'role')) deny('grant: only the grantor changes role'); return; }
  if (colName === 'recall_invites') deny('functions only');
  if (colName !== 'recall_items') return;
  if (cur.kind === 'snap') { const it = itemOf(cur); if (!it) deny('snap: orphan'); if (it.owner === me) return; if (canEdit(it, me) && Object.keys(patch).every((k) => ['deleted', 'deletedAt'].includes(k))) return; deny('snap: editor may only soft-delete'); }
  if (cur.owner === me) { if (next.owner !== me) deny('transfer is a callable'); if (!consistent(next)) deny('update: inconsistent'); return; }
  if (canEdit(cur, me) && Object.keys(patch).every((k) => EDITOR_KEYS.has(k))) return;
  deny(`update: ${Object.keys(patch).join(',')} not allowed for this role`);
}
function checkDelete(colName, cur, me) {
  if (!enforce) return;
  if (colName === 'recall_grants') { if (cur.grantor !== me) deny('grant: only grantor'); return; }
  if (colName !== 'recall_items') return;
  if (cur.kind === 'snap') { const it = itemOf(cur); if (!it || it.owner !== me) deny('snap delete: owner only'); return; }
  if (cur.owner !== me) deny('delete: owner only');
}
function checkRead(colName, d, me) {
  if (!enforce) return true;
  if (colName === 'recall_grants') return d.grantor === me || d.grantee === me;
  if (colName === 'recall_invites') return false;
  if (colName === 'recall_users' || colName === 'recall_events') return true;
  if (d.kind === 'snap') { const it = itemOf(d); return !!it && canRead(it, me); }
  return canRead(d, me);
}

export async function addDoc(col, data) { const id = `d${++seq}`; checkCreate(col.__col, data, auth()); S(col.__col).set(id, { ...data }); notify(); return { id }; }
export async function setDoc(ref, data, opts) {
  const cur = S(ref.__col).get(ref.__doc);
  if (cur && opts && opts.merge) { const next = applyPatch(cur, data); checkUpdate(ref.__col, cur, next, data, auth()); S(ref.__col).set(ref.__doc, next); }
  else { checkCreate(ref.__col, data, auth()); S(ref.__col).set(ref.__doc, { ...data }); }
  notify();
}
export async function updateDoc(ref, patch) {
  const cur = S(ref.__col).get(ref.__doc) || {};
  const next = applyPatch(cur, patch);
  checkUpdate(ref.__col, cur, next, patch, auth());
  S(ref.__col).set(ref.__doc, next); notify();
}
export async function deleteDoc(ref) { const cur = S(ref.__col).get(ref.__doc); if (cur) checkDelete(ref.__col, cur, auth()); S(ref.__col).delete(ref.__doc); notify(); }
export async function getDoc(ref) { const d = S(ref.__col).get(ref.__doc); const ok = d && checkRead(ref.__col, d, auth()); return { exists: () => !!ok, id: ref.__doc, data: () => (ok ? { ...d } : undefined) }; }
export async function getDocs(q) { const me = auth(); return { docs: docsOf(q).filter((d) => checkRead(q.__col, d.data(), me)) }; }
export function onSnapshot(q, cb) {
  const fire = () => { const me = auth(); cb({ docs: docsOf(q).filter((d) => checkRead(q.__col, d.data(), me)) }); };
  listeners.add(fire); setTimeout(fire, 0); return () => listeners.delete(fire);
}
export function writeBatch() { const ops = []; return { set: (r, d, o) => ops.push(() => setDoc(r, d, o)), update: (r, p) => ops.push(() => updateDoc(r, p)), delete: (r) => ops.push(() => deleteDoc(r)), commit: async () => { for (const op of ops) await op(); } }; }
export async function runTransaction(dbx, fn) { return fn({ get: getDoc, set: setDoc, update: updateDoc, delete: deleteDoc }); }

// Rig helpers
export function __seed(list, colName = 'recall_items') { list.forEach((d) => { const { id, ...rest } = d; S(colName).set(id || `d${++seq}`, { ...rest }); }); notify(); }
export function __dump(colName = 'recall_items') { return [...S(colName).entries()].map(([id, d]) => ({ id, ...d })); }
export function __rules(on) { enforce = !!on; try { localStorage.setItem('rig-rules', on ? '1' : '0'); } catch { /* */ } notify(); }
export function __reset() { stores.clear(); notify(); }
if (typeof window !== 'undefined') { window.__rig = window.__rig || {}; Object.assign(window.__rig, { seed: __seed, dump: __dump, rules: __rules, reset: __reset }); }
