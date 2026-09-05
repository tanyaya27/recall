import { useState } from 'react';
import { getAIConfig, saveAIConfig, providerList, AIEngine } from '../ai/engine.js';
import { restoreItem, purgeItem, exportEvents, EVENT_SCHEMA } from '../lib/db.js';
import { timeAgo } from '../lib/format.js';
import { getPrefs, savePrefs, THEMES, SIZES } from '../lib/prefs.js';
import Header from './Header.jsx';

// Settings — reduced to what setup needs. Board decision 2026-09-05, screen 6.
//
// This is a helper's screen, opened once. AI key + "Check the key works" (the two-step
// diagnostic that separates "can this phone reach the service" from "is this key good"),
// Recently removed, the research export for Tanya, the build stamp. The routine editor is
// gone until the helper's device is built. Actions sit in the flow — a keyboard opens here.
// Set before a deliberate reload so App reopens Settings instead of Home.
export const RETURN_KEY = 'recall-return-to';
export function takeReturnRoute() {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    if (v) sessionStorage.removeItem(RETURN_KEY);
    return v || null;
  } catch { return null; }
}

export default function Settings({ removed = [], onBack, onConfigSaved, justReloaded = false }) {
  const [cfg, setCfg] = useState(getAIConfig());
  const [stored, setStored] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [prefs, setPrefs] = useState(getPrefs());
  const providers = providerList();
  const setPref = (k, v) => { const p = { ...prefs, [k]: v }; setPrefs(p); savePrefs(p); };
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

  async function downloadEvents() {
    const events = await exportEvents();
    const blob = new Blob([JSON.stringify({ schema: EVENT_SCHEMA, exportedAt: new Date().toISOString(), events }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recall-events-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  return (
    <div className="screen settings">
      <Header title="Settings" onBack={onBack} />

      {/* Per-phone. The palette picker is here so Tanya can compare on a real phone;
          text size is a user preference and scales buttons and tap targets with the text. */}
      <div className="card">
        <h3>Look</h3>
        <label>Text size</label>
        <div className="seg">
          {SIZES.map((s) => (
            <button key={s.id} className={prefs.size === s.id ? 'on' : ''} onClick={() => setPref('size', s.id)}>{s.label}</button>
          ))}
        </div>
        <label>Colours</label>
        <div className="seg">
          {THEMES.map((t) => (
            <button key={t.id} className={prefs.theme === t.id ? 'on' : ''} onClick={() => setPref('theme', t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>AI key</h3>
        <label>Provider</label>
        <select value={cfg.provider} onChange={(e) => setCfg({ ...cfg, provider: e.target.value, model: '' })}>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <label>API key (stays on this phone only)</label>
        <input type="password" value={cfg.apiKey} placeholder="paste the key here"
          onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value.trim() })} />
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

      <div className="card">
        <h3>Recently removed</h3>
        {removed.length === 0 ? <p className="sub">Nothing has been removed.</p> : removed.map((it) => (
          <div className="row" key={it.id}>
            <div className="nm">
              {it.name || 'Unnamed'}
              <small>{it.location || 'no place'} · removed {timeAgo(it.deletedAt)}</small>
            </div>
            <button onClick={() => restoreItem(it.id)}>Put back</button>
            <button onClick={() => { if (confirm(`Delete ${(it.name || 'this').toLowerCase()} and its photos for good?\n\nThis cannot be undone.`)) purgeItem(it); }}>Delete for good</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Research log</h3>
        <p className="sub">Every photo, question and correction is logged silently with exact times. Nothing is ever shown to the person as a number.</p>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
      </div>

      {/* Which build is this phone running? After "get the latest version" the page reloads
          and comes BACK HERE (App reads RETURN_KEY) and says so — a reload that lands on
          Home tells the person nothing about whether anything changed. Ravi, 2026-09-05. */}
      <div className="card">
        <h3>Version</h3>
        <p className="sub">This phone has the build from <b>{buildLabel()}</b>.</p>
        {justReloaded && <p className="sub" style={{ color: 'var(--accent)' }}>Reloaded just now. If the time above did not change, this is already the latest.</p>}
        <button className="btn-secondary" onClick={async () => {
          try { sessionStorage.setItem(RETURN_KEY, 'settings'); } catch { /* fine */ }
          if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
          if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
          location.reload();
        }}>Get the latest version</button>
      </div>
    </div>
  );
}
