import { useState } from 'react';
import { getAIConfig, saveAIConfig, providerList } from '../ai/engine.js';
import { addRoutine, updateRoutine, deleteRoutine, exportEvents, EVENT_SCHEMA } from '../lib/db.js';

export const EVENING_KEY = 'recall-evening-hour';
export function getEveningHour() {
  const v = parseFloat(localStorage.getItem(EVENING_KEY));
  return Number.isFinite(v) ? v : 20.5;
}

// Deliberately small. Nothing here is needed for daily use.
// In the MVP most of this moves to the caregiver's device.
export default function Settings({ routines, onBack, onConfigSaved, onEveningChanged }) {
  const [cfg, setCfg] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const [evening, setEvening] = useState(getEveningHour());
  const [newName, setNewName] = useState('');
  const [newWindow, setNewWindow] = useState('evening');
  const providers = providerList();
  const current = providers.find((p) => p.id === cfg.provider);

  function save() {
    saveAIConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onConfigSaved();
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
      <h2>Settings</h2>

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
      </div>

      <div className="card">
        <h3>Research log</h3>
        <p className="sub">Every photo, question, correction and check is logged silently with exact times. Nothing is shown to the person as a number.</p>
        <button className="btn-secondary" onClick={downloadEvents}>Download usage log (JSON)</button>
      </div>

      <button className="btn-back" onClick={onBack}>Back</button>
    </div>
  );
}
