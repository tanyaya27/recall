// The graph (Ravi, DECISIONS 2026-09-25/26): things and places are nodes; "is in" is an EDGE, a
// first-class record of its own (kind:'edge' in recall_items), never a name match and never a field.
//
//   { kind:'edge', rel:'in', from:<thing id>, to:{ t:'thing', id, name } | { t:'place', name },
//     since, until:null, how, owner, by, private, roles:{}, sharedWith:[] }
//
// A container is simply a thing that has things in it: the blue tin is a thing (it moves, you look
// for it) and a place (things go in it). Moving something closes its open edge and opens a new one;
// the open edge is where it is now, the closed ones are where it was. Nothing can end up inside itself.
// The place text on each thing stays as a copy written with every move (search, the AI, old builds).
//
// This module is PURE: no Firestore, no screens. It reads the items and edges watchAll() delivers,
// so the same logic serves any client (the native app later — ARCH 2026-09-26 §9A).
import { normName } from './names.js';

let G = { items: [], edges: [], byId: new Map(), open: new Map() };

// Called by watchAll on every snapshot. `open`: thing id → its open "in" edge (the newest if two raced).
export function setGraph(items = [], edges = []) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const open = new Map();
  edges.filter((e) => e.rel === 'in' && !e.until).sort((a, b) => (a.since || 0) - (b.since || 0)).forEach((e) => open.set(e.from, e));
  G = { items, edges, byId, open };
}
export const graph = () => G;

export function openEdge(itemId, g = G) { return g.open.get(itemId) || null; }

// The thing it is in (an open edge to a THING that still exists), or null.
export function holderOf(item, g = G) {
  const e = item && openEdge(item.id, g);
  if (!e || !e.to || e.to.t !== 'thing') return null;
  const h = g.byId.get(e.to.id);
  return h && !h.deleted ? h : null;
}

// Outward: [wooden box, memorabilia box, …], at most six steps, never round in a circle.
export function chainOf(item, g = G, max = 6) {
  const out = []; const seen = new Set([item && item.id]);
  let cur = item;
  while (cur && out.length < max) {
    const h = holderOf(cur, g);
    if (!h || seen.has(h.id)) break;
    out.push(h); seen.add(h.id); cur = h;
  }
  return out;
}

// Would putting `item` into `dest` make a circle (the box into the card that is in the box)?
export function wouldLoop(item, dest, g = G) {
  if (!item || !dest) return false;
  if (dest.id === item.id) return true;
  return chainOf(dest, g).some((c) => c.id === item.id);
}

// What a thing holds: things whose open edge points at it, newest first.
export function contentsOf(thing, g = G) {
  if (!thing) return [];
  return g.items.filter((x) => !x.deleted && x.id !== thing.id && holderOf(x, g) === thing)
    .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
}
// Everything inside, at any depth (the count on a box tile says what's directly in it; this is for Find).
export function allInside(thing, g = G) {
  const out = []; const q = [thing]; const seen = new Set([thing.id]);
  while (q.length) { const t = q.shift(); contentsOf(t, g).forEach((x) => { if (!seen.has(x.id)) { seen.add(x.id); out.push(x); q.push(x); } }); }
  return out;
}

// Where a thing ultimately is: the outermost container's own place text (or its own, if in nothing).
export function outerPlace(item, g = G) {
  const chain = chainOf(item, g);
  const last = chain.length ? chain[chain.length - 1] : item;
  return (last && last.location) || '';
}

// Things at a fixed place (Home "inside" a place, 09-25 Ravi: places open too): not inside a thing,
// and placed there by name. Case-insensitive.
export function atPlace(name, g = G) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return [];
  return g.items.filter((x) => !x.deleted && !holderOf(x, g) && (x.location || '').trim().toLowerCase() === n);
}

// Home at the top level: things not inside another thing, plus the ones promoted back to Home.
export function topLevel(items, g = G) {
  return items.filter((x) => !holderOf(x, g) || x.promoted);
}

// "In the wooden box" / "In Box 14" — a name with a number or capitals of its own reads as a name.
export function inPhrase(c) {
  const n = (c.name || '').trim().replace(/^(my|the|our)\s+/i, '');
  if (!n) return 'In a box';
  return /\d/.test(n) || /[A-Z]/.test(n.slice(1)) ? `In ${n}` : `In the ${n.toLowerCase()}`;
}
// The answer in words: { lead: 'In the wooden box, in the memorabilia box', where: 'Crawl space', chain }.
export function placeWords(item, g = G) {
  const chain = chainOf(item, g);
  if (!chain.length) return null;
  const lead = chain.slice(0, 2).map((c, i) => (i === 0 ? inPhrase(c) : inPhrase(c).replace(/^In /, 'in '))).join(', ');
  return { lead, where: outerPlace(item, g), chain };
}

// Where typed or picked words point: a THING (exact name or a name it was called) or a place by name.
// Only exact matches link — a loose one would put the keys in the wrong tin (09-24).
const LEAD = /^\s*(in|inside|into|on|at|under)\s+(the\s+|my\s+|a\s+|an\s+)?/i;
export function destOf(text, item = null, g = G) {
  const raw = (text || '').trim();
  if (!raw) return null;
  const bare = raw.replace(LEAD, '');
  const head = bare.split(/\s*,\s*/)[0];
  const names = (x) => [x.name, ...(x.aliases || [])].map(normName).filter(Boolean);
  for (const cand of [bare, head]) {
    const n = normName(cand);
    if (!n) continue;
    const hit = g.items.find((x) => !x.deleted && x.name && (!item || x.id !== item.id) && names(x).includes(n));
    if (hit && !(item && wouldLoop(item, hit, g))) return { t: 'thing', id: hit.id, name: hit.name };
  }
  return { t: 'place', name: raw };
}
