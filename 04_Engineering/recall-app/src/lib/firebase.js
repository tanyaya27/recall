// Firebase bootstrap — ReCall's own project, owned by Tanya's Google account.
// This web config is public by design; security comes from Firestore rules.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, inMemoryPersistence } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARIwu-2ui-SERUWSQsUxtLRCriWSBWBDw',
  authDomain: 'recall-d9886.firebaseapp.com',
  projectId: 'recall-d9886',
  storageBucket: 'recall-d9886.firebasestorage.app',
  messagingSenderId: '595363085339',
  appId: '1:595363085339:web:e06619ef8f93de84fdccbe',
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Sign in anonymously, reporting each stage so a hang can be SEEN rather than guessed at
// (2026-09-05: "Opening ReCall…" hung after "Get the latest version" on Ravi's phone; a
// killed-and-reopened page worked). If the normal path — which keeps its state in
// IndexedDB — has not answered within `waitMs`, fall back to in-memory persistence, which
// touches no storage, and say so. The fallback is a mitigation for ONE possible cause;
// the stage record in localStorage is how we find out whether it was the real one.
export function ensureSignedIn(onStage = () => {}, waitMs = 6000) {
  const auth = getAuth(app);
  return new Promise((resolve, reject) => {
    let done = false;
    onStage('auth');
    const finish = (user, how) => { if (done) return; done = true; onStage('signed-in:' + how); resolve(user); };
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) finish(user, 'stored');
      else { onStage('auth:signing-in'); signInAnonymously(auth).catch((e) => { if (!done) { done = true; reject(e); } }); }
    });
    setTimeout(async () => {
      if (done) return;
      onStage('auth:fallback');
      try {
        unsub();
        await setPersistence(auth, inMemoryPersistence);
        const cred = await signInAnonymously(auth);
        finish(cred.user, 'in-memory');
      } catch (e) { if (!done) { done = true; reject(e); } }
    }, waitMs);
  });
}
