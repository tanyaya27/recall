// Rig stub for firebase/functions: the four callables of functions/index.js over the in-memory
// store, as the Admin SDK would run them (no rules). Keep in step with functions/index.js.
import { __raw } from './firestore.js';
const DAY = 86400000;
const me = () => window.__rig.auth.me();
const anon = () => { try { return localStorage.getItem('rig-anon') !== '0'; } catch { return true; } };
const err = (code, message) => { const e = new Error(message); e.code = 'functions/' + code; e.details = null; throw e; };
const named = () => { if (anon()) err('failed-precondition', 'Sign in with Apple or Google first.'); };
const IMPL = {
  async createInvite({ role, itemId = null }) {
    const uid = me(); named();
    if (!['viewer', 'editor'].includes(role)) err('invalid-argument', 'role');
    if (itemId) { const it = __raw.get('recall_items', itemId); if (!it || it.owner !== uid) err('permission-denied', 'not your thing'); }
    const code = 'inv' + Math.random().toString(36).slice(2, 10);
    const now = Date.now();
    __raw.set('recall_invites', code, { from: uid, role, itemId, createdAt: now, expiresAt: now + 7 * DAY, usedBy: null, usedAt: null });
    return { code, expiresAt: now + 7 * DAY };
  },
  async acceptInvite({ code }) {
    const uid = me(); named();
    const inv = __raw.get('recall_invites', String(code || ''));
    if (!inv) err('not-found', 'This invitation has expired.');
    if (inv.usedBy || inv.expiresAt < Date.now()) err('failed-precondition', 'This invitation has expired.');
    if (inv.from === uid) err('failed-precondition', 'That is your own invitation.');
    __raw.update('recall_invites', code, { usedBy: uid, usedAt: Date.now() });
    if (inv.itemId) {
      const it = __raw.get('recall_items', inv.itemId);
      if (!it || it.private) err('failed-precondition', 'This invitation has expired.');
      __raw.update('recall_items', inv.itemId, { roles: { ...(it.roles || {}), [uid]: inv.role }, sharedWith: [...new Set([...(it.sharedWith || []), uid])], updatedAt: Date.now() });
    } else {
      __raw.set('recall_grants', `${inv.from}_${uid}`, { grantor: inv.from, grantee: uid, role: inv.role, createdAt: Date.now(), via: code });
    }
    return { grantor: inv.from, role: inv.role, itemId: inv.itemId };
  },
  async transfer({ itemId, to }) {
    const uid = me();
    if (!itemId || !to || to === uid) err('invalid-argument', 'itemId/to');
    const it = __raw.get('recall_items', itemId); if (!it || it.owner !== uid) err('permission-denied', 'not your thing');
    const roles = { ...(it.roles || {}) }; delete roles[to]; roles[uid] = 'editor';
    __raw.update('recall_items', itemId, { owner: to, private: false, roles, sharedWith: Object.keys(roles), transferredFrom: uid, transferredAt: Date.now(), updatedAt: Date.now() });
    const snaps = __raw.list('recall_items', (d) => d.kind === 'snap' && d.itemId === itemId);
    snaps.forEach((s) => __raw.update('recall_items', s.id, { owner: to }));
    return { moved: snaps.length + 1 };
  },
  async setAiKey({ key }) { const uid = me(); __raw.set('recall_secrets', uid, { aiKey: key, updatedAt: Date.now() }); return { ok: true }; },
  // MVP step 1 (2026-09-24): as functions/index.js — clamp the body, count the call against the
  // caller's daily limit (window.__rig.aiLimit, default 150), then forward. The forward goes to the
  // real Anthropic URL so the rig's page.route() fake answers it, exactly as for a direct call.
  async ai({ body, ownerUid }) {
    const uid = me();
    const msgs = (body && body.messages) || [];
    if (msgs.length !== 1 || msgs[0].role !== 'user' || !Array.isArray(msgs[0].content)) err('invalid-argument', 'one user message');
    if (msgs[0].content.filter((c) => c.type === 'image').length > 8) err('invalid-argument', 'too many images');
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const own = __raw.get('recall_secrets', ownerUid || uid);
    if (!own) {
      const u = __raw.get('recall_usage', `${uid}_${day}`) || { calls: 0 };
      const cap = (window.__rig && window.__rig.aiLimit) || 150;
      if (u.calls >= cap) err('resource-exhausted', 'daily-limit');
      __raw.set('recall_usage', `${uid}_${day}`, { uid, day, calls: u.calls + 1 });
    }
    window.__rig.aiCalls = (window.__rig.aiCalls || 0) + 1; window.__rig.lastAiOwner = ownerUid || null; window.__rig.lastAiCaller = uid;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': 'rig-service' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: Math.min(body.max_tokens || 500, 700), messages: msgs }) });
    if (!r.ok) err('internal', `AI ${r.status}`);
    return r.json();
  },
};
export const getFunctions = () => ({ __rig: true });
export const httpsCallable = (fns, name) => async (data) => { if (!IMPL[name]) err('not-found', name); return { data: await IMPL[name](data || {}) }; };
if (typeof window !== 'undefined') { window.__rig = window.__rig || {}; window.__rig.functions = IMPL; }
