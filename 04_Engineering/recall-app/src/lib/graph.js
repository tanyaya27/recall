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
// 09-29 (Ravi, tier 2 lost): places are nodes too. A place's own "is in" is the same edge record, `from` the place doc's
// id (Desk drawer → In air; Top shelf → the linen closet). `places` are the place docs from the same snapshot.
export function setGraph(items = [], edges = [], places = []) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const open = new Map();
  edges.filter((e) => e.rel === 'in' && !e.until).sort((a, b) => (a.since || 0) - (b.since || 0)).forEach((e) => open.set(e.from, e));
  const placeByName = new Map(); places.forEach((p) => { const k = (p.name || '').trim().toLowerCase(); if (k && !placeByName.has(k)) placeByName.set(k, p); });
  G = { items, edges, byId, open, places, placeByName };
}
export function placeDoc(name, g = G) { return (g.placeByName && g.placeByName.get((name || '').trim().toLowerCase())) || null; }

// Outward from a PLACE: [{t:'place', name, id} | {t:'thing', item}, …] — what the place is in, and what that is in,
// through places and boxes alike, never round in a circle, at most `max` steps.
export function placeOuter(name, g = G, max = 12) { // 09-30: one limit (12) for every chain reader — the monkey found the page dropping the 10th tier
  const out = []; const seen = new Set();
  let cur = placeDoc(name, g); if (cur) seen.add('p:' + cur.id);
  while (cur && out.length < max) {
    const e = openEdge(cur.id, g);
    if (!e || !e.to) break;
    if (e.to.t === 'thing') {
      const h = g.byId.get(e.to.id); if (!h || h.deleted || seen.has('t:' + h.id)) break;
      out.push({ t: 'thing', item: h }); seen.add('t:' + h.id);
      for (const c of chainOf(h, g)) { if (seen.has('t:' + c.id)) return out; out.push({ t: 'thing', item: c }); seen.add('t:' + c.id); }
      const last = out[out.length - 1].item; const loc = (last.location || '').trim();
      const nx = loc ? placeDoc(loc, g) : null;
      if (!loc) break;
      if (!nx) { out.push({ t: 'place', name: loc, id: null }); break; }
      if (seen.has('p:' + nx.id)) break;
      out.push({ t: 'place', name: nx.name, id: nx.id }); seen.add('p:' + nx.id); cur = nx; continue;
    }
    const nx = placeDoc(e.to.name, g);
    if (!nx) { out.push({ t: 'place', name: e.to.name, id: null }); break; }
    if (seen.has('p:' + nx.id)) break;
    out.push({ t: 'place', name: nx.name, id: nx.id }); seen.add('p:' + nx.id); cur = nx;
  }
  return out;
}
// Would saying "place `name` is in `dest`" make a circle? dest: {t:'place', name} | {t:'thing', item|id}.
export function placeWouldLoop(name, dest, g = G) {
  const n = (name || '').trim().toLowerCase(); if (!n || !dest) return false;
  if (dest.t === 'place') {
    if ((dest.name || '').trim().toLowerCase() === n) return true;
    return placeOuter(dest.name, g).some((x) => x.t === 'place' && x.name.toLowerCase() === n);
  }
  const it = dest.item || g.byId.get(dest.id); if (!it) return false;
  const chain = [it, ...chainOf(it, g)]; const tail = chain[chain.length - 1];
  const loc = (tail.location || '').trim().toLowerCase();
  if (!loc) return false;
  if (loc === n) return true;
  return placeOuter(loc, g).some((x) => x.t === 'place' && x.name.toLowerCase() === n);
}
// The whole "where", outward, for a thing: the boxes it is in, the place at the end, then where THAT place is.
// [{t:'thing', item} …, {t:'place', name, id} …]
export function whereChain(item, g = G) {
  if (!item) return [];
  const boxes = chainOf(item, g).map((c) => ({ t: 'thing', item: c }));
  const last = boxes.length ? boxes[boxes.length - 1].item : item;
  const loc = (last.location || '').trim();
  if (!loc) return boxes;
  const p = placeDoc(loc, g);
  return [...boxes, { t: 'place', name: p ? p.name : loc, id: p ? p.id : null }, ...placeOuter(loc, g)];
}
export const graph = () => G;
// 10-01 (Tanya): designed for any number of tiers; the camera shows and builds up to this many (item → in → in → in), until the
// use cases show more are needed. Storage and the chain readers have no such limit.
export const TIERS_SHOWN = 3;

// 09-30d (Ravi, phone: "this is not really the last time it was seen … just the last time it was moved"). When did the item
// last CHANGE place — itself, or together with something it's in (its box moved, the counter it's on moved)? A link that
// replaced an earlier one is a move; the first link of a box or place only says where it is (adding a tier on top is not
// a move), and neither is putting away something that had no place. → { at, via } (via: the name of what moved with it,
// or null for the item itself), or null when it has not moved since it was logged.
export function movedOf(item, g = G) {
  if (!item) return null;
  // an Undo puts it back: its link (how: 'undo') is not a move, and its history line cancels the line before it
  const replaced = (id, e) => e.how !== 'undo' && e.how !== 'prep' && (g.edges || []).some((x) => x.rel === 'in' && x.from === id && x.until && x.id !== e.id && Math.abs((x.until || 0) - (e.since || 0)) < 5000);
  let best = null;
  const h = []; (item.history || []).forEach((x) => { if (x.undo && h.length > 1) h.pop(); else if (!x.undo) h.push(x); });
  for (let i = h.length - 1; i > 0; i--) {
    const a = (h[i - 1].location || '').trim().toLowerCase(), b = (h[i].location || '').trim().toLowerCase();
    if (a && b && a !== b) { best = { at: h[i].at || 0, via: null }; break; }
  }
  const e0 = openEdge(item.id, g); if (e0 && replaced(item.id, e0) && (!best || (e0.since || 0) > best.at + 5000)) best = { at: e0.since || 0, via: null };
  for (const t of whereChain(item, g)) {
    const id = t.t === 'thing' ? t.item.id : t.id; if (!id) continue;
    const e = openEdge(id, g); if (e && replaced(id, e) && (!best || (e.since || 0) > best.at + 5000)) best = { at: e.since || 0, via: t.t === 'thing' ? (t.item.name ? t.item.name.charAt(0).toUpperCase() + t.item.name.slice(1) : '') : t.name }; // 09-30d (tester #7): "Wooden box", as written everywhere
  }
  return best;
}

export function openEdge(itemId, g = G) { return g.open.get(itemId) || null; }

// The thing it is in (an open edge to a THING that still exists), or null.
export function holderOf(item, g = G) {
  const e = item && openEdge(item.id, g);
  if (!e || !e.to || e.to.t !== 'thing') return null;
  const h = g.byId.get(e.to.id);
  return h && !h.deleted ? h : null;
}

// Outward: [wooden box, memorabilia box, …], at most six steps, never round in a circle.
export function chainOf(item, g = G, max = 12) {
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
  const d = g.byId.get(dest.id) || dest; // a {t, id, name} reference or the thing itself
  return chainOf(d, g).some((c) => c.id === item.id);
}

// What a thing holds: things whose open edge points at it, newest first.
export function contentsOf(thing, g = G) {
  if (!thing) return [];
  // 09-30: by id — a screen's copy of the box is not the graph's object, and `===` found nothing in it (a box could be
  // switched off "holds items" with things inside; a rename missed its items).
  return g.items.filter((x) => !x.deleted && x.id !== thing.id && (holderOf(x, g) || {}).id === thing.id)
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
  // `first`: the tier it is directly in — what a small tile shows (09-30: the tile joined two tiers with ", in the", the one
  // place a chain was written without the "in" pill; the item's page has the whole chain).
  return { lead, first: inPhrase(chain[0]), where: outerPlace(item, g), chain };
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

// A container is a thing that HOLDS THINGS (Ravi 09-27: "putting things in a pencil … is nonsensical"): she said
// so ("It holds things" on its page), or she photographed it as where something goes and it moves (a tin, a
// box, a bag), or — for things from before the mark — something is in it. A pencil is never offered as a place.
export function isContainer(x, g = G) {
  if (!x || x.deleted) return false;
  if (x.holds === true) return true;
  return contentsOf(x, g).length > 0; // something is in it: it holds things, whatever the mark says (so it can be emptied)
}
// Containers, most recently used first (the newest thing put in them, else their own last sighting).
export function containers(g = G, limit = 3) {
  const used = (x) => Math.max(x.lastSeenAt || 0, ...contentsOf(x, g).map((c) => c.lastSeenAt || 0));
  return g.items.filter((x) => x.name && isContainer(x, g)).sort((a, b) => used(b) - used(a)).slice(0, limit);
}
// Things whose name contains every typed word (for "In something…" and typed places). Never the thing
// itself or anything it would make a circle with.
export function thingMatches(text, item = null, g = G, limit = 4) {
  const words = normName(text || '').split(' ').filter((w) => w.length >= 2);
  if (!words.length) return [];
  return g.items.filter((x) => !x.deleted && x.name && (!item || (x.id !== item.id && !wouldLoop(item, x, g))))
    .filter((x) => { const n = [x.name, ...(x.aliases || [])].map(normName).join(' '); return words.every((w) => n.includes(w)); })
    .slice(0, limit);
}

// 10-01 (Tanya, release 1 "Words, and one pick"): her own words for where it is. Kept in the item's history as a "where
// statement" (w: 1) — what she typed or said, when, and who — never rewritten; the newest statement is the one shown. No new
// field on the item, so the Firestore rules don't change. { said: '' } when she never said one (or the last one was empty).
export function saidOf(item) {
  const h = (item && item.history) || [];
  for (let i = h.length - 1; i >= 0; i--) { const e = h[i]; if (e && e.w) return { said: (e.said || '').trim(), at: e.saidAt || e.at || 0, stmt: e.at || 0, by: e.by || '' }; }
  return { said: '', at: 0, stmt: 0, by: '' };
}
// 10-02 (Ravi, one where): words she adds on the camera are a NOTE (history entry n: 1) — never a where. Only her older words
// (release 1, Write it down) can be a where, and only for an item with no place: the newest such statement.
export function wordsWhere(item, g = G) {
  const h = (item && item.history) || [];
  for (let i = h.length - 1; i >= 0; i--) { const e = h[i]; if (e && e.w && !e.n) { const s = { said: (e.said || '').trim(), at: e.saidAt || e.at || 0, stmt: e.at || 0, by: e.by || '' }; const ed = item && item.id ? g.open.get(item.id) : null; return ed && (ed.since || 0) > s.stmt + 5000 ? { said: '', at: 0, by: '' } : s; } }
  return { said: '', at: 0, by: '' };
}
// The note shown under the photo: on an item with a place, her newest current words (old words read as a note); with no
// place, only a real note (the words that are its where show as its where instead).
export function noteOf(item, hasPlace, g = G) {
  if (hasPlace) return saidNow(item, g);
  const h = (item && item.history) || [];
  for (let i = h.length - 1; i >= 0; i--) { const e = h[i]; if (e && e.w) return e.n ? { said: (e.said || '').trim(), at: e.saidAt || e.at || 0, by: e.by || '' } : { said: '', at: 0, by: '' }; }
  return { said: '', at: 0, by: '' };
}
// Her words, when they are still about where it is now: a link made after them (put in a box elsewhere, moved from a box's
// page) is newer news, and the words are history then. Words with no link at all are always current.
export function saidNow(item, g = G) {
  const s = saidOf(item);
  if (!s.said) return s;
  const e = item && item.id ? g.open.get(item.id) : null;
  return e && (e.since || 0) > (s.stmt || s.at) + 5000 ? { said: '', at: 0, by: '', stale: s } : s;
}

// ---------- 10-03 (Ravi/Tanya, usability pass 1 — BOARD_2026-10-03_usability-1.md): the little word on each link ----------
// "on the Lab desk, which is in the Craft room". Stored on the link (edge.prep) when she chose it; otherwise read from the name.
// The words offered depend on the place (Tanya: "too many may also be a problem, so we need contextual awareness").
const SURF = new Set(['desk', 'table', 'shelf', 'shelves', 'counter', 'countertop', 'bench', 'workbench', 'bed', 'floor', 'windowsill', 'sill', 'dresser',
  'nightstand', 'stand', 'ledge', 'mantel', 'mantelpiece', 'piano', 'top', 'tray', 'rack', 'couch', 'sofa', 'chair', 'stool', 'cart', 'island', 'sideboard',
  'credenza', 'bookcase', 'bookshelf', 'board', 'worktop', 'tabletop', 'desktop']);
const CONT = new Set(['box', 'boxes', 'drawer', 'drawers', 'bag', 'cupboard', 'cabinet', 'closet', 'bin', 'basket', 'tin', 'jar', 'case', 'pouch', 'purse',
  'wallet', 'backpack', 'suitcase', 'chest', 'trunk', 'fridge', 'refrigerator', 'freezer', 'pocket', 'folder', 'envelope', 'safe', 'crate', 'tote',
  'container', 'organizer', 'organiser', 'caddy', 'carton', 'locker', 'wardrobe', 'bucket', 'pot', 'mug', 'cup', 'bowl', 'binder', 'sleeve', 'holder']);
const ROOM = new Set(['room', 'bedroom', 'kitchen', 'garage', 'bathroom', 'office', 'attic', 'basement', 'hall', 'hallway', 'den', 'study', 'pantry',
  'laundry', 'porch', 'upstairs', 'downstairs', 'house', 'home', 'apartment', 'flat', 'shed', 'car', 'loft', 'lounge', 'foyer', 'entry', 'entryway',
  'patio', 'yard', 'garden', 'cellar', 'nursery', 'playroom', 'mudroom', 'library', 'workshop', 'lab', 'studio', 'basement']);
export const PREPS = ['on', 'in', 'under', 'behind', 'next to'];
const POSN = /^\s*(under|underneath|behind|beside|by|near|next to|on top of|in front of|inside|below|above|between)\b/i;
const JOIN = new Set(['with', 'on', 'in', 'by', 'of', 'from', 'near', 'under', 'behind', 'at', 'for', 'and', 'beside', 'inside', 'next']);
const kindW = (w) => (SURF.has(w) ? 'surf' : CONT.has(w) ? 'cont' : ROOM.has(w) ? 'room' : '');
// The head of the name decides: the last kind-word before "with / on / of …" ("Lab desk with electronics" is a desk,
// "Top drawer of the desk" a drawer); failing that, any kind-word in it.
function kindOfName(name) {
  const ws = (name || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const cut = ws.findIndex((w, i) => i > 0 && JOIN.has(w)); const head = cut > 0 ? ws.slice(0, cut) : ws;
  for (let i = head.length - 1; i >= 0; i--) { const k = kindW(head[i]); if (k) return k; }
  for (const w of ws) { const k = kindW(w); if (k) return k; }
  return '';
}
// The words offered for what something is put on/in/under …, likeliest first.
export function prepOptions(targetName) {
  const k = kindOfName(targetName);
  return k === 'surf' ? ['on', 'under', 'behind', 'next to'] : k === 'cont' ? ['in', 'on', 'next to'] : k === 'room' ? ['in'] : ['in', 'on', 'under', 'behind', 'next to'];
}
export function inferPrep(targetName) { return POSN.test(targetName || '') ? '' : prepOptions(targetName)[0]; }
// The word on one link: hers if she chose one (and it still fits a name that isn't itself "Under the sink"), else ReCall's.
export function prepOf(edge, targetName) {
  if (POSN.test(targetName || '')) return '';
  const p = edge && edge.prep; return p && PREPS.includes(p) ? p : inferPrep(targetName);
}
// Each step of the where, outward, with the word that joins it to the step before and the link that holds that word.
// [{ t, name, item?, id?, fromId, edge, prep, chosen, options }]
export function whereSteps(item, g = G) {
  const tiers = whereChain(item, g);
  return tiers.map((t, k) => {
    const prev = k === 0 ? { id: item.id } : tiers[k - 1].t === 'thing' ? { id: tiers[k - 1].item.id } : { id: tiers[k - 1].id };
    const name = t.t === 'thing' ? (t.item.name ? t.item.name.charAt(0).toUpperCase() + t.item.name.slice(1) : 'A box') : t.name;
    const edge = prev.id ? openEdge(prev.id, g) : null;
    return { ...t, name, fromId: prev.id || null, edge, prep: prepOf(edge, name), chosen: !!(edge && edge.prep), options: POSN.test(name) ? [] : prepOptions(name) };
  });
}
// Everything whose where passes through a place or box (for "For everything in the Craft room · 3 items").
export function usersOf(step, g = G) {
  const key = step.t === 'thing' ? 't' + step.item.id : 'p' + (step.name || '').trim().toLowerCase();
  return g.items.filter((x) => !x.deleted && whereChain(x, g).some((t) => (t.t === 'thing' ? 't' + t.item.id : 'p' + (t.name || '').trim().toLowerCase()) === key));
}
