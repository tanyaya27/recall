// oracle.js — 09-30 (TESTING.md #1): ONE truth for "where is it", computed from what is stored, and every screen that
// shows it must agree — the same tiers, in the same order, written the same way (the "in" pill between tiers).
// Used by journeys.js and monkey.js (and any suite built on tiers_head.js):
//   const O = require('./oracle.js')({ page, PORT, tap });
//   const bad = await O.check('3D model of plant sensor');   // [] when every screen agrees
// A mismatch is a string that says which screen, what it showed, and what the store says.
module.exports = ({ page, PORT, tap }) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().replace(/^in (the )?/i, '').toLowerCase();

  // The truth: the item's open "in" edge, then that box's or place's edge, and so on; a legacy item with only a
  // location text starts from the place of that name.
  async function truth(name) {
    return page.evaluate((n) => {
      const d = window.__rig.dump();
      const live = d.filter((x) => !x.deleted);
      const it = live.find((x) => x.kind === 'item' && (x.name || '').toLowerCase() === n.toLowerCase());
      if (!it) return null;
      const edgeFrom = (id) => live.find((e) => e.kind === 'edge' && e.from === id && !e.until);
      const placeDoc = (nm) => live.find((x) => x.kind === 'place' && (x.name || '').toLowerCase() === (nm || '').toLowerCase());
      const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
      const out = []; const seen = new Set([it.id]);
      let e = edgeFrom(it.id); let curPlace = null;
      if (!e && it.location) { out.push(it.location); curPlace = placeDoc(it.location); }
      for (let k = 0; k < 12; k++) {
        if (e) {
          if (e.to.t === 'thing') { const b = live.find((x) => x.id === e.to.id); if (!b || seen.has(b.id)) break; seen.add(b.id); out.push(cap(b.name)); const be = edgeFrom(b.id); if (be) { e = be; continue; } if (b.location) { out.push(b.location); curPlace = placeDoc(b.location); e = null; } else break; }
          else { out.push(e.to.name); curPlace = placeDoc(e.to.name); e = null; }
        }
        if (!curPlace || seen.has(curPlace.id)) break;
        seen.add(curPlace.id);
        const pe = edgeFrom(curPlace.id); if (!pe) break; e = pe; curPlace = null;
      }
      // 09-30d (Ravi: "seen" vs "moved"): the newest photo OF the item (a Move's copy of the cover is not one), and the last
      // time it changed place — itself (history), or with a box/place it is in (a link that replaced an earlier one).
      const shots = live.filter((x) => x.kind === 'snap' && x.itemId === it.id && !x.moved).map((x) => x.at || 0);
      const lastPhoto = it.photo ? Math.max(it.seenAt || 0, ...shots, shots.length ? 0 : (it.createdAt || 0)) : 0;
      let lastMove = 0; const h = []; (it.history || []).forEach((x) => { if (x.undo && h.length > 1) h.pop(); else if (!x.undo) h.push(x); });
      for (let i = h.length - 1; i > 0; i--) { const a = (h[i - 1].location || '').trim().toLowerCase(), b = (h[i].location || '').trim().toLowerCase(); if (a && b && a !== b) { lastMove = h[i].at || 0; break; } }
      const moved = (id) => { const e = edgeFrom(id); return e && e.how !== 'undo' && d.some((x) => x.kind === 'edge' && x.from === id && x.until && x.id !== e.id && Math.abs(x.until - (e.since || 0)) < 5000) ? e.since || 0 : 0; };
      lastMove = Math.max(lastMove, moved(it.id), ...[...seen].filter((id) => id !== it.id).map(moved));
      return { id: it.id, chain: out, lastPhoto, lastMove };
    }, name);
  }

  async function openItem(name) {
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.board'); await page.waitForTimeout(300);
    await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask');
    await page.fill('#ask-input', name); await page.waitForTimeout(350);
    const tile = await page.evaluate((n) => { const t = [...document.querySelectorAll('.ask .tile')].find((x) => (x.querySelector('.tile-label') || x).innerText.split('\n')[0].trim().toLowerCase() === n.toLowerCase());
      return t ? { i: [...document.querySelectorAll('.ask .tile')].indexOf(t), sub: (t.querySelector('.tile-sub') || {}).innerText || '' } : null; }, name);
    if (!tile) return { tile: null };
    await page.locator('.ask .tile').nth(tile.i).click(); await page.waitForSelector('.card.thing'); await page.waitForTimeout(350);
    return { tile };
  }

  // Every screen, read the way a person would see it.
  async function screens(name) {
    const out = {};
    const { tile } = await openItem(name);
    out.tile = tile ? tile.sub : null;
    out.page = await page.evaluate(() => {
      const w = document.querySelector('.tp-wh'); if (!w) return null;
      const chainEl = w.querySelector('.tp-chain');
      const words = chainEl ? [...chainEl.querySelectorAll('.cp')].map((c) => [...c.children].filter((x) => !x.classList.contains('in')).map((x) => x.innerText).join(' ')) : [(w.querySelector('.tx b') || {}).innerText || ''];
      return { none: w.classList.contains('none'), words, squares: w.querySelectorAll('.ch .st').length, pillsSq: w.querySelectorAll('.ch .in').length, pillsW: chainEl ? chainEl.querySelectorAll('.in').length : 0,
        plainSeparators: /·/.test(chainEl ? chainEl.innerText : ''), when: ((w.parentNode || w).querySelector('.tp-wh ~ small, .tp-wh small') || {}).innerText || '' };
    });
    // Move it: the camera opens on everything already known; Cancel leaves it untouched.
    const mv = page.locator('button:has-text("Move it"), button:has-text("Put it somewhere")');
    if (await mv.count()) {
      await mv.first().click(); await page.waitForSelector('.lc'); await page.waitForTimeout(700);
      out.camera = await page.evaluate(() => ({ squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => (b.getAttribute('aria-label') || '').replace(/^Level \d+: /, '')),
        chain: [...document.querySelectorAll('.lc-chainline .cp')].map((c) => [...c.querySelectorAll('span:not(.lc-in)')].map((x) => x.innerText).join(' ').trim()) }));
      await page.click('.lc-x'); await page.waitForTimeout(350);
      if (await page.locator('text=Throw away').count()) { await page.click('text=Throw away'); await page.waitForTimeout(300); }
    }
    return out;
  }

  // Compare. Returns a list of plain-words mismatches.
  async function check(name, { label = '' } = {}) {
    const t = await truth(name);
    if (!t) return [`${label}${name}: not in the store`];
    const s = await screens(name);
    const want = t.chain.map(norm);
    const bad = [];
    const say = (where, got) => bad.push(`${label}${name} — ${where} shows [${got.join(' in ')}], the store says [${t.chain.join(' in ')}]`);
    if (!want.length) {
      if (s.page && !s.page.none) say('item page', s.page.words);
      return bad;
    }
    if (s.tile !== null && norm(s.tile) !== want[0]) say('Find tile', [s.tile]);
    if (!s.page) bad.push(`${label}${name} — item page: no "Where it is" block`);
    else {
      const got = s.page.words.map(norm);
      if (JSON.stringify(got) !== JSON.stringify(want)) say('item page words', s.page.words);
      if (s.page.squares !== want.length) bad.push(`${label}${name} — item page: ${s.page.squares} squares for ${want.length} tiers`);
      if (want.length > 1 && (s.page.pillsSq !== want.length - 1 || s.page.pillsW !== want.length - 1)) bad.push(`${label}${name} — item page: "in" pills squares ${s.page.pillsSq} / words ${s.page.pillsW}, want ${want.length - 1} each`);
      if (s.page.plainSeparators) bad.push(`${label}${name} — item page: a "·" between tiers (the "in" pill everywhere)`);
      // 09-30d: "seen" only when a photo of it is newer than its last move; "moved" only when it moved.
      const w = (s.page.when || '').trim();
      if (/^seen /i.test(w) && t.lastMove > t.lastPhoto + 2000) bad.push(`${label}${name} — item page says "${w}", but it moved after its last photo (nobody saw it there)`);
      if (/^moved /i.test(w) && !t.lastMove) bad.push(`${label}${name} — item page says "${w}", but it never moved`);
    }
    if (s.camera) {
      const sq = s.camera.squares.map(norm);
      if (JSON.stringify(sq) !== JSON.stringify(want)) say('Move it squares', s.camera.squares);
      if (want.length > 1) { const ch = s.camera.chain.map(norm); if (JSON.stringify(ch) !== JSON.stringify(want)) say('Move it chain line', s.camera.chain); }
    }
    return bad;
  }

  // The card right after a Save: its words must be the truth too.
  async function card(name) {
    const t = await truth(name); if (!t) return [`${name}: not in the store after Save`];
    const c = await page.evaluate(() => { const el = document.querySelector('.saved-card .sc-chain'); return el ? [...el.children].map((x) => [...x.children].filter((y) => !y.classList.contains('in')).map((y) => y.innerText).join(' ')) : null; });
    if (!c || t.chain.length < 2) return [];
    const got = c.map(norm); const want = t.chain.map(norm);
    return JSON.stringify(got) === JSON.stringify(want) ? [] : [`${name} — the card after Save shows [${c.join(' in ')}], the store says [${t.chain.join(' in ')}]`];
  }

  // Store-level rules that must always hold (cheap; the monkey runs them every step).
  async function invariants() {
    return page.evaluate(() => {
      const d = window.__rig.dump(); const live = d.filter((x) => !x.deleted); const bad = [];
      const open = live.filter((e) => e.kind === 'edge' && !e.until);
      const byFrom = new Map(); open.forEach((e) => byFrom.set(e.from, (byFrom.get(e.from) || 0) + 1));
      byFrom.forEach((n, id) => { if (n > 1) bad.push(`${id} is "in" ${n} things at once`); });
      const byId = new Map(live.map((x) => [x.id, x]));
      open.forEach((e) => { const f = byId.get(e.from); if (!f) return;
        if (f.kind === 'place' && e.to.t === 'thing') bad.push(`place ${f.name} is inside a box (${e.to.name}) — Q4 says never`);
        if (e.to.t === 'thing' && !byId.get(e.to.id)) bad.push(`${f.name} is in a box that no longer exists (${e.to.name})`); });
      // no circles
      live.filter((x) => x.kind === 'item' || x.kind === 'place').forEach((x) => { const seen = new Set([x.id]); let cur = x;
        for (let k = 0; k < 20; k++) { const e = open.find((z) => z.from === cur.id); if (!e) break; const nx = e.to.t === 'thing' ? byId.get(e.to.id) : live.find((p) => p.kind === 'place' && (p.name || '').toLowerCase() === (e.to.name || '').toLowerCase()); if (!nx) break; if (seen.has(nx.id)) { bad.push(`a circle through ${x.name}`); break; } seen.add(nx.id); cur = nx; } });
      live.filter((x) => x.kind === 'place').forEach((p) => { if ((p.photos || []).length > 6) bad.push(`place ${p.name} keeps ${p.photos.length} photos (max 6)`); });
      return bad;
    });
  }

  return { truth, screens, check, card, invariants, openItem };
};
