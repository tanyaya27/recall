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
  { id: 'contrast', label: 'High contrast' },
];
export const SIZES = [
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.18 },
  { id: 'largest', label: 'Largest', scale: 1.38 },
];

export function getPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) || {};
    return { theme: THEMES.some((t) => t.id === p.theme) ? p.theme : 'linen', size: SIZES.some((s) => s.id === p.size) ? p.size : 'normal' };
  } catch { return { theme: 'linen', size: 'normal' }; }
}

export function savePrefs(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
  applyPrefs(p);
}

// Everything in the stylesheet is in rem, so one number on <html> scales text, buttons
// and tap targets together — a control that does not grow with the text is how targets
// shrink under big type.
export function applyPrefs(p = getPrefs()) {
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  const size = SIZES.find((s) => s.id === p.size) || SIZES[0];
  root.style.setProperty('--scale', String(size.scale));
}
