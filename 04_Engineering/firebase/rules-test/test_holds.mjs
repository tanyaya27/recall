// "It holds things" (2026-09-27): the owner and a whole-ReCall helper may set `holds` on a shared thing; nobody else;
// never on a private thing by a helper. A helper may create a new box (holds: true) and a place with a parent (the camera).
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
const rules = readFileSync(process.env.RULES || '../firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const DAD = 'dadUID000000000000000000000', ME = 'eTbA20pGnfSWFZ8ZkqNwrMkUvvF3', X = 'strangerUID0000000000000000';
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const it = (id, name, priv = false) => setDoc(doc(db, 'recall_items', id), { kind: 'item', owner: DAD, by: DAD, private: priv, roles: {}, sharedWith: [], name, location: 'Hall', lastSeenAt: 1 });
  await it('tin', 'blue tin'); await it('pass', 'passport', true);
  await setDoc(doc(db, 'recall_grants', `${DAD}_${ME}`), { grantor: DAD, grantee: ME, role: 'editor', createdAt: 1 });
});
const ctx = (uid) => env.authenticatedContext(uid).firestore();
let pass = 0, fail = 0;
const expect = async (label, want, p) => { let got; try { await p; got = 'ALLOW'; } catch (e) { got = 'DENY'; } const ok = got === want; ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} → ${got}${ok ? '' : ` (wanted ${want})`}`); };
const dad = ctx(DAD), me = ctx(ME), x = ctx(X);
const col = (db) => collection(db, 'recall_items');
await expect('owner marks the tin "holds things"', 'ALLOW', updateDoc(doc(col(dad), 'tin'), { holds: true, updatedAt: 2 }));
await expect('helper (Can help) marks a shared thing', 'ALLOW', updateDoc(doc(col(me), 'tin'), { holds: false, updatedAt: 3 }));
await expect('helper marks a PRIVATE thing', 'DENY', updateDoc(doc(col(me), 'pass'), { holds: true, updatedAt: 3 }));
await expect('stranger marks a thing', 'DENY', updateDoc(doc(col(x), 'tin'), { holds: true, updatedAt: 3 }));
await expect('helper sets holds AND something not allowed (owner)', 'DENY', updateDoc(doc(col(me), 'tin'), { holds: true, owner: ME }));
await expect('helper creates a new box from the camera (holds: true)', 'ALLOW', addDoc(col(me), { kind: 'item', owner: DAD, by: ME, private: false, roles: {}, sharedWith: [], name: 'sewing tin', location: 'Hall closet shelf', holds: true, lastSeenAt: 4 }));
await expect('helper creates a place with a parent place', 'ALLOW', addDoc(col(me), { kind: 'place', owner: DAD, by: ME, private: false, name: 'Top shelf', order: 4, createdAt: 4, parent: 'pl1', photos: [] }));
console.log(`\n${pass}/${pass + fail} as expected`);
await env.cleanup();
