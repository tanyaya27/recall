// Firebase bootstrap — ReCall's own project, owned by Tanya's Google account.
// This web config is public by design; security comes from Firestore rules.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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

export function ensureSignedIn() {
  const auth = getAuth(app);
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) resolve(user);
      else signInAnonymously(auth).catch(reject);
    });
  });
}
