// ow1 / t2: ReCall's guess for a NEW place (ruling 6) and where photos go (ruling 5).
const { start } = require('./lib.js');
(async () => {
  const H = await start({ port: Number(process.env.PORT || 8473) });
  const { page, W, check, info, step, S } = H;
  await H.seed();
  const reset = (g, d = 250) => { S.GUESS = g; S.GUESS_DELAY = d; S.guessCalls = []; S.guessImgs = []; S.guessQueue = []; };
  const fast = async (n, w = 480) => { for (let i = 0; i < n; i++) await H.tap('.lc-shutter', w); };

  await step('G1', 'burst of 6', async () => {
    reset({ name: 'Pantry shelf', merged: 'Pantry shelf' });
    await H.openMove('wallet'); await H.typeWhere('pantry'); await H.done(); await H.cam('closet.jpg');
    await fast(6); await W(2500);
    check('G1', '6 quick photos: ONE guess, sent the latest 4', S.guessCalls.length === 1 && S.guessImgs[0] === 4, JSON.stringify(S.guessImgs));
    const shutterOff = await page.locator('.lc-shutter').isDisabled(); info('G1b', 'shutter disabled after 6 place photos: ' + shutterOff + ' strip: ' + (await H.txt('.ow-to')).replace(/\n/g, ' '));
    // box never changes under her finger: more photos do not re-ask
    const box0 = await H.txt('.ow-ai');
    await H.leave();
  });
  await step('G2', 'box up; more photos never re-ask', async () => {
    reset({ name: 'Pantry shelf', merged: 'Pantry with a shelf' });
    await H.openMove('wallet'); await H.typeWhere('pantry'); await H.done(); await H.shoot('closet.jpg'); await W(2200);
    const box0 = await H.txt('.ow-ai'); S.GUESS = { name: 'Something else', merged: 'Pantry else' };
    await H.shoot('soda.jpg'); await H.shoot('soda.jpg'); await W(2500);
    const box1 = await H.txt('.ow-ai');
    check('G2', 'while the box is up, more photos do not re-ask and the box does not change', S.guessCalls.length === 1 && box0 === box1 && !(await H.has('.ow-looking')), JSON.stringify({ calls: S.guessCalls.length, box0, box1 }));
    await H.leave();
  });
  await step('G3', 'Cancel mid-guess, then Keep going', async () => {
    reset({ name: 'Pantry shelf', merged: 'Pantry shelf' }, 1500);
    await H.openMove('wallet'); await H.typeWhere('pantry'); await H.done(); await H.shoot('closet.jpg', 300);
    const lookingBefore = await H.has('.ow-looking');
    await H.tap('.lc-x', 300); const sheet = await H.has('text=Keep going'); await H.tap('text=Keep going', 300);
    await W(3500);
    check('G3', 'Cancel stops the look; after "Keep going" no guess box arrives', lookingBefore && sheet && !(await H.has('.ow-ai')) && !(await H.has('.ow-looking')) && S.guessCalls.length === 0, JSON.stringify({ lookingBefore, sheet, calls: S.guessCalls.length, box: await H.txt('.ow-ai') }));
    await H.leave();
  });
  await step('G3b', 'Cancel AFTER the ask went out, then Keep going', async () => {
    reset({ name: 'Pantry shelf', merged: 'Pantry shelf' }, 2500);
    await H.openMove('wallet'); await H.typeWhere('pantry'); await H.done(); await H.shoot('closet.jpg', 300);
    await W(1800); const asked = S.guessCalls.length;
    await H.tap('.lc-x', 300); await H.tap('text=Keep going', 300); await W(3500);
    check('G3b', 'a late answer after Cancel→Keep going is dropped', asked === 1 && !(await H.has('.ow-ai')), JSON.stringify({ asked, box: await H.txt('.ow-ai') }));
    await H.leave();
  });
  await step('G4', 'Save during looking', async () => {
    reset({ name: 'Linen closet shelf', merged: 'Pantry linen shelf' }, 1500);
    await H.openMove('wallet'); await H.typeWhere('pantry'); await H.done(); await H.shoot('closet.jpg', 300);
    const t0 = Date.now(); await H.tap('.lc-k.sv', 100); await page.waitForSelector('.thing-page'); const dt = Date.now() - t0; await W(2500);
    const pl = await H.placeBy('Pantry'); const e = await H.edgeOf('wal');
    check('G4', 'Save during "looking" saves at once, with the photo, to the typed name', dt < 1500 && pl && pl.photos.length === 1 && e.to.name === 'Pantry' && !(await H.placeBy('Pantry linen shelf')), JSON.stringify({ dt, n: pl && pl.photos.length, to: e && e.to }));
  });
  await step('G5', 'a guess answer after the field changed', async () => {
    reset({ name: 'Old guess', merged: 'Attic old guess' }, 2500);
    await H.openMove('wallet'); await H.typeWhere('attic'); await H.done(); await H.shoot('box.jpg', 300); await W(1800);
    const asked = S.guessCalls.length;
    // change the field via → pick (not typing)
    await H.tap('.ow-go', 500); await page.locator('.ow-sheet .ow-pick', { hasText: 'Garage' }).first().click(); await W(300);
    await W(2500);
    check('G5', 'answer arriving after she picked another place is dropped; field keeps Garage', asked === 1 && (await H.val()) === 'Garage' && !(await H.has('.ow-ai')), JSON.stringify({ asked, v: await H.val(), box: await H.txt('.ow-ai') }));
    await H.leave();
  });
  await step('G6', 'blank field; she taps in (not typing) while the answer arrives', async () => {
    reset({ name: 'Hall table', merged: 'Hall table' }, 1200);
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await H.done();
    await H.shoot('real_painting.jpg', 300); await W(1700); // asked
    await page.locator('.ow-input').click(); await W(1500); // in the field, typing nothing, answer arrives
    const v = await H.val(); const box = await H.txt('.ow-ai');
    check('G6', 'focused field: the guess does not fill it (shows a box instead)', v === '' && /Hall table/.test(box), JSON.stringify({ v, box }));
    await page.locator('.ow-input').press('Enter'); await W(300);
    info('G6b', 'after blur: field=' + (await H.val()) + ' box=' + (await H.txt('.ow-ai')).replace(/\n/g, ' / '));
    await H.leave();
  });
  await step('G7', 'blank field guess = an item name', async () => {
    reset({ name: 'keys', merged: 'keys' });
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await H.done();
    await H.shoot('keys.jpg'); await W(2300);
    const v = await H.val(); const off = await H.saveOff(); const card = (await H.txt('.lc-card')).replace(/\n/g, ' / ');
    info('G7', JSON.stringify({ v, off, card, field: await page.locator('.ow-field').getAttribute('class') }));
    check('G7', 'a guess that is one of her items is not put in the field as a place (or, if it is, a reason shows)', v !== 'Keys' || /one of your items/.test(card), JSON.stringify({ v, off, card }));
    await H.leave();
  });
  await step('G8', 'blank field guess = this item itself', async () => {
    reset({ name: 'Wallet', merged: 'Wallet' });
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await H.done();
    await H.shoot('wallet.jpg'); await W(2300);
    const v = await H.val(); const off = await H.saveOff(); const card = (await H.txt('.lc-card')).replace(/\n/g, ' / ');
    check('G8', 'a guess naming the item itself never fills its own where silently', v !== 'Wallet' || /itself/.test(card), JSON.stringify({ v, off, card }));
    await H.snap('g8-self-guess.png');
    await H.leave();
  });
  await step('G9', 'Not this on a filled guess, then type a name: fresh guess', async () => {
    reset({ name: 'Hall table', merged: 'Hall table' });
    await H.openMove('wallet'); await page.locator('.ow-input').click(); await page.locator('.ow-input').fill(''); await H.done();
    await H.shoot('real_painting.jpg'); await W(2200); await H.tap('.ow-ai-no', 300);
    await H.shoot('real_painting.jpg'); await W(2200); const c1 = S.guessCalls.length;
    await H.typeWhere('hallway'); await H.done(); S.GUESS = { name: 'Hall table', merged: 'Hallway table' };
    await H.shoot('real_painting.jpg'); await W(2300);
    check('G9', 'after Not this on blank: no more blank guesses; a typed name gets one on its next photo, told "Hallway"', c1 === 1 && S.guessCalls.length === 2 && S.guessCalls[1] === 'Hallway' && /Hallway table/.test(await H.txt('.ow-ai')), JSON.stringify({ c1, calls: S.guessCalls, box: await H.txt('.ow-ai') }));
    info('G9b', 'images sent with the Hallway guess (2 of them were taken for the blank place): ' + S.guessImgs[1]);
    await H.leave();
  });
  await step('G10', 'Append that repeats what she typed', async () => {
    reset({ name: 'Bench with a laptop', merged: 'Bench by the window bench with a laptop' });
    await H.openMove('wallet'); await H.typeWhere('bench by the window'); await H.done(); await H.shoot('real_desk.jpg'); await W(2200);
    const box = (await H.txt('.ow-ai')).replace(/\n/g, ' / ');
    check('G10', 'Append never repeats what she typed (service answer "Bench by the window bench with a laptop")', !/bench.*bench/i.test(box.split('Append gives')[1] || ''), box);
    await H.leave();
  });
  await step('G10b', 'Append with no merged from the service', async () => {
    reset({ name: 'Lab bench with a laptop', merged: '' });
    await H.openMove('wallet'); await H.typeWhere('lab desk'); await H.done(); await H.shoot('real_desk.jpg'); await W(2200);
    const box = (await H.txt('.ow-ai')).replace(/\n/g, ' / ');
    info('G10b', box);
    await H.tap('.ow-ai-add', 300); info('G10c', 'field after Append: ' + (await H.val()));
    await H.leave();
  });
  await step('G11', 'existing place, other case: no look', async () => {
    reset({ name: 'X', merged: 'X' });
    await H.openMove('wallet'); await H.typeWhere('GARAGE'); await H.done(); await H.shoot('tooldrawer.jpg', 300);
    const l = await H.has('.ow-looking'); await W(2000);
    check('G11', '"GARAGE": no looking, no ask', !l && S.guessCalls.length === 0);
    await H.typeWhere('blue tin'); await H.done(); await H.shoot('tin.jpg', 300); const l2 = await H.has('.ow-looking'); await W(2000);
    check('G11b', 'a box: no looking, no ask', !l2 && S.guessCalls.length === 0);
    await H.leave();
  });
  await step('G12', 'Log: switching the photo target mid-burst', async () => {
    reset({ name: 'Craft table', merged: 'Studio craft table' }, 250);
    await H.home(); S.AI = { name: 'stapler' }; await H.tap(H.LOG, 900); await H.shoot('real_pencil.jpg');
    await H.typeWhere('studio'); await H.done(); await H.cam('closet.jpg'); await fast(2, 480);
    await H.tap('.ow-to-item', 200); const lookAfterSwitch = await H.has('.ow-looking');
    await H.cam('real_pencil.jpg'); await fast(1, 480); await W(2200);
    const c1 = S.guessCalls.length;
    await H.tap('.ow-to-where', 200); await H.cam('closet.jpg'); await fast(1, 480); await W(2300);
    check('G12', 'switching to the item cancels the look; item photos ask nothing; back on the place, one guess for its 3 photos', !lookAfterSwitch && c1 === 0 && S.guessCalls.length === 1 && S.guessImgs[0] === 3, JSON.stringify({ lookAfterSwitch, c1, calls: S.guessCalls, imgs: S.guessImgs }));
    await H.tap('.ow-ai-no', 300);
    await H.save();
    const it = await H.byName('stapler'); const pl = await H.placeBy('Studio');
    check('G12s', 'saved: stapler has 2 photos (its own), Studio has 3', it && it.photoCount === 2 && pl && pl.photos.length === 3, JSON.stringify({ pc: it && it.photoCount, pl: pl && pl.photos.length }));
  });
  await step('G13', 'Log: Save+Next while looking; next item keeps the where and gets no late box', async () => {
    reset({ name: 'Workshop bench', merged: 'Workshop bench' }, 1500);
    await H.home(); S.AI = { name: 'tape measure' }; await H.tap(H.LOG, 900); await H.shoot('real_pencil.jpg');
    await H.typeWhere('workshop'); await H.done(); await H.shoot('tooldrawer.jpg', 300);
    await H.holdSave(750); await W(2500);
    const v = await H.val().catch(() => 'NOFIELD'); const lc = await H.has('.lc'); const box = await H.has('.ow-ai');
    info('G13', JSON.stringify({ cameraOpen: lc, field: v, head: await H.head(), box, strip: (await H.txt('.ow-to')).replace(/\n/g, ' '), title: await H.txt('.lc-title') }));
    S.AI = { name: 'pliers' }; await H.shoot('scissors.jpg');
    const v2 = await H.val(); const strip2 = (await H.txt('.ow-to')).replace(/\n/g, ' '); const head2 = await H.head();
    info('G13b', JSON.stringify({ field: v2, head: head2, strip: strip2 }));
    check('G13', 'Save + Next: the next item starts with the same where (Workshop), no late guess box', v2 === 'Workshop' && !box, JSON.stringify({ v2, box }));
    await H.shoot('tooldrawer.jpg');
    const strip3 = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    info('G13c', 'after 2nd photo of the next item, strip: ' + strip3);
    await H.save();
    const d = await H.dump(); const ws = d.filter((x) => x.kind === 'place' && /workshop/i.test(x.name));
    const tm = await H.byName('tape measure'); const pl = await H.byName('pliers');
    check('G13s', 'one Workshop place; both items in it', ws.length === 1 && tm && pl && (await H.edgeOf(tm.id)).to.name === 'Workshop' && (await H.edgeOf(pl.id)).to.name === 'Workshop', JSON.stringify({ ws: ws.map((p) => [p.id, p.photos.length]), tm: tm && (await H.edgeOf(tm.id)), pl: pl && (await H.edgeOf(pl.id)), plPC: pl && pl.photoCount }));
  });
  await step('G14', 'Log: first photo always the item even if a place is preset? strip "the place"', async () => {
    reset({ name: 'Bookshelf', merged: 'Bookshelf' });
    await H.home(); S.AI = { name: 'novel' }; await H.tap(H.LOG, 900); await H.shoot('book.jpg');
    await H.tap('.ow-to-where', 300); // "the place" (blank)
    const head = await H.head(); const strip = (await H.txt('.ow-to')).replace(/\n/g, ' ');
    await H.shoot('closet.jpg'); await W(2300);
    const v = await H.val();
    check('G14', 'Log: tapping "the place" then photographing: the guess fills the empty field', v === 'Bookshelf', JSON.stringify({ head, strip, v }));
    await H.save(); const it = await H.byName('novel'); const pl = await H.placeBy('Bookshelf');
    check('G14s', 'saved: novel in Bookshelf (1 photo), cover = the book', it && pl && pl.photos.length === 1 && it.photoCount === 1 && (await H.edgeOf(it.id)).to.name === 'Bookshelf', JSON.stringify({ it: !!it, pl: pl && pl.photos.length }));
  });
  await H.finish('t2');
})().catch((e) => { console.error(e); process.exit(1); });
