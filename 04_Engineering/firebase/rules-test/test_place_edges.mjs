// Place-in-place edges (2026-09-29, the tier audit): a place doc's "is in" is an edge `from` the place id.
// Owner Dad; Ravi holds a whole-ReCall editor grant; a viewer grant; Stranger none. Real rules engine.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, addDoc, updateDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
const rules = readFileSync(process.env.RULES || '../firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const DAD = 'dadUID000000000000000000000', ME = 'eTbA20pGnfSWFZ8ZkqNwrMkUvvF3', V = 'viewerUID00000000000000000', X = 'strangerUID0000000000000000';
const E = (from, to, extra = {}) => ({ kind: 'edge', rel: 'in', from, to, since: 1, until: null, how: 'chosen', owner: DAD, by: DAD, private: false, roles: {}, sharedWith: [], ...extra });
const P = (name, extra = {}) => ({ kind: 'place', owner: DAD, by: DAD, private: false, sharedWith: [], roles: {}, name, order: 1, createdAt: 1, parent: null, photos: [], ...extra });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'recall_items', 'desk'), P('Desk drawer'));
  await setDoc(doc(db, 'recall_items', 'air'), P('In air'));
  await setDoc(doc(db, 'recall_items', 'old'), { kind: 'place', owner: DAD, by: DAD, private: false, name: 'Old shelf', parent: 'air', photos: [] }); // pre-09-29 place: no sharedWith/roles
  await setDoc(doc(db, 'recall_items', 'tin'), { kind: 'item', owner: DAD, by: DAD, private: false, roles: {}, sharedWith: [], name: 'tin box', location: 'Garage', holds: true });
  await setDoc(doc(db, 'recall_items', 'pe1'), E('desk', { t: 'place', name: 'In air' }));
  await setDoc(doc(db, 'recall_grants', `${DAD}_${ME}`), { grantor: DAD, grantee: ME, role: 'editor', createdAt: 1 });
  await setDoc(doc(db, 'recall_grants', `${DAD}_${V}`), { grantor: DAD, grantee: V, role: 'viewer', createdAt: 1 });
});
const ctx = (uid) => env.authenticatedContext(uid).firestore();
let pass = 0, fail = 0;
const expect = async (label, want, p) => { let got; try { await p; got = 'ALLOW'; } catch (e) { got = 'DENY'; } const ok = got === want; ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} → ${got}${ok ? '' : ` (wanted ${want})`}`); };
const dad = ctx(DAD), me = ctx(ME), v = ctx(V), x = ctx(X);
const col = (db) => collection(db, 'recall_items');
await expect('owner: a place is in a place (Desk drawer → In air)', 'ALLOW', addDoc(col(dad), E('desk', { t: 'place', name: 'Office' })));
await expect('owner: a place is in a box (→ tin box)', 'ALLOW', addDoc(col(dad), E('air', { t: 'thing', id: 'tin', name: 'tin box' })));
await expect('owner: an OLD place (no sharedWith/roles) gets its edge (the boot repair)', 'ALLOW', addDoc(col(dad), E('old', { t: 'place', name: 'In air' })));
await expect('owner closes a place edge (re-parent)', 'ALLOW', updateDoc(doc(col(dad), 'pe1'), { until: 5, closedBy: DAD }));
await expect('owner deletes a place edge (Undo of a new place)', 'ALLOW', deleteDoc(doc(col(dad), 'pe1')));
await expect('helper (editor grant) says where a shared place is', 'ALLOW', addDoc(col(me), E('desk', { t: 'place', name: 'Study' }, { by: ME })));
await expect('helper: place edge owned by the helper', 'DENY', addDoc(col(me), E('desk', { t: 'place', name: 'Study' }, { by: ME, owner: ME })));
await expect('viewer says where a place is', 'DENY', addDoc(col(v), E('desk', { t: 'place', name: 'Study' }, { by: V })));
await expect('stranger says where a place is', 'DENY', addDoc(col(x), E('desk', { t: 'place', name: 'Study' }, { by: X })));
await expect('helper lists dad\'s shared docs incl. place edges', 'ALLOW', getDocs(query(col(me), where('owner', '==', DAD), where('private', '==', false), where('kind', 'in', ['item', 'routine', 'check', 'place', 'edge']))));
console.log(`\n${pass}/${pass + fail} passed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
