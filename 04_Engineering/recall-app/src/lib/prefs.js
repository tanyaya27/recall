// Per-phone look preferences (board addendum 2026-09-05, §9).
//
// Two things, kept apart on purpose: the PALETTE is a product decision Tanya makes once
// (the picker exists so she can compare on a real phone); TEXT SIZE is a user preference
// forever — the one accessibility setting seniors actually use. Both live on this phone
// only, so Robert's and Margaret's phones can differ. Nothing here touches Firestore.
const KEY = 'recall-prefs';

export const THEMES = [
  { id: 'linen', label: 'Linen' },
  { id: 'slate', label: 'Slate' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'contrast', label: 'High contrast' },
  { id: 'auto', label: 'Match my phone' }, // Linen by day, Dusk when the phone is dark (audit S4)
];
export const SIZES = [
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.18 },
  { id: 'largest', label: 'Largest', scale: 1.38 },
];

// Capture modes (DECISIONS 2026-09-24): which modes the camera offers, where it opens, the last one used.
// 'all' (Everything in view) arrives in MVP step 3; until then only these two exist.
export const CAPTURE_MODES = [
  { id: 'one', label: 'One thing', blurb: 'Name it and say where, one card at a time' },
  { id: 'several', label: 'Several', blurb: 'The camera stays open; fix only what’s wrong' },
];
function captureOf(p) {
  const ids = CAPTURE_MODES.map((m) => m.id);
  const modes = Array.isArray(p.captureModes) ? p.captureModes.filter((m) => ids.includes(m)) : ids;
  const on = modes.length ? modes : ['one'];
  const open = p.captureOpen === 'last' || ids.includes(p.captureOpen) ? p.captureOpen : 'last';
  const last = ids.includes(p.lastMode) ? p.lastMode : on[0];
  return { captureModes: on, captureOpen: open, lastMode: last };
}
// The mode the camera opens in right now: the fixed one, or the last used — always one that is switched on.
export function openingMode(p = getPrefs()) {
  const want = p.captureOpen === 'last' ? p.lastMode : p.captureOpen;
  return p.captureModes.includes(want) ? want : p.captureModes[0];
}

export function getPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) || {};
    return { theme: THEMES.some((t) => t.id === p.theme) ? p.theme : 'linen', size: SIZES.some((s) => s.id === p.size) ? p.size : 'normal',
      density: p.density === 'compact' ? 'compact' : 'normal',
      placeView: ['names', 'small', 'big'].includes(p.placeView) ? p.placeView : null, // null = not chosen yet (round 7)
      showTimes: p.showTimes !== false, // times on photos (thing card, 09-16), on by default
      showAddedBy: p.showAddedBy !== false, // who added each photo, on the stamp (Phase 2, split 4: on by default)
      whose: typeof p.whose === 'string' ? p.whose : null, // which ReCall this phone is looking at: null = mine, else the owner's uid
      ...captureOf(p) };
  } catch { return { theme: 'linen', size: 'normal', density: 'normal', placeView: null, showTimes: true, showAddedBy: true, whose: null, ...captureOf({}) }; }
}

export function savePrefs(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
  applyPrefs(p);
}

// Everything in the stylesheet is in rem, so one number on <html> scales text, buttons
// and tap targets together — a control that does not grow with the text is how targets
// shrink under big type.
let watching = false;
export function applyPrefs(p = getPrefs()) {
  const root = document.documentElement;
  const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)');
  root.dataset.theme = p.theme === 'auto' ? (dark && dark.matches ? 'dusk' : 'linen') : p.theme;
  if (dark && !watching && dark.addEventListener) { watching = true; dark.addEventListener('change', () => applyPrefs()); }
  const size = SIZES.find((s) => s.id === p.size) || SIZES[0];
  root.style.setProperty('--scale', String(size.scale));
  // Compact (Ravi, 2026-09-14 round 4): denser rows and cards; list rows use swipe actions
  // instead of buttons beneath. Off by default — Margaret's screen stays roomy.
  root.dataset.density = p.density || 'normal';
}

