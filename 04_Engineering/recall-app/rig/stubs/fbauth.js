// Rig auth stub: a switchable uid so the audit can run "as" different people.
let uid = 'rig';
let anonymous = true;
try { uid = localStorage.getItem('rig-uid') || 'rig'; anonymous = localStorage.getItem('rig-anon') !== '0'; } catch { /* */ }
const subs = new Set();
const NAMES = { margaret: 'Margaret Hale', peter: 'Peter Hale', robert: 'Robert Lin', linda: 'Linda Park', ken: 'Ken Ito', newguy: 'Newguy Ng', another: 'Another One', stranger: 'Stranger Danger' };
const user = () => ({ uid, isAnonymous: anonymous, displayName: anonymous ? null : (NAMES[uid] || `User ${uid}`), email: anonymous ? null : `${uid}@example.com` });
export const getAuth = () => ({ get currentUser() { return user(); } });
export const signInAnonymously = async () => ({ user: user() });
export const onAuthStateChanged = (auth, cb) => { subs.add(cb); setTimeout(() => cb(user()), 0); return () => subs.delete(cb); };
export const setPersistence = async () => {};
export const inMemoryPersistence = {};
export class GoogleAuthProvider { static credentialFromError() { return null; } }
export class OAuthProvider { constructor() {} addScope() {} static credentialFromError() { return null; } }
export const linkWithRedirect = async () => { anonymous = false; subs.forEach((cb) => cb(user())); };
export const signInWithRedirect = linkWithRedirect;
export const getRedirectResult = async () => null;
export const signInWithCredential = async () => ({ user: user() });
if (typeof window !== 'undefined') {
  window.__rig = window.__rig || {};
  window.__rig.auth = { as(id, anon = false) { uid = id; anonymous = anon; try { localStorage.setItem('rig-uid', id); localStorage.setItem('rig-anon', anon ? '1' : '0'); } catch { /* */ } subs.forEach((cb) => cb(user())); }, me: () => uid };
}
