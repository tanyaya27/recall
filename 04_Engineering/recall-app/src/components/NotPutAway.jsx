import { holderOf, contentsOf, isContainer, saidOf, wordsWhere } from '../lib/graph.js';
import { photoStamp, cap } from '../lib/format.js';
import { logEvent } from '../lib/db.js';
import { ChevronLeftIcon, ChevronIcon, NoteIcon } from './Icons.jsx';

// Not put away (Ravi 09-27, board #13/#14; mockups/S11_fix_pages.jpg n1): a list of the things with no place yet.
// Each opens its own page, where "Put it somewhere" opens the camera. It no longer asks "where?" first and then
// offers a pencil as a place. Putting several away at once comes later, on the camera.
export default function NotPutAway({ items = [], onBack, onOpen }) {
  // REQUIREMENTS_2026-09-27 R6.1/6.2: a box made only because it was named as WHERE something else goes
  // (asWhere) is not a chore to put away — it never shows up here (it still gets a place of its own the
  // moment someone moves it, same as anything else).
  const list = items.filter((x) => !x.deleted && !x.location && !holderOf(x) && !x.asWhere && !wordsWhere(x).said).sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
  return (
    <div className="screen notput-page">
      <div className="thing-head">
        <div className="row1">
          <button type="button" className="chev" aria-label="Back" onClick={onBack}><ChevronLeftIcon /></button>
          <div className="name">Not put away</div>
        </div>
      </div>
      <p className="np-sub">Items with no place yet. Tap one to put it somewhere.</p>
      {list.length === 0 ? <div className="card"><p className="empty">Everything has a place.</p></div> : (
        <div className="tp-blk np-list">
          {list.map((x) => {
            const n = isContainer(x) ? contentsOf(x).length : 0;
            return (
              <button type="button" key={x.id} className="np-row" onClick={() => { logEvent('notput_open', { itemId: x.id }); onOpen(x); }}>
                {x.thumb ? <img src={x.thumb} alt="" /> : <span className="no"><NoteIcon /></span>}
                <span className="tx"><b>{cap(x.name) || 'No name yet'}</b>
                  <small>{n ? `${n} inside · ` : ''}logged {photoStamp(x.createdAt || x.lastSeenAt).replace(/^Today/, 'today').replace(/^Yesterday/, 'yesterday')}</small></span>
                <ChevronIcon />
              </button>);
          })}
        </div>)}
    </div>
  );
}
