import { useState } from 'react';
import { getAIConfig, saveAIConfig, providerList } from '../ai/engine.js';
import { addRoutine, updateRoutine, deleteRoutine, restoreItem, purgeItem, exportEvents, EVENT_SCHEMA } from '../lib/db.js';
import { timeAgo } from '../lib/format.js';

export const EVENING_KEY = 'recall-evening-hour';
export function getEveningHour() {
  const v = parseFloat(localStorage.getItem(EVENING_KEY));
  return Number.isFinite(v) ? v : 20.5;
}

// Deliberately small. Nothing here is needed for daily use.
// In the MVP most of this moves to the caregiver's device.
export default function Settings({ routines, removed = [], onBack, onConfigSaved, onEveningChanged }) {
  const [cfg, setCfg] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const [evening, setEvening] = useState(getEveningHour());
  const [newName, setNewName] = useState('');
  const [newWindow, setNewWindow] = useState('evening');
  const [stored, setStored] = useState(getAIConfig()); // what is actually persisted, not the draft
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);
  const providers = providerList();
  const current = providers.find((p) => p.id === cfg.provider);

  const mask = (k) => (k.length <= 10 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`);

  function save() {
    saveAIConfig(cfg);
    setStored(getAIConfig()); // re-read, so the line below reflects storage, not hope
    setSaved(true);
    setTest(null);
    setTimeout(() => setSaved(false), 1500);
    onConfigSaved();
  }

  async function runTest() {
    setTesting(true);
    setTest(null);
    try {
      const { AIEngine } = await import('../ai/engine.js');
      setTest(await new AIEngine(getAIConfig()).testKey());
    } catch (err) {
      setTest({ ok: false, message: String(err && err.message ? err.message : err) });
    }
    setTesting(false);
  }

  function saveEvening(v) {
    setEvening(v);
    localStorage.setItem(EVENING_KEY, String(v));
    onEveningChanged(v);
  }

  async function downloadEvents() {
    const events = await exportEvents();
    const blob = new Blob([JSON.stringify({ schema: EVENT_SCHEMA, exportedAt: new Date().toISOString(), events }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recall-events-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  const hours = [];
  for (let h = 18; h <= 23; h += 0.5) hours.push(h);
  const label = (h) => `${Math.floor(h) > 12 ? Math.floor(h) - 12 : Math.floor(h)}:${h % 1 ? '30' : '00'} pm`;

  return (
    <div className="settings">
      {/* Settings is an admin screen, not Margaret's daily path, so it follows ordinary
          app convention: Back at the top, always visible, no scrolling to leave. Her own
          screens keep the big bottom Back, which is where a thumb rests. */}
      <div className="topbar">
        <button className="topback" onClick={onBack}>‹ Back</button>
        <h2 style={{ margin: 0 }}>Settings</h2>
      </div>

      <div className="card">
        <h3>What the app asks for</h3>
        <p className="sub">Morning items appear until noon. Bedtime items appear from the hour below until morning.</p>
        {routines.map((r) => (
          <div className="check-row" key={r.id}>
            <span className="nm">
              <input className="inline-name" value={r.name} onChange={(e) => updateRoutine(r.id, { name: e.target.value })} />
              <small>{r.window === 'morning' ? 'morning' : 'bedtime'}{r.active === false ? ' · off' : ''}</small>
            </span>
            <span>
              <button onClick={() => updateRoutine(r.id, { active: r.active === false })}>{r.active === false ? 'On' : 'Off'}</button>
              <button onClick={() => { if (confirm(`Remove "${r.name}"?`)) deleteRoutine(r.id); }}>Remove</button>
            </span>
          </div>
        ))}
        <div className="add-row">
          <input value={newName} placeholder="Add one, e.g. Feed the cat" onChange={(e) => setNewName(e.target.value)} />
          <select value={newWindow} onChange={(e) => setNewWindow(e.target.value)}>
            <option value="morning">morning</option>
            <option value="evening">bedtime</option>
          </select>
          <button disabled={!newName.trim()} onClick={() => {
            addRoutine({ name: newName.trim(), window: newWindow, type: 'generic', order: 50, instruction: `Show me: ${newName.trim().toLowerCase()}.` });
            setNewName('');
          }}>Add</button>
        </div>
        <label>Bedtime check starts at</label>
        <select value={evening} onChange={(e) => saveEvening(parseFloat(e.target.value))}>
          {hours.map((h) => <option key={h} value={h}>{label(h)}</option>)}
        </select>
      </div>

      <div className="card">
        <h3>AI engine</h3>
        <label>Provider</label>
        <select value={cfg.provider} onChange={(e) => setCfg({ ...cfg, provider: e.target.value, model: '' })}>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <label>API key (stays on this device only)</label>
        <input type="password" value={cfg.apiKey} placeholder="paste your key here"
          onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value.trim() })} />
        <label>Model (blank = default: {current?.defaultModel})</label>
        <input value={cfg.model} placeholder={current?.defaultModel}
          onChange={(e) => setCfg({ ...cfg, model: e.target.value.trim() })} />
        <div style={{ marginTop: 14 }}>
          <button className="btn-primary" onClick={save}>{saved ? '✓ Saved' : 'Save AI settings'}</button>
        </div>

        {/* A saved key and a WORKING key are different things, and the difference used to
            be invisible: a rejected key, a dead network and an empty account all looked
            identical — the app just seemed not to try. So: say what is stored, and offer
            one real round-trip that reports the actual reason when it fails. */}
        <div className="key-status">
          {stored.apiKey
            ? <>Stored on this device: <b>{mask(stored.apiKey)}</b> · {stored.provider}</>
            : <>No key stored on this device yet.</>}
        </div>
        <button className="btn-secondary" disabled={!stored.apiKey || testing} onClick={runTest}>
          {testing ? 'Checking…' : 'Check the key works'}
        </button>
        {test && (
          <div className={test.ok ? 'key-ok' : 'key-bad'}>
            {test.ok ? '✓ ' : '✕ '}{test.message}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Research log</h3>
        <p className="sub">Every photo, question, correction and check is logged silently with exact times. Nothing is shown to the person as a number.</p>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
      </div>

      {/* Nothing a person removes is destroyed until someone here says so. */}
      <div className="card">
        <h3>Recently removed</h3>
        {removed.length === 0 ? (
          <p className="sub">Nothing has been removed.</p>
        ) : removed.map((it) => (
          <div className="check-row" key={it.id}>
            <div className="nm">
              {it.name}
              <small>{it.location || 'no place'} · removed {timeAgo(it.deletedAt)}</small>
            </div>
            <button onClick={() => restoreItem(it.id)}>Put back</button>
            <button onClick={() => { if (confirm(`Delete ${it.name.toLowerCase()} and its photos for good?\n\nThis cannot be undone.`)) purgeItem(it); }}>
              Delete for good
            </button>
          </div>
        ))}
      </div>

      {/* Which build am I actually looking at? Without this, "the new feature isn't there"
          and "my phone is serving a cached copy" are indistinguishable. */}
      <p className="note-quiet" style={{ marginTop: 18 }}>
        Build {typeof __BUILD__ === 'string' ? __BUILD__ : 'unknown'}
        {' · '}
        <button
          className="link-btn" style={{ display: 'inline', padding: 0 }}
          onClick={async () => {
            if (navigator.serviceWorker) {
              const rs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(rs.map((r) => r.unregister()));
            }
            if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
            location.reload(true);
          }}
        >
          get the latest version
        </button>
      </p>
    </div>
  );
}
