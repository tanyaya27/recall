import { useEffect, useRef, useState } from 'react';
import { compressPhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, absorbInto, findMatch, knownLocations, noteAlias, logEvent } from '../lib/db.js';
import { matchThings } from '../lib/speech.js';
import EditableText from './EditableText.jsx';
import Header from './Header.jsx';
import { CameraIcon, CloseIcon } from './Icons.jsx';

// The photo card — after the camera. Board decision 2026-09-05, screen 2 (D2, D3, D4);
// revised 2026-09-14 rounds 2 and 3 (Ravi):
//
//   THE ROLL. She can take as many photos as she wants before choosing the place: each one
//   lands as a thumbnail under the big photo with a large ✕; the camera tile takes another;
//   tapping the place saves them all as ONE log. The first photo is the cover and the one
//   the AI names. Up to MAX_SHOTS.
//
//   IDENTITY. Rule 6: a new photo of a thing already on the board is a new photo of it, not
//   a new thing — and the person has, by definition, forgotten they logged it. Three
//   tiers, in order, each only if the one before found nothing:
//     1. the AI's own "sameAs" from naming (it saw the photo and the list of names);
//     2. name/alias/head-noun/shared-word matching (lib/db findMatch);
//     3. the AI LOOKS: the new photo next to the photos of up to six candidates.
//   Nothing merges silently: the card shows *Your X — new photo* with *Not your X?*; if the
//   verdict lands after she already saved, it asks *Is this your X?* (D3/D4).
//
// The AI names the photo in the background (3–8s). The chips do not wait for it. If she
// taps a place first, the thing is saved at once with `naming: true` and finished later.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const MAX_SHOTS = 4;

export default function PhotoCard({ file, engine, items = [], places = [], resnapOf = null, onDone, onBack }) {
  const [shots, setShots] = useState([]);       // [{ photo, thumb }] — first is the cover
  const [current, setCurrent] = useState(0);    // which shot is big
  const [tag, setTag] = useState(undefined);    // undefined = pending · null = failed · object = named
  const [visual, setVisual] = useState('idle'); // 'idle' | 'pending' | null | item — tier 3
  const [place, setPlace] = useState('');
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [forceNew, setForceNew] = useState(false);
  const [savedId, setSavedId] = useState(null); // provisional thing saved before its identity was known
  const [pendingMerge, setPendingMerge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [whole, setWhole] = useState(false);    // photo shown uncropped (L1)
  const tagPromise = useRef(null);
  const finished = useRef(false);
  const visualStarted = useRef(false);
  const chips = knownLocations(items, 8, places);

  // Compress, show, and start naming — in that order, so the photo is on screen in well
  // under a second whatever the AI does.
  useEffect(() => {
    let alive = true;
    (async () => {
      const first = await compressPhoto(file);
      if (!alive) return;
      setShots([first]);
      tagPromise.current = engine.tagPhoto(first.photo, {
        hintName: resnapOf ? resnapOf.name : '',
        knownPlaces: chips,
        catalog: items.filter((it) => it.name).map((it) => ({ name: it.name, aliases: it.aliases || [] })),
        sensitivity: 'personal',
      }).then((r) => r, (err) => { console.error(err); return null; });
      const r = await tagPromise.current;
      if (alive) setTag(r);
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line

  const photo = shots[0] ? shots[0].photo : null;
  const name = resnapOf ? resnapOf.name : (nameOverride || (tag && tag.name) || '');
  const restingOn = (tag && tag.restingOn) || '';
  const others = items.filter((it) => it.id !== savedId && !it.deleted);
  // Never match the provisional thing against itself once it has been named.
  const nameMatch = !resnapOf && !forceNew && tag ? findMatch(others, tag) : null;
  const match = nameMatch || (!resnapOf && !forceNew && visual && typeof visual === 'object' ? visual : null);

  // Tier 3 — the AI looks. Only when naming found nothing and there is something to compare.
  useEffect(() => {
    if (resnapOf || tag === undefined || tag === null || nameMatch || visualStarted.current) return;
    visualStarted.current = true;
    if (!others.length || !photo) { setVisual(null); return; }
    let alive = true;
    setVisual('pending');
    (async () => {
      // Candidates: nearest by name (search tiers), then the most recently seen; six at most.
      const byName = matchThings(others, [tag.name, ...(tag.alternatives || [])].join(' '));
      const recent = [...others].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
      const cands = []; [...byName, ...recent].forEach((it) => { if (cands.length < 6 && !cands.includes(it) && it.thumb) cands.push(it); });
      const t0 = Date.now();
      try {
        const small = await Promise.all(cands.map((c) => shrink(c.thumb, 320)));
        const r = await engine.sameThing(photo, cands.map((c, i) => ({ name: c.name, thumb: small[i] })), { sensitivity: 'personal' });
        if (!alive) return;
        const hit = r.index >= 0 ? cands[r.index] : null;
        logEvent('identity_check', { candidates: cands.length, hit: hit ? hit.id : null, sure: r.sure, latencyMs: Date.now() - t0 });
        setVisual(hit);
      } catch (err) {
        console.error(err);
        if (alive) { logEvent('identity_check', { candidates: cands.length, failed: true, latencyMs: Date.now() - t0 }); setVisual(null); }
      }
    })();
    return () => { alive = false; };
  }, [tag, nameMatch]); // eslint-disable-line

  // Identity is settled when: naming failed, or a name match exists, or the visual check is done.
  const identityKnown = tag === null || (tag !== undefined && (!!nameMatch || (visual !== 'idle' && visual !== 'pending'))) || !!resnapOf;

  // She saved before the identity was settled. Finish the job — or ask, if it matched.
  useEffect(() => {
    if (!savedId || !identityKnown || finished.current) return;
    finished.current = true;
    (async () => {
      if (tag === null) {
        await nameItem(savedId, {});
        logEvent('naming_failed', { itemId: savedId });
        onDone({ saved: true, place, itemId: savedId });
        return;
      }
      await nameItem(savedId, { name: nameOverride || tag.name, description: tag.description, restingOn: tag.restingOn,
        aliases: nameOverride && tag.name !== nameOverride ? [tag.name] : [] });
      if (match) { finished.current = false; setPendingMerge(true); }
      else onDone({ saved: true, place, itemId: savedId });
    })();
  }, [savedId, identityKnown]); // eslint-disable-line

  // Chips: the AI's ranked guesses first (when they've arrived), then the household's places.
  const guesses = (tag && tag.placeGuesses) || [];
  const seen = new Set(guesses.map((g) => g.toLowerCase()));
  const options = [...guesses, ...chips.filter((c) => !seen.has(c.toLowerCase()))].slice(0, 7);

  // The roll
  async function addShot(f) {
    if (shots.length >= MAX_SHOTS) return;
    const s = await compressPhoto(f);
    setShots((prev) => { const next = [...prev, s]; setCurrent(next.length - 1); return next; });
    logEvent('capture_shot', { index: shots.length + 1 });
  }
  function dropShot(i) {
    logEvent('capture_shot_dropped', { index: i + 1, of: shots.length });
    if (shots.length === 1) { logEvent('capture_leave', { reason: 'dropped_only_photo' }); onBack(); return; }
    setShots((prev) => prev.filter((_, j) => j !== i));
    setCurrent((c) => Math.max(0, Math.min(c > i ? c - 1 : c, shots.length - 2)));
  }
  const cover = shots[0] || {};
  const extras = shots.slice(1);

  async function save(raw, how) {
    if (busy || savedId) return;
    const chosen = cap(raw.trim());
    setBusy(true);
    setPlace(chosen);
    const by = 'self';
    const common = { photo: cover.photo, thumb: cover.thumb, location: chosen, by, restingOn, extras };

    if (resnapOf) {
      await resnapItem(resnapOf, common);
      if (tag && tag.name) noteAlias(resnapOf, tag.name);
      logEvent('capture', { initiatedBy: 'resnap', itemId: resnapOf.id, itemName: resnapOf.name, savedBy: how, shots: shots.length,
        locationChanged: chosen !== resnapOf.location, aiFailed: tag === null });
      onDone({ saved: true, place: chosen, itemId: resnapOf.id });
      return;
    }

    if (identityKnown) {
      let itemId;
      if (match) {
        await resnapItem(match, common);
        if (tag && tag.name) noteAlias(match, tag.name); // what the AI called it this time
        itemId = match.id;
        logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: how, via: nameMatch ? (tag.sameAs ? 'sameAs' : 'name') : 'visual' });
        logEvent('capture', { initiatedBy: 'self', itemId: match.id, itemName: match.name, savedBy: how, merged: true, shots: shots.length });
      } else {
        itemId = await addItem({ ...common, name, description: (tag && tag.description) || '',
          aliases: tag && tag.name && nameOverride && tag.name !== nameOverride ? [tag.name] : [] });
        if (tag === null) logEvent('naming_failed', { itemId });
        logEvent('capture', { initiatedBy: 'self', itemId, itemName: name || null, savedBy: how, shots: shots.length,
          usedChip: chips.includes(chosen), placeFromGuess: guesses.includes(chosen), aiFailed: tag === null });
      }
      onDone({ saved: true, place: chosen, itemId });
      return;
    }

    // Name or identity still pending: save now, finish later (D3).
    const id = await addItem({ ...common, name: tag ? (nameOverride || tag.name) : '', description: (tag && tag.description) || '', naming: tag === undefined });
    logEvent('capture', { initiatedBy: 'self', itemId: id, itemName: tag ? tag.name : null, savedBy: how, beforeName: tag === undefined, beforeIdentity: true,
      shots: shots.length, usedChip: chips.includes(chosen) });
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
    onDone(savedId ? { saved: true, place, itemId: savedId } : null);
  }

  async function mergeYes() {
    setBusy(true);
    await absorbInto(match, savedId, { photo: cover.photo, thumb: cover.thumb, location: place, restingOn, extras });
    if (tag && tag.name) noteAlias(match, tag.name);
    logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: 'asked', via: nameMatch ? 'name' : 'visual' });
    onDone({ saved: true, place, itemId: match.id });
  }
  function mergeNo() {
    logEvent('merge', { itemId: match.id, result: 'declined', via: nameMatch ? 'name' : 'visual' });
    onDone({ saved: true, place, itemId: savedId });
  }

  // Back in the header: before a save it cancels; after a save it is simply the way home.
  const back = () => {
    if (savedId) leave('done');
    else { logEvent('capture_leave', { reason: 'cancel' }); onBack(); }
  };

  if (!photo) {
    return <div className="screen"><Header title="" onBack={back} /><div className="boot">…</div></div>;
  }
  const big = shots[Math.min(current, shots.length - 1)];

  return (
    <div className="screen">
      <Header title={resnapOf ? 'New photo' : 'Log item'} onBack={back} />
      <div className="card photo-card">
        <img className={'photo-full' + (whole ? ' whole' : '')} src={big.photo} alt="" onClick={() => setWhole((w) => !w)} />

        {/* The roll: every photo taken for this log, a big ✕ on each, and the camera for one more. */}
        {!savedId && (
          <div className="roll" aria-label="Photos in this log">
            {shots.map((s, i) => (
              <div className={'roll-shot' + (i === current ? ' on' : '')} key={i}>
                <img src={s.thumb} alt={`Photo ${i + 1}`} onClick={() => setCurrent(i)} />
                <button type="button" className="roll-x" aria-label={`Remove photo ${i + 1}`} onClick={() => dropShot(i)}><CloseIcon /></button>
              </div>
            ))}
            {shots.length < MAX_SHOTS && (
              <label className="roll-add file" aria-label="Take another photo">
                <CameraIcon /><span>Another</span>
                <input type="file" accept="image/*" capture="environment"
                  onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) addShot(f); }} />
              </label>
            )}
          </div>
        )}

        {/* What it is. Arrives from the AI; editable; never demanded. */}
        {resnapOf ? (
          <><div className="eyebrow">New photo of</div><div className="head">{cap(resnapOf.name)}</div></>
        ) : tag === undefined ? (
          <div className="skeleton" />
        ) : match ? (
          <>
            <div className="eyebrow">New photo of</div>
            <div className="head">{cap(match.name)}</div>
            <button type="button" className="link-btn" onClick={() => { setForceNew(true); logEvent('merge', { itemId: match.id, result: 'declined_early', via: nameMatch ? 'name' : 'visual' }); }}>
              Not your {match.name.toLowerCase()}?
            </button>
          </>
        ) : (
          <>
            <EditableText value={name} emptyLabel="Name it" big onSave={(v) => { setNameOverride(v); if (savedId) nameItem(savedId, { name: v, aliases: tag && tag.name && tag.name !== v ? [tag.name] : [] }); }} />
            {visual === 'pending' && <div className="note-quiet">Checking it isn't already saved…</div>}
          </>
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
              <button type="button" className="guess fixed" disabled={busy} onClick={mergeYes}>Yes, the same thing</button>
              <button type="button" className="guess other" disabled={busy} onClick={mergeNo}>No, a different thing</button>
            </div>
          </div>
        )}
      </div>

      {savedId && <button className="btn-back" onClick={() => leave('done')}>Back to my items</button>}
    </div>
  );
}
