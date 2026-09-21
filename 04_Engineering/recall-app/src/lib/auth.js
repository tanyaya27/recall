// Identity (multi-user Phase 1, 2026-09-19 — PLAN_2026-09-19_multi-user.md).
//
// A person is a Firebase uid. Margaret starts anonymous (nothing to type) and upgrades IN
// PLACE — linking keeps the uid, so every doc she owns stays hers — the first time she shares
// or adds a second device. Peter signs in with Apple/Google before he can hold a role. The uid
// is the `owner` on every doc and the key in every roles map; nothing else identifies a person.
//
// HOW the sign-in happens (2026-09-21, after Dad's phone did nothing on the button): Firebase's
// own redirect flow needs cross-site storage on its auth domain, which Safari 16.1+ blocks
// unless the app is served from that domain — and ReCall lives on GitHub Pages. So Google
// sign-in is a plain OpenID redirect from OUR page to accounts.google.com and straight back to
// our URL with an ID token in the fragment (same origin, nothing cross-site), and that token
// is handed to Firebase (link for an anonymous user, sign-in otherwise). Apple later, the same
// way. Firebase's redirect stays as the fallback when no client id is configured (the rig).
import { getAuth, onAuthStateChanged, linkWithRedirect, signInWithRedirect, getRedirectResult,
  linkWithCredential, signInWithCredential, updateProfile, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { app, GOOGLE_CLIENT_ID } from './firebase.js';

let current = null;
const subs = new Set();
export function me() { return current ? current.uid : null; }
export function currentUser() { return current; }
export function isAnonymous() { return !current || !!current.isAnonymous; }
export function onUser(cb) { subs.add(cb); if (current) cb(current); return () => subs.delete(cb); }
export function watchUser() {
  const auth = getAuth(app);
  return onAuthStateChanged(auth, (u) => { current = u; subs.forEach((cb) => cb(u)); });
}

// The last attempt, for Settings' For support line and for the toast: { at, stage, error }.
const LOG = 'recall-signin-log';
function note(stage, error) { try { localStorage.setItem(LOG, JSON.stringify({ at: Date.now(), stage, error: error ? String(error.code || error.message || error) : null })); } catch { /* */ } }
export function lastSignIn() { try { return JSON.parse(localStorage.getItem(LOG) || 'null'); } catch { return null; } }

const PENDING = 'recall-signin'; // { kind, state, nonce, at } — localStorage: sessionStorage does not reliably survive a home-screen app's round trip
function provider(kind) {
  if (kind === 'google') return new GoogleAuthProvider();
  const p = new OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p;
}
const rand = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
export function redirectUri() { return `${location.origin}${location.pathname}`; }

// Start the sign-in. Throws (with a Firebase-style code) so the button can say what happened.
export async function signIn(kind) {
  const auth = getAuth(app);
  note('start:' + kind);
  if (kind === 'google' && GOOGLE_CLIENT_ID && !(typeof window !== 'undefined' && window.__rig)) { // the rig has no Google to go to; it takes the Firebase path against its auth stub
    const state = rand(), nonce = rand();
    try { localStorage.setItem(PENDING, JSON.stringify({ kind, state, nonce, at: Date.now() })); } catch { /* */ }
    const q = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: redirectUri(), response_type: 'id_token', scope: 'openid email profile', nonce, state, prompt: 'select_account' });
    note('redirect:google');
    location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`);
    return null;
  }
  const p = provider(kind);
  try { localStorage.setItem(PENDING, JSON.stringify({ kind, firebase: true, at: Date.now() })); } catch { /* */ }
  try {
    if (auth.currentUser && auth.currentUser.isAnonymous) return await linkWithRedirect(auth.currentUser, p);
    return await signInWithRedirect(auth, p);
  } catch (e) { note('redirect-failed:' + kind, e); throw e; }
}

// The ID token Google sent back in the fragment, captured at script start (before the router
// touches the URL) and taken off the address bar so a reload cannot replay it.
let returned = null;
(() => {
  try {
    if (typeof location === 'undefined' || !location.hash || !/id_token=/.test(location.hash)) return;
    const h = new URLSearchParams(location.hash.slice(1));
    returned = { idToken: h.get('id_token'), state: h.get('state'), error: h.get('error') };
    history.replaceState(null, '', location.pathname + location.search);
  } catch { /* */ }
})();
function claims(idToken) { try { return JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return {}; } }

// Called once on boot. Returns { user, linked, orphaned? } or null when no sign-in was pending.
// The one failure that matters: `auth/credential-already-in-use` — this Google account already
// has a uid (a second phone that upgraded first, or Peter's own). Then we sign in AS that uid
// and the anonymous one is orphaned; Phase 3's claimAnonymous callable moves its docs over.
export async function finishSignIn() {
  const auth = getAuth(app);
  let pending = null; try { pending = JSON.parse(localStorage.getItem(PENDING) || 'null'); } catch { /* */ }
  if (!pending) return null;
  if (!pending.firebase) {
    if (!returned) { if (Date.now() - (pending.at || 0) > 15 * 60000) { try { localStorage.removeItem(PENDING); } catch { /* */ } } return null; } // came back with nothing (or never left): keep the pending marker for a few minutes
    try { localStorage.removeItem(PENDING); } catch { /* */ }
    if (returned.error) { note('google-error', returned.error); throw new Error(returned.error); }
    if (returned.state !== pending.state) { note('state-mismatch'); throw new Error('auth/state-mismatch'); }
    const cred = GoogleAuthProvider.credential(returned.idToken);
    const c = claims(returned.idToken);
    const finish = async (user) => { if (!user.displayName && c.name) { try { await updateProfile(user, { displayName: c.name, photoURL: c.picture || null }); } catch { /* */ } } current = auth.currentUser; subs.forEach((cb) => cb(current)); };
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        const r = await linkWithCredential(auth.currentUser, cred);
        await finish(r.user); note('linked'); return { user: r.user, linked: true };
      }
      const r = await signInWithCredential(auth, cred);
      await finish(r.user); note('signed-in'); return { user: r.user, linked: false };
    } catch (e) {
      if (e && e.code === 'auth/credential-already-in-use') {
        const r = await signInWithCredential(auth, cred);
        await finish(r.user); note('signed-in:existing'); return { user: r.user, linked: false, orphaned: true };
      }
      note('link-failed', e); throw e;
    }
  }
  try { localStorage.removeItem(PENDING); } catch { /* */ }
  try {
    const res = await getRedirectResult(auth);
    note(res ? 'linked:firebase' : 'no-result:firebase');
    return res ? { user: res.user, linked: true } : null;
  } catch (e) {
    if (e && e.code === 'auth/credential-already-in-use') {
      const cred = (pending.kind === 'google' ? GoogleAuthProvider : OAuthProvider).credentialFromError(e);
      if (cred) { const r = await signInWithCredential(auth, cred); note('signed-in:existing'); return { user: r.user, linked: false, orphaned: true }; }
    }
    note('redirect-result-failed', e); throw e;
  }
}
