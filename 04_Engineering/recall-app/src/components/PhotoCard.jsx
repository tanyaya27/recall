import { useEffect, useRef, useState } from 'react';
import { compressPhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, absorbInto, findMatch, knownLocations, noteAlias, logEvent, placeThumb, updateItem } from '../lib/db.js';
import { getPrefs, savePrefs } from '../lib/prefs.js';
import { matchThings } from '../lib/speech.js';
import EditableText from './EditableText.jsx';
import Header from './Header.jsx';
import { CameraIcon, CloseIcon, PinIcon, CheckIcon } from './Icons.jsx';
import { MAX_SHOTS } from './Camera.jsx';

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
// "your my favorite mug" → "your favorite mug": drop a leading my/the from a name in a sentence.
export const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');

// "One thing" capture mode (MVP step 2, DECISIONS 2026-09-24; drawn as C1 option 2): when the app
// knows the likely place — where this thing usually lives, or the place used a moment ago — that
// place is already chosen, and *Done* / *Next item* save it with no question. Tapping any other
// place still saves at once, exactly as before. *Next item* goes straight back to the camera.
export default function PhotoCard({ files = [], engine, items = [], places = [], resnapOf = null, onDone, onBack, onMore, pendingFiles = null, onPendingTaken, owner = undefined, ownerName = '', presetPlace = '', onNext = null }) {
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
  const nextRef = useRef(false); // saved with *Next item*: the caller reopens the camera
  const finish = (r) => onDone(r && nextRef.current ? { ...r, next: true } : r);
  const visualStarted = useRef(false);
  const chips = knownLocations(items, 8, places);

  // Compress, show, and start naming — in that order, so the photo is on screen in well
  // under a second whatever the AI does.
  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await Promise.all(files.slice(0, MAX_SHOTS).map((f) => compressPhoto(f)));
      if (!alive) return;
      setShots(all);
      tagPromise.current = engine.tagPhoto(all.map((s) => s.photo), {
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
        const r = await engine.sameThing(shots.map((s) => s.photo), cands.map((c, i) => ({ name: c.name, thumb: small[i] })), { subject: tag.name, sensitivity: 'personal' });
        if (!alive) return;
        // Only a CONFIDENT visual match may stand in for a name (Maya's guardrail): an unsure
        // one is how the can behind the keyboard took over the card.
        const hit = r.index >= 0 && r.sure ? cands[r.index] : null;
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
        finish({ saved: true, place, itemId: savedId });
        return;
      }
      await nameItem(savedId, { name: nameOverride || tag.name, description: tag.description, restingOn: tag.restingOn, details: tag.details,
        aliases: nameOverride && tag.name !== nameOverride ? [tag.name] : [] });
      if (match) { finished.current = false; setPendingMerge(true); }
      else finish({ saved: true, place, itemId: savedId });
    })();
  }, [savedId, identityKnown]); // eslint-disable-line

  // Chips: the AI's ranked guesses first (when they've arrived), then the household's places.
  const guesses = (tag && tag.placeGuesses) || [];
  const seen = new Set(guesses.map((g) => g.toLowerCase()));
  // The place already chosen (One thing mode): where this thing usually lives, else the place used a moment ago.
  const usual = !resnapOf && match && match.location ? match.location : '';
  const preset = resnapOf ? '' : (usual || presetPlace || '');
  const presetSource = usual ? 'usual' : 'session';
  const options = [...guesses, ...chips.filter((c) => !seen.has(c.toLowerCase()))].filter((o) => !preset || o.toLowerCase() !== preset.toLowerCase()).slice(0, preset ? 6 : 7);

  // "Where is it?" view (round 7, Ravi): names only / smaller photos / bigger photos, switched by
  // the links under the list and remembered on this phone. Until a choice is made, photos come
  // in on their own as soon as any place has a picture of its own.
  const [placeView, setPlaceView] = useState(() => getPrefs().placeView);
  const anyPlacePhoto = places.some((p) => p.photos && p.photos.length);
  const view = placeView || (anyPlacePhoto ? 'small' : 'names');
  const pickView = (v) => { setPlaceView(v); savePrefs({ ...getPrefs(), placeView: v }); logEvent('place_view', { view: v }); };
  const VIEW_LABEL = { names: 'Names only', small: 'Smaller photos', big: 'Bigger photos' };
  const pic = (name) => placeThumb(name, places, items);

  // More shots came back from the camera after this card opened. Name again with ALL of
  // them (the close-up may change the answer), and look again for a duplicate.
  useEffect(() => {
    if (!pendingFiles || !pendingFiles.length) return;
    (async () => {
      const more = await Promise.all(pendingFiles.map((f) => compressPhoto(f)));
      let next;
      setShots((prev) => { next = [...prev, ...more].slice(0, MAX_SHOTS); setCurrent(next.length - 1); return next; });
      logEvent('capture_shot', { added: more.length });
      onPendingTaken && onPendingTaken();
      if (savedId || nameOverride || resnapOf) return;
      setTag(undefined); setVisual('idle'); visualStarted.current = false;
      const r = await engine.tagPhoto((next || shots).map((s) => s.photo), {
        knownPlaces: chips, catalog: items.filter((it) => it.name).map((it) => ({ name: it.name, aliases: it.aliases || [] })), sensitivity: 'personal',
      }).then((x) => x, (err) => { console.error(err); return null; });
      setTag(r);
    })();
  }, [pendingFiles]); // eslint-disable-line

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

  async function save(raw, how, next = false) {
    if (busy || savedId) return;
    const chosen = cap(raw.trim());
    nextRef.current = !!next;
    setBusy(true);
    setPlace(chosen);
    const by = 'self';
    const placeSource = how === 'preset' ? presetSource : 'chosen';
    const common = { photo: cover.photo, thumb: cover.thumb, location: chosen, by, restingOn, extras, placeSource, ...(owner ? { owner } : {}) }; // Phase 2: a helper logs INTO the owner's ReCall

    if (resnapOf) {
      await resnapItem(resnapOf, common);
      if (tag && tag.name) noteAlias(resnapOf, tag.name);
      logEvent('capture', { initiatedBy: 'resnap', itemId: resnapOf.id, itemName: resnapOf.name, savedBy: how, shots: shots.length,
        locationChanged: chosen !== resnapOf.location, aiFailed: tag === null });
      finish({ saved: true, place: chosen, itemId: resnapOf.id });
      return;
    }

    if (identityKnown) {
      let itemId;
      if (match) {
        await resnapItem(match, common);
        if (tag && tag.name) noteAlias(match, tag.name); // what the AI called it this time
        if (tag && tag.details && !match.details) updateItem(match.id, { details: tag.details }); // the label, if it had none
        itemId = match.id;
        logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: how, via: nameMatch ? (tag.sameAs ? 'sameAs' : 'name') : 'visual' });
        logEvent('capture', { initiatedBy: 'self', itemId: match.id, itemName: match.name, savedBy: how, merged: true, shots: shots.length });
      } else {
        itemId = await addItem({ ...common, name, description: (tag && tag.description) || '', details: (tag && tag.details) || '',
          aliases: tag && tag.name && nameOverride && tag.name !== nameOverride ? [tag.name] : [] });
        if (tag === null) logEvent('naming_failed', { itemId });
        logEvent('capture', { initiatedBy: 'self', itemId, itemName: name || null, savedBy: how, shots: shots.length,
          usedChip: chips.includes(chosen), placeFromGuess: guesses.includes(chosen), aiFailed: tag === null });
      }
      finish({ saved: true, place: chosen, itemId });
      return;
    }

    // Name or identity still pending: save now, finish later (D3).
    const id = await addItem({ ...common, name: tag ? (nameOverride || tag.name) : '', description: (tag && tag.description) || '', details: (tag && tag.details) || '', naming: tag === undefined });
    logEvent('capture', { initiatedBy: 'self', itemId: id, itemName: tag ? tag.name : null, savedBy: how, beforeName: tag === undefined, beforeIdentity: true,
      shots: shots.length, usedChip: chips.includes(chosen), mode: 'one', next: !!next });
    if (next) { // don't wait here: the name is finished in the background, and the camera opens again
      finished.current = true;
      if (tagPromise.current) tagPromise.current.then((t) => nameItem(id, t ? { name: nameOverride || t.name, description: t.description, restingOn: t.restingOn, details: t.details } : {}));
      finish({ saved: true, place: chosen, itemId: id });
      return;
    }
    setSavedId(id);
    setBusy(false);
  }

  // Leaving while the name is still on its way: make sure the flag gets cleared anyway.
  function leave(reason) {
    if (savedId && tag === undefined && tagPromise.current) {
      tagPromise.current.then((t) => nameItem(savedId, t ? { name: t.name, description: t.description, restingOn: t.restingOn, details: t.details } : {}));
    }
    if (pendingMerge && match) logEvent('merge', { itemId: match.id, result: 'unseen' });
    logEvent('capture_leave', { reason, savedId: savedId || null });
    finish(savedId ? { saved: true, place, itemId: savedId } : null);
  }

  async function mergeYes() {
    setBusy(true);
    await absorbInto(match, savedId, { photo: cover.photo, thumb: cover.thumb, location: place, restingOn, extras });
    if (tag && tag.name) noteAlias(match, tag.name);
    logEvent('merge', { itemId: match.id, result: 'confirmed', savedBy: 'asked', via: nameMatch ? 'name' : 'visual' });
    finish({ saved: true, place, itemId: match.id });
  }
  function mergeNo() {
    logEvent('merge', { itemId: match.id, result: 'declined', via: nameMatch ? 'name' : 'visual' });
    finish({ saved: true, place, itemId: savedId });
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
      <Header title={resnapOf ? 'New photo' : (ownerName ? `Log item · in ${ownerName}’s ReCall` : 'Log item')} onBack={back} />
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
              <button type="button" className="roll-add" aria-label="Take another photo" onClick={() => onMore(MAX_SHOTS - shots.length)}>
                <CameraIcon /><span>Another</span>
              </button>
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
              Not your {own(match.name)}?
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
            <div className={'guesses' + (view === 'big' ? ' big' : '')}>
              {view === 'big' && (
                <div className="pgrid">
                  {options.map((g) => { const t = pic(g); return (
                    <button key={g} type="button" className="pcell" disabled={busy} onClick={() => save(g, guesses.includes(g) ? 'guess' : 'chip')}>
                      {t ? <img src={t.src} alt="" /> : <span className="pcell-none"><PinIcon /></span>}
                      <span className="cap">{g}</span>
                    </button>); })}
                </div>
              )}
              {preset && (
                <>
                  <button type="button" className="guess pre" disabled={busy} onClick={() => save(preset, 'preset')}>
                    <span>{preset} <small>· {presetSource === 'usual' ? 'usual place' : 'just used'}</small></span><CheckIcon />
                  </button>
                  {/* Done / Next item right under the chosen place, so they're never below the fold. In the flow: a keyboard may open here. */}
                  {!typing && (
                    <div className="next-row">
                      {onNext && <button type="button" className="btn-primary" disabled={busy} onClick={() => save(preset, 'preset', true)}><CameraIcon /><span>Next item</span></button>}
                      <button type="button" className="btn-primary alt" disabled={busy} onClick={() => save(preset, 'preset')}><CheckIcon /><span>Done</span></button>
                    </div>
                  )}
                  <div className="or-else">Somewhere else?</div>
                </>
              )}
              {view !== 'big' && options.map((g) => { const t = view === 'small' ? pic(g) : null; return (
                <button key={g} type="button" className={'guess' + (view === 'small' ? ' withpic' : '')} disabled={busy} onClick={() => save(g, guesses.includes(g) ? 'guess' : 'chip')}>
                  {view === 'small' && (t ? <img className="guess-pic" src={t.src} alt="" /> : <span className="guess-pic none"><PinIcon /></span>)}
                  <span>{g}</span>
                </button>); })}
              {!typing && (
                <button type="button" className="guess other" disabled={busy} onClick={() => { setDraft(''); setTyping(true); }}>Somewhere else</button>
              )}
              {!preset && <button type="button" className="guess quiet" disabled={busy} onClick={() => save('', 'not_sure')}>Not sure</button>}
              {options.length > 0 && (
                <div className="view-links">
                  {['names', 'small', 'big'].filter((v) => v !== view).map((v) => (
                    <button key={v} type="button" className="link-btn" onClick={() => pickView(v)}>{VIEW_LABEL[v]}</button>
                  ))}
                </div>
              )}
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
            <div className="ask-q">Is this your {own(match.name)}?</div>
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
