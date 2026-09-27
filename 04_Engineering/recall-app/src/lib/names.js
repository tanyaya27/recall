// Names are normalised for matching: lowercase, "your/the/my" dropped, trailing s dropped.
// (Moved out of db.js 09-26 so the pure graph module can use it without Firestore.)
const DROP = new Set(['your', 'the', 'my', 'a', 'an', 'her', 'his', 'our']);
export function normName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w && !DROP.has(w)).map((w) => w.replace(/s$/, '')).join(' ');
}
