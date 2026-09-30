import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { compressPhoto, compressPlacePhoto, shrink } from '../lib/img.js';
import { addItem, nameItem, resnapItem, changeLocation, findMatch, knownLocations, placeNamed, noteAlias, logEvent,
  applyVerdict, saveChain, PLACE_PHOTOS } from '../lib/db.js';
import { verdictOf, hasSecret } from '../lib/sensitive.js';
import { normName } from '../lib/names.js';
import { me } from '../lib/auth.js';
import { containers, holderOf, chainOf, openEdge, inPhrase, graph, wouldLoop, isContainer, placeOuter, placeWouldLoop } from '../lib/graph.js';
import { matchThings } from '../lib/speech.js';
import WhereList from './WhereList.jsx';
import PrivNote from './PrivNote.jsx';
import Choice from './Choice.jsx';
import Confirm from './Confirm.jsx';
import ChainSheet from './ChainSheet.jsx';
import { CameraIcon, CloseIcon, PinIcon, LockIcon, PencilIcon, SaveIcon, PinAskIcon, BoxIcon, PlusIcon, TrashIcon, ListIcon } from './Icons.jsx';

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
// 09-29 (Ravi): after the shutter photographs a place, ReCall looks at it and EVERYTHING waits — at most this long. Then it
// counts as not recognised and "Choose place" opens to name it (a late answer still shows there). Timings are logged.
export const RECOG_MS = 3000;
// 09-29 (Ravi): hold Save this long and the button turns into "Save + Next".
const HOLD_MS = 600;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const own = (s) => (s || '').toLowerCase().replace(/^(my|the|our)\s+/, '');
// "Where is the spoon?" / "Where are the car keys?" — a name that reads as plural gets "are".
const many = (s) => /[^su]s$/.test(own(s)) || /\b(glasses|scissors|pants|jeans|trousers|pliers|tongs)$/.test(own(s));
const whereQ = (s) => (own(s) ? `Where ${many(s) ? 'are' : 'is'} the ${own(s)}?` : 'Where is it?');
// 09-29 (Ravi): in the prompt the question's words and the thing's name are different colours; the name keeps its own
// capitals ("3D model of plant sensor", not "3d model…"), only a leading capital of an ordinary word is lowered.
const shownName = (s) => { const t = (s || '').replace(/^(my|the|our)\s+/i, ''); return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
const whereParts = (s) => (own(s) ? { pre: `Where ${many(s) ? 'are' : 'is'} the `, name: shownName(s), post: '?' } : null);
// Where a thing is right now, as a camera level's `known` (09-29): the box it's in, or its place by name.
const hereKnown = (it) => { if (!it) return null; const h = holderOf(it); return h ? { t: 'thing', item: h } : it.location ? { t: 'place', name: it.location } : null; };
const sameKnown = (a, b) => !!a && !!b && a.t === b.t && (a.t === 'thing' ? a.item.id === b.item.id : (a.name || '').toLowerCase() === (b.name || '').toLowerCase());
let KEY = 0;
// userName: a name given right at capture (R3) — always wins over the AI's late result, and never
// gets overwritten by one. collisionNo: the resolved name she last said "No, a new one" to (R4.2) —
// kept as the STRING, not a flag, so renaming to a DIFFERENT colliding name can ask again.
const emptyLevel = () => ({ key: ++KEY, photos: [], known: null, name: '', userName: '', moves: false, status: 'empty', ask: null, collisionNo: '' });
// 09-29h (Ravi, phone: "it does not remember the IKEA bookshelf"): the squares show the WHOLE chain that is already known —
// White cardboard box, then the Ikea shelving unit it's in, then the room that's in — so + always adds on top of it. Those
// outer squares are `inherited`: they say what's already saved. When the square inside them changes (another place picked,
// a new place photographed), they go, because they were about the old one; the new place's own known chain comes in.
const outerKnowns = (k) => {
  if (!k) return [];
  const conv = (x) => (x.t === 'thing' ? { t: 'thing', item: x.item } : { t: 'place', name: x.name });
  if (k.t === 'place') return placeOuter(k.name).map(conv);
  const bx = chainOf(k.item); const tail = bx.length ? bx[bx.length - 1] : k.item; const loc = (tail.location || '').trim();
  return [...bx.map((b) => ({ t: 'thing', item: b })), ...(loc ? [{ t: 'place', name: loc }, ...placeOuter(loc).map(conv)] : [])];
};
const tierKeyOf = (k) => (k.t === 'thing' ? 't:' + k.item.id : 'p:' + (k.name || '').toLowerCase());
function withTail(ls, idx) {
  if (ls[idx + 1] && !ls[idx + 1].inherited) return ls; // she already said what it is in: leave that to her (Q3 says it)
  const c = ls.slice(0, idx + 1);
  const k = c[idx] && c[idx].known; if (!k) return c;
  const seen = new Set(c.filter((x) => x.known).map((x) => tierKeyOf(x.known)));
  for (const o of outerKnowns(k)) { const key = tierKeyOf(o); if (seen.has(key) || c.length >= MAX_LEVELS) break; seen.add(key); c.push({ ...emptyLevel(), known: o, status: 'known', inherited: true }); }
  return c;
}

export default function LogCamera({ engine, items = [], places = [], owner = undefined, ownerName = '', look = 'b', preset = null, moveItem = null,
  onSaved, onCancel, onWrite, onNotice = () => {} }) {
  const videoRef = useRef(null); const streamRef = useRef(null);
  const [cam, setCam] = useState('starting');
  const [flash, setFlash] = useState(false);
  // level 0: the thing — { photos: [{photo, thumb, file}], tag, match, answer } ; levels 1..: where
  const [thing, setThing] = useState(() => (moveItem ? { photos: [], fixed: moveItem, tag: null, match: null, answer: null } : { photos: [], tag: undefined, match: null, answer: null }));
  // 09-29 (Ravi): Move it opens with where the thing IS NOW in level 1 — its photo in the amber square and
  // "Current place: White cardboard box" below — not a false "No place yet". Pick or photograph a new place and it is
  // replaced ("New place: …"); tap the current one again and it's back. Save with nothing changed moves nothing.
  const [levels, setLevels] = useState(() => {
    if (moveItem) { const k = hereKnown(moveItem); return k ? withTail([{ ...emptyLevel(), known: k, status: 'known', current: true }], 0) : [emptyLevel()]; }
    return preset ? withTail([{ ...emptyLevel(), known: preset, status: 'known' }], 0) : [];
  });
  const [sel, setSel] = useState(moveItem ? 1 : 0);
  const [nameOverride, setNameOverride] = useState('');
  const [shareAnyway, setShareAnyway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState(''); // fix 2026-09-29: a failed save says so (it used to blink and sit)
  const [sheet, setSheet] = useState(null);  // 'more' | 'change' | 'rename' | 'cancel' | { ask } | { preview: level index }
  const [pvIndex, setPvIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [lastWhere, setLastWhere] = useState(null); // + Next: the where of the thing saved a moment ago
  const [savedFlash, setSavedFlash] = useState(''); // 09-29: "Spare batteries ✓ saved", after Save + Next
  const [holdNext, setHoldNext] = useState(false);  // 09-29: Save held long enough → "Save + Next"
  const holdT = useRef(null); const holdLive = useRef(false);
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
  // fix 2026-09-29 (Ravi): moving a thing FROM a place — that place is not offered as a pill (it's where it already
  // is). It stays in the ••• list, marked "Current place".
  const hereNow = moveItem ? (() => { const h = holderOf(moveItem); return h ? { t: 'thing', id: h.id } : moveItem.location ? { t: 'place', name: moveItem.location.toLowerCase() } : null; })() : null;
  const isHereNow = (c) => !!hereNow && (hereNow.t === 'thing' ? c.known.t === 'thing' && c.known.item.id === hereNow.id : c.known.t === 'place' && c.known.name.toLowerCase() === hereNow.name);

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
    const identified = !cur.current && !cur.inherited && (!!cur.known || (!!cur.ask && !cur.no) || !!cur.userName); // 09-29: a shot on the current place photographs a NEW place (09-29h: or on a square that says what's already saved — if it IS that place, ReCall asks "Is this the …?")
    const firstOfLevel = !identified && cur.photos.length === 0;
    const next = identified
      ? { ...cur, photos: [...cur.photos, { ...s, file }] }
      : { ...cur, photos: [...cur.photos, { ...s, file }], known: null, current: false, inherited: false, ...(firstOfLevel ? { status: 'naming', name: '', ask: null, no: false, yes: false, collisionNo: '' } : {}) };
    setLevels((ls) => { const c = [...ls]; while (c.length <= i) c.push(emptyLevel()); c[i] = next; return identified ? c : withTail(c, i); });
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
    let r = null; const t0 = Date.now(); let settled = false;
    // 09-29 (Ravi): the wait is capped. Past RECOG_MS the level stops "looking" (not recognised) and Choose place opens.
    const timer = setTimeout(() => { if (settled || !mounted.current) return;
      setLevels((ls) => ls.map((l) => (l.key === key && l.status === 'naming' ? { ...l, status: 'named', timedOut: true } : l)));
      logEvent('camera_where_timeout', { ms: RECOG_MS }); }, RECOG_MS);
    try {
      const small = await Promise.all(cands.map((x) => shrink(x.c.thumb, 320)));
      r = await engine.whereIs(photo, cands.map((x, i) => ({ name: x.c.name, thumb: small[i] })), { thing: nameNow(), sensitivity: 'personal' });
    } catch (err) { console.error(err); }
    settled = true; clearTimeout(timer);
    if (!mounted.current) return;
    const hit = r && r.index >= 0 && r.sure ? cands[r.index].known : null;
    logEvent('camera_where_named', { named: !!(r && r.name), moves: !!(r && r.moves), known: !!hit, ms: Date.now() - t0, late: Date.now() - t0 > RECOG_MS });
    // REQUIREMENTS_2026-09-27 R3.2: a name she typed before the AI answered WINS — the late result
    // only ever fills `moves`/`ask`, never the name itself, once `userName` is set.
    // Q4 (Ravi 09-29): outside a place there are only places — a tier photographed there is a place even if the AI calls it
    // something that moves, and a box is never its match.
    setLevels((ls) => ls.map((l, j) => { if (l.key !== key) return l; const outP = placeBelow(ls, j);
      if (l.known) return l; // she chose a place while it was looking (after the time-out): her choice stands
      return { ...l, status: r ? 'named' : 'failed', name: l.userName ? l.name : ((r && r.name) || ''), moves: !outP && !!(r && r.moves), ask: outP && hit && hit.t === 'thing' ? null : (l.userName ? null : hit) }; }));
  }

  // ---- what the screen says
  const tag = thing.tag;
  const match = moveItem ? null : (thing.match && thing.answer !== 'no' ? thing.match : null);
  const name = moveItem ? cap(moveItem.name) : nameOverride || (match ? match.name : (tag && tag.name) || '');
  function nameNow() { return name; }
  const v = moveItem || !thing.photos.length || (tag === undefined && !nameOverride) ? null : verdictOf(tag || null, nameOverride);
  const dropPhoto = !!(v && v.secret);
  const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
  const WHY = { 'in the photo': 'The photo shows where it is.', 'usual place': 'Where it usually lives.', 'just used': 'Where the last item went.' };
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

  // 09-29 (tier audit T5/T6): what the selected tier may NOT be — a place or box already on this chain at another tier
  // ("Craft nook · Craft nook"), or one that would make a circle with the tier just inside it (Pantry shelf in Kitchen
  // counter in Pantry shelf). Hidden from the pills and the ••• list, and refused by pickKnown.
  const tierKey = (k) => (k.t === 'thing' ? 't:' + k.item.id : 'p:' + (k.name || '').toLowerCase());
  const levelKey = (l) => { const k = known(l); if (k) return tierKey(k); const n = (l.userName || l.name || '').toLowerCase(); return n ? (l.moves ? 'n:' : 'p:') + n : null; };
  // Q4: is the tier just inside level j a place (known, or new and not a box)?
  function placeBelow(ls, j) { const inner = j >= 1 ? ls[j - 1] : null; if (!inner || !(inner.photos.length || inner.known)) return false; const ik = inner.known || (inner.ask && !inner.no ? inner.ask : null); return ik ? ik.t === 'place' : !inner.moves; }
  function blockedAt(k, tier) {
    if (!k || tier < 1) return false;
    if (k.t === 'thing' && placeBelow(levels, tier - 1)) return true; // Q4 (Ravi 09-29): a box is never outside a place
    if (levels.some((l, j) => j !== tier - 1 && filled(l) && levelKey(l) === tierKey(k))) return true;
    const inner = tier >= 2 ? levels[tier - 2] : null;
    if (!inner || !filled(inner)) return false;
    const ik = known(inner);
    if (ik && ik.t === 'thing') return k.t === 'thing' ? wouldLoop(ik.item, k.item) : placeOuter(k.name).some((x) => x.t === 'thing' && x.item.id === ik.item.id);
    const pn = ik ? ik.name : (!inner.moves ? (inner.userName || inner.name) : '');
    return pn ? placeWouldLoop(pn, k.t === 'thing' ? { t: 'thing', item: k.item } : k) : false;
  }
  // Q3 (Ravi 09-29, "say it, don't ask"): a place or box on the chain that already has a where, given a DIFFERENT one by the
  // next tier, is moved — everything in it goes along. Said before Save ("Kitchen counter: Craft nook → Pantry shelf") and
  // again on the card; Undo puts it back.
  function whereNow(k) {
    if (!k) return '';
    if (k.t === 'place') { const o = placeOuter(k.name)[0]; return o ? (o.t === 'thing' ? cap(o.item.name) : o.name) : ''; }
    const h = holderOf(k.item); return h ? cap(h.name) : (k.item.location || '');
  }
  function changes() {
    const out = [];
    const fl = levels.filter(filled);
    fl.forEach((l, j) => {
      const k = known(l); const next = fl[j + 1];
      if (!k || !next) return;
      const was = whereNow(k); const now = linkName(next);
      if (was && now && was.toLowerCase() !== now.toLowerCase()) out.push(`${k.t === 'thing' ? cap(k.item.name) : k.name}: ${was} → ${now}`);
    });
    return out;
  }
  function sentence() {
    if (!links.length) return { l1: 'No place yet', l2: started ? 'Tap ＋ to add where it is' : '', none: true };
    const first = links[0];
    const n1 = linkName(first);
    const l1 = first.status === 'naming' && !first.userName ? 'Naming the place…' : isBox(first) ? inPhrase({ name: n1 }) : n1;
    const rest = links.slice(1).map(linkName);
    const lk = known(lastLink);
    if (lk && lk.t === 'thing') { const outer = chainOf(lk.item); rest.push(...outer.map((c) => cap(c.name))); const tail = outer.length ? outer[outer.length - 1] : lk.item; if (tail.location && !rest.includes(tail.location)) rest.push(tail.location); }
    // 09-29: a known PLACE at the end says where it is too, the same way a box does (Desk drawer · In air).
    else if (lk && lk.t === 'place') rest.push(...placeOuter(lk.name).map((x) => (x.t === 'thing' ? cap(x.item.name) : x.name)).filter((n) => !rest.includes(n)));
    const label = moveItem ? (first.current ? 'Current place' : 'New place') : ''; // 09-29 (Ravi)
    return { l1, l2: rest.length ? rest.join(' · ') : (first.why ? WHY[first.why] || first.why : ''), none: false, label };
  }
  const say = sentence();
  const moving = real.length ? changes() : [];

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
    // 09-29 (Ravi): tap the SELECTED square → that level's own sheet (its photos, Choose place, Rename, Remove this level).
    if (i > 0) { setSheet({ tier: i - 1 }); return; }
    if (thing.photos.length) { setSheet({ preview: 0 }); setPvIndex(thing.photos.length - 1); }
  }
  // fix 2026-09-28 (phone, B1): a pick KEEPS the photos already taken on that tier — they attach to the picked
  // place or box at save (R1/R2). It used to set photos: [], so shooting the white box and then tapping its pill
  // threw the photo away and the place stayed photo-less everywhere.
  function pickKnown(k, at = null) {
    const i = at !== null ? at : sel === 0 ? Math.max(0, levels.findIndex((l) => !filled(l))) : sel - 1;
    const target = at !== null ? at : sel === 0 && levels.findIndex((l) => !filled(l)) === -1 ? levels.length : i;
    if (k.t === 'thing' && self && (k.item.id === self.id || wouldLoop(self, k.item))) return;
    if (blockedAt(k, target + 1)) return;
    setLevels((ls) => { const c = [...ls]; while (c.length <= target) c.push(emptyLevel()); c[target] = { ...c[target], photos: c[target].photos || [], known: k, status: 'known', ask: null, no: false, yes: false, collisionNo: '', inherited: false, current: !!moveItem && target === 0 && sameKnown(k, hereKnown(moveItem)) }; return withTail(c, target); });
    setSel(target + 1);
    logEvent('camera_where_chip', { t: k.t, level: target + 1 });
  }
  // fix 2026-09-28 (phone): Yes on a recognition ask now converts the level exactly like a list pick;
  // the save gate saw ask-yes levels as still colliding and silently blocked Save. Same conversion as
  // pickKnown (known + status:'known', ask/collision state cleared) but — unlike a chip pick, which
  // targets an empty level — this level already has the photo(s) that triggered the ask, so they stay
  // (never wiped): one path, both ask kinds (visual sure-match and byName collision), places and boxes.
  function convertLevelToKnown(key, target) {
    setLevels((ls) => { const c = ls.map((l, j) => (l.key === key ? { ...l, known: target, status: 'known', ask: null, no: false, yes: false, collisionNo: '', inherited: false, current: !!moveItem && j === 0 && sameKnown(target, hereKnown(moveItem)) } : l)); const at = c.findIndex((l) => l.key === key); return at < 0 ? c : withTail(c, at); });
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
    setLevels((ls) => { const c = ls.filter((_, j) => j !== idx); return c[idx] && c[idx].inherited ? c.slice(0, idx) : c; }); // what was known about the removed square goes with it
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
    // 09-29: moving, but level 1 is still the current place (and nothing deeper) — nothing to move; close like Cancel.
    if (moveItem && levelsRef.current[0] && levelsRef.current[0].current && levelsRef.current.filter(filled).every((l) => l.current || (l.inherited && !l.photos.length))) { logEvent('camera_move', { itemId: moveItem.id, ok: true, unchanged: true }); onCancel(); return; }
    if (!moveItem && thing.match && !answer) { setSheet({ ask: thing.match, next }); return; }
    const match = !moveItem && thing.match && answer === 'yes' ? thing.match : null;
    const name = moveItem ? moveItem.name : nameOverride || (match ? match.name : (tag && tag.name) || '');
    const startPrivate = !!(v && v.private && mine && !shareAnyway && !match);
    setBusy(true); setSaveErr('');
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
          const placePhotos = l.photos.length ? await Promise.all(l.photos.slice(-PLACE_PHOTOS).map((p) => compressPlacePhoto(p.file))) : [];
          resolved.push({ known: k, placePhotos });
        } else {
          const finalName = l.userName || l.name || '';
          resolved.push({ photo: l.photos[0].photo, thumb: l.photos[0].thumb, extras: l.photos.slice(1).map((p) => ({ photo: p.photo, thumb: p.thumb })),
            placePhotos: l.moves ? null : await Promise.all(l.photos.slice(-PLACE_PHOTOS).map((p) => compressPlacePhoto(p.file))), name: finalName, moves: l.moves,
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
      const nudge = lastIsNewBox && !l2 ? `You haven't said where the ${linkName(lastReal)} is — its page can, any time.` : '';
      const chain = chainParts.map((p) => p.n); // 09-29h: the card says the chain the way the camera did, with "in" pills
      if (moveItem) {
        const prev = { location: moveItem.location || '', dest: openEdge(moveItem.id) ? openEdge(moveItem.id).to : null };
        // 09-29: tier 1 kept as the current place (only a deeper tier changed) — the thing itself did not move.
        const ok = location && !(use[0] && use[0].current) ? await changeLocation(moveItem, location, 'chosen', dest) : true;
        logEvent('camera_move', { itemId: moveItem.id, ok, depth: resolved.length });
        onSaved({ itemId: moveItem.id, where: location, name: cap(moveItem.name), thumbs, l1: say.l1, l2, chain, nudge, none: say.none, moved: true, refused: ok === false, unnamed, moving,
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
      const card = { itemId, where: location, name: cap(name) || 'Saved', lock: startPrivate || (match && match.private), thumbs, l1: say.l1, l2, chain, nudge, none: say.none, unnamed, moving,
        undo: mine ? { itemId, isNew, prev, made } : null };
      if (next) {
        onSaved({ ...card, next: true });
        setSavedFlash(cap(name) || 'Item'); setTimeout(() => { if (mounted.current) setSavedFlash(''); }, 1500);
        setThing({ photos: [], tag: undefined, match: null, answer: null }); setLevels([]); setSel(0); setNameOverride(''); setShareAnyway(false); openedAt.current = Date.now(); tagP.current = null;
        setLastWhere(dest ? (dest.t === 'thing' ? { t: 'thing', item: { ...(graph().byId.get(dest.id) || {}), id: dest.id, name: dest.name, thumb: thumbs[1] || (graph().byId.get(dest.id) || {}).thumb } } : dest) : null);
        setBusy(false);
        return;
      }
      onSaved(card);
    } catch (err) {
      // fix 2026-09-29 (phone): never fail silently. Ravi's move "just sat there" — the write was refused by the rules
      // and nothing on screen said so. Say it, keep the photos, and let Save be tried again.
      console.error('camera save', err);
      const denied = /permission|insufficient/i.test(String(err && (err.code || err.message)));
      setSaveErr(denied ? 'Couldn’t save — this ReCall didn’t allow that change. Your photos are still here.' : 'Couldn’t save — check the connection and tap Save again. Your photos are still here.');
      logEvent('camera_save_failed', { code: String((err && err.code) || ''), move: !!moveItem });
      setBusy(false);
    }
  }
  function tryCancel() { if (thing.photos.length || real.some((l) => l.photos.length)) setSheet('cancel'); else onCancel(); }

  // ---- drawing
  const colour = LEVEL_COLOURS[Math.min(sel, LEVEL_COLOURS.length - 1)];
  const lvName = (i) => (i === 0 ? (cap(name) || 'the item') : linkName(levels[i - 1] || links[i - 1] || {}));
  const selLevel = sel > 0 ? levels[sel - 1] : null;
  // REQUIREMENTS_2026-09-27 R2.4 (kills the b-f dead end): a level that is already KNOWN (chip,
  // WhereList pick — typed-new or existing) but has no photo of its OWN yet gets its own prompt, so
  // the typed path can photograph right away instead of looking like a dead end.
  const prompt = !started ? { b: 'Photograph the item', s: 'Take as many photos of it as you like.' }
    : (moveItem && sel === 1 && selLevel && selLevel.current) ? { b: whereQ(name), parts: whereParts(name), s: 'Photograph the new place or what it is in. Or tap one.' }
    : (moveItem && sel === 1 && selLevel && selLevel.known && !selLevel.photos.length) ? { b: whereQ(name), parts: whereParts(name), s: 'Save to move it there, or photograph another place.' }
    : sel === 0 ? { b: `${cap(name) || 'The item'} · ${thing.photos.length} photo${thing.photos.length === 1 ? '' : 's'}`, s: 'Another photo of it, or tap ＋ to photograph where it goes.' }
    : !filled(selLevel) ? (moveItem && sel === 1 ? { b: whereQ(name), parts: whereParts(name), s: 'Photograph the place or what it is in. Or tap one.' }
      : sel === 1 ? { b: 'Where it goes', s: `Photograph what ${own(name) ? 'the ' + own(name) : 'it'} is in, or where it is. Or tap a place.` }
      : { b: whereQ(lvName(sel - 1)), parts: whereParts(lvName(sel - 1)), s: 'Photograph what it is in, or where it is. Or tap a place.' })
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
  // 09-29 (tier audit T4): a new place the AI couldn't name is saved as "A place" — and a second one merged into the
  // first (two different spots, one record, both photos). An unnamed level now meets the same gate as any name that's
  // already taken, but only when an "A place" already exists: the first one still saves unnamed (R3.3).
  const unnamedNew = (l) => filled(l) && !known(l) && !l.moves && l.status !== 'naming' && !(l.userName || l.name);
  const levelCollision = (l) => {
    if (known(l)) return null;
    const nm = resolvedLevelName(l) || (unnamedNew(l) ? 'A place' : '');
    return nm ? collisionFor(nm) : null;
  };
  // Q4: a name that is a BOX, on a tier outside a place, can't be "Yes, that one" (a place is never in a box) — it just
  // needs its own name, like any taken name.
  const boxOutsidePlace = (l, c) => !!c && c.t === 'thing' && placeBelow(levels, levels.findIndex((x) => x.key === l.key));
  // R4.4 (kills F7): at most one level ask at a time, in chain order — a visual sure-match ask
  // (already stored on the level as `ask`) takes priority over a same-name collision found here.
  const levelAsks = [];
  levels.forEach((l) => {
    if (l.ask && !l.no && !l.yes && l.status === 'named') { levelAsks.push({ l, target: l.ask, byName: false }); return; }
    if (!l.ask || l.no) {
      const col = levelCollision(l);
      if (col && !unnamedNew(l) && !boxOutsidePlace(l, col) && l.collisionNo !== resolvedLevelName(l)) levelAsks.push({ l, target: col, byName: true });
    }
  });
  const askLevel = levelAsks[0] || null;
  // R4.2: the Save gate — a level that is new AND still names something already saved can't be
  // saved as a second doc by accident. Scoped to that link only: removing/replacing it (R5), or
  // renaming it, or answering the ask, all clear the gate; nothing else about the save is blocked.
  const collidingLevel = levels.find((l) => levelCollision(l));
  // R4.2: the sentence explains the gate instead of showing its usual second line.
  if (collidingLevel) say.l2 = `'${resolvedLevelName(collidingLevel) || linkName(collidingLevel)}' needs its own name — tap it.`;
  function retake() { logEvent('privacy_retake', { via: 'camera' }); setThing({ photos: [], tag: undefined, match: null, answer: null }); setLevels([]); setSel(0); setNameOverride(''); setShareAnyway(false); tagP.current = null; }
  const privLine = started && !moveItem ? (
    <PrivNote v={v} mine={mine} ownerName={ownerName} isNew={!match} shared={shareAnyway}
      onShare={(x) => { setShareAnyway(x); logEvent('privacy_share', { to: x ? 'shared' : 'private', mode: 'camera' }); }}
      onRetake={retake} onDontSave={() => { logEvent('capture_leave', { reason: 'helper_private', via: 'camera' }); onCancel(); }} />) : null;
  const identity = !moveItem && thing.match && !thing.answer ? (
    <div className="lc-ask" role="group" aria-label="Is this the same item?">
      <b>Your {own(thing.match.name)}?</b>
      <div><button type="button" onClick={() => setThing((t) => ({ ...t, answer: 'yes' }))}>Yes</button>
        <button type="button" className="o" onClick={() => setThing((t) => ({ ...t, answer: 'no' }))}>No, a new item</button></div>
    </div>) : null;
  // ======================================================================================================================
  // 09-29 (Ravi, mockups MV_2026-09-29_*; DECISIONS 09-29 evening) — the camera card for multi-level places.
  //   Top band: the item's photo and the question (Move it: "Where is the Walgreens Photo brochure?"; Log item: "New item").
  //   The card: one short prompt · the PLACE squares only (the item is up in the band), "in" between, a plain white ＋ that
  //   only ADDS a level (shown once the last level is set) and "☰ Choose place" · "Place: …" in the selected level's colour
  //   · under a thin line, the chain "Desk drawer (in) In air (in) Office". No colour dot, no pin, no pills, no •••.
  //   A level is set by the shutter (ReCall looks — everything waits ≤ RECOG_MS — then "Is this the Desk drawer?" Yes /
  //   "No, ☰ Choose place") or by ☰ Choose place. Tap the selected square: its own sheet (photos, Choose place, Rename,
  //   Remove this level). Bottom: Cancel | shutter | Save; hold Save → "Save + Next" → "Spare batteries ✓ saved".
  // ======================================================================================================================
  const lvColour = (i) => LEVEL_COLOURS[Math.min(Math.max(i, 0), LEVEL_COLOURS.length - 1)];
  const recognising = levels.some((l) => l.status === 'naming' && !l.timedOut && !l.known);
  const locked = busy || recognising;
  // The where question ("Is this the Desk drawer?"): a sure visual match, or a place/box with the same name.
  const askIdx = askLevel ? levels.findIndex((l) => l.key === askLevel.l.key) : -1;
  const askTarget = askLevel ? askLevel.target : null;
  const askName = askTarget ? (askTarget.t === 'thing' ? own(askTarget.item.name) : askTarget.name) : '';
  const askPic = askTarget ? (askTarget.t === 'thing' ? askTarget.item.thumb : placePic(askTarget.name)) : null;
  const askMine = askLevel ? linkThumb(askLevel.l) : null;
  function askNo() {
    if (!askLevel) return;
    const l = askLevel.l; const idx = askIdx;
    if (askLevel.byName) setLevels((ls) => ls.map((x) => (x.key === l.key ? { ...x, collisionNo: resolvedLevelName(l), prompted: true } : x)));
    else setLevels((ls) => ls.map((x) => (x.key === l.key ? { ...x, no: true, prompted: true } : x)));
    setSel(idx + 1); setSheet({ choose: idx, withPhoto: true });
    logEvent('camera_where_collision', { answer: 'no', byName: !!askLevel.byName });
  }
  // R4.4/F7: one question at a time — the item's own "Your X?" goes first, the place question waits for it.
  const whereAsk = askLevel && !identity && !(sheet && sheet.choose !== undefined) ? (
    <div className="lc-ask lc-ask2" role="group" aria-label="Is this the one you have?">
      <div className="pair">
        {askMine ? <img src={askMine} alt="" style={{ borderColor: lvColour(askIdx + 1) }} /> : null}
        <span className="eq">=</span>
        {askPic ? <img src={askPic} alt="" className="theirs" /> : <span className="theirs no">{askTarget.t === 'thing' ? <BoxIcon /> : <PinIcon />}</span>}
        <b>Is this the {askName}?</b>
      </div>
      <div><button type="button" onClick={() => { convertLevelToKnown(askLevel.l.key, askLevel.target); setSel(askIdx + 1); logEvent('camera_where_collision', { answer: 'yes', byName: !!askLevel.byName }); }}>Yes</button>
        <button type="button" className="o" onClick={askNo}>No, <ListIcon /> Choose place</button></div>
    </div>) : null;

  // A new place ReCall couldn't place (not recognised, or timed out) — the Choose place sheet opens on its own, once.
  useEffect(() => {
    if (sheet || busy || identity) return;
    const idx = levels.findIndex((l) => l.status !== 'naming' && l.status !== 'empty' && l.status !== 'known' && !l.prompted && !l.known && !l.userName
      && l.photos.length > 0 && !(l.ask && !l.no) && !levelCollision(l));
    if (idx < 0) return;
    setLevels((ls) => ls.map((l, j) => (j === idx ? { ...l, prompted: true } : l)));
    setSel(idx + 1); setSheet({ choose: idx, withPhoto: true });
    logEvent('camera_choose_open', { why: levels[idx].timedOut ? 'timeout' : 'not_recognised', level: idx + 1 });
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function useName(idx, n) {
    setLevels((ls) => ls.map((l, j) => (j === idx ? { ...l, userName: n, status: l.status === 'naming' ? 'named' : l.status, no: true, prompted: true } : l)));
    setSheet(null); logEvent('camera_level_rename', { level: idx + 1, via: 'choose' });
  }
  function takenMsg(n) {
    const c = collisionFor(n);
    return c ? `You already have ${c.t === 'thing' ? 'a' : 'a place called'} “${c.t === 'thing' ? cap(c.item.name) : c.name}” — pick it below, or give this one its own name.` : '';
  }

  // The squares: places only (levels 1..n), "in" between; ＋ adds a level once the last one is set.
  const shownLevels = real.length || levels.length ? levels : (links.length && !moveItem ? links : []); // before any level: the suggestion stands in level 1
  const plusOk = started && lastFilled && levels.length < MAX_LEVELS && !locked;
  const sq = (l, j) => {
    const i = j + 1; const c = lvColour(i); const on = i === sel && l.key !== 'sugg'; const empty = !filled(l); const th = linkThumb(l);
    const looking = l.status === 'naming' && !l.timedOut && !l.known;
    return (
      <div className="lv-s" key={'l' + l.key}>
        {j > 0 && <span className="lc-in">in</span>}
        <div className="lv-tile">
          <button type="button" className={'lv-sq' + (on ? ' sel' : '') + (empty ? ' empty' : '') + (l.key === 'sugg' ? ' sugg' : '')} disabled={locked && !on}
            style={on || empty || l.key === 'sugg' ? { borderColor: c, color: c } : undefined}
            aria-label={`Level ${i}: ${empty ? 'not defined' : linkName(l)}`} aria-pressed={on}
            onClick={() => (l.key === 'sugg' ? pickKnown(l.known) : tapLevel(i))}>
            {th ? <img src={th} alt="" /> : isBox(l) && !empty ? <BoxIcon /> : <PinIcon />}
            {l.photos && l.photos.length > 1 && <span className="lv-n">{l.photos.length}</span>}
            {looking && <span className="lv-look" aria-label="Looking at the photo"><i /></span>}
          </button>
        </div>
      </div>);
  };
  // What the selected square is about, in words: "Place: …" in its colour (09-29, Ravi: no pin, no Current/New label).
  const focusIdx = sel > 0 ? sel - 1 : 0;
  const focus = sel > 0 ? levels[focusIdx] : shownLevels[0];
  const focusColour = lvColour(focusIdx + 1);
  const focusLooking = focus && focus.status === 'naming' && !focus.timedOut && !focus.known;
  const placeLine = !started ? null : focusLooking ? { look: true }
    : { name: focus && filled(focus) ? (isBox(focus) ? inPhrase({ name: linkName(focus) }) : linkName(focus)) : 'not defined', empty: !(focus && filled(focus)) };
  // The chain, under a thin line: every level set so far, then what the outermost is already known to be in (grey).
  const chainParts = (() => {
    const out = shownLevels.map((l, j) => ({ n: !filled(l) ? '?' : l.status === 'naming' && !l.userName && !known(l) ? '…' : linkName(l), c: lvColour(j + 1) }));
    const lk = known(lastLink || {});
    if (lastLink && filled(lastLink) && lk) {
      const outer = lk.t === 'thing' ? [...chainOf(lk.item).map((x) => cap(x.name)), (() => { const ch = chainOf(lk.item); const tail = ch.length ? ch[ch.length - 1] : lk.item; return tail.location || ''; })()].filter(Boolean)
        : placeOuter(lk.name).map((x) => (x.t === 'thing' ? cap(x.item.name) : x.name));
      outer.forEach((n) => { if (!out.some((o) => o.n === n)) out.push({ n, c: '#BDB6AB', soft: true }); });
    }
    return out;
  })();
  // The prompt: one short line about the selected square (09-29: no dot; never "Save, or…"; the ＋ drawn as the button's).
  // "the Desk drawer", but "this place" / "this box" while it has no name yet (never "the a place").
  const theOf = (l) => (!known(l) && !l.userName && !l.name ? (l.moves ? 'this box' : 'this place') : 'the ' + own(linkName(l)));
  const plusGlyph = <span className="lc-plus-in" aria-label="plus"><PlusIcon /></span>;
  const promptLine = !started ? null
    : sel === 0 ? (thing.photos.length ? (shownLevels.length && filled(shownLevels[0]) ? <>Another photo of it, or tap {plusGlyph} to add what {theOf(shownLevels[shownLevels.length - 1])} is in.</> : <>Another photo of it, or tap {plusGlyph} to add where it is.</>) : null)
    : focusLooking ? null
    : !filled(focus) ? (focusIdx === 0 ? (moveItem ? <>Moved it? Photograph the new place, or choose one.</> : <>Where is it? Photograph the place, or choose one.</>)
      : <>What is {theOf(levels[focusIdx - 1])} in? Photograph it, or choose one.</>)
    : (moveItem && focusIdx === 0 && focus.current) ? <>Moved it? Photograph the new place, or choose one.</>
    : focusIdx + 1 >= MAX_LEVELS ? null
    : <>Tap {plusGlyph} to add what {theOf(focus)} is in.</>;
  const chooseAt = sel > 0 ? sel - 1 : Math.max(0, levels.findIndex((l) => !filled(l)) === -1 ? levels.length : levels.findIndex((l) => !filled(l)));
  const openChoose = () => { if (locked) return; if (chooseAt >= levels.length) { setLevels((ls) => [...ls, emptyLevel()]); } setSel(chooseAt + 1); setSheet({ choose: chooseAt, withPhoto: false }); logEvent('camera_choose_open', { why: 'button', level: chooseAt + 1 }); };

  // the strip keeps the selected square (and ＋ right after it's added) in view; the fade shows only when more is off to the right
  const stripRef = useRef(null);
  const [stripMore, setStripMore] = useState(false);
  useLayoutEffect(() => {
    const el = stripRef.current; if (!el) return;
    const on = el.querySelector('.lv-sq.sel'); const pl = el.querySelector('.lv-sq.plus');
    const want = [on, sel === levels.length && pl ? pl : null].filter(Boolean);
    const box = el.getBoundingClientRect();
    want.forEach((t) => { const r = t.getBoundingClientRect(); if (r.right > box.right - 2) el.scrollLeft += r.right - box.right + 4; else if (r.left < box.left + 2) el.scrollLeft -= box.left - r.left + 4; });
    const more = el.scrollWidth - el.clientWidth - el.scrollLeft > 2; if (more !== stripMore) setStripMore(more);
  });
  const onStripScroll = (e) => { const el = e.currentTarget; const more = el.scrollWidth - el.clientWidth - el.scrollLeft > 2; if (more !== stripMore) setStripMore(more); };

  // Save: a tap saves; held HOLD_MS it becomes "Save + Next" (let go = save and log the next item); slide off = nothing.
  const canNext = started && !moveItem;
  const saveOff = locked || (moveItem && !real.length) || !!collidingLevel;
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
    if (!inside) return; // slid off: nothing
    save(next);
  };
  const holdCancel = () => { holdLive.current = false; clearTimeout(holdT.current); setHoldNext(false); };

  const pv = sheet && sheet.preview !== undefined ? sheet.preview : null;
  const pvPhotos = (pv === null ? [] : pv === 0 ? (moveItem ? [{ photo: moveItem.photo || moveItem.thumb }] : thing.photos) : (() => { const l = levels[pv - 1] || {}; return l.photos && l.photos.length ? l.photos : (known(l) ? [{ photo: linkThumb(l) }] : []); })())
    .filter((p) => p && p.photo); // an item or box with no photo has nothing to show
  const tierIdx = sheet && sheet.tier !== undefined ? sheet.tier : null;
  const tierL = tierIdx !== null ? levels[tierIdx] : null;
  const chooseIdx = sheet && sheet.choose !== undefined ? sheet.choose : null;
  const chooseL = chooseIdx !== null ? levels[chooseIdx] : null;
  const bandThumb = moveItem ? moveItem.thumb : thing.photos[0] && thing.photos[0].thumb;

  return (
    <div className={'lc lc-b'} role="dialog" aria-modal="true" aria-label="Log item">
      <div className="lc-top lc-band">
        {started && bandThumb ? (
          <button type="button" className={'lc-thing' + (!moveItem && sel === 0 ? ' sel' : '')} aria-label={moveItem ? 'The item’s photo' : sel === 0 ? 'The item: tap to see its photos' : 'The item: tap to take another photo of it'}
            onClick={() => { if (moveItem || sel === 0) { setSheet({ preview: 0 }); setPvIndex(0); } else setSel(0); }} disabled={locked}>
            <img src={bandThumb} alt="" />{!moveItem && thing.photos.length > 1 && <span className="lv-n">{thing.photos.length}</span>}{startPrivate && <span className="lc-lk"><LockIcon /></span>}
          </button>) : null}
        <div className="lc-title">
          <small>{ownerName ? <span className="lc-whose">{ownerName}’s ReCall</span> : null}{moveItem ? 'Where is the' : 'New item'}</small>
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
        {/* before the first photo the band already says "New item · Photograph it" — no second prompt over the picture */}
        {/* Type it instead: inside the picture, before the first photo (Ravi 09-27). */}
        {!started && onWrite && <div className="lc-typeit"><button type="button" onClick={onWrite}><PencilIcon />Type it instead</button></div>}
        {savedFlash && <div className="lc-saved" role="status">{savedFlash} <span className="ok">✓ saved</span></div>}
        {started && (
          <div className="lc-card">
            {identity}
            {whereAsk || (<>
              {promptLine && <div className="lc-prompt">{promptLine}</div>}
              <div className="lc-row2">
                <div ref={stripRef} onScroll={onStripScroll} className={'lv-strip' + (stripMore ? ' more' : '')}>
                  {shownLevels.map((l, j) => sq(l, j))}
                  {plusOk && <div className="lv-s" key="plus"><div className="lv-tile"><button type="button" className="lv-sq plus" aria-label="Add a level: what it is in" onClick={addLevel}><PlusIcon /></button></div></div>}
                </div>
                <button type="button" className="lc-choose" disabled={locked} onClick={openChoose}><ListIcon />Choose place</button>
              </div>
              {placeLine && (
                <div className="lc-say">
                  <span className="tx">
                    {placeLine.look ? <b className="lc-look">Looking at the photo…</b>
                      : <b><span className="lab" style={{ color: focusColour }}>Place:</span> <span className={placeLine.empty ? 'nd' : ''}>{placeLine.name}</span></b>}
                    {collidingLevel && <span className="soft">{`'${resolvedLevelName(collidingLevel) || linkName(collidingLevel)}' needs its own name — tap it.`}</span>}
                    {moving.map((m) => <span key={m} className="soft lc-move">{m}</span>)}
                  </span>
                </div>)}
              {chainParts.length >= 2 && (
                <div className="lc-chainline" aria-label={'Where: ' + chainParts.map((p) => p.n).join(' in ')}>
                  {chainParts.map((p, j) => <span key={j} className="cp">{j > 0 && <span className="lc-in">in</span>}<span style={{ color: p.c }} className={p.soft ? 'soft' : ''}>{p.n}</span></span>)}
                </div>)}
            </>)}
            {privLine}
          </div>)}
      </div>
      <div className="lc-bot">
        {saveErr && <div className="lc-err" role="alert">{saveErr}</div>}
        <div className="lc-row">
          <button type="button" className="lc-x" onClick={tryCancel}><CloseIcon /><span>Cancel</span></button>
          <button type="button" className="lc-shutter" style={{ borderColor: sel === 0 ? '#fff' : lvColour(sel) }} aria-label="Take a photo" disabled={cam !== 'live' || locked} onClick={snap}><span /></button>
          {started ? <button type="button" className={'lc-k sv' + (holdNext ? ' next' : '')} disabled={saveOff}
            aria-label={canNext ? 'Save (hold for Save + Next)' : 'Save'}
            onPointerDown={holdStart} onPointerUp={holdEnd} onPointerCancel={holdCancel} onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => { if (e.detail === 0 && !saveOff) save(false); }}>
            {holdNext ? 'Save + Next' : <><SaveIcon />{busy ? 'Saving…' : 'Save'}</>}</button> : <span />}
        </div>
      </div>

      {pv !== null && pvPhotos.length > 0 && (
        <div className="lc-pv" role="dialog" aria-label={lvName(pv)} onClick={() => setSheet(null)}>
          <div className="box" style={{ borderColor: lvColour(pv) }} onClick={(e) => e.stopPropagation()}>
            <div className="pv-strip" onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== pvIndex) setPvIndex(i); }}
              ref={(el) => { if (el && el.dataset.init !== String(pv)) { el.dataset.init = String(pv); el.scrollLeft = pvIndex * el.clientWidth; } }}>
              {pvPhotos.map((p, j) => <img key={j} src={p.photo} alt="" />)}
            </div>
            {pvPhotos.length > 1 && <div className="pv-dots">{pvPhotos.map((_, j) => <i key={j} className={j === pvIndex ? 'on' : ''} />)}</div>}
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
      {/* Tap the selected square: what you can do with THIS level (09-29 mockup "tap a selected square"). */}
      {tierL && (
        <div className="sheet-back" onClick={() => setSheet(null)} role="presentation">
          <div className="sheet tier-sheet" role="dialog" aria-modal="true" aria-label={linkName(tierL)} onClick={(e) => e.stopPropagation()}>
            <div className="ts-head">{linkThumb(tierL) ? <img src={linkThumb(tierL)} alt="" style={{ borderColor: lvColour(tierIdx + 1) }} /> : <span className="no" style={{ borderColor: lvColour(tierIdx + 1) }}><PinIcon /></span>}
              <span><b>{filled(tierL) ? linkName(tierL) : 'Not defined'}</b><small>{tierL.photos.length ? `${tierL.photos.length} photo${tierL.photos.length === 1 ? '' : 's'} taken now` : 'no photo taken now'}{tierIdx > 0 ? ` · where ${theOf(levels[tierIdx - 1])} is` : ''}</small></span></div>
            {(tierL.photos.length > 0 || linkThumb(tierL)) && <button type="button" className="sheet-row" onClick={() => { setSheet({ preview: tierIdx + 1 }); setPvIndex(0); }}>See its photos</button>}
            <button type="button" className="sheet-row" onClick={() => setSheet({ choose: tierIdx, withPhoto: false })}><ListIcon /> Choose place</button>
            {filled(tierL) && !known(tierL) && <button type="button" className="sheet-row" onClick={() => chainRename(tierIdx)}><PencilIcon /> Rename</button>}
            {/* an inherited square says what's already saved — change it with Choose place; removing it would say nothing */}
            {!tierL.inherited && <button type="button" className="sheet-row danger" onClick={() => chainRemove(tierIdx)}><TrashIcon /> Remove this level</button>}
            <button type="button" className="btn-quiet" onClick={() => setSheet(null)}>Close</button>
          </div>
        </div>)}
      {chooseL && (
        <WhereList item={self} items={items} places={places} chooser exclude={(k) => blockedAt(k, chooseIdx + 1)}
          pending={sheet.withPhoto && chooseL.photos.length && !chooseL.known ? { thumb: chooseL.photos[0].thumb, colour: lvColour(chooseIdx + 1), draft: cap(chooseL.userName || chooseL.name || ''), guessed: !!(chooseL.name && !chooseL.userName),
            taken: takenMsg, onUse: (n) => useName(chooseIdx, n) } : null}
          suggest={sheet.withPhoto && chooseL.ask && !chooseL.known ? { known: chooseL.ask, name: chooseL.ask.t === 'thing' ? own(chooseL.ask.item.name) : chooseL.ask.name, thumb: chooseL.ask.t === 'thing' ? chooseL.ask.item.thumb : placePic(chooseL.ask.name) } : null}
          onCancel={() => { setSheet(null); if (!filled(chooseL)) chainRemove(chooseIdx); }}
          onPick={(k) => { setSheet(null); pickKnown(k, chooseIdx); }}
          onPhotograph={() => setSheet(null)} />)}
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
          { label: 'Yes, the same item', onClick: () => { const n = sheet.next; setSheet(null); setThing((t) => ({ ...t, answer: 'yes' })); save(n, 'yes'); } },
          { label: 'No, a new item', onClick: () => { const n = sheet.next; setSheet(null); setThing((t) => ({ ...t, answer: 'no' })); save(n, 'no'); } },
          { label: 'Cancel', onClick: () => setSheet(null) }]} onCancel={() => setSheet(null)} />)}
      {sheet === 'cancel' && <Confirm title="Throw these photos away?" body="Nothing from this item is saved." keepLabel="Keep going" actionLabel="Throw away"
        onKeep={() => setSheet(null)} onAction={() => { logEvent('capture_leave', { reason: 'cancel', via: 'camera' }); onCancel(); }} />}
    </div>
  );
}
