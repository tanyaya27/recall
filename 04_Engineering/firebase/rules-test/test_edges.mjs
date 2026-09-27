// Edges as first-class records (2026-09-26). Owner Dad; Ravi holds a whole-ReCall editor grant; Stranger none.
// Real rules engine. Prints PASS/FAIL per expectation.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, addDoc, updateDoc, getDocs, collection, query, where, getDoc, deleteDoc } from 'firebase/firestore';

const rules = readFileSync(process.env.RULES || '../firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const DAD = 'dadUID000000000000000000000', ME = 'eTbA20pGnfSWFZ8ZkqNwrMkUvvF3', X = 'strangerUID0000000000000000';
const E = (from, to, extra = {}) => ({ kind: 'edge', rel: 'in', from, to, since: 1, until: null, how: 'chosen', owner: DAD, by: DAD, private: false, roles: {}, sharedWith: [], ...extra });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const it = (id, name, priv = false) => setDoc(doc(db, 'recall_items', id), { kind: 'item', owner: DAD, by: DAD, private: priv, roles: {}, sharedWith: [], name, location: 'Hall', lastSeenAt: 1 });
  await it('card', 'baseball card'); await it('box', 'wooden box'); await it('pass', 'passport', true);
  await setDoc(doc(db, 'recall_items', 'e1'), E('card', { t: 'thing', id: 'box', name: 'wooden box' }));
  await setDoc(doc(db, 'recall_items', 'eP'), E('pass', { t: 'place', name: 'Desk' }, { private: true }));
  await setDoc(doc(db, 'recall_grants', `${DAD}_${ME}`), { grantor: DAD, grantee: ME, role: 'editor', createdAt: 1 });
});
const ctx = (uid) => env.authenticatedContext(uid).firestore();
let pass = 0, fail = 0;
const expect = async (label, want, p) => { let got; try { await p; got = 'ALLOW'; } catch (e) { got = 'DENY'; } const ok = got === want; ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} → ${got}${ok ? '' : ` (wanted ${want})`}`); };
const dad = ctx(DAD), me = ctx(ME), x = ctx(X);
const col = (db) => collection(db, 'recall_items');

await expect('owner creates an edge (card in box)', 'ALLOW', addDoc(col(dad), E('box', { t: 'place', name: 'Crawl space' })));
await expect('owner creates a private edge for a private thing', 'ALLOW', addDoc(col(dad), E('pass', { t: 'thing', id: 'box', name: 'wooden box' }, { private: true })));
await expect('helper (grant editor) creates an edge for a shared thing', 'ALLOW', addDoc(col(me), E('card', { t: 'place', name: 'Desk' }, { by: ME })));
await expect('helper creates an edge for a PRIVATE thing', 'DENY', addDoc(col(me), E('pass', { t: 'place', name: 'Desk' }, { by: ME, private: true })));
await expect('helper creates an edge claiming private:false for a private thing', 'DENY', addDoc(col(me), E('pass', { t: 'place', name: 'Desk' }, { by: ME })));
await expect('helper creates an edge owned by someone else than the thing\'s owner', 'DENY', addDoc(col(me), E('card', { t: 'place', name: 'Desk' }, { by: ME, owner: ME })));
await expect('edge with by != me', 'DENY', addDoc(col(me), E('card', { t: 'place', name: 'Desk' })));
await expect('stranger creates an edge', 'DENY', addDoc(col(x), E('card', { t: 'place', name: 'Desk' }, { by: X })));
await expect('edge with roles on a private edge (inconsistent)', 'DENY', addDoc(col(dad), E('pass', { t: 'place', name: 'Desk' }, { private: true, roles: { [ME]: 'viewer' }, sharedWith: [ME] })));
await expect('helper closes an edge (until, closedBy)', 'ALLOW', updateDoc(doc(col(me), 'e1'), { until: 5, closedBy: ME }));
await expect('helper redirects an edge (to)', 'DENY', updateDoc(doc(col(me), 'e1'), { to: { t: 'place', name: 'Garage' } }));
await expect('helper makes an edge private', 'DENY', updateDoc(doc(col(me), 'e1'), { private: true }));
await expect('helper deletes an edge', 'DENY', deleteDoc(doc(col(me), 'e1')));
await expect('owner syncs an edge\'s privacy', 'ALLOW', updateDoc(doc(col(dad), 'e1'), { private: true }));
await expect('owner deletes an edge', 'ALLOW', deleteDoc(doc(col(dad), 'e1')));
await expect('helper lists dad\'s shared docs incl. edges (kind in … edge)', 'ALLOW', getDocs(query(col(me), where('owner', '==', DAD), where('private', '==', false), where('kind', 'in', ['item', 'routine', 'check', 'place', 'edge']))));
await expect('helper reads a private edge', 'DENY', getDoc(doc(col(me), 'eP')));
await expect('stranger reads an edge', 'DENY', getDoc(doc(col(x), 'eP')));
await expect('owner lists own docs incl. edges', 'ALLOW', getDocs(query(col(dad), where('owner', '==', DAD), where('kind', 'in', ['item', 'routine', 'check', 'place', 'edge']))));
await expect('L2 shared-with-me query incl. edge kind', 'ALLOW', getDocs(query(col(me), where('sharedWith', 'array-contains', ME), where('kind', 'in', ['item', 'routine', 'check', 'place', 'edge']))));
await expect('legacy query incl. edge kind', 'ALLOW', getDocs(query(col(me), where('household', '==', 'default'), where('kind', 'in', ['item', 'routine', 'check', 'place', 'edge']))));
console.log(`\n${pass}/${pass + fail} passed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
