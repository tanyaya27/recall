import { useState } from 'react';
import { useDictation } from '../lib/speech.js';

// "Where is it?" — asked, never assumed.
//
// The photo tells us what the thing is; it usually cannot tell us which room of the house
// it is in. So the place is the one field the person supplies, and every route to an answer
// is one tap: an AI guess, a place this household already uses, the keyboard, or the mic.
//
// Once chosen it collapses to a single line with "change", so the common case — tap the
// right guess, save — is two taps total.
export default function PlaceChooser({ value, guesses = [], known = [], onPick }) {
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const dictation = useDictation((text) => { setDraft(text); setTyping(true); });

  // AI guesses first, then any household places it didn't already suggest.
  const seen = new Set(guesses.map((g) => g.toLowerCase()));
  const extras = known.filter((k) => !seen.has(k.toLowerCase()));

  function commitTyped() {
    const v = draft.trim();
    setTyping(false);
    dictation.stop();
    if (v) onPick(v);
    setDraft('');
  }

  if (value) {
    return (
      <div className="chosen-place">
        <div>
          <div className="field-label">Where it is</div>
          <div className="val">{value}</div>
        </div>
        <button type="button" className="link-btn" style={{ marginLeft: 'auto' }} onClick={() => onPick('')}>
          change
        </button>
      </div>
    );
  }

  return (
    <div className="ask-place">
      <div className="ask-q">Where is it?</div>
      {/* No explanation of why we're asking. She sees this twenty times a day; the question
          carries all the meaning, and a sentence about what the model could and couldn't
          see is the designer talking, not the app helping. The one exception is the very
          first capture, when there is nothing to tap and a nudge genuinely helps.
          `restingOn` is not thrown away — it surfaces on the answer screen, where it is
          the difference between "bathroom counter" and "bathroom counter, on your black
          shorts". Right words, wrong screen. */}
      {guesses.length === 0 && known.length === 0 && (
        <p className="ask-why">Type or say the spot — “the bathroom counter”.</p>
      )}

      <div className="guesses">
        {guesses.map((g) => (
          <button key={g} type="button" className="guess" onClick={() => onPick(g)}>{g}</button>
        ))}
        {extras.map((k) => (
          <button key={k} type="button" className="guess" onClick={() => onPick(k)}>
            {k}<span className="guess-sub">somewhere you use often</span>
          </button>
        ))}
      </div>

      {typing ? (
        <div style={{ marginTop: 10 }}>
          <input
            className="place-input" autoFocus value={draft} placeholder="the bathroom counter"
            enterKeyHint="done" autoCapitalize="none"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTyped(); }}
          />
          <div className="place-tools">
            {dictation.supported && (
              <button type="button" className={dictation.listening ? 'rec' : ''} onClick={dictation.toggle}>
                {dictation.listening ? '● Listening — tap to stop' : '🎙 Say it'}
              </button>
            )}
            <button type="button" onClick={commitTyped} disabled={!draft.trim()}>Use this</button>
          </div>
        </div>
      ) : (
        <div className="place-tools">
          <button type="button" onClick={() => { setDraft(''); setTyping(true); }}>⌨️ Type it</button>
          {dictation.supported && (
            <button type="button" onClick={() => { setDraft(''); setTyping(true); dictation.toggle(); }}>🎙 Say it</button>
          )}
        </div>
      )}
    </div>
  );
}
