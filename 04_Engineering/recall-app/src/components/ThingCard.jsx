import { useEffect, useRef, useState } from 'react';
import { hasSecret } from '../lib/sensitive.js';
import { setPrepFrom, prevOf, changeLocation, saveChain, undoChain, renameItem, loadSnaps, removeSnap, setMainPhoto, setSnapCaption, setPlaceMainPhoto, removePlacePhoto, updateItem, softDeleteItem, setVisibility, isPrivate, logEvent, LOG_MAX, VISIBILITY_TOAST, roleOn, firstName, wantNames, watchNames, setHolds, placeNamed } from '../lib/db.js';
import { useHold } from '../lib/hold.js';
import { photoStamp, cap, inThe, theOrQuoted } from '../lib/format.js';
import { contentsOf, chainOf, outerPlace, inPhrase, isContainer, whereChain, movedOf, saidNow, wordsWhere, noteOf, whereSteps, usersOf, inferPrep } from '../lib/graph.js';
import InList from './InList.jsx';
import PrepPill from './PrepPill.jsx';
import { me } from '../lib/auth.js';
import { getPrefs } from '../lib/prefs.js';
import { own } from './PhotoCard.jsx';
import Confirm from './Confirm.jsx';
import ItemSheet from './ItemSheet.jsx';
import TidySheet from './TidySheet.jsx';
import PrivNote from './PrivNote.jsx';
import PhotoViewer from './PhotoViewer.jsx';
import { CameraIcon, TrashIcon, PencilIcon, LockIcon, PinIcon, PinWasIcon, ChevronLeftIcon, PeopleIcon, NoteIcon, TagIcon, BoxIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon, CornerDownRightIcon } from './Icons.jsx';

// ONE PAGE PER THING (Ravi 09-27, BOARD_2026-09-27_every-path.md §2; mockups/S11_fix_pages.jpg). Every tile — Home,
// In it, Find, Not put away — opens this page. It replaces the 09-16 card's Edit mode and bottom bar, and the 09-25
// "inside a box" view (a box's page shows what is in it; each opens its own page; Back returns).
//
//   Head    — chevron Back · the name (never wraps) · lock if private.
//   Photos  — every sighting at the current place, newest first (all of them with Show earlier places on); time
//             bottom-left (Settings → Show times on photos), trash top-right. What the AI saw goes UNDER the photo
//             ("In the photo: a cream knitted blanket"), never where the place goes (#22).
//   Where it is — the chain as photos (the tin, the closet shelf) and the words; Move it. Or, amber, No place yet
//             with Put it somewhere. Both open the camera with this thing already there, level 1 chosen.
//   In it   — only on a container (Ravi 09-27: "putting things in a pencil … is nonsensical"): what is in it, then
//             Put things in · Log something in.
//   The list — It holds things · Add a photo · Rename · Keep this private · Show earlier places · Remove old photos
//             · Remove. Nothing else: no Edit, no Move to the top, no second Done (#25, #26, #28).
//
// Roles (MU2·4/5) as before: Can help sees no Keep private and no Remove; Can see gets the photos, where it is and
// what is in it, and nothing to do.
export default function ThingCard({ item, items = [], places = [], onBack, onAdd, onRemoved, onToast, showAddedBy = true, peopleCount = 0,
  onOpen = () => {}, onPutIn = () => {}, onMove = () => {}, onLogInto = () => {}, moveNote = null, onUndoMove = () => {}, onCloseNote = () => {} }) {
  const role = roleOn(item) || 'viewer';          // owner | editor | viewer
  const isOwner = role === 'owner', canEdit = role !== 'viewer';
  const [, bump] = useState(0);
  useEffect(() => { if (item) wantNames([item.owner, item.by]); return watchNames(() => bump((n) => n + 1)); }, [item?.id, item?.owner]); // eslint-disable-line
  const [tidying, setTidying] = useState(false);
  const [sheet, setSheet] = useState(false);       // press-and-hold on the photo
  const [snaps, setSnaps] = useState(null);        // every live snap, newest first; null = not loaded
  const [index, setIndex] = useState(0);           // centred page in the strip
  const [showEarlier, setShowEarlier] = useState(false); // per visit
  const [confirming, setConfirming] = useState(null); // 'item' | { snap } | 'holds'
  const [renaming, setRenaming] = useState(null);  // the draft name
  // D2/D3 (Ravi 09-28): the photo viewer — { kind: 'thing', start } | { kind: 'place', name, start, nonce } — and the
  // "What's in this photo?" sheet over it ({ index, draft }). Declared here with the others: this component returns early below.
  const [viewer, setViewer] = useState(null);
  const [capEdit, setCapEdit] = useState(null);
  const [whereOpen, setWhereOpen] = useState(false); // 10-03 (Tanya): the first level only; tap to see what it is in
  const [putting, setPutting] = useState(false); // 10-01: "Put it in a place or a box" — the one pick, from this page
  const stripRef = useRef(null);
  const showTimes = getPrefs().showTimes !== false; // Settings → Taking photos (09-27: it's for the whole app, #27)
  const hold = useHold(() => { logEvent('photo_hold', { itemId: item && item.id }); setSheet(true); });

  useEffect(() => { setSnaps(null); setIndex(0); setShowEarlier(false); setRenaming(null); setViewer(null); setCapEdit(null); }, [item?.id]); // eslint-disable-line
  useEffect(() => {
    if (!item || snaps !== null) return;
    let alive = true;
    loadSnaps(item.id).then((all) => { if (alive) { setSnaps(all); wantNames(all.map((s) => s.by)); } });
    return () => { alive = false; };
  }, [item?.id, snaps]); // eslint-disable-line
  const photoCount = item ? (item.photoCount || 1) : 0;
  useEffect(() => { setSnaps(null); }, [photoCount, item?.logId]); // a move writes a sighting and a new logId (09-16)

  if (!item) return null;

  // 09-30d (Ravi): a Move writes a "moved" copy of the cover at the new place (09-16) — that is not a photo taken then.
  // `shot` is when the cover photo was really TAKEN (what its time says); `at` stays the sort key for "this stay".
  const realShots = (snaps || []).filter((s) => !s.moved);
  const coverShot = Math.max(0, ...realShots.filter((s) => s.photo === item.photo).map((s) => s.at || 0)) || item.createdAt || item.lastSeenAt;
  const cover = { id: 'cover', photo: item.photo, thumb: item.thumb, location: item.location, at: item.lastSeenAt, shot: coverShot, cover: true, by: item.by || null };
  const shared = !isOwner || peopleCount > 0;
  const adder = (p) => (showAddedBy && shared && p.by && p.by !== item.owner ? firstName(p.by) : '');
  const live = (snaps || []);
  const here = (loc) => (loc || '').toLowerCase() === (item.location || '').toLowerCase();
  const coverSnap = live.find((s) => s.photo === item.photo) || null;
  const sightings = [...live.filter((s) => s.photo !== item.photo), { ...cover, by: coverSnap ? coverSnap.by || null : cover.by, at: Math.max(cover.at || 0, ...live.filter((s) => s.photo === item.photo).map((s) => s.at || 0)) }]
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  let stayLen = 0; while (stayLen < sightings.length && here(sightings[stayLen].location)) stayLen += 1;
  if (stayLen === 0) stayLen = 1;
  const stay = sightings.slice(0, stayLen);
  const earlierPhotos = sightings.length - stayLen;
  const earlierCount = new Set(sightings.slice(stayLen).map((s) => (s.location || '').toLowerCase())).size;
  const pages = showEarlier ? sightings : stay;
  const page = pages[Math.min(index, pages.length - 1)] || cover;
  const stayFull = stay.length >= LOG_MAX;
  // D3 (Ravi 09-28): what each photo shows. A photo's own caption; the cover, from before captions existed, falls back to
  // what the thing rests on (item.restingOn); any other photo with no caption says nothing.
  const capOf = (p) => (!p ? '' : p.cover ? ((coverSnap && coverSnap.caption) || item.restingOn || '') : (p.caption || ''));
  const pageCap = capOf(page);
  const dupCount = (() => { const seen = new Set(); let n = 0; sightings.forEach((s) => { const k = (s.location || '').toLowerCase(); if (seen.has(k)) n += 1; else seen.add(k); }); return n; })();

  function pageStep(el) { const a = el.children[0], b = el.children[1]; return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth; }
  function onScroll() {
    const el = stripRef.current; if (!el) return;
    const i = Math.max(0, Math.min(pages.length - 1, Math.round(el.scrollLeft / pageStep(el))));
    if (i !== index) setIndex(i);
  }
  function slideTo(i) { setIndex(i); const el = stripRef.current; if (el) el.scrollTo({ left: i * pageStep(el), behavior: 'smooth' }); }

  async function askRemove(p) {
    let all = snaps;
    if (all === null) { all = await loadSnaps(item.id); setSnaps(all); }
    setConfirming({ snap: p, last: all.length <= 1 });
  }
  async function removePhoto(snap) {
    setConfirming(null);
    const all = snaps || [];
    const target = snap.cover ? (all.find((s) => s.photo === item.photo) || null) : snap;
    if (!target) { setConfirming('item'); return; }
    const { undo } = await removeSnap(item, target, all);
    setSnaps(all.filter((s) => s.id !== target.id));
    setIndex(0);
    setViewer(null); // D2: closes the viewer so the Undo toast is not behind it
    logEvent('photo_removed', { itemId: item.id, snapId: target.id, wasCover: !!snap.cover });
    onToast && onToast('Photo removed', async () => { await undo(); setSnaps(null); logEvent('photo_restored', { itemId: item.id, snapId: target.id }); });
  }
  // D2: Make main — this photo becomes the one on the Home tile and the top of the page (display only; see db.setMainPhoto).
  async function makeMain(i) {
    const p = pages[i]; if (!p || p.cover) return;
    let all = snaps; if (all === null) { all = await loadSnaps(item.id); setSnaps(all); }
    const target = all.find((s) => s.id === p.id); if (!target) return;
    await setMainPhoto(item, target, coverSnap);
    logEvent('main_photo', { itemId: item.id, snapId: target.id, via: 'viewer' });
  }
  async function makePlaceMain(place, i) {
    await setPlaceMainPhoto(place, i);
    logEvent('main_photo', { place: place.name, via: 'viewer' });
    setViewer((v) => (v ? { ...v, start: 0, nonce: (v.nonce || 0) + 1 } : v)); // the chosen one is first now: open on it
  }
  // D3: the "What's in this photo?" sheet's Save. The main photo's caption is also what the thing rests on (item.restingOn).
  async function saveCaption() {
    const v = (capEdit.draft || '').trim();
    if (hasSecret(v)) return;
    const p = pages[capEdit.index]; setCapEdit(null);
    if (!p) return;
    let all = snaps; if (all === null) { all = await loadSnaps(item.id); setSnaps(all); }
    const snap = p.cover ? all.find((s) => s.photo === item.photo) : all.find((s) => s.id === p.id);
    if (snap) { const ok = await setSnapCaption(snap, v); if (ok) setSnaps(all.map((s) => (s.id === snap.id ? { ...s, caption: v } : s))); }
    if (p.cover) await updateItem(item.id, { restingOn: v });
    logEvent('correction', { itemId: item.id, field: 'caption', via: 'viewer' });
  }
  async function tidy(kind) {
    setTidying(false);
    let all = snaps; if (all === null) { all = await loadSnaps(item.id); setSnaps(all); }
    const bySnap = (s) => all.find((x) => x.photo === s.photo) || null;
    let victims;
    if (kind === 'newest') { const seen = new Set(); victims = sightings.filter((s) => { const k = (s.location || '').toLowerCase(); if (seen.has(k)) return true; seen.add(k); return false; }); }
    else victims = sightings.slice(stayLen);
    const targets = victims.map(bySnap).filter(Boolean);
    if (!targets.length) return;
    const undos = [];
    let remaining = all;
    for (const t of targets) { const { undo } = await removeSnap(item, t, remaining); undos.push(undo); remaining = remaining.filter((s) => s.id !== t.id); }
    setSnaps(remaining); setIndex(0);
    logEvent('tidy', { itemId: item.id, kind, removed: targets.length });
    onToast && onToast(`Deleted · ${targets.length} old photo${targets.length === 1 ? '' : 's'}`, async () => { for (const u of undos.reverse()) await u(); setSnaps(null); logEvent('tidy_undone', { itemId: item.id, kind }); });
  }
  async function togglePrivate(via) {
    const to = isPrivate(item) ? 'household' : 'private';
    await setVisibility(item, to); logEvent('visibility', { itemId: item.id, to, via });
    onToast && onToast(VISIBILITY_TOAST[to]);
  }
  function saveName() {
    const v = (renaming || '').trim();
    if (!v || hasSecret(v)) return;
    setRenaming(null);
    if (v !== item.name) { renameItem(item, v); logEvent('correction', { itemId: item.id, field: 'name', via: 'page' }); }
  }

  const label = item.name ? `your ${own(item.name)}` : 'this';
  const short = own(item.name) || 'it';
  // Where it is: the boxes it is in (outward), then the place at the end.
  const chain = chainOf(item);
  const outer = outerPlace(item);
  const placePic = (n) => { const p = placeNamed(n, places); return p && p.photos && p.photos.length ? p.photos[0].thumb : null; };
  const hasPlace = chain.length > 0 || !!item.location;
  // 10-01 (Tanya): her own words for where it is — shown as she said them, dated, with who said them.
  // 10-02 (one where): with no place, her older words are its where; anything she adds on the camera is a note
  const said = hasPlace ? saidNow(item) : wordsWhere(item);
  const saidBy = said.by && said.by !== me() ? `${firstName(said.by) || 'Someone'} said` : 'You said';
  const note = noteOf(item, hasPlace);
  const noteBy = note.by && note.by !== me() ? firstName(note.by) || 'Someone' : 'You';
  async function putIt(k) {
    setPutting(false);
    const r = await saveChain([{ known: k.t === 'thing' ? { t: 'thing', item: k.item } : { t: 'place', name: k.name } }], { owner: item.owner || me(), places });
    if (!r.first) return;
    // her words stay — they were about this same spot; the In is new information next to them
    const prev = prevOf(item);
    const ok = await changeLocation(item, r.first.text, 'chosen', r.first.dest, { said: said.said || undefined, saidAt: said.at, saidBy: said.by });
    const after = Date.now();
    logEvent('put_from_page', { itemId: item.id, t: k.t, isNew: !!k.isNew, ok });
    onToast && onToast(ok === false ? 'Not put there · it can’t go inside something that is inside it' : cap(inThe(r.first.text.replace(/^(the|my|our)\s+/i, ''))),
      ok === false || !isOwner ? undefined : async () => { const u = await undoChain({ itemId: item.id, isNew: false, prev: { ...prev, said: prev.said }, made: r.made, after }); logEvent('put_from_page_undo', { itemId: item.id, r: u }); if (u === 'stale') onToast && onToast('Not undone · it changed since'); });
  }
  // Q1 (Ravi 09-29, tier audit): every tier, boxes then places (Drawer 3 › Oak cabinet › Office). The squares scroll
  // sideways; the words show every tier at once, wrapping, one separator between tiers.
  const tiers = whereChain(item);
  // 10-03: each level with its little word ("on the Lab desk, which is in the Craft room"); a tap changes only the word
  const steps = whereSteps(item);
  const prepPill = (k) => {
    const st = steps[k]; if (!st || (!st.prep && k === 0)) return null;
    const label = k === 0 ? st.prep : st.prep ? `which is ${st.prep}` : 'which is';
    const prevSt = k > 0 ? steps[k - 1] : null;
    const n = prevSt ? usersOf(prevSt).length : 0;
    const note = prevSt && n > 1 ? `For everything ${inferPrep(prevSt.name) || 'in'} ${theOrQuoted(prevSt.name)} · ${n} items` : '';
    return <PrepPill label={label} value={st.prep} options={st.options} note={note} disabled={!canEdit || !st.edge}
      onPick={async (w) => {
        const before = (st.edge && st.edge.prep) || null; const from = st.fromId;
        await setPrepFrom(from, w); bump((x) => x + 1);
        logEvent('prep_pick', { itemId: item.id, level: k + 1, word: w });
        const what = k === 0 ? `Now “${w} ${theOrQuoted(st.name)}”` : `${cap(theOrQuoted(prevSt.name))} is now ${w} ${theOrQuoted(st.name)}`;
        onToast && onToast(what, async () => { await setPrepFrom(from, before); bump((x) => x + 1); });
      }} />;
  };
  const tierName = (t, i) => (t.t === 'thing' ? (i === 0 ? inPhrase(t.item) : inPhrase(t.item).replace(/^In /, 'in ')) : t.name);
  const whereB = tiers.length ? tierName(tiers[0], 0) : item.location;
  // 09-29h (Ravi: "Keep it consistent!!!"): every tier in words with the same "in" pill as the camera and the squares —
  // "White cardboard box (in) Ikea shelving unit (in) Office" — so the line under it is just when it was seen.
  const chainWords = tiers.map((t) => (t.t === 'thing' ? cap(t.item.name) : t.name));
  // 09-30d (Ravi): "seen" only when a photo of it was taken; a Move nobody photographed says "moved", and when it was
  // last seen. Moving its box (or the counter it's on) moves it too: "moved with the White cardboard box".
  const when = (t) => photoStamp(t).replace(/^Today/, 'today').replace(/^Yesterday/, 'yesterday');
  const seenAt = item.photo ? Math.max(coverShot || 0, ...realShots.map((s) => s.at || 0)) : 0;
  const mv = movedOf(item);
  const whenLine = mv && mv.at > seenAt + 2000 ? `moved ${mv.via ? `with the ${mv.via} ` : ''}${when(mv.at)}${seenAt ? ` · last seen ${when(seenAt)}` : ''}`
    : seenAt ? `seen ${when(seenAt)}` : `logged ${when(item.createdAt || item.lastSeenAt)}`;
  const whereS = chain.length && tiers.length === chain.length ? 'Where the box is: not said yet' : snaps === null ? '\u00a0' : whenLine; // wait for its photos: never a wrong date first
  const container = isContainer(item);
  const inside = contentsOf(item);
  const placeDoc = viewer && viewer.kind === 'place' ? placeNamed(viewer.name, places) : null;

  return (
    <div className="screen thing-page">
      <div className="thing-head">
        <div className="row1">
          <button type="button" className="chev" aria-label="Back" onClick={onBack}><ChevronLeftIcon /></button>
          <div className="name">{cap(item.name) || 'This item'}</div>
          {isPrivate(item) && <span className="lk" aria-label="Private"><LockIcon /></span>}
        </div>
      </div>

      <div className="card thing">
        {!item.photo && (
          <div className="written-panel"><NoteIcon /><div><b>No photo of it yet</b><small>{photoStamp(item.lastSeenAt)}</small></div></div>
        )}
        {item.photo && <div className="photo-wrap">
          <div className={'strip' + (pages.length > 1 ? '' : ' one')} ref={stripRef} onScroll={onScroll}>
            {pages.map((p, pi) => {
              const was = !here(p.location) && p.location;
              return (
                <div className="strip-page" key={p.id}>
                  <div className="photo-box">
                    <img className="photo-full" src={p.photo} alt={item.name || ''} {...(canEdit ? hold.props() : {})} onClick={canEdit ? hold.tap(() => setViewer({ kind: 'thing', start: pi })) : () => setViewer({ kind: 'thing', start: pi })} />
                    {showTimes && <span className="stamp">{photoStamp(p.shot || p.at)}{adder(p) ? ` · ${adder(p)}` : ''}</span>}
                    {canEdit && <button type="button" className="photo-trash" aria-label="Remove this photo" onClick={() => askRemove(p)}><TrashIcon /></button>}
                  </div>
                  {was ? <div className="was"><PinWasIcon /><span>{p.location}</span></div> : null}
                </div>
              );
            })}
          </div>
        </div>}
        {item.photo && pages.length > 1 && (
          <div className="dotsrow">
            <div className="dots" aria-label={`Photo ${index + 1} of ${pages.length}`}>
              {pages.map((p, i) => <button type="button" key={p.id} className={'dot' + (i === index ? ' on' : '')} onClick={() => slideTo(i)} aria-label={`Photo ${i + 1}`} />)}
            </div>
            <span className="cnt">{Math.min(index, pages.length - 1) + 1} of {pages.length}</span>
          </div>
        )}
        {/* D1 + D3 (Ravi 09-28): under the strip, what the photo in view shows (left, may wrap) and the Add photo pill (right,
            centred on the caption's first line). The pill does exactly what the "Add a photo" row below does. */}
        {(pageCap || canEdit) && (
          <div className="d1-cap">
            {pageCap ? <div className="seen-line">In this photo: {pageCap}</div> : <span />}
            {canEdit && <button type="button" className="d1-pill" disabled={stayFull} aria-label={stayFull ? `Add photo · ${LOG_MAX} here already` : 'Add photo'} onClick={() => { setSnaps(null); onAdd(); }}><CameraIcon /><span>Add photo</span></button>}
          </div>
        )}
        {item.details && <div className="label-line"><TagIcon /><span>{item.details}</span></div>}
        {/* 10-02 (Ravi, one where): her words are a note about the item where it is — under the photo, never a second where */}
        {note.said ? <div className="tp-note">Note: “{note.said}” · {noteBy} · {photoStamp(note.at)}</div> : null}
      </div>

      {/* Where it is (#16, #22, #24): the chain as photos and the words; one way to change it, the camera. */}
      <section className="tp-blk" aria-labelledby="tp-where">
        <h2 id="tp-where">Where it is</h2>
        {!hasPlace && said.said ? (
          <div className="tp-said"><q>{said.said}</q><small>{saidBy} · {photoStamp(said.at)}</small></div>
        ) : hasPlace ? (
          <>
          {/* 10-03 (Tanya, BOARD_2026-10-03_usability-1 X1/X2): W3 — the first level with its photo and its little word; what
              that is in opens below it, each level with its photo, joined by "which is in" (T1–T3: tap a word to change it). */}
          <div className="tp-wone">
            {tiers[0] && tiers[0].t === 'thing' ? (tiers[0].item.thumb ? <img src={tiers[0].item.thumb} alt="" /> : <span className="no"><BoxIcon /></span>)
              : placePic(chainWords[0] || item.location) ? <button type="button" className="ph-open" aria-label={`Photos of ${chainWords[0] || item.location}`} onClick={() => setViewer({ kind: 'place', name: chainWords[0] || item.location, start: 0, nonce: 0 })}><img src={placePic(chainWords[0] || item.location)} alt="" /></button>
              : <span className="no"><PinIcon /></span>}
            <div className="tx">
              <span className="tp-l1">{steps[0] ? prepPill(0) : null}<b className="tp-wname">{chainWords[0] || whereB}</b></span>
              <small>{whereS}</small>
            </div>
          </div>
          {steps.length > 1 && (whereOpen ? (
            <div className="tp-path">
              {steps.slice(1).map((st, i) => (
                <div key={i + 1} className="tp-lv">
                  <div className="tp-conn">{prepPill(i + 1)}</div>
                  <div className="tp-lvr">
                    {st.t === 'thing' ? (st.item.thumb ? <img src={st.item.thumb} alt="" /> : <span className="no"><BoxIcon /></span>)
                      : placePic(st.name) ? <button type="button" className="ph-open" aria-label={`Photos of ${st.name}`} onClick={() => setViewer({ kind: 'place', name: st.name, start: 0, nonce: 0 })}><img src={placePic(st.name)} alt="" /></button>
                      : <span className="no"><PinIcon /></span>}
                    <b>{st.name}</b>
                  </div>
                </div>))}
              <button type="button" className="tp-exp" onClick={() => setWhereOpen(false)}><span>Show less</span><ChevronUpIcon /></button>
            </div>
          ) : (
            <button type="button" className="tp-exp" aria-expanded="false" onClick={() => { setWhereOpen(true); logEvent('where_expand', { itemId: item.id, levels: steps.length }); }}>
              <CornerDownRightIcon /><span>What {theOrQuoted(steps[0].name)} is in · {steps.length - 1} more</span><ChevronDownIcon /></button>))}
          </>
        ) : <div className="tp-wh none">
          <span className="no-pin"><PinIcon /></span>
          <div className="tx"><b>No place yet</b><small>Put it away so you can find it</small></div>
        </div>}
        {/* 09-30 (Ravi, 2C): the Move just made, said here — no card over the page, no timer, gone when you leave. */}
        {moveNote && (
          <div className="tp-moved" role="status">
            <div className="r1"><b>✓ {moveNote.stayed ? 'Saved just now' : moveNote.was ? 'Moved just now' : 'Put away just now'}</b><button type="button" className="x" aria-label="Close" onClick={onCloseNote}>✕</button></div>
            <div className="r2"><span>{moveNote.stayed ? moveNote.added : moveNote.was ? `Before: ${moveNote.was}` : ' '}</span>{moveNote.undo && <button type="button" className="u" onClick={() => onUndoMove(moveNote)}>Undo</button>}</div>
            {(moveNote.moving || []).map((m) => <div key={m} className="mv">{m}</div>)}
          </div>)}
        {canEdit && (hasPlace
          ? <button type="button" className="btn-secondary tp-btn" onClick={() => { logEvent('move_open', { itemId: item.id, via: 'page' }); onMove(item); }}><PinIcon /><span>Move it</span></button>
          : said.said ? <button type="button" className="btn-secondary tp-btn" onClick={() => { logEvent('move_open', { itemId: item.id, via: 'page', words: true }); onMove(item); }}><PinIcon /><span>Move it</span></button>
          : <button type="button" className="btn-secondary amber tp-btn" onClick={() => { logEvent('move_open', { itemId: item.id, via: 'page', first: true }); onMove(item); }}><PinIcon /><span>Put it somewhere</span></button>)}
      </section>

      {/* In it: only on a container (#12, Ravi 09-27). Each opens its own page; Back returns here. */}
      {container && (
        <section className="tp-blk" aria-labelledby="tp-in">
          <h2 id="tp-in">In the {short} · {inside.length}</h2>
          {inside.length === 0 ? <p className="tp-empty">Nothing in it yet.</p> : (
            <div className="tp-grid">
              {inside.slice(0, 12).map((x) => (
                <button type="button" key={x.id} onClick={() => onOpen(x)}>
                  {x.thumb ? <img src={x.thumb} alt="" /> : <span className="no"><NoteIcon /></span>}
                  <span>{cap(x.name) || 'No name yet'}</span>
                </button>))}
            </div>)}
          {inside.length > 12 && <p className="tp-empty">and {inside.length - 12} more · Find item finds them</p>}
          {canEdit && <div className="tp-two">
            <button type="button" className="btn-secondary tp-btn" onClick={() => { logEvent('put_in_open', { from: 'page', itemId: item.id }); onPutIn(item); }}><PlusIcon /><span>Put items in</span></button>
            <button type="button" className="btn-secondary tp-btn" onClick={() => { logEvent('log_into_open', { itemId: item.id }); onLogInto(item); }}><CameraIcon /><span>Log something in</span></button>
          </div>}
        </section>
      )}

      {/* One short list (#25–#28). */}
      <section className="tp-blk tp-rows" aria-label="More">
        {!isOwner && <div className="sw-row"><span className="lab"><PeopleIcon /> Shared by {firstName(item.owner) || 'someone'}</span></div>}
        {canEdit && (
          <div className="sw-row">
            <span className="lab"><BoxIcon /> It holds items</span>
            <button type="button" role="switch" aria-checked={container} className={'sw' + (container ? ' on' : '')} aria-label="It holds items"
              onClick={async () => {
                if (container && inside.length) { setConfirming('holds'); return; }
                const ok = await setHolds(item, !container);
                if (ok && !container) onToast && onToast(`The ${short} holds items now`);
              }} />
          </div>
        )}
        {canEdit && (
          <button type="button" className="tp-row" disabled={stayFull} onClick={() => { setSnaps(null); onAdd(); }}>
            <CameraIcon /><span>{stayFull ? `Add a photo · ${LOG_MAX} here already` : 'Add a photo'}</span></button>
        )}
        {canEdit && <button type="button" className="tp-row" onClick={() => setRenaming(item.name || '')}><PencilIcon /><span>Rename</span></button>}
        {isOwner && (
          <div className="sw-row">
            <span className="lab"><LockIcon /> Keep this private</span>
            <button type="button" role="switch" aria-checked={isPrivate(item)} className={'sw' + (isPrivate(item) ? ' on' : '')} aria-label="Keep this private" onClick={() => togglePrivate('switch')} />
          </div>
        )}
        {earlierCount > 0 && (
          <div className="sw-row">
            <span className="lab amber"><PinWasIcon /> Show earlier places <small>{earlierCount}</small></span>
            <button type="button" role="switch" aria-checked={showEarlier} className={'sw' + (showEarlier ? ' on' : '')} aria-label="Show earlier places"
              onClick={() => { const v = !showEarlier; setShowEarlier(v); setIndex(0); const el = stripRef.current; if (el) el.scrollTo({ left: 0 }); logEvent('show_earlier', { itemId: item.id, on: v, places: earlierCount, photos: earlierPhotos }); }} />
          </div>
        )}
        {canEdit && (earlierPhotos > 0 || dupCount > 0) && (
          <button type="button" className="tp-row amber" onClick={() => setTidying(true)}><TrashIcon /><span>Remove old photos…</span></button>
        )}
        {isOwner && <button type="button" className="tp-row red" onClick={() => setConfirming('item')}><TrashIcon /><span>Remove</span></button>}
      </section>

      {/* D2 (Ravi 09-28): the photo viewer — one for the thing's own photos, one for a place's. */}
      {viewer && viewer.kind === 'thing' && item.photo && pages.length > 0 && (
        <PhotoViewer photos={pages.map((p) => ({ key: p.id, src: p.photo, main: p.photo === item.photo }))} start={viewer.start}
          title={(i, n) => `Photo ${i + 1} of ${n}${showTimes && pages[i] ? ` · ${photoStamp(pages[i].shot || pages[i].at)}` : ''}`}
          caption={(i) => capOf(pages[i])}
          onEdit={canEdit && isOwner ? (i) => setCapEdit({ index: i, draft: capOf(pages[i]) }) : null}
          onMakeMain={canEdit ? makeMain : null} onRemove={canEdit ? (i) => askRemove(pages[i]) : null}
          onClose={() => setViewer(null)} />
      )}
      {viewer && viewer.kind === 'place' && placeDoc && (placeDoc.photos || []).length > 0 && (
        <PhotoViewer key={'pl' + (viewer.nonce || 0)} photos={placeDoc.photos.map((ph, j) => ({ key: `${ph.at}_${j}`, src: ph.photo || ph.thumb, main: j === 0 }))} start={viewer.start}
          title={(i, n) => `${placeDoc.name} · photo ${i + 1} of ${n}`}
          onMakeMain={isOwner ? (i) => makePlaceMain(placeDoc, i) : null} onRemove={isOwner ? (i) => setConfirming({ placePhoto: i, place: placeDoc }) : null}
          onClose={() => setViewer(null)} />
      )}
      {capEdit && (
        <div className="sheet-back" onClick={() => setCapEdit(null)} role="presentation">
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="tp-cap" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="tp-cap">What’s in this photo?</div>
            <input className="place-input" autoFocus value={capEdit.draft} onChange={(e) => setCapEdit({ ...capEdit, draft: e.target.value })} enterKeyHint="done" placeholder="on the orange carpet"
              onKeyDown={(e) => { if (e.key === 'Enter') saveCaption(); }} aria-label="What is in this photo" />
            {hasSecret(capEdit.draft) && <PrivNote typedSecret />}
            <button type="button" className="btn-primary" disabled={hasSecret(capEdit.draft)} onClick={saveCaption}>Save</button>
            <button type="button" className="btn-quiet" onClick={() => setCapEdit(null)}>Cancel</button>
          </div>
        </div>
      )}
      {renaming !== null && (
        <div className="sheet-back" onClick={() => setRenaming(null)} role="presentation">
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="tp-rn" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="tp-rn">What is it?</div>
            <input className="place-input" autoFocus value={renaming} onChange={(e) => setRenaming(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }} aria-label="Its name" />
            {hasSecret(renaming) && <PrivNote typedSecret />}
            <button type="button" className="btn-primary" disabled={!renaming.trim() || hasSecret(renaming)} onClick={saveName}>Save</button>
            <button type="button" className="btn-quiet" onClick={() => setRenaming(null)}>Cancel</button>
          </div>
        </div>
      )}
      {tidying && (
        <TidySheet name={item.name ? own(item.name) : 'this item'} dupCount={dupCount} earlierPlaces={earlierCount} earlierPhotos={earlierPhotos}
          onCancel={() => setTidying(false)} onKeepNewest={() => tidy('newest')} onForgetEarlier={() => tidy('earlier')} />
      )}
      {sheet && (
        <ItemSheet item={item} role={role} container={container} placed={hasPlace}
          onAdd={() => { setSheet(false); setSnaps(null); onAdd(); }}
          onMove={() => { setSheet(false); onMove(item); }}
          onPutIn={container ? () => { setSheet(false); onPutIn(item); } : null}
          onRemovePhoto={() => { setSheet(false); askRemove(page); }}
          onPrivate={isOwner ? () => { setSheet(false); togglePrivate('sheet'); } : null}
          onRemove={isOwner ? () => { setSheet(false); setConfirming('item'); } : null}
          onCancel={() => setSheet(false)} />
      )}
      {confirming === 'holds' && (
        <Confirm title={`The ${short} has ${inside.length} item${inside.length === 1 ? '' : 's'} in it.`}
          body={`Move ${inside.length === 1 ? 'it' : 'them'} somewhere else first: open ${inside.length === 1 ? 'it' : 'each one'} and tap Move it.`}
          keepLabel="OK" actionLabel="OK" onKeep={() => setConfirming(null)} onAction={() => setConfirming(null)} />
      )}
      {confirming && confirming.snap && (
        confirming.last ? (isOwner ? (
          <Confirm title={`This is the only photo of ${label}. Remove the item?`} image={confirming.snap.photo}
            body="It goes to ☰ menu → Deleted items, where it can be put back."
            keepLabel="Keep it" actionLabel="Remove item" onKeep={() => setConfirming(null)}
            onAction={async () => { setConfirming(null); await softDeleteItem(item); logEvent('item_removed', { itemId: item.id, itemName: item.name || null, via: 'last_photo' }); onRemoved(item); }} />
        ) : (
          <Confirm title={`This is the only photo of ${label}.`} image={confirming.snap.photo} body={`Only ${firstName(item.owner) || 'the owner'} can remove the item itself.`} keepLabel="OK" actionLabel="Keep it" onKeep={() => setConfirming(null)} onAction={() => setConfirming(null)} />
        )) : (
          <Confirm title="Remove this photo?" image={confirming.snap.photo}
            body={confirming.snap.cover ? 'The next photo becomes the one on the tile.' : 'The other photos stay.'}
            keepLabel="Keep it" actionLabel="Remove" onKeep={() => setConfirming(null)} onAction={() => removePhoto(confirming.snap)} />
        )
      )}
      {confirming && confirming.placePhoto !== undefined && (
        <Confirm title="Remove this photo?" image={confirming.place.photos[confirming.placePhoto] ? confirming.place.photos[confirming.placePhoto].thumb : undefined}
          body="The place keeps its name and its items." actionLabel="Remove" onKeep={() => setConfirming(null)}
          onAction={async () => {
            const { place, placePhoto: k } = confirming; setConfirming(null);
            await removePlacePhoto(place, k); logEvent('place_photo_removed', { via: 'viewer' });
            const left = (place.photos || []).length - 1;
            setViewer((v) => (left > 0 && v ? { ...v, start: Math.min(k, left - 1), nonce: (v.nonce || 0) + 1 } : null));
          }} />
      )}
      {confirming === 'item' && (
        <Confirm title={`Remove ${label} from My items?`}
          body={inside.length ? `Move the ${inside.length === 1 ? 'item' : `${inside.length} items`} in it first, or ${inside.length === 1 ? 'it loses its' : 'they lose their'} place. It goes to ☰ menu → Deleted items, where it can be put back.` : 'It goes to ☰ menu → Deleted items, where it can be put back.'}
          keepLabel="Keep it" actionLabel="Remove" onKeep={() => setConfirming(null)}
          onAction={async () => { setConfirming(null); await softDeleteItem(item); logEvent('item_removed', { itemId: item.id, itemName: item.name || null }); onRemoved(item); }} />
      )}
      {putting && <InList item={item} items={items} places={places} said={said.said} current={null} onPick={putIt} onCancel={() => setPutting(false)} />}
    </div>
  );
}
