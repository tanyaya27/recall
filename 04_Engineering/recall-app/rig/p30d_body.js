  // audit_p30d (= tiers_head.js + p30d_body.js) — Ravi's phone test of 20260930c (09-30, 10:27–10:32):
  // P1 the photo viewer puts "photo 1 of 3" in a different spot in the camera than on the item page;
  // P2 the item page says "seen" at the time of a Move nobody photographed; the cover photo's time is the Move's too;
  // P3 Choose place gives no clue which tier it changes (and "Current place" only for level 1); the camera doesn't either;
  // P4 after Choose place on a tier that had a photo, the square keeps the OLD photo (and the old photo went onto the new place);
  // P5 "nothing here yet" under a place that holds another place; P6 "the in air".
  async function runSuite() {
    const OUT = path.join(__dirname, 'shots_p30d'); fs.mkdirSync(OUT, { recursive: true });
    let n = 0; const snap = async (label) => { n++; const f = `p-${String(n).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, f) }); console.log('  [shot]', f); return f; };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(500); };
    const move = async () => { await openThing('3D model of plant sensor'); await tap('button:has-text("Move it")', { wait: 900 }); };
    const st = () => page.evaluate(() => { const t = (q) => (document.querySelector(q) || {}).innerText || '';
      return { squares: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => b.getAttribute('aria-label')), thumbs: [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].map((b) => { const i = b.querySelector('img'); return i ? i.getAttribute('src').slice(-40) : ''; }),
        place: t('.lc-say'), chain: t('.lc-chainline').replace(/\n/g, ' '), chainSel: t('.lc-chainline .sel'), prompt: t('.lc-prompt'), choose: t('.lc-choose') }; });
    const H = 3600e3; const now = Date.now();
    const tail = (s) => (s || '').slice(-40);
    // Ravi's house, as on his phone: the 3D model is in the White cardboard box, in the Ikea shelving unit, in the Living room.
    // Logged (photographed) 50 h ago; nothing has moved since.
    await page.evaluate(([a, b, c, d, t]) => { const H = 3600e3; const P = (id, nm, im, ago) => ({ id, kind: 'place', owner: 'margaret', by: 'margaret', private: false, name: nm, order: t - ago, createdAt: t - ago, parent: null, photos: [{ photo: im, thumb: im, at: t - ago }] });
      const E = (id, from, to, ago) => ({ id, kind: 'edge', rel: 'in', from, to, since: t - ago, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] });
      window.__rig.seed([
        P('pl7', 'White cardboard box', a, 93 * H), P('pik', 'Ikea shelving unit', b, 92 * H), P('plr', 'Living room', c, 91 * H), P('pair', 'In air', d, 60 * H),
        { id: 'ps', kind: 'item', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [], name: '3D model of plant sensor', location: 'White cardboard box', photo: d, thumb: d, thumbV: 2,
          order: t - 50 * H, createdAt: t - 50 * H, lastSeenAt: t - 50 * H, logId: 'l_ps', photoCount: 1, history: [{ location: 'White cardboard box', at: t - 50 * H }] },
        { id: 'sps', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps', photo: d, thumb: d, location: 'White cardboard box', at: t - 50 * H, caption: '' },
        E('eps', 'ps', { t: 'place', name: 'White cardboard box' }, 50 * H), E('e7', 'pl7', { t: 'place', name: 'Ikea shelving unit' }, 92 * H), E('eik', 'pik', { t: 'place', name: 'Living room' }, 91 * H)]); },
    [img('box.jpg'), img('closet.jpg'), img('real_desk.jpg'), img('real_cetaphil.jpg'), now]);
    await page.evaluate(() => window.__rig.rules(true));

    // ---- P1: one photo viewer, one place for "photo 1 of N" ----
    await openThing('3D model of plant sensor');
    await page.locator('.tp-wh .ph-open').first().click(); await page.waitForTimeout(500);
    const v1 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); const im = document.querySelector('.d2-pv .d2-slide img'); return { there: !!m, text: m ? m.innerText : '', above: m && im ? m.getBoundingClientRect().bottom <= im.getBoundingClientRect().top + 2 : null }; });
    await snap('item page: a place photo in the viewer');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // select tier 2 (the Ikea shelving unit)
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // tap it again → its sheet
    if (await page.locator('.tier-sheet .sheet-row:has-text("See its photos")').count()) await tap('.tier-sheet .sheet-row:has-text("See its photos")', { wait: 500 });
    const v2 = await page.evaluate(() => { const m = document.querySelector('.d2-pv .d2-meta'); return { viewer: document.querySelector('.d2-pv') ? 'd2' : document.querySelector('.lc-pv') ? 'camera-own' : 'none', text: m ? m.innerText : ((document.querySelector('.lc-pv') || {}).innerText || '').replace(/\n/g, ' | ') }; });
    await snap('camera: a tier photo in the viewer');
    check('P1', 'the camera shows a place\'s photos in the SAME viewer as the item page — name · photo in the top bar, above the photo', v1.there && v1.above && v2.viewer === 'd2' && /Ikea shelving unit/.test(v2.text), JSON.stringify({ v1, v2 }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await page.locator('.d2-pv, .lc-pv').count()) { await page.mouse.click(20, 400); await page.waitForTimeout(300); }
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- P3: Choose place says which tier it changes; the camera marks it too ----
    await move(); let s = await st(); await snap('move it opens');
    check('P3', 'Move it: the chain line marks the tier Choose place will change (level 1: White cardboard box)', /White cardboard box/.test(s.chainSel), JSON.stringify(s));
    await tap('.lc-choose', { wait: 500 });
    const c1 = await page.evaluate(() => ({ head: ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '), sel: (document.querySelector('.where-list .wl-chg .sel') || {}).innerText || '',
      cur: [...document.querySelectorAll('.where-list .wl-row')].filter((r) => r.querySelector('.wl-cur')).map((r) => r.querySelector('b').innerText) }));
    await snap('choose place for level 1');
    check('P3', 'Choose place (level 1) shows the whole chain and marks what it changes: White cardboard box, for the 3D model', c1.sel === 'White cardboard box' && /Ikea shelving unit/.test(c1.head) && /Living room/.test(c1.head) && /3D model/i.test(c1.head), JSON.stringify(c1));
    check('P3', '… and the White cardboard box row says Current place', c1.cur.some((x) => /White cardboard box/.test(x)), JSON.stringify(c1.cur));
    await tap('.where-list .btn-quiet', { wait: 400 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // select tier 2
    s = await st();
    check('P3', 'tier 2 selected: the chain line marks the Ikea shelving unit', /Ikea shelving unit/.test(s.chainSel), JSON.stringify(s));
    await tap('.lc-choose', { wait: 500 });
    const c2 = await page.evaluate(() => ({ head: ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '), sel: (document.querySelector('.where-list .wl-chg .sel') || {}).innerText || '',
      cur: [...document.querySelectorAll('.where-list .wl-row')].filter((r) => r.querySelector('.wl-cur')).map((r) => r.querySelector('b').innerText) }));
    await snap('choose place for tier 2');
    check('P3', 'Choose place (tier 2) marks the Ikea shelving unit, and says it is where the White cardboard box goes', c2.sel === 'Ikea shelving unit' && /White cardboard box/.test(c2.head), JSON.stringify(c2));
    check('P3', '… and the Ikea shelving unit row says Current place (not only for level 1)', c2.cur.some((x) => /Ikea shelving unit/.test(x)) && !c2.cur.some((x) => /White cardboard box/.test(x)), JSON.stringify(c2.cur));
    // ---- P5: a place that holds another place is not "nothing here yet" ----
    const sub = await page.evaluate(() => { const r = [...document.querySelectorAll('.where-list .wl-row')].find((x) => /Ikea shelving unit/.test(x.querySelector('b').innerText)); return r ? r.querySelector('small').innerText : 'no row'; });
    check('P5', 'Choose place: the Ikea shelving unit (it holds the White cardboard box) is not "nothing here yet"', !/nothing here yet/.test(sub) && /White cardboard box/.test(sub), sub);
    await tap('.where-list .btn-quiet', { wait: 400 });
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });

    // ---- P4 + P6: photograph a new top tier, then Choose place on it → the square shows the place picked ----
    await move();
    await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'foyer', moves: false }); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 2200 });
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Foyer at the front door'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    s = await st(); await snap('foyer photographed as tier 4');
    const foyerThumb = s.thumbs[3];
    await page.locator('.lv-strip .lv-sq').nth(3).click(); await page.waitForTimeout(350); // tap the selected square → its sheet
    await tap('.tier-sheet .sheet-row:has-text("Choose place")', { wait: 450 });
    await page.fill('.wl-search input', 'In air'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("In air")', { wait: 500 });
    s = await st(); await snap('tier 4 changed to In air');
    const airThumb = tail(await page.evaluate(() => { const d = window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air'); return d.photos[0].thumb; }));
    check('P4', 'the square of the tier just changed shows the place picked (In air\'s photo), not the photo taken for the Foyer', /In air/.test(s.place) && s.thumbs[3] === airThumb && s.thumbs[3] !== foyerThumb, JSON.stringify({ place: s.place, now: s.thumbs[3], air: airThumb, foyer: foyerThumb }));
    check('P6', 'the prompt about a place called "In air" doesn\'t say "the in air"', !/the in air/i.test(s.prompt), s.prompt);
    const airPhotos0 = await page.evaluate(() => window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air').photos.length);
    await tap('.lc-k.sv', { wait: 2600 });
    const airPhotos1 = await page.evaluate(() => window.__rig.dump().find((x) => x.kind === 'place' && x.name === 'In air').photos.length);
    check('P4', 'saved: the Foyer\'s photo did not go onto "In air" (Choose place replaced that tier)', airPhotos1 === airPhotos0, `${airPhotos0} -> ${airPhotos1}`);

    // ---- P2: "seen" only when it was photographed; a Move says "moved" ----
    await page.evaluate(() => window.__rig.seed([{ id: 'eik', kind: 'edge', rel: 'in', from: 'pik', to: { t: 'place', name: 'Living room' }, since: Date.now() - 91 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await move(); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('3D model of plant sensor');
    const when = await page.evaluate(() => { const b = document.querySelectorAll('.tp-blk')[0]; const sm = b ? b.querySelector('.tp-wh + small, small') : null; return [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '); });
    await snap('item page after a move');
    check('P2', 'after a Move nobody photographed, the page says "moved …" and when it was last SEEN (50 h ago) — not "seen today"', /moved today/i.test(when) && /last seen/i.test(when) && !/(^|\|\s*)seen today/i.test(when), when);
    const stamp = await page.evaluate(() => { const s = document.querySelector('.photo-strip .stamp, .stamp'); return s ? s.innerText : ''; });
    await page.locator('img.photo-full').first().click(); await page.waitForTimeout(500);
    const vt = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    check('P2', 'the photo\'s own time is when it was TAKEN (2 days ago), not the time of the Move', !/Today/.test(vt) && (!stamp || !/Today/.test(stamp)), JSON.stringify({ vt, stamp }));
    // a photo taken later → "seen" again. (Seeded: a real photo taken now, after the move.)
    await page.evaluate(([im]) => { const t = Date.now(); window.__rig.seed([{ id: 'sps2', kind: 'snap', owner: 'margaret', by: 'margaret', itemId: 'ps', logId: 'l_ps2', photo: im, thumb: im, location: 'Pantry shelf', at: t, caption: '', extra: true }]); }, [img('real_pencil.jpg')]);
    await openThing('3D model of plant sensor');
    const when2 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('P2', 'a photo of it taken after the move → "seen today …" (no "moved")', /seen today/i.test(when2) && !/moved/i.test(when2), when2);
    // moving what it's in moves it too: the Kitchen counter (in the Craft nook) goes to the Pantry shelf → the batteries "moved with the Kitchen counter"
    await page.evaluate(() => window.__rig.seed([{ id: 'ekcp', kind: 'edge', rel: 'in', from: 'pl1', to: { t: 'place', name: 'Craft nook' }, since: Date.now() - 99 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await openThing('spare batteries'); await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350);
    await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('spare batteries');
    const when3 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await snap('batteries after their counter moved');
    check('P2', 'its counter moved to the Pantry shelf → "moved with the Kitchen counter …", not "seen"', /moved with the Kitchen counter today/i.test(when3) && /last seen/.test(when3), when3);

    // ======== 09-30d independent tester (REPORT_d.md) ========
    // the iPhone keyboard stand-in (as audit_chain): installed before the app loads, so the app's keyboard watcher sees it
    await page.addInitScript(() => { const et = new EventTarget(); let h = null; const Hh = () => (h === null ? window.innerHeight : h);
      Object.defineProperty(et, 'height', { get: Hh }); Object.defineProperty(et, 'offsetTop', { get: () => 0 }); Object.defineProperty(et, 'width', { get: () => window.innerWidth });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => et }); window.__kb = (px) => { h = window.innerHeight - px; et.dispatchEvent(new Event('resize')); }; });
    const kbStub = async () => {};
    // T1: with the keyboard up, what you search for stays in sight (the new header must not push it under the keyboard)
    await openThing('baseball card'); await kbStub();
    await tap('button:has-text("Move it")', { wait: 900 });
    await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); // tier 2: the longest header (as the tester did)
    await tap('.lc-choose', { wait: 500 }); await page.locator('.wl-search input').click(); await page.evaluate(() => window.__kb(380)); await page.waitForTimeout(250);
    await page.keyboard.type('Pan', { delay: 40 }); await page.waitForTimeout(350);
    const t1 = await page.evaluate(() => { const r = [...document.querySelectorAll('.where-list .wl-row')].find((x) => /Pantry shelf/.test(x.innerText)); const b = r ? r.getBoundingClientRect() : null; const i = document.querySelector('.wl-search input').getBoundingClientRect(); return { row: b ? Math.round(b.bottom) : null, input: Math.round(i.bottom), limit: window.innerHeight - 380 }; });
    await snap('T1 keyboard up typing Pan');
    check('T1', 'Choose place, keyboard up, "Pan" typed: the search and the Pantry shelf row sit above the keyboard', t1.row !== null && t1.row <= t1.limit && t1.input <= t1.limit, JSON.stringify(t1));
    await page.evaluate(() => window.__kb(0)); await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T1b: Largest text on a small iPhone, no keyboard: the first place row is on the screen
    await page.setViewportSize({ width: 375, height: 667 }); await setPrefs({ size: 'largest' });
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350); await tap('.lc-choose', { wait: 500 });
    const t1b = await page.evaluate(() => { const r = document.querySelector('.where-list .wl-row'); return r ? Math.round(r.getBoundingClientRect().top) : null; });
    await snap('T1b largest 375 choose tier 2');
    check('T1', 'Largest on 375x667: the first place row starts on the screen (it started at 693 px)', t1b !== null && t1b < 667 - 40, String(t1b));
    await page.keyboard.press('Escape').catch(() => {}); if (await page.locator('.where-list').count()) await page.locator('.where-list .btn-quiet').click({ force: true, timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    await page.setViewportSize({ width: 390, height: 844 }); await setPrefs({ size: 'normal' });
    // T6: the current place is the first row
    await move(); await tap('.lc-choose', { wait: 500 });
    const t6 = await page.evaluate(() => { const r = document.querySelector('.where-list .wl-scroll .wl-row'); return r ? r.innerText.replace(/\n/g, ' | ') : ''; });
    check('T6', 'Choose place: the place saved on that tier ("Current place") is the first row, not somewhere below', /Current place/.test(t6), t6);
    await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T2: Undo of a Move → not "moved"
    await openThing('3D model of plant sensor');
    const before = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Linen closet'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Linen closet")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await tap('.tp-moved button:has-text("Undo")', { wait: 1500 });
    await openThing('3D model of plant sensor');
    const after = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T2', 'Move then Undo: the page says what it said before the Move (an undone move is not a move)', after === before, JSON.stringify({ before, after }));
    // T4 + T3: a new tier on top, photographed → the header says "Choose what … is in" (not "Changing … it moves"); its viewer asks before removing; the name stays
    await move(); await tap('.lv-sq.plus', { wait: 350 });
    WHERE.push({ name: 'bench', moves: false }); await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 2200 });
    const t4 = await page.evaluate(() => ((document.querySelector('.where-list .wl-chg') || {}).innerText || '').replace(/\n/g, ' '));
    check('T4', 'a new tier on top, just photographed: the header says "Choose what … is in", not "Changing … it moves"', /Choose what/.test(t4) && !/it moves/.test(t4), t4);
    if (await page.locator('.wl-pend input').count()) { await page.locator('.wl-pend input').fill('Foyer bench'); await tap('.wl-pend .btn-primary', { wait: 500 }); }
    const nsq = (await st()).squares.length;
    await page.locator('.lv-strip .lv-sq').nth(nsq - 1).click(); await page.waitForTimeout(350);
    await tap('.tier-sheet .sheet-row:has-text("See its photos")', { wait: 500 });
    const t5 = await page.evaluate(() => (document.querySelector('.d2-pv .d2-meta') || {}).innerText || '');
    check('T5', 'the camera viewer\'s title has the count even for one photo, like the item page ("Foyer bench · photo 1 of 1")', /Foyer bench · photo 1 of 1/.test(t5), t5);
    await tap('.d2-pv .d2-pill.rm', { wait: 400 });
    const t3a = await page.evaluate(() => ({ confirm: [...document.querySelectorAll('.sheet-title, .confirm h2, [role=alertdialog]')].map((x) => x.innerText).join(' | '), viewer: !!document.querySelector('.d2-pv') }));
    check('T3', 'Remove in the camera\'s viewer asks first ("Remove this photo?"), like the item page', /Remove this photo\?/.test(t3a.confirm), JSON.stringify(t3a));
    if (/Remove this photo/.test(t3a.confirm)) await tap('.pv-ask .btn-secondary.amber', { wait: 600 });
    const gone = await page.evaluate(() => [...document.querySelectorAll('.lv-strip .lv-sq:not(.plus)')].pop().querySelector('img') === null || true);
    s = await st(); const lastThumb = s.thumbs[s.thumbs.length - 1];
    check('T3', 'removing a named tier\'s only photo (it IS removed: no picture on its square) keeps its name ("Place: Foyer bench", not "not defined")', lastThumb === '' && /Foyer bench/.test(s.place) && !/not defined/.test(s.place), JSON.stringify({ place: s.place, lastThumb }));
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // T7: "moved with the Wooden box" — a box keeps its capital
    await page.evaluate(() => window.__rig.seed([{ id: 'ew', kind: 'edge', rel: 'in', from: 'w', to: { t: 'thing', id: 'm', name: 'memorabilia box' }, since: Date.now() - 80 * 3600e3, until: null, how: 'chosen', owner: 'margaret', by: 'margaret', private: false, roles: {}, sharedWith: [] }]));
    await openThing('wooden box'); await tap('button:has-text("Move it")', { wait: 900 }); await tap('.lc-choose', { wait: 500 }); await page.fill('.wl-search input', 'Pantry shelf'); await page.waitForTimeout(150);
    await tap('.where-list .wl-row:has-text("Pantry shelf")', { wait: 500 }); await tap('.lc-k.sv', { wait: 2600 });
    await openThing('baseball card');
    const t7 = await page.evaluate(() => [...document.querySelectorAll('.tp-blk small')].map((x) => x.innerText).join(' | '));
    check('T7', 'the card in the wooden box: "moved with the Wooden box" (the name as written everywhere)', /moved with the Wooden box/.test(t7), t7);
    // T8: level 2 selected — the prompt reads as one sentence
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(300);
    const t8 = (await st()).prompt.replace(/\s+/g, ' ');
    check('T8', 'a middle tier selected: the prompt is one sentence ("… or tap + to add a level on top.")', !/\. adds a level/.test(t8), t8);
    await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
    // ---- F (Ravi 09-30): the Choose place button wears the colour of the tier it changes; only that tier is coloured ----
    await openThing('baseball card'); await tap('button:has-text("Move it")', { wait: 900 }); await page.locator('.lv-strip .lv-sq').nth(1).click(); await page.waitForTimeout(350);
    const f = await page.evaluate(() => { const sel = document.querySelector('.lc-chainline .sel'); const b = document.querySelector('.lc-choose'); const sq = document.querySelector('.lv-strip .lv-sq.sel');
      const words = [...document.querySelectorAll('.lc-chainline .cp > span:not(.lc-in)')].map((x) => ({ n: x.innerText, c: getComputedStyle(x).color, sel: x.classList.contains('sel') }));
      return { ring: sel ? getComputedStyle(sel).borderTopColor : '', button: b ? getComputedStyle(b).borderTopColor : '', btnText: b ? getComputedStyle(b).color : '', square: sq ? getComputedStyle(sq).borderTopColor : '', words }; });
    await snap('F focus colour tier 2');
    check('F1', 'Choose place wears the colour of the tier it changes (button = ring in the chain = the selected square)', f.ring && f.button === f.ring && f.btnText === f.ring && f.square === f.ring, JSON.stringify(f));
    const others = f.words.filter((w) => !w.sel).map((w) => w.c); const plain = new Set(others);
    check('F2', 'only the tier in focus is coloured: every other tier\'s word is the same plain colour', others.length >= 1 && plain.size === 1 && !others.includes(f.ring), JSON.stringify(f.words));
    await tap('.lc-choose', { wait: 500 });
    const fh = await page.evaluate(() => [...document.querySelectorAll('.wl-chg-ch .cp > span:not(.lc-in)')].map((x) => ({ n: x.innerText, c: getComputedStyle(x).color, sel: x.classList.contains('sel') })));
    const hOthers = new Set(fh.filter((w) => !w.sel).map((w) => w.c));
    check('F2', 'Choose place header: only the tier being changed is coloured', hOthers.size === 1 && fh.filter((w) => w.sel).length === 1, JSON.stringify(fh));
    await tap('.where-list .btn-quiet', { wait: 300 }); await tap('.lc-x', { wait: 400 }); if (await page.locator('text=Throw away').count()) await tap('text=Throw away', { wait: 400 });
  }
  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('P', 'suite ran', false, e.message); }
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
