// ReCall Cloud Functions — multi-user Phase 1 (2026-09-19). Four callables; the client never
// writes grants, invites, secrets or ownership. Design: TECH_BOARD_2026-09-19.md §3–4.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
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

// ai({ ownerUid, body }) → forwards to Anthropic with the OWNER's key (recall_secrets/{owner}).
// The caller must be the owner or an editor of that owner's things (grant or any direct role).
export const ai = onCall({ secrets: [] , timeoutSeconds: 60 }, async (req) => {
  const uid = uidOf(req);
  const owner = req.data?.ownerUid || uid;
  if (owner !== uid) {
    const g = await db.collection('recall_grants').doc(`${owner}_${uid}`).get();
    if (!g.exists || g.data().role !== 'editor') throw new HttpsError('permission-denied', 'not an editor');
  }
  const sec = await db.collection('recall_secrets').doc(owner).get();
  const key = sec.exists ? sec.data().aiKey : null;
  if (!key) throw new HttpsError('failed-precondition', 'The owner has not set an AI key.');
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(req.data.body) });
  const text = await r.text();
  if (!r.ok) throw new HttpsError('internal', `AI ${r.status}`);
  return JSON.parse(text);
});

// setAiKey({ key }) — the owner stores their key server-side; the client never reads it back.
export const setAiKey = onCall(async (req) => {
  const uid = uidOf(req);
  const key = String(req.data?.key || '').trim(); if (!key) throw new HttpsError('invalid-argument', 'key');
  await db.collection('recall_secrets').doc(uid).set({ aiKey: key, updatedAt: Date.now() });
  return { ok: true };
});
