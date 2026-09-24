// Runtime: Node 22 (firebase.json); redeploy with --force after changing it.
// ReCall Cloud Functions — multi-user Phase 1 (2026-09-19). Four callables; the client never
// writes grants, invites, secrets or ownership. Design: TECH_BOARD_2026-09-19.md §3–4.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineInt } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';

initializeApp();
const db = getFirestore();
const DAY = 86400000;
const uidOf = (req) => { if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.'); return req.auth.uid; };
const named = (req) => { if (req.auth.token.firebase?.sign_in_provider === 'anonymous') throw new HttpsError('failed-precondition', 'Sign in with Apple or Google first.'); };

// createInvite({ role: 'viewer'|'editor', itemId? }) → { code, url }. 7 days, single use.
export const createInvite = onCall(async (req) => {
  const uid = uidOf(req); named(req);
  const role = req.data?.role; if (!['viewer', 'editor'].includes(role)) throw new HttpsError('invalid-argument', 'role');
  const itemId = req.data?.itemId || null;
  if (itemId) { const it = await db.collection('recall_items').doc(itemId).get(); if (!it.exists || it.data().owner !== uid) throw new HttpsError('permission-denied', 'not your thing'); }
  const code = randomBytes(16).toString('base64url');
  const now = Date.now();
  await db.collection('recall_invites').doc(code).set({ from: uid, role, itemId, createdAt: now, expiresAt: now + 7 * DAY, usedBy: null, usedAt: null });
  return { code, expiresAt: now + 7 * DAY };
});

// acceptInvite({ code }) → { grantor, role, itemId }. Transactional, single-use; the caller must be
// signed in with a provider (an anonymous uid cannot hold a role — it would be lost on reinstall).
export const acceptInvite = onCall(async (req) => {
  const uid = uidOf(req); named(req);
  const code = String(req.data?.code || ''); if (!code) throw new HttpsError('invalid-argument', 'code');
  return db.runTransaction(async (tx) => {
    const ref = db.collection('recall_invites').doc(code);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'This invitation has expired.');
    const inv = snap.data();
    if (inv.usedBy || inv.expiresAt < Date.now()) throw new HttpsError('failed-precondition', 'This invitation has expired.');
    if (inv.from === uid) throw new HttpsError('failed-precondition', 'That is your own invitation.');
    tx.update(ref, { usedBy: uid, usedAt: Date.now() });
    if (inv.itemId) {
      const itRef = db.collection('recall_items').doc(inv.itemId);
      const it = await tx.get(itRef);
      if (!it.exists || it.data().private) throw new HttpsError('failed-precondition', 'This invitation has expired.');
      tx.update(itRef, { [`roles.${uid}`]: inv.role, sharedWith: FieldValue.arrayUnion(uid), updatedAt: Date.now() });
    } else {
      tx.set(db.collection('recall_grants').doc(`${inv.from}_${uid}`), { grantor: inv.from, grantee: uid, role: inv.role, createdAt: Date.now(), via: code });
    }
    return { grantor: inv.from, role: inv.role, itemId: inv.itemId };
  });
});

// transfer({ itemId, to }) → moves a thing and all its snaps to `to`; the old owner becomes an editor.
export const transfer = onCall(async (req) => {
  const uid = uidOf(req);
  const { itemId, to } = req.data || {}; if (!itemId || !to || to === uid) throw new HttpsError('invalid-argument', 'itemId/to');
  const itRef = db.collection('recall_items').doc(itemId);
  const it = await itRef.get(); if (!it.exists || it.data().owner !== uid) throw new HttpsError('permission-denied', 'not your thing');
  const snaps = await db.collection('recall_items').where('kind', '==', 'snap').where('itemId', '==', itemId).get();
  const batch = db.batch();
  const roles = { ...(it.data().roles || {}) }; delete roles[to]; roles[uid] = 'editor';
  batch.update(itRef, { owner: to, private: false, roles, sharedWith: Object.keys(roles), transferredFrom: uid, transferredAt: Date.now(), updatedAt: Date.now() });
  snaps.docs.forEach((s) => batch.update(s.ref, { owner: to }));
  await batch.commit();
  return { moved: snaps.size + 1 };
});

// ai({ ownerUid?, body }) → forwards one Messages call to Anthropic (MVP step 1, 2026-09-24).
//
// Whose key: the ReCall owner's own key if they stored one (setAiKey), otherwise ReCALL'S OWN
// key — the secret ANTHROPIC_KEY — so a new person never has to paste a key. A helper logging
// into someone else's ReCall uses that owner's key only if they hold an editor grant.
//
// What it will forward is fixed here, not by the client: one allowed model, a max_tokens cap,
// one user message, at most 8 images. Anything else is refused — this endpoint spends money.
//
// Limits (anyone can sign in anonymously, so these are the only brake on cost):
//   per person per UTC day: AI_DAILY_PER_PERSON (default 150 calls)
//   the whole project per UTC day: AI_DAILY_TOTAL (default 3000 calls) — a circuit breaker.
// Counters live in recall_usage/{uid}_{yyyymmdd} and recall_usage/_all_{yyyymmdd}; the rules
// grant clients no access to that collection (default deny).
const ANTHROPIC_KEY = defineSecret('ANTHROPIC_KEY');
const AI_DAILY_PER_PERSON = defineInt('AI_DAILY_PER_PERSON', { default: 150 });
const AI_DAILY_TOTAL = defineInt('AI_DAILY_TOTAL', { default: 3000 });
const AI_MODELS = ['claude-haiku-4-5-20251001'];
const AI_MAX_TOKENS = 700;
const AI_MAX_IMAGES = 8;

function cleanBody(body) {
  const b = body || {};
  const model = AI_MODELS.includes(b.model) ? b.model : AI_MODELS[0];
  const msgs = Array.isArray(b.messages) ? b.messages : [];
  if (msgs.length !== 1 || msgs[0].role !== 'user' || !Array.isArray(msgs[0].content)) throw new HttpsError('invalid-argument', 'one user message');
  const content = msgs[0].content.map((c) => {
    if (c && c.type === 'text' && typeof c.text === 'string') return { type: 'text', text: c.text.slice(0, 20000) };
    if (c && c.type === 'image' && c.source && c.source.type === 'base64' && typeof c.source.data === 'string')
      return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: c.source.data } };
    throw new HttpsError('invalid-argument', 'content');
  });
  if (content.filter((c) => c.type === 'image').length > AI_MAX_IMAGES) throw new HttpsError('invalid-argument', 'too many images');
  return { model, max_tokens: Math.min(Number(b.max_tokens) || 500, AI_MAX_TOKENS), messages: [{ role: 'user', content }] };
}

async function spend(uid) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const mine = db.collection('recall_usage').doc(`${uid}_${day}`);
  const all = db.collection('recall_usage').doc(`_all_${day}`);
  await db.runTransaction(async (tx) => {
    const [m, a] = await Promise.all([tx.get(mine), tx.get(all)]);
    const n = m.exists ? m.data().calls || 0 : 0; const t = a.exists ? a.data().calls || 0 : 0;
    if (t >= AI_DAILY_TOTAL.value()) throw new HttpsError('resource-exhausted', 'service-limit');
    if (n >= AI_DAILY_PER_PERSON.value()) throw new HttpsError('resource-exhausted', 'daily-limit');
    tx.set(mine, { uid, day, calls: n + 1, at: Date.now() }, { merge: true });
    tx.set(all, { day, calls: t + 1, at: Date.now() }, { merge: true });
  });
}

export const ai = onCall({ secrets: [ANTHROPIC_KEY], timeoutSeconds: 60 }, async (req) => {
  const uid = uidOf(req);
  const body = cleanBody(req.data?.body);
  let owner = uid;
  const asked = req.data?.ownerUid;
  if (asked && asked !== uid) {
    const g = await db.collection('recall_grants').doc(`${asked}_${uid}`).get();
    if (g.exists && g.data().role === 'editor') owner = asked; // otherwise: the caller's own / ReCall's key
  }
  const sec = await db.collection('recall_secrets').doc(owner).get();
  const own = sec.exists ? sec.data().aiKey : null;
  const key = own || ANTHROPIC_KEY.value();
  if (!key) throw new HttpsError('failed-precondition', 'no-key');
  if (!own) await spend(uid); // ReCall pays → the caller's daily limit applies
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new HttpsError('internal', `AI ${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
});

// setAiKey({ key }) — the owner stores their key server-side; the client never reads it back.
export const setAiKey = onCall(async (req) => {
  const uid = uidOf(req);
  const key = String(req.data?.key || '').trim(); if (!key) throw new HttpsError('invalid-argument', 'key');
  await db.collection('recall_secrets').doc(uid).set({ aiKey: key, updatedAt: Date.now() });
  return { ok: true };
});
