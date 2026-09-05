import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchAll, restoreItem, logEvent } from './lib/db.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import Board from './components/Board.jsx';
import PhotoCard from './components/PhotoCard.jsx';
import ThingCard from './components/ThingCard.jsx';
import Ask from './components/Ask.jsx';
import Settings, { takeReturnRoute } from './components/Settings.jsx';
import Toast from './components/Toast.jsx';

// Board decision 2026-09-05: depth one. Home (the board, "My things") and one card. Every
// card returns to Home. Routines and checks are still read from the vault but not shown.
//
// Routing rides on the phone's own history (platform audit N2): every card is a pushState,
// so the edge swipe and the Android back button do what they do in every other app. A
// reload on a deep URL lands on Home (Rule 1) — the route objects live in memory only.
const RETURN_TO = takeReturnRoute();
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
  const [data, setData] = useState({ items: [], routines: [], checks: [], removed: [] });
  const [cfgVersion, setCfgVersion] = useState(0);
  const [route, setRoute] = useState(RETURN_TO === 'settings' ? { view: 'settings', reloaded: true } : HOME);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [toast, setToast] = useState(null);
  const [, tick] = useState(0);
  const [stage, setStage] = useState('script');
  const [slow, setSlow] = useState(false);
  const routes = useRef(new Map()); // history state id → route object (may hold a File)
  const seq = useRef(0);
  const depth = useRef(0);          // how many cards deep we are; Home is 0

  const engine = useMemo(() => new AIEngine(getAIConfig()), [cfgVersion]);
  const { items, removed } = data;

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
    ensureSignedIn(onStage)
      .then(() => {
        unsub = watchAll(setData);
        onStage('ready');
        clearTimeout(slowTimer);
        setReady(true);
        logEvent('app_open', { bootMs: Date.now() - T0 });
      })
      .catch((e) => { onStage('error'); setError(String(e)); });
    const iv = setInterval(() => tick((n) => n + 1), 60000);
    return () => { unsub(); clearInterval(iv); };
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

  let screen;
  switch (route.view) {
    case 'photo':
      screen = (
        <PhotoCard
          key={route.key}
          file={route.file} engine={engine} items={items}
          resnapOf={route.resnapOf ? live(route.resnapOf) : null}
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
        <ThingCard
          item={live(route.item)} items={items}
          onBack={back}
          onFoundFile={(file) => go('photo', { file, resnapOf: route.item, key: Date.now() })}
          onRemoved={(item) => {
            say(`Removed · ${item.name || 'this'}`, () => { restoreItem(item.id); logEvent('item_restored', { itemId: item.id, via: 'undo' }); });
            home();
          }}
        />
      );
      break;
    case 'ask':
      screen = (
        <Ask
          engine={engine} items={items}
          onResult={(item, file) => (item ? go('thing', { item }) : go('photo', { file, key: Date.now() }))}
          onBack={back}
        />
      );
      break;
    case 'settings':
      screen = <Settings removed={removed} justReloaded={!!route.reloaded} onBack={back} onConfigSaved={() => setCfgVersion((v) => v + 1)} />;
      break;
    default:
      screen = (
        <Board
          items={items} ready={engine.ready}
          onOpenThing={(item) => go('thing', { item })}
          onPhoto={(file) => go('photo', { file, key: Date.now() })}
          onAsk={() => go('ask')}
          onSettings={() => go('settings')}
        />
      );
  }

  return (
    <>
      {offline && <div className="offline" role="status">No connection right now — photos will save when it's back.</div>}
      {screen}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
