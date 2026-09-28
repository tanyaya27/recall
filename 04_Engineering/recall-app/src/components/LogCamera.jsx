import { useEffect, useRef, useState } from 'react';
import { compressPhoto, compressPlacePhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, changeLocation, findMatch, knownLocations, placeNamed, noteAlias, logEvent,
  applyVerdict, saveChain, PLACE_PHOTOS } from '../lib/db.js';
import { verdictOf, hasSecret } from '../lib/sensitive.js';
import { normName } from '../lib/names.js';
import { me } from '../lib/auth.js';
import { containers, holderOf, chainOf, openEdge, inPhrase, graph, wouldLoop, isContainer } from '../lib/graph.js';
import { matchThings } from '../lib/speech.js';
import WhereList from './WhereList.jsx';
import PrivNote from './PrivNote.jsx';
import Choice from './Choice.jsx';
import Confirm from './Confirm.jsx';
import ChainSheet from './ChainSheet.jsx';
import { CameraIcon, CloseIcon, PinIcon, LockIcon, PencilIcon, SaveIcon, PinAskIcon, BoxIcon, PlusIcon, TrashIcon } from './Icons.jsx';

// The camera photographs the LEVEL you choose (Ravi 09-27, BOARD_2026-09-27_every-path.md; mockups S11_fix_camera.jpg).
//
//   Level 0 is the thing; level 1 is what it is in (or where it is); level 2 is where THAT is; up to 10.
//   Each level has its own colour (the thing is white). The chosen level's square is outlined in its colour and the
//   shutter's outer ring takes the same colour: every photo goes there, nothing is guessed. After the first photo the
//   thing stays chosen (more photos of it); ＋ in the next colour picks the next level. A place chip fills the chosen
//   level (or level 1 while the thing is chosen). Tap a chosen level's photo: half-screen, swipe through THAT level's
//   photos only, Remove this photo. Tap anywhere to close.
//   Cancel alone top-left · "Type it instead" inside the picture (before the first photo) · "💾 + Next" | shutter | "💾 Save"
//   with the two-line sentence above. A dark see-through card: never white on white (09-27 phone test, dark theme).
//
//   moveItem: "Put it somewhere" / "Move it" from a thing's page — level 0 is that thing (already photographed), level 1
//   is chosen; Save moves it. preset: "Log something into the tin" — level 1 is that box.
export const LEVEL_COLOURS = ['#FFFFFF', '#F5B942', '#4DB6F5', '#F2766B', '#A98BF7', '#5BD08D', '#F57EC0', '#3FD0C9', '#C5E35A', '#F79A45', '#E3C9A0'];
const MAX_LEVELS = 10;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');
// "Where is the spoon?" / "Where are the car keys?" — a name that reads as plural gets "are".
const many = (s) => /[^su]s$/.test(own(s)) || /\b(glasses|scissors|pants|jeans|trousers|pliers|tongs)$/.test(own(s));
const whereQ = (s) => (own(s) ? `Where ${many(s) ? 'are' : 'is'} the ${own(s)}?` : 'Where is it?');
let KEY = 0;
// userName: a name given right at capture (R3) — always wins over the AI's late result, and never
// gets overwritten by one. collisionNo: the resolved name she last said "No, a new one" to (R4.2) —
// kept as the STRING, not a flag, so renaming to a DIFFERENT colliding name can ask again.
const emptyLevel = () => ({ key: ++KEY, photos: [], known: null, name: '', userName: '', moves: false, status: 'empty', ask: null, collisionNo: '' });

export default function LogCamera({ engine, items = [], places = [], owner = undefined, ownerName = '', look = 'b', preset = null, moveItem = null,
  onSaved, onCancel, onWrite, onNotice = () => {} }) {
  const videoRef = useRef(null); const streamRef = useRef(null);
  const [cam, setCam] = useState('starting');
  const [flash, setFlash] = useState(false);
  // level 0: the thing — { photos: [{photo, thumb, file}], tag, match, answer } ; levels 1..: where
  const [thing, setThing] = useState(() => (moveItem ? { photos: [], fixed: moveItem, tag: null, match: null, answer: null } : { photos: [], tag: undefined, match: null, answer: null }));
  const [levels, setLevels] = useState(() => (moveItem ? [emptyLevel()] : preset ? [{ ...emptyLevel(), known: preset, status: 'known' }] : []));
  const [sel, setSel] = useState(moveItem ? 1 : 0);
  const [nameOverride, setNameOverride] = useState('');
  const [shareAnyway, setShareAnyway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null);  // 'more' | 'change' | 'rename' | 'cancel' | { ask } | { preview: level index }
  const [pvIndex, setPvIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [lastWhere, setLastWhere] = useState(null); // + Next: the where of the thing saved a moment ago
  const tagP = useRef(null);
  const mounted = useRef(true);
  const openedAt = useRef(Date.now());
  const levelsRef = useRef(levels); levelsRef.current = levels;
  const mine = !owner || owner === me();
  const started = moveItem || thing.photos.length > 0;

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

  // ---- places and containers (only those: never a pencil)
  const self = moveItem || (thing.match && thing.answer === 'yes' ? thing.match : null);
  const okBox = (b) => !self || (b.id !== self.id && !wouldLoop(self, b));
  const others = items.filter((it) => !it.deleted && !((it.createdAt || 0) >= openedAt.current));
  const boxes = containers(graph(), 12).filter(okBox);
  const placeNames = knownLocations(items, 12, places);
  const placePic = (n) => { const p = placeNamed(n, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; };
  // The chips: the most recent place and the most recent box, then the next of each (only two fit beside •••).
  const pc = placeNames.slice(0, 4).map((n) => ({ key: 'p' + n, label: n, thumb: placePic(n), known: { t: 'place', name: n } }));
  const bc = boxes.slice(0, 4).map((b) => ({ key: 'b' + b.id, label: cap(b.name), thumb: b.thumb, known: { t: 'thing', item: b } }));
  const chips = []; for (let i = 0; i < 4; i++) { if (pc[i]) chips.push(pc[i]); if (bc[i]) chips.push(bc[i]); }

  // ---- a photo goes to the chosen level
  async function shot(file) {
    const s = await compressPhoto(file);
    if (!mounted.current) return;
    if (sel === 0 && !moveItem) {
      const first = thing.photos.length === 0;
      setThing((t) => ({ ...t, photos: [...t.photos, { ...s, file }] }));
      logEvent('camera_thing_shot', { n: thing.photos.length + 1 });
      if (first) nameThing(s);
      return;
    }
    const i = sel - 1;
    const cur = levelsRef.current[i] || emptyLevel();
    // REQUIREMENTS_2026-09-27 R1 (kills F1): a level that already has an IDENTITY — picked as a chip,
    // confirmed "Yes" on an ask, or given a name of her own — keeps it. The shutter only ever ADDS a
    // photo to it; it never wipes `known`, never re-enters the naming pass. Only a level with no
    // identity yet behaves as before: first photo starts the naming pass, later ones just join it.
    const identified = !!cur.known || (!!cur.ask && !cur.no) || !!cur.userName;
    const firstOfLevel = !identified && cur.photos.length === 0;
    const next = identified
      ? { ...cur, photos: [...cur.photos, { ...s, file }] }
      : { ...cur, photos: [...cur.photos, { ...s, file }], known: null, ...(firstOfLevel ? { status: 'naming', name: '', ask: null, no: false, yes: false, collisionNo: '' } : {}) };
    setLevels((ls) => { const c = [...ls]; while (c.length <= i) c.push(emptyLevel()); c[i] = next; return c; });
    logEvent('camera_where_shot', { level: sel, n: next.photos.length, identified });
    if (firstOfLevel) nameWhere(next.key, s.photo);
  }

  function nameThing(s) {
    const chipNames = knownLocations(items, 8, places);
    tagP.current = engine.tagPhoto([s.photo], { knownPlaces: chipNames, catalog: items.filter((it) => it.name).map((it) => ({ name: it.name, aliases: it.aliases || [] })), sensitivity: 'personal' })
      .then((r) => r, (err) => { console.error(err); return null; });
    tagP.current.then(async (tag) => {
      if (!mounted.current) return;
      setThing((t) => ({ ...t, tag }));
      if (!tag) return;
      const byName = findMatch(others, tag);
      if (byName) { setThing((t) => ({ ...t, match: byName })); return; }
      const byWords = matchThings(others, [tag.name, ...(tag.alternatives || [])].join(' '));
      const recent = [...others].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
      const cands = []; [...byWords, ...recent].forEach((it) => { if (cands.length < 6 && !cands.includes(it) && it.thumb) cands.push(it); });
      if (!cands.length) return;
      try {
        const small = await Promise.all(cands.map((c) => shrink(c.thumb, 320)));
        const r = await engine.sameThing([s.photo], cands.map((c, i) => ({ name: c.name, thumb: small[i] })), { subject: tag.name, sensitivity: 'personal' });
        const hit = r.index >= 0 && r.sure ? cands[r.index] : null;
        logEvent('identity_check', { candidates: cands.length, hit: hit ? hit.id : null, via: 'camera' });
        if (hit && mounted.current) setThing((t) => ({ ...t, match: hit }));
      } catch (err) { console.error(err); }
    });
  }

  async function nameWhere(key, photo) {
    // REQUIREMENTS_2026-09-27 R4.3 (kills F8): 4 boxes + 4 places (was 2) — still one whereIs call.
    // A place-starved pool was making recognition BY SIGHT fail routinely, pushing every photographed
    // place onto the silent-merge path that R4.2's name-collision ask now also catches.
    const cands = [...boxes.filter((b) => b.thumb).slice(0, 4).map((b) => ({ c: { name: b.name, thumb: b.thumb }, known: { t: 'thing', item: b } })),
      ...places.filter((p) => p.photos && p.photos.length).slice(0, 4).map((p) => ({ c: { name: p.name, thumb: p.photos[0].thumb }, known: { t: 'place', name: p.name } }))].slice(0, 8);
    let r = null;
    try {
      const small = await Promise.all(cands.map((x) => shrink(x.c.thumb, 320)));
      r = await engine.whereIs(photo, cands.map((x, i) => ({ name: x.c.name, thumb: small[i] })), { thing: nameNow(), sensitivity: 'personal' });
    } catch (err) { console.error(err); }
    if (!mounted.current) return;
    const hit = r && r.index >= 0 && r.sure ? cands[r.index].known : null;
    logEvent('camera_where_named', { named: !!(r && r.name), moves: !!(r && r.moves), known: !!hit });
    // REQUIREMENTS_2026-09-27 R3.2: a name she typed before the AI answered WINS — the late result
    // only ever fills `moves`/`ask`, never the name itself, once `userName` is set.
    setLevels((ls) => ls.map((l) => (l.key !== key ? l : { ...l, status: r ? 'named' : 'failed', name: l.userName ? l.name : ((r && r.name) || ''), moves: !!(r && r.moves), ask: hit })));
  }

  // ---- what the screen says
  const tag = thing.tag;
  const match = moveItem ? null : (thing.match && thing.answer !== 'no' ? thing.match : null);
  const name = moveItem ? cap(moveItem.name) : nameOverride || (match ? match.name : (tag && tag.name) || '');
  function nameNow() { return name; }
  const v = moveItem || !thing.photos.length || (tag === undefined && !nameOverride) ? null : verdictOf(tag || null, nameOverride);
  const dropPhoto = !!(v && v.secret);
  const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
  const WHY = { 'in the photo': 'The photo shows where it is.', 'usual place': 'Where it usually lives.', 'just used': 'Where the last thing went.' };
  const guess = !moveItem && tag && tag.placeCertain && tag.placeGuesses && tag.placeGuesses[0] && placeNames.some((n) => n.toLowerCase() === tag.placeGuesses[0].toLowerCase())
    ? { known: { t: 'place', name: placeNames.find((n) => n.toLowerCase() === tag.placeGuesses[0].toLowerCase()) }, why: 'in the photo' } : null;
  const usual = match ? (() => { const h = holderOf(match); return h ? { known: { t: 'thing', item: h }, why: 'usual place' } : match.location ? { known: { t: 'place', name: match.location }, why: 'usual place' } : null; })() : null;
  const suggestion = lastWhere ? { known: lastWhere, why: 'just used' } : usual || guess;
  const filled = (l) => !!l && (l.photos.length > 0 || !!l.known);
  const real = levels.filter(filled);
  // What will be saved: the filled levels, or (none filled) the suggestion.
  const links = real.length ? real : suggestion && !moveItem ? [{ key: 'sugg', photos: [], known: suggestion.known, why: suggestion.why }] : [];
  const lastLink = links[links.length - 1];
  const known = (l) => (l.known ? l.known : l.ask && !l.no ? l.ask : null);
  // REQUIREMENTS_2026-09-27 R3.2: a name given at capture (userName) shows immediately, even while
  // `status` is still 'naming' — she should never see "Naming…" over a name she already gave it.
  const linkName = (l) => { const k = known(l); return k ? (k.t === 'thing' ? cap(k.item.name) : k.name) : l.userName ? cap(l.userName) : l.status === 'naming' ? 'Naming…' : cap(l.name) || (l.moves ? 'A box' : 'A place'); };
  const linkThumb = (l) => (l.photos && l.photos.length ? l.photos[0].thumb : (() => { const k = known(l); return !k ? null : k.t === 'thing' ? k.item.thumb : placePic(k.name); })());
  const isBox = (l) => { const k = known(l); return k ? k.t === 'thing' : l.moves; };

  function sentence() {
    if (!links.length) return { l1: 'No place yet', l2: started ? 'Tap ＋ to add where it is' : '', none: true };
    const first = links[0];
    const n1 = linkName(first);
    const l1 = first.status === 'naming' && !first.userName ? 'Naming the place…' : isBox(first) ? inPhrase({ name: n1 }) : n1;
    const rest = links.slice(1).map(linkName);
    const lk = known(lastLink);
    if (lk && lk.t === 'thing') { const outer = chainOf(lk.item); rest.push(...outer.map((c) => cap(c.name))); const tail = outer.length ? outer[outer.length - 1] : lk.item; if (tail.location && !rest.includes(tail.location)) rest.push(tail.location); }
    return { l1, l2: rest.length ? rest.join(' · ') : (first.why ? WHY[first.why] || first.why : ''), none: false };
  }
  const say = sentence();

  // ---- levels: pick, add, fill from a chip
  const lastFilled = levels.length === 0 || filled(levels[levels.length - 1]);
  const canAdd = started && lastFilled && levels.length < MAX_LEVELS && !busy;
  function addLevel() {
    if (!canAdd) return;
    setLevels((ls) => [...ls, emptyLevel()]); setSel(levels.length + 1);
    logEvent('camera_level_add', { level: levels.length + 1 });
  }
  function tapLevel(i) {
    if (i === 0 && moveItem) { if (moveItem.photo || moveItem.thumb) { setSheet({ preview: 0 }); setPvIndex(0); } return; }
    if (i !== sel) { setSel(i); return; }
    const photos = i === 0 ? thing.photos : (levels[i - 1] || {}).photos || [];
    if (photos.length || (i > 0 && known(levels[i - 1] || {}))) { setSheet({ preview: i }); setPvIndex(photos.length ? photos.length - 1 : 0); }
  }
  function pickKnown(k) {
    const i = sel === 0 ? Math.max(0, levels.findIndex((l) => !filled(l))) : sel - 1;
    const target = sel === 0 && levels.findIndex((l) => !filled(l)) === -1 ? levels.length : i;
    if (k.t === 'thing' && self && (k.item.id === self.id || wouldLoop(self, k.item))) return;
    setLevels((ls) => { const c = [...ls]; while (c.length <= target) c.push(emptyLevel()); c[target] = { ...c[target], photos: [], known: k, status: 'known', ask: null }; return c; });
    setSel(target + 1);
    logEvent('camera_where_chip', { t: k.t, level: target + 1 });
  }
  function removePhoto(li, pi) {
    if (li === 0) {
      setThing((t) => { const photos = t.photos.filter((_, j) => j !== pi); return photos.length ? { ...t, photos } : { photos: [], tag: undefined, match: null, answer: null }; });
      if (thing.photos.length === 1) { setLevels([]); setSel(0); setSheet(null); tagP.current = null; }
    } else {
      // REQUIREMENTS_2026-09-27 R1.3: removing the last ATTACHED photo of an identified level keeps
      // the identity (she picked it, the photo count didn't derive it) — the square falls back to the
      // known thumb/pin via linkThumb(); only a level with no identity resets to empty.
      setLevels((ls) => ls.map((l, j) => {
        if (j !== li - 1) return l;
        const photos = l.photos.filter((_, k) => k !== pi);
        const identified = !!l.known || (!!l.ask && !l.no) || !!l.userName;
        return photos.length === 0 && !identified ? { ...l, photos, status: 'empty', name: '', ask: null } : { ...l, photos };
      }));
    }
    setPvIndex((x) => Math.max(0, x - 1));
    logEvent('camera_photo_removed', { level: li });
    const left = li === 0 ? thing.photos.length - 1 : ((levels[li - 1] || {}).photos || []).length - 1;
    if (left <= 0) setSheet(null);
  }

  // ---- the chain sheet (R5, kills F5): the pencil edits ONE level, never the whole chain. `idx` is
  // the level's position in `links` (0-based, matching `levels` when any level is real; the lone
  // suggestion row, key 'sugg', has no backing level yet — Replace/Remove on it just starts one).
  function chainRename(idx) {
    if (!levels[idx]) { setLevels([emptyLevel()]); setSel(1); setDraft(''); setSheet({ levelRename: 0 }); return; }
    const l = levels[idx];
    setDraft(cap(l.userName || l.name) || '');
    setSheet({ levelRename: idx });
  }
  function chainReplace(idx) {
    if (!levels[idx]) { setLevels([emptyLevel()]); setSel(1); setSheet(null); logEvent('camera_where_change', { how: 'replace', level: 1 }); return; }
    const oldKey = levels[idx].key;
    setLevels((ls) => ls.map((l, j) => (j === idx ? { ...emptyLevel(), key: oldKey } : l)));
    setSel(idx + 1);
    setSheet(null);
    logEvent('camera_where_change', { how: 'replace', level: idx + 1 });
  }
  function chainRemove(idx) {
    if (!levels[idx]) { setLevels([]); setLastWhere(null); setSel(0); setSheet(null); logEvent('camera_where_change', { how: 'remove' }); return; }
    const removedNum = idx + 1;
    setLevels((ls) => ls.filter((_, j) => j !== idx));
    setSel((s) => (s === removedNum ? Math.max(0, idx) : s > removedNum ? s - 1 : s));
    setSheet(null);
    logEvent('camera_where_change', { how: 'remove', level: removedNum });
  }
  function chainNoPlace() {
    if (real.length >= 2) { setSheet('chain-clear'); return; }
    setLevels([]); setLastWhere(null); setSel(0); setSheet(null);
    logEvent('camera_where_change', { how: 'none' });
  }
  function chainClearConfirmed() {
    setLevels([]); setLastWhere(null); setSel(0); setSheet(null);
    logEvent('camera_where_change', { how: 'none_confirmed' });
  }
  // R3: applies the rename sheet's draft — to the thing (nameOverride) or to one WHERE level
  // (userName only). A user name always wins; nameWhere's late AI result checks userName first.
  function applyRename() {
    const n = draft.trim();
    if (!n || hasSecret(n)) return;
    if (sheet === 'rename') { setNameOverride(n); setSheet(null); return; }
    const idx = sheet.levelRename;
    setLevels((ls) => ls.map((l, j) => (j === idx ? { ...l, userName: n } : l)));
    setSheet(null);
    logEvent('camera_level_rename', { level: idx + 1 });
  }

  // ---- saving
  async function save(next, answer = thing.answer) {
    if (busy || !started || collidingLevel) return;
    if (!moveItem && thing.match && !answer) { setSheet({ ask: thing.match, next }); return; }
    const match = !moveItem && thing.match && answer === 'yes' ? thing.match : null;
    const name = moveItem ? moveItem.name : nameOverride || (match ? match.name : (tag && tag.name) || '');
    const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
    setBusy(true);
    try {
      let cur = levelsRef.current;
      const t0 = Date.now();
      while (cur.some((l) => l.photos.length && !l.known && l.status === 'naming') && Date.now() - t0 < 12000) { await new Promise((r) => setTimeout(r, 250)); cur = levelsRef.current; }
      const use = cur.filter(filled).length ? cur.filter(filled) : links;
      const resolved = [];
      for (const l of use) {
        const k = known(l);
        if (k && k.t === 'thing') {
          // REQUIREMENTS_2026-09-27 R1/R2: photos attached to a KNOWN box join it as extra shots.
          resolved.push({ known: k, extraPhotos: l.photos.map((p) => ({ photo: p.photo, thumb: p.thumb })) });
        } else if (k) {
          // …and to a KNOWN place, as placePhotos on that place doc (capped the same as any place, R2.3).
          const placePhotos = l.photos.length ? await Promise.all(l.photos.slice(0, PLACE_PHOTOS).map((p) => compressPlacePhoto(p.file))) : [];
          resolved.push({ known: k, placePhotos });
        } else {
          const finalName = l.userName || l.name || '';
          resolved.push({ photo: l.photos[0].photo, thumb: l.photos[0].thumb, extras: l.photos.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb })),
            placePhotos: l.moves ? null : await Promise.all(l.photos.slice(0, PLACE_PHOTOS).map((p) => compressPlacePhoto(p.file))), name: finalName, moves: l.moves,
            // REQUIREMENTS_2026-09-27 R3.3: still a placeholder at Save — never blocks the save, but the
            // confirmation card offers "Unnamed — tap to name" on the doc this creates.
            unnamed: !finalName.trim() });
        }
      }
      const { first, made } = await saveChain(resolved, { owner: owner || me(), places });
      const location = first ? first.text : '';
      const dest = first ? first.dest : null;
      const thumbs = [moveItem ? moveItem.thumb : dropPhoto ? null : thing.photos[0].thumb, ...use.map(linkThumb)];
      // R3.3: made.links[j] lines up with use[j]/resolved[j] — pick out the ones saved unnamed.
      const unnamed = use.map((l, j) => { const info = made.links && made.links[j]; return info && info.unnamed ? { id: info.id, kind: info.kind, thumb: linkThumb(l) } : null; }).filter(Boolean);
      // R6.4 (kills F6, soft nudge not a chore): the outermost link is a brand-new box with nothing
      // beyond it — only when the usual second line would otherwise say nothing about where it is.
      const lastReal = links.length ? links[links.length - 1] : null;
      const lastIsNewBox = !moveItem && lastReal && !known(lastReal) && lastReal.moves;
      let l2 = say.none ? '' : say.l2;
      if (lastIsNewBox && !l2) l2 = `You haven't said where the ${linkName(lastReal)} is — its page can, any time.`;
      if (moveItem) {
        const prev = { location: moveItem.location || '', dest: openEdge(moveItem.id) ? openEdge(moveItem.id).to : null };
        const ok = location ? await changeLocation(moveItem, location, 'chosen', dest) : true;
        logEvent('camera_move', { itemId: moveItem.id, ok, depth: resolved.length });
        onSaved({ itemId: moveItem.id, where: location, name: cap(moveItem.name), thumbs, l1: say.l1, l2, none: say.none, moved: true, refused: ok === false, unnamed,
          undo: mine ? { itemId: moveItem.id, isNew: false, prev, made } : null });
        return;
      }
      const cover = thing.photos[0]; const extras = thing.photos.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb }));
      const common = { photo: dropPhoto ? null : cover.photo, thumb: dropPhoto ? null : cover.thumb, extras: dropPhoto ? [] : extras, location, dest, restingOn: (tag && tag.restingOn) || '', placeSource: 'chosen', ...(owner ? { owner } : {}) };
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
          const knew = !!v;
          tagP.current.then(async (t) => {
            await nameItem(itemId, t ? { name: nameOverride || t.name, description: t.description, restingOn: t.restingOn, details: t.details, aliases: nameOverride && t.name && normName(t.name) !== normName(nameOverride) ? [t.name] : [] } : {});
            if (knew || !t) return;
            const late = verdictOf(t, nameOverride); const done2 = await applyVerdict(itemId, late, owner || me());
            if (done2.length) onNotice({ itemId, done: done2, why: late.why });
          });
        }
      }
      logEvent('capture', { initiatedBy: 'camera', itemId, merged: !!match, depth: resolved.length, photos: thing.photos.length, made: made.items.length + made.places.length, next: !!next, look, beforeName: tag === undefined });
      const card = { itemId, where: location, name: cap(name) || 'Saved', lock: startPrivate || (match && match.private), thumbs, l1: say.l1, l2, none: say.none, unnamed,
        undo: mine ? { itemId, isNew, prev, made } : null };
      if (next) {
        onSaved({ ...card, next: true });
        setThing({ photos: [], tag: undefined, match: null, answer: null }); setLevels([]); setSel(0); setNameOverride(''); setShareAnyway(false); openedAt.current = Date.now(); tagP.current = null;
        setLastWhere(dest ? (dest.t === 'thing' ? { t: 'thing', item: { ...(graph().byId.get(dest.id) || {}), id: dest.id, name: dest.name, thumb: thumbs[1] || (graph().byId.get(dest.id) || {}).thumb } } : dest) : null);
        setBusy(false);
        return;
      }
      onSaved(card);
    } catch (err) { console.error('camera save', err); setBusy(false); }
  }
  function tryCancel() { if (thing.photos.length || real.some((l) => l.photos.length)) setSheet('cancel'); else onCancel(); }

  // ---- drawing
  const colour = LEVEL_COLOURS[Math.min(sel, LEVEL_COLOURS.length - 1)];
  const lvName = (i) => (i === 0 ? (cap(name) || 'the thing') : linkName(levels[i - 1] || links[i - 1] || {}));
  const selLevel = sel > 0 ? levels[sel - 1] : null;
  // REQUIREMENTS_2026-09-27 R2.4 (kills the b-f dead end): a level that is already KNOWN (chip,
  // WhereList pick — typed-new or existing) but has no photo of its OWN yet gets its own prompt, so
  // the typed path can photograph right away instead of looking like a dead end.
  const prompt = !started ? { b: 'Photograph the thing', s: 'Take as many photos of it as you like.' }
    : sel === 0 ? { b: `${cap(name) || 'The thing'} · ${thing.photos.length} photo${thing.photos.length === 1 ? '' : 's'}`, s: 'Another photo of it, or tap ＋ to photograph where it goes.' }
    : !filled(selLevel) ? (moveItem && sel === 1 ? { b: whereQ(name), s: 'Photograph the place or what it is in. Or tap one.' }
      : sel === 1 ? { b: 'Where it goes', s: `Photograph what ${own(name) ? 'the ' + own(name) : 'it'} is in, or where it is. Or tap a place.` }
      : { b: whereQ(lvName(sel - 1)), s: 'Photograph what it is in, or where it is. Or tap a place.' })
    : (selLevel.known && selLevel.photos.length === 0) ? { b: `${linkName(selLevel)} — add a photo of it, or tap ＋ for where that is.`, s: '' }
    : { b: `${isBox(selLevel) ? inPhrase({ name: linkName(selLevel) }) : linkName(selLevel)}${selLevel.photos.length ? ` · ${selLevel.photos.length} photo${selLevel.photos.length === 1 ? '' : 's'}` : ''}`, s: `Another photo of it, or tap ＋ for where ${isBox(selLevel) ? 'the ' + own(linkName(selLevel)) : 'that'} is.` };
  // REQUIREMENTS_2026-09-27 R4.2 (kills F3/F8): a level's resolved name — the AI's, or her own —
  // may be the SAME (normName) as a place or container she already has, even when the visual check
  // missed it. Never merge silently: same "Your {name}?" ask, same Yes/No, but "No" also opens the
  // rename sheet right away (the distinct-name gate below keeps Save off until she does).
  const resolvedLevelName = (l) => cap(l.userName || l.name || '');
  function collisionFor(rawName) {
    const n = normName(rawName);
    if (!n) return null;
    const p = places.find((pl) => normName(pl.name) === n);
    if (p) return { t: 'place', name: p.name };
    const b = items.find((it) => !it.deleted && it.name && isContainer(it, graph()) && normName(it.name) === n);
    if (b) return { t: 'thing', item: b };
    return null;
  }
  const levelCollision = (l) => {
    if (known(l)) return null;
    const nm = resolvedLevelName(l);
    return nm ? collisionFor(nm) : null;
  };
  // R4.4 (kills F7): at most one level ask at a time, in chain order — a visual sure-match ask
  // (already stored on the level as `ask`) takes priority over a same-name collision found here.
  const levelAsks = [];
  levels.forEach((l) => {
    if (l.ask && !l.no && !l.yes && l.status === 'named') { levelAsks.push({ l, target: l.ask, byName: false }); return; }
    if (!l.ask || l.no) {
      const col = levelCollision(l);
      if (col && l.collisionNo !== resolvedLevelName(l)) levelAsks.push({ l, target: col, byName: true });
    }
  });
  const askLevel = levelAsks[0] || null;
  // R4.2: the Save gate — a level that is new AND still names something already saved can't be
  // saved as a second doc by accident. Scoped to that link only: removing/replacing it (R5), or
  // renaming it, or answering the ask, all clear the gate; nothing else about the save is blocked.
  const collidingLevel = levels.find((l) => levelCollision(l));
  // R4.2: the sentence explains the gate instead of showing its usual second line.
  if (collidingLevel) say.l2 = `'${resolvedLevelName(collidingLevel)}' needs its own name — tap it.`;
  function retake() { logEvent('privacy_retake', { via: 'camera' }); setThing({ photos: [], tag: undefined, match: null, answer: null }); setLevels([]); setSel(0); setNameOverride(''); setShareAnyway(false); tagP.current = null; }
  const privLine = started && !moveItem ? (
    <PrivNote v={v} mine={mine} ownerName={ownerName} isNew={!match} shared={shareAnyway}
      onShare={(x) => { setShareAnyway(x); logEvent('privacy_share', { to: x ? 'shared' : 'private', mode: 'camera' }); }}
      onRetake={retake} onDontSave={() => { logEvent('capture_leave', { reason: 'helper_private', via: 'camera' }); onCancel(); }} />) : null;
  const identity = !moveItem && thing.match && !thing.answer ? (
    <div className="lc-ask" role="group" aria-label="Is this the same thing?">
      <b>Your {own(thing.match.name)}?</b>
      <div><button type="button" onClick={() => setThing((t) => ({ ...t, answer: 'yes' }))}>Yes</button>
        <button type="button" className="o" onClick={() => setThing((t) => ({ ...t, answer: 'no' }))}>No, a new thing</button></div>
    </div>) : null;
  const whereAsk = askLevel ? (
    <div className="lc-ask" role="group" aria-label="Is this the one you have?">
      <b>Your {own(askLevel.target.t === 'thing' ? askLevel.target.item.name : askLevel.target.name)}?</b>
      <div><button type="button" onClick={() => {
          if (askLevel.byName) { setLevels((ls) => ls.map((l) => (l.key === askLevel.l.key ? { ...l, known: askLevel.target } : l))); logEvent('camera_where_collision', { answer: 'yes' }); }
          else setLevels((ls) => ls.map((l) => (l.key === askLevel.l.key ? { ...l, yes: true } : l)));
        }}>Yes</button>
        <button type="button" className="o" onClick={() => {
          if (askLevel.byName) {
            const nm = resolvedLevelName(askLevel.l);
            const idx = levels.findIndex((l) => l.key === askLevel.l.key);
            setLevels((ls) => ls.map((l) => (l.key === askLevel.l.key ? { ...l, collisionNo: nm } : l)));
            setDraft(nm); setSheet({ levelRename: idx, msg: `There's already a '${nm}'. Give this one its own name.` });
            logEvent('camera_where_collision', { answer: 'no' });
          } else setLevels((ls) => ls.map((l) => (l.key === askLevel.l.key ? { ...l, no: true } : l)));
        }}>No, a new one</button></div>
    </div>) : null;

  // The level squares: the thing (0), each where level, then ＋ in the next colour.
  const squares = [];
  if (started) {
    const t0 = moveItem ? moveItem.thumb : thing.photos[0] && thing.photos[0].thumb;
    squares.push({ i: 0, thumb: t0, n: moveItem ? 0 : thing.photos.length, lock: startPrivate, nm: cap(name) || 'Naming…' });
    const shown = real.length || levels.length ? levels : links; // before any level exists, the suggestion stands in level 1
    shown.forEach((l, j) => squares.push({ i: j + 1, thumb: linkThumb(l), n: l.photos ? l.photos.length : 0, empty: !filled(l), box: isBox(l), nm: filled(l) ? linkName(l) : 'Where?', sugg: l.key === 'sugg' }));
  }
  const sq = (s, big) => {
    const c = LEVEL_COLOURS[Math.min(s.i, LEVEL_COLOURS.length - 1)]; const on = s.i === sel && !s.sugg;
    return (
      <div className={big ? 'lv-t' : 'lv-s'} key={'l' + s.i}>
        {s.i > 0 && <span className="lc-in">in</span>}
        <div className="lv-tile">
          <button type="button" className={'lv-sq' + (on ? ' sel' : '') + (s.empty ? ' empty' : '')} style={on || s.empty ? { borderColor: c, color: c } : undefined}
            aria-label={s.i === 0 ? `The thing: ${s.nm}` : `Level ${s.i}: ${s.nm}`} aria-pressed={on} onClick={() => (s.sugg ? pickKnown(links[0].known) : tapLevel(s.i))}>
            {s.thumb ? <img src={s.thumb} alt="" /> : s.empty ? <PinAskIcon /> : s.box ? <BoxIcon /> : <PinIcon />}
            {s.n > 1 && <span className="lv-n">{s.n}</span>}
            {s.lock && <span className="lc-lk"><LockIcon /></span>}
          </button>
          {big && <div className="lc-nm">{s.nm}</div>}
        </div>
      </div>);
  };
  const plus = (big) => (canAdd ? (
    <div className={big ? 'lv-t' : 'lv-s'} key="plus"><span className="lc-in">in</span>
      <div className="lv-tile"><button type="button" className="lv-sq empty plus" style={{ borderColor: LEVEL_COLOURS[Math.min(levels.length + 1, LEVEL_COLOURS.length - 1)], color: LEVEL_COLOURS[Math.min(levels.length + 1, LEVEL_COLOURS.length - 1)] }}
        aria-label="Add where it is: the next level" onClick={addLevel}><PlusIcon /></button>{big && <div className="lc-nm">Where?</div>}</div></div>) : null);
  const many = squares.length + (canAdd ? 1 : 0);

  const sentenceEl = started ? (
    <div className="lc-say">
      <PinIcon />
      <span className="tx"><b>{say.l1}</b>{say.l2 && <span className="soft">{say.l2}</span>}</span>
      {links.length > 0 && !moveItem && <button type="button" className="lc-chg" aria-label="Change where it goes" onClick={() => setSheet('chain')}><PencilIcon /></button>}
    </div>) : null;
  const showChips = started && (sel > 0 || !real.length) && chips.length > 0;
  const pv = sheet && sheet.preview !== undefined ? sheet.preview : null;
  const pvPhotos = (pv === null ? [] : pv === 0 ? (moveItem ? [{ photo: moveItem.photo || moveItem.thumb }] : thing.photos) : (() => { const l = levels[pv - 1] || {}; return l.photos && l.photos.length ? l.photos : (known(l) ? [{ photo: linkThumb(l) }] : []); })())
    .filter((p) => p && p.photo); // a thing or box with no photo has nothing to show

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
        <div className="lc-prompt"><span className="dot" style={{ borderColor: colour }} aria-hidden="true" /><div><b>{prompt.b}</b><small>{prompt.s}</small></div></div>
        {/* Type it instead: inside the picture, before the first photo (Ravi 09-27). */}
        {!started && onWrite && <div className="lc-typeit"><button type="button" onClick={onWrite}><PencilIcon />Type it instead</button></div>}
        {look === 'a' && started && (<>
          <div className={'lv-chain' + (many > 3 ? ' more' : '')}>{squares.map((s) => sq(s, true))}{plus(true)}</div>
          {(privLine || identity || whereAsk) && <div className="lc-float">{identity || whereAsk}{privLine}</div>}
        </>)}
        {look === 'b' && started && (
          <div className="lc-card">
            <div className={'lv-strip' + (many > 5 ? ' more' : '')}>{squares.map((s) => sq(s, false))}{plus(false)}</div>
            <button type="button" className="lc-name" disabled={!!moveItem} onClick={() => { setDraft(name); setSheet('rename'); }}>{cap(name) || 'Naming…'}{startPrivate && <LockIcon />}</button>
            {identity || whereAsk}
            {privLine}
            {sentenceEl}
          </div>)}
      </div>
      <div className="lc-bot">
        {showChips && (
          <div className="lc-chips" aria-label="Or tap a place">
            <span className="lc-cdot" style={{ background: sel > 0 ? colour : LEVEL_COLOURS[1] }} aria-hidden="true" />
            {chips.filter((c) => !real.some((l) => l.known && ((l.known.t === 'thing' && c.known.t === 'thing' && l.known.item.id === c.known.item.id) || (l.known.t === 'place' && c.known.t === 'place' && l.known.name === c.known.name)))).slice(0, 2).map((c) => (
              <button key={c.key} type="button" className={'lc-chip' + (c.known.t === 'thing' ? ' box' : '')} onClick={() => pickKnown(c.known)}>
                {c.thumb ? <img src={c.thumb} alt="" /> : <span className="ic">{c.known.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}<span>{c.label}</span></button>))}
            <button type="button" className="lc-chip more" aria-label="Every place and box" onClick={() => setSheet('more')}><span className="ic">•••</span></button>
          </div>)}
        {look === 'a' && sentenceEl}
        <div className="lc-row">
          {started && !moveItem ? <button type="button" className="lc-k sn" disabled={busy || !!collidingLevel} onClick={() => save(true)} aria-label="Save and log the next thing"><SaveIcon /><span className="plus">+</span>Next</button> : <span />}
          <button type="button" className="lc-shutter" style={{ borderColor: colour }} aria-label="Take a photo" disabled={cam !== 'live' || busy} onClick={snap}><span /></button>
          {started ? <button type="button" className="lc-k sv" disabled={busy || (moveItem && !real.length) || !!collidingLevel} onClick={() => save(false)}><SaveIcon />{busy ? 'Saving…' : 'Save'}</button> : <span />}
        </div>
      </div>

      {pv !== null && pvPhotos.length > 0 && (
        <div className="lc-pv" role="dialog" aria-label={lvName(pv)} onClick={() => setSheet(null)}>
          <div className="box" style={{ borderColor: LEVEL_COLOURS[Math.min(pv, LEVEL_COLOURS.length - 1)] }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-strip" onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== pvIndex) setPvIndex(i); }}
              ref={(el) => { if (el && el.dataset.init !== String(pv)) { el.dataset.init = String(pv); el.scrollLeft = pvIndex * el.clientWidth; } }}>
              {pvPhotos.map((p, j) => <img key={j} src={p.photo} alt="" />)}
            </div>
            {pvPhotos.length > 1 && <div className="pv-dots">{pvPhotos.map((_, j) => <i key={j} className={j === pvIndex ? 'on' : ''} />)}</div>}
            {/* REQUIREMENTS_2026-09-27 R3.1: the name line is a button — tap it to rename this ONE
                level (level 0, the thing, keeps its own existing rename affordance elsewhere). */}
            {pv > 0 ? (
              <button type="button" className="pv-name" onClick={() => chainRename(pv - 1)}>
                <b>{lvName(pv)}{pvPhotos.length > 1 ? ` · photo ${pvIndex + 1} of ${pvPhotos.length}` : ''}</b><span className="pv-rn">Rename</span>
              </button>
            ) : <b>{lvName(pv)}{pvPhotos.length > 1 ? ` · photo ${pvIndex + 1} of ${pvPhotos.length}` : ''}</b>}
            {pvPhotos.length > 1 && <small>Swipe for the other photos of {pv === 0 ? 'it' : 'this level'}</small>}
            {!(pv === 0 && moveItem) && ((pv === 0 ? thing.photos : (levels[pv - 1] || {}).photos || []).length > 0) && (
              <button type="button" className="pv-rm" onClick={() => removePhoto(pv, pvIndex)}><TrashIcon />Remove this photo</button>)}
          </div>
          <div className="hint">Tap anywhere else to close</div>
        </div>)}
      {/* REQUIREMENTS_2026-09-27 R5 (kills F5): the pencil opens the chain sheet, not a 3-option
          Choice that reset the whole chain. One row per level — Replace and Remove only ever touch
          that row; the old 'change' Choice is gone for good (net sheet count: zero). */}
      {sheet === 'chain' && (
        <ChainSheet rows={(real.length || levels.length ? levels : links).map((l, i) => ({ key: l.key, idx: i, name: linkName(l), thumb: linkThumb(l), box: isBox(l) }))}
          onRename={chainRename} onReplace={chainReplace} onRemove={chainRemove}
          onMore={() => { setSheet(null); addLevel(); }}
          onPickList={() => setSheet('more')}
          onNoPlace={chainNoPlace}
          onCancel={() => setSheet(null)} />)}
      {sheet === 'chain-clear' && <Confirm title="Clear where it goes?" body="Every level you've photographed or picked so far goes." keepLabel="Keep it" actionLabel="Clear"
        onKeep={() => setSheet('chain')} onAction={chainClearConfirmed} />}
      {sheet === 'more' && <WhereList item={self} items={items} places={places} title={whereQ(name)}
        onCancel={() => setSheet(null)} onPick={(k) => { setSheet(null); pickKnown(k); }}
        onPhotograph={() => { setSheet(null); if (sel === 0 || filled(selLevel)) addLevel(); }} />}
      {/* R3: one rename sheet serves both the thing (sheet === 'rename', nameOverride) and any WHERE
          level (sheet.levelRename, that level's userName only — R3.2: a name given here always wins
          over a late AI result). A collision "No" (R4.2) opens this pre-filled with its own message. */}
      {(sheet === 'rename' || (sheet && sheet.levelRename !== undefined)) && (
        <div className="sheet-back" onClick={() => setSheet(null)} role="presentation">
          <div className="sheet" role="dialog" aria-labelledby="lc-rn" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="lc-rn">{sheet !== 'rename' && sheet.msg ? sheet.msg : 'What is it called?'}</div>
            <input className="place-input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim() && !hasSecret(draft)) applyRename(); }} />
            {hasSecret(draft) && <PrivNote typedSecret />}
            <button className="btn-primary" disabled={!draft.trim() || hasSecret(draft)} onClick={applyRename}>Use this name</button>
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
