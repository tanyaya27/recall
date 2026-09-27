import { useEffect, useRef, useState } from 'react';
import { compressPhoto, compressPlacePhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, changeLocation, findMatch, knownLocations, placeThumb, noteAlias, logEvent,
  applyVerdict, saveChain } from '../lib/db.js';
import { verdictOf, hasSecret } from '../lib/sensitive.js';
import { normName } from '../lib/names.js';
import { me } from '../lib/auth.js';
import { containers, holderOf, chainOf, openEdge, inPhrase, graph } from '../lib/graph.js';
import { matchThings } from '../lib/speech.js';
import PlacePicker from './PlacePicker.jsx';
import PrivNote from './PrivNote.jsx';
import Choice from './Choice.jsx';
import Confirm from './Confirm.jsx';
import { CameraIcon, CloseIcon, PinIcon, LockIcon, PencilIcon, SaveIcon, PinAskIcon, BoxIcon } from './Icons.jsx';

// The camera answers "what" AND "where" (Ravi 09-27; board walk BOARD_2026-09-27_walkthrough.md; DECISIONS 09-27).
//
//   Step 1  photograph the thing (one thing per photo, Q3). "Type it instead" sits above the shutter.
//   Step 2+ she steps back and photographs what it is in, then where THAT is: each shot adds a photo to a
//           chain (key → blue tin → linen closet shelf). Known places and boxes are chips, for when she
//           doesn't want to shoot. The AI names each photo, says whether it moves (a box) or is fixed (a
//           place), and whether it is one already saved — which is ASKED, never assumed.
//   Always  Cancel alone top-left (throws the photos away). "💾 + Next" | shutter | "💾 Save" in one row,
//           27 px clear of the shutter; the shutter takes taps in a 100 px circle. One verb per button:
//           what Save does is the two-line sentence right above the row.
//
// Two looks, one set of parts (Settings → Taking photos): 'b' Answer card (default) and 'a' Photo clear.
// Every overlay on the viewfinder is slightly see-through.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');
let KEY = 0;

export default function LogCamera({ engine, items = [], places = [], owner = undefined, ownerName = '', look = 'b', preset = null,
  onSaved, onCancel, onWrite, onNotice = () => {} }) {
  const videoRef = useRef(null); const streamRef = useRef(null);
  const [cam, setCam] = useState('starting'); // starting | live | failed
  const [flash, setFlash] = useState(false);
  const [thing, setThing] = useState(null);  // { photo, thumb, tag: undefined|null|{}, match, matchSure, answer: null|'yes'|'no' }
  const [chain, setChain] = useState([]);    // links, outward (see db.saveChain); a link from a photo: { key, file, photo, thumb, status, name, moves, known, ask }
  const [nameOverride, setNameOverride] = useState('');
  const [shareAnyway, setShareAnyway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null);  // 'more' | 'change' | 'rename' | 'cancel' | { ask: match } | { preview: {...} }
  const [draft, setDraft] = useState('');
  const [lastWhere, setLastWhere] = useState(preset); // "just used": the where of the thing saved a moment ago (+ Next), or Log here
  const tagP = useRef(null);
  const mounted = useRef(true);
  const openedAt = useRef(Date.now());
  const mine = !owner || owner === me();

  // ---- the stream (as Camera.jsx; the phone's own camera if it can't start)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setCam('failed'); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current; if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
        setCam('live');
      } catch (err) { console.error('camera', err); if (alive) setCam('failed'); }
    })();
    return () => { alive = false; mounted.current = false; const s = streamRef.current; if (s) s.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function snap() {
    const v = videoRef.current;
    if (!v || cam !== 'live' || busy) return;
    const w = v.videoWidth, h = v.videoHeight; if (!w || !h) return;
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
    setFlash(true); setTimeout(() => setFlash(false), 120);
    if (navigator.vibrate) navigator.vibrate(15);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    shot(new File([blob], `recall-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }

  // ---- the household's places and boxes (chips, and what a "where" photo is compared with)
  const others = items.filter((it) => !it.deleted && !((it.createdAt || 0) >= openedAt.current));
  const boxes = containers(graph(), 12).filter((b) => !thing || !thing.match || b.id !== thing.match.id);
  const placeNames = knownLocations(items, 12, places);
  const chips = [...boxes.slice(0, 2).map((b) => ({ key: 'b' + b.id, label: cap(b.name), thumb: b.thumb, known: { t: 'thing', item: b } })),
    ...placeNames.slice(0, 4).map((n) => { const t = placeThumb(n, places, []); return { key: 'p' + n, label: n, thumb: t && t.own ? t.src : null, known: { t: 'place', name: n } }; })]
    .slice(0, 4);

  // ---- a photo: the thing (step 1), or a "where" (every photo after it)
  async function shot(file) {
    const s = await compressPhoto(file);
    if (!mounted.current) return;
    if (!thing) { startThing(s); return; }
    const key = ++KEY;
    const link = { key, file, photo: s.photo, thumb: s.thumb, status: 'naming', name: '', moves: false, known: null, ask: null };
    setChain((c) => [...c, link]);
    logEvent('camera_where_shot', { depth: chain.length + 1 });
    nameWhere(link, s.photo);
  }

  function startThing(s) {
    setThing({ photo: s.photo, thumb: s.thumb, tag: undefined, match: null, answer: null });
    logEvent('camera_thing_shot', {});
    const chipNames = knownLocations(items, 8, places);
    tagP.current = engine.tagPhoto([s.photo], { knownPlaces: chipNames, catalog: items.filter((it) => it.name).map((it) => ({ name: it.name, aliases: it.aliases || [] })), sensitivity: 'personal' })
      .then((r) => r, (err) => { console.error(err); return null; });
    tagP.current.then(async (tag) => {
      if (!mounted.current) return;
      setThing((t) => (t && t.photo === s.photo ? { ...t, tag } : t));
      if (!tag) return;
      // Identity: an exact name, or the AI's own "same as" (bug #10: never a shared word) …
      const byName = findMatch(others, tag);
      if (byName) { setThing((t) => (t && t.photo === s.photo ? { ...t, match: byName } : t)); return; }
      // … else the AI LOOKS at the likeliest candidates. Only a sure answer is offered, and it is asked.
      const byWords = matchThings(others, [tag.name, ...(tag.alternatives || [])].join(' '));
      const recent = [...others].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
      const cands = []; [...byWords, ...recent].forEach((it) => { if (cands.length < 6 && !cands.includes(it) && it.thumb) cands.push(it); });
      if (!cands.length) return;
      try {
        const small = await Promise.all(cands.map((c) => shrink(c.thumb, 320)));
        const r = await engine.sameThing([s.photo], cands.map((c, i) => ({ name: c.name, thumb: small[i] })), { subject: tag.name, sensitivity: 'personal' });
        const hit = r.index >= 0 && r.sure ? cands[r.index] : null;
        logEvent('identity_check', { candidates: cands.length, hit: hit ? hit.id : null, via: 'camera' });
        if (hit && mounted.current) setThing((t) => (t && t.photo === s.photo ? { ...t, match: hit } : t));
      } catch (err) { console.error(err); }
    });
  }

  // What is in this "where" photo? Its name, box or place, and is it one already saved (asked, never assumed).
  async function nameWhere(link, photo) {
    const cands = [...boxes.filter((b) => b.thumb).slice(0, 4).map((b) => ({ c: { name: b.name, thumb: b.thumb }, known: { t: 'thing', item: b } })),
      ...places.filter((p) => p.photos && p.photos.length).slice(0, 2).map((p) => ({ c: { name: p.name, thumb: p.photos[0].thumb }, known: { t: 'place', name: p.name } }))].slice(0, 6);
    let r = null;
    try {
      const small = await Promise.all(cands.map((x) => shrink(x.c.thumb, 320)));
      r = await engine.whereIs(photo, cands.map((x, i) => ({ name: x.c.name, thumb: small[i] })), { thing: nameNow(), sensitivity: 'personal' });
    } catch (err) { console.error(err); }
    if (!mounted.current) return;
    const hit = r && r.index >= 0 && r.sure ? cands[r.index].known : null;
    logEvent('camera_where_named', { named: !!(r && r.name), moves: !!(r && r.moves), known: !!hit });
    setChain((c) => c.map((l) => (l.key !== link.key ? l : { ...l, status: r ? 'named' : 'failed', name: (r && r.name) || '', moves: !!(r && r.moves), ask: hit })));
  }

  // ---- what the screen says
  const tag = thing && thing.tag;
  const name = nameOverride || (thing && thing.match && thing.answer !== 'no' ? thing.match.name : (tag && tag.name) || '');
  function nameNow() { return name; }
  const match = thing && thing.match && thing.answer !== 'no' ? thing.match : null;
  const v = !thing || (tag === undefined && !nameOverride) ? null : verdictOf(tag || null, nameOverride);
  const dropPhoto = !!(v && v.secret);
  const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
  // Where it goes when she has shot none: Log here, or where it usually lives, or the AI sees a known place.
  const guess = tag && tag.placeCertain && tag.placeGuesses && tag.placeGuesses[0] && placeNames.some((n) => n.toLowerCase() === tag.placeGuesses[0].toLowerCase())
    ? { known: { t: 'place', name: placeNames.find((n) => n.toLowerCase() === tag.placeGuesses[0].toLowerCase()) }, why: 'in the photo' } : null;
  const usual = match ? (() => { const h = holderOf(match); return h ? { known: { t: 'thing', item: h }, why: 'usual place' } : match.location ? { known: { t: 'place', name: match.location }, why: 'usual place' } : null; })() : null;
  const suggestion = lastWhere ? { known: lastWhere, why: preset && lastWhere === preset ? 'here' : 'just used' } : usual || guess;
  const links = chain.length ? chain : suggestion ? [{ key: 'sugg', known: suggestion.known, why: suggestion.why }] : [];
  const lastLink = links[links.length - 1];
  // The chain is complete when it ends at a place (known, or a new fixed one), or at a box that already has a place.
  const done = !!lastLink && ((lastLink.known && (lastLink.known.t === 'place' || !!(lastLink.known.item && (lastLink.known.item.location || holderOf(lastLink.known.item)))))
    || (lastLink.ask && !lastLink.no && lastLink.status === 'named')
    || (!lastLink.known && lastLink.status !== 'naming' && !lastLink.moves && !!lastLink.name));

  const linkName = (l) => (l.known ? (l.known.t === 'thing' ? cap(l.known.item.name) : l.known.name) : l.ask && !l.no ? (l.ask.t === 'thing' ? cap(l.ask.item.name) : l.ask.name) : l.status === 'naming' ? 'Naming…' : cap(l.name) || (l.moves ? 'A box' : 'A place'));
  const linkThumb = (l) => (l.thumb ? l.thumb : l.known && l.known.t === 'thing' ? l.known.item.thumb : l.known ? (placeThumb(l.known.name, places, []) || {}).src || null : null);
  const isBox = (l) => (l.known ? l.known.t === 'thing' : l.ask && !l.no ? l.ask.t === 'thing' : l.moves);
  // The sentence: line 1 where it goes, line 2 where THAT is. Never inside a button.
  function sentence() {
    if (!links.length) return { l1: 'No place yet', l2: thing ? 'You can put it away later' : '', none: true };
    const first = links[0];
    const n1 = linkName(first);
    const l1 = first.status === 'naming' ? 'Naming the place…' : isBox(first) ? inPhrase({ name: n1 }) : n1;
    const rest = links.slice(1).map(linkName);
    const lastKnownThing = lastLink.known && lastLink.known.t === 'thing' ? lastLink.known.item : lastLink.ask && !lastLink.no && lastLink.ask.t === 'thing' ? lastLink.ask.item : null;
    if (lastKnownThing) { const outer = chainOf(lastKnownThing).map((c) => cap(c.name)); rest.push(...outer); const tail = chainOf(lastKnownThing); const loc = (tail.length ? tail[tail.length - 1] : lastKnownThing).location; if (loc && !outer.includes(loc)) rest.push(loc); }
    return { l1, l2: rest.length ? rest.join(' · ') : (first.why || ''), none: false };
  }
  const say = sentence();

  // ---- the chips and the change sheet
  function pickKnown(known) {
    logEvent('camera_where_chip', { t: known.t, depth: chain.length + 1 });
    setChain((c) => [...c, { key: ++KEY, known }]);
  }
  function changeWhere(how) {
    setSheet(null);
    if (how === 'again') { setChain([]); setLastWhere(null); logEvent('camera_where_change', { how }); }
    if (how === 'list') setSheet('more');
    if (how === 'none') { setChain([]); setLastWhere(null); logEvent('camera_where_change', { how }); }
  }

  // ---- saving
  async function save(next, answer = thing && thing.answer) {
    if (busy || !thing) return;
    if (thing.match && !answer) { setSheet({ ask: thing.match, next }); return; } // never merge silently
    const match = thing.match && answer === 'yes' ? thing.match : null;
    const name = nameOverride || (match ? match.name : (tag && tag.name) || '');
    const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
    setBusy(true);
    try {
      // Names of the "where" photos: wait a little for any still on their way.
      const waitNames = chain.filter((l) => !l.known && l.status === 'naming').length;
      let cur = chain;
      if (waitNames) {
        const t0 = Date.now();
        while (Date.now() - t0 < 12000) { await new Promise((r) => setTimeout(r, 250)); cur = await new Promise((res) => setChain((c) => { res(c); return c; })); if (!cur.some((l) => !l.known && l.status === 'naming')) break; }
      }
      const resolved = [];
      for (const l of (cur.length ? cur : links)) {
        if (l.known) resolved.push({ known: l.known });
        else if (l.ask && !l.no) resolved.push({ known: l.ask });
        else resolved.push({ photo: l.photo, thumb: l.thumb, placePhoto: l.moves ? null : await compressPlacePhoto(l.file), name: l.name, moves: l.moves });
      }
      const { first, made } = await saveChain(resolved, { owner: owner || me(), places });
      const location = first ? first.text : '';
      const dest = first ? first.dest : null;
      const common = { photo: dropPhoto ? null : thing.photo, thumb: dropPhoto ? null : thing.thumb, location, dest, restingOn: (tag && tag.restingOn) || '', placeSource: 'chosen', ...(owner ? { owner } : {}) };
      let itemId; let isNew = false; let prev = null;
      if (match) {
        prev = { location: match.location || '', dest: openEdge(match.id) ? openEdge(match.id).to : null };
        if (dropPhoto) await changeLocation(match, location, 'chosen', dest); else await resnapItem(match, common);
        if (tag && tag.name) noteAlias(match, tag.name);
        itemId = match.id;
        logEvent('merge', { itemId, result: 'confirmed', via: 'camera' });
      } else {
        isNew = true;
        itemId = await addItem({ ...common, name: tag ? (nameOverride || tag.name) : nameOverride, description: (tag && tag.description) || '', details: (tag && tag.details) || '',
          aliases: tag && tag.name && nameOverride && normName(tag.name) !== normName(nameOverride) ? [tag.name] : [],
          naming: tag === undefined, ...(startPrivate ? { private: true, privateAuto: v.why } : {}) });
        if (tag === undefined && tagP.current) {
          const known = !!v;
          tagP.current.then(async (t) => {
            await nameItem(itemId, t ? { name: nameOverride || t.name, description: t.description, restingOn: t.restingOn, details: t.details, aliases: nameOverride && t.name && normName(t.name) !== normName(nameOverride) ? [t.name] : [] } : {});
            if (known || !t) return;
            const late = verdictOf(t, nameOverride); const done2 = await applyVerdict(itemId, late, owner || me());
            if (done2.length) onNotice({ itemId, done: done2, why: late.why });
          });
        }
      }
      logEvent('capture', { initiatedBy: 'camera', itemId, merged: !!match, depth: resolved.length, made: made.items.length + made.places.length, next: !!next, look, beforeName: tag === undefined });
      const card = { itemId, where: location, name: cap(name) || 'Saved', lock: startPrivate || (match && match.private),
        thumbs: [dropPhoto ? null : thing.thumb, ...(cur.length ? cur : links).map(linkThumb)], l1: say.l1, l2: say.none ? '' : say.l2, none: say.none,
        undo: mine ? { itemId, isNew, prev, made } : null };
      if (next) {
        onSaved({ ...card, next: true });
        setThing(null); setChain([]); setNameOverride(''); setShareAnyway(false); openedAt.current = Date.now();
        const firstThumb = resolved.length ? (resolved[0].thumb || (resolved[0].known ? linkThumb({ known: resolved[0].known }) : null)) : null;
        setLastWhere(dest ? (dest.t === 'thing' ? { t: 'thing', item: { id: dest.id, name: dest.name, thumb: firstThumb, ...(graph().byId.get(dest.id) || {}) } } : dest) : null);
        setBusy(false);
        return;
      }
      onSaved(card);
    } catch (err) {
      console.error('camera save', err); setBusy(false);
    }
  }

  function tryCancel() {
    if (thing) setSheet('cancel'); else onCancel();
  }

  // ---- drawing
  const thumbsRow = thing ? [{ key: 'thing', thumb: thing.thumb, lock: startPrivate, nm: cap(name) || 'Naming…' }, ...links.map((l) => ({ key: l.key, thumb: linkThumb(l), nm: linkName(l), box: isBox(l), link: l }))] : [];
  const showWait = thing && !done;
  const WHY = { 'in the photo': 'The photo shows where it is.', 'usual place': 'That is where it usually lives.', 'just used': 'Where the last thing went.', here: 'You are logging into this.' };
  const prompt = !thing ? { n: '1', b: 'Photograph the thing', s: 'One thing per photo.' }
    : !chain.length && suggestion ? { n: '2', b: `${linkName(links[0])}?`, s: `${WHY[suggestion.why] || ''} Save, or photograph where it is.`.trim() }
    : !links.length ? { n: '2', b: 'Now where it goes', s: 'Step back: photograph what it is in, or where it is.' }
    : !done ? { n: String(links.length + 2), b: `And where is ${isBox(lastLink) ? 'that' : 'it'}?`, s: 'Step back again, or Save.' }
    : { n: '✓', b: 'Got it', s: 'Step back again if it is inside something.' };
  const askLink = links.find((l) => l.ask && !l.no && !l.yes && l.status === 'named');
  // Private by default, told right here (DECISIONS 09-24): the same note as before, "On this phone only" greyed.
  function retake() { logEvent('privacy_retake', { via: 'camera' }); setThing(null); setChain([]); setNameOverride(''); setShareAnyway(false); tagP.current = null; }
  const privLine = thing ? (
    <PrivNote v={v} mine={mine} ownerName={ownerName} isNew={!match} shared={shareAnyway}
      onShare={(x) => { setShareAnyway(x); logEvent('privacy_share', { to: x ? 'shared' : 'private', mode: 'camera' }); }}
      onRetake={retake} onDontSave={() => { logEvent('capture_leave', { reason: 'helper_private', via: 'camera' }); onCancel(); }} />) : null;
  const identity = thing && thing.match && !thing.answer ? (
    <div className="lc-ask" role="group" aria-label="Is this the same thing?">
      <b>Your {own(thing.match.name)}?</b>
      <div><button type="button" onClick={() => setThing((t) => ({ ...t, answer: 'yes' }))}>Yes</button>
        <button type="button" className="o" onClick={() => setThing((t) => ({ ...t, answer: 'no' }))}>No, a new thing</button></div>
    </div>) : null;
  const whereAsk = askLink ? (
    <div className="lc-ask" role="group" aria-label="Is this the one you have?">
      <b>Your {own(askLink.ask.t === 'thing' ? askLink.ask.item.name : askLink.ask.name)}?</b>
      <div><button type="button" onClick={() => setChain((c) => c.map((l) => (l.key === askLink.key ? { ...l, yes: true } : l)))}>Yes</button>
        <button type="button" className="o" onClick={() => setChain((c) => c.map((l) => (l.key === askLink.key ? { ...l, no: true } : l)))}>No, a new one</button></div>
    </div>) : null;

  const thumbEls = (big) => thumbsRow.map((t, i) => (
    <div className={big ? 'lc-t' : 'lc-s'} key={t.key}>
      {i > 0 && <span className="lc-in">in</span>}
      <div className="lc-tile">
        <button type="button" className={'lc-ph' + (t.thumb ? '' : ' none')} aria-label={`See ${t.nm}`} onClick={() => t.thumb && setSheet({ preview: t })}>
          {t.thumb ? <img src={t.thumb} alt="" /> : t.box ? <BoxIcon /> : <PinIcon />}
          {t.lock && <span className="lc-lk"><LockIcon /></span>}
        </button>
        {big && <div className="lc-nm">{t.nm}</div>}
      </div>
    </div>));
  const waitEl = (big) => showWait ? (
    <div className={big ? 'lc-t' : 'lc-s'} key="wait"><span className="lc-in">in</span>
      <div className="lc-tile"><div className="lc-ph wait" aria-hidden="true"><PinAskIcon /></div>{big && <div className="lc-nm">Where?</div>}</div></div>) : null;

  const sentenceEl = thing ? (
    <div className="lc-say">
      <PinIcon />
      <span className="tx"><b>{say.l1}</b>{say.l2 && <span className="soft">{say.l2}</span>}</span>
      {links.length > 0 && <button type="button" className="lc-chg" aria-label="Change where it goes" onClick={() => setSheet('change')}><PencilIcon /></button>}
    </div>) : null;

  return (
    <div className={'lc lc-' + look} role="dialog" aria-modal="true" aria-label="Log item">
      <div className="lc-top">
        <button type="button" className="lc-x" onClick={tryCancel}><CloseIcon /><span>Cancel</span></button>
        {ownerName ? <span className="lc-whose">{ownerName}’s ReCall</span> : null}
      </div>
      <div className="lc-view">
        <video ref={videoRef} playsInline muted autoPlay className={cam === 'live' ? '' : 'hidden'} />
        {flash && <div className="camera-flash" />}
        {cam === 'starting' && <div className="camera-msg">Starting the camera…</div>}
        {cam === 'failed' && (
          <div className="camera-msg"><p>The camera could not start on this phone.</p>
            <label className="btn-primary file"><CameraIcon /> Use the phone's camera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) shot(f); }} /></label></div>)}
        <div className="lc-prompt"><span className="n">{prompt.n}</span><div><b>{prompt.b}</b><small>{prompt.s}</small></div></div>
        {look === 'a' && thing && (<>
          <div className={'lc-chain' + (thumbsRow.length + (showWait ? 1 : 0) > 3 ? ' more' : '')}>{thumbEls(true)}{waitEl(true)}</div>
          {(identity || whereAsk || (v && (v.private || v.secret))) && <div className="lc-float">{identity || whereAsk}{privLine}</div>}
        </>)}
        {look === 'b' && thing && (
          <div className="lc-card">
            <div className={'lc-strip' + (thumbsRow.length + (showWait ? 1 : 0) > 5 ? ' more' : '')}>{thumbEls(false)}{waitEl(false)}</div>
            <button type="button" className="lc-name" onClick={() => { setDraft(name); setSheet('rename'); }}>{cap(name) || 'Naming…'}{startPrivate && <LockIcon />}</button>
            {identity || whereAsk}
            {privLine}
            {sentenceEl}
          </div>)}
      </div>
      <div className="lc-bot">
        {!thing && onWrite && <div className="lc-typeit"><button type="button" onClick={onWrite}><PencilIcon />Type it instead</button></div>}
        {thing && (!done || !chain.length) && chips.length > 0 && (
          <div className="lc-chips" aria-label="Or tap a place">
            {chips.filter((c) => !links.some((l) => l.known && ((l.known.t === 'thing' && c.known.t === 'thing' && l.known.item.id === c.known.item.id) || (l.known.t === 'place' && c.known.t === 'place' && l.known.name === c.known.name)))).slice(0, 2).map((c) => (
              <button key={c.key} type="button" className="lc-chip" onClick={() => pickKnown(c.known)}>
                {c.thumb ? <img src={c.thumb} alt="" /> : <span className="ic">{c.known.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}<span>{c.label}</span></button>))}
            <button type="button" className="lc-chip more" aria-label="More places" onClick={() => setSheet('more')}><span className="ic">•••</span></button>
          </div>)}
        {look === 'a' && sentenceEl}
        <div className="lc-row">
          {thing ? <button type="button" className="lc-k sn" disabled={busy} onClick={() => save(true)} aria-label="Save and log the next thing"><SaveIcon /><span className="plus">+</span>Next</button> : <span />}
          <button type="button" className="lc-shutter" aria-label="Take a photo" disabled={cam !== 'live' || busy} onClick={snap}><span /></button>
          {thing ? <button type="button" className="lc-k sv" disabled={busy} onClick={() => save(false)}><SaveIcon />{busy ? 'Saving…' : 'Save'}</button> : <span />}
        </div>
      </div>

      {sheet && sheet.preview && (
        <div className="lc-pv" role="dialog" aria-label={sheet.preview.nm} onClick={() => setSheet(null)}>
          <div className="box"><img src={sheet.preview.link && sheet.preview.link.photo ? sheet.preview.link.photo : sheet.preview.key === 'thing' ? thing.photo : sheet.preview.thumb} alt="" />
            <b>{sheet.preview.nm}</b></div>
          <div className="hint">Tap anywhere to close</div>
        </div>)}
      {sheet === 'change' && <Choice title="Where it goes" options={[
        { label: 'Photograph it again', onClick: () => changeWhere('again') },
        { label: 'Pick from the list', onClick: () => changeWhere('list') },
        { label: 'No place yet', onClick: () => changeWhere('none') },
        { label: 'Cancel', onClick: () => setSheet(null) }]} onCancel={() => setSheet(null)} />}
      {sheet === 'more' && <PlacePicker current="" items={items} places={places} item={match}
        onCancel={() => setSheet(null)} onPick={(n, dest) => { setSheet(null); pickKnown(dest && dest.t === 'thing' ? { t: 'thing', item: graph().byId.get(dest.id) || { id: dest.id, name: dest.name } } : { t: 'place', name: cap(n.trim()) }); }} />}
      {sheet === 'rename' && (
        <div className="sheet-back" onClick={() => setSheet(null)} role="presentation">
          <div className="sheet" role="dialog" aria-labelledby="lc-rn" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="lc-rn">What is it?</div>
            <input className="place-input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !hasSecret(draft)) { setNameOverride(draft.trim()); setSheet(null); } }} />
            {hasSecret(draft) && <PrivNote typedSecret />}
            <button className="btn-primary" disabled={!draft.trim() || hasSecret(draft)} onClick={() => { setNameOverride(draft.trim()); setSheet(null); }}>Use this name</button>
            <button className="btn-quiet" onClick={() => setSheet(null)}>Cancel</button>
          </div>
        </div>)}
      {sheet && sheet.ask && (
        <Choice title={`Is this your ${own(sheet.ask.name)}?`} options={[
          { label: 'Yes, the same thing', onClick: () => { const n = sheet.next; setSheet(null); setThing((t) => ({ ...t, answer: 'yes' })); save(n, 'yes'); } },
          { label: 'No, a new thing', onClick: () => { const n = sheet.next; setSheet(null); setThing((t) => ({ ...t, answer: 'no' })); save(n, 'no'); } },
          { label: 'Cancel', onClick: () => setSheet(null) }]} onCancel={() => setSheet(null)} />)}
      {sheet === 'cancel' && <Confirm title="Throw these photos away?" body="Nothing from this item is saved." keepLabel="Keep going" actionLabel="Throw away"
        onKeep={() => setSheet(null)} onAction={() => { logEvent('capture_leave', { reason: 'cancel', via: 'camera' }); onCancel(); }} />}
    </div>
  );
}
