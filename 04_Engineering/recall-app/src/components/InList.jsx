import { useState } from 'react';
import { knownLocations, placeNamed } from '../lib/db.js';
import { graph, containers, wouldLoop, atPlace, holderOf, placeWouldLoop } from '../lib/graph.js';
import { normName } from '../lib/names.js';
import { fromWords } from '../lib/words.js';
import { hasSecret } from '../lib/sensitive.js';
import { PinIcon, BoxIcon, SearchIcon, PlusIcon } from './Icons.jsx';
import { inThe } from '../lib/format.js';

// 10-01 (Tanya; release 1 "Words, and one pick", MOCK_2026-10-01_release1-words-and-one-pick.jpg frame 4) — "What is it in?":
// the ONE list for the one optional pick. Her own words lead it: the places and boxes she named ("you said it"), then the
// other names in what she said as one-tap new places. Then search (a typed name that is new is offered as a new place),
// then Recent, then every place and box. Nothing is ever picked for her; a pick closes the list and sets the chip.
//   onPick(known)   known = { t:'thing', item } | { t:'place', name, isNew? }
//   placesOnly      for a PLACE's own "Where it is" (a place is never inside a box — Q4, 09-29)
//   current         what it is in now — listed first, marked "Current place"
//   selfPlace       the place whose own "Where it is" this is (never itself, never a circle)
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const low = (x) => (x || '').trim().toLowerCase();

export default function InList({ item = null, items = [], places = [], said = '', current = null, placesOnly = false, selfPlace = '', title = 'What is it in?', onPick, onCancel, onClear = null, exclude = null }) {
  const [q, setQ] = useState('');
  const g = graph();
  const okBox = (b) => !placesOnly && (!item || (b.id !== item.id && !wouldLoop(item, b, g)));
  const okPlace = (n) => !selfPlace || (low(n) !== low(selfPlace) && !placeWouldLoop(selfPlace, { t: 'place', name: n }, g));
  const placeNames = knownLocations(items, 999, places).filter(okPlace);
  const boxes = containers(g, 999).filter(okBox);
  const placePic = (n) => { const p = placeNamed(n, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; };
  const placeIds = new Set(places.map((p) => p.id));
  const subIn = (n) => (g.edges || []).filter((e) => !e.until && e.to && e.to.t === 'place' && low(e.to.name) === low(n) && placeIds.has(e.from)).length; // places in it (10-01 tester #4: items were counted twice)
  const placeSub = (n) => { const k = atPlace(n, g).filter((x) => !item || x.id !== item.id).length + subIn(n); return `a place · ${k ? `${k} item${k === 1 ? '' : 's'}` : 'nothing here yet'}`; };
  const boxSub = (b) => { const h = holderOf(b, g); return `a box · ${h ? inThe(cap(h.name)) : b.location ? `in ${b.location}` : 'no place yet'}`; };
  const isCur = (k) => !!current && current.t === k.t && (k.t === 'thing' ? current.item && current.item.id === k.item.id : low(current.name) === low(k.name));
  const keyOf = (k) => (k.t === 'thing' ? 't' + k.item.id : 'p' + low(k.name));
  const all = [...placeNames.map((n) => ({ t: 'place', name: n })), ...boxes.map((b) => ({ t: 'thing', item: b }))].filter((k) => !exclude || !exclude(k));
  // her words first (not while she searches)
  const typed = q.trim();
  // every name she already has — an item, a box, a place — is never offered as a NEW place (10-01 tester #1)
  const takenItems = items.filter((x) => !x.deleted && x.name).flatMap((x) => [x.name, ...(x.aliases || [])]);
  const takenPlaces = [...knownLocations(items, 999, places), ...places.map((p) => p.name)];
  const taken = [...takenItems, ...takenPlaces];
  const fw = typed || hasSecret(said) ? { hits: [], fresh: [] } : fromWords(said, all.map((k) => ({ known: k, name: k.t === 'thing' ? k.item.name : k.name, aliases: k.t === 'thing' ? k.item.aliases || [] : [] })), { self: item ? item.name : '', taken: takenItems, places: takenPlaces, bad: (n) => hasSecret(n) || !okPlace(n) || (!!exclude && exclude({ t: 'place', name: n })) });
  const fresh = fw.fresh.filter((n) => !hasSecret(n) && okPlace(n));
  // search
  const bare = typed.replace(/^(in|inside|into|on|at|under)\s+/i, '').replace(/^(the|my|a|an|our)\s+/i, '');
  const words = low(bare).split(/\s+/).filter(Boolean);
  const nameOf = (k) => (k.t === 'thing' ? k.item.name : k.name);
  const hit = (k) => !words.length || words.every((w) => low(nameOf(k)).includes(w));
  const newName = (bare || typed).replace(/[\s.,;:!?]+$/, '').replace(/\s+/g, ' '); // "Attic shelf." is the Attic shelf (10-02 tester r4 N7)
  const exists = typed && (all.some((k) => normName(nameOf(k)) === normName(bare)) || taken.some((n) => normName(n) === normName(bare)));
  const blocked = typed && !all.some((k) => normName(nameOf(k)) === normName(bare)) && taken.find((n) => normName(n) === normName(bare)); // a name she has that can't be picked here
  const shownKeys = new Set(fw.hits.map(keyOf));
  const curK = current && all.find(isCur);
  const okK = (k) => all.some((a) => keyOf(a) === keyOf(k)); // Recent obeys every exclusion the full list does (10-02 tester round 3)
  const recent = typed ? [] : [...placeNames.slice(0, 2).map((n) => ({ t: 'place', name: n })), ...boxes.slice(0, 2).map((b) => ({ t: 'thing', item: b }))].filter(okK)
    .filter((k) => !shownKeys.has(keyOf(k)) && !isCur(k)).slice(0, 3);
  recent.forEach((k) => shownKeys.add(keyOf(k)));
  const rest = all.filter(hit).filter((k) => typed || (!shownKeys.has(keyOf(k)) && !isCur(k)));
  const row = (k, why = '') => (
    <button type="button" key={keyOf(k) + why} className={'wl-row' + (why ? ' said' : '')} onClick={() => onPick(k)}>
      {k.t === 'thing' ? (k.item.thumb ? <img src={k.item.thumb} alt="" /> : <span className="no"><BoxIcon /></span>) : placePic(k.name) ? <img src={placePic(k.name)} alt="" /> : <span className="no"><PinIcon /></span>}
      <span className="tx"><b>{cap(nameOf(k))}</b><small>{why ? <span className="why">{why}</span> : null}{isCur(k) && <span className="wl-cur">Current place</span>}{k.t === 'thing' ? boxSub(k.item) : placeSub(k.name)}</small></span>
    </button>);
  const newPlace = (n) => <button type="button" key={'new' + n} className="wl-new typed" onClick={() => onPick({ t: 'place', name: cap(n), isNew: true })}><PlusIcon /><span>New place: <b>{cap(n)}</b></span></button>;
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet where-list in-list" role="dialog" aria-modal="true" aria-labelledby="in-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="in-title">{title}</div>
        {said && !typed ? <p className="wl-said">You said: “{said}”</p> : null}
        {(fw.hits.length > 0 || fresh.length > 0) && <div className="wl-g">From what you said</div>}
        {fw.hits.map((k) => row(k, 'you said it'))}
        {fresh.map(newPlace)}
        <div className="wl-search"><SearchIcon /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placesOnly ? 'Search your places' : 'Search your places and boxes'} aria-label="Search your places" enterKeyHint="go"
          onKeyDown={(e) => { if (e.key !== 'Enter' || !typed) return; e.preventDefault(); const m = all.filter(hit); if (m.length === 1) onPick(m[0]); else if (!exists && !hasSecret(typed) && !(exclude && exclude({ t: 'place', name: newName }))) onPick({ t: 'place', name: cap(newName), isNew: true }); }} /></div>
        {typed && !exists && !hasSecret(typed) && !(exclude && exclude({ t: 'place', name: newName })) && newPlace(newName)}
        {blocked ? <p className="wl-said in-blocked">{item && items.some((x) => normName(x.name) === normName(blocked) && x.id !== item.id && x.holds) ? `“${cap(blocked)}” is inside ${item.name ? cap(item.name) : 'it'} — it can’t go in there.` : items.some((x) => !x.deleted && normName(x.name) === normName(blocked)) ? `“${cap(blocked)}” is one of your items, not a place.` : `“${cap(blocked)}” can’t hold it — that would go round in a circle.`}</p> : null}
        <div className="wl-scroll">
          {curK && !typed && row(curK)}
          {recent.length > 0 && <div className="wl-g">Recent</div>}
          {recent.map((k) => row(k))}
          {rest.length > 0 && <div className="wl-g">{typed ? 'Your places' : placesOnly ? 'All your places' : 'All your places and boxes'} · {rest.length}</div>}
          {rest.map((k) => row(k))}
          {!all.length && !typed && !fresh.length && <p className="empty">No places yet — type a name above.</p>}
        </div>
        {onClear && current ? <button type="button" className="btn-quiet in-clear" onClick={onClear}>Not in anything</button> : null}
        <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
