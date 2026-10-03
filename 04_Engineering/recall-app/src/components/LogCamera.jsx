import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { compressPhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, changeLocation, findMatch, knownLocations, placeNamed, noteAlias, logEvent,
  applyVerdict, saveChain, undoChain, isPrivate, addItemPhotos, prevOf } from '../lib/db.js';
import { verdictOf, hasSecret } from '../lib/sensitive.js';
import { normName } from '../lib/names.js';
import { me } from '../lib/auth.js';
import { holderOf, chainOf, openEdge, graph, placeOuter, TIERS_SHOWN, wouldLoop, placeWouldLoop, containers, atPlace } from '../lib/graph.js';
import { matchThings } from '../lib/speech.js';
import { theOrQuoted } from '../lib/format.js';
import { bareWhere, articleOff, deepBare, nameKey } from '../lib/where.js';
import InList from './InList.jsx';
import PrivNote from './PrivNote.jsx';
import Choice from './Choice.jsx';
import Confirm from './Confirm.jsx';
import PhotoViewer from './PhotoViewer.jsx';
import { CameraIcon, CloseIcon, PinIcon, LockIcon, PencilIcon, SaveIcon, PlusIcon, BoxIcon, ArrowRightIcon } from './Icons.jsx';

// 10-02 (Ravi; "one where, photo first" — BOARD_2026-10-02_one-where.md rounds 1–4, OPTIONS_2026-10-02_one-where-A4.jpg).
// Release 1 kept "where" twice (her words + the In chip) with no rule between them: a Move by words kept the old place and Find
// answered it. Now there is ONE where — the place or box in one field:
//   · at rest the field shows where it is ("Where is it now? (type to set new place)"), solid border;
//   · she types over it — the border goes dashed and the header says what will change ("Set NEW place. (previously was: …)");
//     a name she has (a place or a box) links to it, anything else is a NEW place, made on Save. Nothing opens while she types.
//   · → opens one sheet: the name once, what it is in (every level, each with Change; + under the last), or pick another.
//   · photos go to what the strip names: the item, or the place / box in the field — held until Save, so the order is hers.
//   · a photo of a NEW place gets ReCall's guess on it: Use this · Append to mine (merged, nothing repeated) · Not this.
//     Shown only; nothing changes until she taps. A cleared field + a photo: the guess fills it (Ravi), marked, Not this undoes.
//   · words are a NOTE (+ Add a note), never a second where.
//   moveItem: "Move it" from an item's page — the field starts as where it is now; Save waits for a change.
//   preset:   "Log something into the tin" — the field starts as that box or place.
const HOLD_MS = 600; // hold Save this long and it becomes "Save + Next"
const MAX_SHOTS = 6;  // = LOG_MAX: the cover and five more (and at most 6 of a place at a time)
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');
const many = (s) => /[^su]s$/.test(own(s)) || /\b(glasses|scissors|pants|jeans|trousers|pliers|tongs)$/.test(own(s));
const hereKnown = (it) => { if (!it) return null; const h = holderOf(it); return h ? { t: 'thing', item: h } : it.location ? { t: 'place', name: it.location } : null; };
const sameKnown = (a, b) => (!a && !b) || (!!a && !!b && !a.blank && !b.blank && a.t === b.t && (a.t === 'thing' ? a.item.id === b.item.id : (a.name || '').toLowerCase() === (b.name || '').toLowerCase()));
const kName = (k) => (!k ? '' : k.t === 'thing' ? cap((k.item.name || '').trim()) : (k.name || '').trim());
const keyK = (k) => (!k ? '' : k.t === 'thing' ? 't' + k.item.id : 'p' + (k.name || '').toLowerCase().trim());
const BLANK = { t: 'place', name: '', isNew: true, blank: true };
// "on my lab desk" → "lab desk": the place is the name, not the sentence
// "on my lab desk" → "lab desk"; filler alone ("the", "on the", "in") is no place (tester ow1 #6); see lib/where.js
const bareOf = bareWhere;
// What a place or box is in, as list entries, outward (from the store).
function outerKs(k0) {
  if (!k0 || k0.isNew) return [];
  if (k0.t === 'place') return placeOuter(k0.name).map((x) => (x.t === 'thing' ? { t: 'thing', item: x.item } : { t: 'place', name: x.name }));
  const it = graph().byId.get(k0.item.id) || k0.item; const ch = chainOf(it); const tail = ch.length ? ch[ch.length - 1] : it; const loc = (tail.location || '').trim();
  return [...ch.map((b) => ({ t: 'thing', item: b })), ...(loc ? [{ t: 'place', name: loc }, ...placeOuter(loc).map((x) => (x.t === 'thing' ? { t: 'thing', item: x.item } : { t: 'place', name: x.name }))] : [])];
}
// ReCall's merge when the service gives none: what she typed, plus only the words the photo adds
// a merged name never says a word twice ("Bench by the window bench with a laptop" → "Bench by the window with a laptop")
const FILL = new Set(['the', 'a', 'an', 'my', 'our', 'by', 'with', 'in', 'on', 'of', 'and', 'at', 'near', 'under', 'to']);
function dedupe(name) {
  const seen = new Set(); const out = [];
  for (const w of (name || '').split(/\s+/).filter(Boolean)) { const k = normName(w); if (k && !FILL.has(k) && seen.has(k)) continue; if (k) seen.add(k); out.push(w); }
  return out.join(' ').replace(/\s+(by|with|in|on|of|and|at|near|under|to|the|a|an)$/i, '');
}
function localMerge(typed, name) {
  const have = new Set(normName(typed).split(' ')); const add = (name || '').split(/\s+/).filter((w) => w && !have.has(normName(w)));
  return add.length ? `${typed} · ${add.join(' ')}` : typed;
}

export default function LogCamera({ engine, items = [], places = [], owner = undefined, ownerName = '', look = 'b', preset = null, moveItem = null,
  onSaved, onCancel, onWrite, onNotice = () => {} }) {
  const videoRef = useRef(null); const streamRef = useRef(null);
  const [cam, setCam] = useState('starting');
  const [flash, setFlash] = useState(false);
  const [shots, setShotsS] = useState([]); // [{ id, photo, thumb, file, to: 'item' | 'where' }]
  const shotsRef = useRef([]); const setShots = (f) => { const nx = typeof f === 'function' ? f(shotsRef.current) : f; shotsRef.current = nx; setShotsS(nx); };
  const [tag, setTag] = useState(moveItem ? null : undefined); // the AI's read of the first photo (undefined = not back yet)
  const [match, setMatch] = useState(null); const [answer, setAnswer] = useState(null); // "Your wallet?" — Yes / No
  const startPick = moveItem ? hereKnown(moveItem) : preset ? (preset.t === 'thing' ? { t: 'thing', item: preset.item } : { t: 'place', name: preset.name }) : null;
  const firstPick = useRef(startPick);
  const [pick, setPickS] = useState(startPick);
  const pickRef = useRef(startPick); pickRef.current = pick;
  const pickTouched = useRef(false); // she set the where herself
  const [ups, setUps] = useState([]); // levels she set above the pick, outward (from the → sheet)
  const [wtext, setWtext] = useState(''); // what she is typing in the where field
  const [focus, setFocus] = useState(false);
  // a private item's photos never land on a shared place by default (10-02): its Move photos stay its own unless she switches
  const privItem = !!(moveItem && isPrivate(moveItem));
  const [photoTo, setPhotoTo] = useState(moveItem && startPick && !privItem ? 'where' : 'item');
  const [guess, setGuess] = useState(null); // ReCall's guess on a photo of a NEW place: { name, merged, typed, filled }
  const guessGen = useRef(0);
  // 10-02 (Ravi): one guess for the set of photos, asked once she stops shooting; "ReCall is looking…" shows the whole time,
  // and anything she does on purpose (types, switches where photos go, →, Cancel, Save) cancels it.
  const [looking, setLooking] = useState(false);
  const guessRef = useRef(null); guessRef.current = guess;
  const lookT = useRef(0); const decided = useRef(new Set()); const focusRef = useRef(false); const lookingAsked = useRef(false); // asked, answer not back yet
  const LOOK_WAIT = 1500;
  function stopLooking(why = '') { lookingAsked.current = false; if (lookT.current) { clearTimeout(lookT.current); lookT.current = 0; } if (looking || why) { guessGen.current++; } setLooking(false); if (why) logEvent('place_guess_cancel', { why }); }
  const [note, setNote] = useState(''); const [noteOpen, setNoteOpen] = useState(false);
  const [lv, setLv] = useState(null); // the → sheet: { p, u, sub: null | { j } }
  const [nameOverride, setNameOverride] = useState('');
  const [shareAnyway, setShareAnyway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [sheet, setSheet] = useState(null); // 'rename' | 'cancel' | { preview } | { ask, next }
  const [pvAsk, setPvAsk] = useState(null);
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState('');
  const [nextUndo, setNextUndo] = useState(null);
  const [holdNext, setHoldNext] = useState(false);
  const holdT = useRef(null); const holdLive = useRef(false);
  const tagP = useRef(null); const gen = useRef(0); // a late AI answer is for the photo it was asked about — never the next item's
  const mounted = useRef(true);
  const openedAt = useRef(Date.now());
  const shotAt = useRef(0);
  const whereRef = useRef(null);
  const mine = !owner || owner === me();
  const itemShots = shots.filter((s) => s.to !== 'where'); const whereShots = shots.filter((s) => s.to === 'where');
  // a new item starts with its photo; if she removes its only photo, the where and the place's photos stay on screen (ow1 F2)
  const started = !!moveItem || shots.length > 0;
  const needItemPhoto = !moveItem && itemShots.length === 0;
  // set the where: a pick, a typed name, a level change. Photos then go to it (after the item's first photo on a Log).
  const setPick = (k, byHer = true) => {
    if (byHer) pickTouched.current = true;
    if (keyK(k) !== keyK(pickRef.current) || (k && k.blank) !== (pickRef.current && pickRef.current.blank)) { setGuess(null); if (lookT.current || looking) stopLooking('changed'); }
    pickRef.current = k; setPickS(k); setUps([]);
    if (!k) setPhotoTo('item'); else if (byHer && !privItem && (moveItem || shotsRef.current.some((s) => s.to !== 'where'))) setPhotoTo('where');
  };

  useEffect(() => { if (!nextUndo || nextUndo.done) return undefined; const t = setTimeout(() => setNextUndo(null), 10000); return () => clearTimeout(t); }, [nextUndo]);
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

  // the shutter photographs what the strip names: the item (always the first photo of a new item), or the where
  const target = !started || needItemPhoto ? 'item' : photoTo === 'where' && pick ? 'where' : 'item';
  const fullNow = (target === 'where' ? whereShots : itemShots).length >= MAX_SHOTS;
  async function snap() {
    const v = videoRef.current;
    if (!v || cam !== 'live' || busy || fullNow) return;
    if (Date.now() - shotAt.current < 450) return; // a double tap is one photo
    shotAt.current = Date.now();
    if (target === 'where' && pickRef.current && pickRef.current.isNew && !lookingAsked.current) scheduleGuess(); // the wait counts from the tap (tester ow1 S5)
    const w = v.videoWidth, h = v.videoHeight; if (!w || !h) return;
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
    setFlash(true); setTimeout(() => setFlash(false), 120);
    if (navigator.vibrate) navigator.vibrate(15);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    shot(new File([blob], `recall-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }
  async function shot(file) {
    const to = target;
    const s = await compressPhoto(file);
    if (!mounted.current) return;
    const id = Date.now() + Math.random();
    const firstItem = to === 'item' && !shotsRef.current.some((x) => x.to !== 'where');
    if (to === 'item' && shotsRef.current.filter((x) => x.to !== 'where').length >= MAX_SHOTS) return;
    setShots((ps) => [...ps, { ...s, file, id, to }]);
    logEvent(to === 'where' ? 'camera_where_shot' : 'camera_thing_shot', { move: !!moveItem, isNew: !!(pickRef.current && pickRef.current.isNew) });
    if (firstItem && nextUndo && !nextUndo.done) setNextUndo(null);
    if (firstItem && !moveItem) nameThing(s);
    if (to === 'where' && pickRef.current && pickRef.current.isNew && !lookT.current && !lookingAsked.current) scheduleGuess();
  }
  const guessKey = (k) => (!k ? '' : k.blank ? 'blank' : keyK(k));
  // a NEW place only; never while the box is up (it never changes under her finger); never again for a name she decided on
  function scheduleGuess() {
    const k = pickRef.current; if (!k || !k.isNew || k.bad) return;
    if (guessRef.current || decided.current.has(guessKey(k))) return;
    if (!engine || !engine.placeGuess) return;
    if (lookT.current) clearTimeout(lookT.current);
    setLooking(true);
    lookT.current = setTimeout(() => { lookT.current = 0; if (mounted.current) askGuess(); }, LOOK_WAIT);
  }
  // ReCall's guess for a NEW place, from its photo and what she typed — shown, never applied by itself (Priyanka's conditions:
  // it belongs to its photo; dropped if that photo goes, the place changes, or she Cancels; Save never waits for it).
  function askGuess() {
    const k = pickRef.current; if (!k || !k.isNew) { setLooking(false); return; }
    const typed = !k.blank ? k.name : ''; const key = guessKey(k);
    const set = shotsRef.current.filter((x) => x.to === 'where'); if (!set.length) { setLooking(false); return; }
    const ids = set.map((x) => x.id);
    const my = ++guessGen.current; lookingAsked.current = true;
    logEvent('place_guess_ask', { photos: Math.min(4, set.length), typed: !!typed });
    engine.placeGuess(set.map((x) => x.photo), { typed, sensitivity: 'personal' }).then((r) => {
      if (!mounted.current || my !== guessGen.current) return; // cancelled, or a newer ask
      lookingAsked.current = false; setLooking(false);
      if (!r || !r.name) return;
      const cur = pickRef.current;
      if (!cur || !cur.isNew || guessKey(cur) !== key) return; // she changed the place since
      if (!ids.some((id) => shotsRef.current.some((x) => x.id === id))) return; // those photos are gone
      logEvent('place_guess', { typed: !!typed });
      // nothing typed: it fills the empty field (Ravi) — only if it is still empty and she isn't typing; else it's a box
      if (!typed && !focusRef.current && !resolve(r.name).bad) { const g = resolve(r.name); pickRef.current = { ...g, guessed: true }; setPickS(pickRef.current); setGuess({ name: r.name, merged: r.name, typed: '', filled: true, key: guessKey(pickRef.current) }); }
      else if (!typed && !resolve(r.name).bad) setGuess({ name: r.name, merged: r.name, typed: '', key });
      else if (!typed) return; // a guess she can't use is never offered (tester ow2 #12)
      else if (resolve(r.name).bad && resolve(dedupe(r.merged || '')).bad) return;
      else setGuess({ name: r.name, merged: dedupe(r.merged || localMerge(typed, r.name)), typed, key });
    }, (err) => { if (my === guessGen.current) { lookingAsked.current = false; setLooking(false); } console.error('place guess', err); });
  }
  function takeGuess(how) {
    const gq = guess; if (!gq) return;
    logEvent('place_guess_' + how, {});
    decided.current.add(gq.key || ''); // once she chose, no more guesses for that name
    if (how === 'no') { setGuess(null); if (gq.filled) { pickRef.current = BLANK; setPickS(BLANK); decided.current.add('blank'); } return; }
    const k = resolve(how === 'add' ? gq.merged : gq.name); decided.current.add(guessKey(k));
    setPick(k); setGuess(null);
  }

  const others = items.filter((it) => !it.deleted && !((it.createdAt || 0) >= openedAt.current));
  function nameThing(s) {
    const my = ++gen.current;
    tagP.current = engine.tagPhoto([s.photo], { knownPlaces: knownLocations(items, 8, places), catalog: items.filter((it) => it.name).map((it) => ({ name: it.name, aliases: it.aliases || [] })), sensitivity: 'personal' })
      .then((r) => r, (err) => { console.error(err); return null; });
    tagP.current.then(async (t) => {
      if (!mounted.current || my !== gen.current) return; // Retake, or Save + Next, since: this answer is about a photo that's gone
      setTag(t);
      if (!t) return;
      const byName = findMatch(others, t);
      if (byName) { setMatch(byName); return; }
      const byWords = matchThings(others, [t.name, ...(t.alternatives || [])].join(' '));
      const recent = [...others].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
      const cands = []; [...byWords, ...recent].forEach((it) => { if (cands.length < 6 && !cands.includes(it) && it.thumb) cands.push(it); });
      if (!cands.length) return;
      try {
        const small0 = await Promise.all(cands.map((c) => shrink(c.thumb, 320).catch(() => null)));
        const sentT = cands.filter((_, i) => small0[i]); const small = small0.filter(Boolean);
        const r = await engine.sameThing([s.photo], sentT.map((c, i) => ({ name: c.name, thumb: small[i] })), { subject: t.name, sensitivity: 'personal' });
        const hit = r.index >= 0 && r.sure && sentT[r.index] ? sentT[r.index] : null;
        logEvent('identity_check', { candidates: cands.length, hit: hit ? hit.id : null, via: 'camera' });
        if (hit && mounted.current && my === gen.current) setMatch(hit);
      } catch (err) { console.error(err); }
    });
  }
  // "Your wallet?" Yes: it IS that item — the where starts where that one is, unless she already set it.
  function sayYes() { setAnswer('yes'); if (!pick && match && !pickTouched.current) { const k = hereKnown(match); if (k) { setPick(k, false); firstPick.current = k; } } }

  const self = moveItem || (match && answer === 'yes' ? match : null);
  const name = moveItem ? cap(moveItem.name) : nameOverride || (match && answer === 'yes' ? match.name : (tag && tag.name) || '');
  const v = moveItem || !itemShots.length || (tag === undefined && !nameOverride) ? null : verdictOf(tag || null, nameOverride);
  const dropPhoto = !!(v && v.secret);
  const startPrivate = !!(v && v.private && mine && !shareAnyway && !(match && answer === 'yes'));
  const noteNow = note.trim();
  const typedSecret = hasSecret(note) || hasSecret(wtext);

  // what she typed → the where: a box or a place she has (exact name), else a NEW place; never an item that isn't a box
  function resolve(text) {
    const b = bareOf(text);
    if (!b) return moveItem || (pickRef.current && pickRef.current.blank) ? BLANK : null;
    // an exact name first as she typed it ("Under the sink"), then without "in/on/at" ("on my lab desk" → "lab desk")
    const cands = [...new Set([articleOff(text), b].map(nameKey).filter(Boolean))];
    const keys = (x) => [x.name, ...(x.aliases || [])].map(nameKey);
    const hit = (x) => keys(x).some((k) => cands.includes(k));
    // a place and a box with the same name: the one it is in now (or the one she picked) wins (tester ow1 #7)
    for (const cur of [pickRef.current, firstPick.current]) if (cur && !cur.isNew && cands.includes(nameKey(kName(cur)))) return cur;
    const myName = self ? null : nameOverride || (tag && tag.name) || '';
    if ((self && hit(self)) || (myName && cands.includes(nameKey(myName)))) return { t: 'place', name: cap(b), isNew: true, bad: 'That’s this item — it can’t go in itself.' };
    const box = containers(graph(), 999).find((x) => !x.deleted && (!self || x.id !== self.id) && hit(x));
    if (box) return self && loopsOver({ t: 'thing', item: box }, ['t' + self.id]) ? { t: 'place', name: cap(b), isNew: true, bad: `The ${cap(box.name)} is inside ${cap(self.name) || 'it'} — it can’t go in there.` } : { t: 'thing', item: box };
    const all = [...knownLocations(items, 999, places), ...places.map((p) => p.name)];
    for (const c of cands) { const pn = all.find((x) => nameKey(x) === c); if (pn) return { t: 'place', name: pn }; }
    if (items.some((x) => !x.deleted && x.name && hit(x))) return { t: 'place', name: cap(b), isNew: true, bad: `“${cap(b)}” is one of your items, not a place.` };
    // "by the baseball card": a position word before an item's name is still the item, not a place
    const deep = nameKey(deepBare(text)); const it2 = deep && items.find((x) => !x.deleted && x.name && !(self && x.id === self.id) && keys(x).includes(deep));
    if (it2) return { t: 'place', name: cap(b), isNew: true, bad: `“${cap(it2.name)}” is one of your items, not a place.` };
    if (hasSecret(text)) return { t: 'place', name: cap(b), isNew: true, bad: 'That looks private — not used as a place.' };
    return { t: 'place', name: cap(b), isNew: true };
  }
  function onType(val) { setWtext(val); if (lookT.current || looking) stopLooking('typed'); const k = resolve(val); setPick(k); }
  function onFocusWhere(e) { setFocus(true); focusRef.current = true; setWtext(pick && !pick.blank ? kName(pick) : ''); const el = e.target; setTimeout(() => { try { el.select(); } catch { /* fine */ } }, 0); logEvent('camera_where_focus', {}); }
  function onBlurWhere() { setFocus(false); focusRef.current = false; setWtext(''); }

  // Move it: Save waits for a change — a photo, a note, a different where, a level (09-30, Ravi; kept).
  const changed = !moveItem || shots.length > 0 || !!noteNow || !sameKnown(pick, firstPick.current) || ups.length > 0;
  const saveOff = busy || !started || needItemPhoto || !changed || typedSecret || !!(pick && (pick.blank || pick.bad));

  function retake() { logEvent('privacy_retake', { via: 'camera' }); gen.current++; setShots([]); setTag(undefined); setMatch(null); setAnswer(null); setNameOverride(''); setShareAnyway(false); tagP.current = null; setGuess(null); }
  function removeShot(id) {
    const left = shotsRef.current.filter((x) => x.id !== id);
    // the item's last photo on a new item: start the item again, but keep where it is and the place's photos (tester ow1 #11)
    if (!left.some((x) => x.to !== 'where') && !moveItem) { gen.current++; setTag(undefined); setMatch(null); setAnswer(null); setNameOverride(''); setShareAnyway(false); tagP.current = null; setPhotoTo('item'); }
    setShots(left);
  }

  // ---- loops: nothing can be put inside itself, nor inside something that is inside it
  const aboveKeys = (k) => {
    if (k.t === 'place') return placeOuter(k.name).map((x) => (x.t === 'thing' ? 't' + x.item.id : 'p' + (x.name || '').toLowerCase().trim()));
    const it = graph().byId.get(k.item.id) || k.item; const ch = chainOf(it); const tail = ch.length ? ch[ch.length - 1] : it; const loc = (tail.location || '').trim();
    return [...ch.map((b) => 't' + b.id), ...(loc ? ['p' + loc.toLowerCase(), ...placeOuter(loc).map((x) => (x.t === 'thing' ? 't' + x.item.id : 'p' + (x.name || '').toLowerCase().trim()))] : [])];
  };
  function loopsOver(k, lowerKeys) { return lowerKeys.includes(keyK(k)) || aboveKeys(k).some((x) => lowerKeys.includes(x)); }
  // a level above `lower` (the levels below it, innermost first) can never be anything below it, nor inside one of them
  const blockedFor = (k, lower) => {
    const keys = [...(self ? ['t' + self.id] : []), ...lower.map(keyK)];
    if (loopsOver(k, keys)) return true;
    const below = [self, ...lower.filter((x) => x.t === 'thing').map((x) => graph().byId.get(x.item.id) || x.item)].filter(Boolean);
    if (k.t === 'thing' && below.some((x) => x.id === k.item.id || wouldLoop(x, k.item))) return true;
    if (k.t === 'place' && lower.filter((x) => x.t === 'place' && !x.isNew).some((x) => placeWouldLoop(x.name, { t: 'place', name: k.name }))) return true;
    return false;
  };

  // ---- saving
  async function save(next, ans = answer) {
    if (saveOff) return;
    if (looking) stopLooking('save');
    if (!moveItem && match && !ans) { setSheet({ ask: match, next }); return; }
    const isMatch = !moveItem && match && ans === 'yes' ? match : null;
    setBusy(true); setSaveErr('');
    try {
      const was = moveItem ? firstPick.current : isMatch ? hereKnown(isMatch) : firstPick.current;
      const P = pick || (isMatch && !pickTouched.current ? hereKnown(isMatch) : null);
      const iShots = itemShots; // the item's own photos; its cover only ever comes from these
      const orphanShots = P ? [] : whereShots.map((p) => ({ photo: p.photo, thumb: p.thumb })); // photos of a where she then took away: kept, never as the cover (tester ow2 #15)
      const wShots = P ? whereShots.map((p) => ({ photo: p.photo, thumb: p.thumb })) : [];
      let location = ''; let dest = null; let made = { items: [], places: [], moved: [], links: [], placeMoves: [] };
      if (P) {
        const upsNow = P === pick ? ups : [];
        const ch = [P, ...upsNow];
        const selfKeys = self ? ['t' + self.id] : [];
        for (let i = 0; i < ch.length; i++) { if (loopsOver(ch[i], [...selfKeys, ...ch.slice(0, i).map(keyK)])) throw Object.assign(new Error('loop'), { code: 'loop' }); }
        for (let i = 1; i < ch.length; i++) if (ch[i].t === 'thing' && ch[i - 1].t === 'place') throw Object.assign(new Error('loop'), { code: 'loop' }); // a place is never inside a box (Q4)
        const kn = (k, photos) => (k.t === 'thing' ? { known: { t: 'thing', item: k.item }, ...(photos && photos.length ? { extraPhotos: photos } : {}) }
          : { known: { t: 'place', name: k.name }, ...(photos && photos.length ? { placePhotos: photos } : {}) });
        const r = await saveChain([kn(P, wShots), ...upsNow.map((k) => kn(k))], { owner: owner || me(), places });
        location = r.first ? r.first.text : ''; dest = r.first ? r.first.dest : null; made = r.made;
      }
      const inChanged = !sameKnown(P, was);
      // a note: a new one when she wrote one; an old note was about the old place, so a new where clears it
      const said = noteNow ? noteNow : inChanged ? '' : undefined;
      const upsNow = P === pick ? ups : [];
      const outer = (upsNow.length ? [...upsNow, ...outerKs(upsNow[upsNow.length - 1])] : outerKs(P)).map(kName);
      const chain = P ? [kName(P), ...outer] : [];
      const pickThumb = !P ? null : wShots.length ? wShots[0].thumb : P.t === 'thing' ? P.item.thumb : (() => { const p = placeNamed(P.name, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; })();
      const l1 = P ? (outer.length ? '' : `In: ${kName(P)}`) : noteNow ? `“${noteNow}”` : '';
      const l2 = P && noteNow ? `Note: “${noteNow}”` : '';
      if (moveItem) {
        const prev = prevOf(moveItem); // 10-02 (tester ow2 #2, #3): where-words and the note as they are now, apart
        let ok = true; let photos = null;
        if (iShots.length) {
          photos = { since: Date.now(), prev: { photo: moveItem.photo || null, thumb: moveItem.thumb || null, photoCount: moveItem.photoCount || 0, logId: moveItem.logId || '', restingOn: moveItem.restingOn || '' } };
          const cover = iShots[0]; const extras = iShots.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb }));
          await resnapItem(moveItem, { photo: cover.photo, thumb: cover.thumb, extras, location, dest, placeSource: 'chosen', said, note: !!noteNow });
        } else ok = await changeLocation(moveItem, location, 'chosen', dest, { said, note: !!noteNow });
        if (orphanShots.length) { if (!photos) photos = { since: Date.now() - 1, prev: { photo: moveItem.photo || null, thumb: moveItem.thumb || null, photoCount: moveItem.photoCount || 0, logId: moveItem.logId || '', restingOn: moveItem.restingOn || '' } }; await addItemPhotos(graph().byId.get(moveItem.id) || moveItem, orphanShots); }
        logEvent('camera_move', { itemId: moveItem.id, ok, inChanged, note: !!noteNow, photos: iShots.length, wherePhotos: wShots.length, levels: upsNow.length });
        const bits = [iShots.length ? (iShots.length === 1 ? 'A new photo' : `${iShots.length} new photos`) : '', wShots.length ? `${wShots.length === 1 ? 'a photo' : `${wShots.length} photos`} of ${theOrQuoted(kName(P))}` : '', noteNow ? 'your note' : '', upsNow.length ? 'where it’s in' : ''].filter(Boolean);
        onSaved({ itemId: moveItem.id, where: location, name: cap(moveItem.name), thumbs: [moveItem.thumb, ...(P ? [pickThumb] : [])], l1, l2, chain, none: !P && !noteNow && !(prev.said && !inChanged), moved: true,
          prev, stayed: !inChanged, added: inChanged ? '' : bits.length ? `${cap(bits.join(' and '))} saved` : 'Saved', refused: ok === false, moving: [],
          undo: mine ? { itemId: moveItem.id, isNew: false, prev, made, photos, after: Date.now() } : null });
        return;
      }
      const cover = iShots[0]; const extras = [...iShots.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb })), ...orphanShots];
      const common = { photo: dropPhoto ? null : cover.photo, thumb: dropPhoto ? null : cover.thumb, extras: dropPhoto ? [] : extras, location, dest, restingOn: (tag && tag.restingOn) || '', placeSource: 'chosen', ...(owner ? { owner } : {}) };
      let itemId; let isNew = false; let prev = null; let photos = null;
      if (isMatch) {
        prev = prevOf(isMatch);
        if (dropPhoto) await changeLocation(isMatch, location, 'chosen', dest, { said, note: !!noteNow });
        else { photos = { since: Date.now(), prev: { photo: isMatch.photo || null, thumb: isMatch.thumb || null, photoCount: isMatch.photoCount || 0, logId: isMatch.logId || '', restingOn: isMatch.restingOn || '' } }; await resnapItem(isMatch, { ...common, said, note: !!noteNow }); }
        if (tag && tag.name) noteAlias(isMatch, tag.name);
        itemId = isMatch.id;
        logEvent('merge', { itemId, result: 'confirmed', via: 'camera' });
      } else {
        isNew = true;
        itemId = await addItem({ ...common, said: noteNow || undefined, note: !!noteNow, name: tag ? (nameOverride || tag.name) : nameOverride, description: (tag && tag.description) || '', details: (tag && tag.details) || '',
          aliases: tag && tag.name && nameOverride && normName(tag.name) !== normName(nameOverride) ? [tag.name] : [],
          naming: tag === undefined, ...(startPrivate ? { private: true, privateAuto: v.why } : {}) });
        if (tag === undefined && tagP.current) {
          const knew = !!v; const p = tagP.current; const nm = nameOverride;
          p.then(async (t) => {
            await nameItem(itemId, t ? { name: nm || t.name, description: t.description, restingOn: t.restingOn, details: t.details, aliases: nm && t.name && normName(t.name) !== normName(nm) ? [t.name] : [] } : {});
            if (knew || !t) return;
            const late = verdictOf(t, nm); const done2 = await applyVerdict(itemId, late, owner || me());
            if (done2.length) onNotice({ itemId, done: done2, why: late.why });
          });
        }
      }
      logEvent('capture', { initiatedBy: 'camera', itemId, merged: !!isMatch, photos: iShots.length, wherePhotos: wShots.length, in: P ? P.t : null, note: !!noteNow, next: !!next, look, beforeName: tag === undefined });
      const nm = cap(name) || 'Saved';
      const card = { itemId, where: location, name: nm, lock: startPrivate || (isMatch && isMatch.private), thumbs: [dropPhoto ? null : cover.thumb, ...(P ? [pickThumb] : [])], l1, l2, chain,
        none: !P && !noteNow, moving: [], undo: mine ? { itemId, isNew, prev, made, photos, after: Date.now() } : null };
      if (next) {
        onSaved({ ...card, next: true });
        setSavedFlash(nm === 'Saved' ? 'Item' : nm); setTimeout(() => { if (mounted.current) setSavedFlash(''); }, 1500);
        setNextUndo(card.undo ? { name: nm === 'Saved' ? 'Item' : nm, undo: card.undo } : null);
        // the next item starts with the same where (a run of things into one box), shown in the field
        gen.current++; guessGen.current++; setShots([]); setTag(undefined); setMatch(null); setAnswer(null); setNameOverride(''); setShareAnyway(false); setNote(''); setNoteOpen(false); setGuess(null); tagP.current = null;
        const keep = P && !P.isNew ? P : P ? { t: P.t, name: P.name } : null; // a place just made is a place she has now
        firstPick.current = keep; pickRef.current = keep; setPickS(keep); setUps([]); setPhotoTo('item'); pickTouched.current = false; openedAt.current = Date.now();
        setBusy(false);
        return;
      }
      onSaved(card);
    } catch (err) {
      if (!(err && err.code === 'loop')) console.error('camera save', err);
      const denied = /permission|insufficient/i.test(String(err && (err.code || err.message)));
      if (err && err.code === 'loop') { setSaveErr('Not saved — that would put something inside itself. Change where it is (→).'); setBusy(false); return; }
      setSaveErr(denied ? 'Couldn’t save — this ReCall didn’t allow that change. Your photos are still here.' : 'Couldn’t save — check the connection and tap Save again. Your photos are still here.');
      logEvent('camera_save_failed', { code: String((err && err.code) || ''), move: !!moveItem });
      setBusy(false);
    }
  }
  async function undoLast() {
    const u = nextUndo; if (!u || u.done || !u.undo) return;
    setNextUndo({ ...u, done: true });
    const r = await undoChain(u.undo); logEvent('camera_next_undo', { itemId: u.undo.itemId, r });
    if (r === 'stale') setNextUndo({ ...u, done: true, stale: true });
    setTimeout(() => { if (mounted.current) setNextUndo(null); }, 1800);
  }
  function tryCancel() { if (looking) stopLooking('cancel'); if (shots.length || (moveItem && changed)) setSheet('cancel'); else onCancel(); }

  // Save: a tap saves; held HOLD_MS it becomes "Save + Next" (let go = save and log the next item); slide off = nothing.
  const canNext = started && !moveItem;
  const holdStart = (e) => {
    if (saveOff) return; holdLive.current = true; setHoldNext(false);
    try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    clearTimeout(holdT.current);
    if (canNext) holdT.current = setTimeout(() => { if (!holdLive.current) return; setHoldNext(true); if (navigator.vibrate) navigator.vibrate(25); logEvent('camera_save_hold', {}); }, HOLD_MS);
  };
  const holdEnd = (e) => {
    if (!holdLive.current) return; holdLive.current = false; clearTimeout(holdT.current);
    const r = e.currentTarget.getBoundingClientRect(); const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    const next = holdNext; setHoldNext(false);
    if (!inside) return;
    save(next);
  };
  const holdCancel = () => { holdLive.current = false; clearTimeout(holdT.current); setHoldNext(false); };

  const pvList = (itemShots.length ? itemShots : moveItem ? [{ photo: moveItem.photo || moveItem.thumb }] : []).filter((p) => p && p.photo);
  const bandThumb = itemShots.length ? itemShots[0].thumb : moveItem ? moveItem.thumb : null;
  const privLine = started && !moveItem ? (
    <PrivNote v={v} mine={mine} ownerName={ownerName} isNew={!(match && answer === 'yes')} shared={shareAnyway}
      onShare={(x) => { setShareAnyway(x); logEvent('privacy_share', { to: x ? 'shared' : 'private', mode: 'camera' }); }}
      onRetake={retake} onDontSave={() => { logEvent('capture_leave', { reason: 'helper_private', via: 'camera' }); onCancel(); }} />) : null;
  const identity = !moveItem && match && !answer ? (
    <div className="lc-ask" role="group" aria-label="Is this the same item?">
      <b>Your {own(match.name)}?</b>
      <div><button type="button" onClick={sayYes}>Yes</button>
        <button type="button" className="o" onClick={() => setAnswer('no')}>No, a new item</button></div>
    </div>) : null;

  // ---- the where field
  const prevK = moveItem ? firstPick.current : null;
  // an old words-only item: its words are where it is now — shown in the field until she types (tester ow1 #12)
  const wordsOf = (it) => { const h = (it && it.history) || []; for (let i = h.length - 1; i >= 0; i--) if (h[i] && h[i].w && !h[i].n) return (h[i].said || '').trim(); return ''; };
  const oldItem = moveItem || (match && answer === 'yes' ? match : null);
  const oldWords = oldItem && !firstPick.current && !hereKnown(oldItem) ? wordsOf(oldItem) : '';
  const dirty = !sameKnown(pick, firstPick.current) || ups.length > 0 || !!(pick && pick.blank);
  const dashed = focus || dirty;
  const levelsOnly = !!pick && !pick.blank && sameKnown(pick, firstPick.current) && ups.length > 0;
  const head = pick && pick.bad ? <><span className="ow-set bad">Can’t put it there.</span></>
    : levelsOnly ? <><span className="ow-set">Set where {theOrQuoted(kName(pick))} is.</span></>
    : dirty && (pick || prevK)
    ? (pick ? <><span className="ow-set">{pick.isNew ? 'Set NEW place.' : 'Set place.'}</span>{prevK ? <> <span className="ow-par was">(previously was: <span className="ow-old">{kName(prevK)}</span><span className="ow-close">)</span></span></> : oldWords ? <> <span className="ow-par was">(previously: <span className="ow-old">“{oldWords}”</span><span className="ow-close">)</span></span></> : null}</>
      : <><span className="ow-set">Not in anything.</span> <span className="ow-par was">(previously was: <span className="ow-old">{kName(prevK)}</span><span className="ow-close">)</span></span></>)
    : <>{moveItem ? 'Where is it now?' : 'Where is it?'} <span className="ow-par">({(moveItem && firstPick.current) || oldWords ? 'type to set new place' : 'type to set a place'})</span></>;
  const fieldVal = focus ? wtext : pick && !pick.blank ? kName(pick) : '';
  // the field grows to show the whole name (up to 3 lines) — never "Kitchen cou" at Largest (walk 10-02)
  useLayoutEffect(() => { const el = whereRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.4))}px`; el.style.overflowY = el.scrollHeight > window.innerHeight * 0.4 ? 'auto' : 'hidden'; });
  const pickThumbNow = !pick || pick.blank ? null : whereShots.length ? whereShots[whereShots.length - 1].thumb : pick.t === 'thing' ? pick.item.thumb : (() => { const p = placeNamed(pick.name, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; })();
  // "2 of your places have “desk” — → to see them": the only line under the field, and only while she types a new name
  const placeNames = (() => { const seen = new Set(); return [...knownLocations(items, 999, places), ...places.map((p) => p.name)].filter((n) => { const k = (n || '').trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; }); })();
  const allK = [...placeNames.map((n) => ({ t: 'place', name: n })), ...containers(graph(), 999).filter((b) => !self || b.id !== self.id).map((b) => ({ t: 'thing', item: b }))];
  let hint = null;
  if (pick && pick.bad) hint = <div className="ow-hint bad" role="alert">{pick.bad}</div>; // at rest too (tester ow1 #13)
  else if (focus && pick && pick.isNew && !pick.blank) {
    const ws = normName(bareOf(wtext)).split(' ').filter((w) => w.length >= 3);
    let best = null; ws.forEach((w) => { const hits = allK.filter((k) => normName(kName(k)).split(' ').includes(w)); if (hits.length && (!best || hits.length > best.n)) best = { w, n: hits.length, boxes: hits.filter((k) => k.t === 'thing').length }; });
    const what = (b) => (b.boxes === 0 ? 'places' : b.boxes === b.n ? 'boxes' : 'places and boxes');
    if (best) hint = <div className="ow-hint">{best.n} of your {what(best)} {best.n === 1 ? 'has' : 'have'} “{best.w}” — <b><ArrowRightIcon /> to see {best.n === 1 ? 'it' : 'them'}</b></div>;
  }
  const whereLabel = !pick ? '' : pick.blank ? 'a new place' : `${kName(pick)}${pick.isNew && !pick.bad ? ' (new)' : ''}`;
  const itemLabel = cap(name) || (moveItem ? 'the item' : 'the item');
  const segs = [];
  if (!moveItem || !pick || privItem) segs.push({ to: 'item', label: itemLabel, n: itemShots.length, cls: 'ow-to-item' });
  if (pick) segs.push({ to: 'where', label: whereLabel, n: whereShots.length, cls: 'ow-to-where' });
  else if (!moveItem && itemShots.length) segs.push({ to: 'blank', label: 'a new place', n: 0, cls: 'ow-to-where' });
  const strip = started ? (
    <div className="ow-to" role="group" aria-label="Photos go to">
      <span className="lab"><CameraIcon /> Photos go to</span>
      {segs.length === 1 ? <span className={'seg on ' + segs[0].cls}>{segs[0].label}{segs[0].n ? <em>{segs[0].n}</em> : null}</span>
        : segs.map((s) => (
          <button type="button" key={s.cls} className={'seg ' + s.cls + (target === s.to || (s.to === 'blank' && false) ? ' on' : '')} disabled={busy}
            onClick={() => { if (looking) stopLooking('photos_to'); if (s.to === 'blank') { setPick(BLANK); setPhotoTo('where'); } else setPhotoTo(s.to); logEvent('camera_photos_to', { to: s.to }); }}>
            {s.label}{s.n ? <em>{s.n}</em> : null}</button>))}
    </div>) : null;

  // ---- the → sheet: the name once, what it is in (every level), or pick another
  const lvRows = lv ? (() => { const L = [lv.p, ...lv.u].filter(Boolean); if (!L.length) return []; const last = L[L.length - 1]; return [...L.map((k) => ({ k, saved: false })), ...outerKs(last).map((k) => ({ k, saved: true }))]; })() : [];
  const lvPic = (k) => (!k ? null : k.t === 'thing' ? k.item.thumb : (() => { const p = placeNamed(k.name, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; })());
  const lvSub = (k, j) => (j === 0 ? (k.isNew ? 'a new place · made when you Save' : k.t === 'thing' ? 'a box · it’s in this' : 'it’s on / in this')
    : k.t === 'thing' ? 'a box' : (() => { const n = atPlace(k.name).length; return k.isNew ? 'a new place' : `a place · ${n ? `${n} item${n === 1 ? '' : 's'}` : 'nothing else here'}`; })());
  const pickList = lv ? (() => {
    const ws = normName(kName(lv.p)).split(' ').filter((w) => w.length >= 3);
    const ok = allK.filter((k) => keyK(k) !== keyK(lv.p) && !(self && loopsOver(k, ['t' + self.id])));
    const hit = (k) => ws.some((w) => normName(kName(k)).split(' ').includes(w));
    return [...ok.filter(hit), ...ok.filter((k) => !hit(k))];
  })() : [];
  const lvSubK = lv && lv.sub ? (lv.sub.j === 0 ? null : lvRows[lv.sub.j - 1] ? lvRows[lv.sub.j - 1].k : null) : null;
  function lvPick(k) {
    const j = lv.sub.j;
    if (j === 0) { setLv({ p: k, u: [], sub: null }); return; }
    setLv({ p: lvRows[0].k, u: [...lvRows.slice(1, j).map((r) => r.k), k], sub: null });
    logEvent('camera_level_set', { level: j + 1, t: k.t, isNew: !!k.isNew });
  }
  function lvDone() { const p = lv.p; const u = lv.u; setLv(null); pickTouched.current = true; if (keyK(p) !== keyK(pickRef.current)) setGuess(null); pickRef.current = p; setPickS(p); setUps(u); if (p && !privItem && (moveItem || itemShots.length)) setPhotoTo('where'); }

  return (
    <div className="lc lc-b lc-w1 lc-ow" role="dialog" aria-modal="true" aria-label={moveItem ? 'Move it' : 'Log item'}>
      <div className="lc-top lc-band">
        {started && bandThumb ? (
          <button type="button" className="lc-thing sel" aria-label="The item’s photos" onClick={() => setSheet({ preview: 0 })} disabled={busy}>
            <img src={bandThumb} alt="" />{itemShots.length > 1 && <span className="lv-n">{itemShots.length}</span>}{startPrivate && <span className="lc-lk"><LockIcon /></span>}
          </button>) : null}
        <div className="lc-title">
          <small>{ownerName ? <span className="lc-whose">{ownerName}’s ReCall</span> : null}{moveItem ? `Where ${many(moveItem.name) ? 'are' : 'is'} the` : match && answer === 'yes' ? 'One you have' : 'New item'}</small>
          {moveItem ? <b className="lc-name">{name}?</b>
            : started && !needItemPhoto ? <button type="button" className="lc-name" onClick={() => { setDraft(name); setSheet('rename'); }}>{cap(name) || 'Naming…'}</button>
            : <b>Photograph it</b>}
        </div>
      </div>
      <div className="lc-view">
        <video ref={videoRef} playsInline muted autoPlay className={cam === 'live' ? '' : 'hidden'} />
        {flash && <div className="camera-flash" />}
        {cam === 'starting' && <div className="camera-msg">Starting the camera…</div>}
        {cam === 'failed' && (
          <div className="camera-msg"><p>The camera could not start on this phone.</p>
            <label className="btn-primary file"><CameraIcon /> Use the phone's camera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) shot(f); }} /></label></div>)}
        {!started && onWrite && <div className="lc-typeit"><button type="button" onClick={onWrite}><PencilIcon />Type it instead</button></div>}
        {savedFlash && <div className="lc-saved" role="status">{savedFlash} <span className="ok">✓ saved</span></div>}
        {!savedFlash && nextUndo && (
          <div className="lc-undo" role="status">{nextUndo.done ? <span>{nextUndo.stale ? `${nextUndo.name} changed since — not undone` : `${nextUndo.name} undone`}</span>
            : <><span className="ok">✓</span><span className="nm">{nextUndo.name} saved</span><button type="button" onClick={undoLast}>Undo</button></>}</div>)}
        {started && (
          <div className="lc-card">
            {/* ReCall's look and guess sit in the card, above the field — never over what she typed (tester ow1 S1) */}
        {looking && !guess && (
              <div className="ow-ai ow-looking" role="status" aria-live="polite">
                <span className="spin" aria-hidden="true" /><span className="t">ReCall is looking at {pick && !pick.blank ? theOrQuoted(kName(pick)) : 'the place'}…</span>
                <button type="button" className="ow-look-x" aria-label="Stop" onClick={() => stopLooking('stop')}><CloseIcon /></button>
              </div>)}
            {guess && (
              <div className="ow-ai" role="group" aria-label="ReCall’s guess">
                <button type="button" className="ow-ai-no" aria-label="Not this" onClick={() => takeGuess('no')}><CloseIcon /></button>
                <small>ReCall thinks this is</small><b className="ow-ai-name">{cap(guess.name)}</b>
                {guess.filled ? <p className="ow-ai-filled">Put in the field for you — change it, or tap ✕.</p> : !guess.typed ? (
                  <div className="two"><button type="button" className="ow-ai-use" onClick={() => takeGuess('use')}>Use this</button></div>) : (
                  <>
                    <div className="two">
                      {!resolve(guess.name).bad && <button type="button" className="ow-ai-use" onClick={() => takeGuess('use')}>Use this</button>}
                      {!resolve(guess.merged).bad && <button type="button" className="ow-ai-add" onClick={() => takeGuess('add')}>Append to mine</button>}
                    </div>
                    {!resolve(guess.merged).bad && <p className="ow-ai-merged">Append gives “{cap(guess.merged)}”</p>}
                  </>)}
    
              </div>)}
            {identity}
            <div className="ow">
              <div className="ow-head">{head}</div>
              <div className={'ow-field' + (dashed ? ' dash' : '') + (pick && pick.bad ? ' bad' : '')}>
                {pickThumbNow ? <img src={pickThumbNow} alt="" /> : <span className="ic">{pick && pick.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}
                <textarea ref={whereRef} className="ow-input" rows={1} value={fieldVal} onChange={(e) => onType(e.target.value)} onFocus={onFocusWhere} onBlur={onBlurWhere}
                  placeholder={pick && pick.blank ? 'New place — photograph it or type its name' : oldWords ? `“${oldWords}”` : 'Type a place'} aria-label="Where is it? Type a place"
                  maxLength={120} enterKeyHint="done" autoCapitalize="sentences" autoComplete="off" disabled={busy}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
                <button type="button" className="ow-go" aria-label="More: pick one of your places, or what it is in" disabled={busy}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { if (looking) stopLooking('more'); if (whereRef.current) whereRef.current.blur(); setLv({ p: pickRef.current && !pickRef.current.blank ? pickRef.current : null, u: ups, sub: null }); logEvent('camera_where_more', {}); }}><ArrowRightIcon /></button>
              </div>
              {hint}
              {guess ? null : noteOpen || note ? (
                <div className="ow-note-row"><input className="ow-note-in" autoFocus={noteOpen && !note} value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note — “under the blue folder”"
                  aria-label="A note" maxLength={240} enterKeyHint="done" autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                  onBlur={() => { if (!note.trim()) setNoteOpen(false); }} /></div>
              ) : (
                <button type="button" className="ow-note" onClick={() => setNoteOpen(true)} disabled={busy}><PlusIcon /> Add a note <span>(optional)</span></button>)}
              {typedSecret && <PrivNote typedSecret />}
              {guess ? null : strip}
            </div>
            {privLine}
          </div>)}
      </div>
      <div className="lc-bot">
        {saveErr && <div className="lc-err" role="alert">{saveErr}</div>}
        <div className="lc-row">
          <button type="button" className="lc-x" onClick={tryCancel}><CloseIcon /><span>Cancel</span></button>
          <button type="button" className="lc-shutter" style={{ borderColor: target === 'where' ? '#E0B26A' : '#fff' }} aria-label={target === 'where' ? `Take a photo of ${whereLabel}` : 'Take a photo of it'} disabled={cam !== 'live' || busy || fullNow} onClick={snap}><span /></button>
          {started ? <button type="button" className={'lc-k sv' + (holdNext ? ' next' : '')} disabled={saveOff}
            aria-label={canNext ? 'Save (hold for Save + Next)' : 'Save'}
            onPointerDown={holdStart} onPointerUp={holdEnd} onPointerCancel={holdCancel} onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => { if (e.detail === 0 && !saveOff) save(false); }}>
            {holdNext ? 'Save + Next' : <><SaveIcon />{busy ? 'Saving…' : 'Save'}</>}</button> : <span />}
        </div>
      </div>

      {lv && !lv.sub && (
        <div className="sheet-back" onClick={() => setLv(null)} role="presentation">
          <div className="sheet ow-sheet" role="dialog" aria-modal="true" aria-labelledby="ow-t" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="ow-t">Where is it?</div>
            <div className="ow-scroll">
            {lvRows.length ? lvRows.map((r, j) => (
              <div key={keyK(r.k) + j}>
                {j > 0 && <div className="ow-in">which is in</div>}
                <div className={'ow-lvl' + (j === 0 ? ' first' : '')}>
                  {lvPic(r.k) ? <img src={lvPic(r.k)} alt="" /> : <span className="no">{r.k.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}
                  <span className="t"><b>{kName(r.k)}{r.k.isNew ? <em className="ow-new">NEW</em> : null}</b><small>{lvSub(r.k, j)}</small></span>
                  <button type="button" className="ow-lvl-change" onClick={() => setLv({ ...lv, sub: { j } })}>Change</button>
                </div>
              </div>)) : (
              <div className="ow-lvl first none">
                <span className="no"><PinIcon /></span><span className="t"><b>Not in anything yet</b><small>search, or name a new place</small></span>
                <button type="button" className="ow-lvl-change" onClick={() => setLv({ ...lv, sub: { j: 0 } })}>Choose</button>
              </div>)}
            {lvRows.length > 0 && lvRows.length < TIERS_SHOWN && ( /* 3 levels offered for adding; any depth stored and shown */
              <><div className="ow-in">which is in</div>
                <button type="button" className="ow-up" onClick={() => setLv({ ...lv, sub: { j: lvRows.length } })}><PlusIcon /> What is {theOrQuoted(kName(lvRows[lvRows.length - 1].k))} in? <span>(optional)</span></button></>)}
            <div className="wl-g ow-g">{lvRows.length ? 'Or pick one of your places instead' : 'Pick one of your places'} · {pickList.length}</div>
            <div className="ow-picks">
              {pickList.map((k) => (
                <button type="button" key={keyK(k)} className="wl-row ow-pick" onClick={() => { setPick(k); setLv(null); logEvent('camera_where_pick', { t: k.t }); }}>
                  {lvPic(k) ? <img src={lvPic(k)} alt="" /> : <span className="no">{k.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}
                  <span className="tx"><b>{kName(k)}</b><small>{k.t === 'thing' ? 'a box' : (() => { const n = atPlace(k.name).filter((x) => !self || x.id !== self.id).length; return `a place · ${n ? `${n} item${n === 1 ? '' : 's'}` : 'nothing else here'}`; })()}{sameKnown(k, firstPick.current) && moveItem ? ' · where it was' : ''}</small></span>
                </button>))}
            </div>
            {moveItem && firstPick.current && pick ? <button type="button" className="btn-quiet ow-clear" onClick={() => { setPick(null); setLv(null); }}>Take it out of {theOrQuoted(kName(firstPick.current))} — no place</button> : null}
            </div>
            <div className="two ow-btns">
              <button type="button" className="btn-secondary ow-cancel" onClick={() => setLv(null)}>Cancel</button>
              <button type="button" className="btn-primary ow-done" onClick={lvDone}>Done</button>
            </div>
          </div>
        </div>)}
      {lv && lv.sub && (
        <InList item={lv.sub.j === 0 ? self : lvSubK && lvSubK.t === 'thing' ? lvSubK.item : null} placesOnly={lv.sub.j > 0 && !!lvSubK && lvSubK.t === 'place'}
          selfPlace={lv.sub.j > 0 && lvSubK && lvSubK.t === 'place' && !lvSubK.isNew ? lvSubK.name : ''}
          items={items} places={places} said="" current={lvRows[lv.sub.j] ? lvRows[lv.sub.j].k : null}
          title={lv.sub.j === 0 ? 'Where is it?' : `What is ${theOrQuoted(kName(lvSubK))} in?`}
          exclude={(k) => (lv.sub.j === 0 ? !!self && loopsOver(k, ['t' + self.id]) : blockedFor(k, lvRows.slice(0, lv.sub.j).map((r) => r.k)))}
          onPick={lvPick} onCancel={() => setLv({ ...lv, sub: null })} />)}
      {sheet && sheet.preview !== undefined && pvList.length > 0 && (
        <PhotoViewer key={`pv${pvList.length}`} photos={pvList.map((p, j) => ({ key: j, src: p.photo }))} start={0}
          title={(i, n) => `${cap(name) || 'The item'} · photo ${i + 1} of ${n}`}
          onRemove={itemShots.length ? (i) => setPvAsk({ id: pvList[i] && pvList[i].id, src: pvList[i] && pvList[i].photo }) : null}
          onClose={() => setSheet(null)} />)}
      {sheet && sheet.preview !== undefined && pvAsk && (
        <div className="pv-ask"><Confirm title="Remove this photo?" image={pvAsk.src} body="Only this photo goes." actionLabel="Remove"
          onKeep={() => setPvAsk(null)} onAction={() => { const id = pvAsk.id; setPvAsk(null); setSheet(null); removeShot(id); }} /></div>)}
      {sheet === 'rename' && (
        <div className="sheet-back" onClick={() => setSheet(null)} role="presentation">
          <div className="sheet" role="dialog" aria-labelledby="lc-rn" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="lc-rn">What is it called?</div>
            <input className="place-input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !hasSecret(draft)) { setNameOverride(draft.trim()); setSheet(null); } }} />
            {hasSecret(draft) && <PrivNote typedSecret />}
            <button className="btn-primary" disabled={!draft.trim() || hasSecret(draft)} onClick={() => { setNameOverride(draft.trim()); setSheet(null); }}>Use this name</button>
            <button className="btn-quiet" onClick={() => setSheet(null)}>Cancel</button>
          </div>
        </div>)}
      {sheet && sheet.ask && (
        <Choice title={`Is this your ${own(sheet.ask.name)}?`} options={[
          { label: 'Yes, the same item', onClick: () => { const n = sheet.next; setSheet(null); sayYes(); save(n, 'yes'); } },
          { label: 'No, a new item', onClick: () => { const n = sheet.next; setSheet(null); setAnswer('no'); save(n, 'no'); } },
          { label: 'Cancel', onClick: () => setSheet(null) }]} onCancel={() => setSheet(null)} />)}
      {sheet === 'cancel' && <Confirm title={moveItem ? 'Leave without saving?' : 'Throw these photos away?'} body={moveItem ? 'Where it is stays as it was.' : 'Nothing from this item is saved.'} keepLabel="Keep going" actionLabel={moveItem ? 'Leave' : 'Throw away'}
        onKeep={() => setSheet(null)} onAction={() => { logEvent('capture_leave', { reason: 'cancel', via: 'camera' }); onCancel(); }} />}
    </div>
  );
}
