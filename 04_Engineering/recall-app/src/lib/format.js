// Time helpers. Everything the patient sees is conversational; everything the
// research log stores is exact.

export function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 2) return 'an hour ago';
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export const STALE_MS = 3 * 24 * 60 * 60 * 1000;
export function isStale(ts) { return Date.now() - ts > STALE_MS; }

// "Wednesday morning, about 8:20"
export function friendlyNow(d = new Date()) {
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const h = d.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${weekday} ${part}, about ${time}`;
}

// Board copy, 2026-09-05 (Devin's strings).
// The day line: weekday + part of day, no clock — the phone's status bar has the time.
export function dayLine(d = new Date()) {
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const h = d.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return `${weekday} ${part}`;
}

// When a thing was photographed, the way a person says it:
// "this morning, 8:12" · "yesterday evening" · "Tuesday" · "March 3"
export function whenSeen(ts) {
  const d = new Date(ts);
  const now = new Date();
  const h = d.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
  if (sameDay) {
    if (now - d < 2 * 60000) return 'just now';
    return `${part === 'night' ? 'tonight' : `this ${part}`}, ${time}`;
  }
  if (d.toDateString() === yesterday.toDateString()) return `yesterday ${part}`;
  if (now - d < 6 * 24 * 3600000) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

// "at 8:12" / "at 9:41"
export function clockTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Research buckets (exact hour is also logged; these make analysis easier)
export function timeOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

// Local calendar day, used to decide whether a routine is done "today".
// The evening shape persists until 5am, so 1am belongs to the previous day.
export function dayKey(d = new Date()) {
  const shifted = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekdayName(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
