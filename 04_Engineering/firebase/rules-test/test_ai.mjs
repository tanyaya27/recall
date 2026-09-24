// MVP step 1 (2026-09-24): the ai callable on the real emulators — model/size clamps, the
// per-person daily limit and the project-wide breaker. Run with .env.local:
// AI_DAILY_PER_PERSON=2, AI_DAILY_TOTAL=5, and a fake ANTHROPIC_KEY in .secret.local
// (Anthropic answers 401 → 'internal', which is fine: the limit is counted BEFORE the call).
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, signOut } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
const app = initializeApp({ projectId: 'recall-test', apiKey: 'fake' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const fns = getFunctions(app, 'us-central1'); connectFunctionsEmulator(fns, '127.0.0.1', 5001);
const ai = httpsCallable(fns, 'ai');
const body = { model: 'claude-haiku-4-5-20251001', max_tokens: 50, messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] };
let fails = 0;
const expect = async (label, p, code) => {
  let got; try { await p; got = 'ok'; } catch (e) { got = (e.code || '').replace('functions/', '') + (e.message ? ' ' + e.message.slice(0, 50) : ''); }
  const pass = got.startsWith(code); if (!pass) fails++; console.log((pass ? 'PASS  ' : 'FAIL  ') + label + ' → ' + got);
};
await signInAnonymously(auth); const A = auth.currentUser.uid;
await expect('A call 1 (counted, then Anthropic rejects the fake key)', ai({ body }), 'internal');
await expect('A call 2 (counted)', ai({ body }), 'internal');
await expect('A call 3 → daily limit', ai({ body }), 'resource-exhausted daily-limit');
await expect('A asks for 2 messages → refused before counting', ai({ body: { messages: [{ role: 'user', content: [] }, { role: 'assistant', content: [] }] } }), 'invalid-argument');
await expect('A sends a tool block → refused', ai({ body: { messages: [{ role: 'user', content: [{ type: 'tool_result' }] }] } }), 'invalid-argument');
await signOut(auth); await signInAnonymously(auth); const B = auth.currentUser.uid;
await expect('B call 1 (counted; total 3)', ai({ body }), 'internal');
await expect('B passes A as owner without a grant → still B\'s own limit (total 4)', ai({ body, ownerUid: A }), 'internal');
await signOut(auth); await signInAnonymously(auth);
await expect('C call 1 (total 5)', ai({ body }), 'internal');
await expect('C call 2 → project breaker', ai({ body }), 'resource-exhausted service-limit');
// An owner with her own stored key is never counted against ReCall's limits.
const env = await initializeTestEnvironment({ projectId: 'recall-test', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 } });
await signOut(auth); await signInAnonymously(auth); const D = auth.currentUser.uid;
await env.withSecurityRulesDisabled(async (ctx) => { const { setDoc } = await import('firebase/firestore'); await setDoc(doc(ctx.firestore(), 'recall_secrets', D), { aiKey: 'sk-ant-own-not-real' }); });
await expect('D (own key) call past the project breaker → not counted, reaches Anthropic', ai({ body }), 'internal');
// Clients cannot read the counters.
const cdb = getFirestore(app); connectFirestoreEmulator(cdb, '127.0.0.1', 8080);
const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
await expect('D reads her usage counter → denied', getDoc(doc(cdb, 'recall_usage', `${D}_${day}`)), 'permission-denied');
await env.cleanup();
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
