import { timeAgo } from '../lib/format.js';
import { logEvent } from '../lib/db.js';

// UC-6: reverse-chronological browse. No folders, no filters.
export default function RecentReel({ items, onOpenItem, onBack }) {
  return (
    <div>
      <div className="topbar"><button className="topback" onClick={onBack}>‹ Back</button></div>
      <h2>Recent photos</h2>
      {items.length === 0 && <p className="sub">Nothing saved yet.</p>}
      <div className="reel">
        {items.map((it) => (
          <button key={it.id} className="tile" onClick={() => { logEvent('lookup', { entryMode: 'recent', itemId: it.id, itemName: it.name, answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 }); onOpenItem(it); }}>
            <img src={it.thumb} alt={it.name} />
            <div className="tile-label cap"><b>{it.name}</b><br />{it.location}<br /><span style={{ color: '#6B7A78' }}>{timeAgo(it.lastSeenAt)}</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}
