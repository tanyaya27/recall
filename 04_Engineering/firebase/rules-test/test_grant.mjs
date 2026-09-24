// Dad owns everything (adoption ran on his phone); Ravi holds a whole-ReCall editor grant.
// Can Ravi see the grid, load the roll, add a photo, move a thing? Real rules engine.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, addDoc, updateDoc, getDocs, collection, query, where, getDoc, deleteDoc } from 'firebase/firestore';

const rules = readFileSync(process.env.RULES || 'firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const DAD = 'dadUID000000000000000000000', ME = 'eTbA20pGnfSWFZ8ZkqNwrMkUvvF3';

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'recall_items', 'itemA'), { kind: 'item', household: 'default', owner: DAD, by: DAD, private: false, roles: {}, sharedWith: [], name: 'Keys', location: 'Hall', photo: 'p', thumb: 't', lastSeenAt: 1, photoCount: 1, logId: 'log_1' });
  await setDoc(doc(db, 'recall_items', 'itemP'), { kind: 'item', household: 'default', owner: DAD, by: DAD, private: true, roles: {}, sharedWith: [], name: 'Private', location: 'Hall', photo: 'pp', thumb: 't', lastSeenAt: 1, photoCount: 1 });
  await setDoc(doc(db, 'recall_items', 'snapA1'), { kind: 'snap', household: 'default', owner: DAD, by: DAD, itemId: 'itemA', logId: 'log_1', photo: 'p', thumb: 't', location: 'Hall', at: 1 });
  await setDoc(doc(db, 'recall_items', 'placeA'), { kind: 'place', household: 'default', owner: DAD, by: DAD, name: 'Hall', order: 0 });
  await setDoc(doc(db, 'recall_grants', `${DAD}_${ME}`), { grantor: DAD, grantee: ME, role: 'editor', createdAt: 1 });
});

const db = env.authenticatedContext(ME, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const col = collection(db, 'recall_items');
const step = async (label, p) => { try { const r = await p; console.log('ALLOW ', label, r && r.docs ? `(${r.docs.length} docs)` : ''); } catch (e) { console.log('DENY  ', label, '—', (e.message || '').split('\n')[0].slice(0, 120)); } };

await step('L0 grants: grantee==me', getDocs(query(collection(db, 'recall_grants'), where('grantee', '==', ME))));
await step('L3 g:dad: owner==dad, private==false, kind in', getDocs(query(col, where('owner', '==', DAD), where('private', '==', false), where('kind', 'in', ['item', 'routine', 'check', 'place']))));
await step('L3 g:dad without kind filter', getDocs(query(col, where('owner', '==', DAD), where('private', '==', false))));
await step('loadSnaps itemA', getDocs(query(col, where('kind', '==', 'snap'), where('itemId', '==', 'itemA'))));
await step('getDoc private itemP (must DENY)', getDoc(doc(col, 'itemP')));
await step('addSnapToLog: addDoc snap', addDoc(col, { kind: 'snap', owner: DAD, by: ME, itemId: 'itemA', logId: 'log_1', photo: 'p2', thumb: 't2', location: 'Hall', at: 2, extra: true }));
await step('addSnapToLog: updateDoc item photoCount', updateDoc(doc(col, 'itemA'), { photoCount: 2, logId: 'log_1', updatedAt: 3 }));
await step('changeLocation: update item location/history', updateDoc(doc(col, 'itemA'), { location: 'Desk', lastSeenAt: 4, updatedAt: 4, logId: 'log_4' }));
await step('rename', updateDoc(doc(col, 'itemA'), { name: 'Car keys', updatedAt: 5 }));
await step('Several mode: helper sets the place + where it came from (placeSource, 09-24)', updateDoc(doc(col, 'itemA'), { location: 'Hall table', needsPlace: false, placeSource: 'session', updatedAt: 6 }));
await step('MVP #9/#10: helper writes what the label says + written flag', updateDoc(doc(col, 'itemA'), { details: '#8 stainless', written: false, updatedAt: 7 }));
await step('helper sets an unknown field (must DENY)', updateDoc(doc(col, 'itemA'), { valueUSD: 100 }));
await step('addItem into dad\'s ReCall', addDoc(col, { kind: 'item', owner: DAD, by: ME, private: false, roles: {}, sharedWith: [], name: 'New', lastSeenAt: 5 }));
await step('addPlace into dad\'s ReCall', addDoc(col, { kind: 'place', owner: DAD, by: ME, name: 'Desk', order: 1 }));
await step('soft-delete a snap (tidy)', updateDoc(doc(col, 'snapA1'), { deleted: true, deletedAt: 9 }));
await step('setVisibility private (must DENY)', updateDoc(doc(col, 'itemA'), { private: true, roles: {}, sharedWith: [] }));
await step('soft-delete item (must DENY)', updateDoc(doc(col, 'itemA'), { deleted: true, deletedAt: 9 }));
await step('hard delete item (must DENY)', deleteDoc(doc(col, 'itemA')));
await env.cleanup();
