// Cloud Functions client (multi-user Phase 2, 2026-09-21). The four callables live in
// 04_Engineering/firebase/functions/index.js and run in us-central1. The rig aliases
// 'firebase/functions' to stubs/fbfunctions.js, which runs the same logic over the in-memory store.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase.js';

let fns = null;
export async function call(name, data = {}) {
  if (!fns) fns = getFunctions(app, 'us-central1');
  const res = await httpsCallable(fns, name)(data);
  return res.data;
}
