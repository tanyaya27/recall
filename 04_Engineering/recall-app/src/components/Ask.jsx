import { useEffect, useRef, useState } from 'react';
import { logEvent } from '../lib/db.js';
import { useDictation } from '../lib/speech.js';
import Header from './Header.jsx';

// Where is my…  Board decision 2026-09-05, screen 4 and D9.
//
// One field, focused on arrival so the keyboard — and on iOS its mic key — is up in one
// tap. Our own mic button renders only where the browser has the API (Android Chrome);
// Priyanka §3.2. No history, no "you already asked" (Linda). The result is the thing card,
// or one line and the camera. The model's sentence is never shown (D8).
export default function Ask({ engine, items, onResult, onBack }) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [failed, setFailed] = useState(false);
  const entryMode = useRef('typed');
  const inputRef = useRef(null);
  const dictation = useDictation((text) => { setQ(text); entryMode.current = 'voice'; });

  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  async function ask(e) {
    if (e) e.preventDefault();
    const question = q.trim();
    if (!question || asking) return;
    dictation.stop();
    setAsking(true); setNoMatch(false); setFailed(false);
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
      if (top) { onResult(top); return; }
      setNoMatch(true);
    } catch (err) {
      console.error(err);
      logEvent('lookup_failed', { entryMode: entryMode.current, latencyMs: Date.now() - t0 });
      setFailed(true);
    }
    setAsking(false);
    entryMode.current = 'typed';
  }

  return (
    <div className="screen">
      <Header title="Where is my…" onBack={onBack} />
      <form className="card ask" onSubmit={ask}>
        <label className="ask-q" htmlFor="ask-input">Where is my…</label>
        <div className="ask-row">
          <div className="field">
            <input id="ask-input" ref={inputRef} value={q} placeholder="glasses"
              enterKeyHint="search" autoCapitalize="none" autoComplete="off"
              onChange={(e) => { setQ(e.target.value); entryMode.current = 'typed'; }} />
            {q && <button type="button" className="clear" aria-label="Clear" onClick={() => { setQ(''); inputRef.current && inputRef.current.focus(); }}>×</button>}
          </div>
          {dictation.supported && (
            <button type="button" className={'mic' + (dictation.listening ? ' on' : '')} onClick={dictation.toggle} aria-label="Say it">🎙</button>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={asking || !q.trim()}>{asking ? 'Looking…' : 'Find it'}</button>
        {asking && <><div className="skeleton" /><div className="skeleton short" /></>}

        {noMatch && (
          <div className="answer-none">
            <p>No photo of that yet.</p>
            <label className="btn-secondary file">
              Take a photo of it
              <input type="file" accept="image/*" capture="environment"
                onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) onResult(null, f); }} />
            </label>
          </div>
        )}
        {failed && <p className="answer-none">Couldn't check just now.</p>}
      </form>
    </div>
  );
}
