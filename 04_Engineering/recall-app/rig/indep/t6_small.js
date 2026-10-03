// ow1 / t6: first-time use on a 375×667 phone at Largest text (simplicity). Screenshots + geometry.
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8477), w: 375, h: 667, shots: 'shots_small' });
  const { page, W, check, info, step, S } = H;
  await H.seed({ prefs: { size: 'largest' } });
  const geo = async (tag, sels) => {
    const r = await page.evaluate((ss) => {
      const out = { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth };
      for (const s of ss) { const els = [...document.querySelectorAll(s)]; out[s] = els.slice(0, 3).map((el) => { const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), clipX: el.scrollWidth > el.clientWidth + 1, clipY: el.scrollHeight > el.clientHeight + 1 }; }); }
      return out;
    }, sels);
    info(tag, JSON.stringify(r)); return r;
  };
  const overlap = (a, b) => a && b && !(a.b <= b.t || b.b <= a.t || a.r <= b.l || b.r <= a.l);
  const inView = (a, vh, vw) => a && a.t >= 0 && a.b <= vh && a.l >= 0 && a.r <= vw;
  const sel = ['.lc-top', '.lc-card', '.ow-head', '.ow-field', '.ow-input', '.ow-go', '.ow-note', '.ow-to', '.lc-bot', '.lc-k.sv', '.lc-shutter', '.lc-x', '.ow-ai', '.ow-hint', '.ow-looking'];
  await step('Z1', 'Move at rest', async () => {
    await H.openMove('brochure'); await H.snap('z1-move-rest.png');
    const g = await geo('Z1', sel);
    check('Z1a', 'no horizontal scroll', g.sw <= g.vw, `${g.sw} > ${g.vw}`);
    check('Z1b', 'the where field, Save and the shutter are all on screen', inView(g['.ow-field'][0], g.vh, g.vw) && inView(g['.lc-k.sv'][0], g.vh, g.vw) && inView(g['.lc-shutter'][0], g.vh, g.vw), JSON.stringify([g['.ow-field'][0], g['.lc-k.sv'][0], g['.lc-shutter'][0]]));
    check('Z1c', 'the card does not cover the shutter row', !overlap(g['.lc-card'][0], g['.lc-bot'][0]), JSON.stringify([g['.lc-card'][0], g['.lc-bot'][0]]));
    check('Z1d', 'the header fits (not clipped)', g['.ow-head'][0] && !g['.ow-head'][0].clipX, JSON.stringify(g['.ow-head'][0]));
    // type a long new name
    await H.typeWhere('the big white bookcase by the window'); await H.snap('z1-move-typing.png'); const g2 = await geo('Z1t', sel);
    check('Z1e', 'typing: the "Set NEW place. (previously was: Office)" header fits', !g2['.ow-head'][0].clipX, JSON.stringify(g2['.ow-head'][0]));
    info('Z1h', 'header text while typing: ' + (await H.head()) + ' | hint: ' + (await H.txt('.ow-hint')));
    await H.done(); S.GUESS = { name: 'White bookcase with books', merged: 'Big white bookcase by the window with books' }; S.GUESS_DELAY = 1200;
    await H.shoot('closet.jpg', 300); await W(200); await H.snap('z1-looking.png'); const g3 = await geo('Z1l', sel);
    check('Z1f', '"ReCall is looking…" does not cover the where field or the card', !overlap(g3['.ow-looking'][0], g3['.ow-field'][0]) && inView(g3['.ow-looking'][0], g3.vh, g3.vw) && inView(g3['.ow-field'][0], g3.vh, g3.vw), JSON.stringify([g3['.ow-looking'][0], g3['.lc-card'][0]]));
    await W(2800); await H.snap('z1-guess.png'); const g4 = await geo('Z1g', sel);
    check('Z1g', 'the guess box does not cover the where field / card, and is fully on screen', g4['.ow-ai'][0] && !overlap(g4['.ow-ai'][0], g4['.ow-field'][0]) && inView(g4['.ow-ai'][0], g4.vh, g4.vw) && inView(g4['.ow-field'][0], g4.vh, g4.vw) && inView(g4['.lc-k.sv'][0], g4.vh, g4.vw), JSON.stringify([g4['.ow-ai'][0], g4['.ow-field'][0], g4['.lc-card'][0]]));
    const btns = await page.evaluate(() => [...document.querySelectorAll('.ow-ai button')].map((b) => { const r = b.getBoundingClientRect(); return [b.innerText, Math.round(r.top), Math.round(r.bottom), Math.round(r.height)]; }));
    info('Z1b2', 'guess buttons: ' + JSON.stringify(btns));
    await H.leave();
  });
  await step('Z2', '→ sheet with 4 levels', async () => {
    await H.openMove('gold ring'); await H.tap('.ow-go', 600); await H.snap('z2-sheet.png');
    const g = await geo('Z2', ['.ow-sheet', '.ow-lvl', '.ow-up', '.ow-done', '.ow-cancel', '.ow-scroll', '.ow-g']);
    check('Z2', 'Done is on screen without scrolling', inView(g['.ow-done'][0], g.vh, g.vw), JSON.stringify(g['.ow-done'][0]));
    const sc = await page.evaluate(() => { const s = document.querySelector('.ow-scroll'); return s ? { h: s.clientHeight, sh: s.scrollHeight } : null; });
    info('Z2s', 'pick list visible height vs content: ' + JSON.stringify(sc));
    await H.tap('.ow-cancel', 300); await H.leave();
  });
  await step('Z3', 'item page', async () => {
    await H.openThing('gold ring'); await H.snap('z3-page.png');
    const g = await geo('Z3', ['.tp-blk', '.tp-wone', '.tp-btn', '.photo-wrap']);
    info('Z3b', 'Move it button on first screen: ' + inView(g['.tp-btn'][0], g.vh, g.vw));
  });
  await step('Z4', 'Log first photo', async () => {
    await H.home(); S.AI = { name: 'stapler' }; await H.tap(H.LOG, 900); await H.snap('z4-log0.png'); await H.shoot('real_pencil.jpg'); await W(600); await H.snap('z4-log1.png');
    const g = await geo('Z4', sel);
    check('Z4', 'Log after the first photo: field, Save, shutter on screen; card off the shutter row', inView(g['.ow-field'][0], g.vh, g.vw) && inView(g['.lc-k.sv'][0], g.vh, g.vw) && !overlap(g['.lc-card'][0], g['.lc-bot'][0]), JSON.stringify([g['.ow-field'][0], g['.lc-k.sv'][0], g['.lc-card'][0], g['.lc-bot'][0]]));
    await H.typeWhere('kitchen'); await H.done(); await H.tap('.ow-note', 300); await page.fill('.ow-note-in', 'next to the bread bin'); await W(200); await page.locator('.ow-note-in').press('Enter'); await W(300);
    await H.snap('z4-log-note.png'); const g2 = await geo('Z4n', sel);
    check('Z4n', 'with a note open: card still clear of the shutter row and the strip on screen', !overlap(g2['.lc-card'][0], g2['.lc-bot'][0]) && inView(g2['.ow-to'][0], g2.vh, g2.vw), JSON.stringify([g2['.lc-card'][0], g2['.ow-to'][0], g2['.lc-bot'][0]]));
    await H.leave();
  });
  await H.finish('t6');
})().catch((e) => { console.error(e); process.exit(1); });
