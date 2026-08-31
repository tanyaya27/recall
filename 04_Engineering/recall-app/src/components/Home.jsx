import { useState } from 'react';
import { friendlyDate } from '../lib/format.js';
import { logEvent } from '../lib/db.js';

// The heart of v0: pinned tiles (UC-4), ask box (UC-5), one big camera button (UC-2).
export default function Home({ items, engine, onOpenItem, onCapture, onAskResult, onNav }) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const pinned = items.filter((it) => it.pinned);

  async function ask(e) {
    e.preventDefault();
    const question = q.trim();
    if (!question || asking) return;
    setAsking(true);
    try {
      const result = await engine.answerQuery(question, items, { sensitivity: 'personal' });
      logEvent('query', { question, matched: result.matches.length });
      onAskResult(result);
      setQ(''); // repeated-query tolerance: no history kept or shown
    } catch (err) {
      console.error(err);
      onAskResult({ matches: [], message: "I couldn't check just now. Please try again in a moment." });
    }
    setAsking(false);
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>ReCall</h1>
          <div className="date">{friendlyDate()}</div>
        </div>
        <button className="btn-quiet" onClick={() => onNav('settings')}>⚙︎</button>
      </div>

      {!engine.ready && (
        <div className="notice" onClick={() => onNav('settings')}>
          One-time setup: add your AI key in Settings before taking photos. Tap here.
        </div>
      )}

      {pinned.length > 0 && (
        <div className="tile-grid">
          {pinned.map((it) => (
            <button key={it.id} className="tile"
              onClick={() => { logEvent('tile_lookup', { itemId: it.id, name: it.name }); onOpenItem(it); }}>
              <img src={it.thumb} alt={it.name} />
              <div className="tile-label">{it.name}</div>
            </button>
          ))}
        </div>
      )}

      <form className="ask-row" onSubmit={ask}>
        <input value={q} placeholder="Where is my…?" onChange={(e) => setQ(e.target.value)} />
        <button type="submit" disabled={!engine.ready || asking}>{asking ? '…' : 'Ask'}</button>
      </form>

      <button className="btn-primary" disabled={!engine.ready} onClick={() => onCapture()}>
        📷 Add a photo
      </button>

      <div className="footer-nav">
        <button className="btn-quiet" onClick={() => onNav('recent')}>Recent photos</button>
      </div>
    </div>
  );
}
