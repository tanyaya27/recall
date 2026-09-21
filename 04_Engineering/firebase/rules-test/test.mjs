// Runs the REAL Firestore rules engine (emulator) against the exact writes/reads the app makes
// when Ravi adds a photo to an adopted-legacy thing. Prints allow/deny per step.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, addDoc, updateDoc, getDocs, collection, query, where, getDoc } from 'firebase/firestore';

const rules = readFileSync(process.env.RULES || '/mnt/user-data/uploads/ReCall/04_Engineering/firebase/firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const ME = 'eTbA20pGnfSWFZ8ZkqNwrMkUvvF3';

// Seed like Ravi's data after adoptLegacy(): an item with household:'default' and an owner.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'recall_items', 'itemA'), { kind: 'item', household: 'default', owner: ME, by: ME, private: false, roles: {}, sharedWith: [], name: 'Keys', location: 'Hall', photo: 'p', thumb: 't', lastSeenAt: 1, photoCount: 1, logId: 'log_1', createdAt: 1 });
  await setDoc(doc(db, 'recall_items', 'snapA1'), { kind: 'snap', household: 'default', owner: ME, by: ME, itemId: 'itemA', logId: 'log_1', photo: 'p', thumb: 't', location: 'Hall', at: 1 });
  // An item adopted WITHOUT private/roles/sharedWith (e.g. a place or a pre-adoption shape) to probe consistent()
  await setDoc(doc(db, 'recall_items', 'placeA'), { kind: 'place', household: 'default', owner: ME, by: ME, name: 'Hall', order: 0 });
  await setDoc(doc(db, 'recall_items', 'itemOld'), { kind: 'item', household: 'default', owner: ME, by: ME, name: 'Old shape', lastSeenAt: 1 });
});

const db = env.authenticatedContext(ME, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const col = collection(db, 'recall_items');
const step = async (label, p) => { try { await p; console.log('ALLOW ', label); } catch (e) { console.log('DENY  ', label, '—', (e.message || '').split('\n')[0].slice(0, 160)); } };

await step('L1 mine: owner==me, kind in', getDocs(query(col, where('owner', '==', ME), where('kind', 'in', ['item', 'routine', 'check', 'place']))));
await step('L2 shared: array-contains me', getDocs(query(col, where('sharedWith', 'array-contains', ME))));
await step('Lx legacy: household==default, kind in', getDocs(query(col, where('household', '==', 'default'), where('kind', 'in', ['item', 'routine', 'check', 'place']))));
await step('loadSnaps: kind==snap, itemId==itemA', getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', 'itemA'))));
await step('getDoc itemA', getDoc(doc(col, 'itemA')));
await step('addSnapToLog: addDoc snap', addDoc(col, { kind: 'snap', owner: ME, by: ME, itemId: 'itemA', logId: 'log_1', photo: 'p2', thumb: 't2', location: 'Hall', at: 2, extra: true }));
await step('addSnapToLog: updateDoc item photoCount', updateDoc(doc(col, 'itemA'), { photoCount: 2, logId: 'log_1', updatedAt: 3 }));
await step('update itemOld (no private/roles fields)', updateDoc(doc(col, 'itemOld'), { photoCount: 2, updatedAt: 3 }));
await step('update place', updateDoc(doc(col, 'placeA'), { name: 'Hallway' }));
await step('addItem: addDoc item', addDoc(col, { kind: 'item', owner: ME, by: ME, private: false, roles: {}, sharedWith: [], name: 'New', lastSeenAt: 5, createdAt: 5 }));
await step('addPlace: addDoc place', addDoc(col, { kind: 'place', owner: ME, by: ME, name: 'Desk', order: 1 }));
await step('setVisibility private', updateDoc(doc(col, 'itemA'), { private: true, roles: {}, sharedWith: [] }));
await step('soft delete item', updateDoc(doc(col, 'itemA'), { deleted: true, deletedAt: 9 }));
await step('recall_users upsert', setDoc(doc(db, 'recall_users', ME), { name: null, anonymous: true, lastOpenedAt: 1 }, { merge: true }));
await step('recall_events create', addDoc(collection(db, 'recall_events'), { kind: 'open', by: ME, at: 1 }));
await env.cleanup();
