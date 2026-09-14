export const getAuth = () => ({});
export const signInAnonymously = async () => ({ user: { uid: 'rig' } });
export const onAuthStateChanged = (auth, cb) => { setTimeout(() => cb({ uid: 'rig' }), 0); return () => {}; };
export const setPersistence = async () => {};
export const inMemoryPersistence = {};
