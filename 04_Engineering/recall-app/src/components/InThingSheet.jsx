import { useState } from 'react';
import { graph, containers, contentsOf, wouldLoop, thingMatches } from '../lib/graph.js';
import { NoteIcon, BoxIcon, SearchIcon, PlusIcon } from './Icons.jsx';
import { newContainer } from '../lib/db.js';

// "In something…" (09-27, Ravi: "the item in place in place is not working"). Choosing a place used to
// offer place names only, so putting the key IN the tin meant typing the tin's exact name. Now any thing
// can be picked as the place, by its photo: the boxes already in use first, then everything, with a
// search. Picking one links to that thing (an edge), never to a look-alike name.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function InThingSheet({ item = null, owner, onPick, onCancel }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const g = graph();
  const ok = (x) => !x.deleted && x.name && (!item || (x.id !== item.id && !wouldLoop(item, x, g)));
  const boxes = containers(g, 12).filter(ok);
  const list = q.trim() ? thingMatches(q, item, g, 24) : [...boxes, ...g.items.filter((x) => ok(x) && !boxes.includes(x)).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))].slice(0, 24);
  const typed = q.trim();
  const exact = typed && list.some((x) => (x.name || '').toLowerCase() === typed.toLowerCase());
  // A box not logged yet — the parallel path, at the top (Ravi 09-27).
  async function makeNew() {
    if (!typed || busy) return;
    setBusy(true);
    const made = await newContainer(cap(typed), owner || undefined);
    if (made) onPick({ ...made, created: true });
  }
  return (
    <div className="sheet-back" onClick={onCancel} role="presentation">
      <div className="sheet putin-sheet" role="dialog" aria-modal="true" aria-labelledby="it-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title" id="it-title">What is it in?</div>
        <div className="it-search"><SearchIcon /><input value={q} placeholder="Its name — blue tin, memorabilia box…" autoFocus
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && typed && !exact) makeNew(); }} aria-label="The name of what it is in" /></div>
        <button type="button" className="it-new" disabled={!typed || exact || busy} onClick={makeNew}>
          <PlusIcon /><span>{typed && !exact ? <>New: <b>{cap(typed)}</b></> : typed ? 'Already logged — pick it below' : 'Something not logged yet — type its name above'}</span>
        </button>
        {list.length > 0 && (
          <div className="board putin-grid">
            {list.map((x) => {
              const n = contentsOf(x, g).length;
              return (
                <button key={x.id} type="button" className="tile" onClick={() => onPick(x)}>
                  {x.thumb ? <img src={x.thumb} alt="" /> : <span className="tile-written"><NoteIcon /></span>}
                  {n > 0 && <span className="inbadge"><BoxIcon /> {n} inside</span>}
                  <div className="tile-label">{cap(x.name)}<span className="tile-sub">{x.location || 'No place yet'}</span></div>
                </button>
              );
            })}
          </div>
        )}
        <div className="putin-foot"><button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button></div>
      </div>
    </div>
  );
}
