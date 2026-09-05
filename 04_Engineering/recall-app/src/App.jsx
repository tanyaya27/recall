import { useEffect, useMemo, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchAll, seedRoutinesIfEmpty, replacePinned, logEvent } from './lib/db.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import Home from './components/Home.jsx';
import CaptureFlow from './components/CaptureFlow.jsx';
import AnswerView, { CheckView, PinReplace } from './components/AnswerView.jsx';
import RecentReel from './components/RecentReel.jsx';
import Settings, { getEveningHour } from './components/Settings.jsx';
import Onboarding, { markStarterDone, STARTER_ITEMS } from './components/Onboarding.jsx';

const ONBOARD_KEY = 'recall-onboarded';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ items: [], routines: [], checks: [], removed: [] });
  const [cfgVersion, setCfgVersion] = useState(0);
  const [eveningHour, setEveningHour] = useState(getEveningHour());
  const [route, setRoute] = useState({ view: 'home' });
  const [, tick] = useState(0);

  const engine = useMemo(() => new AIEngine(getAIConfig()), [cfgVersion]);
  const { items, routines, checks, removed } = data;

  // Ask the browser not to evict our storage. The AI key lives in localStorage, and iOS
  // clears it for sites it thinks are idle — which is exactly how the key kept vanishing.
  // Also force a service-worker update check on every open so an installed app can never
  // sit on a stale build.
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); }).catch(() => {});
    }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations()
        .then((rs) => rs.forEach((r) => r.update()))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    let seeded = false;
    ensureSignedIn()
      .then(() => {
        unsub = watchAll((d) => {
          setData(d);
          if (!seeded) { seeded = true; seedRoutinesIfEmpty(d.routines); }
        });
        setReady(true);
        logEvent('app_open', { itemCount: 0 });
      })
      .catch((e) => setError(String(e)));
    // Re-render every minute so the date line and the clock-shaped home stay right
    const iv = setInterval(() => tick((n) => n + 1), 60000);
    return () => { unsub(); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (ready && items.length === 0 && !localStorage.getItem(ONBOARD_KEY) && route.view === 'home') {
      setRoute({ view: 'onboarding' });
    }
  }, [ready]); // eslint-disable-line

  if (error) return <div className="boot">Couldn't connect: {error}</div>;
  if (!ready) return <div className="boot">Opening ReCall…</div>;

  const liveItem = (it) => items.find((x) => x.id === it?.id) || it;
  const liveRoutine = (r) => routines.find((x) => x.id === r?.id) || r;
  const go = (view, extra = {}) => { window.scrollTo(0, 0); setRoute({ view, ...extra }); };

  switch (route.view) {
    case 'onboarding':
      return (
        <Onboarding
          onCaptureStarter={(name) => go('capture', {
            hintName: name, pinnedOrder: STARTER_ITEMS.indexOf(name), from: 'onboarding', initiatedBy: 'starter',
          })}
          onFinish={() => { localStorage.setItem(ONBOARD_KEY, '1'); go('home'); }}
        />
      );
    case 'capture':
      return (
        <CaptureFlow
          engine={engine}
          items={items}
          hintName={route.hintName || ''}
          pinnedOrder={route.pinnedOrder ?? null}
          resnapOf={route.resnapOf ? liveItem(route.resnapOf) : null}
          routine={route.routine ? liveRoutine(route.routine) : null}
          initiatedBy={route.initiatedBy || 'self'}
          onCancel={() => go(route.from === 'onboarding' ? 'onboarding' : 'home')}
          onDone={(result) => {
            if (route.from === 'onboarding') { markStarterDone(route.hintName); go('onboarding'); return; }
            if (result.kind === 'check') { go('home'); return; }
            go('answer', { item: result.item, message: `Your ${result.item.name.toLowerCase()} — saved.` });
          }}
        />
      );
    case 'answer':
      return (
        <AnswerView
          item={route.item ? liveItem(route.item) : null}
          items={items}
          alternates={(route.alternates || []).map(liveItem)}
          message={route.message || ''}
          onBack={() => go('home')}
          onResnap={(item) => go('capture', { resnapOf: item })}
          onOpenItem={(item) => go('answer', { item })}
          onAdd={() => go('capture')}
          onPinFull={(item) => go('pin-replace', { item })}
        />
      );
    case 'pin-replace':
      return (
        <PinReplace
          item={liveItem(route.item)} items={items}
          onPick={async (victim) => { await replacePinned(liveItem(route.item), victim); logEvent('pin', { itemId: route.item.id, result: 'replaced', replacedId: victim.id }); go('answer', { item: route.item, message: 'Kept at the top.' }); }}
          onBack={() => go('answer', { item: route.item })}
        />
      );
    case 'check':
      return (
        <CheckView
          routine={liveRoutine(route.routine)} check={route.check}
          onAgain={(r) => go('capture', { routine: r, initiatedBy: 'prompt' })}
          onBack={() => go('home')}
        />
      );
    case 'recent':
      return <RecentReel items={items} onBack={() => go('home')} onOpenItem={(item) => go('answer', { item })} />;
    case 'settings':
      return (
        <Settings
          routines={routines}
          removed={removed}
          onBack={() => go('home')}
          onConfigSaved={() => setCfgVersion((v) => v + 1)}
          onEveningChanged={setEveningHour}
        />
      );
    default:
      return (
        <Home
          items={items} routines={routines} checks={checks} engine={engine} eveningHour={eveningHour}
          onNav={go}
          onOpenItem={(item) => go('answer', { item })}
          onOpenRoutine={(r, check) => (check ? go('check', { routine: r, check }) : go('capture', { routine: r, initiatedBy: 'prompt' }))}
          onCapture={() => go('capture')}
          onAskResult={({ matches, message }) =>
            go('answer', matches.length
              ? { item: matches[0], alternates: matches.slice(1), message }
              : { item: null, message })}
        />
      );
  }
}
