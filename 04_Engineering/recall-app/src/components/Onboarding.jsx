import { useState } from 'react';
import { logEvent } from '../lib/db.js';

// UC-1: starter checklist. Each row launches a pinned capture pre-hinted with the item name.
export const STARTER_ITEMS = ['Keys', 'Wallet', 'Glasses', 'Phone', 'Medications', 'TV remote', 'Hearing aids', 'Bag or purse'];
const DONE_KEY = 'recall-starter-done';

export function getStarterDone() {
  try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch { return {}; }
}
export function markStarterDone(name) {
  const d = getStarterDone(); d[name] = true;
  localStorage.setItem(DONE_KEY, JSON.stringify(d));
}

export default function Onboarding({ onCaptureStarter, onFinish }) {
  const [done] = useState(getStarterDone());
  const doneCount = STARTER_ITEMS.filter((n) => done[n]).length;

  return (
    <div>
      <h1>Welcome to ReCall</h1>
      <p className="sub">
        Let's photograph the things you look for most, right where they usually live.
        Five minutes now makes the app useful today. Skip anything you like.
      </p>
      {STARTER_ITEMS.map((name) => (
        <div className="check-row" key={name}>
          <span className="nm">{name}</span>
          {done[name]
            ? <span className="done">✓ saved</span>
            : <button onClick={() => onCaptureStarter(name)}>📷 Add</button>}
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <button className="btn-primary" onClick={() => { logEvent('onboarding_done', { count: doneCount }); onFinish(); }}>
          {doneCount > 0 ? "Done — take me home" : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
