// 10-01 (Tanya: "the 2nd optional step can be helped with any unstructured text they may have already provided").
// Her words for where it is → what "What is it in?" offers first. Plain matching on the phone — instant, nothing late,
// nothing chosen for her: (1) her places and boxes whose name appears in what she said, in the order she said them;
// (2) the other names in what she said, offered as new places ("in the blue folder in the desk drawer" → Blue folder).
import { normName } from './names.js';

// a new place is only offered from what comes right after a where-word ("in the …", "on …", "under …", "of the …")
const WHERE = /\b(in|inside|into|on|onto|at|under|underneath|behind|beside|by|near|next to|on top of|in front of|of|between|above|below|beneath|inside of|within)\b/i;
const STOP = /\b(in|inside|into|on|onto|at|under|underneath|behind|beside|by|near|next to|on top of|in front of|from|of|with|between|above|below|beneath|within|and|then|but|or|is|are|was|it|its)\b|[,;.!?/()]/i;
const LEAD = /^(?:the|my|a|an|our|his|her|their|your|this|that|its|some)\s+/i;
// words that say where on something, not what it is
const NOT_A_PLACE = new Set(['it', 'them', 'there', 'here', 'top', 'bottom', 'back', 'front', 'left', 'right', 'side', 'middle', 'corner', 'inside', 'outside', 'floor', 'up', 'down', 'away', 'one', 'other', 'end', 'edge', 'way', 'place', 'spot', 'somewhere', 'home', 'thing', 'stuff']);
const capFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// taken: names of her ITEMS and boxes (never offered, nor any part of one); places: names of her places (never offered as such).
export function fromWords(said, names = [], { self = '', taken = [], places = [], bad = null } = {}) {
  const text = (said || '').trim();
  if (!text) return { hits: [], fresh: [] };
  const ns = ` ${normName(text)} `;
  const hits = [];
  for (const n of names) {
    let at = -1;
    for (const v of [n.name, ...(n.aliases || [])]) { const nn = normName(v); if (nn && nn.length >= 3) { const i = ns.indexOf(` ${nn} `); if (i >= 0 && (at < 0 || i < at)) at = i; } }
    if (at >= 0) hits.push({ n, at });
  }
  hits.sort((a, b) => a.at - b.at);
  // the longer name wins: "in the desk drawer" is the Desk drawer, not the Desk (10-02 tester G)
  const longer = hits.filter((h) => !hits.some((o) => o !== h && ` ${normName(o.n.name)} `.includes(` ${normName(h.n.name)} `) && normName(o.n.name) !== normName(h.n.name)));
  hits.length = 0; hits.push(...longer);
  const hitNorms = hits.map((h) => normName(h.n.name));
  const selfN = normName(self);
  const takenN = new Set(taken.map(normName).filter(Boolean)); const placeN = new Set(places.map(normName).filter(Boolean));
  const fresh = [];
  // the text after each where-word, up to the next where-word or stop word
  const low = text;
  const re = new RegExp(WHERE.source, 'gi'); let m;
  while ((m = re.exec(low)) && fresh.length < 2) {
    const rest = low.slice(m.index + m[0].length);
    const stop = rest.search(STOP);
    const raw = (stop >= 0 ? rest.slice(0, stop) : rest).trim();
    const chunk = raw.replace(LEAD, '').replace(LEAD, '').trim();
    const nn = normName(chunk);
    if (!nn || nn.length < 3 || !/[a-z]/.test(nn)) continue;
    const words = nn.split(' ');
    if (words.length > 4 || words.every((w) => NOT_A_PLACE.has(w))) continue;
    if ((selfN && nn === selfN) || (bad && bad(chunk))) continue;
    if (placeN.has(nn)) continue; // a place she has is offered as itself (a hit), never as new
    if ([...takenN].some((t) => t === nn || ` ${t} `.includes(` ${nn} `))) continue; // an item's name, or part of one ("yearbook" of "yearbook 1978")
    if (hitNorms.some((h) => h === nn || ` ${h} `.includes(` ${nn} `))) continue; // a hit, or part of one — but "garage cupboard" is offered though Garage is a hit
    if (fresh.some((f) => normName(f) === nn)) continue;
    fresh.push(capFirst(chunk));
  }
  return { hits: hits.map((h) => h.n.known), fresh };
}
