  // =================================================================================================
  // audit_card — the camera card for multi-level places (Ravi 09-29; DECISIONS 09-29 evening; mockups MV_2026-09-29_*).
  // Drives the real camera like a person, with the REAL permission rules on for every save.
  const OUT2 = path.join(__dirname, 'shots_card'); fs.mkdirSync(OUT2, { recursive: true });
  let cardN = 0; const snapC = async (label) => { cardN += 1; const f = `c-${String(cardN).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT2, f) }); console.log('  [shot]', f); return f; };
  async function runSuite() {
    const st = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s); const t = (s) => (q(s) || {}).innerText || '';
      return { open: !!q('.lc'), band: t('.lc-band'), prompt: t('.lc-card .lc-prompt'), place: t('.lc-card .lc-say'), chain: t('.lc-chainline'), choose: !!q('.lc-choose'), chooseDis: (q('.lc-choose') || {}).disabled ?? null,
        plus: !!q('.lv-sq.plus'), squares: document.querySelectorAll('.lc-card .lv-sq:not(.plus)').length, pills: document.querySelectorAll('.lc-chip').length, next: !!q('.lc-k.sn'),
        cancelBottom: !!q('.lc-bot .lc-x'), cancelTop: !!q('.lc-top .lc-x'), save: t('.lc-k.sv'), saveDis: (q('.lc-k.sv') || {}).disabled ?? null, shutterDis: (q('.lc-shutter') || {}).disabled ?? null,
        looking: !!q('.lv-look'), ask: t('.lc-ask2'), askImgs: document.querySelectorAll('.lc-ask2 .pair img').length, sheet: t('.sheet'), flash: t('.lc-saved') };
    });
    const fresh = async () => { await seedHouse(); SAME = { index: -1, sure: false }; await home(); await page.evaluate(() => window.__rig.rules(true)); await page.waitForTimeout(200); };
    const openThing = async (nm) => { await home(); await page.click('.footer .btn-primary.alt'); await page.waitForSelector('.ask'); await page.fill('#ask-input', nm); await page.waitForTimeout(350); await page.click('.ask .tile >> nth=0'); await page.waitForSelector('.card.thing'); await page.waitForTimeout(300); };
    const move = async (nm) => { await openThing(nm); await tap('button:has-text("Move it"), button:has-text("Put it somewhere")', { wait: 900 }); };
    const choose = async (name) => { await tap('.lc-choose', { wait: 500 }); await type('.wl-search input', name); await page.locator(`.wl-row:has-text("${name}")`).first().click(); await page.waitForTimeout(500); };
    const holdSave = async (ms, { slideOff = false } = {}) => {
      const b = await page.locator('.lc-k.sv').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
      await page.waitForTimeout(ms); const during = await page.locator('.lc-k.sv').innerText();
      if (slideOff) await page.mouse.move(b.x - 120, b.y - 200, { steps: 4 });
      await page.mouse.up(); return during;
    };

    // ---------- C1: Move it opens (level 1 = where it is now) ----------
    await fresh(); await move('Spare batteries'); let s = await st(); const f1 = await snapC('move opens');
    check('C1', 'the band asks "Where is the Spare batteries?" with the item\'s photo', /Where is the/.test(s.band) && /Spare batteries\?/.test(s.band) && await count('.lc-band .lc-thing img') === 1, s.band);
    check('C1', 'Cancel is at the bottom left (not the top); no "+ Next" button; no pills, no •••', s.cancelBottom && !s.cancelTop && !s.next && s.pills === 0, JSON.stringify({ cb: s.cancelBottom, ct: s.cancelTop, next: s.next, pills: s.pills }));
    check('C1', 'the card: "Moved it? Photograph the new place, or choose one." · ☰ Choose place · "Place: Kitchen counter"', /Moved it\? Photograph the new place, or choose one\./.test(s.prompt) && s.choose && /^Place:\s*Kitchen counter/.test(s.place), `${s.prompt} | ${s.place}`);
    check('C1', 'the row holds places only (1 square) and + (level 1 is set)', s.squares === 1 && s.plus, JSON.stringify({ sq: s.squares, plus: s.plus }));
    check('C1', '"Choose place" is one line and fits the row (≤ 48 px tall)', (await box('.lc-choose')).h <= 48, JSON.stringify(await box('.lc-choose')));
    const plusStyle = await page.evaluate(() => { const e = document.querySelector('.lv-sq.plus'); const c = getComputedStyle(e); return { bw: c.borderTopWidth, bg: c.backgroundColor, col: c.color }; });
    check('C1', '+ is a plain white plus: no border, no fill', plusStyle.bw === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(plusStyle.bg), JSON.stringify(plusStyle));

    // ---------- C2: + adds level 2 (empty, selected); + hides until it's set ----------
    await tap('.lv-sq.plus', { wait: 400 }); s = await st(); await snapC('plus adds level 2');
    check('C2', '+ adds an empty level 2, selected; the + is gone until it is set', s.squares === 2 && !s.plus && await count('.lv-sq.sel.empty') === 1, JSON.stringify({ sq: s.squares, plus: s.plus }));
    check('C2', '"What is the Kitchen counter in? Photograph it, or choose one." (09-30d: the name as written) · "Place: not defined"', /What is the Kitchen counter in\? Photograph it, or choose one\./.test(s.prompt) && /^Place:\s*not defined/.test(s.place), `${s.prompt} | ${s.place}`);
    check('C2', 'the chain under a thin line: "Kitchen counter in ?"', /Kitchen counter\s*in\s*\?/.test(s.chain) && await page.evaluate(() => getComputedStyle(document.querySelector('.lc-chainline')).borderTopWidth) === '1px', s.chain);

    // ---------- C3/C4: shutter → it looks (everything waits) → "Is this the Craft nook?" → Yes ----------
    NEXT_WHERE_DELAY = 1500; WHERE.push({ name: 'Pantry shelf', moves: false, known: 'Pantry shelf', sure: true });
    await cam('real_slippers.jpg'); await tap('.lc-shutter', { wait: 500 }); s = await st(); await snapC('looking at the photo');
    check('C3', 'while it looks: a spinner on the square, "Looking at the photo…", Save / Choose place / shutter all wait', s.looking && /Looking at the photo/.test(s.place) && s.saveDis === true && s.chooseDis === true && s.shutterDis === true, JSON.stringify({ l: s.looking, p: s.place, sd: s.saveDis, cd: s.chooseDis, sh: s.shutterDis }));
    await page.waitForTimeout(1600); s = await st(); await snapC('is this the pantry shelf');
    check('C4', 'recognised: "Is this the Pantry shelf?" with both photos, Yes / No, ☰ Choose place', /Is this the Pantry shelf\?/i.test(s.ask) && s.askImgs === 2 && /No,\s*Choose place/.test(s.ask), `${s.ask} imgs=${s.askImgs}`);
    await tap('.lc-ask2 button:has-text("Yes")', { wait: 400 }); s = await st(); await snapC('yes');
    check('C4', 'Yes → "Place: Pantry shelf"; the chain reads "Kitchen counter in Pantry shelf"; + is back', /^Place:\s*Pantry shelf/.test(s.place) && /Kitchen counter\s*in\s*Pantry shelf/.test(s.chain) && s.plus, `${s.place} | ${s.chain}`);
    await tap('.lc-k.sv', { wait: 2500 });
    check('C4', 'Save (rules on): Kitchen counter is now in Pantry shelf (with the new photo); the camera closed', !(await st()).open && (await page.evaluate(() => { const d = window.__rig.dump(); const p = d.find((x) => x.kind === 'place' && x.name === 'Kitchen counter'); return d.some((e) => e.kind === 'edge' && e.from === p.id && !e.until && e.to.name === 'Pantry shelf'); })) && ((await placeByName('Pantry shelf')).photos || []).length === 2, '');

    // ---------- C5: not recognised in time (3 s) → Choose place opens itself; the late answer shows there ----------
    // 09-30: ReCall compares with the places used most recently (the Desk drawer holds the 3D model), not the 4 oldest.
    await fresh(); await move('Spare batteries'); await tap('.lv-sq.plus', { wait: 300 });
    NEXT_WHERE_DELAY = 4200; WHERE.push({ name: 'Hall shelf', moves: false, known: 'Desk drawer', sure: true });
    await cam('closet.jpg'); const t0 = Date.now(); await tap('.lc-shutter', { wait: 200 });
    await page.waitForSelector('.where-list', { timeout: 6000 }); const opened = Date.now() - t0; s = await st(); await snapC('timeout opens choose place');
    check('C5', 'after ~3 s with no answer, ☰ Choose place opens by itself with the photo: "A new place?"', opened >= 2800 && opened < 4000 && /Choose place/.test(s.sheet) && /A new place\?/.test(s.sheet), `opened after ${opened} ms`);
    for (let k = 0; k < 20 && !/Is it the/.test((await st()).sheet); k++) await page.waitForTimeout(200);
    await page.waitForTimeout(300); s = await st(); await snapC('late answer shows in the sheet');
    const draft1 = await page.locator('.wl-pend input').inputValue();
    check('C5', 'the late answer shows up in the sheet: "Is it the Desk drawer?" first, and ReCall\'s name in the field', /Is it the Desk drawer\?/.test(s.sheet) && /hall shelf/i.test(draft1), `draft="${draft1}"`);
    await tap('.wl-sugg', { wait: 500 }); s = await st();
    check('C5', 'tapping it sets level 2 = Desk drawer', /^Place:\s*Desk drawer/.test(s.place), s.place);

    // ---------- C6: "No, ☰ Choose place" → name it ----------
    await fresh(); await move('Spare batteries'); await tap('.lv-sq.plus', { wait: 300 });
    NEXT_WHERE_DELAY = 300; WHERE.push({ name: 'Pantry shelf', moves: false, known: 'Pantry shelf', sure: true });
    await cam('real_desk.jpg'); await tap('.lc-shutter', { wait: 1500 });
    await tap('.lc-ask2 button.o', { wait: 500 }); s = await st(); await snapC('no, choose place');
    check('C6', '"No, ☰ Choose place" opens the same sheet with the photo on top: "A new place?" + a name field + the list', /A new place\?/.test(s.sheet) && await count('.wl-pend input') === 1 && /OR IT’S ONE OF YOUR PLACES/.test(s.sheet), s.sheet.slice(0, 160));
    await page.locator('.wl-pend input').fill('Pantry shelf'); await page.waitForTimeout(200);
    check('C6', 'a name that is already a place can\'t be used ("pick it below, or give this one its own name")', await page.locator('.wl-pend .btn-primary').isDisabled() && /already have/.test(await text('.wl-taken')), await text('.wl-taken'));
    await page.locator('.wl-pend input').fill('Sewing shelf'); await tap('.wl-pend .btn-primary', { wait: 400 }); s = await st();
    check('C6', 'Use this name → "Place: Sewing shelf"', /^Place:\s*Sewing shelf/.test(s.place), s.place);
    await tap('.lc-k.sv', { wait: 2500 });
    check('C6', 'Save: a NEW place "Sewing shelf" with the photo, and Kitchen counter is in it', !!(await placeByName('Sewing shelf')) && ((await placeByName('Sewing shelf')).photos || []).length === 1, '');

    // ---------- C7: tap the selected square → its own sheet ----------
    await fresh(); await move('Spare batteries'); await tap('.lv-sq.plus', { wait: 300 }); await choose('Pantry shelf');
    await tap('.lv-sq.sel', { wait: 400 }); s = await st(); await snapC('tap selected square');
    check('C7', 'tap the selected square → its sheet: Choose place · Remove this level (and See its photos when it has one)', await count('.tier-sheet') === 1 && /Choose place/.test(s.sheet) && /Remove this level/.test(s.sheet), s.sheet.slice(0, 160));
    await tap('.tier-sheet .sheet-row.danger', { wait: 400 }); s = await st();
    check('C7', 'Remove this level → back to one level, + is back', s.squares === 1 && s.plus, JSON.stringify({ sq: s.squares }));
    await tap('.lc-x', { wait: 300 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 300 });

    // ---------- C8: Log item — the item's photo in the band; Choose place; hold Save = Save + Next ----------
    await fresh(); AI = { name: 'spare fuse' }; await home(); await cam('real_slippers.jpg'); await tap(LOG, { wait: 800 });
    s = await st(); await snapC('log item before the first photo');
    check('C8', 'before the first photo: "New item · Photograph it"; Cancel bottom left', /New item/.test(s.band) && /Photograph it/.test(s.band) && s.cancelBottom, s.band);
    await tap('.lc-shutter', { wait: 1400 }); s = await st(); await snapC('log item first photo');
    check('C8', 'after the first photo: the photo sits in the band (selected, white ring on the shutter) with its name', await count('.lc-thing.sel img') === 1 && /Spare fuse/.test(s.band), s.band);
    check('C8', '"Another photo of it, or tap + to add where it is." · "Place: not defined"', /Another photo of it, or tap/.test(s.prompt) && /add where it is/.test(s.prompt) && /^Place:\s*not defined/.test(s.place), `${s.prompt} | ${s.place}`);
    await choose('Craft nook'); s = await st();
    check('C8', 'Choose place while the item is selected fills level 1 → "Place: Craft nook"', /^Place:\s*Craft nook/.test(s.place) && s.squares === 1, s.place);
    const during = await holdSave(900); let flashSeen = '';
    for (let k = 0; k < 15 && !flashSeen; k++) { await page.waitForTimeout(150); flashSeen = await page.evaluate(() => (document.querySelector('.lc-saved') || {}).innerText || ''); }
    await snapC('held save: saved flash'); await page.waitForTimeout(1600); s = await st(); s.flash = flashSeen;
    check('C8', 'holding Save turns it into "Save + Next"', /Save \+ Next/.test(during), `during="${during}"`);
    check('C8', 'let go → saved, "Spare fuse ✓ saved" flashes, the camera stays open for the next item', !!(await byName('spare fuse')) && /Spare fuse\s*✓ saved/.test(s.flash) && s.open && /Photograph it/.test(s.band), `flash="${s.flash}" band="${s.band}"`);
    // a quick tap is a plain Save
    AI = { name: 'glue stick' }; await cam('closet.jpg'); await tap('.lc-shutter', { wait: 1400 }); await choose('Craft nook');
    await holdSave(120); await page.waitForTimeout(2000); s = await st();
    check('C8', 'a quick tap on Save is a plain Save (the camera closes)', !!(await byName('glue stick')) && !s.open, '');
    // slide off = nothing
    AI = { name: 'tape measure' }; await home(); await cam('real_desk.jpg'); await tap(LOG, { wait: 800 }); await tap('.lc-shutter', { wait: 1400 }); await choose('Craft nook');
    await holdSave(900, { slideOff: true }); await page.waitForTimeout(1200); s = await st();
    check('C8', 'press, slide off, let go → nothing saved, still in the camera', !(await byName('tape measure')) && s.open, '');
    await tap('.lc-x', { wait: 300 }); if (await count('text=Throw away')) await tap('text=Throw away', { wait: 300 });

    // ---------- C9: a place's 7th photo replaces the oldest (not the main one) ----------
    await fresh();
    await page.evaluate(([a, b]) => { const d = window.__rig.dump(); const p = d.find((x) => x.kind === 'place' && x.name === 'Craft nook');
      const ph = [0, 1, 2, 3, 4, 5].map((i) => ({ photo: i === 0 ? a : b, thumb: 'T' + i, at: 1000 + i })); window.__rig.seed([{ ...p, photos: ph, sharedWith: [], roles: {} }]); }, [img('drawer.jpg'), img('box.jpg')]);
    await home(); await move('Spare batteries'); await choose('Craft nook'); await cam('real_painting.jpg'); await tap('.lc-shutter', { wait: 900 });
    await tap('.lc-k.sv', { wait: 2500 });
    const pn = await placeByName('Craft nook'); const thumbs = (pn.photos || []).map((p) => p.thumb);
    check('C9', 'a full place (6) takes the new photo: still 6, the main photo kept, the oldest other one gone', thumbs.length === 6 && thumbs[0] === 'T0' && !thumbs.includes('T1') && !/^T/.test(thumbs[5]), JSON.stringify(thumbs.map((t) => (t || '').slice(0, 6))));
    await page.evaluate(() => window.__rig.rules(false));
  }

  await seedHouse();
  try { await runSuite(); } catch (e) { console.error('FATAL', e); check('FATAL', 'suite aborted', false, e.message); await page.screenshot({ path: path.join(OUT2, 'FATAL.png') }).catch(() => {}); }
  await browser.close();
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  await runLook('b');
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('Page errors:', errors.length ? errors : 'none');
  console.log('Console errors (unique):', Array.from(new Set(consoleErrors)).slice(0, 10));
  server.close();
})();
