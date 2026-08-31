// Firebase bootstrap — reuses the existing tanya-command-center project.
// This web config is public by design; security comes from Firestore rules.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBU3e5gV7MDMs2z5k7YNcEIJxbFfMrBEKg',
  authDomain: 'tanya-command-center.firebaseapp.com',
  projectId: 'tanya-command-center',
  storageBucket: 'tanya-command-center.firebasestorage.app',
  messagingSenderId: '1070932154654',
  appId: '1:1070932154654:web:e682a544d824750le1d10f',
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
