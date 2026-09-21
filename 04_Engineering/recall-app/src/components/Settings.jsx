import { useEffect, useState } from 'react';
import { getAIConfig, saveAIConfig, providerList, AIEngine } from '../ai/engine.js';
import Header from './Header.jsx';
import { currentUser, isAnonymous, signIn } from '../lib/auth.js';
import { legacyCount } from '../lib/db.js';

// Settings — reduced to what setup needs. Board decision 2026-09-05, screen 6; platform
// audit V5: this is the one screen where "looks like the phone's Settings" is exactly
// right, so it is grouped sections with a small title above each, rows, one action per
// row. A helper's screen, opened once; actions sit in the flow because a keyboard opens.
export const RETURN_KEY = 'recall-return-to';
const PREV_BUILD_KEY = 'recall-prev-build';
const INSTALLED_KEY = 'recall-installed';
// When did THIS build first run on this phone? Recorded once per build, at app start.
export function noteInstalled() {
  try {
    const cur = JSON.parse(localStorage.getItem(INSTALLED_KEY) || 'null');
    if (!cur || cur.build !== String(__BUILD__)) localStorage.setItem(INSTALLED_KEY, JSON.stringify({ build: String(__BUILD__), at: Date.now() }));
  } catch { /* fine */ }
}
export function installedAt() {
  try { const cur = JSON.parse(localStorage.getItem(INSTALLED_KEY) || 'null'); return cur && cur.build === String(__BUILD__) ? cur.at : null; } catch { return null; }
}
// The stamp this page loaded with (docs/index.html's ?v=). Comparing it with the stamp the
// server has NOW says whether a newer version exists — without reloading anything.
export function loadedStamp() {
  try {
    const src = [...document.scripts].map((sc) => sc.getAttribute('src') || '').find((x) => /app\.js\?v=/.test(x)) || '';
    return (src.match(/v=([^&]+)/) || [])[1] || '';
  } catch { return ''; }
}
export async function checkForUpdate() {
  const res = await fetch(`./index.html?check=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const server = (html.match(/app\.js\?v=([^"&]+)/) || [])[1] || '';
  const mine = loadedStamp();
  return { server, mine, newer: !!server && !!mine && server !== mine, at: Date.now() };
}
export function takeReturnRoute() {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    if (v) sessionStorage.removeItem(RETURN_KEY);
    return v || null;
  } catch { return null; }
}

// Since round 4 (2026-09-14) this screen is the developer's: Version + AI key. Everything
// for the household moved to the hamburger menu (MenuScreens.jsx). Slated for removal.
export default function Settings({ onBack, onConfigSaved, justReloaded = false }) {
  // Multi-user Phase 1: the developer's view of identity — who this phone is, whether the
  // pre-09-19 docs have been adopted (the rules can flip only at 0), and the sign-in upgrade.
  const [legacy, setLegacy] = useState(null);
  useEffect(() => { let on = true; legacyCount().then((n) => { if (on) setLegacy(n); }).catch(() => { if (on) setLegacy('?'); }); return () => { on = false; }; }, []);
  const user = currentUser();
  const [cfg, setCfg] = useState(getAIConfig());
  const [stored, setStored] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showModel, setShowModel] = useState(false);
  // Update state: what happened on the reload we came back from, and whether the server has a newer stamp.
  const [reloadResult] = useState(() => {
    if (!justReloaded) return null;
    try {
      const prev = sessionStorage.getItem(PREV_BUILD_KEY); sessionStorage.removeItem(PREV_BUILD_KEY);
      if (!prev) return null;
      return prev !== String(__BUILD__) ? 'updated' : 'same';
    } catch { return null; }
  });
  const [update, setUpdate] = useState(null); // null = checking · { newer, server, mine } · 'failed'
  useEffect(() => {
    let alive = true;
    checkForUpdate().then((r) => { if (alive) setUpdate(r); }, () => { if (alive) setUpdate('failed'); });
    return () => { alive = false; };
  }, [justReloaded]);
  const providers = providerList();
  // What happened the last time the app opened — stages and timings. This is how a hang on
  // "Opening ReCall…" gets diagnosed instead of guessed at.
  const lastBoot = (() => {
    try {
      const b = JSON.parse(localStorage.getItem('recall-last-boot') || 'null');
      if (!b || !b.stages) return '';
      return b.stages.map((s) => `${s.stage} ${(s.ms / 1000).toFixed(1)}s`).join(' → ');
    } catch { return ''; }
  })();
  const current = providers.find((p) => p.id === cfg.provider);

  const mask = (k) => (k.length <= 10 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`);

  function buildLabel() {
    if (typeof __BUILD__ !== 'string') return 'unknown';
    const d = new Date(__BUILD__);
    return Number.isNaN(d.getTime()) ? __BUILD__ : d.toLocaleString();
  }

  function save() {
    saveAIConfig(cfg);
    setStored(getAIConfig());
    setSaved(true); setTest(null);
    setTimeout(() => setSaved(false), 1500);
    onConfigSaved();
  }

  // STEP 1: can this device reach the service at all? STEP 2: does this key work?
  // Two different fixes, so two different answers. Never "you are offline" unless the
  // browser itself says so (LESSONS.md).
  async function runTest() {
    setTesting(true); setTest(null);
    try {
      const eng = new AIEngine(getAIConfig());
      const reach = await eng.probeReach();
      if (!reach.reached) {
        setTest({ ok: false, raw: reach.raw,
          message: 'STEP 1 FAILED — this device never reached the AI service. The request did not leave the phone, so this is not about the key. Likely a content blocker, a VPN or iCloud Private Relay, Lockdown Mode, or a leftover offline worker. Compare with ordinary Safari.' });
        setTesting(false);
        return;
      }
      const t = await eng.testKey();
      setTest({ ...t, message: t.ok
        ? `STEP 1 ok — reached the service. STEP 2 ok — ${t.message}`
        : `STEP 1 ok — the service answered, so the network is fine. STEP 2 FAILED — ${t.message}` });
    } catch (err) {
      setTest({ ok: false, message: String(err && err.message ? err.message : err) });
    }
    setTesting(false);
  }

  return (
    <div className="screen settings">
      <Header title="Settings" onBack={onBack} />
      {/* Version FIRST (Ravi, round 4): it is the card the developer comes here for, and the
          reload must not land on a page that has to be scrolled. */}
      {/* After "Get the latest version" the page reloads and comes BACK HERE and says so —
          a reload that lands on Home tells the person nothing about whether anything changed. */}
      <div className="group-title">Version</div>
      <div className="group">
        <div className="grow">
          {/* Round 4 (Ravi): say OUTRIGHT what the reload did, and whether a newer version exists. */}
          {reloadResult === 'updated' && <div className="banner ok">New version installed — built {buildLabel()}.</div>}
          {reloadResult === 'same' && <div className="banner">No newer version was found. This phone already has the latest, built {buildLabel()}.</div>}
          {/* Facts only (Ravi, round 4): what build this is, when it landed on this phone, and
              when the server was last asked. Never "this is the latest" — one check is not
              proof, and a cached or failed check would make it a lie. */}
          <p className="sub">Build: <b>{buildLabel()}</b>{installedAt() && <><br />Installed on this phone: <b>{new Date(installedAt()).toLocaleString()}</b></>}</p>
          {update === null && <p className="note-quiet left">Asking the server for a newer version…</p>}
          {update === 'failed' && <p className="note-quiet left">Could not reach the server to check for a newer version.</p>}
          {update && update !== 'failed' && (update.newer
            ? <div className="banner amber">A newer version is available. Tap below to get it.</div>
            : <p className="note-quiet left">Server checked {new Date(update.at).toLocaleTimeString()} — no newer version seen then.</p>)}
          <button className="btn-secondary" onClick={async () => {
            try { sessionStorage.setItem(RETURN_KEY, 'settings'); sessionStorage.setItem(PREV_BUILD_KEY, String(__BUILD__)); } catch { /* fine */ }
            if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
            if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
            // A fresh navigation with a new query, not reload(): it fetches index.html past
            // any cache and is a different load path from the one that hung on 09-05.
            location.replace(location.pathname + '?v=' + Date.now());
          }}>{update && update !== 'failed' && update.newer ? 'Get the newer version' : 'Get the latest version'}</button>
          {lastBoot && (
            <p className="note-quiet left">Last open: {lastBoot}</p>
          )}
        </div>
      </div>


      <div className="group-title">Account</div>
      <div className="group"><div className="grow account">
        <p className="sub">{isAnonymous() ? 'This phone is not signed in — your things live on this phone until you sign in or share.' : <>Signed in as <b>{(user && user.displayName) || 'you'}</b>.</>}<br />ID: <code className="uid">{user ? user.uid : '…'}</code><br />Legacy docs left: <b>{legacy === null ? '…' : legacy}</b></p>
        {isAnonymous() && (
          <div className="seg">
            <button onClick={() => signIn('apple')}>Sign in with Apple</button>
            <button onClick={() => signIn('google')}>Sign in with Google</button>
          </div>
        )}
      </div></div>
      <div className="group-title">AI key</div>
      <div className="group">
        <div className="grow">
          <label>Provider</label>
          <select value={cfg.provider} onChange={(e) => setCfg({ ...cfg, provider: e.target.value, model: '' })}>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="grow">
          <label>API key (stays on this phone only)</label>
          <input type="password" value={cfg.apiKey} placeholder="paste the key here"
            onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value.trim() })} />
        </div>
        <div className="grow">
          {!showModel ? (
            <p className="note-quiet left">
              Model: <b>{cfg.model || `default (${current?.defaultModel})`}</b>{' '}
              <button type="button" className="link-btn inline" onClick={() => setShowModel(true)}>change</button>
            </p>
          ) : (
            <>
              <label>Model — leave blank unless you know the exact model name. This is NOT where the key goes.</label>
              <input value={cfg.model} placeholder={current?.defaultModel} onChange={(e) => setCfg({ ...cfg, model: e.target.value.trim() })} />
              <button type="button" className="btn-quiet" onClick={() => setCfg({ ...cfg, model: '' })}>Use the default model</button>
            </>
          )}
          <button className="btn-primary" onClick={save}>{saved ? '✓ Saved' : 'Save'}</button>
          <div className="key-status">
            {stored.apiKey ? <>Stored on this phone: <b>{mask(stored.apiKey)}</b> · {stored.provider}</> : <>No key stored on this phone yet.</>}
          </div>
          <button className="btn-secondary" disabled={!stored.apiKey || testing} onClick={runTest}>
            {testing ? 'Checking…' : 'Check the key works'}
          </button>
          {test && (
            <div className={test.ok ? 'key-ok' : 'key-bad'}>
              {test.ok ? '✓ ' : '✕ '}{test.message}
              {test.raw && test.raw !== test.message && <div className="raw">{test.raw}</div>}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
