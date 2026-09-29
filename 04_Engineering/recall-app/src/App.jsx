import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchUser, finishSignIn } from './lib/auth.js';
import { watchAll, restoreItem, updateItem, addSnapToLog, softDeleteItem, moveToTop, visibleHere, setVisibility, logEvent, LOG_MAX, VISIBILITY_TOAST, addPlacePhotos, placeNamed, PLACE_PHOTOS, adoptLegacy, upsertUser, isPrivate, repairPrivateFlags, repairPencilCabinet, repairPlaceParents, wantNames, watchNames, firstName, possessive, roleOn, putInto, changeLocation, setPromoted, undoChain, renameItem, renamePlace } from './lib/db.js';
import { me } from './lib/auth.js';
import { getPrefs, savePrefs, openingMode } from './lib/prefs.js';
import SeveralCamera from './components/SeveralCamera.jsx';
import SessionReview from './components/SessionReview.jsx';
import NoteCard from './components/NoteCard.jsx';
import PeopleScreen from './components/People.jsx';
import JoinScreen, { pendingJoin, parkJoin, clearJoin } from './components/Join.jsx';
import { THUMB_V, thumbFromPhoto, compressPhoto, compressPlacePhoto } from './lib/img.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import { setAIOwner } from './ai/providers/anthropic.js';
import Board from './components/Board.jsx';
import PhotoCard, { own } from './components/PhotoCard.jsx';
import ThingCard from './components/ThingCard.jsx';
import Ask from './components/Ask.jsx';
import Settings, { takeReturnRoute, noteInstalled } from './components/Settings.jsx';
import Toast from './components/Toast.jsx';
import PutInSheet from './components/PutInSheet.jsx';
import NotPutAway from './components/NotPutAway.jsx';
import { holderOf, contentsOf, isContainer, chainOf, graph } from './lib/graph.js';
import ItemSheet from './components/ItemSheet.jsx';
import Camera, { MAX_SHOTS, MODE_LABEL } from './components/Camera.jsx';
import { MenuDrawer, LookScreen, LocationsScreen, PlaceScreen, NewPlaceScreen, DeletedScreen, ResearchScreen } from './components/MenuScreens.jsx';
import Confirm from './components/Confirm.jsx';
import Choice from './components/Choice.jsx';
import LogCamera from './components/LogCamera.jsx';
import SavedCard from './components/SavedCard.jsx';
import { shrink } from './lib/img.js';

// Board decision 2026-09-05: depth one. Home (the board, "My items") and one card. Every
// card returns to Home. Routines and checks are still read from the vault but not shown.
//
// Routing rides on the phone's own history (platform audit N2): every card is a pushState,
// so the edge swipe and the Android back button do what they do in every other app. A
// reload on a deep URL lands on Home (Rule 1) — the route objects live in memory only.
const RETURN_TO = takeReturnRoute();
// An invitation link (?j=CODE) — park the code so it survives the sign-in redirect, and take
// it off the URL so a reload does not re-run it (multi-user Phase 2, MU1·5).
(() => { try { const c = new URLSearchParams(location.search).get('j'); if (c) { parkJoin(c); history.replaceState(null, '', location.pathname); } } catch { /* */ } })();
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const HOME = { view: 'home' };

// Boot record: which stage the app reached and how long it took, kept in localStorage so
// Settings can show what happened LAST time — the only way to see a hang after the fact.
const BOOT_KEY = 'recall-last-boot';
const T0 = Date.now();
function noteBoot(stage) {
  try {
    const prev = JSON.parse(localStorage.getItem(BOOT_KEY) || '{}');
    const cur = prev.startedAt === T0 ? prev : { startedAt: T0, stages: [] };
    cur.stages.push({ stage, ms: Date.now() - T0 });
    localStorage.setItem(BOOT_KEY, JSON.stringify(cur));
  } catch { /* fine */ }
}
noteBoot('script');

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ items: [], routines: [], checks: [], removed: [], places: [], grants: [], people: [], invites: [], grantsReady: false });
  // Which ReCall this phone is looking at (Phase 2): null = mine, else the owner's uid. Peter,
  // with nothing of his own and one grant, lands in hers; the choice is remembered per phone.
  const [whose, setWhoseState] = useState(() => getPrefs().whose || null);
  const setWhose = (uid) => { setWhoseState(uid); savePrefs({ ...getPrefs(), whose: uid }); };
  const [switching, setSwitching] = useState(false);
  const [join, setJoin] = useState(() => { const j = pendingJoin(); return j && j.code ? j.code : null; });
  const [, namesTick] = useState(0);
  const [cfgVersion, setCfgVersion] = useState(0);
  const [route, setRoute] = useState(RETURN_TO === 'settings' ? { view: 'settings', reloaded: true } : RETURN_TO === 'people' ? { view: 'people' } : HOME);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);      // item under press-and-hold
  // The in-app camera and what its shots are for:
  //   { for: 'log' }                       → a new photo card
  //   { for: 'resnap', item }              → a photo card for a known thing (Found it)
  //   { for: 'add', itemId }               → straight into that thing's current log
  //   { for: 'more', max }                 → more shots for the photo card that is open
  const [camera, setCamera] = useState(null);
  const [modePick, setModePick] = useState(false); // hold Log item → "Log item as…" (capture modes, 09-24)
  // The place used a moment ago: One thing mode offers it already chosen, for ten minutes.
  const [lastPlace, setLastPlace] = useState(null); // { name, at }
  const [putIn, setPutIn] = useState(null);         // the box things are being put into (PutInSheet)
  const [here, setHere] = useState('');            // "Log here" from inside a box or place: its name
  const [log, setLog] = useState(null);             // the camera (09-27): { preset, moveItem, key } — Log item · Log something in · Move it
  const [saved, setSaved] = useState(null);         // the Home card after a camera Save (the chain + Undo)
  const [renameLink, setRenameLink] = useState(null); // { id, kind, thumb } from the saved card's "Unnamed" line (R3.3)
  const [renameDraft, setRenameDraft] = useState('');
  const adding = useRef(false); // B4: one add-photo at a time (see addPhotosTo)
  const savedRef = useRef(null); savedRef.current = saved; const logRef = useRef(null); logRef.current = log; // read by late callbacks
  const notePlace = (name) => { if (name) setLastPlace({ name, at: Date.now() }); };
  const presetPlace = lastPlace && Date.now() - lastPlace.at < 10 * 60 * 1000 ? lastPlace.name : '';
  const [moreFiles, setMoreFiles] = useState(null); // shots handed to the open photo card
  const [removing, setRemoving] = useState(null); // item awaiting the remove confirm (from the sheet)
  const [mismatch, setMismatch] = useState(null); // { item, files, seen } — added photo looks like a different thing
  const [, tick] = useState(0);
  const [stage, setStage] = useState('script');
  const [slow, setSlow] = useState(false);
  const routes = useRef(new Map()); // history state id → route object (may hold a File)
  const seq = useRef(0);
  const depth = useRef(0);          // how many cards deep we are; Home is 0

  const engine = useMemo(() => new AIEngine(getAIConfig()), [cfgVersion]);
  const { grants = [], people = [], invites = [], grantsReady = false } = data;
  // The grid shows ONE ReCall: mine (my things + things shared with me one by one, tagged) or
  // the owner's whose grant I hold. Places and the removed list follow the same owner.
  const myUid = me();
  const cur = whose || myUid;
  setAIOwner(whose); // AI calls in someone else's ReCall use her key if she has one and I can help (step 1, 09-24)
  const grant = whose ? grants.find((g) => g.grantor === whose) || null : null;
  const role = whose ? (grant ? grant.role : 'viewer') : 'owner';
  const removedFrom = !!whose && grantsReady && !grant; // she took me out (MU2·8), or I left
  const allItems = visibleHere(data.items); // private things of another phone never reach the screens
  const items = allItems.filter((it) => whose ? it.owner === whose : (it.owner === myUid || !it.owner || (it.sharedWith || []).includes(myUid)));
  const places = (data.places || []).filter((p) => (p.owner || myUid) === cur);
  const removed = (data.removed || []).filter((it) => (it.owner || myUid) === cur);
  const itemsRef = useRef(items); itemsRef.current = items;
  useEffect(() => { wantNames([whose, ...grants.map((g) => g.grantor), ...people.map((g) => g.grantee), ...allItems.map((it) => it.owner)]); }, [whose, grants, people, allItems]); // eslint-disable-line
  useEffect(() => watchNames(() => namesTick((n) => n + 1)), []);
  // Peter's first open after joining: nothing of his own, one grant → her grid (MU1·6).
  useEffect(() => { if (!whose && grantsReady && grants.length === 1 && allItems.filter((it) => it.owner === myUid).length === 0) setWhose(grants[0].grantor); }, [grantsReady, grants.length]); // eslint-disable-line
  // The owner's phone repairs docs adopted without `private` (2026-09-21), once per doc.
  const repaired = useRef(false);
  useEffect(() => { if (repaired.current || !ready) return; repaired.current = true; repairPrivateFlags(data).then((n) => { if (n) logEvent('repair_private', { n }); }).catch((e) => console.error('repairPrivateFlags', e)); }, [ready, data.places.length]); // eslint-disable-line
  // Ravi 09-27: take the filing cabinet out of the pencil (lib/db.js repairPencilCabinet) — once the things and edges have arrived.
  const pencilFixed = useRef(false);
  useEffect(() => { if (pencilFixed.current || !ready || !data.items.length) return; pencilFixed.current = true; repairPencilCabinet().then((r) => { if (r === null) pencilFixed.current = false; }).catch((e) => console.error('repairPencilCabinet', e)); }, [ready, data.items.length, data]); // eslint-disable-line
  // 09-29: places made by a chain before today carry a `parent` nothing read — turn each into its edge, once (lib/db.js).
  const parentsFixed = useRef(false);
  useEffect(() => { if (parentsFixed.current || !ready || !data.places.some((p) => p.parent)) return; if (!graph().edges.length) return; parentsFixed.current = true; repairPlaceParents(data).catch((e) => console.error('repairPlaceParents', e)); }, [ready, data]); // eslint-disable-line

  // Thumbnails made before 2026-09-14 are 220 px and blur on a tile (lib/img.js). Rebuild
  // each old one from its stored photo, one at a time, once per item per session. The
  // write comes back through watchAll with thumbV set, so nothing repeats.
  const rethumbed = useRef(new Set());
  useEffect(() => {
    const todo = items.filter((it) => it.thumbV !== THUMB_V && it.photo && !rethumbed.current.has(it.id));
    if (!todo.length) return undefined;
    let alive = true;
    (async () => {
      for (const it of todo) {
        if (!alive) return;
        rethumbed.current.add(it.id);
        try { await updateItem(it.id, { thumb: await thumbFromPhoto(it.photo), thumbV: THUMB_V }); }
        catch (err) { console.error('rethumb', it.id, err); }
      }
    })();
    return () => { alive = false; };
  }, [items]);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); }).catch(() => {});
    }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.update())).catch(() => {});
    }
    // Home is the base history entry. If we were sent back to Settings after a reload,
    // that is one card deep, like any other.
    history.replaceState({ id: 0, depth: 0 }, '');
    if (RETURN_TO === 'settings' || RETURN_TO === 'people') { depth.current = 1; history.pushState({ id: -1, depth: 1 }, ''); }
    const onPop = (e) => {
      const st = e.state || { id: 0, depth: 0 };
      depth.current = st.depth || 0;
      const r = st.depth ? routes.current.get(st.id) : null;
      window.scrollTo(0, 0);
      setRoute(r || HOME);
    };
    window.addEventListener('popstate', onPop);
    // Only ever say "no connection" when the browser itself says so (LESSONS.md).
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    let unsub = () => {};
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    const onStage = (st) => { noteBoot(st); setStage(st); };
    const unsubUser = watchUser();
    ensureSignedIn(onStage)
      .then(async (user) => {
        // Multi-user Phase 1: the redirect back from Apple/Google lands here; then the person's
        // row; then adopt any pre-09-19 docs so the owner-scoped listeners see them.
        try { const r = await finishSignIn(); if (r && r.orphaned) console.warn('signed in as an existing account; anonymous data left behind (claimAnonymous, Phase 3)'); if (r && r.user) setTimeout(() => say(`Signed in as ${r.user.displayName || 'you'}`), 400); } catch (e) { console.error('finishSignIn', e); setTimeout(() => say(`Sign-in failed: ${e && (e.code || e.message) || e}`), 400); }
        upsertUser(user).catch(() => {});
        try { let n; do { n = await adoptLegacy(); } while (n > 0); } catch (e) { console.error('adoptLegacy', e); }
        unsub = watchAll(setData);
        onStage('ready');
        clearTimeout(slowTimer);
        setReady(true);
        noteInstalled();
        logEvent('app_open', { bootMs: Date.now() - T0 });
      })
      .catch((e) => { onStage('error'); setError(String(e)); });
    const iv = setInterval(() => tick((n) => n + 1), 60000);
    return () => { unsub(); unsubUser(); clearInterval(iv); };
  }, []);

  if (error) return <div className="boot">Couldn't connect: {error}</div>;
  if (!ready) {
    // Say which step it is on, so a hang names itself. After 4s, offer a fresh start.
    const label = { script: 'starting', auth: 'signing in', 'auth:signing-in': 'signing in', 'auth:fallback': 'signing in another way' }[stage] || stage;
    return (
      <div className="boot">
        Opening ReCall…
        {slow && (
          <div className="boot-slow">
            <div>Still {label}.</div>
            <button className="btn-secondary" onClick={() => location.replace(location.pathname + '?v=' + Date.now())}>Try again</button>
          </div>
        )}
      </div>
    );
  }

  const live = (it) => items.find((x) => x.id === it?.id) || it;
  // R3.3: the saved card's "Unnamed — tap to name" line — opens the rename sheet for the doc the
  // camera just made (a new place or a new box saved with no real name yet). Defined before the
  // `join` early return: it's a JSX prop value there, evaluated eagerly, not inside a callback body.
  const openRenameLink = (u) => { setRenameDraft(''); setRenameLink(u); };
  const applyRenameLink = async () => {
    const n = renameDraft.trim();
    if (!n || !renameLink) return;
    if (renameLink.kind === 'thing') { const it = items.find((x) => x.id === renameLink.id); if (it) await renameItem(it, n); }
    else { const p = places.find((x) => x.id === renameLink.id); if (p) await renamePlace(p, n, items); }
    setSaved((s) => (s ? { ...s, unnamed: (s.unnamed || []).filter((x) => x.id !== renameLink.id) } : s));
    setRenameLink(null);
  };
  if (join) {
    return (
      <>
        <JoinScreen code={join}
          onJoined={(r, who) => { setJoin(null); if (!r.itemId) setWhose(r.grantor); say(`You can now see ${who ? possessive(who) : 'their'} things`); }}
          onDismiss={() => setJoin(null)} />
        {log && (
        <LogCamera key={log.key} engine={engine} items={items} places={places} owner={whose || undefined} ownerName={whose ? firstName(whose) : ''}
          look={getPrefs().cameraLook} preset={log.preset} moveItem={log.moveItem ? live(log.moveItem) : null}
          onSaved={logSaved} onCancel={() => setLog(null)} onNotice={privacyNotice}
          onWrite={() => { setLog(null); logEvent('capture_write_open', {}); go('write', { key: Date.now() }); }} />
      )}
      {!log && <SavedCard card={saved && { ...saved, name: (() => { const it = items.find((x) => x.id === saved.itemId); return it && it.name ? it.name.charAt(0).toUpperCase() + it.name.slice(1) : saved.name; })() }} onDone={() => setSaved(null)}
        onShare={async (c) => { await setVisibility({ id: c.itemId, owner: me() }, 'household'); logEvent('privacy_share', { itemId: c.itemId, to: 'shared', via: 'saved_card' }); setSaved((x) => (x ? { ...x, lock: false, priv: null, shared: true } : x)); }}
        onUndo={async (u) => { await undoChain(u); say('Undone · nothing from that photo is kept'); }}
        onRenameLink={openRenameLink} />}
      {/* R3.3: the "Unnamed — tap to name" line's rename sheet — renames the place/box saveChain just made. */}
      {renameLink && (
        <div className="sheet-back" onClick={() => setRenameLink(null)} role="presentation">
          <div className="sheet" role="dialog" aria-labelledby="rl-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="rl-title">What is it called?</div>
            <input className="place-input" autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && renameDraft.trim()) applyRenameLink(); }} />
            <button className="btn-primary" disabled={!renameDraft.trim()} onClick={applyRenameLink}>Use this name</button>
            <button className="btn-quiet" onClick={() => setRenameLink(null)}>Cancel</button>
          </div>
        </div>)}
      <Toast toast={toast} onDone={() => setToast(null)} />
      </>
    );
  }

  // Open a card: one history entry deeper.
  const go = (view, extra = {}) => {
    const r = { view, ...extra };
    const id = ++seq.current;
    routes.current.set(id, r);
    depth.current += 1;
    history.pushState({ id, depth: depth.current }, '');
    window.scrollTo(0, 0);
    setRoute(r);
  };
  // One step back — what the header's Back and the edge swipe both do.
  const back = () => { if (depth.current > 0) history.back(); else setRoute(HOME); };
  // All the way home — what finishing a card does (Rule 1), however deep it got.
  const home = () => { if (depth.current > 0) history.go(-depth.current); else setRoute(HOME); };

  const say = (text, undo) => setToast({ text, undo, key: Date.now() });
  // Put things into a box: one save for all, Undo puts each back where it was (edges close/reopen).
  const doPutIn = async (box, list) => doPut({ t: 'thing', thing: box }, list);
  const doPut = async (dest, list) => {
    setPutIn(null);
    const before = list.map((t) => ({ t, loc: t.location || '' }));
    let n = 0;
    if (dest.t === 'thing') n = await putInto(list, dest.thing);
    else { for (const t of list) { await changeLocation(t, dest.name, 'chosen'); n += 1; } logEvent('put_away', { place: dest.name, things: n }); }
    const where = dest.t === 'thing' ? `in the ${(dest.thing.name || 'box').replace(/^(my|the)\s+/i, '')}` : `at ${dest.name}`;
    say(`Put ${n} ${where}`, async () => { for (const b of before) await changeLocation({ ...(items.find((x) => x.id === b.t.id) || b.t) }, b.loc, 'chosen'); logEvent('put_undo', { things: n }); });
  };

  // Private by default, when the verdict came after the save (Ravi 09-24): she is told right after
  // the photo stage, with one tap to share it instead. Returns true if a notice was shown.
  const privacyNotice = (n) => {
    if (!n || !n.done || !n.done.length) return false;
    // The camera's Home card is showing this very thing: say it there, with Share it (one card, not two).
    const sv = savedRef.current;
    if (!logRef.current && sv && sv.itemId === n.itemId && n.done.includes('private') && !n.done.includes('photo')) {
      setSaved((c) => (c && c.itemId === n.itemId ? { ...c, lock: true, priv: n.why || 'looks private', key: Date.now() } : c));
      return true;
    }
    const share = async () => { await setVisibility({ id: n.itemId, owner: me() }, 'household'); logEvent('privacy_share', { itemId: n.itemId, to: 'shared', via: 'toast' }); say(VISIBILITY_TOAST.household); };
    const text = n.done.includes('photo') ? 'Photo not kept · a secret could be read in it'
      : n.done.includes('private') ? `Kept private · ${n.why || 'looks private'}`
      : `Looks private · only ${firstName(whose) || 'the owner'} can hide it`;
    setToast({ text, undo: n.done.includes('private') && !n.done.includes('photo') ? share : null, undoLabel: 'Share it', over: true, key: Date.now() });
    return true;
  };

  // Add one more photo to a thing's CURRENT log (thing card / press-and-hold sheet, round 3).
  // No card, no question: same place, same time, no AI.
  // Round 5 (Ravi): a photo added to a thing is checked against that thing first. A coffee
  // cup added to the folder gets a question, not a silent save.
  // fix 2026-09-28 (phone, B4): 1–3 s passed with nothing on screen, inviting a second tap or leaving mid-save.
  // Now a working toast shows at once and stays until the result replaces it; a second call while one runs is ignored.
  const addPhotosTo = async (itemId, files, { checked = false } = {}) => {
    if (adding.current) return;
    const it0 = itemsRef.current.find((x) => x.id === itemId);
    if (!it0) return;
    adding.current = true;
    try { await addPhotosToInner(it0, itemId, files, checked); } finally { adding.current = false; }
  };
  const addPhotosToInner = async (it0, itemId, files, checked) => {
    setToast({ text: files.length > 1 ? `Adding ${files.length} photos…` : 'Adding the photo…', busy: true, key: Date.now() });
    let caption = ''; // D3 (Ravi 09-28): what the FIRST new photo shows the thing resting on; '' when the check is skipped
    if (!checked && engine.ready && it0.thumb) {
      setToast({ text: 'Checking the photo…', busy: true, key: Date.now() });
      try {
        const { photo } = await compressPhoto(files[0]);
        const r = await engine.looksLike(photo, { name: it0.name, thumb: await shrink(it0.thumb, 320) }, { sensitivity: 'personal' });
        logEvent('add_check', { itemId, same: r.same, seen: r.seen || null });
        if (!r.same) { setToast(null); setMismatch({ item: it0, files, seen: r.seen }); return; }
        caption = r.restingOn || '';
      } catch (err) { console.error(err); }
    }
    let added = 0;
    for (const file of files) {
      const it = itemsRef.current.find((x) => x.id === itemId);
      if (!it) break;
      const { photo, thumb } = await compressPhoto(file);
      const ok = await addSnapToLog(it, { photo, thumb, caption: added === 0 ? caption : '' }); // the check only looked at the first photo
      if (!ok) break;
      added += 1;
      await new Promise((r) => setTimeout(r, 50)); // let the listener deliver the new photoCount
    }
    logEvent('capture', { initiatedBy: 'add_photo', itemId, extra: true, added, asked: files.length });
    say(added ? `Added · ${added} photo${added === 1 ? '' : 's'}` : 'That log already has four photos');
  };
  // Log item: the camera opens in the mode Settings says (the last used, by default).
  const logTitle = () => (whose ? `Log item · in ${possessive(firstName(whose))} ReCall` : 'Log item');
  // Log item (09-27): one camera asks what, then where — step back for what it's in and where that is.
  // `preset` is Log here: the box or place Home is showing. Several and the mode row went with Q3.
  const openLog = (preset = null) => { logEvent('capture_open', { look: getPrefs().cameraLook, here: !!preset }); setLog({ preset, key: Date.now() }); };
  // Move it / Put it somewhere (09-27): the same camera, the thing already there, level 1 chosen.
  const openMove = (item) => { logEvent('capture_open', { look: getPrefs().cameraLook, move: true }); setLog({ moveItem: item, key: Date.now() }); };
  const logSaved = (card) => {
    if (card.moved) {
      setLog(null);
      if (card.refused) { say('Not moved · it can’t go inside something that is inside it'); return; }
      say(card.none ? 'No place yet' : `${card.name} · ${card.l1}${card.l2 ? ` · ${card.l2}` : ''}${(card.moving || []).length ? ` · ${card.moving.join(' · ')}` : ''}`, card.undo ? async () => { await undoChain(card.undo); logEvent('move_undo', { itemId: card.itemId }); } : null);
      return;
    }
    if (card.where) notePlace(card.where); // Write it down offers the place used a moment ago
    if (card.next) { setToast({ text: `Saved · ${card.name}${card.none ? '' : ` · ${card.l1}`}`, over: true, key: Date.now() }); return; }
    setLog(null); setSaved({ ...card, key: Date.now() });
  };
  const switchMode = (m) => {
    setCamera((c) => ({ ...c, mode: m }));
    const p = getPrefs(); savePrefs({ ...p, lastMode: m });
    logEvent('capture_mode', { mode: m, via: 'camera' });
  };
  const severalDone = (things) => {
    setCamera(null);
    const placed = things.filter((t) => t.place); if (placed.length) notePlace(placed[placed.length - 1].place);
    if (things.length >= 2) go('review', { things, key: Date.now() });
    else if (things.length === 1) say(`Saved · ${things[0].name ? things[0].name.charAt(0).toUpperCase() + things[0].name.slice(1) : 'your photo'}${things[0].place ? ` · ${things[0].place}` : ''}`);
  };
  const cameraDone = (files) => {
    const c = camera; setCamera(null);
    if (!c || !files.length) return;
    if (c.for === 'log') go('photo', { files, key: Date.now() });
    else if (c.for === 'resnap') go('photo', { files, resnapOf: c.item, key: Date.now() });
    else if (c.for === 'add') addPhotosTo(c.itemId, files);
    else if (c.for === 'more') setMoreFiles(files);
    else if (c.for === 'place_new') go('place_new', { files, key: Date.now() });
    else if (c.for === 'place_add') addPlacePhotosTo(c.name, files);
  };
  // Photos for a saved place (round 7). The place doc holds them, so compress smaller.
  const addPlacePhotosTo = async (name, files) => {
    const p = placeNamed(name, places); if (!p) return;
    const pics = await Promise.all(files.slice(0, PLACE_PHOTOS - (p.photos || []).length).map(compressPlacePhoto));
    const added = await addPlacePhotos(p, pics);
    logEvent('place_photo', { name, added });
    say(added ? `Added · ${added} photo${added === 1 ? '' : 's'} of ${name}` : `${name} already has ${PLACE_PHOTOS} photos`);
  };
  const removeItem = async (item) => {
    await softDeleteItem(item);
    logEvent('item_removed', { itemId: item.id, itemName: item.name || null, via: 'sheet' });
    say(`Removed · ${item.name || 'this'}`, () => { restoreItem(item.id); logEvent('item_restored', { itemId: item.id, via: 'undo' }); });
  };

  let screen;
  switch (route.view) {
    case 'photo':
      screen = (
        <PhotoCard
          key={route.key}
          files={route.files} engine={engine} items={items} places={places}
          owner={whose || undefined} ownerName={whose ? firstName(whose) : ''}
          resnapOf={route.resnapOf ? live(route.resnapOf) : null}
          onMore={(max) => setCamera({ for: 'more', max })}
          pendingFiles={moreFiles} onPendingTaken={() => setMoreFiles(null)}
          presetPlace={route.resnapOf ? '' : (here || presetPlace)}
          onNext={route.resnapOf ? null : () => {}}
          onNotice={privacyNotice}
          onDone={(result) => {
            if (result && result.saved) { if (!privacyNotice(result.notice)) say(result.place ? `Saved · ${result.place}` : 'Saved'); notePlace(result.place); }
            if (here && !(result && result.next)) { setHere(''); back(); return; } // Log here: back to the box
            home();
            if (result && result.next) openLog(); // One thing mode: Next item goes straight back to the camera
          }}
          onBack={back}
        />
      );
      break;
    case 'thing':
      screen = (
        <ThingCard key={route.item.id} places={places} showAddedBy={getPrefs().showAddedBy !== false} peopleCount={people.length}
          item={live(route.item)} items={items}
          onBack={back}
          onAdd={() => setCamera({ for: 'add', itemId: route.item.id, max: Math.min(MAX_SHOTS, LOG_MAX - (live(route.item).photoCount || 1)), title: 'Add photos' })}
          onRemoved={(item) => {
            say(`Removed · ${item.name || 'this'}`, () => { restoreItem(item.id); logEvent('item_restored', { itemId: item.id, via: 'undo' }); });
            home();
          }}
          onToast={say}
          // One page per thing (09-27). Going back to the page you came from is Back, never one page deeper (#24: no circles).
          onOpen={(it) => (route.from && it.id === route.from ? back() : go('thing', { item: it, from: route.item.id }))}
          onPutIn={(it) => setPutIn(it)} onMove={openMove} onLogInto={(it) => openLog({ t: 'thing', item: it })}
        />
      );
      break;
    case 'ask':
      screen = (
        <Ask
          engine={engine} items={items}
          onResult={(item) => go('thing', { item })}
          onPhoto={() => openLog()}
          onBack={back}
        />
      );
      break;
    case 'write':
      screen = <NoteCard key={route.key} items={items} places={places} owner={whose || undefined} presetPlace={presetPlace} onBack={back}
        onDone={(r) => { say(`Saved · ${r.name}${r.place ? ` · ${r.place}` : ''}`); notePlace(r.place); home(); }} />;
      break;
    case 'review':
      screen = <SessionReview things={route.things} items={items} onOpen={(item) => go('thing', { item })} onFinish={() => { logEvent('capture_review', { things: route.things.length }); home(); }} />;
      break;
    case 'settings':
      screen = <Settings justReloaded={!!route.reloaded} onBack={back} onConfigSaved={() => setCfgVersion((v) => v + 1)} />;
      break;
    case 'look': screen = <LookScreen onBack={back} />; break;
    case 'people':
      screen = <PeopleScreen people={people} invites={invites} grants={grants} whose={whose} onBack={back} onToast={say}
        onOpenRecall={(uid) => { setWhose(uid); home(); }} onLeft={(uid) => { if (whose === uid) setWhose(null); }} />;
      break;
    case 'locations':
      screen = <LocationsScreen places={places} items={items} onBack={back} onOpen={(name) => go('place', { name })} canEdit={role !== 'viewer'}
        onAdd={() => setCamera({ for: 'place_new', max: PLACE_PHOTOS, title: 'New place' })} />;
      break;
    case 'place':
      screen = <PlaceScreen name={route.name} places={places} items={items} onBack={back} onToast={say} owner={cur}
        onAddPhoto={(n) => setCamera({ for: 'place_add', name: route.name, max: n, title: `Photo of ${route.name}` })}
        onOpenThing={(item) => go('thing', { item })} />;
      break;
    case 'place_new':
      screen = <NewPlaceScreen files={route.files} places={places} owner={cur} onBack={back} onDone={(name) => { say(`Saved · ${name}`); back(); }} />;
      break;
    case 'deleted': screen = <DeletedScreen removed={removed} onBack={back} />; break;
    case 'research': screen = <ResearchScreen onBack={back} />;
      break;
    case 'notput':
      screen = <NotPutAway items={items} onBack={back} onOpen={(item) => go('thing', { item })} />;
      break;
    case 'menu':
    default:
      screen = (
        <Board
          items={items} ready={engine.ready} whose={whose} role={role} removed={removedFrom}
          onOpenThing={(item) => go('thing', { item })}
          onPhoto={() => openLog()}
          onAsk={() => go('ask')}
          onSettings={() => go('settings')}
          onMenu={() => go('menu')}
          onHold={(item) => { if (roleOn(item) !== 'viewer') setSheet(item); }}
          onSwitch={() => { if (grants.length || whose) setSwitching(true); }} canSwitch={grants.length > 0 || !!whose}
          onStartOwn={() => { setWhose(null); logEvent('start_own', {}); }}
          onPutAway={() => { logEvent('put_away_open', {}); go('notput'); }}
        />
      );
  }

  return (
    <>
      {offline && <div className="offline" role="status">No connection right now — photos will save when it's back.</div>}
      {screen}
      {/* The drawer is a history entry of its own (round 4, Ravi): Back from any of its screens
          returns to the drawer, not to Home. Close is one step back. */}
      <MenuDrawer open={route.view === 'menu'} onClose={back} onPick={(id) => go(id)} />
      {camera && camera.for === 'log' && camera.mode === 'several' && (
        <SeveralCamera engine={engine} items={items} places={places} owner={whose || undefined} title={camera.title || 'Log item'}
          modes={getPrefs().captureModes} onMode={switchMode} onClose={(r) => { setHere(''); severalDone(r); }} initialPlace={here} />
      )}
      {camera && !(camera.for === 'log' && camera.mode === 'several') && (
        <Camera title={camera.title || 'Log item'} max={camera.max || 4} onDone={cameraDone} onCancel={() => setCamera(null)}
          modes={camera.for === 'log' ? getPrefs().captureModes : null} mode={camera.mode || 'one'} onMode={switchMode}
          onWrite={camera.for === 'log' ? () => { setCamera(null); logEvent('capture_write_open', {}); go('write', { key: Date.now() }); } : null} />
      )}
      {modePick && (
        <Choice title="Log item as…" options={[
          ...getPrefs().captureModes.map((m) => ({ label: MODE_LABEL[m], onClick: () => { setModePick(false); logEvent('capture_mode', { mode: m, via: 'hold' }); openLog(); } })),
          { label: 'Cancel', onClick: () => setModePick(false) },
        ]} onCancel={() => setModePick(false)} />
      )}
      {switching && (
        <Choice title="Which ReCall?" options={[
          ...(!whose ? [] : [{ label: 'My ReCall', onClick: () => { setSwitching(false); setWhose(null); } }]),
          ...grants.filter((g) => g.grantor !== whose).map((g) => ({ label: `${possessive(firstName(g.grantor) || 'Someone')} ReCall`, onClick: () => { setSwitching(false); setWhose(g.grantor); logEvent('switch_recall', {}); } })),
          { label: 'Cancel', onClick: () => setSwitching(false) },
        ]} onCancel={() => setSwitching(false)} />
      )}
      {sheet && (
        <ItemSheet item={live(sheet)} role={roleOn(live(sheet))} container={isContainer(live(sheet))} placed={!!live(sheet).location || !!holderOf(live(sheet))}
          onAdd={() => { const it = live(sheet); setSheet(null); setCamera({ for: 'add', itemId: it.id, max: Math.min(MAX_SHOTS, LOG_MAX - (it.photoCount || 1)), title: 'Add photos' }); }}
          onMove={() => { const it = live(sheet); setSheet(null); openMove(it); }}
          onPutIn={() => { const it = live(sheet); setSheet(null); setPutIn(it); }}
          onPrivate={roleOn(live(sheet)) === 'owner' ? async () => { const it = live(sheet); setSheet(null); const to = isPrivate(it) ? 'household' : 'private'; await setVisibility(it, to); logEvent('visibility', { itemId: it.id, to, via: 'tile_sheet' }); say(VISIBILITY_TOAST[to]); } : null}
          onRemove={roleOn(live(sheet)) === 'owner' ? () => { setSheet(null); setRemoving(sheet); } : null}
          onPromote={roleOn(live(sheet)) === 'owner' && holderOf(live(sheet)) ? async () => { const it = live(sheet); setSheet(null); await setPromoted(it, !it.promoted); say(it.promoted ? 'Off Home · still in its box' : 'On Home too'); } : null}
          promoted={!!live(sheet).promoted}
          onCancel={() => setSheet(null)} />
      )}
      {mismatch && (
        <Choice
          title={`This looks like ${mismatch.seen ? `a ${mismatch.seen}` : 'something else'}, not ${mismatch.item.name ? `your ${own(mismatch.item.name)}` : 'this thing'}.`}
          body="A photo of a different thing belongs on its own tile."
          options={[
            { label: `Log it as a new item`, onClick: () => { const m = mismatch; setMismatch(null); go('photo', { files: m.files, key: Date.now() }); } },
            { label: `Add it to ${mismatch.item.name ? own(mismatch.item.name) : 'this thing'} anyway`, amber: true, onClick: () => { const m = mismatch; setMismatch(null); addPhotosTo(m.item.id, m.files, { checked: true }); } },
            { label: "Don't add it", onClick: () => setMismatch(null) },
          ]}
          onCancel={() => setMismatch(null)} />
      )}
      {removing && (
        <Confirm title={`Remove ${removing.name ? `your ${own(removing.name)}` : 'this'} from My items?`}
          body="It goes to Settings → Recently removed, where it can be put back."
          keepLabel="Keep it" actionLabel="Remove"
          onKeep={() => setRemoving(null)}
          onAction={() => { const it = removing; setRemoving(null); removeItem(it); }} />
      )}
      {putIn && <PutInSheet container={items.find((x) => x.id === putIn.id) || putIn} items={items} onCancel={() => setPutIn(null)} onDone={(list) => doPutIn(putIn, list)} />}
      {log && (
        <LogCamera key={log.key} engine={engine} items={items} places={places} owner={whose || undefined} ownerName={whose ? firstName(whose) : ''}
          look={getPrefs().cameraLook} preset={log.preset} moveItem={log.moveItem ? live(log.moveItem) : null}
          onSaved={logSaved} onCancel={() => setLog(null)} onNotice={privacyNotice}
          onWrite={() => { setLog(null); logEvent('capture_write_open', {}); go('write', { key: Date.now() }); }} />
      )}
      {!log && <SavedCard card={saved && { ...saved, name: (() => { const it = items.find((x) => x.id === saved.itemId); return it && it.name ? it.name.charAt(0).toUpperCase() + it.name.slice(1) : saved.name; })() }} onDone={() => setSaved(null)}
        onShare={async (c) => { await setVisibility({ id: c.itemId, owner: me() }, 'household'); logEvent('privacy_share', { itemId: c.itemId, to: 'shared', via: 'saved_card' }); setSaved((x) => (x ? { ...x, lock: false, priv: null, shared: true } : x)); }}
        onUndo={async (u) => { await undoChain(u); say('Undone · nothing from that photo is kept'); }}
        onRenameLink={openRenameLink} />}
      {/* R3.3: the "Unnamed — tap to name" line's rename sheet — renames the place/box saveChain just made. */}
      {renameLink && (
        <div className="sheet-back" onClick={() => setRenameLink(null)} role="presentation">
          <div className="sheet" role="dialog" aria-labelledby="rl-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-title" id="rl-title">What is it called?</div>
            <input className="place-input" autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter' && renameDraft.trim()) applyRenameLink(); }} />
            <button className="btn-primary" disabled={!renameDraft.trim()} onClick={applyRenameLink}>Use this name</button>
            <button className="btn-quiet" onClick={() => setRenameLink(null)}>Cancel</button>
          </div>
        </div>)}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
