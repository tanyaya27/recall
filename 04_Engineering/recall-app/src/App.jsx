import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchUser, finishSignIn } from './lib/auth.js';
import { watchAll, restoreItem, updateItem, addSnapToLog, softDeleteItem, moveToTop, visibleHere, setVisibility, logEvent, LOG_MAX, VISIBILITY_TOAST, addPlacePhotos, placeNamed, PLACE_PHOTOS, adoptLegacy, upsertUser, isPrivate } from './lib/db.js';
import { THUMB_V, thumbFromPhoto, compressPhoto, compressPlacePhoto } from './lib/img.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import Board from './components/Board.jsx';
import PhotoCard, { own } from './components/PhotoCard.jsx';
import ThingCard from './components/ThingCard.jsx';
import Ask from './components/Ask.jsx';
import Settings, { takeReturnRoute, noteInstalled } from './components/Settings.jsx';
import Toast from './components/Toast.jsx';
import ItemSheet from './components/ItemSheet.jsx';
import Camera, { MAX_SHOTS } from './components/Camera.jsx';
import { MenuDrawer, LookScreen, LocationsScreen, PlaceScreen, NewPlaceScreen, DeletedScreen, ResearchScreen } from './components/MenuScreens.jsx';
import Confirm from './components/Confirm.jsx';
import Choice from './components/Choice.jsx';
import { shrink } from './lib/img.js';

// Board decision 2026-09-05: depth one. Home (the board, "My items") and one card. Every
// card returns to Home. Routines and checks are still read from the vault but not shown.
//
// Routing rides on the phone's own history (platform audit N2): every card is a pushState,
// so the edge swipe and the Android back button do what they do in every other app. A
// reload on a deep URL lands on Home (Rule 1) — the route objects live in memory only.
const RETURN_TO = takeReturnRoute();
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
  const [data, setData] = useState({ items: [], routines: [], checks: [], removed: [], places: [] });
  const [cfgVersion, setCfgVersion] = useState(0);
  const [route, setRoute] = useState(RETURN_TO === 'settings' ? { view: 'settings', reloaded: true } : HOME);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);      // item under press-and-hold
  // The in-app camera and what its shots are for:
  //   { for: 'log' }                       → a new photo card
  //   { for: 'resnap', item }              → a photo card for a known thing (Found it)
  //   { for: 'add', itemId }               → straight into that thing's current log
  //   { for: 'more', max }                 → more shots for the photo card that is open
  const [camera, setCamera] = useState(null);
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
  const { removed, places = [] } = data;
  const items = visibleHere(data.items); // private things of another phone never reach the screens
  const itemsRef = useRef(items); itemsRef.current = items;

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
    if (RETURN_TO === 'settings') { depth.current = 1; history.pushState({ id: -1, depth: 1 }, ''); }
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
        try { const r = await finishSignIn(); if (r && r.orphaned) console.warn('signed in as an existing account; anonymous data left behind (claimAnonymous, Phase 3)'); } catch (e) { console.error('finishSignIn', e); }
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

  // Add one more photo to a thing's CURRENT log (thing card / press-and-hold sheet, round 3).
  // No card, no question: same place, same time, no AI.
  // Round 5 (Ravi): a photo added to a thing is checked against that thing first. A coffee
  // cup added to the folder gets a question, not a silent save.
  const addPhotosTo = async (itemId, files, { checked = false } = {}) => {
    const it0 = itemsRef.current.find((x) => x.id === itemId);
    if (!it0) return;
    if (!checked && engine.ready && it0.thumb) {
      say('Checking the photo…');
      try {
        const { photo } = await compressPhoto(files[0]);
        const r = await engine.looksLike(photo, { name: it0.name, thumb: await shrink(it0.thumb, 320) }, { sensitivity: 'personal' });
        logEvent('add_check', { itemId, same: r.same, seen: r.seen || null });
        if (!r.same) { setToast(null); setMismatch({ item: it0, files, seen: r.seen }); return; }
      } catch (err) { console.error(err); }
    }
    let added = 0;
    for (const file of files) {
      const it = itemsRef.current.find((x) => x.id === itemId);
      if (!it) break;
      const { photo, thumb } = await compressPhoto(file);
      const ok = await addSnapToLog(it, { photo, thumb });
      if (!ok) break;
      added += 1;
      await new Promise((r) => setTimeout(r, 50)); // let the listener deliver the new photoCount
    }
    logEvent('capture', { initiatedBy: 'add_photo', itemId, extra: true, added, asked: files.length });
    say(added ? `Added · ${added} photo${added === 1 ? '' : 's'}` : 'That log already has four photos');
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
          resnapOf={route.resnapOf ? live(route.resnapOf) : null}
          onMore={(max) => setCamera({ for: 'more', max })}
          pendingFiles={moreFiles} onPendingTaken={() => setMoreFiles(null)}
          onDone={(result) => {
            if (result && result.saved) say(result.place ? `Saved · ${result.place}` : 'Saved');
            home();
          }}
          onBack={back}
        />
      );
      break;
    case 'thing':
      screen = (
        <ThingCard places={places}
          item={live(route.item)} items={items} openFix={!!route.fix}
          onBack={back}
          onAdd={() => setCamera({ for: 'add', itemId: route.item.id, max: Math.min(MAX_SHOTS, LOG_MAX - (live(route.item).photoCount || 1)), title: 'Add photos' })}
          onRemoved={(item) => {
            say(`Removed · ${item.name || 'this'}`, () => { restoreItem(item.id); logEvent('item_restored', { itemId: item.id, via: 'undo' }); });
            home();
          }}
          onToast={say}
        />
      );
      break;
    case 'ask':
      screen = (
        <Ask
          engine={engine} items={items}
          onResult={(item) => go('thing', { item })}
          onPhoto={() => setCamera({ for: 'log' })}
          onBack={back}
        />
      );
      break;
    case 'settings':
      screen = <Settings justReloaded={!!route.reloaded} onBack={back} onConfigSaved={() => setCfgVersion((v) => v + 1)} />;
      break;
    case 'look': screen = <LookScreen onBack={back} />; break;
    case 'locations':
      screen = <LocationsScreen places={places} items={items} onBack={back} onOpen={(name) => go('place', { name })}
        onAdd={() => setCamera({ for: 'place_new', max: PLACE_PHOTOS, title: 'New place' })} />;
      break;
    case 'place':
      screen = <PlaceScreen name={route.name} places={places} items={items} onBack={back} onToast={say}
        onAddPhoto={(n) => setCamera({ for: 'place_add', name: route.name, max: n, title: `Photo of ${route.name}` })}
        onOpenThing={(item) => go('thing', { item })} />;
      break;
    case 'place_new':
      screen = <NewPlaceScreen files={route.files} places={places} onBack={back} onDone={(name) => { say(`Saved · ${name}`); back(); }} />;
      break;
    case 'deleted': screen = <DeletedScreen removed={removed} onBack={back} />; break;
    case 'research': screen = <ResearchScreen onBack={back} />;
      break;
    case 'menu':
    default:
      screen = (
        <Board
          items={items} ready={engine.ready}
          onOpenThing={(item, fix) => go('thing', { item, fix: !!fix })}
          onPhoto={() => setCamera({ for: 'log' })}
          onAsk={() => go('ask')}
          onSettings={() => go('settings')}
          onMenu={() => go('menu')}
          onHold={(item) => setSheet(item)}
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
      {camera && <Camera title={camera.title || 'Log item'} max={camera.max || 4} onDone={cameraDone} onCancel={() => setCamera(null)} />}
      {sheet && (
        <ItemSheet item={live(sheet)}
          onAdd={() => { const it = live(sheet); setSheet(null); setCamera({ for: 'add', itemId: it.id, max: Math.min(MAX_SHOTS, LOG_MAX - (it.photoCount || 1)), title: 'Add photos' }); }}
          onChangePlace={() => { setSheet(null); go('thing', { item: sheet, fix: true }); }}
          onRename={() => { setSheet(null); go('thing', { item: sheet, fix: true }); }}
          onMoveToTop={async () => { setSheet(null); await moveToTop(sheet, items); logEvent('move_to_top', { itemId: sheet.id, via: 'sheet' }); say('Moved to the top'); }}
          onPrivate={async () => { const it = live(sheet); setSheet(null); const to = isPrivate(it) ? 'household' : 'private'; await setVisibility(it, to); logEvent('visibility', { itemId: it.id, to, via: 'tile_sheet' }); say(VISIBILITY_TOAST[to]); }}
          onRemove={() => { setSheet(null); setRemoving(sheet); }}
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
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
