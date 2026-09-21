// Identity (multi-user Phase 1, 2026-09-19 — PLAN_2026-09-19_multi-user.md).
//
// A person is a Firebase uid. Margaret starts anonymous (nothing to type) and upgrades IN
// PLACE — linkWithCredential keeps the uid, so every doc she owns stays hers — the first time
// she shares or adds a second device. Peter signs in with Apple/Google before he can hold a
// role. The uid is the `owner` on every doc and the key in every roles map; nothing else
// identifies a person.
import { getAuth, onAuthStateChanged, linkWithRedirect, signInWithRedirect, getRedirectResult,
  GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { app } from './firebase.js';

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

function provider(kind) {
  if (kind === 'google') return new GoogleAuthProvider();
  const p = new OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p;
}
// Upgrade the anonymous identity, or sign in fresh. Redirect flow: iOS Safari in a home-screen
// app blocks popups. The page reloads; `finishSignIn()` on boot picks up the result.
export async function signIn(kind) {
  const auth = getAuth(app);
  const p = provider(kind);
  try { sessionStorage.setItem('recall-signin', kind); } catch { /* ignore */ }
  if (auth.currentUser && auth.currentUser.isAnonymous) return linkWithRedirect(auth.currentUser, p);
  return signInWithRedirect(auth, p);
}
// Called once on boot. Returns { user, linked } or null. The one failure that matters:
// `auth/credential-already-in-use` — this Apple/Google account already has a uid (a second
// phone that upgraded first). Then we sign in AS that uid and the anonymous one is orphaned;
// Phase 3's claimAnonymous callable moves its docs over.
export async function finishSignIn() {
  const auth = getAuth(app);
  let kind = null; try { kind = sessionStorage.getItem('recall-signin'); sessionStorage.removeItem('recall-signin'); } catch { /* ignore */ }
  if (!kind) return null;
  try {
    const res = await getRedirectResult(auth);
    return res ? { user: res.user, linked: true } : null;
  } catch (e) {
    if (e && e.code === 'auth/credential-already-in-use' && e.customData && e.customData._tokenResponse) {
      // Fall back to a plain sign-in with the same provider next time; the SDK exposes the
      // credential on the error in v9+.
      const cred = (kind === 'google' ? GoogleAuthProvider : OAuthProvider).credentialFromError(e);
      if (cred) { const { signInWithCredential } = await import('firebase/auth'); const r = await signInWithCredential(auth, cred); return { user: r.user, linked: false, orphaned: true }; }
    }
    throw e;
  }
}
