  // audit_pick (= tiers_head.js + pick_body.js) — Ravi 09-30 1:36 PM + the tester's timeout report (rig/indep/REPORT_timeout.md):
  // K1–K3 a photo on a tier that has a place asks ("This photo is…"), never assumes a new place; later shots follow the answer;
  // K4–K6 Choose place: the new place first, then search; the header keeps the old place; Cancel puts everything back;
  // K7–K9 a pick shows Before → Now; Use / Back; the photo goes to the place picked;
  // T1–T6 the tester's timeout bugs: no timer; a late answer only suggests (never sets a tier, never fills a taken name, never
  // moves the list); Save never counts a suggestion; a place is never named "A place" by Cancel; the note doesn't say "Moved".
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_pick_audit'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `k-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async (nm = '3D model of plant sensor') => { await openThing(nm); await tap('button:has-text("Move it")', { wait: 900 }); };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => (b.getAttribute('aria-label') || '').replace(/^Level \d+: /, '')), place: t('.lc-say'),
        chain: t('.lc-chainline').replace(/\n/g, ' '), photoFor: !!document.querySelector('.photo-for'), choose: !!document.querySelector('.where-list'), bn: !!document.querySelector('.where-list.bn'),
        save: (document.querySelector('.lc-k.sv') || {}).disabled }; });
    const close = async () => { for (let i = 0; i < 3; i++) { if (await page.locator('.where-list .btn-quiet, .photo-for .btn-quiet').count()) await page.locator('.where-list .btn-quiet, .photo-for .btn-quiet').first().click().catch(() => {}); await page.waitForTimeout(200); }
      if (await page.locator('.lc').count()) { await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 }); } };
    const photosOf = (nm) => page.evaluate((x) => { const d = window.__rig.dump().find((p) => p.kind === 'place' && p.name.toLowerCase() === x.toLowerCase()); return d ? (d.photos || []).length : -1; }, nm);
    const where = (id) => page.evaluate((i) => { const d = window.__rig.dump(); const it = d.find((x) => x.id === i); const e = d.find((x) => x.kind === 'edge' && x.from === i && !x.until); return { loc: it.location, to: e ? (e.to.name || e.to.id) : null }; }, id);
    await page.addInitScript(() => { window.__noAuto = true; }); await page.evaluate(() => { window.__noAuto = true; });
    const now = Date.now();
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t, createdAt: t - 50 * H, lastSeenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    await page.evaluate(() => window.__rig.rules(true));

    // ---- K1: the shutter on the highlighted current place asks, at once; nothing behind it changes ----
    await move(); const s0 = await st();
    WHERE.length = 0; WHERE.push({ name: 'white box', moves: false }); await cam('box.jpg'); await tap('.lc-shutter', { wait: 500 });
    let s = await st(); await snap('shutter on the current place asks');
    check('K1', 'Ravi: a photo on a tier that has a place asks "This photo is…" at once — no wait, no "A new place?"', s.photoFor && !s.choose, JSON.stringify(s));
    const mm = await page.evaluate(() => ({ same: !!document.querySelector('.photo-for .pf-same .mini-mark .d.photo') && !!document.querySelector('.photo-for .pf-same .mini-mark .t svg'),
      other: !!document.querySelector('.photo-for .pf-other .mini-mark .d.pin') && /New/.test((document.querySelector('.photo-for .pf-other .mini-mark .t') || {}).innerText || '') }));
    check('C0', 'Ravi: each choice in "This photo is…" carries the mark the shutter will wear (photo + "+"; pin + "New")', mm.same && mm.other, JSON.stringify(mm));
    const dash0 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq')).borderTopStyle);
    check('D1', 'the next shot will ask (nothing changing yet): the square is SOLID', dash0 === 'solid', dash0);
    check('K1', '… and nothing behind it changed (still White cardboard box in Ikea shelving unit in Living room)', JSON.stringify(s.squares) === JSON.stringify(s0.squares), JSON.stringify([s0.squares, s.squares]));
    // ---- K2: "Another photo of the White cardboard box" — kept; later shots follow the answer ----
    await tap('.photo-for .pf-same', { wait: 400 }); s = await st();
    check('K2', '"Another photo of the White cardboard box": the tier stays, all 3 tiers stay, Save turns on', !s.photoFor && s.squares.length === 3 && /White cardboard box/.test(s.squares[0]) && s.save === false, JSON.stringify(s));
    const chip1 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); const sp = b.querySelector('span'); const t = b.querySelector('.sh-tab');
      return { more: b.classList.contains('m-more'), photo: /url\(/.test(sp.style.backgroundImage || ''), tabPlus: !!(t && t.querySelector('svg')), label: b.getAttribute('aria-label') }; });
    check('C1', 'Ravi option 1: the place\'s photo in the shutter disc with a "+" tab while shots go to it (and VoiceOver says so)', chip1.more && chip1.photo && chip1.tabPlus && /adds to the White cardboard box/i.test(chip1.label), JSON.stringify(chip1));
    await cam('box.jpg'); await tap('.lc-shutter', { wait: 150 });
    const plus1 = await page.evaluate(async () => { for (let k = 0; k < 20; k++) { if (document.querySelector('.lc-fly') || document.querySelector('.lv-strip .lv-sq.landed')) return true; await new Promise((r) => setTimeout(r, 40)); } return false; });
    await page.waitForTimeout(400); s = await st();
    const stk = await page.evaluate(() => ({ n: (document.querySelector('.lv-strip .lv-sq .lv-n') || {}).innerText || '', prompt: (document.querySelector('.lc-prompt') || {}).innerText || '' }));
    check('C2', 'after the shot the photo flies into its square; the square counts 2; "Added — 2 photos of the White cardboard box"', plus1 && stk.n === '2' && /Added — 2 photos of the White cardboard box/.test(stk.prompt), JSON.stringify({ plus1, stk }));
    check('K2', 'Ravi: the next shot on that tier is another photo of it — no asking again', !s.photoFor && !s.choose, JSON.stringify(s));
    const pr = await page.evaluate(() => (document.querySelector('.lc-prompt') || {}).innerText || '');
    check('K2', 'the prompt says where the photos went ("Added — 2 photos of the White cardboard box. Tap its square to change that.")', /Added — 2 photos of the White cardboard box\. Tap its square/.test(pr), pr);
    const wcb0 = await photosOf('White cardboard box');
    await tap('.lc-k.sv', { wait: 2600 });
    const note = await page.evaluate(() => ((document.querySelector('.tp-moved') || {}).innerText || '').replace(/\n/g, ' | '));
    check('K2', 'saved: the White cardboard box has 2 more photos; the item did not move', (await photosOf('White cardboard box')) === wcb0 + 2 && (await where('ps')).loc === 'White cardboard box', `${wcb0} -> ${await photosOf('White cardboard box')}`);
    check('T6', 'tester #8: nothing moved → the page doesn\'t say "Moved just now"', !/Moved just now/.test(note) && /Saved just now/.test(note) && /2 photos added to the White cardboard box/.test(note), note);

    // ---- K3/K4: "A different place" → Choose place at once: the old chain in the header, the new place first, then search ----
    await move(); WHERE.length = 0; WHERE.push({ name: 'dark table surface', moves: false }); NEXT_WHERE_DELAY = 5000; await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 500 });
    const k3 = await page.evaluate(() => { const wl = document.querySelector('.where-list'); if (!wl) return null; const kids = [...wl.children].map((c) => c.className);
      return { head: ((wl.querySelector('.wl-chg') || {}).innerText || '').replace(/\n/g, ' '), ring: (wl.querySelector('.wl-chg .sel') || {}).innerText || '', order: kids,
        firstRow: ((wl.querySelector('.wl-scroll .wl-row') || {}).innerText || '').replace(/\n/g, ' | '), rowY: (() => { const r = wl.querySelectorAll('.wl-scroll .wl-row')[1]; return r ? Math.round(r.getBoundingClientRect().top) : null; })() }; });
    await snap('a different place: choose place');
    const dash1 = await page.evaluate(() => { const q = document.querySelector('.lv-strip .lv-sq'); return q ? getComputedStyle(q).borderTopStyle : ''; });
    check('D1', 'Ravi: while the new photo waits in Choose place, its tier\'s square is DASHED (going to change)', dash1 === 'dashed', dash1);
    check('K3', '"A different place": Choose place opens at once; the header still shows where it IS (White cardboard box ringed, in Ikea shelving unit in Living room)', k3 && k3.ring === 'White cardboard box' && /Ikea shelving unit/.test(k3.head) && /different place/.test(k3.head), JSON.stringify(k3));
    const iPend = k3 ? k3.order.findIndex((c) => /wl-pend/.test(c)) : -1, iSearch = k3 ? k3.order.findIndex((c) => /wl-search/.test(c)) : -1;
    check('K4', 'Ravi: the new place comes first, then the search, then the list', iPend >= 0 && iSearch > iPend, JSON.stringify(k3 && k3.order));
    check('T3', 'tester #3c: ReCall\'s slot is the first row from the start ("Looking at your photo…")', k3 && /Looking at your photo/.test(k3.firstRow), k3 && k3.firstRow);
    // the late sure answer (Kitchen counter, at 5 s): the slot fills; nothing jumps; the name field isn't given a taken name
    await page.waitForTimeout(100);
    // (the stub's answer is 'dark table surface' — replaced below by a sure Kitchen counter answer on the next shot)
    await tap('.where-list .btn-quiet', { wait: 400 }); s = await st();
    check('K4', 'Cancel puts it all back: White cardboard box, 3 tiers, Save off (nothing changed)', !s.choose && s.squares.length === 3 && /White cardboard box/.test(s.squares[0]) && s.save === true, JSON.stringify(s));
    await page.waitForTimeout(5000);
    s = await st(); check('T1', 'tester #1: the late answer for a sheet she left changes nothing', s.squares.length === 3 && /White cardboard box/.test(s.squares[0]), JSON.stringify(s.squares));

    // ---- T2/T3: a late SURE answer while Choose place is open only suggests ----
    WHERE.length = 0; WHERE.push({ name: 'kitchen counter', moves: false, known: 'Kitchen counter', sure: true }); NEXT_WHERE_DELAY = 3500; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 700 });
    const y0 = await page.evaluate(() => { const r = document.querySelectorAll('.where-list .wl-scroll .wl-row')[1]; return r ? Math.round(r.getBoundingClientRect().top) : null; });
    await page.waitForTimeout(4200);
    const t3 = await page.evaluate(() => { const wl = document.querySelector('.where-list'); const r = wl.querySelectorAll('.wl-scroll .wl-row');
      return { first: (r[0] || {}).innerText || '', y: r[1] ? Math.round(r[1].getBoundingClientRect().top) : null, field: (wl.querySelector('.wl-pend input') || {}).value || '', taken: (wl.querySelector('.wl-taken') || {}).innerText || '', head: (wl.querySelector('.wl-chg .sel') || {}).innerText || '' }; });
    s = await st(); await snap('late sure answer while choosing');
    check('T3', 'tester #3: a late sure answer fills ReCall\'s slot ("Kitchen counter") — the rows don\'t move', /Kitchen counter/.test(t3.first) && t3.y === y0, JSON.stringify({ y0, t3 }));
    check('T3', '… the name field isn\'t given a name she already has, and nothing is refused', t3.field === '' && !t3.taken, JSON.stringify(t3));
    check('T2', '… and the tier behind the sheet is not set to it (still White cardboard box in the header ring)', t3.head === 'White cardboard box', JSON.stringify(t3));
    // ---- K7–K9: a pick shows Before → Now; Back; Use; the photo goes to the place picked ----
    await tap('.where-list .wl-scroll .wl-row.wl-sugg', { wait: 400 });
    const bn = await page.evaluate(() => { const b = document.querySelector('.where-list.bn'); return b ? { text: b.innerText.replace(/\n/g, ' | '), imgs: b.querySelectorAll('.bn-ph img').length } : null; });
    await snap('before now kitchen counter');
    check('K7', 'Ravi: a pick doesn\'t close the sheet — it shows BEFORE White cardboard box → NOW Kitchen counter, with photos', bn && /BEFORE/.test(bn.text) && /White cardboard box/.test(bn.text) && /NOW/.test(bn.text) && /Kitchen counter/.test(bn.text) && bn.imgs === 2 && /will be in the Kitchen counter/.test(bn.text), JSON.stringify(bn));
    await page.locator('.where-list.bn .bn-ph').nth(1).click(); await page.waitForTimeout(400);
    const zoom = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    check('K7', 'a Now photo opens big (the app\'s viewer), swipeable', /Kitchen counter · photo 1 of 2/.test(zoom), zoom);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await tap('.where-list.bn .btn-secondary', { wait: 300 }); s = await st();
    check('K8', '"Back to the list" goes back — nothing chosen', s.choose && !s.bn, JSON.stringify(s));
    const kc0 = await photosOf('Kitchen counter');
    await tap('.where-list .wl-scroll .wl-row.wl-sugg', { wait: 300 }); await tap('.where-list.bn .btn-primary', { wait: 500 }); s = await st();
    const dash2 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq')).borderTopStyle);
    check('D1', '… and SOLID once the place is chosen (Use)', dash2 === 'solid', dash2);
    check('K9', '"Use the Kitchen counter": the tier is the Kitchen counter (its old tiers above go)', !s.choose && /Kitchen counter/.test(s.squares[0]), JSON.stringify(s));
    await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 }); s = await st();
    check('K2', 'Ravi: after picking with a photo, the next shot is another photo of the Kitchen counter — no asking', !s.photoFor && !s.choose, JSON.stringify(s));
    // Ravi: any tap on a tier resets it — tap the Kitchen counter square (its sheet opens), close it, shoot → asks again
    await page.locator('.lv-strip .lv-sq').nth(0).click(); await page.waitForTimeout(300); if (await page.locator('.tier-sheet').count()) await tap('.tier-sheet .btn-quiet', { wait: 300 });
    const chip3 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); return b.classList.contains('m-more') || b.classList.contains('m-new') || !!b.querySelector('.sh-tab'); });
    check('C1', 'after a tap on the tier the shutter is plain again (the next shot will ask)', !chip3, String(chip3));
    WHERE.length = 0; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 500 }); s = await st();
    check('K2', 'Ravi: after a tap on the tier, the next shot asks "This photo is…" again', s.photoFor, JSON.stringify(s));
    await tap('.photo-for .btn-quiet', { wait: 300 });
    await tap('.lc-k.sv', { wait: 2600 });
    check('K9', 'saved: the item is on the Kitchen counter, and the Kitchen counter got both photos', (await where('ps')).loc === 'Kitchen counter' && (await photosOf('Kitchen counter')) === kc0 + 2, `${kc0} -> ${await photosOf('Kitchen counter')}`);

    // ---- K5/K6: a new place by name → Before/Now with NEW; saved with the photo ----
    await move(); WHERE.length = 0; WHERE.push({ name: 'hall bench', moves: false }); NEXT_WHERE_DELAY = 300; await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 500 });
    await tap('.photo-for .pf-other', { wait: 900 });
    const fld = await page.locator('.wl-pend input').inputValue();
    await tap('.wl-pend .btn-primary', { wait: 400 });
    const bn2 = await page.evaluate(() => ((document.querySelector('.where-list.bn') || {}).innerText || '').replace(/\n/g, ' | '));
    check('K5', 'Use this name → Before Kitchen counter → Now "Hall bench" NEW, with your photo', /Hall bench/i.test(bn2) && /NEW/.test(bn2) && /Kitchen counter/.test(bn2), JSON.stringify({ fld, bn2 }));
    await tap('.where-list.bn .btn-primary', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    check('K6', 'saved: a new place "Hall bench" with the photo; the item is on it', (await where('ps')).loc.toLowerCase() === 'hall bench' && (await photosOf('Hall bench')) === 1, JSON.stringify(await where('ps')));

    // ---- T4/T5: an empty tier (+): the photo opens Choose place at once; Cancel leaves no "A place" ----
    await move(); await tap('.lv-sq.plus', { wait: 350 }); WHERE.length = 0; WHERE.push({ name: '', moves: false }); NEXT_WHERE_DELAY = 200; await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 700 });
    s = await st(); check('K1', 'a photo on an EMPTY tier opens Choose place at once (nothing to ask about)', s.choose && !s.photoFor, JSON.stringify(s));
    await tap('.where-list .btn-quiet', { wait: 400 }); s = await st();
    check('T5', 'tester #6: Cancel there leaves no unnamed "A place" — the tier is empty again and Save stays off', s.save === true && !s.squares.some((q) => /A place/.test(q)), JSON.stringify(s));
    await close();
    const aPlace = await page.evaluate(() => window.__rig.dump().some((x) => x.kind === 'place' && /^a place$/i.test(x.name)));
    check('T5', 'no place called "A place" was ever stored', !aPlace, String(aPlace));

    // ---- K10: Choose place from the button — "Photograph a new place" first; the next shot IS the new place ----
    await move(); await tap('.lc-choose', { wait: 500 });
    const ord = await page.evaluate(() => [...document.querySelector('.where-list').children].map((c) => c.className));
    check('K10', 'Choose place from the button: "Photograph a new place" is above the search', ord.findIndex((c) => /wl-new/.test(c)) >= 0 && ord.findIndex((c) => /wl-new/.test(c)) < ord.findIndex((c) => /wl-search/.test(c)), JSON.stringify(ord));
    const wlm = await page.evaluate(() => !!document.querySelector('.where-list .wl-new.marked .mini-mark .d.pin'));
    check('C0', '"Photograph a new place" carries the same pin + "New" mark', wlm, String(wlm));
    await tap('.where-list .wl-new', { wait: 400 });
    const chip2 = await page.evaluate(() => { const b = document.querySelector('.lc-shutter'); return { m: b.classList.contains('m-new'), pin: !!b.querySelector('span svg'), tab: (b.querySelector('.sh-tab') || {}).innerText || '', prompt: (document.querySelector('.lc-prompt') || {}).innerText || '' }; });
    const dash3 = await page.evaluate(() => getComputedStyle(document.querySelector('.lv-strip .lv-sq.sel')).borderTopStyle);
    check('D1', '"Photograph a new place" armed: the selected square is DASHED', dash3 === 'dashed', dash3);
    check('C1', '"Photograph a new place": a pin in the shutter disc with a "New" tab, and "Shutter: the new place"', chip2.m && chip2.pin && /New/.test(chip2.tab) && /Shutter: the new place/.test(chip2.prompt), JSON.stringify(chip2));
    WHERE.length = 0; WHERE.push({ name: 'garage wall', moves: false }); await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 700 });
    s = await st(); check('K10', '… and the next shot goes straight to naming the new place (it doesn\'t ask again)', s.choose && !s.photoFor, JSON.stringify(s));
    await close();
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('K', 'suite ran', false, e.message); }
  await browser.close();
}
(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors:', consoleErrors.length ? consoleErrors.slice(0, 5) : 'none');
  server.close();
})();
