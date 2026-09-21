// Phase 2 rules on the real engine: invites (get by code / list mine / cancel mine), grants
// (leave = grantee delete), and the shared-with-me query that was refused before.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, collection, query, where } from 'firebase/firestore';
const rules = readFileSync('firestore.rules', 'utf8');
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules, host: '127.0.0.1', port: 8080 } });
const M = 'margaret', P = 'peter', L = 'linda', S = 'stranger';
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'recall_items', 's'), { kind: 'item', owner: M, by: M, private: false, roles: { [L]: 'viewer' }, sharedWith: [L], name: 'Scissors', location: 'Hall', lastSeenAt: 1 });
  await setDoc(doc(db, 'recall_invites', 'code1'), { from: M, role: 'editor', itemId: null, createdAt: 1, expiresAt: Date.now() + 1e8, usedBy: null });
  await setDoc(doc(db, 'recall_invites', 'code2'), { from: S, role: 'viewer', itemId: null, createdAt: 1, expiresAt: Date.now() + 1e8, usedBy: null });
  await setDoc(doc(db, 'recall_grants', `${M}_${P}`), { grantor: M, grantee: P, role: 'editor', createdAt: 1 });
});
const as = (u) => env.authenticatedContext(u, { firebase: { sign_in_provider: 'google.com' } }).firestore();
const step = async (label, p, expectAllow = true) => { let ok; try { const r = await p; ok = true; label += r && r.docs ? ` (${r.docs.length} docs)` : ''; } catch (e) { ok = false; } console.log((ok === expectAllow ? 'PASS  ' : 'FAIL  ') + label + (ok ? ' → allowed' : ' → denied')); };
await step('L2 linda: sharedWith array-contains me (no kind filter)', getDocs(query(collection(as(L), 'recall_items'), where('sharedWith', 'array-contains', L))), false);
await step('L2b linda: sharedWith array-contains me + kind in', getDocs(query(collection(as(L), 'recall_items'), where('sharedWith', 'array-contains', L), where('kind', 'in', ['item', 'routine', 'check', 'place']))));
await step('linda getDoc the shared thing', getDoc(doc(as(L), 'recall_items', 's')));
await step('stranger get invite by code (holds the link)', getDoc(doc(as(S), 'recall_invites', 'code1')));
await step('margaret lists her own invites', getDocs(query(collection(as(M), 'recall_invites'), where('from', '==', M))));
await step('stranger lists margaret\'s invites (must DENY)', getDocs(query(collection(as(S), 'recall_invites'), where('from', '==', M))), false);
await step('stranger cancels margaret\'s invite (must DENY)', deleteDoc(doc(as(S), 'recall_invites', 'code1')), false);
await step('margaret cancels her invite', deleteDoc(doc(as(M), 'recall_invites', 'code1')));
await step('peter (grantee) leaves: deletes the grant', deleteDoc(doc(as(P), 'recall_grants', `${M}_${P}`)));
await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'recall_grants', `${M}_${P}`), { grantor: M, grantee: P, role: 'editor', createdAt: 1 }));
await step('stranger deletes that grant (must DENY)', deleteDoc(doc(as(S), 'recall_grants', `${M}_${P}`)), false);
await step('peter changes his own role (must DENY)', updateDoc(doc(as(P), 'recall_grants', `${M}_${P}`), { role: 'owner' }), false);
await step('margaret changes peter\'s role', updateDoc(doc(as(M), 'recall_grants', `${M}_${P}`), { role: 'viewer' }));
await step('anyone creates an invite directly (must DENY)', setDoc(doc(as(M), 'recall_invites', 'code9'), { from: M, role: 'editor' }), false);
await env.cleanup();
