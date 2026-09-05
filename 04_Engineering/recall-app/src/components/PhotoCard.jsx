import { useEffect, useRef, useState } from 'react';
import { compressPhoto } from '../lib/img.js';
import { addItem, nameItem, resnapItem, absorbInto, findByName, knownLocations, logEvent } from '../lib/db.js';
import EditableText from './EditableText.jsx';
import Header from './Header.jsx';

// The photo card. Board decision 2026-09-05, Rules 4–6 and D2/D3/D4.
//
// The camera has already been used (the footer button IS the file input), so this card
// opens with the photo. It asks ONE question — Where is it? — and tapping a place is the
// save. No timer, no Done, no note field.
//
// The AI names the photo in the background (3–8s). The chips do not wait for it. If she
// taps a place before the name arrives, the thing is saved with `naming: true` and named
// when the answer comes (D3). If the name turns out to match something already on the
// board, she is ASKED whether it is the same thing — a merge never happens silently, and
// leaving the card before answering keeps it as a new thing (Priyanka §3.4).
//
// `resnapOf` = "Found it — new photo": the thing is known, so no matching; only the place
// is asked, fresh, because the old room may be stale.
// Places are shown as sentences — "Kitchen counter", not "kitchen counter" (audit I2).
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function PhotoCard({ file, engine, items = [], resnapOf = null, onDone, onBack }) {
  const [photo, setPhoto] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [tag, setTag] = useState(undefined);   // undefined = pending · null = failed · object = named
  const [place, setPlace] = useState('');
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [forceNew, setForceNew] = useState(false);
  const [savedId, setSavedId] = useState(null); // provisional thing saved before its name
  const [pendingMerge, setPendingMerge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [whole, setWhole] = useState(false); // photo shown uncropped (L1)
  const tagPromise = useRef(null);
  const chips = knownLocations(items, 6);

  // Compress, show, and start naming — in that order, so the photo is on screen in well
  // under a second whatever the AI does.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { photo: p, thumb: t } = await compressPhoto(file);
      if (!alive) return;
      setPhoto(p); setThumb(t);
      tagPromise.current = engine.tagPhoto(p, {
        hintName: resnapOf ? resnapOf.name : '',
        knownPlaces: chips,
        catalog: items.map((it) => it.name).filter(Boolean),
        sensitivity: 'personal',
      }).then((r) => r, (err) => { console.error(err); return null; });
      const r = await tagPromise.current;
      if (alive) setTag(r);
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line

  const name = resnapOf ? resnapOf.name : (nameOverride || (tag && tag.name) || '');
  const restingOn = (tag && tag.restingOn) || '';
  // Never match the provisional thing against itself once it has been named.
  const match = !resnapOf && !forceNew && tag ? findByName(items.filter((it) => it.id !== savedId), tag.name) : null;

  // The name arrived after she already saved. Finish the job — or ask, if it matched.
  useEffect(() => {
    if (!savedId || tag === undefined) return;
    (async () => {
      if (tag === null) {
        await nameItem(savedId, {});
        logEvent('naming_failed', { itemId: savedId });
        onDone({ saved: true, place });
        return;
      }
      await nameItem(savedId, { name: tag.name, description: tag.description, restingOn: tag.restingOn });
      if (match) setPendingMerge(true);
      else onDone({ saved: true, place });
    })();
  }, [savedId, tag]); // eslint-disable-line

  // Chips: the AI's ranked guesses first (when they've arrived), then the household's places.
  const guesses = (tag && tag.placeGuesses) || [];
  const seen = new Set(guesses.map((g) => g.toLowerCase()));
  const options = [...guesses, ...chips.filter((c) => !seen.has(c.toLowerCase()))].slice(0, 7);

  async function save(raw, how) {
    if (busy || savedId) return;
    const chosen = cap(raw.trim());
    setBusy(true);
    setPlace(chosen);
    const by = 'self';
    const common = { photo, thumb, location: chosen, by, restingOn };

    if (resnapOf) {
      await resnapItem(resnapOf, common);
      logEvent('capture', { initiatedBy: 'resnap', itemId: resnapOf.id, itemName: resnapOf.name, savedBy: how,
        locationChanged: chosen !== resnapOf.location, aiFailed: tag === null });
      onDone({ saved: true, place: chosen });
      return;
    }

    if (tag !== undefined) {
      // Name known (or known to have failed): one write, straight back to the board.
      if (match) {
        await resnapItem(match, common);
        logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: how });
        logEvent('capture', { initiatedBy: 'self', itemId: match.id, itemName: match.name, savedBy: how, merged: true });
      } else {
        const id = await addItem({ ...common, name, description: (tag && tag.description) || '' });
        if (tag === null) logEvent('naming_failed', { itemId: id });
        logEvent('capture', { initiatedBy: 'self', itemId: id, itemName: name || null, savedBy: how,
          usedChip: chips.includes(chosen), placeFromGuess: guesses.includes(chosen), aiFailed: tag === null });
      }
      onDone({ saved: true, place: chosen });
      return;
    }

    // Name still pending: save now, name later (D3).
    const id = await addItem({ ...common, name: '', naming: true });
    logEvent('capture', { initiatedBy: 'self', itemId: id, itemName: null, savedBy: how, beforeName: true,
      usedChip: chips.includes(chosen) });
    setSavedId(id);
    setBusy(false);
  }

  // Leaving while the name is still on its way: make sure the flag gets cleared anyway.
  function leave(reason) {
    if (savedId && tag === undefined && tagPromise.current) {
      tagPromise.current.then((t) => nameItem(savedId, t ? { name: t.name, description: t.description, restingOn: t.restingOn } : {}));
    }
    if (pendingMerge && match) logEvent('merge', { itemId: match.id, result: 'unseen' });
    logEvent('capture_leave', { reason, savedId: savedId || null });
    onDone(savedId ? { saved: true, place } : null);
  }

  async function mergeYes() {
    setBusy(true);
    await absorbInto(match, savedId, { photo, thumb, location: place, restingOn });
    logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: 'asked' });
    onDone({ saved: true, place });
  }
  function mergeNo() {
    logEvent('merge', { itemId: match.id, result: 'declined' });
    onDone({ saved: true, place });
  }

  // Back in the header: before a save it cancels; after a save it is simply the way home.
  const back = () => {
    if (savedId) leave('done');
    else { logEvent('capture_leave', { reason: 'cancel' }); onBack(); }
  };

  if (!photo) {
    return <div className="screen"><Header title="" onBack={back} /><div className="boot">…</div></div>;
  }

  return (
    <div className="screen">
      <Header title={resnapOf ? 'New photo' : 'Take a photo'} onBack={back} />
      <div className="card photo-card">
        <img className={'photo-full' + (whole ? ' whole' : '')} src={photo} alt="" onClick={() => setWhole((w) => !w)} />

        {/* What it is. Arrives from the AI; editable; never demanded. */}
        {resnapOf ? (
          <div className="head">Your {resnapOf.name.toLowerCase()} — new photo</div>
        ) : tag === undefined ? (
          <div className="skeleton" />
        ) : match ? (
          <div className="head">
            Your {match.name.toLowerCase()} — new photo
            <button type="button" className="link-btn inline" onClick={() => setForceNew(true)}>
              not your {match.name.toLowerCase()}?
            </button>
          </div>
        ) : (
          <EditableText value={name} emptyLabel="Name it" big onSave={(v) => { setNameOverride(v); if (savedId) nameItem(savedId, { name: v }); }} />
        )}

        {/* The one question. Tapping the answer saves. */}
        {!savedId && (
          <div className="ask-place">
            <div className="ask-q">Where is it?</div>
            <div className="guesses">
              {options.map((g) => (
                <button key={g} type="button" className="guess" disabled={busy} onClick={() => save(g, guesses.includes(g) ? 'guess' : 'chip')}>{g}</button>
              ))}
              {!typing && (
                <button type="button" className="guess other" disabled={busy} onClick={() => { setDraft(''); setTyping(true); }}>Somewhere else</button>
              )}
              <button type="button" className="guess quiet" disabled={busy} onClick={() => save('', 'not_sure')}>Not sure</button>
            </div>
            {typing && (
              <div className="typing">
                <input
                  className="place-input" autoFocus value={draft} placeholder="the bathroom counter"
                  enterKeyHint="done" autoCapitalize="none"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) save(draft.trim(), 'typed'); }}
                />
                <button type="button" className="btn-secondary" disabled={!draft.trim() || busy} onClick={() => save(draft.trim(), 'typed')}>Use this</button>
              </div>
            )}
          </div>
        )}

        {/* Saved before the name arrived. Show the place; wait; or leave. */}
        {savedId && !pendingMerge && (
          <div className="saved-wait">
            <div className="chosen">{place || 'No place yet'}</div>
            <div className="skeleton short" />
          </div>
        )}

        {/* The name arrived and it is something already on the board. Ask; never assume. */}
        {pendingMerge && match && (
          <div className="ask-place">
            <div className="ask-q">Is this your {match.name.toLowerCase()}?</div>
            <div className="guesses">
              <button type="button" className="guess" disabled={busy} onClick={mergeYes}>Yes — a new photo of them</button>
              <button type="button" className="guess other" disabled={busy} onClick={mergeNo}>No — a different thing</button>
            </div>
          </div>
        )}
      </div>

      {savedId && <button className="btn-back" onClick={() => leave('done')}>Back to my things</button>}
    </div>
  );
}
