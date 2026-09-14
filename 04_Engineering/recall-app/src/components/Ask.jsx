import { useEffect, useMemo, useRef, useState } from 'react';
import { boardOrder, logEvent } from '../lib/db.js';
import { cap } from '../lib/format.js';
import { useDictation, matchThings, IS_IOS } from '../lib/speech.js';
import Header from './Header.jsx';

// Find item (was Where is my…; board addendum 2026-09-14 — the ellipsis read as a cut-off
// label). The field prompt below keeps *Where is my…* because the box completes it.
// Board decision 2026-09-05, screen 4; revised 2026-09-05 (late) on Ravi's
// proposal: match AS SHE TYPES OR SPEAKS.
//
// The field takes focus on arrival so the keyboard — and on iOS its mic key — is up in one
// tap. From the first two letters, things whose name, place or notes start with what she
// has said so far appear below as tiles, instantly and locally; nothing opens by itself,
// she taps the one she means. That sidesteps "has she finished talking?" entirely — a slow
// speaker sees the tiles narrow as the words land (Linda, James). No history, no "you
// already asked".
//
// *Find it* — the AI — is for the question the tiles cannot answer ("the thing I read
// with"). It is offered once the local list is empty, or always on submit.
export default function Ask({ engine, items, onResult, onBack }) {
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [failed, setFailed] = useState(false);
  const entryMode = useRef('typed');
  const inputRef = useRef(null);
  const dictation = useDictation((text) => { setQ(text); entryMode.current = 'voice'; });

  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const live = useMemo(() => boardOrder(matchThings(items, q)), [items, q]);
  const typed = q.trim().length >= 2;

  function pick(it) {
    logEvent('lookup', { entryMode: entryMode.current, question: q.trim(), matched: live.length, via: 'live',
      itemId: it.id, itemName: it.name || null, answerAgeMin: Math.round((Date.now() - it.lastSeenAt) / 60000) });
    onResult(it);
  }

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
        entryMode: entryMode.current, question, matched: result.matches.length, via: 'ai',
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
      <Header title="Find item" onBack={onBack} />
      <form className="card ask" onSubmit={ask}>
        <label className="ask-q" htmlFor="ask-input">Where is my…</label>
        <div className="ask-row">
          <div className="field">
            <input id="ask-input" ref={inputRef} value={q} placeholder="glasses"
              enterKeyHint="search" autoCapitalize="none" autoComplete="off"
              onChange={(e) => { setQ(e.target.value); entryMode.current = 'typed'; setNoMatch(false); setFailed(false); }} />
            {q && <button type="button" className="clear" aria-label="Clear" onClick={() => { setQ(''); inputRef.current && inputRef.current.focus(); }}>×</button>}
          </div>
          {dictation.supported && (
            <button type="button" className={'mic' + (dictation.listening ? ' on' : '')} onClick={dictation.toggle} aria-label="Say it">🎙</button>
          )}
        </div>
        {IS_IOS && !q && <p className="hint">Tap the microphone key on the keyboard to say it.</p>}

        {/* Live matches: the same tiles as My items, narrowing as she types or speaks. */}
        {typed && live.length > 0 && (
          <div className="board live">
            {live.slice(0, 8).map((it) => (
              <button key={it.id} type="button" className="tile" onClick={() => pick(it)}>
                <img src={it.thumb} alt={it.name || ''} />
                <div className="tile-label">
                  {cap(it.name) || ' '}
                  {it.location && <span className="tile-sub place">{it.location}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* The AI, for the question the tiles can't answer. */}
        {typed && live.length === 0 && !noMatch && (
          <button type="submit" className="btn-primary" disabled={asking}>{asking ? 'Looking…' : 'Find it'}</button>
        )}
        {typed && live.length > 0 && (
          <button type="submit" className="link-btn center" disabled={asking}>{asking ? 'Looking…' : 'Not one of these? Find it'}</button>
        )}
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
