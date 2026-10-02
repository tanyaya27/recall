import { useEffect, useRef, useState } from 'react';
import { compressPhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, changeLocation, findMatch, knownLocations, placeNamed, noteAlias, logEvent,
  applyVerdict, saveChain, undoChain } from '../lib/db.js';
import { verdictOf, hasSecret } from '../lib/sensitive.js';
import { normName } from '../lib/names.js';
import { me } from '../lib/auth.js';
import { holderOf, chainOf, openEdge, graph, placeOuter, saidOf, TIERS_SHOWN, wouldLoop, placeWouldLoop } from '../lib/graph.js';
import { matchThings, useDictation } from '../lib/speech.js';
import { inThe, theOrQuoted } from '../lib/format.js';
import InList from './InList.jsx';
import PrivNote from './PrivNote.jsx';
import Choice from './Choice.jsx';
import Confirm from './Confirm.jsx';
import PhotoViewer from './PhotoViewer.jsx';
import { CameraIcon, CloseIcon, PinIcon, LockIcon, PencilIcon, SaveIcon, PlusIcon, BoxIcon } from './Icons.jsx';

// 10-01 (Tanya; release 1 "Words, and one pick" — DECISIONS 2026-10-01, BOARD_2026-10-01_two-ways-of-where.md,
// MOCK_2026-10-01_release1-words-and-one-pick.jpg). The camera photographs the ITEM; where it is, is two optional things:
//   · her words — typed or said ("in the blue folder in the desk drawer"), kept as she gave them;
//   · one "In:" — the place or box it is in, picked from a list her words help (InList). What the chip shows is what is saved.
// Nothing on this screen waits on the AI or changes by itself: no tiers, no +, no Choose place, no photo-to-place matching,
// no "This photo is…", no Before → Now. A box or a place changes where IT is from its own page (Move it), one link at a time.
// The AI still names the item from its first photo (and asks "Your wallet?" when it looks like one she has) — about the item,
// never about where.
//   moveItem: "Move it" from an item's page — the In chip starts as where it is now; Save waits for a change.
//   preset:   "Log something into the tin" — the In chip starts as that box or place.
const HOLD_MS = 600; // hold Save this long and it becomes "Save + Next"
const MAX_SHOTS = 6;  // = LOG_MAX: the cover and five more
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');
const many = (s) => /[^su]s$/.test(own(s)) || /\b(glasses|scissors|pants|jeans|trousers|pliers|tongs)$/.test(own(s));
// Where a thing is right now, as the chip's value: the box it's in, or its place by name.
const hereKnown = (it) => { if (!it) return null; const h = holderOf(it); return h ? { t: 'thing', item: h } : it.location ? { t: 'place', name: it.location } : null; };
const sameKnown = (a, b) => (!a && !b) || (!!a && !!b && a.t === b.t && (a.t === 'thing' ? a.item.id === b.item.id : (a.name || '').toLowerCase() === (b.name || '').toLowerCase()));
const kName = (k) => (!k ? '' : k.t === 'thing' ? cap(k.item.name) : k.name);
// What the picked place or box is in, in words ("in the Memorabilia box · in the Crawl space") — read-only, from their own pages.
function outerWords(k0) {
  if (!k0) return [];
  const k = k0.t === 'thing' ? { t: 'thing', item: graph().byId.get(k0.item.id) || k0.item } : k0; // 10-02 (tester r4 N2): never a stale copy
  if (k.t === 'place') return placeOuter(k.name).map((x) => (x.t === 'thing' ? cap(x.item.name) : x.name));
  const ch = chainOf(k.item); const tail = ch.length ? ch[ch.length - 1] : k.item; const loc = (tail.location || '').trim();
  return [...ch.map((x) => cap(x.name)), ...(loc ? [loc, ...placeOuter(loc).map((x) => (x.t === 'thing' ? cap(x.item.name) : x.name))] : [])];
}

export default function LogCamera({ engine, items = [], places = [], owner = undefined, ownerName = '', look = 'b', preset = null, moveItem = null,
  onSaved, onCancel, onWrite, onNotice = () => {} }) {
  const videoRef = useRef(null); const streamRef = useRef(null);
  const [cam, setCam] = useState('starting');
  const [flash, setFlash] = useState(false);
  const [shots, setShotsS] = useState([]); // photos of the item taken now: [{ photo, thumb, file }]
  const shotsRef = useRef([]); const setShots = (f) => { const nx = typeof f === 'function' ? f(shotsRef.current) : f; shotsRef.current = nx; setShotsS(nx); };
  const [tag, setTag] = useState(moveItem ? null : undefined); // the AI's read of the first photo (undefined = not back yet)
  const [match, setMatch] = useState(null); const [answer, setAnswer] = useState(null); // "Your wallet?" — Yes / No
  const startPick = moveItem ? hereKnown(moveItem) : preset ? (preset.t === 'thing' ? { t: 'thing', item: preset.item } : { t: 'place', name: preset.name }) : null;
  const firstPick = useRef(startPick);
  const [pick, setPickS] = useState(startPick);
  const pickTouched = useRef(false); // she picked or cleared the In herself
  // 10-01 (Tanya: "it does not look to be easy to add the 2nd or 3rd tiers"): what the picked place or box is in, and what THAT is in,
  // said right here — one question at a time, outward only, only where nothing is saved yet. ups[0] = what the In is in, ups[1] = what ups[0] is in.
  const [ups, setUps] = useState([]);
  const [upAt, setUpAt] = useState(null); // the In list is open for this tier (1-based above the In)
  const setPick = (k, byHer = true) => { if (byHer) pickTouched.current = true; setPickS(k); setUps([]); };
  const [words, setWords] = useState('');
  const [nameOverride, setNameOverride] = useState('');
  const [shareAnyway, setShareAnyway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [sheet, setSheet] = useState(null); // 'in' | 'rename' | 'cancel' | { preview } | { ask, next }
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
  const wordsRef = useRef(null);
  const mine = !owner || owner === me();
  const started = !!moveItem || shots.length > 0;
  const dictation = useDictation((text) => setWords(text));

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

  async function snap() {
    const v = videoRef.current;
    if (!v || cam !== 'live' || busy || shots.length >= MAX_SHOTS) return;
    if (Date.now() - shotAt.current < 450) return; // a double tap is one photo
    shotAt.current = Date.now();
    const w = v.videoWidth, h = v.videoHeight; if (!w || !h) return;
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
    setFlash(true); setTimeout(() => setFlash(false), 120);
    if (navigator.vibrate) navigator.vibrate(15);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    shot(new File([blob], `recall-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  }
  // Every photo is of the item (and what's around it). The first one, on a new item, is named by the AI.
  async function shot(file) {
    const s = await compressPhoto(file);
    if (!mounted.current) return;
    if (shotsRef.current.length >= MAX_SHOTS) return;
    const first = shotsRef.current.length === 0;
    setShots((ps) => [...ps, { ...s, file }]);
    logEvent('camera_thing_shot', { move: !!moveItem });
    if (first && nextUndo && !nextUndo.done) setNextUndo(null);
    if (first && !moveItem) nameThing(s);
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
  // "Your wallet?" Yes: it IS that item — the chip starts where that one is (seen, and ✕-able), unless she already picked.
  function sayYes() { setAnswer('yes'); if (!pick && match && !pickTouched.current) { const k = hereKnown(match); if (k) { setPick(k, false); firstPick.current = k; } } }

  const self = moveItem || (match && answer === 'yes' ? match : null);
  const name = moveItem ? cap(moveItem.name) : nameOverride || (match && answer === 'yes' ? match.name : (tag && tag.name) || '');
  const v = moveItem || !shots.length || (tag === undefined && !nameOverride) ? null : verdictOf(tag || null, nameOverride);
  const dropPhoto = !!(v && v.secret);
  const startPrivate = !!(v && v.private && mine && !shareAnyway && !(match && answer === 'yes'));
  const typedSecret = hasSecret(words);
  const wordsNow = words.trim();
  const lastSaid = moveItem ? saidOf(moveItem) : null;
  // Move it: Save waits for a change — a photo, words, or a different In (09-30, Ravi; kept).
  const changed = !moveItem || shots.length > 0 || !!wordsNow || !sameKnown(pick, firstPick.current) || ups.length > 0;
  const saveOff = busy || !started || !changed || typedSecret;

  function retake() { logEvent('privacy_retake', { via: 'camera' }); gen.current++; setShots([]); setTag(undefined); setMatch(null); setAnswer(null); setNameOverride(''); setShareAnyway(false); tagP.current = null; }
  function removeShot(i) { const left = shotsRef.current.filter((_, j) => j !== i); if (!left.length && !moveItem) { retake(); return; } setShots(left); }

  // ---- saving
  async function save(next, ans = answer) {
    if (saveOff) return;
    if (!moveItem && match && !ans) { setSheet({ ask: match, next }); return; }
    const isMatch = !moveItem && match && ans === 'yes' ? match : null;
    setBusy(true); setSaveErr('');
    try {
      // the one pick: a box or a place (a new place is made now, by name)
      // "Your wallet?" Yes from the question at Save: it starts where that one is, unless she set the In herself
      const was = moveItem ? firstPick.current : isMatch ? hereKnown(isMatch) : firstPick.current;
      const P = pick || (isMatch && !pickTouched.current ? hereKnown(isMatch) : null);
      let location = ''; let dest = null; let made = { items: [], places: [], moved: [], links: [], placeMoves: [] };
      if (P) {
        const kn = (k) => ({ known: k.t === 'thing' ? { t: 'thing', item: k.item } : { t: 'place', name: k.name } });
        // a loop is refused BEFORE anything is written (10-02 tester r4 N1) — never half a chain
        const ch = [P, ...(P === pick ? ups : [])]; const fresh = (k) => graph().byId.get(k.item.id) || k.item;
        void fresh;
        const selfKeys = self ? ['t' + self.id] : [];
        for (let i = 0; i < ch.length; i++) { if (loopsOver(ch[i], [...selfKeys, ...ch.slice(0, i).map(keyK)])) throw Object.assign(new Error('loop'), { code: 'loop' }); }
        // a place is never inside a box (Q4) — old data from another phone can't make one now
        for (let i = 1; i < ch.length; i++) if (ch[i].t === 'thing' && ch[i - 1].t === 'place') throw Object.assign(new Error('loop'), { code: 'loop' });
        // each "in" row was offered because nothing was saved above the one below it; another phone may have saved one since
        for (let i = 1; i < ch.length; i++) { const w = outerWords(ch[i - 1]); if (w.length && w[0].trim().toLowerCase() !== kName(ch[i]).trim().toLowerCase()) throw Object.assign(new Error('changed'), { code: 'changed', name: kName(ch[i - 1]), where: w[0] }); } // the same place she chose is no conflict (tester r6)
        const r = await saveChain([kn(P), ...(P === pick ? ups : []).map(kn)], { owner: owner || me(), places });
        location = r.first ? r.first.text : ''; dest = r.first ? r.first.dest : null; made = r.made;
      }
      const inChanged = !sameKnown(P, was);
      // Her words: a new statement when she said something, or when the In changed (old words were about the old place).
      const said = wordsNow ? wordsNow : inChanged ? '' : undefined;
      const upsNow = P === pick ? ups : [];
      const outer = [...upsNow.map(kName), ...outerWords(upsNow.length ? upsNow[upsNow.length - 1] : P)];
      const chain = P ? [kName(P), ...outer] : [];
      const pickThumb = !P ? null : P.t === 'thing' ? P.item.thumb : (() => { const p = placeNamed(P.name, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; })();
      const l1 = P ? (outer.length ? '' : `In: ${kName(P)}`) : wordsNow ? `“${wordsNow}”` : '';
      const l2 = P && wordsNow ? `“${wordsNow}”` : '';
      if (moveItem) {
        const s0 = saidOf(moveItem);
        const prev = { location: moveItem.location || '', dest: openEdge(moveItem.id) ? openEdge(moveItem.id).to : null, said: s0.said, saidAt: s0.at, saidBy: s0.by, lastSeenAt: moveItem.lastSeenAt || 0 };
        let ok = true; let photos = null;
        if (shots.length) {
          photos = { since: Date.now(), prev: { photo: moveItem.photo || null, thumb: moveItem.thumb || null, photoCount: moveItem.photoCount || 0, logId: moveItem.logId || '', restingOn: moveItem.restingOn || '' } };
          const cover = shots[0]; const extras = shots.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb }));
          await resnapItem(moveItem, { photo: cover.photo, thumb: cover.thumb, extras, location, dest, placeSource: 'chosen', said });
        } else ok = await changeLocation(moveItem, location, 'chosen', dest, { said });
        logEvent('camera_move', { itemId: moveItem.id, ok, inChanged, words: !!wordsNow, photos: shots.length });
        const bits = [shots.length ? (shots.length === 1 ? 'A new photo' : `${shots.length} new photos`) : '', wordsNow ? 'your words' : ''].filter(Boolean);
        onSaved({ itemId: moveItem.id, where: location, name: cap(moveItem.name), thumbs: [moveItem.thumb, ...(P ? [pickThumb] : [])], l1, l2, chain, none: !P && !wordsNow && !saidOf(moveItem).said, moved: true,
          prev, stayed: !inChanged, added: inChanged ? '' : bits.length ? `${cap(bits.join(' and '))} saved` : 'Saved', refused: ok === false, moving: [],
          undo: mine ? { itemId: moveItem.id, isNew: false, prev, made, photos, after: Date.now() } : null });
        return;
      }
      const cover = shots[0]; const extras = shots.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb }));
      const common = { photo: dropPhoto ? null : cover.photo, thumb: dropPhoto ? null : cover.thumb, extras: dropPhoto ? [] : extras, location, dest, restingOn: (tag && tag.restingOn) || '', placeSource: 'chosen', ...(owner ? { owner } : {}) };
      let itemId; let isNew = false; let prev = null; let photos = null;
      if (isMatch) {
        const s0 = saidOf(isMatch);
        prev = { location: isMatch.location || '', dest: openEdge(isMatch.id) ? openEdge(isMatch.id).to : null, said: s0.said, saidAt: s0.at, saidBy: s0.by, lastSeenAt: isMatch.lastSeenAt || 0 };
        if (dropPhoto) await changeLocation(isMatch, location, 'chosen', dest, { said });
        else { photos = { since: Date.now(), prev: { photo: isMatch.photo || null, thumb: isMatch.thumb || null, photoCount: isMatch.photoCount || 0, logId: isMatch.logId || '', restingOn: isMatch.restingOn || '' } }; await resnapItem(isMatch, { ...common, said }); }
        if (tag && tag.name) noteAlias(isMatch, tag.name);
        itemId = isMatch.id;
        logEvent('merge', { itemId, result: 'confirmed', via: 'camera' });
      } else {
        isNew = true;
        itemId = await addItem({ ...common, said: wordsNow || undefined, name: tag ? (nameOverride || tag.name) : nameOverride, description: (tag && tag.description) || '', details: (tag && tag.details) || '',
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
      logEvent('capture', { initiatedBy: 'camera', itemId, merged: !!isMatch, photos: shots.length, in: pick ? pick.t : null, words: !!wordsNow, next: !!next, look, beforeName: tag === undefined });
      const nm = cap(name) || 'Saved';
      const card = { itemId, where: location, name: nm, lock: startPrivate || (isMatch && isMatch.private), thumbs: [dropPhoto ? null : cover.thumb, ...(P ? [pickThumb] : [])], l1, l2, chain,
        none: !P && !wordsNow, moving: [], undo: mine ? { itemId, isNew, prev, made, photos, after: Date.now() } : null };
      if (next) {
        onSaved({ ...card, next: true });
        setSavedFlash(nm === 'Saved' ? 'Item' : nm); setTimeout(() => { if (mounted.current) setSavedFlash(''); }, 1500);
        setNextUndo(card.undo ? { name: nm === 'Saved' ? 'Item' : nm, undo: card.undo } : null);
        // the next item starts with the same In (a run of things into one box), shown on the chip, ✕-able
        gen.current++; setShots([]); setTag(undefined); setMatch(null); setAnswer(null); setNameOverride(''); setShareAnyway(false); setWords(''); tagP.current = null;
        firstPick.current = P; setPick(P, false); pickTouched.current = false; openedAt.current = Date.now();
        setBusy(false);
        return;
      }
      onSaved(card);
    } catch (err) {
      if (!(err && (err.code === 'loop' || err.code === 'changed'))) console.error('camera save', err);
      const denied = /permission|insufficient/i.test(String(err && (err.code || err.message)));
      if (err && err.code === 'loop') { setSaveErr('Not saved — that would put something inside itself. Change the “in” rows.'); setBusy(false); return; }
      if (err && err.code === 'changed') { setSaveErr(`Not saved — the ${err.name} was just put in the ${err.where} (another phone). Take off its “in” row with ✕, or change it.`); setBusy(false); return; }
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
  function tryCancel() { if (shots.length || (moveItem && changed)) setSheet('cancel'); else onCancel(); }

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

  const pvPhotos = sheet && sheet.preview !== undefined ? (shots.length ? shots : moveItem ? [{ photo: moveItem.photo || moveItem.thumb }] : []).filter((p) => p && p.photo) : [];
  const bandThumb = shots.length ? shots[0].thumb : moveItem ? moveItem.thumb : null;
  const outer = outerWords(pick);
  // + What is the Desk drawer in? — only when the last tier has nothing saved above it, up to TIERS_SHOWN in all
  const upBase = pick ? (ups.length ? ups[ups.length - 1] : pick) : null;
  const canUp = !!upBase && 1 + ups.length < TIERS_SHOWN && !outerWords(upBase).length;
  const chainKeys = [pick, ...ups].filter(Boolean).map((k) => (k.t === 'thing' ? 't' + k.item.id : 'p' + (k.name || '').toLowerCase().trim()));
  // 10-02 (tester r4 N1): a tier above can never be anything already below it — the item, the In, a tier — nor anything inside one of them
  const below = [self, ...[pick, ...ups].filter(Boolean).filter((k) => k.t === 'thing').map((k) => graph().byId.get(k.item.id) || k.item)].filter(Boolean);
  const belowPlaces = [pick, ...ups].filter((k) => k && k.t === 'place').map((k) => k.name);
  const keyK = (k) => (k.t === 'thing' ? 't' + k.item.id : 'p' + (k.name || '').toLowerCase().trim());
  // what the store says is above k (10-02 tester r5): boxes, then its place, then that place's places — boxes and places alike
  const aboveKeys = (k) => {
    if (k.t === 'place') return placeOuter(k.name).map((x) => (x.t === 'thing' ? 't' + x.item.id : 'p' + (x.name || '').toLowerCase().trim()));
    const it = graph().byId.get(k.item.id) || k.item; const ch = chainOf(it); const tail = ch.length ? ch[ch.length - 1] : it; const loc = (tail.location || '').trim();
    return [...ch.map((b) => 't' + b.id), ...(loc ? ['p' + loc.toLowerCase(), ...placeOuter(loc).map((x) => (x.t === 'thing' ? 't' + x.item.id : 'p' + (x.name || '').toLowerCase().trim()))] : [])];
  };
  const loopsOver = (k, lowerKeys) => lowerKeys.includes(keyK(k)) || aboveKeys(k).some((x) => lowerKeys.includes(x));
  const upBlocked = (k) => loopsOver(k, [...(self ? ['t' + self.id] : []), ...chainKeys]) || chainKeys.includes(k.t === 'thing' ? 't' + k.item.id : 'p' + (k.name || '').toLowerCase().trim())
    || (k.t === 'thing' && below.some((x) => x.id === k.item.id || wouldLoop(x, k.item)))
    || (k.t === 'place' && belowPlaces.some((n) => placeWouldLoop(n, { t: 'place', name: k.name })));
  const pickThumb = !pick ? null : pick.t === 'thing' ? pick.item.thumb : (() => { const p = placeNamed(pick.name, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; })();
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
  const prompt = moveItem ? (shots.length ? `${shots.length === 1 ? 'A new photo' : `${shots.length} new photos`} of it — say where, or change “In”.` : 'Photograph it where it is now, or say it.')
    : shots.length >= MAX_SHOTS ? `${MAX_SHOTS} photos — that’s the most. Say where it is.` : 'Another photo of it — or say where it is.';

  return (
    <div className="lc lc-b lc-w1" role="dialog" aria-modal="true" aria-label={moveItem ? 'Move it' : 'Log item'}>
      <div className="lc-top lc-band">
        {started && bandThumb ? (
          <button type="button" className="lc-thing sel" aria-label="The item’s photos" onClick={() => setSheet({ preview: 0 })} disabled={busy}>
            <img src={bandThumb} alt="" />{shots.length > 1 && <span className="lv-n">{shots.length}</span>}{startPrivate && <span className="lc-lk"><LockIcon /></span>}
          </button>) : null}
        <div className="lc-title">
          <small>{ownerName ? <span className="lc-whose">{ownerName}’s ReCall</span> : null}{moveItem ? `Where ${many(moveItem.name) ? 'are' : 'is'} the` : match && answer === 'yes' ? 'One you have' : 'New item'}</small>
          {moveItem ? <b className="lc-name">{name}?</b>
            : started ? <button type="button" className="lc-name" onClick={() => { setDraft(name); setSheet('rename'); }}>{cap(name) || 'Naming…'}</button>
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
            {identity}
            <div className="w1">
              <div className="w1-prompt">{prompt}</div>
              <div className="w1-words">
                <input ref={wordsRef} value={words} onChange={(e) => setWords(e.target.value)} placeholder={moveItem ? 'Where is it now?' : 'Where is it?'}
                  aria-label="Where is it? In your own words" maxLength={240} enterKeyHint="done" autoCapitalize="none" autoComplete="off"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
                {dictation.supported && <button type="button" className={'w1-mic' + (dictation.listening ? ' on' : '')} onClick={dictation.toggle} aria-label="Say it">🎙</button>}
              </div>
              {moveItem && lastSaid && lastSaid.said && !wordsNow ? <div className="w1-last">Last time: “{lastSaid.said}”</div> : null}
              {pick ? (
                <div className="w1-in set" role="group" aria-label={`In: ${kName(pick)}`}>
                  <button type="button" className="w1-in-open" onClick={() => setSheet('in')} disabled={busy}>
                    {pickThumb ? <img src={pickThumb} alt="" /> : <span className="ic">{pick.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}
                    <span className="t"><span className="lab">In:</span> {kName(pick)}{pick.isNew ? <em className="w1-new">new</em> : null}
                      {!ups.length && outer.length ? <small>{outer.map((n) => inThe(n)).join(' · ')}</small> : <small>{pick.t === 'thing' ? 'a box' : 'a place'}</small>}</span>
                  </button>
                  <button type="button" className="x" aria-label={`Take it out of the ${kName(pick)}`} onClick={() => setPick(null)} disabled={busy}><CloseIcon /></button>
                </div>
              ) : (
                <button type="button" className="w1-in" onClick={() => { setSheet('in'); logEvent('camera_in_open', { words: !!wordsNow }); }} disabled={busy}>
                  <span className="ic"><PinIcon /></span><span className="t">What is it in? <small>Optional · pick a place or a box</small></span>
                </button>)}
              {pick && ups.map((k, j) => (
                <div className="w1-up set" key={'up' + j} role="group" aria-label={`${kName(j === 0 ? pick : ups[j - 1])} is in ${kName(k)}`}>
                  <span className="w1-up-in">in</span>
                  <span className="t">{kName(k)}{k.isNew ? <em className="w1-new">new</em> : null}
                    {j === ups.length - 1 && outerWords(k).length ? <small>{outerWords(k).map((n) => inThe(n)).join(' · ')}</small> : null}</span>
                  <button type="button" className="x" aria-label={`${kName(j === 0 ? pick : ups[j - 1])} is not in ${kName(k)}`} onClick={() => setUps((u) => u.slice(0, j))} disabled={busy}><CloseIcon /></button>
                </div>))}
              {canUp && (
                <button type="button" className="w1-up" onClick={() => { setUpAt(ups.length + 1); logEvent('camera_up_open', { tier: ups.length + 2 }); }} disabled={busy}>
                  <PlusIcon /><span>What is {theOrQuoted(kName(upBase))} in?</span>
                </button>)}
              {typedSecret && <PrivNote typedSecret />}
            </div>
            {privLine}
          </div>)}
      </div>
      <div className="lc-bot">
        {saveErr && <div className="lc-err" role="alert">{saveErr}</div>}
        <div className="lc-row">
          <button type="button" className="lc-x" onClick={tryCancel}><CloseIcon /><span>Cancel</span></button>
          <button type="button" className="lc-shutter" style={{ borderColor: '#fff' }} aria-label="Take a photo of it" disabled={cam !== 'live' || busy || shots.length >= MAX_SHOTS} onClick={snap}><span /></button>
          {started ? <button type="button" className={'lc-k sv' + (holdNext ? ' next' : '')} disabled={saveOff}
            aria-label={canNext ? 'Save (hold for Save + Next)' : 'Save'}
            onPointerDown={holdStart} onPointerUp={holdEnd} onPointerCancel={holdCancel} onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => { if (e.detail === 0 && !saveOff) save(false); }}>
            {holdNext ? 'Save + Next' : <><SaveIcon />{busy ? 'Saving…' : 'Save'}</>}</button> : <span />}
        </div>
      </div>

      {upAt !== null && upBase && (
        <InList item={upBase.t === 'thing' ? upBase.item : null} placesOnly={upBase.t === 'place'} selfPlace={upBase.t === 'place' ? upBase.name : ''}
          items={items} places={places} said={wordsNow} current={null} title={`What is ${theOrQuoted(kName(upBase))} in?`}
          exclude={(k) => upBlocked(k)}
          onPick={(k) => { setUps((u) => [...u, k]); setUpAt(null); logEvent('camera_up_pick', { tier: ups.length + 2, t: k.t, isNew: !!k.isNew }); }}
          onCancel={() => setUpAt(null)} />)}
      {sheet === 'in' && (
        <InList item={self} items={items} places={places} said={wordsNow} current={pick} exclude={(k) => !!self && loopsOver(k, ['t' + self.id])}
          onPick={(k) => { setPick(k); setSheet(null); logEvent('camera_in_pick', { t: k.t, isNew: !!k.isNew, fromWords: !!wordsNow }); }}
          onCancel={() => setSheet(null)} />)}
      {sheet && sheet.preview !== undefined && pvPhotos.length > 0 && (
        <PhotoViewer key={`pv${pvPhotos.length}`} photos={pvPhotos.map((p, j) => ({ key: j, src: p.photo }))} start={0}
          title={(i, n) => `${cap(name) || 'The item'} · photo ${i + 1} of ${n}`}
          onRemove={shots.length ? (i) => setPvAsk({ i, src: pvPhotos[i] && pvPhotos[i].photo }) : null}
          onClose={() => setSheet(null)} />)}
      {sheet && sheet.preview !== undefined && pvAsk && (
        <div className="pv-ask"><Confirm title="Remove this photo?" image={pvAsk.src} body="Only this photo goes." actionLabel="Remove"
          onKeep={() => setPvAsk(null)} onAction={() => { const i = pvAsk.i; setPvAsk(null); setSheet(null); removeShot(i); }} /></div>)}
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
