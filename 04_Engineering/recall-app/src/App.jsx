import { useEffect, useMemo, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchAll, logEvent } from './lib/db.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import Board from './components/Board.jsx';
import PhotoCard from './components/PhotoCard.jsx';
import ThingCard from './components/ThingCard.jsx';
import Ask from './components/Ask.jsx';
import Settings from './components/Settings.jsx';

// Board decision 2026-09-05: depth one. Home (the board) and one card. Every card returns
// to Home. Routines and checks are still read from the vault but not shown — they return
// with the helper's device. Nothing is seeded on first load.
export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ items: [], routines: [], checks: [], removed: [] });
  const [cfgVersion, setCfgVersion] = useState(0);
  const [route, setRoute] = useState({ view: 'home' });
  const [, tick] = useState(0);

  const engine = useMemo(() => new AIEngine(getAIConfig()), [cfgVersion]);
  const { items, removed } = data;

  // Ask the browser not to evict our storage (the key lives in localStorage and iOS clears
  // idle sites); force any leftover service worker to update.
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); }).catch(() => {});
    }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.update())).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    ensureSignedIn()
      .then(() => {
        unsub = watchAll(setData);
        setReady(true);
        logEvent('app_open', {});
      })
      .catch((e) => setError(String(e)));
    const iv = setInterval(() => tick((n) => n + 1), 60000); // keep the day line right
    return () => { unsub(); clearInterval(iv); };
  }, []);

  if (error) return <div className="boot">Couldn't connect: {error}</div>;
  if (!ready) return <div className="boot">Opening ReCall…</div>;

  const live = (it) => items.find((x) => x.id === it?.id) || it;
  const go = (view, extra = {}) => { window.scrollTo(0, 0); setRoute({ view, ...extra }); };
  const home = () => go('home');

  switch (route.view) {
    case 'photo':
      return (
        <PhotoCard
          key={route.key}
          file={route.file} engine={engine} items={items}
          resnapOf={route.resnapOf ? live(route.resnapOf) : null}
          onDone={home} onCancel={home}
        />
      );
    case 'thing':
      return (
        <ThingCard
          item={live(route.item)} items={items}
          onBack={home}
          onFoundFile={(file) => go('photo', { file, resnapOf: route.item, key: Date.now() })}
        />
      );
    case 'ask':
      return (
        <Ask
          engine={engine} items={items}
          onResult={(item, file) => (item ? go('thing', { item }) : go('photo', { file, key: Date.now() }))}
          onBack={home}
        />
      );
    case 'settings':
      return <Settings removed={removed} onBack={home} onConfigSaved={() => setCfgVersion((v) => v + 1)} />;
    default:
      return (
        <Board
          items={items} ready={engine.ready}
          onOpenThing={(item) => go('thing', { item })}
          onPhoto={(file) => go('photo', { file, key: Date.now() })}
          onAsk={() => go('ask')}
          onSettings={() => go('settings')}
        />
      );
  }
}
