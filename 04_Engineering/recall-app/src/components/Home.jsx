import { useEffect, useRef, useState } from 'react';
import { friendlyNow, clockTime, timeOfDay } from '../lib/format.js';
import { logEvent, todaysCheck } from '../lib/db.js';

// v0.1 Home: ONE screen shaped by the clock. Margaret never navigates.
//   morning  → the morning routines the app is asking for, then her things
//   daytime  → her things
//   evening  → the bedtime routines, then her things; stays this shape until 5am
// Below: ask (voice or typed), camera. Recent and Settings are quiet.

export function currentWindow(eveningHour = 20.5) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h < 5) return 'evening';           // 1am still shows last night's check
  if (h < 12) return 'morning';
  if (h >= eveningHour) return 'evening';
  return 'day';
}

export default function Home({
  items, routines, checks, engine, eveningHour, onOpenItem, onOpenRoutine, onCapture, onAskResult, onNav,
}) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const entryMode = useRef('typed');
  const win = currentWindow(eveningHour);

  const pinned = items.filter((it) => it.pinnedOrder != null).sort((a, b) => a.pinnedOrder - b.pinnedOrder);
  const others = items.filter((it) => it.pinnedOrder == null);
  const due = routines.filter((r) => r.active !== false && r.window === win);
  const doneCount = due.filter((r) => todaysCheck(checks, r.id)).length;

  useEffect(() => {
    if (due.length) logEvent('prompt_shown', { window: win, routineIds: due.map((r) => r.id), doneCount });
  }, [win]); // eslint-disable-line

  async function ask(e) {
    if (e) e.preventDefault();
    const question = q.trim();
    if (!question || asking) return;
    setAsking(true);
    const t0 = Date.now();
    try {
      const result = await engine.answerQuery(question, items, { sensitivity: 'personal' });
      const top = result.matches[0];
      logEvent('lookup', {
        entryMode: entryMode.current, question, matched: result.matches.length,
        itemId: top?.id || null, itemName: top?.name || null,
        answerAgeMin: top ? Math.round((Date.now() - top.lastSeenAt) / 60000) : null,
        latencyMs: Date.now() - t0,
      });
      onAskResult(result);
      setQ(''); // repeated-query tolerance: no history kept or shown
    } catch (err) {
      console.error(err);
      onAskResult({ matches: [], message: "I couldn't check just now. Please try again in a moment." });
    }
    setAsking(false);
    entryMode.current = 'typed';
  }

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  function speak() {
    if (!SR || listening) return;
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    setListening(true);
    rec.onresult = (ev) => {
      const text = Array.from(ev.results).map((r) => r[0].transcript).join(' ');
      setQ(text);
      entryMode.current = 'voice';
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  const heading = win === 'morning' ? 'This morning' : win === 'evening' ? 'Before bed' : null;

  return (
    <div className="home">
      <div className="dateline">{friendlyNow()}</div>

      {!engine.ready && (
        <div className="notice" onClick={() => onNav('settings')}>
          One-time setup: add your AI key in Settings before taking photos. Tap here.
        </div>
      )}

      {due.length > 0 && (
        <section className="routines">
          <h2>{heading}</h2>
          {win === 'evening' && doneCount === due.length && due.length > 0 && (
            <p className="sub calm">All photographed tonight. Tap any to see it again.</p>
          )}
          {due.map((r) => {
            const c = todaysCheck(checks, r.id);
            return (
              <button key={r.id} className={'routine-row' + (c ? ' done' : '')}
                onClick={() => { logEvent('routine_open', { routineId: r.id, done: !!c }); onOpenRoutine(r, c); }}>
                {c ? <img src={c.thumb} alt="" /> : <span className="empty-sq" />}
                <span className="rt">
                  <b>{r.name}</b>
                  <span className="state">
                    {c ? `${c.claim?.text || 'Photographed'} · ${clockTime(c.at)}` : 'not yet'}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      )}

      {pinned.length > 0 && (
        <section>
          <h2>Where things are</h2>
          <div className="tile-grid">
            {pinned.map((it) => (
              <button key={it.id} className="tile"
                onClick={() => {
                  logEvent('lookup', { entryMode: 'tile', itemId: it.id, itemName: it.name,
                    answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 });
                  onOpenItem(it);
                }}>
                <img src={it.thumb} alt={it.name} />
                <div className="tile-label">{it.name}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="quiet-h">Other things</h2>
          <div className="tile-grid small">
            {others.map((it) => (
              <button key={it.id} className="tile"
                onClick={() => {
                  logEvent('lookup', { entryMode: 'tile_other', itemId: it.id, itemName: it.name,
                    answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000), matched: 1 });
                  onOpenItem(it);
                }}>
                <img src={it.thumb} alt={it.name} />
                <div className="tile-label">{it.name}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="card"><p className="sub" style={{ margin: 0 }}>Nothing photographed yet. Take a photo of something you often look for.</p></div>
      )}

      <form className="ask-row" onSubmit={ask}>
        <input value={q} placeholder="Ask where something is" onChange={(e) => { setQ(e.target.value); entryMode.current = 'typed'; }} />
        {SR && <button type="button" className={'mic' + (listening ? ' on' : '')} onClick={speak} aria-label="Speak">🎙</button>}
        <button type="submit" disabled={!engine.ready || asking || !q.trim()}>{asking ? '…' : 'Ask'}</button>
      </form>

      <button className="btn-primary" disabled={!engine.ready} onClick={() => onCapture()}>
        📷 Take a photo
      </button>

      <div className="footer-nav">
        <button className="btn-quiet" onClick={() => onNav('recent')}>Recent photos</button>
        <button className="btn-quiet" onClick={() => onNav('settings')}>Settings</button>
      </div>
    </div>
  );
}
