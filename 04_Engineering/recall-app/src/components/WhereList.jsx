import { useEffect, useState } from 'react';
import { knownLocations, placeNamed } from '../lib/db.js';
import { graph, containers, wouldLoop, atPlace, holderOf } from '../lib/graph.js';
import { normName } from '../lib/names.js';
import { PinIcon, BoxIcon, SearchIcon, CameraIcon, PlusIcon, ListIcon } from './Icons.jsx';
import { hasSecret } from '../lib/sensitive.js';

// Every place and every container, in one list (Ravi 09-27; mockups/S11_fix_pages.jpg "••• every place and box").
// The only list of "where" in the app: behind ••• on the camera, and in Write it down. It offers places (always) and
// containers (things that hold things) — never the thing being placed, never anything inside it (no loops), never a
// pencil. A place's picture is its OWN photo or a pin, never a photo borrowed from a thing that happens to be there.
//   onPick(known)   known = { t:'thing', item } | { t:'place', name }
//   onPhotograph    optional: "Photograph a new place" (the camera picks a new level)
// D5 (Ravi 09-28, mockup D5_place-list A): search "Search your places"; a solid rounded "Photograph a new place" button (no
// dashes); ONE list headed "YOUR PLACES · N" (N = how many are shown) — places first (saved ones, then most recently used),
// then the boxes and containers in their own order (interleaving by recency was not simple: a box's "used" is not a place's).
// A box keeps its box icon; its second line is "a box · in Garage" / "a box · no place yet".
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// 09-29 (Ravi) — the camera's ONE "Choose place" sheet. `chooser` gives it the ☰ title. After a photo the camera couldn't
// place (not recognised, or "No"), `pending` puts that photo on top: "A new place?" + a name field (ReCall's guess) +
// "Use this name"; the list below is headed "Or it's one of your places". `suggest` is a late recognition: first row.
export default function WhereList({ item = null, items = [], places = [], title = 'Where does it go?', onPick, onPhotograph = null, onCancel, exclude = null,
  chooser = false, pending = null, suggest = null, changing = null, current = undefined }) {
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState(pending ? pending.draft || '' : '');
  const [touched, setTouched] = useState(false);
  // a late answer from ReCall fills the name — unless she has already typed one
  useEffect(() => { if (pending && !touched && pending.draft && pending.draft !== draft) setDraft(pending.draft); }, [pending && pending.draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const taken = pending && draft.trim() && pending.taken ? pending.taken(draft.trim()) : '';
  const g = graph();
  // "in the wooden box" searches for "wooden box": the little words in front are how people say where, not part of the name.
  const bare = q.trim().replace(/^(in|inside|into|on|at|under)\s+/i, '').replace(/^(the|my|a|an|our)\s+/i, '');
  const words = bare.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (s) => !words.length || words.every((w) => (s || '').toLowerCase().includes(w));
  const placeAll = knownLocations(items, 999, places).filter(hit);
  const placeList = placeAll.filter((n) => !exclude || !exclude({ t: 'place', name: n })); // 09-29: not one already on this chain, not a circle
  // 09-30d (tester #6): the place saved on the tier being changed is the FIRST row — "Current place" never below the fold
  const boxList = containers(g, 999).filter((b) => (!item || (b.id !== item.id && !wouldLoop(item, b, g))) && hit(b.name) && (!exclude || !exclude({ t: 'thing', item: b })));
  const typed = q.trim();
  // A typed name that IS a box (or a place) is offered as that one, never as a new place with the same name (G23).
  const exists = typed && [...placeAll, ...containers(g, 999).map((b) => b.name)].some((n) => normName(n || '') === normName(bare));
  const placePic = (n) => { const p = placeNamed(n, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; };
  // 09-30d (Ravi's phone): a place that holds another place ("Ikea shelving unit" holds the White cardboard box) is not
  // "nothing here yet" — the places inside it are named too.
  const lowN = (x) => (x || '').trim().toLowerCase();
  const subIn = (n) => (g.edges || []).filter((e) => !e.until && e.to && e.to.t === 'place' && lowN(e.to.name) === lowN(n)).map((e) => (places.find((p) => p.id === e.from) || {}).name).filter(Boolean);
  const placeSub = (n) => { const here = [...subIn(n), ...atPlace(n, g).filter((x) => !item || x.id !== item.id).map((x) => cap(x.name))];
    return here.length ? here.slice(0, 2).join(', ') + (here.length > 2 ? ` +${here.length - 2}` : '') : 'nothing here yet'; };
  // fix 2026-09-29 (Ravi): the place the thing is in right now is listed, and says so. 09-30d: `current` names what is on
  // the tier being changed (any tier, not only level 1) — { t:'place', name } | { t:'thing', item } | null.
  const curHolder = item ? holderOf(item, g) : null;
  const isCurPlace = (n) => (current !== undefined ? !!current && current.t === 'place' && lowN(current.name) === lowN(n) : !!item && !curHolder && lowN(item.location) === lowN(n));
  const isCurBox = (b) => (current !== undefined ? !!current && current.t === 'thing' && current.item && current.item.id === b.id : !!curHolder && curHolder.id === b.id);
  const boxSub = (b) => { const h = holderOf(b, g); return `a box · ${h ? `in the ${h.name}` : b.location ? `in ${b.location}` : 'no place yet'}`; };
  const shown = placeList.length + boxList.length;
  const boxRow = (b) => (
    <button type="button" key={b.id} className="wl-row" onClick={() => onPick({ t: 'thing', item: b })}>
      {b.thumb ? <img src={b.thumb} alt="" /> : <span className="no"><BoxIcon /></span>}
      <span className="tx"><b>{cap(b.name)}</b><small>{isCurBox(b) && <span className="wl-cur">Current place</span>}{boxSub(b)}</small></span>
    </button>);
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet where-list" role="dialog" aria-modal="true" aria-labelledby="wl-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="wl-title">{chooser ? <span className="wl-chooser"><ListIcon />Choose place</span> : title}</div>
        {/* 09-30d (Ravi: "both pages should show the current tier hierarchy and then be clear which tier is being changed") */}
        {changing && !typed && ( /* 09-30d (tester #1): hidden while you type — the matches must stay above the keyboard */
          <div className="wl-chg">
            <div className="wl-chg-ch">{changing.parts.map((p, j) => <span key={j} className="cp">{j > 0 && <span className="lc-in">in</span>}<span className={j === changing.at ? 'sel' : p.soft ? 'soft' : ''} style={j === changing.at ? { borderColor: p.c, color: p.c } : undefined}>{p.n}</span></span>)}</div>
            <p className="wl-chg-say">{changing.say}</p>
            {changing.above ? <p className="wl-chg-above">{changing.above}</p> : null}
          </div>)}
        {pending && (
          <div className="wl-pend">
            <div className="wl-pend-h">{pending.thumb ? <img src={pending.thumb} alt="" style={{ borderColor: pending.colour }} /> : null}<span><b>A new place?</b><small>Name the place in your photo</small></span></div>
            <input className="place-input" value={draft} onChange={(e) => { setTouched(true); setDraft(e.target.value); }} placeholder="What is it called?" aria-label="What is this place called?" enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !taken && !hasSecret(draft)) pending.onUse(draft.trim()); }} />
            {taken ? <p className="wl-taken">{taken}</p> : <p className="wl-hint">{pending.guessed && !touched ? 'ReCall’s guess — type to change it.' : ' '}</p>}
            <button type="button" className="btn-primary" disabled={!draft.trim() || !!taken || hasSecret(draft)} onClick={() => pending.onUse(draft.trim())}>Use this name</button>
          </div>)}
        {suggest && (
          <button type="button" className="wl-row wl-sugg" onClick={() => onPick(suggest.known)}>
            {suggest.thumb ? <img src={suggest.thumb} alt="" /> : <span className="no"><PinIcon /></span>}
            <span className="tx"><b>Is it the {suggest.name}?</b><small>ReCall thinks so, from the photo</small></span>
          </button>)}
        <div className="wl-search"><SearchIcon /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your places" aria-label="Search your places" enterKeyHint="go"
          onKeyDown={(e) => { if (e.key !== 'Enter' || !typed) return; e.preventDefault(); /* 09-29h: Go picks what the list shows — the one match, or the new place */
            const one = placeList.length + boxList.length === 1 ? (placeList.length ? { t: 'place', name: placeList[0] } : { t: 'thing', item: boxList[0] }) : null;
            if (one) onPick(one); else if (!exists) onPick({ t: 'place', name: cap(typed) }); }} /></div>
        {onPhotograph && !pending && <button type="button" className="wl-new" onClick={onPhotograph}><CameraIcon /><span>Photograph a new place</span></button>}
        {typed && !exists && <button type="button" className="wl-new typed" onClick={() => onPick({ t: 'place', name: cap(typed) })}><PlusIcon /><span>A new place called “{cap(typed)}”</span></button>}
        <div className="wl-scroll">
          {shown > 0 && <div className="wl-g">{pending ? 'OR IT’S ONE OF YOUR PLACES' : 'YOUR PLACES'} · {shown}</div>}
          {boxList.filter(isCurBox).map((b) => boxRow(b))}
          {[...placeList].sort((a, b) => Number(isCurPlace(b)) - Number(isCurPlace(a))).map((n) => { const t = placePic(n); return (
            <button type="button" key={'p' + n} className="wl-row" onClick={() => onPick({ t: 'place', name: n })}>
              {t ? <img src={t} alt="" /> : <span className="no"><PinIcon /></span>}
              <span className="tx"><b>{n}</b><small>{isCurPlace(n) && <span className="wl-cur">Current place</span>}{placeSub(n)}</small></span>
            </button>); })}
          {boxList.filter((b) => !isCurBox(b)).map((b) => boxRow(b))}
          {!placeList.length && !boxList.length && !typed && <p className="empty">No places yet. Photograph one, or type its name.</p>}
        </div>
        <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
