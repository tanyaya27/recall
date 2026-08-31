import { useState } from 'react';
import { getAIConfig, saveAIConfig, providerList } from '../ai/engine.js';
import { updateItem, exportEvents } from '../lib/db.js';

export default function Settings({ items, onBack, onConfigSaved }) {
  const [cfg, setCfg] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const providers = providerList();
  const current = providers.find((p) => p.id === cfg.provider);

  function save() {
    saveAIConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onConfigSaved();
  }

  async function downloadEvents() {
    const events = await exportEvents();
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recall-events-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  return (
    <div className="settings">
      <button className="back" onClick={onBack}>‹ Home</button>
      <h2>Settings</h2>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>AI engine</h2>
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
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Home screen tiles</h2>
        <p className="sub">Pinned items show as big one-tap tiles.</p>
        {items.map((it) => (
          <div className="check-row" key={it.id}>
            <span className="nm">{it.name}</span>
            <button onClick={() => updateItem(it.id, { pinned: !it.pinned })}>
              {it.pinned ? 'Unpin' : 'Pin'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>For the test week</h2>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
        <p className="sub" style={{ marginTop: 10 }}>
          Shared household vault: everyone using this app sees the same items. Private
          accounts and caregiver roles come in the next version.
        </p>
      </div>
    </div>
  );
}
