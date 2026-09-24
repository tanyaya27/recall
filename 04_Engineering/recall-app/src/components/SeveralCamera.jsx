import { useRef, useState } from 'react';
import Camera from './Camera.jsx';
import PlacePicker from './PlacePicker.jsx';
import { compressPhoto } from '../lib/img.js';
import { addItem, nameItem, changeLocation, absorbInto, addSnapToLog, findMatch, knownLocations, logEvent } from '../lib/db.js';
import { own } from './PhotoCard.jsx';
import { PinIcon, CheckIcon, PlusIcon, ChevronDownIcon } from './Icons.jsx';

// "Several" capture mode (MVP step 2, DECISIONS 2026-09-24; drawn as C1 option 1).
//
// The camera never leaves. Every shutter press SAVES a thing at once (with `naming: true`, D3),
// and the AI's name and place stream into a frosted strip over the live viewfinder. The next
// shutter press is the acceptance; there is no confirm page and no timer.
//
// Where the place comes from, best source first (brainstorm §2), stored as `placeSource`:
//   session — a place chosen earlier in this run (tap a place once; it sticks for the next shots)
//   usual   — the thing turned out to be one already saved: it goes where it usually lives
//   guess   — the AI was sure (placeCertain) — rare on a close-up
// otherwise the strip asks: three choices, none picked. Nothing blocks the next photo.
//
// A photo that looks like a thing already saved is ASKED about in the strip — never merged
// silently (LESSONS 09-05). The ＋ on the thumbnail makes the next photo another angle of it.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function SeveralCamera({ engine, items = [], places = [], owner, title, modes, onMode, onClose }) {
  const [entries, setEntries] = useState([]);      // newest last: { key, id, thumb, name, status, place, source, choices, match, angles }
  const [session, setSession] = useState(null);    // the place for the next shots, once one is chosen
  const [angleFor, setAngleFor] = useState(null);  // entry key: the next photo is another angle of it
  const [picking, setPicking] = useState(null);    // entry key whose place is being chosen, or 'session'
  const sessionRef = useRef(null); sessionRef.current = session;
  const angleRef = useRef(null); angleRef.current = angleFor;
  const entriesRef = useRef([]); entriesRef.current = entries;
  const mine = useRef(new Set());                  // ids saved in this run: never a "same thing" candidate
  const t0 = useRef(Date.now());
  const chips = knownLocations(items, 8, places);
  const live = (id) => items.find((it) => it.id === id) || { id, history: [], location: '' };
  const patch = (key, p) => setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...(typeof p === 'function' ? p(e) : p) } : e)));

  async function shoot(file) {
    const key = `s${Date.now()}`;
    const angleKey = angleRef.current;
    if (angleKey) { // another angle of the thing in the strip
      setAngleFor(null);
      const e = entriesRef.current.find((x) => x.key === angleKey);
      if (e && e.id) {
        const shot = await compressPhoto(file);
        const ok = await addSnapToLog(live(e.id), shot);
        if (ok) patch(angleKey, (x) => ({ angles: (x.angles || 1) + 1 }));
        logEvent('capture_shot', { mode: 'several', angleOf: e.id, added: ok });
      }
      return;
    }
    const s = sessionRef.current;
    setEntries((prev) => [...prev, { key, thumb: null, status: 'saving', place: s ? s.name : '', source: s ? 'session' : '', angles: 1 }]);
    const shot = await compressPhoto(file);
    patch(key, { thumb: shot.thumb });
    const id = await addItem({ photo: shot.photo, thumb: shot.thumb, location: s ? s.name : '', naming: true, placeSource: s ? 'session' : '', ...(owner ? { owner } : {}) });
    mine.current.add(id);
    patch(key, { id, status: 'naming' });
    logEvent('capture', { initiatedBy: 'self', mode: 'several', itemId: id, beforeName: true, placeSource: s ? 'session' : null, index: entriesRef.current.length });

    const tag = await engine.tagPhoto([shot.photo], {
      knownPlaces: chips, catalog: items.filter((it) => it.name && !mine.current.has(it.id)).map((it) => ({ name: it.name, aliases: it.aliases || [] })), sensitivity: 'personal',
    }).then((r) => r, (err) => { console.error(err); return null; });
    if (!tag) {
      await nameItem(id, {});
      logEvent('naming_failed', { itemId: id, mode: 'several' });
      patch(key, (e) => ({ status: 'named', name: '', choices: e.place ? null : chips.slice(0, 3) }));
      return;
    }
    const match = findMatch(items.filter((it) => !mine.current.has(it.id) && !it.deleted), tag);
    if (match) { // ask in the strip; never merge silently
      await nameItem(id, { name: tag.name, description: tag.description, restingOn: tag.restingOn, details: tag.details });
      patch(key, { status: 'ask', name: tag.name, match, shot, restingOn: tag.restingOn, details: tag.details });
      return;
    }
    await nameItem(id, { name: tag.name, description: tag.description, restingOn: tag.restingOn, details: tag.details });
    const cur = entriesRef.current.find((e) => e.key === key);
    if (cur && !cur.place && tag.placeCertain && tag.placeGuesses && tag.placeGuesses[0]) {
      await changeLocation(live(id), cap(tag.placeGuesses[0]), 'guess');
      patch(key, { status: 'named', name: tag.name, place: cap(tag.placeGuesses[0]), source: 'guess' });
      return;
    }
    const seen = new Set();
    const choices = [...(tag.placeGuesses || []).map(cap), ...chips].filter((c) => { const k = c.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
    patch(key, (e) => ({ status: 'named', name: tag.name, choices: e.place ? null : choices }));
  }

  // She tapped a place in the strip (or chose one in the picker): this thing goes there, and so do the next ones.
  async function choosePlace(key, name) {
    const e = entriesRef.current.find((x) => x.key === key);
    setPicking(null);
    if (!e || !e.id || !name) return;
    await changeLocation(live(e.id), name, 'chosen');
    patch(key, { place: name, source: 'chosen', choices: null });
    setSession({ name });
    logEvent('capture_place', { mode: 'several', itemId: e.id, place: name, fromChips: !!e.choices });
  }
  async function answer(key, yes) {
    const e = entriesRef.current.find((x) => x.key === key);
    if (!e || !e.match) return;
    if (yes) {
      const place = e.place || e.match.location || '';
      await absorbInto(e.match, e.id, { photo: e.shot.photo, thumb: e.shot.thumb, location: place, restingOn: e.restingOn || '', placeSource: e.place ? e.source || 'session' : 'usual' });
      mine.current.delete(e.id); mine.current.add(e.match.id);
      patch(key, { id: e.match.id, status: 'named', name: e.match.name, place, source: e.place ? e.source : 'usual', match: null, choices: place ? null : chips.slice(0, 3) });
      logEvent('merge', { itemId: e.match.id, result: 'confirmed', via: 'several_strip' });
    } else {
      patch(key, (x) => ({ status: 'named', match: null, choices: x.place ? null : chips.slice(0, 3) }));
      logEvent('merge', { itemId: e.match.id, result: 'declined', via: 'several_strip' });
    }
  }

  function close() {
    const saved = entriesRef.current.filter((e) => e.id);
    logEvent('capture_session', { mode: 'several', things: saved.length, ms: Date.now() - t0.current,
      unplaced: saved.filter((e) => !e.place).length, sessionPlace: sessionRef.current ? sessionRef.current.name : null });
    onClose(saved.map((e) => ({ id: e.id, name: e.name || '', place: e.place || '' })));
  }

  const last = entries[entries.length - 1];
  const strip = last && (
    <div className="strip1" aria-live="polite">
      <div className="th">
        {last.thumb ? <img src={last.thumb} alt="" /> : <span className="th-wait" />}
        {last.id && last.status !== 'ask' && (
          <button type="button" className={'ang' + (angleFor === last.key ? ' on' : '')} aria-label="Next photo is another angle of this"
            onClick={() => setAngleFor(angleFor === last.key ? null : last.key)}><PlusIcon /></button>
        )}
      </div>
      <div className="bd">
        <div className="saved">{last.id ? <><CheckIcon /> Saved{last.angles > 1 ? ` · ${last.angles} photos` : ''}</> : 'Saving…'}</div>
        {angleFor === last.key && <div className="q">Next photo: another angle of this</div>}
        {last.status === 'ask' ? (
          <>
            <div className="nm">Your {own(last.match.name)}?</div>
            <div className="chips">
              <button type="button" onClick={() => answer(last.key, true)}>Yes</button>
              <button type="button" onClick={() => answer(last.key, false)}>No, a new thing</button>
            </div>
          </>
        ) : (
          <div className={'nm' + (last.status === 'named' ? '' : ' wait')}>{last.status === 'named' ? (cap(last.name) || 'No name yet') : 'Naming…'}</div>
        )}
        {last.status !== 'ask' && last.place && (
          <button type="button" className="pl" onClick={() => setPicking(last.key)}>
            <PinIcon /> <span>{last.place}</span> <ChevronDownIcon />{last.source && last.source !== 'chosen' && <small>{{ session: 'this run', usual: 'usual place', guess: 'a guess' }[last.source]}</small>}
          </button>
        )}
        {last.status !== 'ask' && !last.place && last.choices && (
          <>
            <div className="q">Where is it?</div>
            <div className="chips">
              {last.choices.map((c) => <button type="button" key={c} onClick={() => choosePlace(last.key, c)}>{c}</button>)}
              <button type="button" onClick={() => setPicking(last.key)}>Other…</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  const topChip = session && (
    <button type="button" className="cam-place set" onClick={() => setPicking('session')}><PinIcon /> {session.name} · every photo <ChevronDownIcon /></button>
  );

  return (
    <>
      <Camera title={title} mode="several" modes={modes} onMode={onMode} onShot={shoot} overlay={strip} topChip={topChip}
        savedCount={entries.filter((e) => e.id).length} onDone={close} onCancel={() => onClose([])} />
      {picking && (
        <div className="camera-sheet">
          <PlacePicker current={picking === 'session' ? (session && session.name) : ''} items={items} places={places}
            onPick={(n) => { if (picking === 'session') { setSession({ name: n }); setPicking(null); logEvent('capture_place', { mode: 'several', session: n }); } else choosePlace(picking, n); }}
            onCancel={() => setPicking(null)} />
        </div>
      )}
    </>
  );
}

