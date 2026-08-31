import { useEffect, useMemo, useState } from 'react';
import { ensureSignedIn } from './lib/firebase.js';
import { watchItems } from './lib/db.js';
import { AIEngine, getAIConfig } from './ai/engine.js';
import Home from './components/Home.jsx';
import CaptureFlow from './components/CaptureFlow.jsx';
import AnswerView from './components/AnswerView.jsx';
import RecentReel from './components/RecentReel.jsx';
import Settings from './components/Settings.jsx';
import Onboarding, { markStarterDone } from './components/Onboarding.jsx';

const ONBOARD_KEY = 'recall-onboarded';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [cfgVersion, setCfgVersion] = useState(0);
  const [route, setRoute] = useState({ view: 'home' });

  const engine = useMemo(() => new AIEngine(getAIConfig()), [cfgVersion]);

  useEffect(() => {
    let unsub = () => {};
    ensureSignedIn()
      .then(() => { unsub = watchItems(setItems); setReady(true); })
      .catch((e) => setError(String(e)));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (ready && items.length === 0 && !localStorage.getItem(ONBOARD_KEY) && route.view === 'home') {
      setRoute({ view: 'onboarding' });
    }
  }, [ready]); // eslint-disable-line

  if (error) return <div className="boot">Couldn't connect: {error}</div>;
  if (!ready) return <div className="boot">Opening ReCall…</div>;

  // Keep answer views fresh against live data
  const liveItem = (it) => items.find((x) => x.id === it?.id) || it;
  const go = (view, extra = {}) => setRoute({ view, ...extra });

  switch (route.view) {
    case 'onboarding':
      return (
        <Onboarding
          onCaptureStarter={(name) => go('capture', { hintName: name, pinned: true, from: 'onboarding' })}
          onFinish={() => { localStorage.setItem(ONBOARD_KEY, '1'); go('home'); }}
        />
      );
    case 'capture':
      return (
        <CaptureFlow
          engine={engine}
          hintName={route.hintName || ''}
          pinned={!!route.pinned}
          resnapOf={route.resnapOf ? liveItem(route.resnapOf) : null}
          onCancel={() => go(route.from === 'onboarding' ? 'onboarding' : 'home')}
          onDone={(item) => {
            if (route.from === 'onboarding') { markStarterDone(route.hintName); go('onboarding'); }
            else go('answer', { item, message: 'Saved.' });
          }}
        />
      );
    case 'answer':
      return (
        <AnswerView
          item={liveItem(route.item)}
          alternates={(route.alternates || []).map(liveItem)}
          message={route.message || ''}
          onBack={() => go('home')}
          onResnap={(item) => go('capture', { resnapOf: item })}
          onOpenItem={(item) => go('answer', { item })}
          onAdd={() => go('capture')}
        />
      );
    case 'recent':
      return <RecentReel items={items} onBack={() => go('home')} onOpenItem={(item) => go('answer', { item })} />;
    case 'settings':
      return <Settings items={items} onBack={() => go('home')} onConfigSaved={() => setCfgVersion((v) => v + 1)} />;
    default:
      return (
        <Home
          items={items}
          engine={engine}
          onNav={go}
          onOpenItem={(item) => go('answer', { item })}
          onCapture={() => go('capture')}
          onAskResult={({ matches, message }) =>
            go('answer', matches.length
              ? { item: matches[0], alternates: matches.slice(1), message }
              : { item: null, message })}
        />
      );
  }
}
